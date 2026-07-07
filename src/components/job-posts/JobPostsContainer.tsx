'use client'
import { useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useQuery } from '@apollo/client/react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Plus, Search, CalendarIcon, X, ChevronsUpDown, Check, Tag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { JobPostCard } from './JobPostCard'
import { JOB_POSTS_QUERY, JOB_POST_INSIGHTS_QUERY } from '@/lib/graphql/queries'
import { getTagColor } from './JobPostTagInput'

interface JobPostsContainerProps {
  initialLocations: { id: string; label: string }[]
  initialTags: { id: string; label: string; value: string }[]
}

const DATE_PRESETS = [
  { value: '1d', label: '1 day' },
  { value: '3d', label: '3 days' },
  { value: '1w', label: '1 week' },
] as const

type DatePreset = typeof DATE_PRESETS[number]['value'] | 'custom' | null

function appTZMidnightDaysAgo(daysAgo: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return d
}

function appTZStartOfCalendarDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function getDateFilter(preset: DatePreset, customStart: Date | undefined): { startDate?: string } {
  if (preset === '1d') return { startDate: appTZMidnightDaysAgo(1).toISOString() }
  if (preset === '3d') return { startDate: appTZMidnightDaysAgo(3).toISOString() }
  if (preset === '1w') return { startDate: appTZMidnightDaysAgo(7).toISOString() }
  if (preset === 'custom') return customStart ? { startDate: appTZStartOfCalendarDay(customStart).toISOString() } : {}
  return {}
}

