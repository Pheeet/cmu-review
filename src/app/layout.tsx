import type { Metadata } from 'next'
import { Sarabun } from 'next/font/google'
import './globals.css'

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-sarabun',
})

export const metadata: Metadata = {
  title: 'รีวิวตัวฟรีมช.',
  description: 'รีวิวตัวฟรีของมหาวิทยาลัยเชียงใหม่',
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
