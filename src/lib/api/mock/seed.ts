import type {
  AdminRequestMeta,
  ArtworkProof,
  AuditEntry,
  CommissionPackage,
  ProductionJob,
  RequestChannel,
  RequestStatus,
  StickerBriefItem,
  StickerCount,
  StickerRequest,
  StickerSet,
  TimelineEvent,
  User,
  Wallpaper,
  WallpaperVariant,
} from '../types'
import { stickerArt } from './art'

/** MOCK DATA — development only. Dates are relative to "now" so the demo never goes stale. */

export interface MockIdea {
  id: string
  setName: string
  theme?: string
  stickerCount: number
  sampleCaptions: string[]
  voterIds: string[]
}

export interface MockDb {
  schema: 1
  seq: number
  users: User[]
  requests: StickerRequest[]
  meta: Record<string, AdminRequestMeta>
  proofs: Record<string, ArtworkProof>
  production: Record<string, ProductionJob>
  sets: StickerSet[]
  wallpapers: Wallpaper[]
  packages: CommissionPackage[]
  ideas: MockIdea[]
  audit: AuditEntry[]
}

const DAY = 86_400_000
const ago = (days: number, hours = 0) => new Date(Date.now() - days * DAY - hours * 3_600_000).toISOString()

export const USERS: User[] = [
  { id: 'u_ploy', displayName: 'พลอย', email: 'ploy@example.com', role: 'member', locale: 'th' },
  { id: 'u_may', displayName: 'เมย์', email: 'may@example.com', role: 'customer', locale: 'th' },
  { id: 'u_admin', displayName: 'แอดมินสตูดิโอ', email: 'studio@example.com', role: 'admin', locale: 'th' },
  { id: 'u_art', displayName: 'นักวาด A', email: 'artist@example.com', role: 'admin', locale: 'th' },
  { id: 'u_ken', displayName: 'เคน', email: 'ken@example.com', role: 'customer', locale: 'th' },
  { id: 'u_fah', displayName: 'ฟ้า', email: 'fah@example.com', role: 'member', locale: 'th' },
]

/** Includes intentional repeated letters and tone marks — these must survive untouched (FE-03). */
const CAPTIONS = [
  'สวัสดีค่าาา',
  'ขอบคุณน้าาา',
  'ง่วงงงงง',
  'เลิกงานแล้ววว',
  'ได้เลยยย',
  'รอแป๊บน้า',
  'สู้ๆ นะ!',
  'หิวข้าวแล้ว',
  'ฝันดีน้า',
  'โอเคค่ะ',
  'ไม่ไหวแล้วว',
  'เย้ๆๆ',
  'ขอโทษน้า',
  'รักนะ ♡',
  'เดินทางปลอดภัย',
  'กำลังไป๊',
  'ประชุมอยู่',
  'ส่งงานแล้ว!',
  'ปังมากก',
  'ใจเย็นๆ',
  'ว้าวว',
  'จริงดิ?!',
  'ฮ่าๆๆๆ',
  'ขอบคุณที่ช่วยนะ',
]

const POSES = [
  'ยกมือขวาโบกทักทาย ยิ้มกว้าง ตาเป็นประกาย',
  'ไหว้ขอบคุณ ก้มหัวเล็กน้อย แก้มแดง',
  'หาวนอน ตาปรือ ถือหมอนข้างตัว',
  'กระโดดดีใจ แขนชูขึ้นฟ้า กระเป๋าทำงานลอยอยู่ข้างๆ',
  'ชูนิ้วโป้ง ขยิบตาข้างเดียว',
  'ยกมือเป็นสัญลักษณ์รอ หน้ากังวลเล็กน้อย',
  'กำหมัดสองข้าง มีไฟลุกด้านหลัง',
  'ลูบท้อง น้ำลายไหล มีชามข้าวลอยอยู่',
  'นอนกอดหมอน มีดาวและพระจันทร์รอบตัว',
  'ทำมือโอเค ยิ้มหวาน',
]

function items(count: number, offset = 0): StickerBriefItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `slot_seed_${offset}_${i + 1}`,
    position: i + 1,
    caption: CAPTIONS[(i + offset) % CAPTIONS.length],
    pose: POSES[(i + offset) % POSES.length],
    clothingProps: i % 4 === 0 ? 'ใส่ผ้ากันเปื้อนสีเหลือง' : '',
    colorNotes: '',
    referenceAssetIds: [],
  }))
}

