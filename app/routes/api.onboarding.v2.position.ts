import type { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { requireUser } from "~/utils/auth.server";
import {
  getOrCreateOnboardingV2Session,
  getOnboardingV2Answers,
  isOnboardingV2QuestionId,
  isQuestionVisibleV2,
  setOnboardingV2Position,
} from "~/services/onboardingV2.server";

const requestSchema = z.object({
  currentQuestionId: z.string().nullable(),
});

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);

  const body = await request.json();
  const { currentQuestionId } = requestSchema.parse(body);

  const session = await getOrCreateOnboardingV2Session(user.id);

  if (currentQuestionId === null) {
    await setOnboardingV2Position(session.id, null);
    return Response.json({ success: true, sessionId: session.id, currentQuestionId: null }, { status: 200 });
  }

  if (!isOnboardingV2QuestionId(currentQuestionId)) {
    return Response.json({ success: false, error: "Unknown currentQuestionId" }, { status: 400 });
  }

  const answers = await getOnboardingV2Answers(session.id);
  if (!isQuestionVisibleV2(currentQuestionId, answers)) {
    return Response.json(
      { success: false, error: "Question is not visible for current answers (jump logic)" },
      { status: 409 }
    );
  }

  await setOnboardingV2Position(session.id, currentQuestionId);
  return Response.json({ success: true, sessionId: session.id, currentQuestionId }, { status: 200 });
}

