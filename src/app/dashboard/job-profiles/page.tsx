import { Metadata } from 'next'
import { JobProfilesContainer } from '@/components/job-profiles/JobProfilesContainer'

export const metadata: Metadata = { title: 'Job Profiles' }

export default function JobProfilesPage() {
  return <JobProfilesContainer />
}
