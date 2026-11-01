import { NompongMascot, type MascotPose } from './Mascot'
export type NompongPose = 'sit' | 'side' | 'back' | 'wave' | 'sleep' | 'curious' | 'lazy'
export const GALLERY_POSES: NompongPose[] = ['wave', 'curious', 'sleep', 'lazy', 'side', 'back']
const poses: Record<NompongPose, MascotPose> = { sit: 'greeting', side: 'curious', back: 'curious', wave: 'greeting', sleep: 'sleep', curious: 'curious', lazy: 'sleep' }
/** Compatibility for sticker previews: all use standalone alpha assets instead of sheet crops. */
export function NompongArt({ pose = 'sit', className, decorative }: { pose?: NompongPose; className?: string; decorative?: boolean }) {
  return <NompongMascot pose={poses[pose]} className={className} decorative={decorative} />
}
