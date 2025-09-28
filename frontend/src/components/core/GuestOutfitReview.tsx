'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Camera, Upload, Sparkles, Star, Target, Palette, Shirt, TrendingUp, RefreshCw, MessageCircle, AlertTriangle, Lightbulb } from 'lucide-react'
import toast from 'react-hot-toast'
import { FeedbackModal } from './FeedbackModal'

interface GuestUsage {
  used: number
  limit: number
  remaining: number
}

interface OutfitAnalysis {
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
  expertInsights?: string[]
  technicalFlaws?: string[]
}

interface ReviewResult {
  reviewId: string
  outfitAnalysis: OutfitAnalysis
  guestUsage?: GuestUsage
}

export function GuestOutfitReview() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [guestUsage, setGuestUsage] = useState<GuestUsage>({ used: 0, limit: 3, remaining: 3 })
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackGiven, setFeedbackGiven] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedImage(file)
      setImagePreview(URL.createObjectURL(file))
      setResult(null)
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

    if (guestUsage.remaining <= 0) {
      toast.error('You\'ve reached the guest review limit. Please sign up for unlimited reviews!')
      return
    }

    try {
      setLoading(true)
      
      const formData = new FormData()
      formData.append('image', selectedImage)
      if (description) formData.append('description', description)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/guest/reviews`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.code === 'LIMIT_REACHED') {
          toast.error(errorData.message)
          return
        }
        throw new Error(errorData.error || 'Failed to analyze outfit')
      }

      const data = await response.json()
      setResult(data)
      if (data.guestUsage) {
        setGuestUsage(data.guestUsage)
      }
      
      toast.success('Outfit analyzed successfully!')
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to analyze outfit. Please try again.')
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
    setFeedbackGiven(false)
    setShowFeedbackModal(false)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A+'
    if (score >= 80) return 'A'
    if (score >= 70) return 'B'
    if (score >= 60) return 'C'
    return 'D'
  }

  if (result) {
    const { outfitAnalysis } = result

    // Check for "no outfit" case
    if (outfitAnalysis.styleCategory === 'no outfit' || outfitAnalysis.overallScore === 0) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header with usage info */}
            <div className="text-center mb-8">
              <div className="flex justify-center items-center mb-4">
                <div className="bg-white shadow-lg p-4 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">No Outfit Detected</h1>
              <p className="text-gray-600 mb-4">We couldn't find substantial clothing to analyze in this image</p>
              
              {guestUsage && (
                <div className="inline-flex items-center bg-white border border-gray-200 rounded-full px-4 py-2 text-sm">
                  <span className="text-gray-600 mr-2">Guest Reviews:</span>
                  <span className="font-semibold text-indigo-600">{guestUsage.used}/{guestUsage.limit}</span>
                  {guestUsage.remaining <= 1 && (
                    <span className="ml-2 text-orange-600 text-xs">({guestUsage.remaining} remaining)</span>
                  )}
                </div>
              )}
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-8 text-center">
                <img 
                  src={imagePreview} 
                  alt="Uploaded image" 
                  className="max-w-md mx-auto rounded-2xl shadow-lg"
                />
              </div>
            )}

            {/* No Outfit Message */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-orange-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Fashion Analysis Not Possible</h3>
              </div>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Our AI fashion expert needs to see actual clothing to provide analysis. This image appears to show:
                </p>
                <ul className="text-gray-700 space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-4 flex-shrink-0"></div>
                    <span>No substantial clothing or garments visible</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-4 flex-shrink-0"></div>
                    <span>Insufficient outfit elements for fashion evaluation</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Suggestions */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <div className="flex items-center mb-4">
                <Lightbulb className="w-6 h-6 text-indigo-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">For Best Results</h3>
              </div>
              <ul className="text-gray-700 space-y-3">
                <li className="flex items-start">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 mr-4 flex-shrink-0"></div>
                  <span>Upload a photo showing a complete outfit with clothing</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 mr-4 flex-shrink-0"></div>
                  <span>Include tops, bottoms, and accessories when possible</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 mr-4 flex-shrink-0"></div>
                  <span>Make sure the full outfit is clearly visible</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 mr-4 flex-shrink-0"></div>
                  <span>Use good lighting and a clear background</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="text-center space-y-4">
              <button
                onClick={startOver}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-xl flex items-center justify-center mx-auto transition-colors"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Upload New Outfit Photo
              </button>
              
              {guestUsage.remaining <= 1 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                  <h3 className="font-semibold text-orange-900 mb-2">
                    {guestUsage.remaining === 0 ? 'All Reviews Used!' : 'Last Free Review!'}
                  </h3>
                  <p className="text-orange-800 mb-4">
                    {guestUsage.remaining === 0 
                      ? 'Sign up for unlimited outfit reviews and advanced features!'
                      : 'You have 1 review left. Sign up for unlimited access!'
                    }
                  </p>
                  <button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
                    Create Free Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header with usage info */}
          <div className="text-center mb-8">
            <div className="flex justify-center items-center mb-4">
              <div className="bg-white shadow-lg p-4 rounded-full">
                <Sparkles className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analysis Complete!</h1>
            <p className="text-gray-600 mb-4">Here's your fashion breakdown</p>
            
            {guestUsage && (
              <div className="inline-flex items-center bg-white border border-gray-200 rounded-full px-4 py-2 text-sm">
                <span className="text-gray-600 mr-2">Guest Reviews:</span>
                <span className="font-semibold text-indigo-600">{guestUsage.used}/{guestUsage.limit}</span>
                {guestUsage.remaining <= 1 && (
                  <span className="ml-2 text-orange-600 text-xs">({guestUsage.remaining} remaining)</span>
                )}
              </div>
            )}
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-8 text-center">
              <img 
                src={imagePreview} 
                alt="Analyzed outfit" 
                className="max-w-md mx-auto rounded-2xl shadow-lg"
              />
            </div>
          )}

          {/* Overall Score */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-indigo-100 mb-4">
                <span className="text-3xl font-bold text-indigo-600">{getScoreGrade(outfitAnalysis.overallScore)}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Overall Score</h2>
              <div className="text-4xl font-bold text-gray-900 mb-2">{outfitAnalysis.overallScore}/100</div>
              <p className="text-gray-600">Your outfit analysis breakdown</p>
            </div>
          </div>

          {/* Fashion Parameter Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className={`bg-white border-2 rounded-xl p-6 ${getScoreColor(outfitAnalysis.styleCategoryScore)}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Shirt className="w-6 h-6 mr-3" />
                  <span className="font-semibold">Style</span>
                </div>
                <span className="text-2xl font-bold">{outfitAnalysis.styleCategoryScore}</span>
              </div>
              <div className="text-lg capitalize font-medium">{outfitAnalysis.styleCategory}</div>
            </div>

            <div className={`bg-white border-2 rounded-xl p-6 ${getScoreColor(outfitAnalysis.fitScore)}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Target className="w-6 h-6 mr-3" />
                  <span className="font-semibold">Fit</span>
                </div>
                <span className="text-2xl font-bold">{outfitAnalysis.fitScore}</span>
              </div>
              <div className="text-lg capitalize font-medium">{outfitAnalysis.fit}</div>
            </div>

            <div className={`bg-white border-2 rounded-xl p-6 ${getScoreColor(outfitAnalysis.colorHarmonyScore)}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Palette className="w-6 h-6 mr-3" />
                  <span className="font-semibold">Colors</span>
                </div>
                <span className="text-2xl font-bold">{outfitAnalysis.colorHarmonyScore}</span>
              </div>
              <div className="text-lg capitalize font-medium">{outfitAnalysis.colorHarmony}</div>
            </div>

            <div className={`bg-white border-2 rounded-xl p-6 ${getScoreColor(outfitAnalysis.occasionScore)}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Star className="w-6 h-6 mr-3" />
                  <span className="font-semibold">Occasion</span>
                </div>
                <span className="text-2xl font-bold">{outfitAnalysis.occasionScore}</span>
              </div>
              <div className="text-lg capitalize font-medium">{outfitAnalysis.occasionSuitability}</div>
            </div>
          </div>

          {/* Highlights */}
          {outfitAnalysis.highlights.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">What's Working</h3>
              </div>
              <ul className="space-y-3">
                {outfitAnalysis.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2 mr-4 flex-shrink-0"></div>
                    <span className="text-gray-700">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {outfitAnalysis.improvementSuggestions.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <div className="flex items-center mb-4">
                <Sparkles className="w-6 h-6 text-indigo-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Level Up Tips</h3>
              </div>
              <ul className="space-y-3">
                {outfitAnalysis.improvementSuggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 mr-4 flex-shrink-0"></div>
                    <span className="text-gray-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Feedback Section */}
          {!feedbackGiven && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <div className="text-center">
                <MessageCircle className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How was your experience?</h3>
                <p className="text-gray-600 mb-4">Your feedback helps us improve our AI fashion expert</p>
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Give Feedback
                </button>
              </div>
            </div>
          )}

          {feedbackGiven && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8 text-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="w-4 h-4 text-green-600 fill-current" />
              </div>
              <h3 className="font-semibold text-green-900 mb-1">Thank you!</h3>
              <p className="text-green-700">Your feedback helps us improve our fashion analysis</p>
            </div>
          )}

          {/* Actions */}
          <div className="text-center space-y-4">
            <button
              onClick={startOver}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-xl flex items-center justify-center mx-auto transition-colors"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Analyze Another Outfit
            </button>
            
            {guestUsage.remaining <= 1 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                <h3 className="font-semibold text-orange-900 mb-2">
                  {guestUsage.remaining === 0 ? 'All Reviews Used!' : 'Last Free Review!'}
                </h3>
                <p className="text-orange-800 mb-4">
                  {guestUsage.remaining === 0 
                    ? 'Sign up for unlimited outfit reviews and advanced features!'
                    : 'You have 1 review left. Sign up for unlimited access!'
                  }
                </p>
                <button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
                  Create Free Account
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Modal */}
        <FeedbackModal
          reviewId={result.reviewId}
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          onSuccess={() => setFeedbackGiven(true)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <div className="bg-white shadow-lg p-4 rounded-full">
              <Sparkles className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Fashion Expert</h1>
          <p className="text-xl text-gray-600 mb-6">Get instant outfit analysis from our AI stylist</p>
          
          {/* Guest Usage Indicator */}
          <div className="inline-flex items-center bg-white border border-gray-200 rounded-full px-6 py-3 shadow-sm">
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Free Reviews:</span>
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < guestUsage.used ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold text-indigo-600">{guestUsage.remaining} left</span>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          {!selectedImage ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                isDragActive 
                  ? 'border-indigo-400 bg-indigo-50' 
                  : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              {isDragActive ? (
                <p className="text-xl text-indigo-700 font-medium">Drop your outfit photo here</p>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Upload Your Outfit</h2>
                  <p className="text-gray-600 text-lg mb-6">Drag & drop or click to browse</p>
                  <div className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
                    <Upload className="w-5 h-5 mr-2" />
                    Choose Photo
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <img 
                  src={imagePreview!} 
                  alt="Selected outfit" 
                  className="max-w-md mx-auto rounded-2xl shadow-lg"
                />
                <button
                  onClick={clearImage}
                  className="mt-4 text-gray-500 hover:text-gray-700 font-medium"
                >
                  Change Photo
                </button>
              </div>
              
              {/* Description Input */}
              <div>
                <label className="block text-lg font-medium text-gray-900 mb-3">
                  Tell us about this outfit (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Special occasion, style goals, or anything else you'd like our AI to consider..."
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500 text-lg"
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading || guestUsage.remaining <= 0}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl text-lg transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Analyzing your style...
                  </div>
                ) : guestUsage.remaining <= 0 ? (
                  'Review limit reached'
                ) : (
                  <div className="flex items-center justify-center">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Get My Style Analysis
                  </div>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📸 Tips for Best Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-indigo-500 mr-3"></div>
              Full-body photo in good lighting
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-indigo-500 mr-3"></div>
              Plain background works best
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-indigo-500 mr-3"></div>
              Show your complete outfit clearly
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-indigo-500 mr-3"></div>
              Avoid heavy filters or editing
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
