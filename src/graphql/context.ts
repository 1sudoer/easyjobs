import { YogaInitialContext } from 'graphql-yoga'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import { ensureUserWorkspace } from '@/lib/auth/provision'

export type GraphQLContext = {
  prisma: typeof prisma
  userId: string | null
  isWebhook: boolean
}

export async function createContext(initialContext: YogaInitialContext): Promise<GraphQLContext> {
  const authHeader = initialContext.request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const isWebhook =
    !!token && !!process.env.CV_WEBHOOK_SECRET && token === process.env.CV_WEBHOOK_SECRET

  // Webhook callers carry no Clerk session, and this route is public in the
  // middleware so that they can reach it. Only resolve a session for the
  // non-webhook case.
  let userId: string | null = null
  if (!isWebhook) {
    const { userId: clerkUserId } = await auth()
    userId = clerkUserId ?? null
    if (userId) {
      await ensureUserWorkspace(userId)
    }
  }

  return {
    prisma,
    userId,
    isWebhook,
  }
}

export function requireAuth(userId: string | null): string {
  if (!userId) throw new Error('Not authenticated')
  return userId
}
