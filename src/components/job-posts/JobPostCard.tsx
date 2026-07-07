'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery } from '@apollo/client/react'
import { MapPin, DollarSign, Calendar, ExternalLink, MoreHorizontal, Tag, Globe } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SET_JOB_POST_STATUS, DELETE_JOB_POST, JOB_POSTS_QUERY, SET_JOB_POST_TAGS, JOB_POST_TAGS_QUERY, CREATE_JOB_POST_TAG } from '@/lib/graphql/queries'
import { format } from 'date-fns'
import { JobPostTagInput, JobPostTagOption, getTagColor } from './JobPostTagInput'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  closed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  inappropriate: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
}

interface JobPostCardProps {
  post: {
    id: string
    title: string
    salary?: string | null
    locations?: string[] | null
    postedAt: string
    postedBy: string
    sourceUrl?: string | null
    jobSource?: string | null
    status: string
    applicationCount: number
    tags?: { id: string; label: string; value: string }[]
  }
}

export function JobPostCard({ post }: JobPostCardProps) {
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false)
  const [localTagIds, setLocalTagIds] = useState<string[]>((post.tags ?? []).map((t) => t.id))

  const [setStatus] = useMutation(SET_JOB_POST_STATUS, { refetchQueries: [JOB_POSTS_QUERY] })
  const [deletePost] = useMutation(DELETE_JOB_POST, { refetchQueries: [JOB_POSTS_QUERY] })
  const [setTags] = useMutation(SET_JOB_POST_TAGS, { refetchQueries: [JOB_POSTS_QUERY] })
  const [createTag] = useMutation(CREATE_JOB_POST_TAG, { refetchQueries: [JOB_POST_TAGS_QUERY] })

  const { data: tagsData, refetch: refetchTags } = useQuery(JOB_POST_TAGS_QUERY)
  const allTags: JobPostTagOption[] = (tagsData as any)?.jobPostTags ?? []

  const locations = post.locations ?? []
  const currentTags = localTagIds.map((id) => allTags.find((t) => t.id === id) ?? (post.tags ?? []).find((t) => t.id === id)).filter(Boolean) as { id: string; label: string; value: string }[]

  async function handleTagChange(ids: string[]) {
    setLocalTagIds(ids)
    await setTags({ variables: { jobPostId: post.id, tagIds: ids } })
  }

  async function handleCreateTag(label: string): Promise<JobPostTagOption | null> {
    try {
      const res = await createTag({ variables: { label } })
      const tag = (res.data as any)?.createJobPostTag
      if (tag) {
        await refetchTags()
        return tag
      }
    } catch {}
    return null
  }

  return (
    <div className="flex items-start gap-3 px-4 py-3 border rounded-lg hover:bg-muted/40 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/dashboard/job-posts/${post.id}`}
              className="font-medium text-sm hover:underline underline-offset-2 truncate"
            >
              {post.title}
            </Link>
            <Badge className={`text-xs shrink-0 ${STATUS_COLORS[post.status] ?? ''}`} variant="outline">
              {post.status}
            </Badge>
          </div>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
            <span>{post.postedBy}</span>
            {post.jobSource && (
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3 shrink-0" />
                {post.jobSource}
              </span>
            )}
            {locations.length > 0 && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {locations.join(' · ')}
              </span>
            )}
            {post.salary && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {post.salary}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(post.postedAt.slice(0, 10) + 'T00:00:00'), 'MMM d, yyyy')}
            </span>
            <span>
              {post.applicationCount > 0
                ? `${post.applicationCount} application${post.applicationCount !== 1 ? 's' : ''}`
                : 'No applications'}
            </span>
          </div>

          {/* Tags row */}
          <div className="flex items-center gap-1 flex-wrap mt-1">
            {currentTags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className={`text-xs border-0 px-1.5 py-0 h-5 ${getTagColor(tag.value)}`}
              >
                {tag.label}
              </Badge>
            ))}
            <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground"
                  type="button"
                >
                  <Tag className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
                <p className="text-xs font-medium mb-2 text-muted-foreground">Manage tags</p>
                <JobPostTagInput
                  value={localTagIds}
                  onChange={handleTagChange}
                  tags={allTags}
                  onCreateTag={handleCreateTag}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {post.sourceUrl && (
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
            <Link href={`/dashboard/job-posts/${post.id}`}>View</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {post.status !== 'closed' && (
                <DropdownMenuItem onClick={() => setStatus({ variables: { id: post.id, status: 'closed' } })}>
                  Mark as Closed
                </DropdownMenuItem>
              )}
              {post.status !== 'inappropriate' && (
                <DropdownMenuItem onClick={() => setStatus({ variables: { id: post.id, status: 'inappropriate' } })}>
                  Mark as Inappropriate
                </DropdownMenuItem>
              )}
              {post.status !== 'active' && (
                <DropdownMenuItem onClick={() => setStatus({ variables: { id: post.id, status: 'active' } })}>
                  Mark as Active
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => deletePost({ variables: { id: post.id } })}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
    </div>
  )
}
