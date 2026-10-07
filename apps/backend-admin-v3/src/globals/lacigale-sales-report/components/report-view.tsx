'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Gutter } from '@payloadcms/ui'
import { fetchLacigaleSalesStats } from './actions'

export const ReportView: React.FC = () => {
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'all' | 'today' | 'yesterday' | 'month' | 'year'>('all')

  const reportRef = useRef<HTMLDivElement>(null)

  const fetchData = async () => {
    setLoading(true)
    const result = await fetchLacigaleSalesStats()
    if (result.success) setReportData(result.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const showToday = view === 'all' || view === 'today'
  const showYesterday = view === 'yesterday'
  const showMonth = view === 'all' || view === 'month'
  const showYear = view === 'all' || view === 'year'

  // Helper to determine which key to use based on view
  const getActiveKey = () => (view === 'all' ? 'today' : view)

  const formatLabel = (str: string) =>
    str
      .split(/[_\s]/)
      .map((w) => w.toUpperCase())
      .join(' ')

  const getBtnClass = (active: boolean) =>
    `px-10 py-3 text-sm font-bold font-noah transition-all duration-200 border-none cursor-pointer first:rounded-l-lg last:rounded-r-lg ${
      active
        ? 'bg-[#143422] text-[#DEC37D] shadow-md z-10'
        : 'bg-white text-gray-500 hover:bg-gray-100'
    }`

  const handlePrint = () => {
    const printContent = reportRef.current?.innerHTML
    const printWindow = window.open('', '_blank')

    if (printWindow && printContent) {
      printWindow.document.write(`
        <html>
          <head>
            <title>La Cigale Sales Report</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
              body { 
                font-family: 'Poppins', sans-serif; 
                padding: 30px; 
                background: white; 
                color: #333;
                font-size: 10px; 
              }
              .font-noah { font-family: sans-serif; font-weight: 700; text-transform: uppercase; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border-bottom: 1px solid #f3f4f6; padding: 4px 10px !important; }
              .bg-[#143422] { background-color: #143422 !important; color: #DEC37D !important; }
              .bg-[#245093] { background-color: #245093 !important; color: white !important; }
              .bg-[#666666] { background-color: #666666 !important; color: white !important; }
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              
              /* Force Guest column to be visible and colored for clarity */
              .guest-col { color: #2563eb !important; font-weight: bold; }
            </style>
          </head>
          <body>
            <div style="max-width: 1100px; margin: 0 auto;">
              ${printContent}
            </div>
            <script>
              // Wait for Tailwind and Fonts to settle
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  // Optional: window.close(); // Close tab after printing/saving
                }, 1000);
              };
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const ReportPod = ({ title, color, children, totalData, hasGuests = false }: any) => (
    <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 mb-10 overflow-hidden font-poppins">
      <div
        style={{ backgroundColor: color }}
        className="text-white p-5 px-8 flex justify-between items-center"
      >
        <span className="font-noah font-bold text-xl tracking-wider uppercase">{title}</span>
        {totalData && (
          <div className="flex gap-4 lg:gap-6 text-md font-bold opacity-90 font-noah items-center">
            {/* Yesterday Metric - The Newest Legend */}
            {(view === 'all' || view === 'yesterday') && (
              <span className="text-[#DEC37D]">
                Yesterday: {(totalData.revenue?.yesterday || totalData.yesterday)?.toLocaleString()}
              </span>
            )}

            {/* Today Metric */}
            {(view === 'all' || view === 'today') && (
              <span>Today: {(totalData.revenue?.today || totalData.today)?.toLocaleString()}</span>
            )}

            {/* Month Metric */}
            {(view === 'all' || view === 'month') && (
              <span>Month: {(totalData.revenue?.month || totalData.month)?.toLocaleString()}</span>
            )}

            {/* Year Metric */}
            {(view === 'all' || view === 'year') && (
              <span>Year: {(totalData.revenue?.year || totalData.year)?.toLocaleString()}</span>
            )}
          </div>
        )}
      </div>
      <div className="p-2 overflow-x-auto">
        <table className="table table-zebra w-full border-collapse">
          <thead>
            <tr className="text-gray-400 text-[11px] uppercase font-noah border-b border-gray-100">
              <th className="bg-transparent pl-6 text-left py-4">Breakdown</th>
              {hasGuests && (
                <th className="bg-transparent text-right py-4">
                  Guests (
                  {view === 'yesterday'
                    ? 'Yesterday'
                    : view === 'month'
                      ? 'Month'
                      : view === 'year'
                        ? 'Year'
                        : 'Today'}
                  )
                </th>
              )}
              {(showToday || showYesterday) && (
                <th className="bg-transparent text-right py-4">
                  {view === 'yesterday' ? 'Yesterday' : 'Today'}
                </th>
              )}
              {showMonth && <th className="bg-transparent text-right py-4">Month</th>}
              {showYear && <th className="bg-transparent text-right pr-6 py-4">Year</th>}
            </tr>
          </thead>
          <tbody className="text-sm">{children}</tbody>
        </table>
      </div>
    </div>
  )

  const DataRow = ({
    label,
    data,
    isBold = false,
    isCurrency = true,
    isPercentage = false,
    guestData = null,
  }: any) => {
    const activeKey = getActiveKey()
    return (
      <tr
        className={`${isBold ? 'font-bold text-[#143422] font-noah bg-gray-50' : 'font-poppins text-gray-700 hover:bg-gray-50'}`}
      >
        <td className="py-4 pl-6 border-b border-gray-100">{formatLabel(label)}</td>
        {guestData && (
          <td className="text-right py-4 font-mono border-b border-gray-100 text-blue-600 font-bold">
            {guestData[activeKey]?.toLocaleString() || '0'}
          </td>
        )}
        {(showToday || showYesterday) && (
          <td className="text-right py-4 font-mono border-b border-gray-100">
            {data[activeKey]?.toLocaleString()}
            {isPercentage ? '%' : isCurrency ? ' QAR' : ''}
          </td>
        )}
        {showMonth && (
          <td className="text-right py-4 font-mono border-b border-gray-100">
            {data.month?.toLocaleString()}
            {isPercentage ? '%' : isCurrency ? ' QAR' : ''}
          </td>
        )}
        {showYear && (
          <td className="text-right py-4 pr-6 font-mono border-b border-gray-100">
            {data.year?.toLocaleString()}
            {isPercentage ? '%' : isCurrency ? ' QAR' : ''}
          </td>
        )}
      </tr>
    )
  }

  return (
    <Gutter className="py-12 bg-gray-50/30 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 no-print gap-6">
        <div className="font-noah">
          <h1 className="text-5xl font-bold text-[#143422] m-0 tracking-tight uppercase">
            Reports
          </h1>
          <p className="text-gray-400 text-base mt-2 font-poppins italic">
            La Cigale Sales Report Dashboard
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="px-12 py-4 bg-[#143422] text-[#DEC37D] font-noah font-bold rounded-lg shadow-lg cursor-pointer"
        >
          PRINT REPORT
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between mb-16 no-print gap-4">
        <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <button onClick={() => setView('today')} className={getBtnClass(view === 'today')}>
            TODAY
          </button>
          <button
            onClick={() => setView('yesterday')}
            className={getBtnClass(view === 'yesterday')}
          >
            YESTERDAY
          </button>
          <button onClick={() => setView('month')} className={getBtnClass(view === 'month')}>
            MONTH
          </button>
          <button onClick={() => setView('year')} className={getBtnClass(view === 'year')}>
            YEAR
          </button>
        </div>
        <button
          onClick={() => setView('all')}
          className={`px-10 py-3 font-noah font-bold rounded-lg shadow-sm ${view === 'all' ? 'bg-[#DEC37D] text-[#143422]' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
        >
          RESET FULL VIEW
        </button>
      </div>

      <div ref={reportRef} className="w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 no-print">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#143422]"></div>
            <p className="text-gray-400 font-medium tracking-widest uppercase text-xs">
              Syncing Financial Records...
            </p>
          </div>
        ) : (
          reportData && (
            <div className="w-full">
              <div className="bg-[#143422] rounded-3xl p-10 text-[#DEC37D] flex flex-col md:flex-row justify-between items-center mb-16 shadow-xl">
                <div className="font-noah text-center md:text-left">
                  <span className="text-sm uppercase tracking-[0.3em] opacity-70 font-bold">
                    Revenue
                  </span>
                  <h2 className="text-4xl font-bold text-white mt-2 uppercase">
                    {view === 'all' ? 'Consolidated' : view} Summary
                  </h2>
                </div>
                <div className="text-center md:text-right">
                  <div className="text-6xl font-bold font-mono tracking-tighter text-white">
                    {reportData.grandTotal.revenue[getActiveKey()]?.toLocaleString()}{' '}
                    <span className="text-3xl text-[#DEC37D] ml-2">QAR</span>
                  </div>
                  {view !== 'yesterday' && view !== 'today' && (
                    <p className="text-sm font-bold text-[#DEC37D] mt-2">
                      Total Guests: {reportData.grandTotal.guests[getActiveKey()]?.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <ReportPod title="Rooms" color="#666666" totalData={reportData.rooms.revenue}>
                <DataRow
                  label="Occupied Rooms"
                  data={reportData.rooms.occupied}
                  isCurrency={false}
                />
                <DataRow
                  label="Comp / House Use"
                  data={reportData.rooms.complimentary}
                  isCurrency={false}
                />
                <DataRow
                  label="Occupancy %"
                  data={reportData.rooms.occupancy_perc}
                  isCurrency={false}
                  isPercentage={true}
                />
                <DataRow label="Rooms Revenue" data={reportData.rooms.revenue} isBold={true} />
              </ReportPod>

              <ReportPod
                title="Food & Beverages"
                color="#245093"
                totalData={reportData.fbTotals}
                hasGuests={true}
              >
                {reportData.fb.map((item: any) => (
                  <DataRow
                    key={item.label}
                    label={item.label}
                    data={item.revenue}
                    guestData={item.guests}
                  />
                ))}
                <DataRow
                  label="Total F&B Revenue"
                  data={reportData.fbTotals.revenue}
                  isBold={true}
                  guestData={reportData.fbTotals.guests}
                />
              </ReportPod>

              <ReportPod title="MOD & Others" color="#143422" totalData={reportData.miscTotals}>
                {reportData.misc.map((item: any) => (
                  <DataRow key={item.label} label={item.label} data={item} />
                ))}
                {/* The Missing Legend: MOD Total Row */}
                <DataRow label="Total MOD & Others" data={reportData.miscTotals} isBold={true} />
              </ReportPod>
            </div>
          )
        )}
      </div>
    </Gutter>
  )
}

export default ReportView
