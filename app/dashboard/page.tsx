import { PageTitle } from "@/components/page-title"
import { DashboardCards } from "@/components/dashboard/dashboard-cards"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { UpcomingAssignments } from "@/components/dashboard/upcoming-assignments"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { StudentAnalytics } from "@/components/dashboard/student-analytics"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"

export default async function DashboardPage() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null // Will be handled by middleware
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

  const isAdmin = profile?.role === "admin"
  const isStudent = profile?.role === "student"

  return (
    <div className="space-y-8">
      <PageTitle title="Dashboard" description={`Welcome to your ${isAdmin ? "admin" : ""} dashboard`} />

      {isAdmin ? (
        <AdminDashboard />
      ) : (
        <>
          <DashboardCards />

          {isStudent && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Your Performance</h2>
              <StudentAnalytics />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <UpcomingAssignments />
            <RecentActivity />
          </div>
        </>
      )}
    </div>
  )
}