function ev(at: string, actor: TimelineEvent['actor'], actorName: string, status?: RequestStatus, message?: string): TimelineEvent {
  return { id: `ev_${Math.random().toString(36).slice(2, 10)}`, at, actor, actorName, status, message }
}

interface SeedReq {
  id: string
  ownerId: string
  channel: RequestChannel
  status: RequestStatus
  setName: string
  count: StickerCount
  theme: string
  createdDaysAgo: number
  offset: number
  history: [number, TimelineEvent['actor'], RequestStatus, string?][]
  allowPublicIdea?: boolean
}

function buildRequest(s: SeedReq): StickerRequest {
  const owner = USERS.find((u) => u.id === s.ownerId)!
  const timeline = s.history.map(([d, actor, status, msg]) =>
    ev(ago(d), actor, actor === 'customer' ? owner.displayName : actor === 'admin' ? 'แอดมินสตูดิโอ' : 'ระบบ', status, msg),
  )
  const last = timeline.at(-1)?.at ?? ago(s.createdDaysAgo)
  return {
    id: s.id,
    clientDraftId: `cd_seed_${s.id}`,
    ownerId: s.ownerId,
    channel: s.channel,
    status: s.status,
    setName: s.setName,
    stickerCount: s.count,
    language: 'th',
    theme: s.theme,
    notes: '',
    items: items(s.count, s.offset),
    references: [],
    packageId: s.channel === 'commission' ? `pkg_${s.count}` : undefined,
    allowPublicIdea: s.allowPublicIdea,
    termsVersion: s.status === 'draft' ? undefined : '2026-10-01',
    termsAcceptedAt: s.status === 'draft' ? undefined : timeline[0]?.at,
    timeline,
    version: timeline.length + 1,
    createdAt: ago(s.createdDaysAgo),
    updatedAt: last,
    submittedAt: s.status === 'draft' ? undefined : timeline[0]?.at,
  }
}

