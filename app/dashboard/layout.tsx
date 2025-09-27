
import Link from 'next/link'
import { toast } from 'sonner'
import { usePathname } from 'next/navigation'
import { Flower, LogOut, User, Home, Shield } from 'lucide-react'
//
import { Button } from '~/components/ui/button'
import { authClient, useSession } from '~/lib/auth'

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
      <header className='border-b border-indigo-100 bg-white sticky top-0 z-10'>
        <div className='container mx-auto px-4 py-3 flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <Link href='/' className='flex items-center space-x-2'>
              <Flower className='h-6 w-6 text-indigo-500' />
              <span className='font-bold text-indigo-700'>Better Auth</span>
            </Link>
          </div>
          <nav className='hidden md:flex items-center space-x-6'>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1 relative ${isActive(item.href)
                  ? 'text-indigo-700 font-medium'
                  : 'text-gray-600 hover:text-indigo-600'
                  }`}
              >
                <item.icon className='h-4 w-4' />
                <span>{item.label}</span>
                {isActive(item.href) && (
                  <div className='absolute h-0.5 w-full bg-indigo-600 bottom-[-12px] left-0'></div>
                )}
              </Link>
            ))}

          </nav>
          <Button
            variant='outline'
            size='icon'
            onClick={handleLogout}
            className='text-gray-600 hover:text-indigo-600'
          >
            <LogOut className='h-5 w-5' />
            <span className='sr-only'>Logout</span>
          </Button>
        </div>
      </header>

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
