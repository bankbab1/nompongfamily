/** Random id for client-minted records (draft ids, slot ids, comments). */
export function uid(prefix = ''): string {
  const raw =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 14)
  return prefix ? `${prefix}_${raw}` : raw
}

export const pad2 = (n: number) => String(n).padStart(2, '0')
