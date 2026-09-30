'use client'
import { useMutation } from '@apollo/client/react'
import { SocialHandleInput } from '@/components/SocialHandleInput'
import { extractHandle, isValidHandle, toStoredHandle, type SocialNetwork } from '@/lib/social-profiles'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { CREATE_JOB_PROFILE, UPDATE_JOB_PROFILE, JOB_PROFILES_QUERY } from '@/lib/graphql/queries'

interface ProfileForm {
  name: string
  email: string
  linkedin: string
  phone: string
  github: string
  address: string
  description: string
  details: string
  isDefault: boolean
}

interface Props {
  editProfile?: any
  onClose: () => void
}

/** Blocks submit on a value that cannot be a handle; the input shows why. */
const validHandle = (network: SocialNetwork) => (value: string) => {
  const handle = extractHandle(network, value)
  return !handle || isValidHandle(network, handle)
}

export function ProfileDialog({ editProfile, onClose }: Props) {
  const { register, handleSubmit, watch, setValue } = useForm<ProfileForm>({
    defaultValues: editProfile
      ? {
          name: editProfile.name,
          email: editProfile.email ?? '',
          // Older profiles may hold full URLs; edit them as handles.
          linkedin: extractHandle('linkedin', editProfile.linkedin),
          phone: editProfile.phone ?? '',
          github: extractHandle('github', editProfile.github),
          address: editProfile.address ?? '',
          description: editProfile.description ?? '',
          details: editProfile.details ?? '',
          isDefault: editProfile.isDefault ?? false,
        }
      : { name: '', email: '', linkedin: '', phone: '', github: '', address: '', description: '', details: '', isDefault: false },
  })

  const [create] = useMutation(CREATE_JOB_PROFILE, { refetchQueries: [JOB_PROFILES_QUERY] })
  const [update] = useMutation(UPDATE_JOB_PROFILE, { refetchQueries: [JOB_PROFILES_QUERY] })

  const onSubmit = async (data: ProfileForm) => {
    const input = {
      ...data,
      linkedin: toStoredHandle('linkedin', data.linkedin),
      phone: data.phone || null,
      github: toStoredHandle('github', data.github),
      address: data.address || null,
      description: data.description || null,
      email: data.email,
    }
    if (editProfile) {
      await update({ variables: { id: editProfile.id, input } })
    } else {
      await create({ variables: { input } })
    }
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-1.5">
        <Label>Profile Name *</Label>
        <Input {...register('name', { required: true })} placeholder="e.g. Software Engineer Profile" />
      </div>
      <div className="grid gap-1.5">
        <Label>Email *</Label>
        <Input {...register('email', { required: true })} type="email" placeholder="you@example.com" />
      </div>
      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <Label>LinkedIn <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
          <SocialHandleInput network="linkedin" {...register('linkedin', { validate: validHandle('linkedin') })} />
        </div>
        <div className="grid gap-1.5">
          <Label>GitHub <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
          <SocialHandleInput network="github" {...register('github', { validate: validHandle('github') })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Phone <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
          <Input {...register('phone')} placeholder="+1 (555) 000-0000" />
        </div>
        <div className="grid gap-1.5">
          <Label>Address</Label>
          <Input {...register('address')} placeholder="City, Country" />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label>Description / Bio</Label>
        <Textarea {...register('description')} rows={3} placeholder="Brief professional summary for this profile..." />
      </div>
      <div className="grid gap-1.5">
        <Label>Details *</Label>
        <Textarea {...register('details', { required: true })} rows={5} placeholder="Additional details, notes, or context for this profile..." />
      </div>
      <div className="flex items-center gap-2">
        <Switch id="isDefault" checked={watch('isDefault')} onCheckedChange={(v) => setValue('isDefault', v)} />
        <Label htmlFor="isDefault" className="text-sm cursor-pointer">Set as default profile</Label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">{editProfile ? 'Update Profile' : 'Create Profile'}</Button>
      </div>
    </form>
  )
}
