import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowLeft, MapPin, DollarSign, Calendar, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Metadata } from 'next'
import { getApplicationById } from '@/actions/application.actions'
import { ApplicationStatusCard } from '@/components/applications/ApplicationStatusCard'
import { ApplicationInfoCard } from '@/components/applications/ApplicationInfoCard'
import { ApplicationQuestionsCard } from '@/components/applications/ApplicationQuestionsCard'
import { ApplicationResumePanel } from '@/components/applications/ApplicationResumePanel'

export const metadata: Metadata = { title: 'Application' }

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const app = await getApplicationById(id)
  if (!app) notFound()

  return (
    <div className="col-span-3">
      <div className="mb-5">
        <Link href="/dashboard/applications">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex gap-6 items-start">
        {/* Left main column */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Application status + title */}
          <ApplicationStatusCard
            id={app.id}
            jobPostId={app.jobPost.id}
            jobTitle={app.jobPost.title}
            company={app.jobPost.postedBy}
            currentStatus={app.currentStatus}
            statusHistory={app.statusHistory}
          />

          {/* Job post info — server-rendered */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h2 className="font-semibold text-sm">Job Details</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {app.jobPost.locations?.length > 0 && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {app.jobPost.locations.join(' · ')}
                </span>
              )}
              {app.jobPost.salary && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {app.jobPost.salary}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Posted {format(new Date(app.jobPost.postedAt.slice(0, 10) + 'T00:00:00'), 'MMM d, yyyy')}
              </span>
              {app.jobPost.sourceUrl && (
                <a
                  href={app.jobPost.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />View original
                </a>
              )}
            </div>
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: app.jobPost.description }}
            />
          </div>

          {/* Cover letter & notes */}
          <ApplicationInfoCard
            id={app.id}
            coverLetter={app.coverLetter ?? ''}
            notes={app.notes ?? ''}
            jobProfile={app.jobProfile ?? null}
            jobPost={{
              title: app.jobPost.title,
              postedBy: app.jobPost.postedBy,
              locations: app.jobPost.locations,
            }}
          />

          {/* Custom questions */}
          <ApplicationQuestionsCard
            id={app.id}
            customQuestions={app.customQuestions}
          />
        </div>

        {/* Right sidebar — resume preview */}
        <aside className="w-72 shrink-0 sticky top-4">
          <ApplicationResumePanel
            applicationId={app.id}
            cvGenerationStatus={app.cvGenerationStatus}
            resume={app.resume ?? null}
            jobProfileId={app.jobProfile?.id ?? null}
            profileDetails={app.jobProfile?.details ?? null}
            appliedWith={
              app.jobProfile
                ? {
                    name: app.jobProfile.name,
                    email: app.jobProfile.email,
                    linkedin: app.jobProfile.linkedin,
                    address: app.jobProfile.address,
                  }
                : null
            }
          />
        </aside>
      </div>
    </div>
  )
}
