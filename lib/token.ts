import { randomUUID } from 'node:crypto';

/**
 * Twee UUID's zonder streepjes: 64 tekens, niet oplopend, niet te raden.
 * Dit is de enige beveiliging van de klantkant, dus hij mag niet korter.
 */
export const newToken = () => (randomUUID() + randomUUID()).replace(/-/g, '');
