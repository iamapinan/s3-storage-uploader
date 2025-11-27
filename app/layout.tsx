import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'S3 File Manager',
  description: 'A web application for managing files in S3-compatible storage',
}

import { AuthProvider } from '@/app/context/AuthContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ErrorBoundary>
            <div className="min-h-screen bg-gray-50">
              {children}
            </div>
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  )
}