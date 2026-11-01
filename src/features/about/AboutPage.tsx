import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Heart, PawPrint, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { Page } from '@/components/layout/AppShell'
import { NompongArt } from '@/features/nompong/art'
import { setCover, setName, SetStatusBadge, StoreLink } from '@/features/stickers/components'
import { api } from '@/lib/api'
import { qk } from '@/lib/api/queryKeys'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { pick, useLocale, useTx } from '@/lib/i18n'

/** Nompong's character profile, as written by the nompong family team. */
const TRAITS = [
  { th: 'ขาวฟู หูเทา หางเทา', en: 'Fluffy, gray ears & tail' },
  { th: 'ทะเล้น', en: 'Cheeky' },
  { th: 'ขี้งอน', en: 'Quick to pout' },
  { th: 'ขี้อ้อน', en: 'Loves cuddles' },
  { th: 'ขี้เซา', en: 'Sleepy' },
  { th: 'หวงหาง', en: 'Guards his tail' },
  { th: 'ชอบเที่ยว', en: 'Loves adventures' },
]

function StoryTh() {
  return (
    <>
      <p>
        หวัดดีคับ น้องชื่อ <strong>“นมผง”</strong> เจ้าตัวขาวฟู หูเทา หางเทา ที่มาพร้อมพุงนุ่มๆ และเรื่องป่วนได้ทุกวัน เห็นหน้าน่ารักแบบนี้ น้องดื้อเป็นบางครั้ง
        แต่ทะเล้นเป็นประจำคับ!
      </p>
      <p>
        น้องชอบเล่น ชอบแกล้งเพื่อน แล้วทำหน้าซื่อเหมือนไม่มีอะไรเกิดขึ้น บางทีก็เล่นแรงไปนิด เพราะสนุกจนลืมตัว แต่พอเพื่อนไม่เล่นด้วยก็…{' '}
        <strong>งอนแย้ว</strong> ต้องมาง้อด้วยนะคับ อีกแป๊บเดียวก็กลับมาอ้อน ขออยู่ใกล้ๆ เหมือนเดิม
      </p>
      <p>
        งานอดิเรกของน้องคือเล่นพุง แอบแกะสะดือตัวเอง และคอยระวังหางสุดรัก หางนี้หวงมากคับ จะจับต้องขออนุญาตเจ้าของก่อน! ส่วนเกมโปรดคือซ่อนแอบ ถ้าเป็นฝ่ายหา
        น้องก็ตั้งใจหาจนเจอ แต่ถ้าเป็นฝ่ายซ่อนแล้วเงียบไปนานๆ ลองดูดีๆ นะคับ… น้องอาจเผลอหลับอยู่ตรงนั้นแล้ว
      </p>
      <p>ถึงจะขี้เซา แต่น้องชอบไปเที่ยวเสมอ ได้ออกไปสำรวจอะไรใหม่ๆ ก็พร้อมหอบความซนไปด้วยทุกที่ เที่ยวจนเหนื่อยแล้วค่อยกลับมานอนพุงป่องให้หายคิดถึง</p>
    </>
  )
}

function StoryEn() {
  return (
    <>
      <p>
        Hi! I’m <strong>Nompong</strong>, a fluffy white pup with gray ears, a gray tail, and a soft little tummy. I may look innocent, but I can be a little
        stubborn—and very cheeky!
      </p>
      <p>
        I love playing, teasing my friends, and then acting like I didn’t do anything. Sometimes I get so excited that I play a little too rough. But when my
        friends stop playing with me… here comes the pout! Give me a little attention, though, and I’ll be right back asking for cuddles.
      </p>
      <p>
        My favorite little habits? Playing with my tummy, picking at my belly button, and guarding my precious tail. That tail is very special to me—please ask
        before touching!
      </p>
      <p>
        I love hide-and-seek, too. When I’m the seeker, I won’t give up until I find you. But if I’m hiding and things get suspiciously quiet… I’ve probably
        fallen asleep in my hiding spot.
      </p>
      <p>
        I’m a sleepy little pup, but I’m always up for an adventure. I love going out, exploring new places, and bringing a little mischief wherever I go. After
        that, it’s back home for a belly-up nap.
      </p>
    </>
  )
}

