'use client'
import { useForm } from 'react-hook-form'
import { useMutation, useLazyQuery, useQuery } from '@apollo/client/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { X, Plus, Check, ChevronsUpDown, CirclePlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { Combobox } from '@/components/ComboBox'
import { getAllCompanies } from '@/actions/company.actions'
import { getAllJobLocations } from '@/actions/jobLocation.actions'
import { createLocation } from '@/actions/job.actions'
import { toast } from '@/components/ui/use-toast'
import { getJobSourceList } from '@/actions/jobSource.actions'
import { JOB_TYPES } from '@/models/job.model'
import { CREATE_JOB_POST, UPDATE_JOB_POST, JOB_POSTS_QUERY, JOB_POST_QUERY, CHECK_DUPLICATE_JOB_POSTS, JOB_POST_TAGS_QUERY, CREATE_JOB_POST_TAG } from '@/lib/graphql/queries'
import { JobPostTagInput, JobPostTagOption } from './JobPostTagInput'
import TiptapEditor from '@/components/TiptapEditor'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  company: z.string().min(1, 'Company is required'),
  locations: z.array(z.string()),
  postedAt: z.string().min(1, 'Posted date is required'),
  salary: z.string().optional(),
  sourceUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  jobType: z.string().optional(),
  jobSource: z.string().optional(),
  tagIds: z.array(z.string()),
})

type FormData = z.infer<typeof schema>

