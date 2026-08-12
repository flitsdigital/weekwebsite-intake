import type { Status } from '@/lib/intake-status.ts';
import { STATUS_LABEL } from '@/lib/copy';

const COLOUR: Record<Status, string> = {
  new: 'bg-muted',
  in_progress: 'bg-accent',
  submitted: 'bg-ink',
  building: 'bg-btn',
  review: 'bg-purple-600',
  live: 'bg-green-600',
  cancelled: 'bg-line',
};

export default function StatusDot({ status, label }: { status: Status; label?: boolean }) {
  return (
    <span className="flex items-center gap-2 whitespace-nowrap">
      <span className={`size-2 shrink-0 rounded-full ${COLOUR[status]}`} />
      {label && STATUS_LABEL[status]}
    </span>
  );
}
