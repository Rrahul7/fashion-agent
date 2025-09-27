'use client'

import { useState } from 'react'
import { Camera, History, User, Settings, Upload } from 'lucide-react'
import { UploadSection } from './UploadSection'
import { ReviewHistory } from './ReviewHistory'
import { ProfileSection } from './ProfileSection'
import { useAuth } from '@/context/AuthContext'

type ActiveTab = 'upload' | 'history' | 'profile'

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('upload')
  const { user, logout } = useAuth()

  const tabs = [
    { id: 'upload' as ActiveTab, label: 'Upload', icon: Camera },
    { id: 'history' as ActiveTab, label: 'History', icon: History },
    { id: 'profile' as ActiveTab, label: 'Profile', icon: User },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return <UploadSection />
      case 'history':
        return <ReviewHistory />
      case 'profile':
        return <ProfileSection />
      default:
        return <UploadSection />
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="mobile-header gradient-fashion">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Fashion Agent</h1>
            <p className="text-white/80 text-sm">Welcome, {user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-white/80 hover:text-white transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mobile-content">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <div className="flex justify-around">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-2 px-4 rounded-lg transition-all ${
                  isActive 
                    ? 'text-gray-900 bg-gray-100' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs mt-1 font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
