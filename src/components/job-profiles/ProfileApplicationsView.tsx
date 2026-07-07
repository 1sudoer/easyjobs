'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useQuery, useMutation } from '@apollo/client/react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Search,
  MapPin,
  CheckCircle2,
  Loader2,
  CalendarIcon,
  X,
  PanelRight,
  Globe,
} from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { ProfileLayoutHeader } from './ProfileLayoutHeader'
import { JobPostsPanel } from './JobPostsPanel'
import { JOB_APPLICATIONS_QUERY, UPDATE_APPLICATION_STATUS, DELETE_APPLICATION } from '@/lib/graphql/queries'

const APPLICATION_STATUSES = [
  'saved', 'applied', 'phone_screen', 'interview', 'technical_test', 'offer', 'rejected', 'withdrawn',
]

const STATUS_COLORS: Record<string, string> = {
  saved: 'bg-blue-100 text-blue-800',
  applied: 'bg-indigo-100 text-indigo-800',
  phone_screen: 'bg-yellow-100 text-yellow-800',
  interview: 'bg-orange-100 text-orange-800',
  technical_test: 'bg-purple-100 text-purple-800',
  offer: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-600',
}

const CV_STATUS_ICONS: Record<string, React.ReactNode> = {
  done: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
  generating: <Loader2 className="h-3.5 w-3.5 animate-spin text-yellow-500" />,
  pending: <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />,
}

const DATE_PRESETS = [
  { value: '1d', label: '1 day' },
  { value: '3d', label: '3 days' },
  { value: '1w', label: '1 week' },
] as const

type DatePreset = typeof DATE_PRESETS[number]['value'] | 'custom'

const PAGE_SIZE = 20

function localMidnightDaysAgo(daysAgo: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return d
}

function startDateFromPreset(preset: DatePreset, fromDate: string | null): string | undefined {
  if (preset === '1d') return localMidnightDaysAgo(1).toISOString()
  if (preset === '3d') return localMidnightDaysAgo(3).toISOString()
  if (preset === '1w') return localMidnightDaysAgo(7).toISOString()
  if (preset === 'custom' && fromDate) {
    return new Date(fromDate + 'T00:00:00').toISOString()
  }
  return undefined
}

function formatLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function ProfileApplicationsView({ initialLocations = [] }: { initialLocations?: string[] }) {
  const { id: profileId } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // ── URL-based filter state ────────────────────────────────────────────────
  const urlQuery = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? 'all'
  const panelOpen = searchParams.get('posts') === 'true'
  const cvReady = searchParams.get('cvReady') === '1'
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const datePreset = (searchParams.get('datePreset') as DatePreset | null)
  const fromDate = searchParams.get('fromDate')

  // ── Local search input — immediate for UI, debounced to URL ──────────────
  const [searchInput, setSearchInput] = useState(urlQuery)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchInput) {
        params.set('q', searchInput)
      } else {
        params.delete('q')
      }
      params.delete('page') // reset page when search changes
      router.replace(params.size ? `${pathname}?${params.toString()}` : pathname)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── URL update helper for non-search filters ──────────────────────────────
  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, val] of Object.entries(updates)) {
        if (val === null || val === '') {
          params.delete(key)
        } else {
          params.set(key, val)
        }
      }
      if (!('page' in updates)) params.delete('page')
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    },
    [searchParams, router, pathname],
  )

  // ── Fetch all profile applications (server filters: status/cvReady/date) ─
  const startDate = datePreset ? startDateFromPreset(datePreset, fromDate) : undefined

  const serverFilter = {
    profileId,
    ...(status !== 'all' ? { status } : {}),
    ...(cvReady ? { cvReady: true } : {}),
    ...(startDate ? { startDate } : {}),
    // search is intentionally omitted — filtered client-side
  }

  const { data, loading, refetch: refetchApplications } = useQuery(JOB_APPLICATIONS_QUERY, {
    variables: { filter: serverFilter, page: 1, limit: 500 },
    fetchPolicy: 'cache-and-network',
  })

  const [updateStatus] = useMutation(UPDATE_APPLICATION_STATUS, {
    refetchQueries: [JOB_APPLICATIONS_QUERY],
  })
  const [deleteApp] = useMutation(DELETE_APPLICATION, {
    refetchQueries: [JOB_APPLICATIONS_QUERY],
  })

  const allApplications: any[] = useMemo(() => (data as any)?.jobApplications?.items ?? [], [data])

  // ── Client-side search filter (title + company) ──────────────────────────
  const filteredApplications = useMemo(() => {
    const q = searchInput.trim().toLowerCase()
    if (!q) return allApplications
    return allApplications.filter(
      (app) =>
        app.jobPost.title.toLowerCase().includes(q) ||
        app.jobPost.postedBy?.toLowerCase().includes(q),
    )
  }, [allApplications, searchInput])

  // ── Client-side pagination ────────────────────────────────────────────────
  const totalFiltered = filteredApplications.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const applications = filteredApplications.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  // ── Date label for badge ──────────────────────────────────────────────────
  const dateLabel = (() => {
    if (!datePreset) return null
    if (datePreset !== 'custom') return DATE_PRESETS.find((p) => p.value === datePreset)?.label
    if (fromDate) return `From ${format(new Date(fromDate + 'T00:00:00'), 'MMM d')}`
    return 'Custom'
  })()

  function handleCustomDateSelect(date: Date | undefined) {
    if (!date) return
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    setParams({ datePreset: 'custom', fromDate: `${yyyy}-${mm}-${dd}` })
  }

  const customCalendarValue = fromDate ? new Date(fromDate + 'T00:00:00') : undefined

  return (
    <div className="col-span-3 space-y-4">
      <ProfileLayoutHeader />

      <div className="flex gap-4 items-start">
        {/* ── Main content ───────────────────────────────────────────── */}
        <div className="flex-[3] min-w-0 space-y-4">

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {totalFiltered} application{totalFiltered !== 1 ? 's' : ''}
          {searchInput && ` matching "${searchInput}"`}
        </p>
        <Button
          variant={panelOpen ? 'secondary' : 'outline'}
          size="sm"
          className="gap-1.5 h-8 shrink-0"
          onClick={() => {
            const p = new URLSearchParams(searchParams.toString())
            panelOpen ? p.delete('posts') : p.set('posts', 'true')
            router.replace(`${pathname}?${p.toString()}`)
          }}
        >
          <PanelRight className="h-3.5 w-3.5" />
          {panelOpen ? 'Hide Jobs' : 'Browse Jobs'}
        </Button>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search — local state, debounced URL write */}
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title or company..."
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchInput('')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status */}
        <Select value={status} onValueChange={(v) => setParams({ status: v === 'all' ? null : v })}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {APPLICATION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date presets */}
        <div className="flex items-center gap-1">
          {DATE_PRESETS.map((preset) => (
            <Button
              key={preset.value}
              variant={datePreset === preset.value ? 'secondary' : 'outline'}
              size="sm"
              className="h-9 text-xs px-2.5"
              onClick={() =>
                setParams(
                  datePreset === preset.value
                    ? { datePreset: null, fromDate: null }
                    : { datePreset: preset.value, fromDate: null },
                )
              }
            >
              {preset.label}
            </Button>
          ))}

          <Popover>
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
                selected={customCalendarValue}
                onSelect={handleCustomDateSelect}
                disabled={(date) => date > new Date()}
              />
            </PopoverContent>
          </Popover>

          {dateLabel && (
            <Badge
              variant="secondary"
              className="gap-1 text-xs cursor-pointer hover:bg-muted"
              onClick={() => setParams({ datePreset: null, fromDate: null })}
            >
              {dateLabel}
              <X className="h-3 w-3" />
            </Badge>
          )}
        </div>

        {/* CV Ready toggle */}
        <Button
          variant={cvReady ? 'secondary' : 'outline'}
          size="sm"
          className="gap-1.5 h-9"
          onClick={() => setParams({ cvReady: cvReady ? null : '1' })}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          CV Ready
        </Button>
      </div>

      {/* ── Application list ───────────────────────────────────────────── */}
      {loading && allApplications.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          {searchInput ? (
            <p className="text-muted-foreground text-sm">
              No applications match &ldquo;{searchInput}&rdquo;.
            </p>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">No applications for this profile yet.</p>
              <Link href="/dashboard/job-posts" className="mt-2">
                <Button variant="outline" size="sm">Browse Job Posts</Button>
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app: any) => (
            <div
              key={app.id}
              className="rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Link href={`/dashboard/applications/${app.id}`} className="hover:underline">
                    <h3 className="font-medium text-sm leading-tight">{app.jobPost.title}</h3>
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                    <span>{app.jobPost.postedBy}</span>
                    {app.jobPost.jobSource && (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3 shrink-0" />
                        {app.jobPost.jobSource}
                      </span>
                    )}
                    {app.jobPost.locations?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {app.jobPost.locations.join(' · ')}
                      </span>
                    )}
                    <span>Saved {format(new Date(app.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {app.cvGenerationStatus && CV_STATUS_ICONS[app.cvGenerationStatus]}
                  <Badge
                    className={`text-xs ${STATUS_COLORS[app.currentStatus] ?? 'bg-muted'}`}
                    variant="outline"
                  >
                    {formatLabel(app.currentStatus)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {APPLICATION_STATUSES.filter((s) => s !== app.currentStatus)
                  .slice(0, 3)
                  .map((s) => (
                    <Button
                      key={s}
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs px-2 text-muted-foreground hover:text-foreground"
                      onClick={() => updateStatus({ variables: { id: app.id, status: s } })}
                    >
                      → {formatLabel(s)}
                    </Button>
                  ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2 text-destructive ml-auto"
                  onClick={() => deleteApp({ variables: { id: app.id } })}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => setParams({ page: String(safePage - 1) })}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {safePage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages}
            onClick={() => setParams({ page: String(safePage + 1) })}
          >
            Next
          </Button>
        </div>
      )}
      </div>

        {/* ── Right panel (3:1 ratio, sticky) ──────────────────────── */}
        {panelOpen && (
          <div className="flex-1 sticky top-4 self-start" style={{ height: 'calc(100vh - 7rem)' }}>
            <JobPostsPanel
              profileId={profileId}
              initialLocations={initialLocations}
              onHide={() => {
                const p = new URLSearchParams(searchParams.toString())
                p.delete('posts')
                router.replace(`${pathname}?${p.toString()}`)
              }}
              onSaved={() => refetchApplications()}
            />
          </div>
        )}
      </div>
    </div>
  )
}
