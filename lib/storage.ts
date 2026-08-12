export const BUCKET = 'intake-files';

/** Extensie per toegestaan type. Ook de servercheck uit SPEC hoofdstuk 10. */
export const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
};
