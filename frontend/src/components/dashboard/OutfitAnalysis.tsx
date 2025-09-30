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
  TrendingUp,
  Scissors,
  Layers,
  Lightbulb,
  AlertTriangle,
  Eye
} from 'lucide-react'
import { reviewsApi } from '@/lib/api'
import toast from 'react-hot-toast'

interface OutfitAnalysisProps {
  result: {
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

  // Convert 100-point scale to 10-point scale
  const convertScore = (score: number): number => {
    return Math.round(score / 10)
  }

  const getScoreColor = (score: number) => {
    const convertedScore = convertScore(score)
    if (convertedScore >= 8) return 'text-green-600 bg-green-50 border-green-200'
    if (convertedScore >= 6) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (convertedScore >= 4) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getScoreLabel = (value: string) => {
    const positive = ['excellent', 'perfect', 'exceptional', 'museum-quality']
    const negative = ['poor', 'bad', 'clashing', 'amateur', 'major overhaul']
    
    if (positive.some(word => value.toLowerCase().includes(word))) {
      return 'text-green-600 bg-green-50'
    }
    if (negative.some(word => value.toLowerCase().includes(word))) {
      return 'text-red-600 bg-red-50'
    }
    return 'text-blue-600 bg-blue-50'
  }

  // Check for "no outfit" case
  if (outfitAnalysis.styleCategory === 'no outfit' || outfitAnalysis.overallScore === 0) {
    return (
      <div className="space-y-6 animate-slide-up">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Outfit Detected</h2>
          <p className="text-gray-600">We couldn't find substantial clothing to analyze in this image</p>
        </div>

        {/* Image Preview */}
        {imageUrl && (
          <div className="rounded-xl overflow-hidden bg-gray-100 shadow-lg">
            <img 
              src={imageUrl} 
              alt="Uploaded image" 
              className="w-full h-56 object-cover"
            />
          </div>
        )}

        {/* No Outfit Message */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-600 mr-3" />
            <h3 className="font-semibold text-orange-800">Fashion Analysis Not Possible</h3>
          </div>
          <div className="space-y-4">
            <p className="text-orange-700">
              Our AI fashion expert needs to see actual clothing to provide analysis. This image appears to show:
            </p>
            <ul className="text-orange-700 space-y-2">
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></div>
                No substantial clothing or garments visible
              </li>
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></div>
                Insufficient outfit elements for fashion evaluation
              </li>
            </ul>
          </div>
        </div>

        {/* Suggestions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Lightbulb className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="font-semibold text-blue-800">For Best Results</h3>
          </div>
          <ul className="text-blue-700 space-y-2">
            <li className="flex items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0"></div>
              Upload a photo showing a complete outfit with clothing
            </li>
            <li className="flex items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0"></div>
              Include tops, bottoms, and accessories when possible
            </li>
            <li className="flex items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0"></div>
              Make sure the full outfit is clearly visible
            </li>
            <li className="flex items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0"></div>
              Use good lighting and a clear background
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onStartOver}
            className="w-full btn-primary flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Upload New Outfit Photo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-luxury-fade">
      {/* Premium Header */}
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl gradient-gold-luxury flex items-center justify-center shadow-glow-gold">
              <Sparkles className="w-10 h-10 text-white animate-pulse-slow" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center animate-bounce-subtle">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          </div>
        </div>
        <h2 className="text-4xl font-bold text-gradient-luxury mb-4">Analysis Complete!</h2>
        <p className="text-xl text-luxury-600 font-medium">Premium fashion insights with expert-level precision</p>
      </div>

      {/* Premium Overall Score */}
      <div className="card-luxury text-center relative overflow-hidden">
        <div className="absolute inset-0 gradient-gold-luxury opacity-10"></div>
        <div className="relative z-10">
          <div className="text-6xl font-bold text-gradient-gold mb-3">
            {convertScore(outfitAnalysis.overallScore)}/10
          </div>
          <div className="text-luxury-600 text-lg font-semibold">Overall Fashion Score</div>
          <div className="mt-4 flex justify-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-6 h-6 mx-1 ${
                  i < Math.floor(convertScore(outfitAnalysis.overallScore) / 2)
                    ? 'text-gold-500 fill-current'
                    : 'text-luxury-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Premium Image Preview */}
      {imageUrl && (
        <div className="card-luxury overflow-hidden">
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src={imageUrl}
              alt="Analyzed outfit"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            <div className="absolute bottom-4 left-4 bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-xl">
              <span className="text-sm font-medium">Analyzed Outfit</span>
            </div>
          </div>
        </div>
      )}

      {/* Premium Core Assessments */}
      <div className="animate-luxury-slide">
        <h3 className="text-2xl font-bold text-gradient-luxury mb-6">Core Assessments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-glass relative overflow-hidden group hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 gradient-rose-luxury opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>
            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center">
                    <Shirt className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-luxury-900">Style Category</span>
                </div>
                <div className="text-3xl font-bold text-gradient-rose">
                  {convertScore(outfitAnalysis.styleCategoryScore)}/10
                </div>
              </div>
              <div className="bg-white/30 backdrop-blur-sm px-4 py-2 rounded-xl">
                <span className="text-luxury-900 font-semibold capitalize">
                  {outfitAnalysis.styleCategory}
                </span>
              </div>
            </div>
          </div>

          <div className="card-glass relative overflow-hidden group hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 gradient-luxury-dark opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>
            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-luxury-900">Technical Fit</span>
                </div>
                <div className="text-3xl font-bold text-gradient-luxury">
                  {convertScore(outfitAnalysis.fitScore)}/10
                </div>
              </div>
              <div className="bg-white/30 backdrop-blur-sm px-4 py-2 rounded-xl">
                <span className="text-luxury-900 font-semibold capitalize">
                  {outfitAnalysis.fit}
                </span>
              </div>
            </div>
          </div>

          <div className="card-glass relative overflow-hidden group hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 gradient-gold-luxury opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>
            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                    <Palette className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-luxury-900">Color Theory</span>
                </div>
                <div className="text-3xl font-bold text-gradient-gold">
                  {convertScore(outfitAnalysis.colorHarmonyScore)}/10
                </div>
              </div>
              <div className="bg-white/30 backdrop-blur-sm px-4 py-2 rounded-xl">
                <span className="text-luxury-900 font-semibold capitalize">
                  {outfitAnalysis.colorHarmony}
                </span>
              </div>
            </div>
          </div>

          <div className="card-glass relative overflow-hidden group hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 gradient-rose-luxury opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>
            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-luxury-900">Occasion</span>
                </div>
                <div className="text-3xl font-bold text-gradient-rose">
                  {convertScore(outfitAnalysis.occasionScore)}/10
                </div>
              </div>
              <div className="bg-white/30 backdrop-blur-sm px-4 py-2 rounded-xl">
                <span className="text-luxury-900 font-semibold capitalize">
                  {outfitAnalysis.occasionSuitability}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expert-Level Parameters */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Expert Analysis</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className={`bg-white border-2 rounded-lg p-4 ${getScoreColor(outfitAnalysis.proportionScore)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Scissors className="w-5 h-5 text-gray-600 mr-2" />
                <span className="text-sm font-medium text-gray-600">Proportion & Visual Weight</span>
              </div>
              <div className="text-xl font-bold">{convertScore(outfitAnalysis.proportionScore)}/10</div>
            </div>
            <div className={`px-2 py-1 rounded text-sm font-medium capitalize ${getScoreLabel(outfitAnalysis.proportionBalance)}`}>
              {outfitAnalysis.proportionBalance}
            </div>
          </div>

          <div className={`bg-white border-2 rounded-lg p-4 ${getScoreColor(outfitAnalysis.fabricScore)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Layers className="w-5 h-5 text-gray-600 mr-2" />
                <span className="text-sm font-medium text-gray-600">Fabric Synergy & Merit</span>
              </div>
              <div className="text-xl font-bold">{convertScore(outfitAnalysis.fabricScore)}/10</div>
            </div>
            <div className={`px-2 py-1 rounded text-sm font-medium capitalize ${getScoreLabel(outfitAnalysis.fabricSynergy)}`}>
              {outfitAnalysis.fabricSynergy}
            </div>
          </div>

          <div className={`bg-white border-2 rounded-lg p-4 ${getScoreColor(outfitAnalysis.sophisticationScore)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Eye className="w-5 h-5 text-gray-600 mr-2" />
                <span className="text-sm font-medium text-gray-600">Styling Sophistication</span>
              </div>
              <div className="text-xl font-bold">{convertScore(outfitAnalysis.sophisticationScore)}/10</div>
            </div>
            <div className={`px-2 py-1 rounded text-sm font-medium capitalize ${getScoreLabel(outfitAnalysis.stylingSophistication)}`}>
              {outfitAnalysis.stylingSophistication}
            </div>
          </div>
        </div>
      </div>

      {/* Highlights */}
      {outfitAnalysis.highlights.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <TrendingUp className="w-5 h-5 text-green-700 mr-2" />
            <h3 className="font-semibold text-green-800">What's Working Well</h3>
          </div>
          <ul className="space-y-2">
            {outfitAnalysis.highlights.map((highlight, index) => (
              <li key={index} className="flex items-start text-sm text-green-700">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 mr-3 flex-shrink-0"></div>
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expert Insights */}
      {outfitAnalysis.expertInsights && outfitAnalysis.expertInsights.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Lightbulb className="w-5 h-5 text-purple-700 mr-2" />
            <h3 className="font-semibold text-purple-800">Expert Insights</h3>
          </div>
          <ul className="space-y-2">
            {outfitAnalysis.expertInsights.map((insight, index) => (
              <li key={index} className="flex items-start text-sm text-purple-700">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 mr-3 flex-shrink-0"></div>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Technical Flaws */}
      {outfitAnalysis.technicalFlaws && outfitAnalysis.technicalFlaws.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-700 mr-2" />
            <h3 className="font-semibold text-orange-800">Technical Analysis & Areas for Improvement</h3>
          </div>
          <ul className="space-y-2">
            {outfitAnalysis.technicalFlaws.map((flaw, index) => (
              <li key={index} className="flex items-start text-sm text-orange-700">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></div>
                {flaw}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {outfitAnalysis.improvementSuggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Sparkles className="w-5 h-5 text-blue-700 mr-2" />
            <h3 className="font-semibold text-blue-800">Professional Recommendations</h3>
          </div>
          <ul className="space-y-2">
            {outfitAnalysis.improvementSuggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start text-sm text-blue-700">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0"></div>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback Section */}
      {!feedbackGiven && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-3 text-center">How was this expert analysis?</h3>
          <div className="flex space-x-3">
            <button
              onClick={() => handleFeedback(true)}
              disabled={loading}
              className="flex-1 btn-outline border-gray-400 text-gray-700 hover:bg-gray-100 flex items-center justify-center"
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Very insightful!
            </button>
            <button
              onClick={() => handleFeedback(false)}
              disabled={loading}
              className="flex-1 btn-outline border-gray-400 text-gray-700 hover:bg-gray-100 flex items-center justify-center"
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              Could be better
            </button>
          </div>
        </div>
      )}

      {feedbackGiven && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-800 font-medium">Thanks for your feedback!</p>
          <p className="text-gray-600 text-sm mt-1">This helps us refine our expert fashion AI</p>
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
