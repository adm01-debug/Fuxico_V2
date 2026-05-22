// =============================================================================
// FUXICO - Dashboard com Sidebar Navigation
// =============================================================================

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { DashboardSkeleton } from '@/components/ui/skeletons'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  // Redundant check removed as PrivateRoute handles this logic.
  // This prevents double redirects and layout flashes.

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!user) return null

  return (
    <>
      <Helmet>
        <title>Dashboard | FUXICO</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <DashboardLayout />
    </>
  )
}
