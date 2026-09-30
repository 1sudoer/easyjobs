'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation } from '@apollo/client/react'
import Link from 'next/link'
import { ArrowLeft, Loader, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { Resume } from '@/models/profile.model'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ResumePreviewPanel } from '@/components/profile/resume-preview'
import { DownloadResumeButton } from '@/components/profile/resume-pdf/DownloadResumeButton'
import { ResumeEditorPanel } from '@/components/profile/ResumeEditorPanel'
import { toast } from '@/components/ui/use-toast'
import {
  CREATE_PROFILE_RESUME_DRAFT,
  PROFILE_RESUME_DRAFTS_QUERY,
  JOB_PROFILES_QUERY,
} from '@/lib/graphql/queries'

const BLANK_RESUME: Resume = { title: '' }

export function NewJobProfileResumeView() {
  const { id: profileId } = useParams<{ id: string }>()
  const router = useRouter()

  const [showEdit, setShowEdit] = useState(true)
  const [title, setTitle] = useState('')
  const [localResume, setLocalResume] = useState<Resume>(BLANK_RESUME)

  const backHref = `/dashboard/job-profiles/${profileId}?tab=resume-templates`

  const [createDraft, { loading: creating }] = useMutation(CREATE_PROFILE_RESUME_DRAFT, {
    refetchQueries: [
      { query: PROFILE_RESUME_DRAFTS_QUERY, variables: { profileId } },
      JOB_PROFILES_QUERY,
    ],
    onCompleted: (res) => {
      const created = (res as any).createProfileResumeDraft
      router.push(`/dashboard/job-profiles/${profileId}/resume/${created.id}`)
    },
    onError: (e) =>
      toast({ variant: 'destructive', title: 'Failed to create template', description: e.message }),
  })

  const updateLocal = (updates: Partial<Resume>) =>
    setLocalResume((prev) => ({ ...prev, ...updates }))

  const handleCreate = () => {
    if (!title.trim()) {
      toast({ variant: 'destructive', title: 'Template title is required.' })
      return
    }
    createDraft({
      variables: {
        profileId,
        input: {
          title: title.trim(),
          summary: localResume.summary ?? null,
          contactInfo: localResume.contactInfo ?? null,
          skills: localResume.skills ?? [],
          experiences: localResume.experiences ?? [],
          educations: localResume.educations ?? [],
          projects: localResume.projects ?? [],
          certifications: localResume.certifications ?? [],
          sectionOrder: localResume.sectionOrder ?? [],
        },
      },
    })
  }

  // Show the current title in the preview as the user types
  const previewResume: Resume = { ...localResume, title }

  return (
    <div className="col-span-3 flex flex-col gap-3 h-[calc(100dvh-5.5rem)]">

      {/* Top bar */}
      <div className="flex items-center gap-2 shrink-0">
        <Link href={backHref}>
          <Button variant="ghost" size="sm" className="gap-1.5 px-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </Link>

        <Input
          placeholder="Template title — e.g. Backend Engineer v2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          className="h-8 text-sm flex-1 min-w-0 max-w-xs"
        />

        <Button
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={handleCreate}
          disabled={creating || !title.trim()}
        >
          {creating && <Loader className="h-4 w-4 animate-spin" />}
          <span>{creating ? 'Creating…' : 'Create Template'}</span>
        </Button>

        <DownloadResumeButton resume={previewResume} title={title} />

        <Button
          variant={showEdit ? 'secondary' : 'outline'}
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => setShowEdit((v) => !v)}
        >
          {showEdit
            ? <PanelRightClose className="h-4 w-4" />
            : <PanelRightOpen className="h-4 w-4" />}
          <span className="hidden sm:inline">{showEdit ? 'Hide Edit' : 'Edit'}</span>
        </Button>
      </div>

      {/* Split view: live preview + editor */}
      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex-1 min-w-0 min-h-0">
          <ResumePreviewPanel resume={previewResume} />
        </div>

        {showEdit && (
          <ResumeEditorPanel
            resumeId={undefined}
            localResume={localResume}
            updateLocal={updateLocal}
          />
        )}
      </div>

    </div>
  )
}
