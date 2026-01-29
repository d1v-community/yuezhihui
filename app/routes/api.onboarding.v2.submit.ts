import type { ActionFunctionArgs } from "@remix-run/node";
import { requireUser } from "~/utils/auth.server";
import {
  completeOnboardingV2Session,
  getOrCreateOnboardingV2Session,
  getOnboardingV2Answers,
} from "~/services/onboardingV2.server";

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);

  const session = await getOrCreateOnboardingV2Session(user.id);
  const answers = await getOnboardingV2Answers(session.id);

  // We currently allow submitting even if some optional questions are unanswered.
  // Required enforcement is expected to be handled by the client UX.
  await completeOnboardingV2Session(session.id);

  return Response.json(
    {
      success: true,
      sessionId: session.id,
      status: "completed",
      answersCount: Object.keys(answers).length,
    },
    { status: 200 }
  );
}

