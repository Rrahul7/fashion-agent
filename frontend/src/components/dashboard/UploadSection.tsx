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
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-gray-800 p-4 rounded-full">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Style Analysis</h2>
        <p className="text-gray-600">Upload your outfit photo and get AI-powered fashion insights</p>
      </div>

      {/* Upload Area */}
      <div className="space-y-4">
        {!selectedImage ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragActive 
                ? 'border-gray-500 bg-gray-50' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-gray-700 font-medium">Drop your outfit photo here</p>
            ) : (
              <>
                <p className="text-gray-900 font-medium mb-2">Drag & drop your outfit photo</p>
                <p className="text-gray-500 text-sm">or click to browse files</p>
                <div className="flex items-center justify-center mt-4">
                  <div className="btn-outline flex items-center space-x-2">
                    <Upload size={16} />
                    <span>Choose Photo</span>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="relative">
            <div className="relative rounded-xl overflow-hidden bg-gray-100">
              <img 
                src={imagePreview!} 
                alt="Selected outfit" 
                className="w-full h-64 object-cover"
              />
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Description Input */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about this outfit... special occasion, what you're going for, etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full btn-primary mt-4"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner mr-2"></div>
                  Analyzing outfit...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Analyze My Outfit
                </div>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">📸 Tips for better analysis:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Take a full-body photo in good lighting</li>
          <li>• Stand against a plain background</li>
          <li>• Make sure your outfit is clearly visible</li>
          <li>• Avoid heavily filtered or edited images</li>
        </ul>
      </div>
    </div>
  )
}
