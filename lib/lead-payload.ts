export type LeadFields = {
  /** Het lead-id van Facebook, waarop we dubbele inzendingen herkennen. */
  externalId: string | null;
  companyName: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  /** De hele oorspronkelijke payload, zodat een formulierwijziging niets kost. */
  raw: Record<string, unknown>;
};

/**
 * Facebook en Zapier noemen dezelfde velden verschillend, en Zapier zet er
 * soms hoofdletters en spaties in. We vergelijken daarom op alleen de letters
 * en cijfers van de sleutel: "Phone Number", "phone_number" en "telefoonnummer"
 * komen zo op hetzelfde uit.
 */
const ALIASES: Record<keyof Omit<LeadFields, 'raw'>, string[]> = {
  externalId: ['leadgenid', 'leadid', 'id'],
  companyName: ['companyname', 'bedrijfsnaam', 'company', 'bedrijf'],
  contactName: ['fullname', 'name', 'naam', 'contactname', 'contactpersoon', 'firstname'],
  phone: ['phonenumber', 'phone', 'telefoonnummer', 'telefoon', 'tel', 'mobiel'],
  email: ['email', 'emailaddress', 'emailadres', 'mail'],
};

const normalise = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');

function pick(body: Record<string, unknown>, aliases: string[]): string | null {
  const byKey = new Map(Object.entries(body).map(([key, value]) => [normalise(key), value]));

  for (const alias of aliases) {
    const value = byKey.get(alias);
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export function parseLeadPayload(body: unknown): LeadFields | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;

  const raw = body as Record<string, unknown>;
  const fields = {
    externalId: pick(raw, ALIASES.externalId),
    companyName: pick(raw, ALIASES.companyName),
    contactName: pick(raw, ALIASES.contactName),
    phone: pick(raw, ALIASES.phone),
    email: pick(raw, ALIASES.email),
  };

  // Een testaanroep van Zapier bevat vaak niets herkenbaars; daar hoort geen
  // lege rij uit te komen. Een lead-id alleen is ook geen lead.
  const bruikbaar = fields.companyName || fields.contactName || fields.phone || fields.email;
  if (!bruikbaar) return null;

  return { ...fields, raw };
}
