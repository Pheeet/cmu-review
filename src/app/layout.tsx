import type { Metadata } from 'next'
import { Sarabun } from 'next/font/google'
import './globals.css'

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-sarabun',
})

export const metadata: Metadata = {
  title: 'รีวิวตัวฟรี มช.',
  description: 'รีวิวตัวฟรีของมหาวิทยาลัยเชียงใหม่ ค้นหาและอ่านรีวิวจากรุ่นพี่ก่อนลงทะเบียน',
  openGraph: {
    title: 'รีวิวตัวฟรี มช.',
    description: 'รีวิวตัวฟรีของมหาวิทยาลัยเชียงใหม่ ค้นหาและอ่านรีวิวจากรุ่นพี่ก่อนลงทะเบียน',
    url: 'https://cmu-review.vercel.app',
    siteName: 'รีวิวตัวฟรี มช.',
    images: [
      {
        url: 'https://cmu-review.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'รีวิวตัวฟรี มช.',
      }
    ],
    locale: 'th_TH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'รีวิวตัวฟรี มช.',
    description: 'รีวิวตัวฟรีของมหาวิทยาลัยเชียงใหม่',
    images: ['https://cmu-review.vercel.app/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body className={sarabun.className}>{children}</body>
    </html>
  )
}
