import type { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { requireUser } from "~/utils/auth.server";
import {
  getOrCreateOnboardingV2Session,
  getOnboardingV2Answers,
  resolveCurrentQuestionIdV2,
  setOnboardingV2Position,
} from "~/services/onboardingV2.server";

const requestSchema = z
  .object({
    // reserved for future (e.g. reset/start-new)
    reset: z.boolean().optional(),
  })
  .optional();

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);

  // We currently ignore reset to keep server-side behavior safe/idempotent.
  // If needed, we can add an explicit "create new session" endpoint later.
  requestSchema.safeParse(await request.json().catch(() => undefined));

  const session = await getOrCreateOnboardingV2Session(user.id);
  const answers = await getOnboardingV2Answers(session.id);

  const currentQuestionId =
    session.status === "completed" ? null : resolveCurrentQuestionIdV2(session.currentQuestionId, answers);

  if (session.status !== "completed" && currentQuestionId !== session.currentQuestionId) {
    await setOnboardingV2Position(session.id, currentQuestionId);
  }

  return Response.json(
    {
      success: true,
      session: {
        id: session.id,
        version: session.version,
        status: session.status,
        currentQuestionId,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        completedAt: session.completedAt,
      },
      answers,
    },
    { status: 200 }
  );
}

