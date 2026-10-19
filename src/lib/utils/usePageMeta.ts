import { useEffect } from 'react'

const SITE = 'nompong family'

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

/**
 * Per-route title + description + social preview tags (spec §14 SEO). For crawlers that
 * don't run JS, pre-render the public routes (Home, About, Stickers) at deploy time.
 */
export function usePageMeta(title: string | undefined, description?: string, opts: { noindex?: boolean } = {}) {
  useEffect(() => {
    if (!title) return
    const full = title === SITE ? `${SITE} — Nompong Studio` : `${title} · ${SITE}`
    document.title = full
    setMeta('meta[property="og:title"]', 'property', 'og:title', full)
    if (description) {
      setMeta('meta[name="description"]', 'name', 'description', description)
      setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    }
    setMeta('meta[name="robots"]', 'name', 'robots', opts.noindex ? 'noindex,nofollow' : 'index,follow')
  }, [title, description, opts.noindex])
}
