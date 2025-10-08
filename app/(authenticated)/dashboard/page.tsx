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
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { DEFAULT_USER_ROLE, MONTH_NAME_MAPPING } from '@/lib/Constants'

import { RPC_FUNCTION } from '@/lib/Enums'
import { showServerErrorToast, showErrorToast } from '@/lib/helpers/Helper'
import { useLoadingContext } from '@/components/context_apis/LoadingProvider'
import { PurchaseOrderMonthlyTrendsData, SalesOrderMonthlyTrendsData } from '@/lib/types/Models'
import { CheckmarkIcon } from 'react-hot-toast'

import { useAuthContext } from '@/components/providers/AuthProvider'
import { makeRpcCall } from '@/lib/server_actions/report'

interface DashboardStats {
  totalItems: number
  lowStockItems: number
  pendingPurchaseOrders: number
  receivedPurchaseOrders: number
  pendingSalesOrders: number
  fulfilledSalesOrders: number
  totalValue: number
  monthlyGrowth: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    lowStockItems: 0,
    pendingPurchaseOrders: 0,
    receivedPurchaseOrders: 0,
    pendingSalesOrders: 0,
    fulfilledSalesOrders: 0,
    totalValue: 0,
    monthlyGrowth: 0
  })
  const [userRole, setUserRole] = useState<string>(DEFAULT_USER_ROLE)
  const [purchaseOrderMonthlyTrendsData, setPurchaseOrderMonthlyTrendsData] = useState<PurchaseOrderMonthlyTrendsData[]>([])
  const [salesOrderMonthlyTrendsData, setSalesOrderMonthlyTrendsData] = useState<SalesOrderMonthlyTrendsData[]>([])
  const {loading, setLoading} = useLoadingContext()
  const { currentUser } = useAuthContext();

  useEffect(() => {
    const loadDashboardStats = async () => {
  
      try {
        setLoading(true)
  
        const { data, error } = await makeRpcCall(RPC_FUNCTION.DASHBOARD_STATS)
  
        if (error) {
          showServerErrorToast(error.message)
          setLoading(false)
          return
        }
        setStats(data)
      } catch (error: any) {
          showErrorToast()
      } finally {
        setLoading(false)
      }
    }

    
    const loadOrderMonthlyTrends = async () => {  
      try {
        setLoading(true)
        const { data: poData, error: poError } = await makeRpcCall(RPC_FUNCTION.PURCHASE_ORDER_MONTHLY_TRENDS);
  
        if (poError) {
          showServerErrorToast(poError.message)
          setLoading(false)
          return
        }

        const podataProcessed: PurchaseOrderMonthlyTrendsData[] = poData.map((item: PurchaseOrderMonthlyTrendsData) => { 
          item.month_name = MONTH_NAME_MAPPING.get(item.month_name.split('-')[1])!
          return item
        })
        setPurchaseOrderMonthlyTrendsData(podataProcessed)
        
        const { data: soData, error: soError } = await makeRpcCall(RPC_FUNCTION.SALES_ORDER_MONTHLY_TRENDS);
  
        if (soError) {
          showServerErrorToast(soError.message)
          setLoading(false)
          return
        }
        
        const soDataProcessed: SalesOrderMonthlyTrendsData[] = soData.map((item: SalesOrderMonthlyTrendsData) => { 
          item.month_name = MONTH_NAME_MAPPING.get(item.month_name.split('-')[1])!
          return item
        })
        setSalesOrderMonthlyTrendsData(soDataProcessed)
      } catch (error: any) {
          showErrorToast()
      } finally {
        setLoading(false)
      }
    }

    loadDashboardStats()
    loadOrderMonthlyTrends()
  }, [currentUser])

  const orderReceiveRate = () => {
    if (!stats.receivedPurchaseOrders || !stats.pendingPurchaseOrders) {
      return '0%'
    }

    const rate = ((stats.receivedPurchaseOrders/(stats.receivedPurchaseOrders + stats.pendingPurchaseOrders)) * 100).toFixed(2)
    return `${rate}%`
  }
  
  const orderFulfillmentRate = () => {
    if (!stats.fulfilledSalesOrders || !stats.pendingSalesOrders) {
      return '0%'
    }

    const rate = ((stats.fulfilledSalesOrders/(stats.fulfilledSalesOrders + stats.pendingSalesOrders)) * 100).toFixed(2)
    return `${rate}%`
  }

  const inventoryInsightData = () => {
    return [
      { name: 'Expected sales', value: stats.pendingSalesOrders, color: '#10B981' },
      { name: 'Incomming Items', value: stats.pendingPurchaseOrders, color: '#3B82F6' },
      { name: 'Available Items', value: stats.totalItems, color: '#F59E0B' }
    ]
  }

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
          title="Pending Purchase Orders"
          value={stats.pendingPurchaseOrders}
          icon={TruckIcon}
          color="bg-purple-500"
        />
        <StatCard
          title="Received Orders"
          value={stats.receivedPurchaseOrders}
          icon={TruckIcon}
          color="bg-green-500"
        />
        <StatCard
          title="Receive Rate"
          value={orderReceiveRate()}
          icon={CheckmarkIcon}
          color="bg-purple-500"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockItems}
          icon={ExclamationTriangleIcon}
          color="bg-red-500"
        />
        <StatCard
          title="Pending Sales Orders"
          value={stats.pendingSalesOrders}
          icon={ShoppingCartIcon}
          color="bg-purple-500"
        />
        <StatCard
          title="Fulfilled Orders"
          value={stats.fulfilledSalesOrders}
          icon={ShoppingCartIcon}
          color="bg-green-500"
        />
        <StatCard
          title="Fulfillment Rate"
          value={orderFulfillmentRate()}
          icon={CheckmarkIcon}
          color="bg-purple-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Order Monthly Trends <small>(Last 6 months)</small></h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={purchaseOrderMonthlyTrendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month_name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="ordered_quantity" fill="#3B82F6" name="Ordered Quantity" />
              <Bar dataKey="canceled_quantity" fill="#F59E0B" name="Canceled Quantity" />
              <Bar dataKey="received_quantity" fill="#10B981" name="Received Quantity" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Order Monthly Trends <small>(Last 6 months)</small></h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesOrderMonthlyTrendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month_name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="ordered_quantity" fill="#3B82F6" name="Ordered Quantity" />
              <Bar dataKey="canceled_quantity" fill="#F59E0B" name="Canceled Quantity" />
              <Bar dataKey="fulfilled_quantity" fill="#10B981" name="Fulfilled Quantity" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Inventory Summary</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={inventoryInsightData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(2)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {inventoryInsightData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity and Feedback */}
      <div className="grid grid-cols-1 gap-6">
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
