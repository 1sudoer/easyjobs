'use client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

type Owner = { id: string; name: string; imageUrl?: string | null }

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

/**
 * "Created by …" with the creator's avatar. Job profiles are shared by every
 * signed-in user, so this is how you tell whose profile you are looking at.
 */
export function ProfileCreator({
  owner,
  isOwner,
  className,
}: {
  owner?: Owner | null
  isOwner?: boolean
  className?: string
}) {
  if (!owner) return null
  return (
    <div className={cn('flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground', className)}>
      <Avatar className="h-5 w-5 shrink-0">
        {owner.imageUrl ? <AvatarImage src={owner.imageUrl} alt="" /> : null}
        <AvatarFallback className="text-[9px]">{initials(owner.name) || '?'}</AvatarFallback>
      </Avatar>
      <span className="truncate">
        Created by <span className="font-medium text-foreground">{isOwner ? 'you' : owner.name}</span>
      </span>
    </div>
  )
}
