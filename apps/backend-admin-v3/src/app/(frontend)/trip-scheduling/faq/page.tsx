import { getTripSchedulingPublicSettings } from '@/utilities/trip-scheduling-public-settings'
import { TripSchedulingHeader } from '../_components/trip-scheduling-header'

export const dynamic = 'force-dynamic'

export default async function TripSchedulingFaqPage() {
  const { generalBackground, faqs } = await getTripSchedulingPublicSettings()

  return (
    <main
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `linear-gradient(rgba(20, 52, 34, 0.55), rgba(20, 52, 34, 0.75)), ${generalBackground}`,
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="max-w-7xl mx-auto w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 relative z-10">
        <TripSchedulingHeader title="Transport & Logistics FAQ" subtitle="Quick Answers · Trip Scheduling" />

        <div className="p-6 sm:p-8 space-y-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {faqs.length === 0 && (
            <p className="text-center text-sm text-slate-500">No FAQs have been published yet.</p>
          )}
          {faqs.map((faq) => (
            <details
              key={faq.id}
              className="group border border-slate-200 rounded-xl overflow-hidden"
            >
              <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3 font-bold text-sm text-[#143422] hover:bg-slate-50 transition-colors">
                <span>{faq.question}</span>
                <span className="shrink-0 text-[#DEC37D] text-lg leading-none transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="px-4 pb-4 pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line border-t border-slate-100">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </main>
  )
}
