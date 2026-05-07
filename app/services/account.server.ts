import { and, eq, isNull } from "drizzle-orm";
import { db } from "~/db/db.server";
import { users, verificationCodes } from "~/db/schema";

export async function deleteUserAccount(userId: string) {
  const existing = await db
    .select({
      id: users.id,
      email: users.email,
    })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  const user = existing[0];
  if (!user) {
    throw new Error("用户不存在");
  }

  if (user.email) {
    await db.delete(verificationCodes).where(eq(verificationCodes.email, user.email));
  }

  await db
    .update(users)
    .set({
      deletedAt: new Date(),
      deletionReason: "user_requested",
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, userId), isNull(users.deletedAt)));

  return {
    deletedUserId: user.id,
    deletedEmail: user.email ?? null,
  };
}
