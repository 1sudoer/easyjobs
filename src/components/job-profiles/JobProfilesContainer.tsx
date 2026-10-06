'use client'
import { useState } from 'react'
import { socialProfile } from '@/lib/social-profiles'
import { useQuery, useMutation } from '@apollo/client/react'
import { Plus, Trash2, Star, FileText, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { JOB_PROFILES_QUERY, DELETE_JOB_PROFILE } from '@/lib/graphql/queries'
import { ProfileDialog } from './ProfileDialog'
import { ProfileCreator } from './ProfileCreator'

export function JobProfilesContainer() {
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, loading } = useQuery(JOB_PROFILES_QUERY)
  const [deleteProfile] = useMutation(DELETE_JOB_PROFILE, { refetchQueries: [JOB_PROFILES_QUERY] })

  const profiles = (data as any)?.jobProfiles ?? []

  return (
    <div className="col-span-3 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job Profiles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Apply to different jobs with different profiles. Profiles are shared: everyone signed in can view and edit them.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />New Profile
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Job Profile</DialogTitle>
            </DialogHeader>
            <ProfileDialog onClose={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading profiles...</p>
      ) : profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-sm">No profiles yet. Create one to track applications by profile.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {profiles.map((p: any) => (
            <div key={p.id} className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/dashboard/job-profiles/${p.id}`} className="min-w-0 flex-1 group">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-sm group-hover:underline">{p.name}</h3>
                    {p.isDefault && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />}
                  </div>
                  {p.address && <p className="text-xs text-muted-foreground mt-0.5">{p.address}</p>}
                </Link>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className="text-xs">
                    {p.applicationCount} app{p.applicationCount !== 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <FileText className="h-2.5 w-2.5 mr-1" />
                    {p.resumeDraftCount} template{p.resumeDraftCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>

              {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}

              <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                {[socialProfile('linkedin', p.linkedin), socialProfile('github', p.github)].map((profile) =>
                  profile?.href ? (
                    <a key={profile.label} href={profile.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {profile.label}
                    </a>
                  ) : profile ? (
                    <span key={profile.label}>{profile.label}</span>
                  ) : null,
                )}
                {p.phone && <span>{p.phone}</span>}
              </div>

              <ProfileCreator owner={p.owner} isOwner={p.isOwner} />

              <div className="flex items-center justify-between pt-1">
                <Link href={`/dashboard/job-profiles/${p.id}`}>
                  <Button variant="outline" size="sm" className="gap-1 text-xs h-7">
                    Manage
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
                {/* Anyone can edit a shared profile; only its creator can delete it. */}
                {p.isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    aria-label={`Delete ${p.name}`}
                    onClick={() => deleteProfile({ variables: { id: p.id } })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
