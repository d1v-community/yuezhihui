import type { LoaderFunctionArgs } from "@remix-run/node";
import { requireUser } from "~/utils/auth.server";
import {
  getLatestOnboardingV2Session,
  getOnboardingV2Answers,
  resolveCurrentQuestionIdV2,
  setOnboardingV2Position,
} from "~/services/onboardingV2.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  const session = await getLatestOnboardingV2Session(user.id);
  if (!session) {
    return Response.json({ success: true, session: null, answers: {} }, { status: 200 });
  }

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

