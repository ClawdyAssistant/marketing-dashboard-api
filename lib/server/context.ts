import { prisma } from '@/lib/prisma';
import { type NextRequest } from 'next/server';

export async function createContext(req?: NextRequest) {
  // TODO: Get user from session/JWT token
  // For now, return basic context
  return {
    prisma,
    user: null, // Will be populated from auth middleware
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
