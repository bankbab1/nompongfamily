import { useEffect, useState, type CSSProperties } from 'react'
import { useCopy } from '@/features/portal/copy'
import { cn } from '@/lib/utils/cn'

/**
 * Nompong artwork.
 *
 * Real files live in `public/nompong/` (see the README there):
 *   - logo.png             round "Nompong Family" badge
 *   - character-sheet.png  1536×1024 sheet: big sitting pose on the left, six poses on the right
 *
 * Poses are cropped from the sheet with CSS, so one file feeds the whole site.
 * While a file is missing, a drawn stand-in is shown instead so the layout never breaks.
 */
const base = import.meta.env.BASE_URL
export const NOMPONG_LOGO = `${base}nompong/logo.png`
export const NOMPONG_SHEET = `${base}nompong/character-sheet.png`

const SHEET_W = 1536
const SHEET_H = 1024

/** Crop boxes on the character sheet, in sheet pixels. */
const POSES = {
  sit: { x: 0, y: 60, w: 800, h: 900 },
  side: { x: 760, y: 60, w: 360, h: 390 },
  back: { x: 1110, y: 60, w: 420, h: 390 },
  wave: { x: 790, y: 440, w: 330, h: 290 },
  sleep: { x: 1120, y: 470, w: 410, h: 260 },
  curious: { x: 790, y: 740, w: 330, h: 280 },
  lazy: { x: 1110, y: 750, w: 420, h: 270 },
} as const

export type NompongPose = keyof typeof POSES
export const GALLERY_POSES: NompongPose[] = ['wave', 'curious', 'sleep', 'lazy', 'side', 'back']

type LoadState = 'loading' | 'ok' | 'error'
const cache = new Map<string, LoadState>()

function useImageState(src: string): LoadState {
  const [state, setState] = useState<LoadState>(() => cache.get(src) ?? 'loading')
  useEffect(() => {
    if (cache.get(src) === 'ok' || cache.get(src) === 'error') return
    const img = new Image()
    img.onload = () => {
      cache.set(src, 'ok')
      setState('ok')
    }
    img.onerror = () => {
      cache.set(src, 'error')
      setState('error')
    }
    img.src = src
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src])
  return state
}

function spriteStyle(pose: NompongPose): CSSProperties {
  const { x, y, w, h } = POSES[pose]
  return {
    aspectRatio: `${w} / ${h}`,
    backgroundImage: `url(${NOMPONG_SHEET})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${(SHEET_W / w) * 100}% ${(SHEET_H / h) * 100}%`,
    backgroundPosition: `${(x / (SHEET_W - w)) * 100}% ${(y / (SHEET_H - h)) * 100}%`,
  }
}

/** One Nompong pose from the character sheet. */
export function NompongArt({ pose = 'sit', className, decorative }: { pose?: NompongPose; className?: string; decorative?: boolean }) {
  const state = useImageState(NOMPONG_SHEET)
  const label = useCopy().poses[pose]
  const { w, h } = POSES[pose]
  const a11y = decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label }
  if (state !== 'ok') {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ aspectRatio: `${w} / ${h}` }} {...a11y}>
        {state === 'error' && <NompongDrawing pose={pose} className="h-full w-full" />}
      </div>
    )
  }
  return <div className={cn('w-full rounded-[1.25rem]', className)} style={spriteStyle(pose)} {...a11y} />
}

/** The round "Nompong Family" badge. */
export function NompongLogo({ className, decorative }: { className?: string; decorative?: boolean }) {
  const state = useImageState(NOMPONG_LOGO)
  if (state === 'ok') {
    return <img src={NOMPONG_LOGO} alt={decorative ? '' : 'Nompong Family'} className={cn('aspect-square object-contain', className)} draggable={false} />
  }
  return (
    <div className={cn('aspect-square', className)} aria-hidden={decorative} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : 'Nompong Family'}>
      {state === 'error' && <LogoDrawing />}
    </div>
  )
}

/* ---------- Drawn stand-ins (used only until the real files are added) ---------- */

const FUR = '#fffdf8'
const LINE = '#6e5647'
const EAR = '#a38f80'

