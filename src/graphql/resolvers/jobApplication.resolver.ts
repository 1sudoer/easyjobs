import { GraphQLContext, requireAuth } from '../context'
import { enqueueGenerateCV } from '@/lib/lavinmq'

const PAGE_SIZE = 20

const APPLICATION_INCLUDE = {
  jobPost: true,
  jobProfile: true,
  resume: { select: { id: true, title: true } },
  statusHistory: { orderBy: { changedAt: 'asc' as const } },
  customQuestions: { orderBy: { sortOrder: 'asc' as const } },
}

export const jobApplicationResolvers = {
  Query: {
    jobApplications: async (
      _: unknown,
      args: { filter?: any; page?: number; limit?: number },
      ctx: GraphQLContext,
    ) => {
      const userId = requireAuth(ctx.userId)
      const page = args.page ?? 1
      const limit = args.limit ?? PAGE_SIZE
      const skip = (page - 1) * limit
      const { filter } = args

      const where: any = { userId }
      if (filter?.status) where.currentStatus = filter.status
      if (filter?.profileIds?.length) {
        where.jobProfileId = { in: filter.profileIds }
      } else if (filter?.profileId) {
        where.jobProfileId = filter.profileId
      }
      if (filter?.resumeId) where.resumeId = filter.resumeId
      if (filter?.cvReady === true) where.cvGenerationStatus = 'done'
      if (filter?.startDate) where.createdAt = { gte: new Date(filter.startDate) }
      if (filter?.search || filter?.company) {
        const jobPostFilter: any = {}
        if (filter.search) jobPostFilter.title = { contains: filter.search, mode: 'insensitive' }
        if (filter.company) jobPostFilter.postedBy = { contains: filter.company, mode: 'insensitive' }
        where.jobPost = jobPostFilter
      }

      const [items, total] = await Promise.all([
        ctx.prisma.jobApplication.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            jobPost: true,
            jobProfile: true,
            resume: { select: { id: true, title: true } },
          },
        }),
        ctx.prisma.jobApplication.count({ where }),
      ])

      return { items, total, page, totalPages: Math.ceil(total / limit) }
    },

    jobApplication: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx.userId)
      return ctx.prisma.jobApplication.findFirst({
        where: { id: args.id, userId },
        include: APPLICATION_INCLUDE,
      })
    },

    applicationInsights: async (
      _: unknown,
      args: { startDate?: string; endDate?: string },
      ctx: GraphQLContext,
    ) => {
      const userId = requireAuth(ctx.userId)
      const dateFilter: any = {}
      if (args.startDate) dateFilter.gte = new Date(args.startDate)
      if (args.endDate) dateFilter.lte = new Date(args.endDate)

      const where: any = { userId }
      if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter

      const [applications, allHistories, cvReadyCount] = await Promise.all([
        ctx.prisma.jobApplication.findMany({ where, select: { id: true, currentStatus: true } }),
        ctx.prisma.applicationStatusHistory.findMany({
          where: { application: { userId } },
          orderBy: { changedAt: 'asc' },
        }),
        ctx.prisma.jobApplication.count({ where: { userId, cvGenerationStatus: 'done' } }),
      ])

      const statusMap: Record<string, number> = {}
      for (const app of applications) {
        statusMap[app.currentStatus] = (statusMap[app.currentStatus] ?? 0) + 1
      }
      const byStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }))

      const historyByApp: Record<string, any[]> = {}
      for (const h of allHistories) {
        if (!historyByApp[h.applicationId]) historyByApp[h.applicationId] = []
        historyByApp[h.applicationId].push(h)
      }

      const transitions: Record<string, { total: number; count: number }> = {}
      for (const entries of Object.values(historyByApp)) {
        for (let i = 1; i < entries.length; i++) {
          const key = `${entries[i - 1].status}→${entries[i].status}`
          const diffDays = (entries[i].changedAt.getTime() - entries[i - 1].changedAt.getTime()) / 86400000
          if (!transitions[key]) transitions[key] = { total: 0, count: 0 }
          transitions[key].total += diffDays
          transitions[key].count++
        }
      }

      const avgDaysByStatus = Object.entries(transitions).map(([key, val]) => {
        const [fromStatus, toStatus] = key.split('→')
        return { fromStatus, toStatus, avgDays: Math.round((val.total / val.count) * 10) / 10 }
      })

      const recentHistories = await ctx.prisma.applicationStatusHistory.findMany({
        where: { application: { userId } },
        orderBy: { changedAt: 'desc' },
        take: 10,
        include: { application: { include: { jobPost: { select: { title: true } } } } },
      })

      const now = new Date()
      const recentStatusChanges = recentHistories.map((h: any) => ({
        applicationId: h.applicationId,
        jobTitle: h.application.jobPost.title,
        toStatus: h.status,
        fromStatus: null,
        changedAt: h.changedAt.toISOString(),
        daysSinceChange: Math.floor((now.getTime() - h.changedAt.getTime()) / 86400000),
      }))

      return {
        totalApplications: applications.length,
        byStatus,
        cvReadyCount,
        avgDaysByStatus,
        recentStatusChanges,
      }
    },
  },

  Mutation: {
    saveJobPostToApply: async (
      _: unknown,
      args: { jobPostId: string; profileId?: string },
      ctx: GraphQLContext,
    ) => {
      const userId = requireAuth(ctx.userId)
      return ctx.prisma.jobApplication.create({
        data: {
          userId,
          jobPostId: args.jobPostId,
          jobProfileId: args.profileId ?? null,
          currentStatus: 'saved',
          cvGenerationStatus: null,
          statusHistory: { create: { status: 'saved' } },
        },
        include: {
          jobPost: true,
          jobProfile: true,
          statusHistory: true,
          customQuestions: true,
        },
      })
    },

    updateApplicationStatus: async (
      _: unknown,
      args: { id: string; status: string; note?: string },
      ctx: GraphQLContext,
    ) => {
      const userId = requireAuth(ctx.userId)
      const [application] = await ctx.prisma.$transaction([
        ctx.prisma.jobApplication.update({
          where: { id: args.id, userId },
          data: {
            currentStatus: args.status,
            statusHistory: { create: { status: args.status, note: args.note ?? null } },
          },
          include: APPLICATION_INCLUDE,
        }),
      ])
      return application
    },

    updateApplication: async (_: unknown, args: { id: string; input: any }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx.userId)
      const { customQuestions, ...data } = args.input

      return ctx.prisma.$transaction(async (tx: any) => {
        if (customQuestions) {
          for (const q of customQuestions) {
            if (q.id) {
              await tx.applicationQuestion.update({
                where: { id: q.id },
                data: { question: q.question, answer: q.answer, questionType: q.questionType, sortOrder: q.sortOrder },
              })
            } else {
              await tx.applicationQuestion.create({
                data: { applicationId: args.id, question: q.question, answer: q.answer, questionType: q.questionType ?? 'text', sortOrder: q.sortOrder ?? 0 },
              })
            }
          }
        }

        if (data.resumeId) {
          const source = await tx.resume.findUnique({ where: { id: data.resumeId } })
          if (source) {
            const clone = await tx.resume.create({
              data: {
                userId: source.userId,
                title: source.title,
                summary: source.summary ?? undefined,
                contactInfo: source.contactInfo ?? undefined,
                experiences: source.experiences,
                skills: source.skills,
                educations: source.educations,
                projects: source.projects,
                certifications: source.certifications,
              },
            })
            data.resumeId = clone.id
          }
        }

        return tx.jobApplication.update({
          where: { id: args.id, userId },
          data,
          include: APPLICATION_INCLUDE,
        })
      })
    },

    deleteApplicationQuestion: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx.userId)
      const question = await ctx.prisma.applicationQuestion.findFirst({
        where: { id: args.id, application: { userId } },
      })
      if (!question) throw new Error('Question not found')
      await ctx.prisma.applicationQuestion.delete({ where: { id: args.id } })
      return true
    },

    deleteApplication: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx.userId)
      await ctx.prisma.jobApplication.delete({ where: { id: args.id, userId } })
      return true
    },

    generateCV: async (_: unknown, args: { applicationId: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx.userId)

      const application = await ctx.prisma.jobApplication.findFirst({
        where: { id: args.applicationId, userId },
        include: { jobPost: true, jobProfile: true },
      })
      if (!application) throw new Error('Application not found')
      if (!application.jobProfile) throw new Error('No job profile linked to this application')
      if (!application.jobProfile.details) throw new Error('Job profile must have details filled in to generate a CV')

      const nameParts = application.jobProfile.name.trim().split(/\s+/)
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ') || ''

      await enqueueGenerateCV({
        profile: {
          firstName,
          lastName,
          email: application.jobProfile.email,
          phone: application.jobProfile.phone ?? undefined,
          address: application.jobProfile.address ?? undefined,
          linkedin: application.jobProfile.linkedin ?? undefined,
          github: application.jobProfile.github ?? undefined,
          details: application.jobProfile.details,
        },
        applicationId: application.id,
        jobDescription: application.jobPost.description,
      })

      return ctx.prisma.jobApplication.update({
        where: { id: args.applicationId },
        data: { cvGenerationStatus: 'queued' },
        include: APPLICATION_INCLUDE,
      })
    },

    createResumeFromCV: async (
      _: unknown,
      args: { applicationId: string; cvData: any },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.isWebhook && !ctx.userId) throw new Error('Not authenticated')

      const application = await ctx.prisma.jobApplication.findUnique({
        where: { id: args.applicationId },
        include: { jobPost: true },
      })
      if (!application) throw new Error('Application not found')

      const cv = args.cvData

      const skills = (cv.Skills ?? []).map((s: any) => ({
        label: s.label ?? s.category ?? '',
        details: Array.isArray(s.details) ? s.details : (s.items ?? []),
      }))

      const experiences = (cv.Experiences ?? []).map((e: any) => {
        const endDate = e.end_date ?? e.endDate ?? null
        return {
          company: e.company ?? '',
          jobTitle: e.title ?? e.jobTitle ?? '',
          location: e.location ?? '',
          startDate: e.start_date ?? e.startDate ?? '',
          endDate: endDate || null,
          currentJob: !endDate,
          description: Array.isArray(e.highlights)
            ? `<ul class="list-disc pl-4">${e.highlights.map((h: string) => `<li><p>${h}</p></li>`).join('')}</ul>`
            : (e.description ?? ''),
        }
      })

      const educations = (cv.Education ?? cv.Educations ?? []).map((e: any) => ({
        institution: e.institution ?? '',
        degree: e.degree ?? '',
        fieldOfStudy: e.fieldOfStudy ?? e.field_of_study ?? '',
        location: e.location ?? '',
        startDate: e.start_year ?? e.startDate ?? e.start_date ?? '',
        endDate: e.end_year ?? e.endDate ?? e.end_date ?? null,
        cgpa: e.cgpa ?? e.gpa ?? null,
        description: e.description ?? null,
      }))

      const certifications = (cv.Certifications ?? cv.certifications ?? []).map((c: any) => ({
        title: c.title ?? c.name ?? '',
        organization: c.organization ?? c.issuer ?? '',
        issueDate: c.issueDate ?? c.issue_date ?? null,
        expirationDate: c.expirationDate ?? c.expiration_date ?? null,
        credentialUrl: c.credentialUrl ?? c.url ?? null,
      }))

      const raw = cv.contactInfo ?? cv.ContactInfo ?? {}
      const firstName = raw.firstName ?? raw.first_name ?? ''
      const lastName = raw.lastName ?? raw.last_name ?? ''
      const contactInfo = {
        firstName,
        lastName,
        email: raw.email ?? '',
        phone: raw.phone ?? null,
        address: raw.address ?? null,
        headline: raw.headline ?? null,
        linkedin: raw.linkedin ?? null,
        github: raw.github ?? null,
      }

      const fullName = [firstName, lastName].filter(Boolean).join(' ')
      const jobTitle = application.jobPost?.title ?? ''
      const company = application.jobPost?.postedBy ?? ''
      const resumeTitle = [fullName, jobTitle, company].filter(Boolean).join(' - ')

      const resume = await ctx.prisma.resume.create({
        data: {
          userId: application.userId,
          title: resumeTitle || 'Generated Resume',
          summary: cv.Summary ?? cv.summary ?? null,
          contactInfo,
          skills,
          experiences,
          educations,
          certifications,
        },
      })

      return ctx.prisma.jobApplication.update({
        where: { id: args.applicationId },
        data: { cvGenerationStatus: 'done', resumeId: resume.id },
        include: APPLICATION_INCLUDE,
      })
    },

    reportCVGenerationFailed: async (
      _: unknown,
      args: { applicationId: string; reason?: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.isWebhook && !ctx.userId) throw new Error('Not authenticated')

      const application = await ctx.prisma.jobApplication.findUnique({
        where: { id: args.applicationId },
      })
      if (!application) throw new Error('Application not found')

      return ctx.prisma.jobApplication.update({
        where: { id: args.applicationId },
        data: { cvGenerationStatus: 'failed' },
        include: APPLICATION_INCLUDE,
      })
    },
  },

  JobApplication: {
    createdAt: (parent: any) => parent.createdAt instanceof Date ? parent.createdAt.toISOString() : parent.createdAt,
    updatedAt: (parent: any) => parent.updatedAt instanceof Date ? parent.updatedAt.toISOString() : parent.updatedAt,

    statusHistory: async (parent: any, _: unknown, ctx: GraphQLContext) => {
      const histories =
        parent.statusHistory ??
        (await ctx.prisma.applicationStatusHistory.findMany({
          where: { applicationId: parent.id },
          orderBy: { changedAt: 'asc' },
        }))

      return histories.map((h: any, i: number) => ({
        ...h,
        changedAt: h.changedAt instanceof Date ? h.changedAt.toISOString() : h.changedAt,
        durationFromPreviousMinutes:
          i === 0
            ? null
            : Math.floor((new Date(h.changedAt).getTime() - new Date(histories[i - 1].changedAt).getTime()) / 60000),
      }))
    },
  },
}
