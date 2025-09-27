'use client'

import { useState, useEffect } from 'react'
import { Calendar, Star, Sparkles, Eye, Clock, ChevronRight } from 'lucide-react'
import { reviewsApi } from '@/lib/api'
import { Loading } from '@/components/ui/Loading'

interface Review {
  id: string
  imageUrl: string
  description?: string
  styleCategory: string
  fit: string
  colorHarmony: string
  occasionSuitability: string
  highlights: string[]
  improvementSuggestions: string[]
  comparisonInsight?: string
  accepted?: boolean
  createdAt: string
}

export function ReviewHistory() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    try {
      setLoading(true)
      const data = await reviewsApi.getAll()
      setReviews(data)
    } catch (error) {
      console.error('Failed to load reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getScoreColor = (value: string) => {
    const positive = ['excellent', 'perfect', 'good', 'great']
    const negative = ['poor', 'bad', 'clashing', 'tight', 'loose']
    
    if (positive.some(word => value.toLowerCase().includes(word))) {
      return 'text-green-600'
    }
    if (negative.some(word => value.toLowerCase().includes(word))) {
      return 'text-red-600'
    }
    return 'text-blue-600'
  }

  if (loading) {
    return <Loading />
  }

  if (selectedReview) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setSelectedReview(null)}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Review Details</h2>
            <p className="text-gray-600 text-sm">{formatDate(selectedReview.createdAt)}</p>
          </div>
        </div>

        {/* Image */}
        <div className="rounded-xl overflow-hidden bg-gray-100">
          <img 
            src={selectedReview.imageUrl} 
            alt="Outfit" 
            className="w-full h-64 object-cover"
          />
        </div>

        {/* Analysis */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <span className="text-sm font-medium text-gray-600">Style</span>
            <div className={`font-medium capitalize ${getScoreColor(selectedReview.styleCategory)}`}>
              {selectedReview.styleCategory}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <span className="text-sm font-medium text-gray-600">Fit</span>
            <div className={`font-medium capitalize ${getScoreColor(selectedReview.fit)}`}>
              {selectedReview.fit}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <span className="text-sm font-medium text-gray-600">Colors</span>
            <div className={`font-medium capitalize ${getScoreColor(selectedReview.colorHarmony)}`}>
              {selectedReview.colorHarmony}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <span className="text-sm font-medium text-gray-600">Occasion</span>
            <div className={`font-medium capitalize ${getScoreColor(selectedReview.occasionSuitability)}`}>
              {selectedReview.occasionSuitability}
            </div>
          </div>
        </div>

        {/* Highlights */}
        {selectedReview.highlights.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-3">Highlights</h3>
            <ul className="space-y-2">
              {selectedReview.highlights.map((highlight, index) => (
                <li key={index} className="flex items-start text-sm text-green-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 mr-3 flex-shrink-0"></div>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggestions */}
        {selectedReview.improvementSuggestions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-3">Suggestions</h3>
            <ul className="space-y-2">
              {selectedReview.improvementSuggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start text-sm text-blue-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0"></div>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Comparison Insight */}
        {selectedReview.comparisonInsight && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-medium text-purple-800 mb-3">Comparison Insight</h3>
            <p className="text-sm text-purple-700">{selectedReview.comparisonInsight}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-gray-800 p-4 rounded-full">
            <Clock className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Style Journey</h2>
        <p className="text-gray-600">Review your past outfit analyses and track your style evolution</p>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-600 mb-6">Start by uploading your first outfit photo</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div 
              key={review.id} 
              className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedReview(review)}
            >
              <div className="flex space-x-4">
                {/* Image Thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <img 
                    src={review.imageUrl} 
                    alt="Outfit" 
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium capitalize ${getScoreColor(review.styleCategory)}`}>
                        {review.styleCategory}
                      </span>
                      {review.accepted === true && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(review.createdAt)}</span>
                    </div>
                    <span>•</span>
                    <span>{review.highlights.length} highlights</span>
                    <span>•</span>
                    <span>{review.improvementSuggestions.length} suggestions</span>
                  </div>

                  {review.description && (
                    <p className="text-sm text-gray-600 mt-2 truncate">{review.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
