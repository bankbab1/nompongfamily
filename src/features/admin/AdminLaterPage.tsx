import { Hourglass } from 'lucide-react'
import { EmptyState } from '@/components/feedback/States'

export default function AdminLaterPage({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <EmptyState icon={<Hourglass size={24} />} title={`${title} — ระยะ ${phase}`} description="หน้านี้อยู่ในแผนพัฒนาระยะถัดไปตามสเปก" />
    </div>
  )
}
