'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useMutation, useApolloClient } from '@apollo/client/react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Search, RefreshCw, X, Clock, Sparkles, MapPin, Check, ChevronsUpDown, Globe } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { JOB_POSTS_QUERY, SAVE_JOB_POST_TO_APPLY, JOB_APPLICATIONS_QUERY } from '@/lib/graphql/queries'

/** Background poll interval in milliseconds. */
const POLL_INTERVAL_MS = 3 * 60 * 1000 // 3 minutes

interface Post {
  id: string
  title: string
  postedBy: string
  postedAt: string
  createdAt: string
  locations?: string[]
  salary?: string | null
  jobSource?: string | null
}

interface JobPostsPanelProps {
  profileId: string
  initialLocations: string[]
  onHide: () => void
  onSaved: () => void
}

export function JobPostsPanel({ profileId, initialLocations, onHide, onSaved }: JobPostsPanelProps) {
  const apolloClient = useApolloClient()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState<string[]>([])
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [checked, setChecked] = useState<Set<string>>(new Set())

  // New-jobs tracking (discovered in background polls)
  const [newPosts, setNewPosts] = useState<Post[]>([])
  // IDs of posts discovered via background poll — persists through manual refresh
  const [newPostIds, setNewPostIds] = useState<Set<string>>(new Set())
  const [dismissedNewIds, setDismissedNewIds] = useState<Set<string>>(new Set())
  const lastPollTimeRef = useRef<Date>(new Date())
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date())
  const [pollLoading, setPollLoading] = useState(false)

  // Saving state
  const [saving, setSaving] = useState(false)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [locationFilter])

  // Main query — excludes jobs already saved to this profile
  const baseFilter = {
    status: 'active',
    excludeProfileIds: [profileId],
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(locationFilter.length ? { locations: locationFilter } : {}),
  }

  const { data, loading, refetch } = useQuery(JOB_POSTS_QUERY, {
    variables: { filter: baseFilter, page, limit: 20 },
    fetchPolicy: 'cache-and-network',
  })

  // Track when main query delivers fresh data
  const prevDataRef = useRef<unknown>(null)
  useEffect(() => {
    if (data && data !== prevDataRef.current) {
      prevDataRef.current = data
      lastPollTimeRef.current = new Date()
      setLastRefreshedAt(new Date())
    }
  }, [data])

  const [saveToApply] = useMutation(SAVE_JOB_POST_TO_APPLY, {
    refetchQueries: [JOB_POSTS_QUERY, JOB_APPLICATIONS_QUERY],
  })

  const posts: Post[] = useMemo(() => (data as any)?.jobPosts?.items ?? [], [data])
  const totalPages = (data as any)?.jobPosts?.totalPages ?? 1

  // Background poll — fetches only jobs created after the last poll time, respecting active location filter
  const poll = useCallback(async () => {
    setPollLoading(true)
    try {
      const result = await apolloClient.query({
        query: JOB_POSTS_QUERY,
        variables: {
          filter: {
            status: 'active',
            excludeProfileIds: [profileId],
            createdAfter: lastPollTimeRef.current.toISOString(),
            ...(locationFilter.length ? { locations: locationFilter } : {}),
          },
          page: 1,
          limit: 50,
        },
        fetchPolicy: 'network-only',
      })
      const incoming: Post[] = (result.data as any)?.jobPosts?.items ?? []
      if (incoming.length > 0) {
        setNewPosts((prev) => {
          const existingIds = new Set([...prev.map((p) => p.id), ...posts.map((p) => p.id)])
          const trulyNew = incoming.filter((p) => !existingIds.has(p.id))
          if (trulyNew.length > 0) {
            setNewPostIds((ids) => {
              const next = new Set(ids)
              trulyNew.forEach((p) => next.add(p.id))
              return next
            })
            return [...trulyNew, ...prev]
          }
          return prev
        })
      }
      lastPollTimeRef.current = new Date()
    } finally {
      setPollLoading(false)
    }
  }, [apolloClient, profileId, posts, locationFilter])

  useEffect(() => {
    const interval = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [poll])

  function dismissNew(id: string) {
    setDismissedNewIds((prev) => new Set([...prev, id]))
  }

  // Manual refresh — moves new posts to main query, keeps newPostIds so badges persist
  function handleRefetch() {
    setNewPosts([])
    setDismissedNewIds(new Set())
    setChecked(new Set())
    setPage(1)
    lastPollTimeRef.current = new Date()
    refetch()
  }

  // Checkbox helpers
  const allPosts = [...newPosts, ...posts]
  const allSaveableIds = allPosts.map((p) => p.id)
  const allChecked = allSaveableIds.length > 0 && allSaveableIds.every((id) => checked.has(id))

  function toggleCheck(id: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setChecked((prev) => {
      const next = new Set(prev)
      if (allChecked) {
        allSaveableIds.forEach((id) => next.delete(id))
      } else {
        allSaveableIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  async function saveOne(postId: string) {
    setSaving(true)
    try {
      await saveToApply({ variables: { jobPostId: postId, profileId } })
      setChecked((prev) => { const next = new Set(prev); next.delete(postId); return next })
      // Remove from new-posts list so it disappears from panel immediately
      setNewPosts((prev) => prev.filter((p) => p.id !== postId))
      setNewPostIds((prev) => { const next = new Set(prev); next.delete(postId); return next })
      onSaved()
      toast({ variant: 'success', description: 'Job saved to this profile.' })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e?.message ?? 'Could not save.' })
    } finally {
      setSaving(false)
    }
  }

  async function saveBulk() {
    const ids = [...checked]
    setSaving(true)
    const savedIds = new Set<string>()
    for (const id of ids) {
      try {
        await saveToApply({ variables: { jobPostId: id, profileId } })
        savedIds.add(id)
      } catch {}
    }
    const saved = savedIds.size
    setChecked(new Set())
    setNewPosts((prev) => prev.filter((p) => !savedIds.has(p.id)))
    setNewPostIds((prev) => { const next = new Set(prev); savedIds.forEach((id) => next.delete(id)); return next })
    onSaved()
    setSaving(false)
    toast({ variant: 'success', description: `${saved} job${saved !== 1 ? 's' : ''} saved.` })
  }

  const checkedCount = checked.size
  const newCount = newPosts.filter((p) => !dismissedNewIds.has(p.id)).length

  return (
    <div className="flex flex-col h-full border rounded-lg bg-background overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-3 py-2 border-b shrink-0">
        <span className="font-medium text-sm flex-1 flex items-center gap-1.5">
          Job Posts
          {newCount > 0 && (
            <Badge className="h-4 px-1.5 text-xs bg-green-500 text-white border-0">
              {newCount} new
            </Badge>
          )}
        </span>
        {pollLoading && (
          <span className="text-xs text-muted-foreground animate-pulse">syncing…</span>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Refresh" onClick={handleRefetch}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Hide panel" onClick={onHide}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* ── Last refreshed ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-3 py-1 border-b shrink-0 bg-muted/30">
        <Clock className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Updated {formatDistanceToNow(lastRefreshedAt, { addSuffix: true })}
          {' · '}auto-refreshes every 3 min
        </span>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div className="px-3 py-2 border-b shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search title or company…"
            className="pl-8 h-7 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-2 top-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch('')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Location multi-select filter ─────────────────────────────────── */}
      {initialLocations.length > 0 && (
        <div className="px-3 py-1.5 border-b shrink-0">
          <Popover open={locationPopoverOpen} onOpenChange={setLocationPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={locationFilter.length ? 'secondary' : 'outline'}
                size="sm"
                className="h-7 text-xs w-full justify-between"
                role="combobox"
              >
                <span className="flex items-center gap-1 min-w-0">
                  <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    {locationFilter.length === 0
                      ? 'All locations'
                      : locationFilter.length === 1
                        ? locationFilter[0]
                        : `${locationFilter.length} locations`}
                  </span>
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  {locationFilter.length > 0 && (
                    <X
                      className="h-3 w-3 opacity-60 hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); setLocationFilter([]); setPage(1) }}
                    />
                  )}
                  <ChevronsUpDown className="h-3 w-3 opacity-50" />
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search locations…" className="h-8 text-xs" />
                <CommandList>
                  <CommandEmpty className="text-xs py-2 text-center text-muted-foreground">
                    No locations found.
                  </CommandEmpty>
                  <CommandGroup>
                    {initialLocations.map((loc) => (
                      <CommandItem
                        key={loc}
                        value={loc}
                        onSelect={() => {
                          setLocationFilter((prev) =>
                            prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
                          )
                          setPage(1)
                        }}
                      >
                        <Check
                          className={cn('mr-2 h-3.5 w-3.5', locationFilter.includes(loc) ? 'opacity-100' : 'opacity-0')}
                        />
                        <span className="text-xs">{loc}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
                {locationFilter.length > 0 && (
                  <div className="border-t p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-6 text-xs text-muted-foreground"
                      onClick={() => { setLocationFilter([]); setPage(1) }}
                    >
                      Clear selection
                    </Button>
                  </div>
                )}
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* ── Bulk action bar ──────────────────────────────────────────────── */}
      {checkedCount > 0 && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/60 border-b shrink-0">
          <span className="text-xs text-muted-foreground">{checkedCount} selected</span>
          <Button size="sm" className="h-6 text-xs px-2.5" onClick={saveBulk} disabled={saving}>
            {saving ? 'Saving…' : `Save ${checkedCount}`}
          </Button>
        </div>
      )}

      {/* ── Select-all row ───────────────────────────────────────────────── */}
      {allPosts.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b shrink-0">
          <Checkbox
            id="panel-select-all"
            checked={allChecked}
            onCheckedChange={toggleAll}
            className="h-3.5 w-3.5"
          />
          <label
            htmlFor="panel-select-all"
            className="text-xs text-muted-foreground cursor-pointer select-none"
          >
            Select all on page
          </label>
        </div>
      )}

      {/* ── Job list ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading && posts.length === 0 && newPosts.length === 0 ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded" />
            ))}
          </div>
        ) : allPosts.length === 0 ? (
          <div className="flex items-center justify-center h-24 px-4 text-center">
            <p className="text-xs text-muted-foreground">No unsaved active jobs found.</p>
          </div>
        ) : (
          <div className="divide-y">
            {/* New jobs shown first (from background poll, not yet in main query) */}
            {newPosts.map((post) => (
              <PostRow
                key={post.id}
                post={post}
                isNew={!dismissedNewIds.has(post.id)}
                checked={checked.has(post.id)}
                onCheck={() => toggleCheck(post.id)}
                onSave={() => saveOne(post.id)}
                onDismissNew={() => dismissNew(post.id)}
                saving={saving}
              />
            ))}
            {/* Main paginated list — show New badge if discovered via background poll */}
            {posts.map((post) => (
              <PostRow
                key={post.id}
                post={post}
                isNew={newPostIds.has(post.id) && !dismissedNewIds.has(post.id)}
                checked={checked.has(post.id)}
                onCheck={() => toggleCheck(post.id)}
                onSave={() => saveOne(post.id)}
                onDismissNew={() => dismissNew(post.id)}
                saving={saving}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs px-2"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>
          <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs px-2"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

// ── PostRow sub-component ──────────────────────────────────────────────────

interface PostRowProps {
  post: Post
  isNew: boolean
  checked: boolean
  onCheck: () => void
  onSave: () => void
  onDismissNew: () => void
  saving: boolean
}

function PostRow({ post, isNew, checked, onCheck, onSave, onDismissNew, saving }: PostRowProps) {
  return (
    <div
      className={`flex items-start gap-2 px-3 py-2.5 transition-colors hover:bg-muted/30 ${isNew ? 'bg-green-50/60 dark:bg-green-950/20' : ''}`}
      onClick={isNew ? onDismissNew : undefined}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onCheck}
        className="mt-0.5 h-3.5 w-3.5 shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link
            href={`/dashboard/job-posts/${post.id}`}
            className="text-xs font-medium leading-snug line-clamp-1 hover:underline underline-offset-2"
            onClick={(e) => e.stopPropagation()}
          >
            {post.title}
          </Link>
          {isNew && (
            <Badge className="h-3.5 px-1 text-[10px] bg-green-500 text-white border-0 shrink-0">
              <Sparkles className="h-2.5 w-2.5 mr-0.5" />
              New
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground truncate">{post.postedBy}</p>
          {post.jobSource && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <Globe className="h-3 w-3 shrink-0" />
              {post.jobSource}
            </span>
          )}
        </div>
        {post.locations && post.locations.length > 0 && (
          <p className="text-xs text-muted-foreground truncate">{post.locations.join(' · ')}</p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="h-6 text-xs px-2 shrink-0"
        onClick={(e) => { e.stopPropagation(); onSave() }}
        disabled={saving}
      >
        Save
      </Button>
    </div>
  )
}
