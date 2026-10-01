import type { JobProfile, Prisma } from '@prisma/client'
import { GraphQLContext, requireAuth } from '../context'
import { toStoredHandle, withStoredHandles } from '@/lib/social-profiles'
import { getUserSummaries } from '@/lib/auth/user-directory'

/*
 * Job profiles are shared: every signed-in user can list, view and edit every
 * profile and its resume templates. Only a profile's creator may delete it, a
 * template may be deleted by its author or the profile's creator, and which
 * profile is "default" is each user's own choice (JobProfileDefault).
 * Applications stay private, so a profile's application count is the viewer's.
 */

/** LinkedIn and GitHub are stored as bare handles; leaves absent fields absent. */
function profileHandles(input: { linkedin?: string | null; github?: string | null }) {
  return {
    ...(input.linkedin !== undefined && { linkedin: toStoredHandle('linkedin', input.linkedin) }),
    ...(input.github !== undefined && { github: toStoredHandle('github', input.github) }),
  }
}

/** Counts shown on a profile: the viewer's own applications, and all templates. */
function profileCounts(userId: string) {
  return {
    _count: { select: { applications: { where: { userId } }, resumes: true } },
  } satisfies Prisma.JobProfileInclude
}

/** Adds what depends on the viewer: the creator's name, ownership and default. */
async function withViewerFields<P extends JobProfile>(
  ctx: GraphQLContext,
  userId: string,
  profiles: P[],
) {
  const [owners, viewerDefault] = await Promise.all([
    getUserSummaries(profiles.map((p) => p.userId)),
    ctx.prisma.jobProfileDefault.findUnique({ where: { userId } }),
  ])
  return profiles.map((profile) => ({
    ...profile,
    owner: owners.get(profile.userId),
    isOwner: profile.userId === userId,
    isDefault: viewerDefault?.jobProfileId === profile.id,
  }))
}

/** Records or clears the viewer's default; `undefined` leaves it unchanged. */
async function setViewerDefault(
  ctx: GraphQLContext,
  userId: string,
  jobProfileId: string,
  isDefault: boolean | null | undefined,
) {
  if (isDefault === undefined || isDefault === null) return
  if (isDefault) {
    await ctx.prisma.jobProfileDefault.upsert({
      where: { userId },
      create: { userId, jobProfileId },
      update: { jobProfileId },
    })
  } else {
    await ctx.prisma.jobProfileDefault.deleteMany({ where: { userId, jobProfileId } })
  }
}

/** Resume templates belong to a profile; a user's personal resumes do not. */
const isTemplate = { jobProfileId: { not: null } } satisfies Prisma.ResumeWhereInput

async function requireProfile(ctx: GraphQLContext, id: string) {
  const profile = await ctx.prisma.jobProfile.findUnique({ where: { id } })
  if (!profile) throw new Error('Profile not found')
  return profile
}

async function withCanDelete<D extends { userId: string; jobProfileId: string | null }>(
  ctx: GraphQLContext,
  userId: string,
  draft: D,
) {
  if (draft.userId === userId) return { ...draft, canDelete: true }
  const profile = draft.jobProfileId
    ? await ctx.prisma.jobProfile.findUnique({ where: { id: draft.jobProfileId } })
    : null
  return { ...draft, canDelete: profile?.userId === userId }
}

