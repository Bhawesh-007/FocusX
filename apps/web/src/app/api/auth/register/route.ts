import bcrypt from 'bcryptjs';
import { prisma } from '@focus/db';
import { registerSchema } from '@focus/core';
import { handleRouteError, ok } from '@/server/http';
import { Errors } from '@/server/errors';

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === 'P2002'
  );
}

/** POST /api/auth/register — create a new account (public). */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.validation(parsed.error.issues[0]?.message ?? 'Invalid details.');
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw Errors.emailInUse();

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    let user;
    try {
      user = await prisma.user.create({
        data: {
          email,
          name: parsed.data.name,
          passwordHash,
          timezone: parsed.data.timezone ?? 'UTC',
        },
      });
    } catch (err) {
      // Unique constraint lost a race: another signup created this email first.
      if (isUniqueConstraintError(err)) throw Errors.emailInUse();
      throw err;
    }

    return ok({ id: user.id, email: user.email, name: user.name }, 201);
  } catch (err) {
    return handleRouteError(err);
  }
}
