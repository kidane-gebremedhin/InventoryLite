'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { 
  HomeIcon, 
  CubeIcon, 
  TruckIcon, 
  ShoppingCartIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  XMarkIcon,
  Bars3Icon,
  ChatBubbleLeftRightIcon,
  WindowIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { APP_NAME } from '@/lib/Constants'
import { FireIcon } from '@heroicons/react/24/solid'
import { useUserContext } from '@/components/context_apis/UserProvider'
import { getCurrentUserRole } from '@/lib/db_queries/DBQuery'
import { UserRole } from '@/lib/Enums'

export function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const {currentUser, setCurrentUser} = useUserContext()
  const pathname = usePathname()

  const navigationOptions = () => {
    return [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
      { name: 'Stores', href: '/dashboard/store', icon: BuildingStorefrontIcon },
      { name: 'Categories', href: '/dashboard/category', icon: WindowIcon },
      { name: 'Inventory Items', href: '/dashboard/inventory-items', icon: CubeIcon },
      { name: 'Suppliers', href: '/dashboard/suppliers', icon: BuildingStorefrontIcon },
      { name: 'Purchase Orders', href: '/dashboard/purchase-orders', icon: TruckIcon },
      { name: 'Customers', href: '/dashboard/customers', icon: UserGroupIcon },
      { name: 'Sales Orders', href: '/dashboard/sales-orders', icon: ShoppingCartIcon },
      { name: 'Transactions', href: '/dashboard/transactions', icon: FireIcon },
      { name: 'Reports', href: '/dashboard/reports', icon: ChartBarIcon },
      { name: 'Feedback', href: (getCurrentUserRole(currentUser) === UserRole.ADMIN ? '/dashboard/feedback-management' : '/dashboard/feedback'), icon: ChatBubbleLeftRightIcon },
      { name: 'Payments', href: '/dashboard/manual-payment', icon: CurrencyDollarIcon },
      { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
    ]
  }

  return (
    <>
      {/* Mobile sidebar */}
      <div className={clsx(
        'fixed inset-0 z-50 lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">{APP_NAME}</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigationOptions().map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'sidebar-link',
                    isActive && 'bg-primary-100 text-primary-700 border-primary-500'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-gray-900">{APP_NAME}</h1>
          </div>
          
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigationOptions().map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'sidebar-link',
                    isActive && 'bg-primary-100 text-primary-700 border-primary-500'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 p-2 text-gray-400 hover:text-gray-600"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>
    </>
  )
}
