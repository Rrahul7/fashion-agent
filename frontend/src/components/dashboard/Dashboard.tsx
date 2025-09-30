'use client'

import { useState } from 'react'
import { Camera, History, User, Settings, Sparkles, Crown, Star } from 'lucide-react'
import { UploadSection } from './UploadSection'
import { ReviewHistory } from './ReviewHistory'
import { ProfileSection } from './ProfileSection'
import { useAuth } from '@/context/AuthContext'

type ActiveTab = 'upload' | 'history' | 'profile'

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('upload')
  const { user, logout } = useAuth()

  const tabs = [
    {
      id: 'upload' as ActiveTab,
      label: 'Analyze',
      icon: Camera,
      gradient: 'from-rose-500 to-pink-600'
    },
    {
      id: 'history' as ActiveTab,
      label: 'History',
      icon: History,
      gradient: 'from-purple-500 to-indigo-600'
    },
    {
      id: 'profile' as ActiveTab,
      label: 'Profile',
      icon: User,
      gradient: 'from-emerald-500 to-teal-600'
    },
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0 gradient-mesh-luxury"></div>

      {/* Header */}
      <div className="mobile-header relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl gradient-luxury-dark flex items-center justify-center">
                <Crown className="w-6 h-6 text-gold-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gold-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient-luxury">Fashion Agent</h1>
              <p className="text-luxury-600 text-sm font-medium">Premium Style Analysis</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-luxury-700 hover:bg-white/20 transition-all duration-300 hover:scale-105"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Welcome Message */}
        <div className="mt-6 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-gold-500" />
            <p className="text-luxury-700 font-medium">
              Welcome back, <span className="text-gradient-gold">{user?.email?.split('@')[0]}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mobile-content relative z-10">
        <div className="animate-luxury-fade">
          {renderContent()}
        </div>
      </div>

      {/* Premium Bottom Navigation */}
      <div className="mobile-bottom-nav relative z-10">
        <div className="flex justify-around items-center">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center py-3 px-6 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'transform scale-110'
                    : 'hover:scale-105'
                }`}
              >
                {/* Active Background */}
                {isActive && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} rounded-2xl opacity-20`}></div>
                )}

                {/* Icon Container */}
                <div className={`relative p-2 rounded-xl transition-all duration-300 ${
                  isActive
                    ? `bg-gradient-to-r ${tab.gradient} shadow-lg`
                    : 'bg-white/10 backdrop-blur-sm'
                }`}>
                  <Icon
                    size={20}
                    className={isActive ? 'text-white' : 'text-luxury-600'}
                  />
                </div>

                {/* Label */}
                <span className={`text-xs mt-2 font-semibold transition-all duration-300 ${
                  isActive
                    ? 'text-luxury-900'
                    : 'text-luxury-600'
                }`}>
                  {tab.label}
                </span>

                {/* Active Indicator */}
                {isActive && (
                  <div className={`absolute -bottom-1 w-1 h-1 bg-gradient-to-r ${tab.gradient} rounded-full`}></div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
