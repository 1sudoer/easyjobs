import { Metadata } from 'next'
import { ProfilePageView } from '@/components/job-profiles/ProfilePageView'

export const metadata: Metadata = { title: 'Job Profile' }

export default function JobProfilePage() {
  return <ProfilePageView />
}
