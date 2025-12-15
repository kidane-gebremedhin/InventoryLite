'use client'

import { useEffect, useState } from 'react'
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
  CurrencyDollarIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import { FireIcon } from '@heroicons/react/24/solid'
import { ROUTE_PATH, UserRole } from '@/lib/Enums'
import { APP_NAME } from '@/lib/app_config/config'
import { useAuthContext } from '../providers/AuthProvider'
import MiniLoading from '../helpers/MiniLoading'

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [options, setOptions] = useState([])
  const { currentUser } = useAuthContext()
  const pathname = usePathname()

  useEffect(() => {
    setOptions(navigationOptions())
  }, [currentUser])

  const navigationOptions = () => {
    const paths = [
      { name: 'Dashboard', href: ROUTE_PATH.DASHBOARD, icon: HomeIcon },
      { name: 'Stores', href: ROUTE_PATH.STORE, icon: BuildingStorefrontIcon },
      { name: 'Categories', href: ROUTE_PATH.CATEGORY, icon: WindowIcon },
      { name: 'Variants', href: ROUTE_PATH.VARIANT, icon: CubeIcon },
      { name: 'Inventory Items', href: ROUTE_PATH.INVENTORY_ITEM, icon: CubeIcon },
      { name: 'Suppliers', href: ROUTE_PATH.SUPPLIER, icon: BuildingStorefrontIcon },
      { name: 'Purchase Orders', href: ROUTE_PATH.PURCHASE_ORDER, icon: TruckIcon },
      { name: 'Customers', href: ROUTE_PATH.CUSTOMER, icon: UserGroupIcon },
      { name: 'Sales Orders', href: ROUTE_PATH.SALES_ORDER, icon: ShoppingCartIcon },
      { name: 'Transactions', href: ROUTE_PATH.TRANSACTION, icon: FireIcon },
      { name: 'Reports', href: ROUTE_PATH.REPORT, icon: ChartBarIcon },
      { name: 'Feedback', href: (currentUser?.subscriptionInfo?.role === UserRole.SUPER_ADMIN ? ROUTE_PATH.ADMIN_FEEDBACK_MANAGEMENT : ROUTE_PATH.FEEDBACK), icon: ChatBubbleLeftRightIcon },
      { name: currentUser?.subscriptionInfo?.role === UserRole.SUPER_ADMIN ? 'Manual Payments' : 'My Subscription', href: ROUTE_PATH.MANUAL_PAYMENT, icon: CurrencyDollarIcon },
    ];

    let tenantAdminPaths = []
    let superAdminPaths = []
    if ([UserRole.SUPER_ADMIN.toString(), UserRole.TENANT_ADMIN.toString()].includes(currentUser?.subscriptionInfo?.role)) {
      tenantAdminPaths = [
        { name: 'Staff Members', href: ROUTE_PATH.INVITE_USER, icon: UsersIcon }
      ]
    }
    if (currentUser?.subscriptionInfo?.role === UserRole.SUPER_ADMIN) {
      superAdminPaths = [
        { name: 'Subscription Plans', href: ROUTE_PATH.SUBSCRIPTION_PLAN, icon: CurrencyDollarIcon },
        { name: 'Business Domains', href: ROUTE_PATH.DOMAIN, icon: BuildingStorefrontIcon }
      ]
    }

    return [...paths, ...tenantAdminPaths, ...superAdminPaths]
  }

  if (!currentUser) return <MiniLoading />

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
            {options.map((item) => {
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
            {options.map((item) => {
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
