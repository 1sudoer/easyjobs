import { Metadata } from 'next'
import { JobProfileResumeView } from '@/components/job-profiles/JobProfileResumeView'

export const metadata: Metadata = { title: 'Resume Template' }

export default function JobProfileResumePage() {
  return <JobProfileResumeView />
}
