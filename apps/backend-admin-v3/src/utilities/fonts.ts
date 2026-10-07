import { Poppins, Baskervville, Inter } from 'next/font/google'
import localFont from 'next/font/local'

export const inter = Inter({
  weight: '500',
  subsets: ['latin'],
})

export const noah = localFont({
  src: [
    { path: '../fonts/Noah-Bold.ttf', weight: '700', style: 'normal' },
    { path: '../fonts/Noah-Regular.ttf', weight: '500', style: 'normal' },
    { path: '../fonts/Noah-RegularItalic.ttf', weight: '500', style: 'italic' },
  ],
  variable: '--font-noah',
})

export const gilroy = localFont({
  src: [
    { path: '../fonts/Gilroy-ExtraBold.otf', weight: '800', style: 'normal' },
    { path: '../fonts/Gilroy-Light.otf', weight: '300', style: 'normal' },
  ],
  variable: '--font-gilroy',
})

export const poppinsLight = Poppins({
  weight: '200',
  subsets: ['latin'],
})

export const poppinsNormal = Poppins({
  weight: '500',
  subsets: ['latin'],
})

export const baskerville = Baskervville({ weight: '400', subsets: ['latin'] })

// Standard font mapping for the application
export const fontPrimary = noah
export const fontSecondary = gilroy
export const fontDefault = poppinsNormal
