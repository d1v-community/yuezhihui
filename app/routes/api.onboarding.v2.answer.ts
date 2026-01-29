import type { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { requireUser } from "~/utils/auth.server";
import {
  getOrCreateOnboardingV2Session,
  getOnboardingV2Answers,
  getNextVisibleQuestionIdV2,
  isOnboardingV2QuestionId,
  isQuestionVisibleV2,
  setOnboardingV2Position,
  upsertOnboardingV2Answer,
  type OnboardingV2AnswerPayload,
  type OnboardingV2QuestionId,
} from "~/services/onboardingV2.server";

const answerPayloadSchema: z.ZodType<OnboardingV2AnswerPayload> = z.union([
  z.object({ type: z.literal("single"), value: z.string() }),
  z.object({ type: z.literal("multi"), values: z.array(z.string()) }),
  z.object({
    type: z.literal("number"),
    value: z.number().nullable(),
    meta: z.object({ unknown: z.boolean().optional(), no_answer: z.boolean().optional() }).optional(),
  }),
  z.object({
    type: z.literal("date"),
    value: z.string().nullable(),
    meta: z.object({ unknown: z.boolean().optional(), no_answer: z.boolean().optional() }).optional(),
  }),
  z.object({
    type: z.literal("text"),
    value: z.string().nullable(),
    meta: z.object({ unknown: z.boolean().optional(), no_answer: z.boolean().optional() }).optional(),
  }),
  z.object({ type: z.literal("object"), value: z.record(z.unknown()) }),
]);

const requestSchema = z.object({
  questionId: z.string(),
  answer: answerPayloadSchema,
});

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);

  const body = await request.json();
  const { questionId, answer } = requestSchema.parse(body);

  if (!isOnboardingV2QuestionId(questionId)) {
    return Response.json({ success: false, error: "Unknown questionId" }, { status: 400 });
  }

  const session = await getOrCreateOnboardingV2Session(user.id);
  const answers = await getOnboardingV2Answers(session.id);

  // Basic guard: don't accept answers for questions that aren't currently visible under jump logic.
  if (!isQuestionVisibleV2(questionId, answers)) {
    return Response.json(
      { success: false, error: "Question is not visible for current answers (jump logic)" },
      { status: 409 }
    );
  }

  await upsertOnboardingV2Answer(session.id, questionId, answer);

  const nextAnswers = { ...answers, [questionId]: answer } as any;
  const nextQuestionId = getNextVisibleQuestionIdV2(questionId, nextAnswers);

  await setOnboardingV2Position(session.id, nextQuestionId as OnboardingV2QuestionId | null);

  return Response.json(
    {
      success: true,
      sessionId: session.id,
      nextQuestionId,
    },
    { status: 200 }
  );
}

