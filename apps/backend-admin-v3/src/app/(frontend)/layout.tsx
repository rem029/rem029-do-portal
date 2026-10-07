import React from 'react'
import './styles.css'
import { fontPrimary, fontSecondary, fontDefault } from '@/utilities/fonts'

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html
      lang="en"
      className={`${fontPrimary.className} ${fontSecondary.className} ${fontDefault.className}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <main>{children}</main>
      </body>
    </html>
  )
}
