import { Metadata } from 'next'
import { JobPostForm } from '@/components/job-posts/JobPostForm'

export const metadata: Metadata = { title: 'New Job Post' }

export default function NewJobPostPage() {
  return (
    <div className="col-span-3 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Add Job Post</h1>
      <JobPostForm />
    </div>
  )
}
