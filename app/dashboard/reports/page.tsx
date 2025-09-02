'use client'

import { useState } from 'react'
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
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { 
  ArrowDownTrayIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { showSuccessToast } from '@/lib/helpers/Helper'
import { useLoadingContext } from '@/components/context_apis/LoadingProvider'
import { useUserContext } from '@/components/context_apis/UserProvider'

const monthlyData = [
  { month: 'Jan', inventory: 1200, purchase_orders: 800, sales_orders: 600, revenue: 45000 },
  { month: 'Feb', inventory: 1350, purchase_orders: 900, sales_orders: 750, revenue: 52000 },
  { month: 'Mar', inventory: 1100, purchase_orders: 700, sales_orders: 800, revenue: 48000 },
  { month: 'Apr', inventory: 1400, purchase_orders: 1000, sales_orders: 900, revenue: 55000 },
  { month: 'May', inventory: 1600, purchase_orders: 1200, sales_orders: 1100, revenue: 62000 },
  { month: 'Jun', inventory: 1800, purchase_orders: 1400, sales_orders: 1300, revenue: 68000 },
]

const categoryData = [
  { name: 'Electronics', value: 35, color: '#3B82F6' },
  { name: 'Clothing', value: 25, color: '#10B981' },
  { name: 'Books', value: 20, color: '#F59E0B' },
  { name: 'Home & Garden', value: 15, color: '#EF4444' },
  { name: 'Sports', value: 5, color: '#8B5CF6' },
]

const topProducts = [
  { name: 'Wireless Headphones', sales: 245, revenue: 22050 },
  { name: 'Gaming Mouse', sales: 189, revenue: 11340 },
  { name: 'Laptop Stand', sales: 156, revenue: 7800 },
  { name: 'USB-C Cable', sales: 134, revenue: 2680 },
  { name: 'Wireless Charger', sales: 98, revenue: 4900 },
]

const performanceMetrics = [
  { metric: 'Inventory Turnover', value: '4.2x', change: '+12%', positive: true },
  { metric: 'Order Fulfillment Rate', value: '96.8%', change: '+2.1%', positive: true },
  { metric: 'Average Order Value', value: '$245', change: '-3.2%', positive: false },
  { metric: 'Stock Accuracy', value: '98.5%', change: '+0.8%', positive: true },
]

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('6months')
  const [reportType, setReportType] = useState('overview')
    // Global States
  const {loading, setLoading} = useLoadingContext()
  const {currentUser, setCurrentUser} = useUserContext()

  const handleExport = (type: string) => {
    // Simulate export functionality
    showSuccessToast(`${type} report exported successfully!`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into your inventory performance</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input-field"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
          <button
            onClick={() => handleExport('pdf')}
            className="btn-secondary flex items-center"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export PDF
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="btn-primary flex items-center"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {performanceMetrics.map((metric, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.metric}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <div className="flex items-center mt-1">
                  <span className={`text-sm ${metric.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.change}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${metric.positive ? 'bg-green-500' : 'bg-red-500'}`}>
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
            </AreaChart>
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

        {/* Inventory vs Orders */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory vs Orders</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="inventory" fill="#3B82F6" name="Inventory" />
              <Bar dataKey="purchase_orders" fill="#10B981" name="Purchase Orders" />
              <Bar dataKey="sales_orders" fill="#F59E0B" name="Sales Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products by Sales</h3>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.sales} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">${product.revenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Reports */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Reports</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setReportType('overview')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                reportType === 'overview' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setReportType('inventory')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                reportType === 'inventory' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setReportType('orders')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                reportType === 'orders' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setReportType('performance')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                reportType === 'performance' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Performance
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {reportType === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">1,247</p>
                <p className="text-sm text-gray-600">Total Items</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">$456,789</p>
                <p className="text-sm text-gray-600">Total Value</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">23</p>
                <p className="text-sm text-gray-600">Low Stock Items</p>
              </div>
            </div>
          )}

          {reportType === 'inventory' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Inventory Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Stock Levels</p>
                  <p className="text-lg font-semibold text-gray-900">Optimal</p>
                  <p className="text-xs text-gray-500">98.5% of items above minimum threshold</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Turnover Rate</p>
                  <p className="text-lg font-semibold text-gray-900">4.2x</p>
                  <p className="text-xs text-gray-500">Average annual inventory turnover</p>
                </div>
              </div>
            </div>
          )}

          {reportType === 'orders' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Order Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Purchase Orders</p>
                  <p className="text-lg font-semibold text-gray-900">8 Pending</p>
                  <p className="text-xs text-gray-500">$12,450 total value</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Sales Orders</p>
                  <p className="text-lg font-semibold text-gray-900">12 Pending</p>
                  <p className="text-xs text-gray-500">$28,900 total value</p>
                </div>
              </div>
            </div>
          )}

          {reportType === 'performance' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Performance Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Fulfillment Rate</p>
                  <p className="text-lg font-semibold text-gray-900">96.8%</p>
                  <p className="text-xs text-gray-500">Orders fulfilled on time</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Accuracy</p>
                  <p className="text-lg font-semibold text-gray-900">98.5%</p>
                  <p className="text-xs text-gray-500">Inventory count accuracy</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