const SEED_REQUESTS: SeedReq[] = [
  {
    id: 'NP-26-0101',
    ownerId: 'u_may',
    channel: 'commission',
    status: 'proof_ready',
    setName: 'นมผงวัยทำงาน',
    count: 16,
    theme: 'ชีวิตออฟฟิศ ประชุม ส่งงาน เลิกงาน โทนสดใส',
    createdDaysAgo: 21,
    offset: 0,
    history: [
      [21, 'customer', 'submitted'],
      [20, 'admin', 'under_review'],
      [19, 'admin', 'accepted'],
      [18, 'admin', 'brief_approved', 'บรีฟชัดเจนมาก เริ่มผลิตได้เลยค่ะ'],
      [17, 'admin', 'in_production'],
      [9, 'admin', 'proof_ready', 'ส่งงานรอบแรกให้ตรวจแล้วค่ะ'],
      [7, 'customer', 'revision_requested'],
      [1, 'admin', 'proof_ready', 'แก้ภาพ 03 และ 07 ตามคอมเมนต์แล้วค่ะ'],
    ],
  },
  {
    id: 'NP-26-0102',
    ownerId: 'u_may',
    channel: 'commission',
    status: 'submitted',
    setName: 'Office Life ภาค 2',
    count: 8,
    theme: 'ต่อจากชุดแรก เน้นมุกประชุมออนไลน์',
    createdDaysAgo: 2,
    offset: 6,
    history: [[2, 'customer', 'submitted']],
  },
  {
    id: 'NP-26-0103',
    ownerId: 'u_ploy',
    channel: 'community',
    status: 'under_review',
    setName: 'นมผงสายกิน',
    count: 8,
    theme: 'ของกินไทย ชานม หมูกระทะ',
    createdDaysAgo: 5,
    offset: 3,
    allowPublicIdea: true,
    history: [
      [5, 'customer', 'submitted'],
      [3, 'admin', 'under_review'],
    ],
  },
  {
    id: 'NP-26-0104',
    ownerId: 'u_ploy',
    channel: 'community',
    status: 'clarification_requested',
    setName: 'ทักทายวันจันทร์',
    count: 8,
    theme: 'คำทักทายต้นสัปดาห์',
    createdDaysAgo: 9,
    offset: 10,
    history: [
      [9, 'customer', 'submitted'],
      [8, 'admin', 'under_review'],
      [6, 'admin', 'clarification_requested', 'ภาพ 05–08 ช่วยอธิบายท่าทางให้ละเอียดขึ้นอีกนิดได้ไหมคะ เช่น มือทำอะไร สีหน้าแบบไหน'],
    ],
  },
  {
    id: 'NP-26-0090',
    ownerId: 'u_ploy',
    channel: 'community',
    status: 'published',
    setName: 'นมผงจากไอเดียแฟนๆ',
    count: 16,
    theme: 'ไอเดียจากแฟนๆ รอบแรก',
    createdDaysAgo: 80,
    offset: 4,
    history: [
      [80, 'customer', 'submitted'],
      [78, 'admin', 'under_review'],
      [70, 'admin', 'accepted', 'ทีมชอบไอเดียนี้มาก! เลือกผลิตเป็นชุด CR1 ค่ะ'],
      [60, 'admin', 'in_production'],
      [40, 'admin', 'line_submitted'],
      [30, 'admin', 'published'],
    ],
  },
  {
    id: 'NP-26-0105',
    ownerId: 'u_ken',
    channel: 'commission',
    status: 'in_production',
    setName: 'เคนสายฟิต',
    count: 8,
    theme: 'ออกกำลังกาย ยิม วิ่ง',
    createdDaysAgo: 12,
    offset: 12,
    history: [
      [12, 'customer', 'submitted'],
      [11, 'admin', 'under_review'],
      [10, 'admin', 'accepted'],
      [9, 'admin', 'brief_approved'],
      [8, 'admin', 'in_production'],
    ],
  },
  {
    id: 'NP-26-0106',
    ownerId: 'u_fah',
    channel: 'community',
    status: 'submitted',
    setName: 'นมผงรักษ์โลก',
    count: 8,
    theme: 'แยกขยะ ปลูกต้นไม้ พกแก้วเอง',
    createdDaysAgo: 1,
    offset: 8,
    allowPublicIdea: true,
    history: [[1, 'customer', 'submitted']],
  },
  {
    id: 'NP-26-0107',
    ownerId: 'u_ken',
    channel: 'commission',
    status: 'accepted',
    setName: 'คำพูดติดปากของเคน',
    count: 24,
    theme: 'มุกส่วนตัวกับเพื่อนสนิท',
    createdDaysAgo: 4,
    offset: 15,
    history: [
      [4, 'customer', 'submitted'],
      [3, 'admin', 'under_review'],
      [2, 'admin', 'accepted'],
    ],
  },
  {
    id: 'NP-26-0108',
    ownerId: 'u_fah',
    channel: 'community',
    status: 'declined',
    setName: 'นมผงแฟนคลับทีมฟุตบอล',
    count: 8,
    theme: 'เชียร์บอล',
    createdDaysAgo: 30,
    offset: 2,
    history: [
      [30, 'customer', 'submitted'],
      [28, 'admin', 'under_review'],
      [27, 'admin', 'declined', 'ขออภัยค่ะ ชุดนี้อ้างอิงโลโก้/ชื่อทีมที่มีลิขสิทธิ์ จึงผลิตเป็นสติกเกอร์สาธารณะไม่ได้'],
    ],
  },
]

