import { GraphQLContext, requireAuth } from '../context'

export const jobProfileResolvers = {
  Query: {
    jobProfiles: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx.userId)
      return ctx.prisma.jobProfile.findMany({
        where: { userId },
        include: { _count: { select: { applications: true, resumes: true } } },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      })
    },

    jobProfile: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx.userId)
      return ctx.prisma.jobProfile.findFirst({
        where: { id: args.id, userId },
        include: { _count: { select: { applications: true, resumes: true } } },
      })
    },

    profileResumeDrafts: async (_: unknown, args: { profileId: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx.userId)
      const profile = await ctx.prisma.jobProfile.findFirst({ where: { id: args.profileId, userId } })
      if (!profile) throw new Error('Profile not found')
      return ctx.prisma.resume.findMany({
        where: { jobProfileId: args.profileId },
        orderBy: { createdAt: 'desc' },
      })
    },

    resumeDraft: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx.userId)
      return ctx.prisma.resume.findFirst({
        where: { id: args.id, userId },
      })
    },
  },

  Mutation: {
    createJobProfile: async (_: unknown, args: { input: any }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx.userId)
      if (args.input.isDefault) {
        await ctx.prisma.jobProfile.updateMany({ where: { userId }, data: { isDefault: false } })
      }
      return ctx.prisma.jobProfile.create({
        data: { ...args.input, userId },
        include: { _count: { select: { applications: true, resumes: true } } },
      })
    },

    updateJobProfile: async (_: unknown, args: { id: string; input: any }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx.userId)
      if (args.input.isDefault) {
        await ctx.prisma.jobProfile.updateMany({ where: { userId }, data: { isDefault: false } })
      }
      return ctx.prisma.jobProfile.update({
        where: { id: args.id, userId },
        data: args.input,
        include: { _count: { select: { applications: true, resumes: true } } },
      })
    },

    deleteJobProfile: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx.userId)
      await ctx.prisma.jobProfile.delete({ where: { id: args.id, userId } })
      return true
    },

    createProfileResumeDraft: async (
      _: unknown,
      args: { profileId: string; input: any },
      ctx: GraphQLContext,
    ) => {
      const userId = requireAuth(ctx.userId)
      const profile = await ctx.prisma.jobProfile.findFirst({ where: { id: args.profileId, userId } })
      if (!profile) throw new Error('Profile not found')
      return ctx.prisma.resume.create({
        data: {
          userId,
          jobProfileId: args.profileId,
          title: args.input.title || 'Untitled',
          summary: args.input.summary ?? null,
          contactInfo: args.input.contactInfo ?? undefined,
          skills: args.input.skills ?? [],
          experiences: args.input.experiences ?? [],
          educations: args.input.educations ?? [],
          projects: args.input.projects ?? [],
          certifications: args.input.certifications ?? [],
        },
      })
    },

    updateProfileResumeDraft: async (
      _: unknown,
      args: { id: string; input: any },
      ctx: GraphQLContext,
    ) => {
      const userId = requireAuth(ctx.userId)
      const draft = await ctx.prisma.resume.findFirst({ where: { id: args.id, userId } })
      if (!draft) throw new Error('Draft not found')
      const { title, summary, contactInfo, skills, experiences, educations, projects, certifications } =
        args.input
      return ctx.prisma.resume.update({
        where: { id: args.id },
        data: {
          ...(title !== undefined && { title }),
          ...(summary !== undefined && { summary }),
          ...(contactInfo !== undefined && { contactInfo }),
          ...(skills !== undefined && { skills }),
          ...(experiences !== undefined && { experiences }),
          ...(educations !== undefined && { educations }),
          ...(projects !== undefined && { projects }),
          ...(certifications !== undefined && { certifications }),
        },
      })
    },

    deleteProfileResumeDraft: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx.userId)
      const draft = await ctx.prisma.resume.findFirst({ where: { id: args.id, userId } })
      if (!draft) throw new Error('Draft not found')
      await ctx.prisma.resume.delete({ where: { id: args.id } })
      return true
    },
  },

  JobProfile: {
    applicationCount: (parent: any) => parent._count?.applications ?? 0,
    resumeDraftCount: (parent: any) => parent._count?.resumes ?? 0,
  },
}
