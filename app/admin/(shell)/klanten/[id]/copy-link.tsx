'use client';

import { useState } from 'react';

export default function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="flex-1 truncate rounded-ww border border-line bg-white px-3 py-2 text-sm">
        {url}
      </code>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="min-h-10 rounded-ww bg-ink px-4 text-sm font-semibold text-white"
      >
        {copied ? 'Gekopieerd' : 'Kopieer link'}
      </button>
    </div>
  );
}
