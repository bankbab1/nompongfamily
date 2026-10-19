/**
 * Analytics events (spec §14). Payloads carry ids and counts only — never caption
 * text, pose descriptions or attachments. Wire `sink` to the real provider later.
 */
export type AnalyticsEvent =
  | 'studio_opened'
  | 'request_type_selected'
  | 'draft_created'
  | 'slot_completed'
  | 'request_submitted'
  | 'proof_opened'
  | 'revision_requested'
  | 'artwork_approved'
  | 'sticker_store_clicked'
  | 'wallpaper_downloaded'

type Props = Record<string, string | number | boolean | undefined>

const buffer: { event: AnalyticsEvent; props: Props; at: string }[] = []

let sink: (event: AnalyticsEvent, props: Props) => void = (event, props) => {
  if (import.meta.env.DEV) console.debug('[analytics]', event, props)
}

export function track(event: AnalyticsEvent, props: Props = {}) {
  buffer.push({ event, props, at: new Date().toISOString() })
  if (buffer.length > 200) buffer.shift()
  sink(event, props)
}

export function setAnalyticsSink(fn: typeof sink) {
  sink = fn
}

export const recentEvents = () => [...buffer]
