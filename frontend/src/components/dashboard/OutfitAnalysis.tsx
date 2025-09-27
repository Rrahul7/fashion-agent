'use client'

import { useState } from 'react'
import { 
  Sparkles, 
  ThumbsUp, 
  ThumbsDown, 
  RefreshCw, 
  Star,
  Target,
  Palette,
  Shirt,
  TrendingUp
} from 'lucide-react'
import { reviewsApi } from '@/lib/api'
import toast from 'react-hot-toast'

interface OutfitAnalysisProps {
  result: {
    reviewId: string
    outfitAnalysis: {
      styleCategory: string
      fit: string
      colorHarmony: string
      occasionSuitability: string
      highlights: string[]
      improvementSuggestions: string[]
    }
  }
  imageUrl?: string | null
  onStartOver: () => void
}

export function OutfitAnalysis({ result, imageUrl, onStartOver }: OutfitAnalysisProps) {
  const [feedbackGiven, setFeedbackGiven] = useState(false)
  const [loading, setLoading] = useState(false)

  const { outfitAnalysis } = result

  const handleFeedback = async (accepted: boolean) => {
    try {
      setLoading(true)
      await reviewsApi.accept(result.reviewId, accepted)
      setFeedbackGiven(true)
      toast.success(accepted ? 'Thanks for the positive feedback!' : 'Thanks for your feedback!')
    } catch (error) {
      console.error('Feedback error:', error)
      toast.error('Failed to submit feedback')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (value: string) => {
    const positive = ['excellent', 'perfect', 'good', 'great']
    const negative = ['poor', 'bad', 'clashing', 'tight', 'loose']
    
    if (positive.some(word => value.toLowerCase().includes(word))) {
      return 'text-green-600 bg-green-50'
    }
    if (negative.some(word => value.toLowerCase().includes(word))) {
      return 'text-red-600 bg-red-50'
    }
    return 'text-blue-600 bg-blue-50'
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-gray-100 p-3 rounded-full">
            <Sparkles className="w-8 h-8 text-gray-700" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis Complete!</h2>
        <p className="text-gray-600">Here's what our AI fashion expert thinks</p>
      </div>

      {/* Image Preview */}
      {imageUrl && (
        <div className="rounded-xl overflow-hidden bg-gray-100">
          <img 
            src={imageUrl} 
            alt="Analyzed outfit" 
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      {/* Analysis Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Shirt className="w-5 h-5 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-600">Style</span>
          </div>
          <div className={`px-2 py-1 rounded text-sm font-medium capitalize ${getScoreColor(outfitAnalysis.styleCategory)}`}>
            {outfitAnalysis.styleCategory}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Target className="w-5 h-5 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-600">Fit</span>
          </div>
          <div className={`px-2 py-1 rounded text-sm font-medium capitalize ${getScoreColor(outfitAnalysis.fit)}`}>
            {outfitAnalysis.fit}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Palette className="w-5 h-5 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-600">Colors</span>
          </div>
          <div className={`px-2 py-1 rounded text-sm font-medium capitalize ${getScoreColor(outfitAnalysis.colorHarmony)}`}>
            {outfitAnalysis.colorHarmony}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Star className="w-5 h-5 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-600">Occasion</span>
          </div>
          <div className={`px-2 py-1 rounded text-sm font-medium capitalize ${getScoreColor(outfitAnalysis.occasionSuitability)}`}>
            {outfitAnalysis.occasionSuitability}
          </div>
        </div>
      </div>

      {/* Highlights */}
      {outfitAnalysis.highlights.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <TrendingUp className="w-5 h-5 text-gray-700 mr-2" />
            <h3 className="font-medium text-gray-800">What's Working Well</h3>
          </div>
          <ul className="space-y-2">
            {outfitAnalysis.highlights.map((highlight, index) => (
              <li key={index} className="flex items-start text-sm text-gray-700">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-2 mr-3 flex-shrink-0"></div>
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {outfitAnalysis.improvementSuggestions.length > 0 && (
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Sparkles className="w-5 h-5 text-gray-700 mr-2" />
            <h3 className="font-medium text-gray-800">Suggestions to Elevate</h3>
          </div>
          <ul className="space-y-2">
            {outfitAnalysis.improvementSuggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start text-sm text-gray-700">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-2 mr-3 flex-shrink-0"></div>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback Section */}
      {!feedbackGiven && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-3 text-center">Was this analysis helpful?</h3>
          <div className="flex space-x-3">
            <button
              onClick={() => handleFeedback(true)}
              disabled={loading}
              className="flex-1 btn-outline border-gray-400 text-gray-700 hover:bg-gray-100 flex items-center justify-center"
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Yes, helpful!
            </button>
            <button
              onClick={() => handleFeedback(false)}
              disabled={loading}
              className="flex-1 btn-outline border-gray-400 text-gray-700 hover:bg-gray-100 flex items-center justify-center"
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              Needs work
            </button>
          </div>
        </div>
      )}

      {feedbackGiven && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-800 font-medium">Thanks for your feedback!</p>
          <p className="text-gray-600 text-sm mt-1">This helps us improve our AI fashion expert</p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={onStartOver}
          className="w-full btn-primary flex items-center justify-center"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Analyze Another Outfit
        </button>
      </div>
    </div>
  )
}
