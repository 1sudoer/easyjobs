import { Suspense } from 'react'
import { Metadata } from 'next'
import { JobPostsContainer } from '@/components/job-posts/JobPostsContainer'
import { getAllJobLocations } from '@/actions/jobLocation.actions'
import { getJobPostTags } from '@/actions/jobPost.actions'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = { title: 'Job Posts | JobSync' }

export default async function JobPostsPage() {
  const [locations, tags] = await Promise.all([
    getAllJobLocations(),
    getJobPostTags(),
  ])

  return (
    <Suspense fallback={
      <div className="col-span-3 flex flex-col gap-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    }>
      <JobPostsContainer
        initialLocations={Array.isArray(locations) ? locations : []}
        initialTags={Array.isArray(tags) ? tags : []}
      />
    </Suspense>
  )
}
