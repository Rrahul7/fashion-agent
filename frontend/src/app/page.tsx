'use client'

import { useAuth } from '@/context/AuthContext'
import { LoginPage } from '@/components/auth/LoginPage'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { Loading } from '@/components/ui/Loading'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  if (!user) {
    return <LoginPage />
  }

  return <Dashboard />
}