export function JobPostsContainer({ initialLocations, initialTags }: JobPostsContainerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Filter state derived from URL params
  const search = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? 'all'
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const datePreset = (searchParams.get('date') as DatePreset) ?? null
  const customStartDateStr = searchParams.get('customDate')
  const customStartDate = customStartDateStr ? new Date(customStartDateStr) : undefined
  const locationFilter = searchParams.get('location') ?? null
  const tagFilter = searchParams.getAll('tag')

  // UI-only state (not persisted in URL)
  const [datePopoverOpen, setDatePopoverOpen] = useState(false)
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false)
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false)

  function updateParams(updates: Record<string, string | string[] | null>, resetPage = true) {
    const params = new URLSearchParams(searchParams.toString())
    if (resetPage) params.delete('page')
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') {
        params.delete(key)
      } else if (Array.isArray(value)) {
        params.delete(key)
        value.forEach((v) => params.append(key, v))
      } else {
        params.set(key, value)
      }
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  const dateFilter = getDateFilter(datePreset, customStartDate)

  const filter = {
    ...(search ? { search } : {}),
    ...(status !== 'all' ? { status } : {}),
    ...dateFilter,
    ...(locationFilter ? { location: locationFilter } : {}),
    ...(tagFilter.length ? { tags: tagFilter } : {}),
  }

  const { data, loading } = useQuery(JOB_POSTS_QUERY, {
    variables: { filter, page, limit: 20 },
    fetchPolicy: 'cache-and-network',
  })

  const { data: insightsData } = useQuery(JOB_POST_INSIGHTS_QUERY)
  const d = data as any
  const insights = (insightsData as any)?.jobPostInsights

  const posts = d?.jobPosts?.items ?? []
  const totalPages = d?.jobPosts?.totalPages ?? 1

  function handlePresetClick(preset: DatePreset) {
    if (datePreset === preset) {
      updateParams({ date: null, customDate: null })
    } else {
      updateParams({ date: preset as string, customDate: null })
    }
  }

  function handleCustomDateSelect(date: Date | undefined) {
    updateParams({
      date: 'custom',
      customDate: date ? date.toISOString().split('T')[0] : null,
    })
  }

  function clearDateFilter() {
    updateParams({ date: null, customDate: null })
  }

  const dateLabel = (() => {
    if (!datePreset) return null
    if (datePreset !== 'custom') return DATE_PRESETS.find((p) => p.value === datePreset)?.label
    if (customStartDate) return `From ${format(customStartDate, 'MMM d')}`
    return 'Custom'
  })()

  return (
    <div className="col-span-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job Posts</h1>
          {insights && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {insights.active} active · {insights.closed} closed
            </p>
          )}
        </div>
        <Link href="/dashboard/job-posts/new">
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Add Post
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, company..."
            className="pl-9"
            value={search}
            onChange={(e) => updateParams({ q: e.target.value || null })}
          />
        </div>

        <Select value={status} onValueChange={(v) => updateParams({ status: v === 'all' ? null : v })}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="inappropriate">Inappropriate</SelectItem>
          </SelectContent>
        </Select>

        {/* Location filter */}
        {initialLocations.length > 0 && (
          <Popover open={locationPopoverOpen} onOpenChange={setLocationPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={locationFilter ? 'secondary' : 'outline'}
                size="sm"
                className="gap-1.5 h-9"
                role="combobox"
              >
                {locationFilter ?? 'All locations'}
                {locationFilter
                  ? <X className="h-3.5 w-3.5 opacity-50" onClick={(e) => { e.stopPropagation(); updateParams({ location: null }) }} />
                  : <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search locations..." />
                <CommandList>
                  <CommandEmpty>No locations found.</CommandEmpty>
                  <CommandGroup>
                    {initialLocations.map((loc) => (
                      <CommandItem
                        key={loc.id}
                        value={loc.label}
                        onSelect={() => {
                          updateParams({ location: locationFilter === loc.label ? null : loc.label })
                          setLocationPopoverOpen(false)
                        }}
                      >
                        <Check
                          className={cn('mr-2 h-4 w-4', locationFilter === loc.label ? 'opacity-100' : 'opacity-0')}
                        />
                        {loc.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        {/* Tag filter */}
        {initialTags.length > 0 && (
          <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={tagFilter.length ? 'secondary' : 'outline'}
                size="sm"
                className="gap-1.5 h-9"
                role="combobox"
              >
                <Tag className="h-3.5 w-3.5" />
                {tagFilter.length
                  ? `${tagFilter.length} tag${tagFilter.length > 1 ? 's' : ''}`
                  : 'Tags'}
                <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search tags..." />
                <CommandList>
                  <CommandEmpty>No tags found.</CommandEmpty>
                  <CommandGroup>
                    {initialTags.map((tag) => (
                      <CommandItem
                        key={tag.id}
                        value={tag.value}
                        onSelect={() => {
                          const next = tagFilter.includes(tag.value)
                            ? tagFilter.filter((v) => v !== tag.value)
                            : [...tagFilter, tag.value]
                          updateParams({ tag: next.length ? next : null })
                        }}
                      >
                        <Check
                          className={cn('mr-2 h-4 w-4', tagFilter.includes(tag.value) ? 'opacity-100' : 'opacity-0')}
                        />
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getTagColor(tag.value)}`}>
                          {tag.label}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
              {tagFilter.length > 0 && (
                <div className="border-t p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs text-muted-foreground"
                    onClick={() => updateParams({ tag: null })}
                  >
                    Clear selection
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}

        {/* Date presets */}
        <div className="flex items-center gap-1">
          {DATE_PRESETS.map((preset) => (
            <Button
              key={preset.value}
              variant={datePreset === preset.value ? 'secondary' : 'outline'}
              size="sm"
              className="h-9 text-xs px-2.5"
              onClick={() => handlePresetClick(preset.value)}
            >
              {preset.label}
            </Button>
          ))}

          {/* Custom date */}
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={datePreset === 'custom' ? 'secondary' : 'outline'}
                size="sm"
                className="h-9 gap-1.5 text-xs px-2.5"
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                Custom
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customStartDate}
                onSelect={handleCustomDateSelect}
                disabled={(date) => date > new Date()}
              />
            </PopoverContent>
          </Popover>

          {dateLabel && (
            <Badge
              variant="secondary"
              className="gap-1 text-xs cursor-pointer hover:bg-muted"
              onClick={clearDateFilter}
            >
              {dateLabel}
              <X className="h-3 w-3" />
            </Badge>
          )}
        </div>
      </div>

      {/* List */}
      {loading && posts.length === 0 ? (
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-sm">No job posts found.</p>
          <Link href="/dashboard/job-posts/new" className="mt-2">
            <Button variant="outline" size="sm">Add your first job post</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {posts.map((post: any) => (
            <JobPostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) }, false)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => updateParams({ page: String(page + 1) }, false)}>
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
