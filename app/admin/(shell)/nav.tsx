'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PixelIcon, type IconName } from '@/components/icons';
import { activeHref } from '@/lib/nav-active';

const GROUPS: { label: string; items: { href: string; label: string; icon: IconName }[] }[] = [
  {
    label: 'Verkoop',
    items: [
      { href: '/admin/leads', label: 'Leads', icon: 'zap' },
      { href: '/admin/belflow', label: 'Belflow', icon: 'clock' },
    ],
  },
  {
    label: 'Overzicht',
    items: [
      { href: '/admin', label: 'Dashboard', icon: 'home' },
      { href: '/admin/bord', label: 'Bord', icon: 'board' },
      { href: '/admin/klanten', label: 'Klanten', icon: 'users' },
    ],
  },
  {
    label: 'Toevoegen',
    items: [
      { href: '/admin/leads/nieuw', label: 'Nieuwe lead', icon: 'plus' },
      { href: '/admin/klanten/nieuw', label: 'Nieuwe klant', icon: 'plus' },
    ],
  },
];

export default function Nav({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();

  const current = activeHref(
    pathname,
    GROUPS.flatMap((group) => group.items).map((item) => item.href),
    ['/admin']
  );

  const isActive = (href: string) => href === current;

  if (compact) {
    return (
      <nav className="flex gap-1 overflow-x-auto">
        {GROUPS.flatMap((g) => g.items).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 rounded-ww px-3 py-2 text-sm whitespace-nowrap ${
              isActive(item.href) ? 'bg-ink text-white' : 'text-muted'
            }`}
          >
            <PixelIcon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="grid gap-6">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-3 text-[11px] font-semibold tracking-wider text-muted uppercase">
            {group.label}
          </p>
          <div className="grid gap-0.5">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-ww px-3 py-2 text-sm transition ${
                  isActive(item.href)
                    ? 'bg-ink font-semibold text-white'
                    : 'text-muted hover:bg-bg hover:text-ink'
                }`}
              >
                <PixelIcon name={item.icon} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
