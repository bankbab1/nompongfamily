import { Link } from 'react-router'
import type { LineSet } from './lineStore'

/** A LINE set's cover, name and code. Opens the set's preview page in the app. */
export function LineSetCard({ set }: { set: LineSet }) {
  return (
    <Link to={`/stickers/${set.id}`} className="group block rounded-2xl focus-visible:outline-offset-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-sticker-tile transition-colors group-hover:bg-sticker-tile-hover">
        <img
          src={set.image}
          alt=""
          width={240}
          height={240}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain p-3 transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transition-none"
        />
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-snug font-medium text-ink" lang="th">
        {set.name}
      </p>
      <p className="t-meta">{set.code}</p>
    </Link>
  )
}
