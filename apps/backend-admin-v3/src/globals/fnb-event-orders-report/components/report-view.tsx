'use client'

import React from 'react'
import { FnbOrdersReportView } from '@/globals/fnb-orders-report/components/report-view'

export const FnbEventOrdersReportView: React.FC = () => {
  return <FnbOrdersReportView reportType="event" />
}

export default FnbEventOrdersReportView
