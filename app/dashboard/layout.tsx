"use client"
import { useSession } from '~/lib/auth'
import Topbar from '~/components/Topbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data, error, isPending, refetch } = useSession()
  console.log(error, "session data")

  return (
    <div className='min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col'>
      <Topbar />

      <main className='flex-1 container mx-auto px-4 py-8'>{children}</main>

      <footer className='border-t border-indigo-100 bg-white py-4'>
        <div className='container mx-auto px-4 text-center text-sm text-gray-500'>
          &copy; {new Date().getFullYear()} Better Auth Demo. All rights
          reserved.
        </div>
      </footer>
    </div>
  )
}