interface JobPostFormProps {
  editPost?: {
    id: string
    title: string
    description: string
    postedBy: string
    postedAt: string
    salary?: string | null
    locations?: string[] | null
    sourceUrl?: string | null
    jobType?: string | null
    jobSource?: string | null
    tags?: { id: string; label: string; value: string }[]
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export function JobPostForm({ editPost, onSuccess, onCancel }: JobPostFormProps) {
  const router = useRouter()
  const [companies, setCompanies] = useState<any[]>([])
  const [locationOptions, setLocationOptions] = useState<any[]>([])
  const [jobSources, setJobSources] = useState<any[]>([])
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false)
  const [locationSearch, setLocationSearch] = useState('')
  const [isCreatingLocation, setIsCreatingLocation] = useState(false)

  const { data: tagsData, refetch: refetchTags } = useQuery(JOB_POST_TAGS_QUERY)
  const allTags: JobPostTagOption[] = (tagsData as any)?.jobPostTags ?? []
  const [createTag] = useMutation(CREATE_JOB_POST_TAG)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editPost
      ? {
          title: editPost.title,
          description: editPost.description,
          postedAt: editPost.postedAt.slice(0, 10),
          salary: editPost.salary ?? '',
          sourceUrl: editPost.sourceUrl ?? '',
          jobType: editPost.jobType ?? '',
          company: '',
          locations: [],
          jobSource: '',
          tagIds: editPost.tags?.map((t) => t.id) ?? [],
        }
      : {
          title: '',
          description: '',
          company: '',
          locations: [],
          salary: '',
          sourceUrl: '',
          jobType: '',
          jobSource: '',
          postedAt: format(new Date(), 'yyyy-MM-dd'),
          tagIds: [],
        },
  })

  useEffect(() => {
    let active = true
    ;(async () => {
      const [c, l, s] = await Promise.all([
        getAllCompanies(),
        getAllJobLocations(),
        getJobSourceList(1, 100),
      ])
      if (!active) return
      const companyList: any[] = Array.isArray(c) ? c : []
      const locationList: any[] = Array.isArray(l) ? l : []
      const sourceList: any[] = Array.isArray(s?.data) ? s.data : []
      if (editPost) {
        const matchedCompany = companyList.find((co) => co.label === editPost.postedBy)
        if (matchedCompany) {
          form.setValue('company', matchedCompany.id)
        } else if (editPost.postedBy) {
          const synthetic = { id: `__${editPost.postedBy}__`, label: editPost.postedBy, value: editPost.postedBy }
          companyList.unshift(synthetic)
          form.setValue('company', synthetic.id)
        }

        if (editPost.locations?.length) {
          const locIds: string[] = []
          for (const loc of editPost.locations) {
            const matched = locationList.find((lo) => lo.label === loc)
            if (matched) {
              locIds.push(matched.id)
            } else {
              const synthetic = { id: `__${loc}__`, label: loc, value: loc }
              locationList.unshift(synthetic)
              locIds.push(synthetic.id)
            }
          }
          form.setValue('locations', locIds)
        }

        if (editPost.jobSource) {
          const matchedSource = sourceList.find((s) => s.label === editPost.jobSource)
          if (matchedSource) {
            form.setValue('jobSource', matchedSource.id)
          } else {
            const synthetic = { id: `__${editPost.jobSource}__`, label: editPost.jobSource, value: editPost.jobSource }
            sourceList.unshift(synthetic)
            form.setValue('jobSource', synthetic.id)
          }
        }
      }

      setCompanies([...companyList])
      setLocationOptions([...locationList])
      setJobSources([...sourceList])
    })()
    return () => { active = false }
  }, [editPost]) // eslint-disable-line react-hooks/exhaustive-deps

  const [checkDuplicates, { data: duplicateData }] = useLazyQuery<{
    checkDuplicateJobPosts: { id: string; title: string; postedBy: string; postedAt: string; sourceUrl?: string | null; status: string }[]
  }>(CHECK_DUPLICATE_JOB_POSTS)
  const duplicates = duplicateData?.checkDuplicateJobPosts ?? []

  const titleValue = form.watch('title')
  const companyValue = form.watch('company')

  useEffect(() => {
    if (!titleValue || titleValue.length < 2 || !companyValue || companies.length === 0) return
    const companyLabel = companies.find((c) => c.id === companyValue)?.label ?? companyValue
    const timer = setTimeout(() => {
      checkDuplicates({
        variables: { title: titleValue, postedBy: companyLabel, excludeId: editPost?.id ?? undefined },
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [titleValue, companyValue, companies]) // eslint-disable-line react-hooks/exhaustive-deps

  const [createPost] = useMutation(CREATE_JOB_POST, { refetchQueries: [JOB_POSTS_QUERY] })
  const [updatePost] = useMutation(UPDATE_JOB_POST, { refetchQueries: [JOB_POSTS_QUERY, JOB_POST_QUERY] })

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

  const onSubmit = async (data: FormData) => {
    const selectedCompany = companies.find((c) => c.id === data.company)
    const selectedJobSource = jobSources.find((s) => s.id === data.jobSource)
    const locationLabels = (data.locations ?? []).map(
      (id) => locationOptions.find((l) => l.id === id)?.label ?? id,
    )

    const input = {
      title: data.title,
      description: data.description,
      postedBy: selectedCompany?.label ?? data.company,
      postedAt: new Date(data.postedAt + 'T00:00:00').toISOString(),
      salary: data.salary || null,
      locations: locationLabels,
      sourceUrl: data.sourceUrl || null,
      jobType: data.jobType || null,
      jobSource: (selectedJobSource?.label ?? data.jobSource) || null,
      tagIds: data.tagIds ?? [],
    }

    if (editPost) {
      await updatePost({ variables: { id: editPost.id, input } })
    } else {
      await createPost({ variables: { input } })
    }

    onSuccess ? onSuccess() : router.push('/dashboard/job-posts')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Senior Software Engineer" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {duplicates.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 space-y-2">
            <p className="text-sm font-semibold text-amber-800">
              Possible duplicate{duplicates.length > 1 ? 's' : ''} found
            </p>
            {duplicates.map((dup) => (
              <div key={dup.id} className="flex items-start justify-between gap-2 text-sm text-amber-700">
                <span>
                  <span className="font-medium">{dup.postedBy}</span> posted &ldquo;{dup.title}&rdquo;{' '}
                  {formatDistanceToNow(new Date(dup.postedAt.slice(0, 10) + 'T00:00:00'), { addSuffix: true })}
                  {dup.status !== 'active' && (
                    <span className="ml-1 text-amber-500">({dup.status})</span>
                  )}
                </span>
                {dup.sourceUrl && (
                  <a
                    href={dup.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 underline underline-offset-2 hover:text-amber-900"
                  >
                    View post ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Company *</FormLabel>
                <FormControl>
                  <Combobox options={companies} field={field} creatable />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="locations"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Locations</FormLabel>
                <div className="space-y-1.5">
                  {field.value.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {field.value.map((locId: string) => {
                        const loc = locationOptions.find((l) => l.id === locId)
                        return (
                          <Badge key={locId} variant="secondary" className="gap-1 pr-1">
                            {loc?.label ?? locId}
                            <button
                              type="button"
                              onClick={() => field.onChange(field.value.filter((id: string) => id !== locId))}
                              className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                  <Popover open={locationPopoverOpen} onOpenChange={(open) => { setLocationPopoverOpen(open); if (!open) setLocationSearch('') }}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" type="button">
                        <Plus className="h-3 w-3" />
                        Add location
                        <ChevronsUpDown className="h-3 w-3 opacity-50 ml-auto" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search or create..."
                          value={locationSearch}
                          onValueChange={setLocationSearch}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {locationSearch.trim() ? (
                              <button
                                type="button"
                                disabled={isCreatingLocation}
                                className="flex w-full items-center gap-1.5 px-2 py-1.5 text-sm italic cursor-pointer hover:bg-accent"
                                onClick={async () => {
                                  const label = locationSearch.trim()
                                  if (!label) return
                                  setIsCreatingLocation(true)
                                  try {
                                    const res = await createLocation(label)
                                    const loc = res?.data
                                    if (!res?.success || !loc?.id) {
                                      toast({ variant: 'destructive', title: 'Error!', description: res?.message ?? 'Failed to create location.' })
                                      return
                                    }
                                    setLocationOptions((prev) =>
                                      prev.find((l) => l.id === loc.id) ? prev : [...prev, loc]
                                    )
                                    // The server returns the existing row when the name is taken,
                                    // which may already be selected.
                                    if (!field.value.includes(loc.id)) {
                                      field.onChange([...field.value, loc.id])
                                    }
                                    setLocationSearch('')
                                    setLocationPopoverOpen(false)
                                  } finally {
                                    setIsCreatingLocation(false)
                                  }
                                }}
                              >
                                {isCreatingLocation
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                                  : <CirclePlus className="h-3.5 w-3.5 shrink-0" />
                                }
                                <span>Create &ldquo;<span className="font-semibold text-foreground">{locationSearch}</span>&rdquo;</span>
                              </button>
                            ) : (
                              <p className="px-2 py-1.5 text-sm text-muted-foreground">No locations found.</p>
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {locationOptions
                              .filter((l) => !field.value.includes(l.id))
                              .map((l) => (
                                <CommandItem
                                  key={l.id}
                                  value={l.value ?? l.label}
                                  onSelect={() => {
                                    field.onChange([...field.value, l.id])
                                    setLocationSearch('')
                                    setLocationPopoverOpen(false)
                                  }}
                                >
                                  <Check className="mr-2 h-4 w-4 opacity-0" />
                                  {l.label}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="postedAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Posted Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salary (optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. $120k–$150k" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="jobSource"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Job Source</FormLabel>
                <FormControl>
                  <Combobox options={jobSources} field={field} creatable />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sourceUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source URL (optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="jobType"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Job Type</FormLabel>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value ?? ''}
                className="flex gap-4"
              >
                {Object.entries(JOB_TYPES).map(([key, label]) => (
                  <FormItem key={key} className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value={key} />
                    </FormControl>
                    <FormLabel className="font-normal">{label}</FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tagIds"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <JobPostTagInput
                  value={field.value}
                  onChange={field.onChange}
                  tags={allTags}
                  onCreateTag={handleCreateTag}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel id="job-description-label">Job Description *</FormLabel>
              <FormControl>
                <TiptapEditor field={field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onCancel ? onCancel() : router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : editPost ? 'Update Post' : 'Save Job Post'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
