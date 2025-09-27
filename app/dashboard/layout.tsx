"use client"
import Link from 'next/link'
import { toast } from 'sonner'
import { usePathname } from 'next/navigation'
import { Flower, LogOut, User, Home, Shield } from 'lucide-react'
//
import { Button } from '~/components/ui/button'
import { authClient, useSession } from '~/lib/auth'
import Topbar from '~/components/TopBar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const { data } = useSession()
  console.log(data, "session data")

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success('Logged out successfully', {
            description: 'You have been successfully logged out.',
          })
          window.location.href = '/auth/login'
        },
      },
    })
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/profile', label: 'Profile', icon: User },
    { href: '/dashboard/change-password', label: 'Security', icon: Shield },
  ]

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(path)
  }

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
