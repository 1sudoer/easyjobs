'use client'
import Link from 'next/link'
import { socialProfile } from "@/lib/social-profiles";
import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CVActionButton } from './CVActionButton'
import type { ContactInfo, WorkExperience, SkillCategory } from '@/models/profile.model'

interface Resume {
  id: string
  title: string
  summary?: string | null
  contactInfo?: ContactInfo | null | unknown
  experiences?: WorkExperience[] | null | unknown
  skills?: SkillCategory[] | null | unknown
}

interface Props {
  applicationId: string
  cvGenerationStatus?: string | null
  resume?: Resume | null
  jobProfileId?: string | null
  profileDetails?: string | null
  appliedWith?: {
    name: string
    email: string
    linkedin?: string | null
    address?: string | null
  } | null
}

function ResumePreview({ resume }: { resume: Resume }) {
  const contact = resume.contactInfo as ContactInfo | null | undefined
  const experiences = (resume.experiences as WorkExperience[] | null | undefined) ?? []
  const skills = (resume.skills as SkillCategory[] | null | undefined) ?? []
  const allSkills = skills.flatMap((s) => s.details ?? [])

  return (
    <div className="space-y-3 text-xs">
      {contact && (
        <div>
          <p className="font-medium text-sm">
            {[contact.firstName, contact.lastName].filter(Boolean).join(' ')}
          </p>
          {contact.headline && <p className="text-muted-foreground">{contact.headline}</p>}
          <div className="flex flex-wrap gap-x-2 text-muted-foreground mt-0.5">
            {contact.email && <span>{contact.email}</span>}
            {contact.phone && <span>{contact.phone}</span>}
          </div>
        </div>
      )}

      {resume.summary && (
        <div>
          <p className="font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Summary</p>
          <p className="line-clamp-3 text-muted-foreground">{resume.summary}</p>
        </div>
      )}

      {experiences.length > 0 && (
        <div>
          <p className="font-semibold text-muted-foreground uppercase tracking-wide mb-1">Experience</p>
          <div className="space-y-1.5">
            {experiences.slice(0, 3).map((exp, i) => (
              <div key={i}>
                <p className="font-medium">{exp.jobTitle} — {exp.company}</p>
                <p className="text-muted-foreground">
                  {exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : exp.currentJob ? ' – Present' : ''}
                </p>
              </div>
            ))}
            {experiences.length > 3 && (
              <p className="text-muted-foreground">+{experiences.length - 3} more</p>
            )}
          </div>
        </div>
      )}

      {allSkills.length > 0 && (
        <div>
          <p className="font-semibold text-muted-foreground uppercase tracking-wide mb-1">Skills</p>
          <div className="flex flex-wrap gap-1">
            {allSkills.slice(0, 12).map((skill, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
            ))}
            {allSkills.length > 12 && (
              <Badge variant="outline" className="text-xs">+{allSkills.length - 12}</Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function ApplicationResumePanel({
  applicationId,
  cvGenerationStatus,
  resume,
  jobProfileId,
  profileDetails,
  appliedWith,
}: Props) {
  const appliedLinkedIn = socialProfile("linkedin", appliedWith?.linkedin);
  return (
    <div className="space-y-4">
      {/* Applied With */}
      {appliedWith && (
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <h2 className="font-semibold text-sm">Applied With</h2>
          <div className="text-sm space-y-0.5">
            <p className="font-medium">{appliedWith.name}</p>
            <p className="text-xs text-muted-foreground">{appliedWith.email}</p>
            {appliedLinkedIn && (
              <p className="text-xs text-muted-foreground">{appliedLinkedIn.label}</p>
            )}
            {appliedWith.address && (
              <p className="text-xs text-muted-foreground">{appliedWith.address}</p>
            )}
          </div>
        </div>
      )}

      {/* Resume panel */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-sm">Resume</h2>
          {resume && (
            <Link
              href={`/dashboard/profile/resume/${resume.id}`}
              target="_blank"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />View
            </Link>
          )}
        </div>

        <CVActionButton
          applicationId={applicationId}
          initialStatus={cvGenerationStatus}
          resume={resume ? { id: resume.id, title: resume.title } : null}
          jobProfileId={jobProfileId}
          profileDetails={profileDetails}
        />

        {resume && (
          <>
            <Separator />
            <ResumePreview resume={resume} />
          </>
        )}
      </div>
    </div>
  )
}
