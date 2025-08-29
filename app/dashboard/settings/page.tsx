'use client'

import { useState, useEffect } from 'react'
import { 
  UserIcon, 
  ShieldCheckIcon, 
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { useUserContext } from '@/components/contextApis/UserProvider'

const tabs = [
  { name: 'Profile', icon: UserIcon },
  { name: 'Security', icon: ShieldCheckIcon },
  { name: 'Preferences', icon: Cog6ToothIcon },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Profile')

  const { currentUser, setCurrentUser } = useUserContext()

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
              <p className="text-sm text-gray-500">Your Google account information.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" className="input-field mt-1" defaultValue={currentUser.fullName} disabled />
                <p className="text-xs text-gray-500 mt-1">Managed by Google account</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" className="input-field mt-1" defaultValue={currentUser.email} disabled />
                <p className="text-xs text-gray-500 mt-1">Managed by Google account</p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">
                To update your profile information, please visit your Google account settings.
              </p>
            </div>
          </div>
        )

      case 'Security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
              <p className="text-sm text-gray-500">Your account security is managed by Google.</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900">Google Account Security</h4>
                <p className="text-sm text-sky-400 mt-1">
                  Your account security, including two-factor authentication and password management, 
                  is handled by your Google account settings.
                </p>
                <a 
                  href="https://myaccount.google.com/security" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-500 mt-2 inline-block"
                >
                  Manage Google Account Security →
                </a>
              </div>
            </div>
          </div>
        )

      case 'Preferences':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Application Preferences</h3>
              <p className="text-sm text-gray-500">Customize your application experience.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Language</label>
                <select className="input-field mt-1">
                  <option>English</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time Zone</label>
                <select className="input-field mt-1">
                  <option>UTC</option>
                </select>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences.</p>
      </div>

      <div className="flex space-x-8">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === tab.name
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="mr-3 h-5 w-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