function seedProof(req: StickerRequest): { proof: ArtworkProof; job: ProductionJob } {
  const revised = new Set([3, 7])
  const proofItems = req.items.map((it) => {
    const v1 = { version: 1, imageUrl: stickerArt({ position: it.position, caption: it.caption, version: 1 }), uploadedAt: ago(9) }
    if (!revised.has(it.position)) {
      return {
        itemId: it.id,
        position: it.position,
        caption: it.caption,
        pose: it.pose,
        state: 'approved' as const,
        versions: [v1],
        approvedVersion: 1,
        comments: [],
      }
    }
    const v2 = {
      version: 2,
      imageUrl: stickerArt({ position: it.position, caption: it.caption, version: 2 }),
      uploadedAt: ago(1),
      note: 'ปรับสีหน้าและท่ามือตามคอมเมนต์',
    }
    return {
      itemId: it.id,
      position: it.position,
      caption: it.caption,
      pose: it.pose,
      state: 'pending' as const,
      versions: [v1, v2],
      adminNote: 'ปรับตามที่ขอแล้วค่ะ ลองดูเทียบกับเวอร์ชันก่อนได้เลย',
      comments: [
        {
          id: `c_${it.position}`,
          at: ago(7),
          actor: 'customer' as const,
          actorName: 'เมย์',
          artworkVersion: 1,
          body: it.position === 3 ? 'อยากให้ตาปรือกว่านี้ ดูง่วงจริงๆ' : 'ไฟด้านหลังเล็กไปนิด ขอใหญ่ขึ้นค่ะ',
        },
      ],
    }
  })
  return {
    proof: { requestId: req.id, proofVersion: 2, releasedAt: ago(1), items: proofItems },
    job: {
      requestId: req.id,
      qa: { thaiSpelling: true, characterConsistency: true, transparentBackground: true, lineSpecs: true },
      items: proofItems.map((p) => ({
        itemId: p.itemId,
        position: p.position,
        caption: p.caption,
        pose: p.pose,
        stage: p.state === 'approved' ? 'approved' : 'proof_uploaded',
        versions: p.versions,
        releasedVersion: p.versions.at(-1)!.version,
      })),
    },
  }
}

function seedJob(req: StickerRequest): ProductionJob {
  return {
    requestId: req.id,
    qa: { thaiSpelling: false, characterConsistency: false, transparentBackground: false, lineSpecs: false },
    items: req.items.map((it, i) => ({
      itemId: it.id,
      position: it.position,
      caption: it.caption,
      pose: it.pose,
      stage: i < 3 ? 'qa' : i < 5 ? 'designing' : 'pending',
      versions: i < 3 ? [{ version: 1, imageUrl: stickerArt({ position: it.position, caption: it.caption, version: 1 }), uploadedAt: ago(2) }] : [],
    })),
  }
}

/** English descriptions for the sample sets (the Thai ones live in the rows below). */
const SET_DESC_EN: Record<string, string> = {
  V1: 'Everyday greetings from Nompong',
  V2: 'A slow, cosy day off',
  V3: 'Say I love you, the cute way',
  V4: 'Meetings, deadlines and overtime',
  V5: 'Mischievous and playful to the max',
  V6: 'Songkran, Loy Krathong and New Year',
  V7: 'Umbrellas, rain boots and rainy days',
  V8: 'An unpublished draft set',
  M1: 'A special set of wiggly animated stickers',
  M2: 'Full-screen pop-up stickers',
  M3: 'Stickers with sound',
  CR1: 'The first set made from fans’ ideas',
  INTRO01: 'An intro set showing who Nompong is — name not final',
}

