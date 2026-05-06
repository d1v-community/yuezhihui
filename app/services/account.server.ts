import { and, eq } from "drizzle-orm";
import { db } from "~/db/db.server";
import { users, verificationCodes } from "~/db/schema";

export async function deleteUserAccount(userId: string) {
  const existing = await db
    .select({
      id: users.id,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = existing[0];
  if (!user) {
    throw new Error("用户不存在");
  }

  if (user.email) {
    await db.delete(verificationCodes).where(eq(verificationCodes.email, user.email));
  }

  await db.delete(users).where(and(eq(users.id, userId)));

  return {
    deletedUserId: user.id,
    deletedEmail: user.email ?? null,
  };
}
