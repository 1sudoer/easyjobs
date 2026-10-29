import { Metadata } from 'next'
import { ProfileApplicationsView } from '@/components/job-profiles/ProfileApplicationsView'
import { getJobPostUniqueLocations } from '@/actions/jobPost.actions'

export const metadata: Metadata = { title: 'Applications' }

export default async function ProfileApplicationsPage() {
  const initialLocations = await getJobPostUniqueLocations()
  return <ProfileApplicationsView initialLocations={initialLocations} />
}