function Head({ cx, cy, r, sleepy }: { cx: number; cy: number; r: number; sleepy?: boolean }) {
  const k = r / 58
  return (
    <g>
      <ellipse cx={cx - 50 * k} cy={cy + 14 * k} rx={18 * k} ry={36 * k} fill={EAR} transform={`rotate(14 ${cx - 50 * k} ${cy + 14 * k})`} />
      <ellipse cx={cx + 50 * k} cy={cy + 14 * k} rx={18 * k} ry={36 * k} fill={EAR} transform={`rotate(-14 ${cx + 50 * k} ${cy + 14 * k})`} />
      <circle cx={cx} cy={cy} r={r} fill={FUR} stroke={LINE} strokeWidth={2.2 * k} strokeDasharray={`${1.2 * k} ${3.2 * k}`} strokeLinecap="round" />
      {sleepy ? (
        <>
          <path d={`M${cx - 26 * k} ${cy + 6 * k} q6 ${5 * k} 12 0`} stroke="#2b211c" strokeWidth={2.6 * k} fill="none" strokeLinecap="round" />
          <path d={`M${cx + 14 * k} ${cy + 6 * k} q6 ${5 * k} 12 0`} stroke="#2b211c" strokeWidth={2.6 * k} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx={cx - 22 * k} cy={cy + 6 * k} rx={5 * k} ry={5.5 * k} fill="#2b211c" />
          <ellipse cx={cx + 22 * k} cy={cy + 6 * k} rx={5 * k} ry={5.5 * k} fill="#2b211c" />
        </>
      )}
      <ellipse cx={cx} cy={cy + 20 * k} rx={13 * k} ry={10 * k} fill="#f6f4f2" stroke="#9c928b" strokeWidth={1.8 * k} />
      <ellipse cx={cx - 4 * k} cy={cy + 16 * k} rx={4 * k} ry={2.4 * k} fill="#fff" />
      {!sleepy && <path d={`M${cx - 6 * k} ${cy + 34 * k} q${6 * k} ${12 * k} ${12 * k} 0 z`} fill="#e8555a" />}
    </g>
  )
}

function NompongDrawing({ pose, className }: { pose: NompongPose; className?: string }) {
  const lying = pose === 'sleep' || pose === 'lazy'
  if (lying) {
    return (
      <svg viewBox="0 0 220 140" className={className}>
        <ellipse cx="110" cy="128" rx="86" ry="8" fill="#000" opacity=".05" />
        <ellipse cx="140" cy="96" rx="64" ry="32" fill={FUR} stroke={LINE} strokeWidth="2" strokeDasharray="1.2 3.2" strokeLinecap="round" />
        <circle cx="196" cy="84" r="10" fill={EAR} />
        <Head cx={78} cy={78} r={44} sleepy={pose === 'sleep'} />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 200 220" className={className}>
      <ellipse cx="100" cy="206" rx="70" ry="9" fill="#000" opacity=".05" />
      <ellipse cx="100" cy="164" rx="54" ry="42" fill={FUR} stroke={LINE} strokeWidth="2" strokeDasharray="1.2 3.2" strokeLinecap="round" />
      <ellipse cx="80" cy="196" rx="16" ry="11" fill={FUR} stroke={LINE} strokeWidth="2" strokeDasharray="1.2 3.2" strokeLinecap="round" />
      <ellipse cx="120" cy="196" rx="16" ry="11" fill={FUR} stroke={LINE} strokeWidth="2" strokeDasharray="1.2 3.2" strokeLinecap="round" />
      {pose === 'wave' && <ellipse cx="160" cy="118" rx="12" ry="16" fill={FUR} stroke={LINE} strokeWidth="2" strokeDasharray="1.2 3.2" transform="rotate(25 160 118)" />}
      {pose === 'back' ? (
        <g>
          <ellipse cx="50" cy="96" rx="18" ry="36" fill={EAR} transform="rotate(14 50 96)" />
          <ellipse cx="150" cy="96" rx="18" ry="36" fill={EAR} transform="rotate(-14 150 96)" />
          <circle cx="100" cy="82" r="58" fill={FUR} stroke={LINE} strokeWidth="2.2" strokeDasharray="1.2 3.2" strokeLinecap="round" />
          <circle cx="100" cy="196" r="11" fill={EAR} />
        </g>
      ) : (
        <Head cx={100} cy={82} r={58} />
      )}
    </svg>
  )
}

function LogoDrawing() {
  return (
    <svg viewBox="0 0 240 240" className="h-full w-full">
      <circle cx="120" cy="120" r="114" fill="#f6efe3" stroke="#b08d75" strokeWidth="8" />
      <text x="120" y="70" textAnchor="middle" fontFamily="Mitr, sans-serif" fontWeight="600" fontSize="34" fill="#5c3d2e">
        Nompong
      </text>
      <text x="120" y="98" textAnchor="middle" fontFamily="Mitr, sans-serif" fontSize="20" fill="#8a6650">
        – Family –
      </text>
      <g transform="translate(64 104) scale(.56)">
        <Head cx={100} cy={82} r={58} />
      </g>
      <path d="M50 112c-6-8 6-14 9-6 3-8 15-2 9 6l-9 9z" fill="#ef6f6c" />
      <path d="M176 120c-6-8 6-14 9-6 3-8 15-2 9 6l-9 9z" fill="#ef6f6c" />
    </svg>
  )
}
