import type { AdminRequestFilter, CatalogFilter } from './services'

/** One place for cache keys so mutations invalidate exactly what they change. */
export const qk = {
  session: ['session'] as const,
  myRequests: ['requests', 'mine'] as const,
  request: (id: string) => ['requests', 'detail', id] as const,
  proof: (id: string) => ['proofs', id] as const,
  packages: ['packages'] as const,
  sets: (f: CatalogFilter = {}) => ['catalog', 'sets', f] as const,
  set: (slug: string) => ['catalog', 'set', slug] as const,
  wallpapers: ['catalog', 'wallpapers'] as const,
  wallpaper: (slug: string) => ['catalog', 'wallpaper', slug] as const,
  ideas: ['catalog', 'ideas'] as const,
  admin: {
    all: ['admin'] as const,
    metrics: ['admin', 'metrics'] as const,
    requests: (f: AdminRequestFilter = {}) => ['admin', 'requests', f] as const,
    request: (id: string) => ['admin', 'request', id] as const,
    admins: ['admin', 'admins'] as const,
    jobs: ['admin', 'jobs'] as const,
    job: (id: string) => ['admin', 'job', id] as const,
    sets: ['admin', 'sets'] as const,
    packages: ['admin', 'packages'] as const,
    audit: ['admin', 'audit'] as const,
  },
}