const SETS: StickerSet[] = [
  ['V1', 'นมผงทักทาย', 'Nompong Says Hi', 'คำทักทายประจำวันจากน้องนมผง', 40, 'live', '#F5D76E', ['ทักทาย', 'daily'], 300],
  ['V2', 'นมผงวันชิลล์', 'Chill Day', 'วันพักผ่อนสบายๆ', 24, 'live', '#9DCFC9', ['ชิลล์', 'relax'], 240],
  ['V3', 'นมผงสายหวาน', 'Sweet Nompong', 'บอกรักแบบน่ารักๆ', 32, 'live', '#F2B5A7', ['ความรัก', 'love'], 200],
  ['V4', 'นมผงทำงาน', 'Work Mode', 'ประชุม ส่งงาน โอที', 40, 'live', '#F7C99B', ['ทำงาน', 'office'], 150],
  ['V5', 'นมผงตัวป่วน', 'Playful Nompong', 'ซน ป่วน และขี้เล่นสุดๆ', 24, 'live', '#C9D7A5', ['ขี้เล่น', 'playful'], 90],
  ['V6', 'นมผงเทศกาล', 'Festive Nompong', 'สงกรานต์ ลอยกระทง ปีใหม่', 16, 'live', '#D9C2E8', ['เทศกาล', 'festival'], 45],
  ['V7', 'นมผงหน้าฝน', 'Rainy Season', 'ร่ม รองเท้าบูท และฝนตก', 24, 'coming_soon', '#A9CBE8', ['ฝน', 'rain'], 0],
  ['V8', 'งานภายใน (ร่าง)', 'Internal draft', 'ชุดร่างที่ยังไม่เผยแพร่', 8, 'draft', '#E5E5E5', [], 0],
  ['M1', 'นมผงขยับได้', 'Animated Nompong', 'สติกเกอร์ดุ๊กดิ๊กชุดพิเศษ', 24, 'live', '#F5D76E', ['animated', 'พิเศษ'], 120],
  ['M2', 'นมผงป๊อปอัป', 'Pop-up Nompong', 'สติกเกอร์ป๊อปอัปเต็มจอ', 16, 'live', '#F3C4D6', ['popup', 'พิเศษ'], 60],
  ['M3', 'นมผงพูดได้', 'Talking Nompong', 'สติกเกอร์มีเสียง', 16, 'coming_soon', '#9DCFC9', ['sound', 'พิเศษ'], 0],
  ['CR1', 'นมผงจากไอเดียแฟนๆ', 'Nompong by Fans', 'ชุดแรกจากไอเดียของแฟนๆ', 16, 'live', '#F7C99B', ['community', 'แฟนๆ'], 30],
  [
    'INTRO01',
    'รู้จักนมผง',
    'Meet Nompong (working title)',
    'ชุดแนะนำตัวว่านมผงคือใคร — ชื่อชุดยังรออนุมัติ',
    32,
    'coming_soon',
    '#FFF0B8',
    ['foundation', 'แนะนำตัว'],
    0,
  ],
].map(([code, titleTh, titleEn, description, stickerCount, status, coverHue, tags, daysAgo]) => {
  const c = code as string
  const series = c.startsWith('INTRO') ? 'INTRO' : c.startsWith('CR') ? 'CR' : (c[0] as 'V' | 'M')
  const live = status === 'live'
  return {
    id: `set_${c.toLowerCase()}`,
    slug: c.toLowerCase(),
    code: c,
    series,
    titleTh: titleTh as string,
    titleEn: titleEn as string,
    description: description as string,
    descriptionEn: SET_DESC_EN[c],
    stickerCount: stickerCount as number,
    status: status as StickerSet['status'],
    // Mock link to the public LINE Store search — real product URLs are recorded by admin at publication.
    lineStoreUrl: live ? 'https://store.line.me/search/sticker/th?q=nompong' : undefined,
    coverHue: coverHue as string,
    tags: tags as string[],
    sampleCaptions: CAPTIONS.slice((c.length * 3) % 12, ((c.length * 3) % 12) + 8),
    releasedAt: live ? ago(daysAgo as number) : undefined,
    featured: ['V1', 'V5', 'M1', 'CR1'].includes(c),
  }
})

const WALLPAPER_VARIANTS: Omit<WallpaperVariant, 'id' | 'sizeKb'>[] = [
  { label: 'มือถือ FHD+', labelEn: 'Phone FHD+', device: 'mobile', width: 1080, height: 2400, format: 'PNG' },
  { label: 'มือถือ QHD+', labelEn: 'Phone QHD+', device: 'mobile', width: 1440, height: 3200, format: 'PNG' },
  { label: 'แท็บเล็ตแนวตั้ง', labelEn: 'Tablet portrait', device: 'tablet', width: 2048, height: 2732, format: 'PNG' },
  { label: 'แท็บเล็ตแนวนอน', labelEn: 'Tablet landscape', device: 'tablet', width: 2732, height: 2048, format: 'PNG' },
  { label: 'เดสก์ท็อป Full HD', labelEn: 'Desktop Full HD', device: 'desktop', width: 1920, height: 1080, format: 'JPG' },
  { label: 'เดสก์ท็อป QHD', labelEn: 'Desktop QHD', device: 'desktop', width: 2560, height: 1440, format: 'JPG' },
  { label: 'เดสก์ท็อป 4K', labelEn: 'Desktop 4K', device: 'desktop', width: 3840, height: 2160, format: 'JPG' },
]

