import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { and, asc, eq } from "drizzle-orm";
import { db } from "~/db/db.server";
import { menstrualDaily, menstrualEvent } from "~/db/schema";
import { requireUser } from "~/utils/auth.server";
import { fail, ok } from "~/utils/apiResponse.server";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date 格式应为 YYYY-MM-DD");

const eventSchema = z.object({
  eventTime: z.string().min(1),
  eventType: z.enum(["pad", "tampon", "symptom"]),
  productType: z.string().max(32).optional(),
  brand: z.string().max(64).optional(),
  series: z.string().max(64).optional(),
  lengthMm: z.number().int().positive().max(1000).optional(),
  model: z.string().max(32).optional(),
  absorbency: z.string().max(32).optional(),
  color: z.enum(["pink", "red", "rust", "dark", "brown"]).optional(),
  volumeMl: z.number().nonnegative().max(1000).optional(),
  symptomName: z.string().max(32).optional(),
});

const putSchema = z.object({
  hasBleeding: z.boolean(),
  events: z.array(eventSchema).default([]),
});

function parseIso(input: string): Date {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) {
    throw new Error("eventTime 非法");
  }
  return d;
}

function toIso(dt: unknown): string {
  const d = dt instanceof Date ? dt : new Date(String(dt));
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const user = await requireUser(request);
    const recordDate = dateSchema.parse(params.date);

    const dailyRows = await db
      .select({
        hasBleeding: menstrualDaily.hasBleeding,
        totalVolumeMl: menstrualDaily.totalVolumeMl,
        dayColor: menstrualDaily.dayColor,
        clotSmallCount: menstrualDaily.clotSmallCount,
        clotLargeCount: menstrualDaily.clotLargeCount,
      })
      .from(menstrualDaily)
      .where(and(eq(menstrualDaily.userId, user.id), eq(menstrualDaily.recordDate, recordDate as any)))
      .limit(1);

    const eventRows = await db
      .select({
        id: menstrualEvent.id,
        eventTime: menstrualEvent.eventTime,
        eventType: menstrualEvent.eventType,
        volumeMl: menstrualEvent.volumeMl,
        color: menstrualEvent.color,
        productType: menstrualEvent.productType,
        brand: menstrualEvent.brand,
        series: menstrualEvent.series,
        lengthMm: menstrualEvent.lengthMm,
        model: menstrualEvent.model,
        absorbency: menstrualEvent.absorbency,
        symptomName: menstrualEvent.symptomName,
      })
      .from(menstrualEvent)
      .where(and(eq(menstrualEvent.userId, user.id), eq(menstrualEvent.recordDate, recordDate as any)))
      .orderBy(asc(menstrualEvent.eventTime), asc(menstrualEvent.id));

    if (dailyRows.length === 0) {
      return Response.json(
        ok({
          date: recordDate,
          hasBleeding: false,
          totalVolumeMl: 0,
          dayColor: null,
          clotCounts: { small: 0, large: 0 },
          events: [],
        }),
        { status: 200 },
      );
    }

    const d = dailyRows[0];
    return Response.json(
      ok({
        date: recordDate,
        hasBleeding: Boolean(d.hasBleeding),
        totalVolumeMl: Number(d.totalVolumeMl ?? 0),
        dayColor: (d.dayColor as any) ?? null,
        clotCounts: { small: Number(d.clotSmallCount ?? 0), large: Number(d.clotLargeCount ?? 0) },
        events: eventRows.map((e) => ({
          id: Number(e.id),
          eventTime: toIso(e.eventTime),
          eventType: e.eventType,
          productType: e.productType ?? null,
          brand: e.brand ?? null,
          series: e.series ?? null,
          lengthMm: e.lengthMm ?? null,
          model: e.model ?? null,
          absorbency: e.absorbency ?? null,
          color: e.color ?? null,
          volumeMl: Number(e.volumeMl ?? 0),
          symptomName: e.symptomName ?? null,
        })),
      }),
      { status: 200 },
    );
  } catch (e: any) {
    if (e?.status === 401) {
      return Response.json(fail("登录已过期，请重新登录", 401), { status: 401 });
    }
    const msg = e?.message || "获取当日记录失败";
    const status = msg.includes("date 格式") ? 400 : 500;
    return Response.json(fail(msg, status), { status });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "PUT") {
    return Response.json(fail("Method Not Allowed", 405), { status: 405 });
  }

  try {
    const user = await requireUser(request);
    const recordDate = dateSchema.parse(params.date);
    const body = putSchema.parse(await request.json());

    const events = body.events.map((e) => ({
      ...e,
      eventTimeDt: parseIso(e.eventTime),
      volumeMl: e.volumeMl ?? 0,
    }));

    const colorVolume = new Map<string, number>();
    let totalVolumeMl = 0;
    let clotSmallCount = 0;
    let clotLargeCount = 0;
    const CLOT_SMALL_ML = 3;
    const CLOT_LARGE_ML = 6;

    for (const e of events) {
      if (e.eventType === "pad" || e.eventType === "tampon") {
        totalVolumeMl += e.volumeMl;
        if (e.color) {
          colorVolume.set(e.color, (colorVolume.get(e.color) ?? 0) + e.volumeMl);
        }
      } else if (e.eventType === "symptom") {
        // UI/estimation: treat clot markers as a small additional volume signal.
        if (e.symptomName === "小血块") {
          clotSmallCount += 1;
          totalVolumeMl += CLOT_SMALL_ML;
        }
        if (e.symptomName === "大血块") {
          clotLargeCount += 1;
          totalVolumeMl += CLOT_LARGE_ML;
        }
      }
    }

    const colorPriority = ["pink", "red", "rust", "dark", "brown"];
    let dayColor: string | null = null;
    let maxVolume = -1;
    for (const color of colorPriority) {
      const v = colorVolume.get(color) ?? 0;
      if (v > maxVolume) {
        maxVolume = v;
        dayColor = v > 0 ? color : null;
      }
    }

    // Best-effort "transaction": use db.transaction if available; otherwise fallback to sequential writes.
    const doWrite = async (tx: typeof db) => {
      await tx
        .delete(menstrualEvent)
        .where(and(eq(menstrualEvent.userId, user.id), eq(menstrualEvent.recordDate, recordDate as any)));

      if (events.length > 0) {
        await tx.insert(menstrualEvent).values(
          events.map((e) => ({
            userId: user.id,
            recordDate: recordDate as any,
            eventTime: e.eventTimeDt,
            eventType: e.eventType,
            volumeMl: Math.round(e.volumeMl),
            color: e.color ?? null,
            productType: e.productType ?? null,
            brand: e.brand ?? null,
            series: e.series ?? null,
            lengthMm: e.lengthMm ?? null,
            model: e.model ?? null,
            absorbency: e.absorbency ?? null,
            symptomName: e.symptomName ?? null,
          })),
        );
      }

      // Upsert daily summary
      await tx
        .insert(menstrualDaily)
        .values({
          userId: user.id,
          recordDate: recordDate as any,
          hasBleeding: body.hasBleeding,
          totalVolumeMl: Math.round(totalVolumeMl),
          dayColor,
          clotSmallCount,
          clotLargeCount,
          updatedAt: new Date(),
        } as any)
        .onConflictDoUpdate({
          target: [menstrualDaily.userId, menstrualDaily.recordDate],
          set: {
            hasBleeding: body.hasBleeding,
            totalVolumeMl: Math.round(totalVolumeMl),
            dayColor,
            clotSmallCount,
            clotLargeCount,
            updatedAt: new Date(),
          } as any,
        });
    };

    // neon-http may expose `transaction()` but not actually support it in some environments.
    // Fall back to sequential writes if transaction is unavailable or throws.
    const tryTx = typeof (db as any).transaction === "function";
    if (tryTx) {
      try {
        await (db as any).transaction(async (tx: any) => {
          await doWrite(tx);
        });
      } catch {
        await doWrite(db);
      }
    } else {
      await doWrite(db);
    }

    return Response.json(ok({ date: recordDate }), { status: 200 });
  } catch (e: any) {
    if (e?.status === 401) {
      return Response.json(fail("登录已过期，请重新登录", 401), { status: 401 });
    }
    const msg = e?.message || "保存当日记录失败";
    const status = msg.includes("date 格式") || msg.includes("eventTime 非法") ? 400 : 500;
    return Response.json(fail(msg, status), { status });
  }
}