export default function AboutPage() {
  const locale = useLocale()
  const tx = useTx()
  usePageMeta(tx('รู้จักนมผง', 'Meet Nompong'), tx('ทำความรู้จักน้องนมผง คาแรกเตอร์ของ nompong family', 'Meet Nompong, the character of nompong family'))
  const intro = useQuery({
    queryKey: qk.set('intro01'),
    queryFn: () => api.catalog.getSet('intro01'),
  })

  return (
    <Page>
      <header className="max-w-2xl">
        <h1 className="t-page flex items-center gap-3 font-display">
          {tx('รู้จักนมผง', 'Meet Nompong')}
          <PawPrint className="h-[0.8em] w-[0.8em] text-brown-400" strokeWidth={2.25} aria-hidden />
        </h1>
        <p className="t-lead mt-2 font-medium text-ink">{tx('ตัวเล็ก ขนฟู ความทะเล้นเกินตัวคับ', 'A little fluffball with a whole lot of mischief.')}</p>
      </header>

      <article className="mt-8 grid overflow-hidden rounded-3xl border border-line bg-surface md:grid-cols-[1fr_1.3fr]">
        <div className="flex aspect-[4/3] items-center justify-center bg-sunny-100 p-6 md:aspect-auto md:min-h-full" aria-hidden>
          <NompongArt pose="sit" className="h-full max-h-80 w-auto" decorative />
        </div>
        <div className="p-5 sm:p-8">
          <h2 className="font-display text-2xl">
            {tx('น้องนมผง', 'Nompong')} {locale === 'th' && <span className="text-base text-muted">Nompong</span>}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={tx('นิสัยของนมผง', 'Nompong’s traits')}>
            {TRAITS.map((t) => (
              <li key={t.en} className="rounded-full bg-surface-muted px-3 py-1 text-sm">
                {pick(t, locale)}
              </li>
            ))}
          </ul>
          <div className="mt-5 space-y-4 text-[15px] leading-relaxed sm:text-base [&_strong]:font-semibold">{locale === 'th' ? <StoryTh /> : <StoryEn />}</div>
          <p className="mt-6 flex items-start gap-2.5 rounded-2xl bg-sunny-50 px-4 py-3 font-display text-base leading-snug font-semibold sm:text-lg">
            <Heart size={20} className="mt-0.5 shrink-0 fill-current text-brown-400" aria-hidden />
            {tx(
              'ดื้อบ้าง ซนบ้าง งอนบ้าง แต่ขี้อ้อนและน่ารักทุกวันคับ',
              'Sometimes stubborn, always cheeky, quick to pout—and never too proud to ask for a cuddle.',
            )}
          </p>
        </div>
      </article>

      {intro.data && (
        <section
          aria-labelledby="foundation"
          className="mt-12 grid items-center gap-6 rounded-3xl border border-line bg-sunny-50 p-5 sm:p-8 md:grid-cols-[1fr_1.2fr]"
        >
          <img src={setCover(intro.data)} alt="" className="w-full rounded-2xl" />
          <div>
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-muted">
              <Sparkles size={16} aria-hidden /> Foundation Collection · {intro.data.code}
            </p>
            <h2 id="foundation" className="mt-1 font-display text-2xl">
              {setName(intro.data, locale).main}
            </h2>
            <p className="mt-2 text-muted">
              {tx(
                `ชุดแนะนำตัว ${intro.data.stickerCount} ภาพที่เล่าว่านมผงคือใคร (ชื่อชุดยังรออนุมัติ) — แยกจากซีรีส์ V1–V60 และ M`,
                `A ${intro.data.stickerCount}-sticker intro set telling who Nompong is (name not final) — separate from the V1–V60 and M series`,
              )}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <SetStatusBadge set={intro.data} />
              <StoreLink set={intro.data} />
              <Link to={`/stickers/${intro.data.slug}`} className="inline-flex min-h-11 items-center gap-1 font-medium">
                {tx('ดูรายละเอียด', 'See details')} <ChevronRight size={16} aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      )}
    </Page>
  )
}
