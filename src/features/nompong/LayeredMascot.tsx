import type { CSSProperties } from 'react'

const atlas = `${import.meta.env.BASE_URL}nompong/mascot-rig-v1.webp`
/** Atlas parts remain unmodified; SVG viewports select each illustrated layer. */
function Part({ crop, x, y, w, h }: { crop: string; x: number; y: number; w: number; h: number }) {
  return <svg x={x} y={y} width={w} height={h} viewBox={crop} overflow="hidden"><image href={atlas} width="1280" height="1280" /></svg>
}
export function LayeredMascot({ paused, reacting, label }: { paused: boolean; reacting: boolean; label?: string }) {
  return <svg viewBox="0 0 400 460" className="nompong-rig h-full w-full" role={label ? 'img' : undefined} aria-label={label} aria-hidden={!label || undefined}
    style={{ '--rig-play': paused ? 'paused' : 'running' } as CSSProperties} data-reacting={reacting || undefined}>
    <g className="rig-tail"><Part crop="108 950 238 238" x={273} y={325} w={85} h={85} /></g>
    <g className="rig-body"><Part crop="848 86 397 390" x={99} y={237} w={220} h={216} /></g>
    <g className="rig-head">
      <g className="rig-ear-left"><Part crop="94 526 249 345" x={26} y={105} w={111} h={174} /></g>
      <g className="rig-ear-right"><Part crop="535 526 238 345" x={270} y={105} w={108} h={174} /></g>
      <g className="rig-eyes-open"><Part crop="8 72 409 385" x={76} y={28} w={250} h={236} /></g>
      <g className="rig-eyes-closed"><Part crop="427 72 405 385" x={76} y={28} w={250} h={236} /></g>
    </g>
    <g className="rig-paw"><Part crop="865 540 354 331" x={35} y={253} w={140} h={131} /></g>
  </svg>
}
