'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@apollo/client/react'
import Link from 'next/link'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, Loader, PanelRightClose, PanelRightOpen, RotateCcw, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Resume } from '@/models/profile.model'
import { ResumePreviewPanel } from '@/components/profile/resume-preview'
import { DownloadResumeButton } from '@/components/profile/resume-pdf/DownloadResumeButton'
import { ResumeEditorPanel } from '@/components/profile/ResumeEditorPanel'
import { toast } from '@/components/ui/use-toast'
import {
  RESUME_DRAFT_QUERY,
  UPDATE_PROFILE_RESUME_DRAFT,
  DELETE_PROFILE_RESUME_DRAFT,
  PROFILE_RESUME_DRAFTS_QUERY,
  JOB_PROFILES_QUERY,
} from '@/lib/graphql/queries'

function draftToResume(draft: any): Resume {
  return {
    id: draft.id,
    jobProfileId: draft.jobProfileId,
    title: draft.title ?? '',
    summary: draft.summary ?? undefined,
    contactInfo: draft.contactInfo ?? undefined,
    skills: draft.skills ?? [],
    experiences: draft.experiences ?? [],
    educations: draft.educations ?? [],
    projects: draft.projects ?? [],
    certifications: draft.certifications ?? [],
    sectionOrder: draft.sectionOrder ?? [],
  }
}

export function JobProfileResumeView() {
  const { id: profileId, resumeId } = useParams<{ id: string; resumeId: string }>()
  const router = useRouter()

  const [showEdit, setShowEdit] = useState(true)
  const [localResume, setLocalResume] = useState<Resume | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const savedRef = useRef<Resume | null>(null)

  const backHref = `/dashboard/job-profiles/${profileId}?tab=resume-templates`

  const { data: draftData, loading } = useQuery(RESUME_DRAFT_QUERY, {
    variables: { id: resumeId },
  })
  const draft = (draftData as any)?.resumeDraft

  // Populate local state once the draft loads (runs once when draft becomes available)
  useEffect(() => {
    if (draft && !localResume) {
      const r = draftToResume(draft)
      setLocalResume(r)
      savedRef.current = r
    }
  }, [draft]) // eslint-disable-line react-hooks/exhaustive-deps

  const [updateDraft, { loading: saving }] = useMutation(UPDATE_PROFILE_RESUME_DRAFT, {
    onCompleted: (res) => {
      const updated = draftToResume((res as any).updateProfileResumeDraft)
      savedRef.current = updated
      setIsDirty(false)
      toast({ variant: 'success', description: 'Template saved.' })
    },
    onError: (e) =>
      toast({ variant: 'destructive', title: 'Failed to save', description: e.message }),
  })

  const [deleteDraft, { loading: deleting }] = useMutation(DELETE_PROFILE_RESUME_DRAFT, {
    refetchQueries: [
      { query: PROFILE_RESUME_DRAFTS_QUERY, variables: { profileId } },
      JOB_PROFILES_QUERY,
    ],
    onCompleted: () => router.push(backHref),
    onError: (e) =>
      toast({ variant: 'destructive', title: 'Failed to delete', description: e.message }),
  })

  const updateLocal = (updates: Partial<Resume>) => {
    setLocalResume((prev) => (prev ? { ...prev, ...updates } : prev))
    setIsDirty(true)
  }

  const handleSave = () => {
    if (!localResume) return
    updateDraft({
      variables: {
        id: resumeId,
        input: {
          title: localResume.title,
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

  const handleDiscard = () => {
    if (savedRef.current) {
      setLocalResume(savedRef.current)
      setIsDirty(false)
    }
  }

  if (loading || !localResume) {
    return (
      <div className="col-span-3 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-[calc(100dvh-12rem)] rounded-lg" />
      </div>
    )
  }

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

        <span className="font-semibold text-sm truncate flex-1 min-w-0">
          {localResume.title}
        </span>

        {isDirty && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 shrink-0 text-muted-foreground"
              onClick={handleDiscard}
              disabled={saving}
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Discard</span>
            </Button>
            <Button
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? <Loader className="h-4 w-4 animate-spin" />
                : <Save className="h-4 w-4" />}
              <span className="hidden sm:inline">{saving ? 'Saving…' : 'Save'}</span>
            </Button>
          </>
        )}

        {/* Templates are shared; only the author or the profile's creator may delete one. */}
        {draft?.canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete resume template?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &ldquo;{localResume.title}&rdquo;. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => deleteDraft({ variables: { id: resumeId } })}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <DownloadResumeButton resume={localResume} />

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
          <ResumePreviewPanel resume={localResume} />
        </div>

        {showEdit && (
          <ResumeEditorPanel
            resumeId={resumeId}
            localResume={localResume}
            updateLocal={updateLocal}
          />
        )}
      </div>

    </div>
  )
}
