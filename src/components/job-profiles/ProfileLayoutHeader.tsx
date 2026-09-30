'use client'
import { useParams, usePathname } from 'next/navigation'
import { useQuery } from '@apollo/client/react'
import { ArrowLeft, Star } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { JOB_PROFILE_QUERY } from '@/lib/graphql/queries'
import { ProfileCreator } from './ProfileCreator'

export function ProfileLayoutHeader() {
  const { id: profileId } = useParams<{ id: string }>()
  const pathname = usePathname()

  const { data, loading } = useQuery(JOB_PROFILE_QUERY, {
    variables: { id: profileId },
    fetchPolicy: 'cache-first',
  })
  const profile = (data as any)?.jobProfile

  const isApplicationsPage = pathname.endsWith('/applications')

  return (
    <div className="space-y-4 pb-2">
      <Link href="/dashboard/job-profiles">
        <Button variant="ghost" size="sm" className="gap-1 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Profiles
        </Button>
      </Link>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      ) : profile ? (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            {profile.isDefault && (
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />
            )}
          </div>
          {profile.description && (
            <p className="text-sm text-muted-foreground">{profile.description}</p>
          )}
          <ProfileCreator owner={profile.owner} isOwner={profile.isOwner} className="pt-1" />
        </div>
      ) : null}

      {/* Sub-navigation */}
      <div className="flex gap-0 border-b">
        <Link href={`/dashboard/job-profiles/${profileId}`}>
          <button
            className={cn(
              'inline-flex items-center gap-1.5 px-3 h-9 text-sm font-medium border-b-2 transition-colors',
              !isApplicationsPage
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            Overview
            {profile?.resumeDraftCount > 0 && (
              <Badge variant="secondary" className="text-xs py-0 px-1.5 h-4">
                {profile.resumeDraftCount}
              </Badge>
            )}
          </button>
        </Link>

        <Link href={`/dashboard/job-profiles/${profileId}/applications`}>
          <button
            className={cn(
              'inline-flex items-center gap-1.5 px-3 h-9 text-sm font-medium border-b-2 transition-colors',
              isApplicationsPage
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            Applications
            {profile?.applicationCount > 0 && (
              <Badge variant="secondary" className="text-xs py-0 px-1.5 h-4">
                {profile.applicationCount}
              </Badge>
            )}
          </button>
        </Link>
      </div>
    </div>
  )
}
