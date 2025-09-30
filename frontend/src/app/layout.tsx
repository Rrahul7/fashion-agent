import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext'

const inter = Inter({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Fashion Agent - Premium AI Style Insights',
  description: 'Experience luxury fashion analysis with AI-powered insights for your style choices',
  keywords: 'fashion, AI, style, luxury, premium, outfit analysis',
  authors: [{ name: 'Fashion Agent' }],
  creator: 'Fashion Agent',
  publisher: 'Fashion Agent',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1a1a1a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <div className="mobile-container">
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 5000,
                style: {
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  backdropFilter: 'blur(20px)',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '16px 20px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                },
                success: {
                  style: {
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  },
                },
                error: {
                  style: {
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  },
                },
              }}
            />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
