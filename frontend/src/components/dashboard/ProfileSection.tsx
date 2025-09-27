'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { User, Save, LogOut } from 'lucide-react'
import { profileApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

interface ProfileForm {
  skinTone: string
  build: string
  faceStructure: string
  hairType: string
  height: string
  weight: string
}

export function ProfileSection() {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const form = useForm<ProfileForm>({
    defaultValues: {
      skinTone: '',
      build: '',
      faceStructure: '',
      hairType: '',
      height: '',
      weight: '',
    }
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await profileApi.get()
      
      if (response.profile) {
        form.reset({
          skinTone: response.profile.skinTone || '',
          build: response.profile.build || '',
          faceStructure: response.profile.faceStructure || '',
          hairType: response.profile.hairType || '',
          height: response.profile.height?.toString() || '',
          weight: response.profile.weight?.toString() || '',
        })
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: ProfileForm) => {
    try {
      setSaving(true)
      await profileApi.update({
        ...data,
        height: data.height ? parseFloat(data.height) : undefined,
        weight: data.weight ? parseFloat(data.weight) : undefined,
      })
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-gray-800 p-4 rounded-full">
            <User className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Profile</h2>
        <p className="text-gray-600">Help our AI provide personalized fashion advice</p>
      </div>

      {/* User Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-center">
          <p className="text-gray-600 text-sm">Signed in as</p>
          <p className="font-medium text-gray-900">{user?.email}</p>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          {/* Skin Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skin Tone
            </label>
            <select
              {...form.register('skinTone')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900"
            >
              <option value="">Select your skin tone</option>
              <option value="fair">Fair</option>
              <option value="light">Light</option>
              <option value="medium">Medium</option>
              <option value="tan">Tan</option>
              <option value="olive">Olive</option>
              <option value="dark">Dark</option>
              <option value="deep">Deep</option>
            </select>
          </div>

          {/* Build */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Body Build
            </label>
            <select
              {...form.register('build')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900"
            >
              <option value="">Select your build</option>
              <option value="petite">Petite</option>
              <option value="slim">Slim</option>
              <option value="athletic">Athletic</option>
              <option value="curvy">Curvy</option>
              <option value="plus-size">Plus Size</option>
            </select>
          </div>

          {/* Face Structure */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Face Structure
            </label>
            <select
              {...form.register('faceStructure')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900"
            >
              <option value="">Select your face shape</option>
              <option value="oval">Oval</option>
              <option value="round">Round</option>
              <option value="square">Square</option>
              <option value="heart">Heart</option>
              <option value="diamond">Diamond</option>
              <option value="oblong">Oblong</option>
            </select>
          </div>

          {/* Hair Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hair Type
            </label>
            <select
              {...form.register('hairType')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900"
            >
              <option value="">Select your hair type</option>
              <option value="straight">Straight</option>
              <option value="wavy">Wavy</option>
              <option value="curly">Curly</option>
              <option value="coily">Coily</option>
              <option value="bald">Bald</option>
            </select>
          </div>

          {/* Height and Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Height (cm)
              </label>
              <input
                type="number"
                placeholder="170"
                {...form.register('height')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg)
              </label>
              <input
                type="number"
                placeholder="70"
                {...form.register('weight')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full btn-primary"
        >
          {saving ? (
            <div className="flex items-center justify-center">
              <div className="spinner mr-2"></div>
              Saving...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </div>
          )}
        </button>
      </form>

      {/* Privacy Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-800 mb-2">Privacy & Data</h3>
        <p className="text-sm text-gray-700">
          Your profile information is used solely to provide personalized fashion advice. 
          We don't share your personal data with third parties.
        </p>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full btn-secondary flex items-center justify-center text-gray-700 hover:bg-gray-100"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </button>
    </div>
  )
}
