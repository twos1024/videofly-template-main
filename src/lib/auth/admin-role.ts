import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { env } from "./env.mjs";

interface AdminCandidate {
  id: string;
  email?: string | null;
  isAdmin?: boolean | null;
}

const normalizeEmail = (email?: string | null): string | null => {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
};

/**
 * Resolve admin status against the latest DB state.
 * If ADMIN_EMAIL matches the current user email, grant admin automatically.
 */
export async function resolveAdminStatus(user: AdminCandidate): Promise<boolean> {
  let isAdmin = !!user.isAdmin;

  const adminEmail = normalizeEmail(env.ADMIN_EMAIL);
  const userEmail = normalizeEmail(user.email);

  if (!isAdmin && adminEmail && userEmail === adminEmail) {
    await db
      .update(users)
      .set({ isAdmin: true })
      .where(eq(users.id, user.id));

    console.log(`✅ Auto-set admin for: ${user.email}`);
    isAdmin = true;
  }

  if (!isAdmin) {
    const [dbUser] = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    isAdmin = !!dbUser?.isAdmin;
  }

  return isAdmin;
}
