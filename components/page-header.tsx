import Link from 'next/link';
import { PixelIcon } from './icons';

export default function PageHeader({
  title,
  subtitle,
  crumb,
  action,
}: {
  title: string;
  subtitle?: React.ReactNode;
  crumb?: { href: string; label: string };
  action?: React.ReactNode;
}) {
  return (
    <header className="border-b border-line bg-white px-6 py-5 lg:px-10">
      <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {crumb && (
            <p className="mb-1 flex items-center gap-0.5 text-sm text-muted">
              <Link href={crumb.href} className="hover:text-ink">
                {crumb.label}
              </Link>
              <PixelIcon name="chevron" className="size-3.5" />
            </p>
          )}
          <h1 className="truncate text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <div className="mt-1 text-sm text-muted">{subtitle}</div>}
        </div>
        {action}
      </div>
    </header>
  );
}
