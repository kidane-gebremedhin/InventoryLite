'use client'

import { useState } from 'react'
import { 
  UserIcon, 
  ShieldCheckIcon, 
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { triggerInsertSeedData } from '@/lib/server_actions/setting'

import { useAuthContext } from '@/components/providers/AuthProvider'
import MiniLoading from '@/components/helpers/MiniLoading'
import { RPC_FUNCTION, SettingSection } from '@/lib/Enums'
import { showErrorToast } from '@/lib/helpers/Helper'
import { ConfirmationModal } from '@/components/helpers/ConfirmationModal'
import { useLoadingContext } from '@/components/context_apis/LoadingProvider'
import { deleteUserAccount } from '@/lib/server_actions/user'

const tabs = [
  { name: SettingSection.PROFILE, icon: UserIcon },
  { name: SettingSection.SECURITY, icon: ShieldCheckIcon },
  { name: SettingSection.PERFERENCES, icon: Cog6ToothIcon }
]

export default function SettingsPage() {
  
  const [activeTab, setActiveTab] = useState(SettingSection.PROFILE)
  const [isDeleteUserAccountModalOpen, setIsDeleteUserAccountModalOpen] = useState(false)

  const { currentUser, signOut } = useAuthContext()
  const {loading, setLoading} = useLoadingContext()

  const insertSeedData = async () => {
    triggerInsertSeedData();
  }

  const handleDeleteUserAccount = async () => {
    try {
      // RPC call
      const { data, error } = await deleteUserAccount(currentUser.id);
    
      if (error) {
        showErrorToast()
        return;
      }

      await signOut();
    } catch (error: any) {
        showErrorToast()
    } finally {
      setIsDeleteUserAccountModalOpen(false);
      setLoading(false)
    }
  }

  if (!currentUser) return <MiniLoading />
  
  const renderTabContent = () => {
    switch (activeTab) {
      case SettingSection.PROFILE:
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
            <div className="text-center">
              <button className="btn text-red-400" onClick={() => setIsDeleteUserAccountModalOpen(true)}>Delete My Account</button>
            </div>
          </div>
        )

      case SettingSection.SECURITY:
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

      case SettingSection.PERFERENCES:
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences.</p>
        <div></div>
        <button className="btn-primary"
          onClick={insertSeedData}
        >
          Insert Seed Data
        </button>
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <div className="overflow-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === tab.name
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="mr-3 h-5 w-5" />
              {tab.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex space-x-8">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex lg:flex">
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

      {/* Confirmation Modal for Delete user account */}
      <ConfirmationModal
        isOpen={isDeleteUserAccountModalOpen}
        id="#"
        message="Are you sure you want to completly delete your account? Once confirmed, this can not be undone! Deleting this project will also remove your database.
Make sure you have made a backup if you want to keep your data."
        onConfirmationSuccess={handleDeleteUserAccount}
        onConfirmationFailure={() => setIsDeleteUserAccountModalOpen(false)}
      />
    </div>
  )
}