const WALLPAPERS: Wallpaper[] = (
  [
    ['sunny-morning', 'เช้าสดใส', 'Sunny Morning', 'สดใส', 'Bright', ['#FFF4C9', '#F5D76E', '#9DCFC9']],
    ['peach-nap', 'งีบบ่ายสีพีช', 'Peach Nap', 'ผ่อนคลาย', 'Relaxing', ['#FDEAE4', '#F2B5A7', '#F5D76E']],
    ['mint-rain', 'ฝนพรำสีมิ้นต์', 'Mint Rain', 'ฤดูฝน', 'Rainy season', ['#E3F3F0', '#9DCFC9', '#A9CBE8']],
    ['cozy-night', 'คืนอบอุ่น', 'Cozy Night', 'กลางคืน', 'Night', ['#EDE6F4', '#D9C2E8', '#F5D76E']],
  ] as const
).map(([slug, titleTh, titleEn, theme, themeEn, palette]) => ({
  id: `wp_${slug}`,
  slug,
  titleTh,
  titleEn,
  theme,
  themeEn,
  palette: [...palette] as [string, string, string],
  free: true,
  variants: WALLPAPER_VARIANTS.map((v) => ({
    ...v,
    id: `${slug}_${v.width}x${v.height}`,
    sizeKb: Math.round((v.width * v.height) / (v.format === 'PNG' ? 900 : 2600)),
  })),
}))

const PACKAGES: CommissionPackage[] = (
  [
    [8, 'ตามที่ตกลง', 2, 10],
    [16, 'ตามที่ตกลง', 2, 14],
    [24, 'ตามที่ตกลง', 2, 18],
    [32, 'ตามที่ตกลง', 3, 21],
    [40, 'ตามที่ตกลง', 3, 25],
  ] as const
).map(([stickerCount, priceLabel, revisionRounds, turnaroundDays]) => ({
  id: `pkg_${stickerCount}`,
  stickerCount,
  priceLabel,
  revisionRounds,
  turnaroundDays,
  active: true,
}))

export function createSeed(): MockDb {
  const requests = SEED_REQUESTS.filter((s) => s.channel !== 'commission').map(buildRequest)
  const meta: Record<string, AdminRequestMeta> = {}
  const proofs: Record<string, ArtworkProof> = {}
  const production: Record<string, ProductionJob> = {}

  for (const r of requests) {
    meta[r.id] = {
      requestId: r.id,
      priority: r.channel === 'commission' ? 'high' : 'normal',
      assigneeId: ['in_production', 'proof_ready', 'accepted'].includes(r.status) ? 'u_art' : undefined,
      deadline: r.channel === 'commission' && r.status !== 'published' ? new Date(Date.now() + 10 * DAY).toISOString().slice(0, 10) : undefined,
      notes: r.id === 'NP-26-0101' ? [{ id: 'n1', at: ago(8), authorName: 'นักวาด A', body: 'ลูกค้าชอบโทนสีเหลืองมาก ระวังอย่าให้ซีด (ภายใน)' }] : [],
      snapshots: r.status === 'draft' ? [] : [{ at: r.submittedAt!, version: 1, setName: r.setName, items: r.items }],
    }
    if (r.id === 'NP-26-0101') {
      const { proof, job } = seedProof(r)
      proofs[r.id] = proof
      production[r.id] = job
    }
    if (r.status === 'in_production') production[r.id] = seedJob(r)
  }

  return {
    schema: 1,
    seq: 108,
    users: USERS,
    requests,
    meta,
    proofs,
    production,
    sets: SETS,
    wallpapers: WALLPAPERS,
    packages: PACKAGES,
    ideas: [
      {
        id: 'idea_1',
        setName: 'นมผงสายกิน',
        theme: 'ของกินไทย ชานม หมูกระทะ',
        stickerCount: 8,
        sampleCaptions: ['หิวข้าวแล้ว', 'หมูกระทะมั้ย', 'ชานมไข่มุก!'],
        voterIds: ['u_fah', 'u_ken'],
      },
      {
        id: 'idea_2',
        setName: 'นมผงรักษ์โลก',
        theme: 'แยกขยะ ปลูกต้นไม้ พกแก้วเอง',
        stickerCount: 8,
        sampleCaptions: ['พกแก้วมาเองนะ', 'แยกขยะด้วยย'],
        voterIds: ['u_ploy'],
      },
      {
        id: 'idea_3',
        setName: 'นมผงสายมู',
        theme: 'ขอพร สายมู ดวงดี',
        stickerCount: 16,
        sampleCaptions: ['สาธุ', 'ปังๆ รวยๆ', 'ดวงดีมาก'],
        voterIds: ['u_ploy', 'u_fah', 'u_ken', 'u_may'],
      },
    ],
    audit: [{ id: 'a1', at: ago(1), actorName: 'แอดมินสตูดิโอ', action: 'release_proof', target: 'NP-26-0101 (round 2)' }],
  }
}
