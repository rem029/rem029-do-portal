import { FormSubmission } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'

export function SubmissionCreator({ doc }: { doc: FormSubmission }) {
  const creator = (doc as any).created_by
  if (!creator) return null

  const creatorDisplay =
    typeof creator === 'object'
      ? [creator.full_name || creator.name, creator.email ? `[${creator.email}]` : '']
          .filter(Boolean)
          .join(' ')
      : String(creator)

  return (
    <div className="mb-3 border-b border-base-200 pb-3">
      <label
        className={cn(
          'block text-xs font-bold text-primary/70 uppercase tracking-wider mb-1',
          noah.className,
        )}
      >
        Submitted By
      </label>
      <div className="text-sm text-base-content">{creatorDisplay}</div>
    </div>
  )
}
