import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function createContext() {
  const session = await auth();
  
  return {
    prisma,
    user: session?.user || null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
