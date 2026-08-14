'use client';

import { useState } from 'react';

export default function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="min-h-10 rounded-ww border border-line px-4 text-sm font-semibold hover:border-ink"
    >
      {copied ? 'Gekopieerd' : label}
    </button>
  );
}
