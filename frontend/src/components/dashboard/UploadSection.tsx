'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Camera, Upload, Sparkles, CheckCircle, X } from 'lucide-react'
import { reviewsApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { OutfitAnalysis } from './OutfitAnalysis'

interface ReviewResult {
  reviewId: string
  outfitAnalysis: {
    styleCategory: string
    styleCategoryScore: number
    fit: string
    fitScore: number
    colorHarmony: string
    colorHarmonyScore: number
    occasionSuitability: string
    occasionScore: number
    proportionBalance: string
    proportionScore: number
    fabricSynergy: string
    fabricScore: number
    stylingSophistication: string
    sophisticationScore: number
    overallScore: number
    highlights: string[]
    improvementSuggestions: string[]
    expertInsights: string[]
    technicalFlaws: string[]
  }
}

export function UploadSection() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ReviewResult | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedImage(file)
      setImagePreview(URL.createObjectURL(file))
      setResult(null) // Clear previous result
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  })

  const handleSubmit = async () => {
    if (!selectedImage) return

    try {
      setLoading(true)
      const response = await reviewsApi.create(selectedImage, description)
      setResult(response)
      toast.success('Outfit analyzed successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to analyze outfit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const clearImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setDescription('')
    setResult(null)
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
  }

  const startOver = () => {
    clearImage()
    setResult(null)
  }

  if (result) {
    return (
      <div className="animate-fade-in">
        <OutfitAnalysis 
          result={result}
          imageUrl={imagePreview}
          onStartOver={startOver}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Premium Hero Section */}
      <div className="text-center animate-luxury-fade">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl gradient-gold-luxury flex items-center justify-center shadow-glow-gold">
              <Sparkles className="w-10 h-10 text-white animate-pulse-slow" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center animate-bounce-subtle">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
          </div>
        </div>
        <h2 className="text-4xl font-bold text-gradient-luxury mb-4">Premium Style Analysis</h2>
        <p className="text-luxury-600 text-lg font-medium max-w-md mx-auto leading-relaxed">
          Experience luxury fashion insights powered by advanced AI technology
        </p>
      </div>

      {/* Premium Upload Area */}
      <div className="space-y-6">
        {!selectedImage ? (
          <div
            {...getRootProps()}
            className={`relative overflow-hidden card-luxury cursor-pointer transition-all duration-500 group ${
              isDragActive
                ? 'scale-105 shadow-luxury-lg border-gold-400'
                : 'hover:scale-102 hover:shadow-luxury-lg'
            }`}
          >
            <input {...getInputProps()} />

            {/* Animated Background */}
            <div className="absolute inset-0 gradient-mesh-luxury opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>

            {/* Content */}
            <div className="relative z-10 text-center py-12">
              <div className="mb-6">
                <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isDragActive
                    ? 'bg-gold-500 scale-110'
                    : 'bg-white/20 backdrop-blur-sm group-hover:bg-gold-500 group-hover:scale-110'
                }`}>
                  <Camera className={`w-8 h-8 transition-colors duration-300 ${
                    isDragActive ? 'text-white' : 'text-luxury-700 group-hover:text-white'
                  }`} />
                </div>
              </div>

              {isDragActive ? (
                <div className="animate-luxury-scale">
                  <p className="text-2xl font-bold text-luxury-900 mb-2">Perfect! Drop it here</p>
                  <p className="text-luxury-600 font-medium">Your style analysis awaits</p>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-luxury-900 mb-3">Upload Your Outfit</h3>
                  <p className="text-luxury-600 font-medium mb-6">Drag & drop or click to select your photo</p>
                  <div className="flex items-center justify-center">
                    <div className="btn-gold flex items-center space-x-3 group-hover:scale-105 transition-transform duration-300">
                      <Upload size={20} />
                      <span className="font-semibold">Choose Photo</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-luxury-scale">
            {/* Premium Image Preview */}
            <div className="relative card-luxury overflow-hidden">
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src={imagePreview!}
                  alt="Selected outfit"
                  className="w-full h-80 object-cover"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>

                {/* Remove Button */}
                <button
                  onClick={clearImage}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-300 hover:scale-110 flex items-center justify-center"
                >
                  <X size={18} />
                </button>

                {/* Success Indicator */}
                <div className="absolute bottom-4 left-4 flex items-center space-x-2 bg-emerald-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-xl">
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium">Photo Ready</span>
                </div>
              </div>
            </div>

            {/* Premium Description Input */}
            <div className="card-glass">
              <label className="block text-lg font-semibold text-luxury-900 mb-4">
                Style Context <span className="text-luxury-500 font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share the story behind this look... special occasion, style goals, inspiration, or anything that helps our AI understand your vision better."
                className="input-luxury resize-none"
                rows={4}
              />
            </div>

            {/* Premium Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full btn-luxury relative overflow-hidden group"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner-luxury mr-3"></div>
                  <span className="font-semibold">Analyzing Your Style...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center relative z-10">
                    <Sparkles className="w-6 h-6 mr-3 animate-pulse-slow" />
                    <span className="font-bold text-lg">Begin Premium Analysis</span>
                  </div>

                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000"></div>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Premium Tips Section */}
      <div className="card-glass animate-luxury-slide">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white text-sm">💡</span>
          </div>
          <h3 className="text-xl font-bold text-luxury-900">Pro Photography Tips</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {[
            { icon: '📸', title: 'Perfect Lighting', desc: 'Natural daylight or well-lit indoor space' },
            { icon: '🎯', title: 'Full Body Shot', desc: 'Show your complete outfit from head to toe' },
            { icon: '🎨', title: 'Clean Background', desc: 'Plain wall or minimal background works best' },
            { icon: '✨', title: 'Natural Pose', desc: 'Stand naturally, avoid heavy filters or editing' }
          ].map((tip, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-xl bg-white/30 backdrop-blur-sm">
              <span className="text-2xl">{tip.icon}</span>
              <div>
                <h4 className="font-semibold text-luxury-900">{tip.title}</h4>
                <p className="text-sm text-luxury-600">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
