import { Metadata } from 'next'
import { ApplicationsContainer } from '@/components/applications/ApplicationsContainer'

export const metadata: Metadata = { title: 'Applications' }

export default function ApplicationsPage() {
  return <ApplicationsContainer />
}