export const jobProfileResolvers = {
  Query: {
    jobProfiles: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx.userId)
      const profiles = await ctx.prisma.jobProfile.findMany({
        include: profileCounts(userId),
        orderBy: { createdAt: 'asc' },
      })
      const decorated = await withViewerFields(ctx, userId, profiles)
      // The viewer's default first, then their own profiles, then everyone else's.
      return decorated.sort(
        (a, b) => Number(b.isDefault) - Number(a.isDefault) || Number(b.isOwner) - Number(a.isOwner),
      )
    },

    jobProfile: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx.userId)
      const profile = await ctx.prisma.jobProfile.findUnique({
        where: { id: args.id },
        include: profileCounts(userId),
      })
      if (!profile) return null
      const [decorated] = await withViewerFields(ctx, userId, [profile])
      return decorated
    },

    profileResumeDrafts: async (_: unknown, args: { profileId: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx.userId)
      const profile = await requireProfile(ctx, args.profileId)
      const drafts = await ctx.prisma.resume.findMany({
        where: { jobProfileId: args.profileId },
        orderBy: { createdAt: 'desc' },
      })
      return drafts.map((draft) => ({
        ...draft,
        canDelete: draft.userId === userId || profile.userId === userId,
      }))
    },

    resumeDraft: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx.userId)
      const draft = await ctx.prisma.resume.findFirst({
        where: { id: args.id, OR: [isTemplate, { userId }] },
      })
      return draft ? withCanDelete(ctx, userId, draft) : null
    },
  },

  Mutation: {
    createJobProfile: async (_: unknown, args: { input: any }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx.userId)
      const { isDefault, ...input } = args.input
      const profile = await ctx.prisma.jobProfile.create({
        data: { ...input, ...profileHandles(input), userId },
        include: profileCounts(userId),
      })
      await setViewerDefault(ctx, userId, profile.id, isDefault)
      const [decorated] = await withViewerFields(ctx, userId, [profile])
      return decorated
    },

    updateJobProfile: async (_: unknown, args: { id: string; input: any }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx.userId)
      await requireProfile(ctx, args.id)
      const { isDefault, ...input } = args.input
      const profile = await ctx.prisma.jobProfile.update({
        where: { id: args.id },
        data: { ...input, ...profileHandles(input) },
        include: profileCounts(userId),
      })
      await setViewerDefault(ctx, userId, profile.id, isDefault)
      const [decorated] = await withViewerFields(ctx, userId, [profile])
      return decorated
    },

    deleteJobProfile: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx.userId)
      const profile = await requireProfile(ctx, args.id)
      if (profile.userId !== userId) throw new Error('Only the profile’s creator can delete it')
      await ctx.prisma.jobProfile.delete({ where: { id: args.id } })
      return true
    },

    createProfileResumeDraft: async (
      _: unknown,
      args: { profileId: string; input: any },
      ctx: GraphQLContext,
    ) => {
      const userId = requireAuth(ctx.userId)
      await requireProfile(ctx, args.profileId)
      const draft = await ctx.prisma.resume.create({
        data: {
          userId,
          jobProfileId: args.profileId,
          title: args.input.title || 'Untitled',
          summary: args.input.summary ?? null,
          contactInfo: args.input.contactInfo ? withStoredHandles(args.input.contactInfo) : undefined,
          skills: args.input.skills ?? [],
          experiences: args.input.experiences ?? [],
          educations: args.input.educations ?? [],
          projects: args.input.projects ?? [],
          certifications: args.input.certifications ?? [],
          sectionOrder: args.input.sectionOrder ?? [],
        },
      })
      return { ...draft, canDelete: true }
    },

    updateProfileResumeDraft: async (
      _: unknown,
      args: { id: string; input: any },
      ctx: GraphQLContext,
    ) => {
      const userId = requireAuth(ctx.userId)
      const existing = await ctx.prisma.resume.findFirst({
        where: { id: args.id, OR: [isTemplate, { userId }] },
      })
      if (!existing) throw new Error('Draft not found')
      const {
        title,
        summary,
        contactInfo,
        skills,
        experiences,
        educations,
        projects,
        certifications,
        sectionOrder,
      } = args.input
      const draft = await ctx.prisma.resume.update({
        where: { id: args.id },
        data: {
          ...(title !== undefined && { title }),
          ...(summary !== undefined && { summary }),
          ...(contactInfo !== undefined && {
            contactInfo: contactInfo ? withStoredHandles(contactInfo) : contactInfo,
          }),
          ...(skills !== undefined && { skills }),
          ...(experiences !== undefined && { experiences }),
          ...(educations !== undefined && { educations }),
          ...(projects !== undefined && { projects }),
          ...(certifications !== undefined && { certifications }),
          ...(sectionOrder !== undefined && { sectionOrder }),
        },
      })
      return withCanDelete(ctx, userId, draft)
    },

    deleteProfileResumeDraft: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx.userId)
      const draft = await ctx.prisma.resume.findFirst({
        where: { id: args.id, OR: [isTemplate, { userId }] },
      })
      if (!draft) throw new Error('Draft not found')
      const { canDelete } = await withCanDelete(ctx, userId, draft)
      if (!canDelete) throw new Error('Only the template’s author or the profile’s creator can delete it')
      await ctx.prisma.resume.delete({ where: { id: args.id } })
      return true
    },
  },

  // The queries above precompute the viewer fields; a profile reached another
  // way (as an application's profile, say) falls back to these.
  JobProfile: {
    applicationCount: (parent: any) => parent._count?.applications ?? 0,
    resumeDraftCount: (parent: any) => parent._count?.resumes ?? 0,
    owner: async (parent: any) =>
      parent.owner ?? (await getUserSummaries([parent.userId])).get(parent.userId),
    isOwner: (parent: any, _: unknown, ctx: GraphQLContext) =>
      parent.isOwner ?? parent.userId === ctx.userId,
    isDefault: async (parent: any, _: unknown, ctx: GraphQLContext) => {
      if (parent.isDefault !== undefined) return parent.isDefault
      if (!ctx.userId) return false
      const viewerDefault = await ctx.prisma.jobProfileDefault.findUnique({
        where: { userId: ctx.userId },
      })
      return viewerDefault?.jobProfileId === parent.id
    },
  },

  ResumeDraft: {
    canDelete: (parent: any, _: unknown, ctx: GraphQLContext) =>
      parent.canDelete ?? parent.userId === ctx.userId,
  },
}
