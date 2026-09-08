import "server-only";
import { auth } from "@/auth";
import type { Role } from "@/generated/prisma/client";

/**
 * The authoritative authorization layer — per docs/ARCHITECTURE.md §Authentication &
 * Authorization: "the authoritative check is always in the service layer, never trust
 * middleware alone for data-level authorization." Every service-layer function that
 * mutates or reads role-restricted data calls one of these, regardless of what
 * src/proxy.ts already checked.
 */

export class UnauthorizedError extends Error {
  constructor(message = "Not authenticated") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Not permitted") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new UnauthorizedError();
  }
  return session;
}

/** Throws unless the current user's role is one of `allowed`. Returns the session. */
export async function requireRole(allowed: Role[]) {
  const session = await requireSession();
  if (!allowed.includes(session.user.role)) {
    throw new ForbiddenError(
      `Role ${session.user.role} is not permitted to perform this action`
    );
  }
  return session;
}

/** CEO and ADMIN implicitly see every project — docs/DATA_MODEL.md §1 ProjectAssignment. */
export function hasGlobalProjectVisibility(role: Role) {
  return role === "CEO" || role === "ADMIN";
}
