export type FunnelRow = {
  created_at: string;
  opened_at: string | null;
  started_at: string | null;
  submitted_at: string | null;
  max_step_reached: number;
};

export type FunnelStage = {
  key: string;
  label: string;
  count: number;
  /** Van het totaal aangemaakt, niet van de vorige stap. */
  percent: number;
};

const STAGES: { key: string; label: string; reached: (row: FunnelRow) => boolean }[] = [
  { key: 'aangemaakt', label: 'Aangemaakt', reached: () => true },
  // Beginnen impliceert openen: anders krimpt de trechter en groeit hij weer,
  // wat gebeurt bij een klant zonder JavaScript.
  { key: 'geopend', label: 'Link geopend', reached: (r) => !!(r.opened_at || r.started_at) },
  { key: 'begonnen', label: 'Begonnen met invullen', reached: (r) => !!r.started_at },
  { key: 'stap2', label: 'Stap 2 bereikt', reached: (r) => r.max_step_reached >= 2 },
  { key: 'stap3', label: 'Stap 3 bereikt', reached: (r) => r.max_step_reached >= 3 },
  { key: 'stap4', label: 'Stap 4 bereikt', reached: (r) => r.max_step_reached >= 4 },
  { key: 'stap5', label: 'Stap 5 bereikt', reached: (r) => r.max_step_reached >= 5 },
  { key: 'verzonden', label: 'Verzonden', reached: (r) => !!r.submitted_at },
];

export function buildFunnel(rows: FunnelRow[]): FunnelStage[] {
  const total = rows.length;

  return STAGES.map((stage) => {
    const count = rows.filter(stage.reached).length;
    return {
      key: stage.key,
      label: stage.label,
      count,
      percent: total ? Math.round((count / total) * 100) : 0,
    };
  });
}
