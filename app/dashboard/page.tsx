'use client'

import { useEffect, useState } from 'react'
import { 
  CubeIcon, 
  TruckIcon, 
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget'
import { FeedbackSummary } from '@/components/feedback/FeedbackSummary'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { DEFAULT_USER_ROLE } from '@/lib/Constants'

interface DashboardStats {
  totalItems: number
  lowStockItems: number
  pendingPurchaseOrders: number
  pendingSalesOrders: number
  totalValue: number
  monthlyGrowth: number
}

const monthlyData = [
  { month: 'Jan', inventory: 1200, purchase_orders: 800, sales_orders: 600 },
  { month: 'Feb', inventory: 1350, purchase_orders: 900, sales_orders: 750 },
  { month: 'Mar', inventory: 1100, purchase_orders: 700, sales_orders: 800 },
  { month: 'Apr', inventory: 1400, purchase_orders: 1000, sales_orders: 900 },
  { month: 'May', inventory: 1600, purchase_orders: 1200, sales_orders: 1100 },
  { month: 'Jun', inventory: 1800, purchase_orders: 1400, sales_orders: 1300 },
]

const categoryData = [
  { name: 'Electronics', value: 35, color: '#3B82F6' },
  { name: 'Clothing', value: 25, color: '#10B981' },
  { name: 'Books', value: 20, color: '#F59E0B' },
  { name: 'Home & Garden', value: 15, color: '#EF4444' },
  { name: 'Sports', value: 5, color: '#8B5CF6' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    lowStockItems: 0,
    pendingPurchaseOrders: 0,
    pendingSalesOrders: 0,
    totalValue: 0,
    monthlyGrowth: 0
  })
  const [userRole, setUserRole] = useState<string>(DEFAULT_USER_ROLE)

  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalItems: 1247,
        lowStockItems: 23,
        pendingPurchaseOrders: 8,
        pendingSalesOrders: 12,
        totalValue: 45678.90,
        monthlyGrowth: 12.5
      })
    }, 1000)
  }, [])

  const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center mt-1">
              {trend > 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(trend)}% from last month
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your inventory management system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Items"
          value={stats.totalItems.toLocaleString()}
          icon={CubeIcon}
          color="bg-blue-500"
          trend={stats.monthlyGrowth}
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockItems}
          icon={ExclamationTriangleIcon}
          color="bg-red-500"
        />
        <StatCard
          title="Pending PurchaseOrders"
          value={stats.pendingPurchaseOrders}
          icon={TruckIcon}
          color="bg-green-500"
        />
        <StatCard
          title="Pending Sales Orders"
          value={stats.pendingSalesOrders}
          icon={ShoppingCartIcon}
          color="bg-purple-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="inventory" fill="#3B82F6" name="Inventory" />
              <Bar dataKey="purchase_orders" fill="#10B981" name="PurchaseOrders" />
              <Bar dataKey="sales_orders" fill="#F59E0B" name="SalesOrders" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity and Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">New inventory item added: "Wireless Headphones"</span>
                </div>
                <span className="text-xs text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">Purchase order #PO-2024-001 received</span>
                </div>
                <span className="text-xs text-gray-500">4 hours ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">Sales order #SO-2024-015 fulfilled</span>
                </div>
                <span className="text-xs text-gray-500">6 hours ago</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">Low stock alert: "Gaming Mouse" (5 units remaining)</span>
                </div>
                <span className="text-xs text-gray-500">1 day ago</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          {userRole === 'admin' ? (
            <FeedbackSummary />
          ) : (
            <FeedbackWidget />
          )}
        </div>
      </div>
    </div>
  )
}
