import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Star, Target, Palette, Shirt, TrendingUp, RefreshCw, MessageCircle, AlertTriangle, Lightbulb, Layers, Scissors, Eye } from 'lucide-react-native';
import { DripLogo } from '../ui/DripLogo';
import Toast from 'react-native-toast-message';
import { SecureImageUpload } from '../upload/SecureImageUpload';
import { FeedbackModal } from './FeedbackModal';
import { guestAPI } from '../../services/api';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

interface GuestUsage {
  used: number;
  limit: number;
  remaining: number;
}

interface OutfitAnalysis {
  styleCategory: string;
  styleCategoryScore: number;
  fit: string;
  fitScore: number;
  colorHarmony: string;
  colorHarmonyScore: number;
  occasionSuitability: string;
  occasionScore: number;
  proportionBalance: string;
  proportionScore: number;
  fabricSynergy: string;
  fabricScore: number;
  stylingSophistication: string;
  sophisticationScore: number;
  overallScore: number;
  highlights: string[];
  improvementSuggestions: string[];
  expertInsights?: string[];
  technicalFlaws?: string[];
}

interface ReviewResult {
  reviewId: string;
  outfitAnalysis: OutfitAnalysis;
  guestUsage?: GuestUsage;
}

export function GuestOutfitReview() {
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [guestUsage, setGuestUsage] = useState<GuestUsage>({ used: 0, limit: 3, remaining: 3 });
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [loading, setLoading] = useState(false);

  // Clear any stored auth and load guest usage on mount
  useEffect(() => {
    const initializeGuestMode = async () => {
      await clearStoredAuth();
      // Small delay to ensure auth is cleared before API calls
      setTimeout(() => {
        loadGuestUsage();
        testGuestSession();
      }, 100);
    };
    
    initializeGuestMode();
  }, []);

  const clearStoredAuth = async () => {
    try {
      // Clear all stored authentication data to ensure guest mode
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('token_expiry');
      await SecureStore.deleteItemAsync('user_data');
      // Also clear any existing guest session for fresh start
      await SecureStore.deleteItemAsync('guest_session_id');
      console.log('🧹 Cleared stored authentication and guest session for fresh guest mode');
    } catch (error) {
      console.log('⚠️ No stored auth to clear or error clearing:', error);
    }
  };

  const loadGuestUsage = async () => {
    try {
      const response = await guestAPI.getUsage();
      setGuestUsage(response.data);
    } catch (error) {
      console.log('Guest usage load failed, using defaults');
    }
  };

  const testGuestSession = async () => {
    try {
      const response = await guestAPI.testSession();
      console.log('🧪 Guest session test result:', response.data);
    } catch (error) {
      console.error('🧪 Guest session test failed:', error);
    }
  };

  const handleAnalysisComplete = (analysisResult: ReviewResult) => {
    setResult(analysisResult);
    if (analysisResult.guestUsage) {
      setGuestUsage(analysisResult.guestUsage);
    }
    setFeedbackGiven(false);
    setShowFeedbackModal(false);
  };

  const startOver = () => {
    setResult(null);
    setFeedbackGiven(false);
    setShowFeedbackModal(false);
  };

  // Convert 100-point scale to 10-point scale
  const convertScore = (score: number): number => {
    return Math.round(score / 10);
  };

  const getScoreColor = (score: number) => {
    const convertedScore = convertScore(score);
    if (convertedScore >= 8) return ['#10B981', '#047857']; // Green gradient
    if (convertedScore >= 7) return ['#3B82F6', '#1D4ED8']; // Blue gradient
    if (convertedScore >= 6) return ['#F59E0B', '#D97706']; // Yellow gradient
    return ['#EF4444', '#DC2626']; // Red gradient
  };

  const getScoreGrade = (score: number) => {
    const convertedScore = convertScore(score);
    if (convertedScore >= 9) return 'A+';
    if (convertedScore >= 8) return 'A';
    if (convertedScore >= 7) return 'B';
    if (convertedScore >= 6) return 'C';
    return 'D';
  };

  if (result) {
    const { outfitAnalysis } = result;

    // Check for "no outfit" case
    if (outfitAnalysis.styleCategory === 'no outfit' || outfitAnalysis.overallScore === 0) {
      return (
        <SafeAreaView style={styles.container}>
          <LinearGradient
            colors={['#F5F1E8', '#EDE7DC']}
            style={styles.gradientBackground}
          >
            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* No Outfit Header */}
              <View style={styles.header}>
                <View style={[styles.sparkleContainer, { backgroundColor: '#DC2626' }]}>
                  <AlertTriangle size={32} color="white" />
                </View>
                <Text style={styles.headerTitle}>No Outfit Detected</Text>
                <Text style={styles.headerSubtitle}>We couldn't find substantial clothing to analyze in this image</Text>
                
                {guestUsage && (
                  <View style={styles.usageIndicator}>
                    <Text style={styles.usageText}>Guest Reviews: </Text>
                    <Text style={styles.usageCount}>{guestUsage.used}/{guestUsage.limit}</Text>
                    {guestUsage.remaining <= 1 && (
                      <Text style={styles.usageRemaining}>({guestUsage.remaining} remaining)</Text>
                    )}
                  </View>
                )}
              </View>

              {/* No Outfit Message */}
              <View style={[styles.card, { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FDBA74' }]}>
                <View style={styles.cardHeader}>
                  <AlertTriangle size={24} color="#F59E0B" />
                  <Text style={[styles.cardTitle, { color: '#92400E' }]}>Fashion Analysis Not Possible</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.listText, { color: '#B45309' }]}>
                    Our AI fashion expert needs to see actual clothing to provide analysis. This image appears to show:
                  </Text>
                  <View style={styles.listItem}>
                    <View style={[styles.bullet, { backgroundColor: '#F59E0B' }]} />
                    <Text style={[styles.listText, { color: '#B45309' }]}>No substantial clothing or garments visible</Text>
                  </View>
                  <View style={styles.listItem}>
                    <View style={[styles.bullet, { backgroundColor: '#F59E0B' }]} />
                    <Text style={[styles.listText, { color: '#B45309' }]}>Insufficient outfit elements for fashion evaluation</Text>
                  </View>
                </View>
              </View>

              {/* Suggestions */}
              <View style={[styles.card, { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE' }]}>
                <View style={styles.cardHeader}>
                  <Lightbulb size={24} color="#2563EB" />
                  <Text style={[styles.cardTitle, { color: '#1E40AF' }]}>For Best Results</Text>
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.listItem}>
                    <View style={[styles.bullet, { backgroundColor: '#2563EB' }]} />
                    <Text style={[styles.listText, { color: '#1E40AF' }]}>Upload a photo showing a complete outfit with clothing</Text>
                  </View>
                  <View style={styles.listItem}>
                    <View style={[styles.bullet, { backgroundColor: '#2563EB' }]} />
                    <Text style={[styles.listText, { color: '#1E40AF' }]}>Include tops, bottoms, and accessories when possible</Text>
                  </View>
                  <View style={styles.listItem}>
                    <View style={[styles.bullet, { backgroundColor: '#2563EB' }]} />
                    <Text style={[styles.listText, { color: '#1E40AF' }]}>Make sure the full outfit is clearly visible</Text>
                  </View>
                  <View style={styles.listItem}>
                    <View style={[styles.bullet, { backgroundColor: '#2563EB' }]} />
                    <Text style={[styles.listText, { color: '#1E40AF' }]}>Use good lighting and a clear background</Text>
                  </View>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.primaryButton} onPress={startOver}>
                  <RefreshCw size={20} color="white" />
                  <Text style={styles.primaryButtonText}>Upload New Outfit Photo</Text>
                </TouchableOpacity>

                {guestUsage.remaining <= 1 && (
                  <View style={styles.upgradeCard}>
                    <Text style={styles.upgradeTitle}>
                      {guestUsage.remaining === 0 ? 'All Reviews Used!' : 'Last Free Review!'}
                    </Text>
                    <Text style={styles.upgradeText}>
                      {guestUsage.remaining === 0 
                        ? 'Sign up for unlimited outfit reviews and advanced features!'
                        : 'You have 1 review left. Sign up for unlimited access!'
                      }
                    </Text>
                    <TouchableOpacity style={styles.upgradeButton}>
                      <Text style={styles.upgradeButtonText}>Create Free Account</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          </LinearGradient>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#F5F1E8', '#EDE7DC']}
          style={styles.gradientBackground}
        >
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.sparkleContainer}>
                <Sparkles size={32} color="#4F46E5" />
              </View>
              <Text style={styles.headerTitle}>Analysis Complete!</Text>
              <Text style={styles.headerSubtitle}>Here's your fashion breakdown</Text>
              
              {guestUsage && (
                <View style={styles.usageIndicator}>
                  <Text style={styles.usageText}>Guest Reviews: </Text>
                  <Text style={styles.usageCount}>{guestUsage.used}/{guestUsage.limit}</Text>
                  {guestUsage.remaining <= 1 && (
                    <Text style={styles.usageRemaining}>({guestUsage.remaining} remaining)</Text>
                  )}
                </View>
              )}
            </View>

            {/* Overall Score */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreGrade}>{getScoreGrade(outfitAnalysis.overallScore)}</Text>
              </View>
              <Text style={styles.overallScoreTitle}>Overall Score</Text>
              <Text style={styles.overallScoreValue}>{convertScore(outfitAnalysis.overallScore)}/10</Text>
              <Text style={styles.overallScoreSubtext}>Your outfit analysis breakdown</Text>
            </View>

            {/* Core Assessment Tiles */}
            <View style={styles.tilesContainer}>
              <Text style={styles.sectionTitle}>Core Assessments</Text>
              <View style={styles.tilesRow}>
                <View style={styles.tile}>
                  <View style={styles.tileIconContainer}>
                    <Shirt size={24} color="white" />
                  </View>
                  <Text style={styles.tileLabel}>Style Category</Text>
                  <Text style={styles.tileValue}>{outfitAnalysis.styleCategory}</Text>
                  <View style={styles.tileScoreContainer}>
                    <Text style={styles.tileScore}>{convertScore(outfitAnalysis.styleCategoryScore)}/10</Text>
                  </View>
                </View>

                <View style={styles.tile}>
                  <View style={styles.tileIconContainer}>
                    <Target size={24} color="white" />
                  </View>
                  <Text style={styles.tileLabel}>Technical Fit</Text>
                  <Text style={styles.tileValue}>{outfitAnalysis.fit}</Text>
                  <View style={styles.tileScoreContainer}>
                    <Text style={styles.tileScore}>{convertScore(outfitAnalysis.fitScore)}/10</Text>
                  </View>
                </View>
              </View>

              <View style={styles.tilesRow}>
                <View style={styles.tile}>
                  <View style={styles.tileIconContainer}>
                    <Palette size={24} color="white" />
                  </View>
                  <Text style={styles.tileLabel}>Color Theory</Text>
                  <Text style={styles.tileValue}>{outfitAnalysis.colorHarmony}</Text>
                  <View style={styles.tileScoreContainer}>
                    <Text style={styles.tileScore}>{convertScore(outfitAnalysis.colorHarmonyScore)}/10</Text>
                  </View>
                </View>

                <View style={styles.tile}>
                  <View style={styles.tileIconContainer}>
                    <Star size={24} color="white" />
                  </View>
                  <Text style={styles.tileLabel}>Occasion</Text>
                  <Text style={styles.tileValue}>{outfitAnalysis.occasionSuitability}</Text>
                  <View style={styles.tileScoreContainer}>
                    <Text style={styles.tileScore}>{convertScore(outfitAnalysis.occasionScore)}/10</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Expert Analysis Tiles */}
            <View style={styles.tilesContainer}>
              <Text style={styles.sectionTitle}>Expert Analysis</Text>
              <View style={styles.expertTile}>
                <View style={styles.tileIconContainer}>
                  <Scissors size={24} color="white" />
                </View>
                <Text style={styles.tileLabel}>Proportion & Visual Weight</Text>
                <Text style={styles.tileValue}>{outfitAnalysis.proportionBalance}</Text>
                <View style={styles.tileScoreContainer}>
                  <Text style={styles.tileScore}>{convertScore(outfitAnalysis.proportionScore)}/10</Text>
                </View>
              </View>

              <View style={styles.expertTile}>
                <View style={styles.tileIconContainer}>
                  <Layers size={24} color="white" />
                </View>
                <Text style={styles.tileLabel}>Fabric Synergy & Merit</Text>
                <Text style={styles.tileValue}>{outfitAnalysis.fabricSynergy}</Text>
                <View style={styles.tileScoreContainer}>
                  <Text style={styles.tileScore}>{convertScore(outfitAnalysis.fabricScore)}/10</Text>
                </View>
              </View>

              <View style={styles.expertTile}>
                <View style={styles.tileIconContainer}>
                  <Eye size={24} color="white" />
                </View>
                <Text style={styles.tileLabel}>Styling Sophistication</Text>
                <Text style={styles.tileValue}>{outfitAnalysis.stylingSophistication}</Text>
                <View style={styles.tileScoreContainer}>
                  <Text style={styles.tileScore}>{convertScore(outfitAnalysis.sophisticationScore)}/10</Text>
                </View>
              </View>
            </View>

            {/* Highlights */}
            {outfitAnalysis.highlights.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <TrendingUp size={24} color="#10B981" />
                  <Text style={styles.cardTitle}>What's Working</Text>
                </View>
                <View style={styles.cardContent}>
                  {outfitAnalysis.highlights.map((highlight, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={[styles.bullet, { backgroundColor: '#10B981' }]} />
                      <Text style={styles.listText}>{highlight}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Expert Insights */}
            {outfitAnalysis.expertInsights && outfitAnalysis.expertInsights.length > 0 && (
              <View style={[styles.card, { backgroundColor: '#F3E8FF', borderWidth: 1, borderColor: '#D8B4FE' }]}>
                <View style={styles.cardHeader}>
                  <Lightbulb size={24} color="#7C3AED" />
                  <Text style={[styles.cardTitle, { color: '#5B21B6' }]}>Expert Insights</Text>
                </View>
                <View style={styles.cardContent}>
                  {outfitAnalysis.expertInsights.map((insight, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={[styles.bullet, { backgroundColor: '#7C3AED' }]} />
                      <Text style={[styles.listText, { color: '#5B21B6' }]}>{insight}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Technical Flaws */}
            {outfitAnalysis.technicalFlaws && outfitAnalysis.technicalFlaws.length > 0 && (
              <View style={[styles.card, { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FDBA74' }]}>
                <View style={styles.cardHeader}>
                  <AlertTriangle size={24} color="#F59E0B" />
                  <Text style={[styles.cardTitle, { color: '#92400E' }]}>Technical Analysis & Areas for Improvement</Text>
                </View>
                <View style={styles.cardContent}>
                  {outfitAnalysis.technicalFlaws.map((flaw, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={[styles.bullet, { backgroundColor: '#F59E0B' }]} />
                      <Text style={[styles.listText, { color: '#B45309' }]}>{flaw}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Professional Recommendations */}
            {outfitAnalysis.improvementSuggestions.length > 0 && (
              <View style={[styles.card, { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE' }]}>
                <View style={styles.cardHeader}>
                  <Sparkles size={24} color="#2563EB" />
                  <Text style={[styles.cardTitle, { color: '#1E40AF' }]}>Professional Recommendations</Text>
                </View>
                <View style={styles.cardContent}>
                  {outfitAnalysis.improvementSuggestions.map((suggestion, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={[styles.bullet, { backgroundColor: '#2563EB' }]} />
                      <Text style={[styles.listText, { color: '#1E40AF' }]}>{suggestion}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Feedback Section */}
            {!feedbackGiven && (
              <View style={styles.card}>
                <View style={styles.feedbackContent}>
                  <MessageCircle size={32} color="#4F46E5" />
                  <Text style={styles.feedbackTitle}>How was your experience?</Text>
                  <Text style={styles.feedbackSubtext}>
                    Your feedback helps us improve our AI fashion expert
                  </Text>
                  <TouchableOpacity
                    style={styles.feedbackButton}
                    onPress={() => setShowFeedbackModal(true)}
                  >
                    <Text style={styles.feedbackButtonText}>Give Feedback</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {feedbackGiven && (
              <View style={styles.thankYouCard}>
                <View style={styles.thankYouIcon}>
                  <Star size={24} color="#10B981" />
                </View>
                <Text style={styles.thankYouTitle}>Thank you!</Text>
                <Text style={styles.thankYouText}>
                  Your feedback helps us improve our fashion analysis
                </Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.primaryButton} onPress={startOver}>
                <RefreshCw size={20} color="white" />
                <Text style={styles.primaryButtonText}>Analyze Another Outfit</Text>
              </TouchableOpacity>

              {guestUsage.remaining <= 1 && (
                <View style={styles.upgradeCard}>
                  <Text style={styles.upgradeTitle}>
                    {guestUsage.remaining === 0 ? 'All Reviews Used!' : 'Last Free Review!'}
                  </Text>
                  <Text style={styles.upgradeText}>
                    {guestUsage.remaining === 0 
                      ? 'Sign up for unlimited outfit reviews and advanced features!'
                      : 'You have 1 review left. Sign up for unlimited access!'
                    }
                  </Text>
                  <TouchableOpacity style={styles.upgradeButton}>
                    <Text style={styles.upgradeButtonText}>Create Free Account</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Feedback Modal */}
          <FeedbackModal
            reviewId={result.reviewId}
            isVisible={showFeedbackModal}
            onClose={() => setShowFeedbackModal(false)}
            onSuccess={() => setFeedbackGiven(true)}
          />
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#F5F1E8', '#EDE7DC']}
        style={styles.gradientBackground}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.sparkleContainer}>
              <DripLogo 
                size={40} 
                backgroundColor="transparent"
                primaryColor="#1F2937"
                secondaryColor="#F5D03A"
                accentColor="#E6B800"
              />
            </View>
            <Text style={styles.headerMainTitle}>Drip AI Expert</Text>
            <Text style={styles.headerMainSubtitle}>Get instant outfit analysis from your AI stylist</Text>
            
            {/* Guest Usage Indicator */}
            <View style={styles.usageIndicatorMain}>
              <Text style={styles.usageMainLabel}>Free Reviews:</Text>
              <View style={styles.usageDots}>
                {[...Array(3)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.usageDot,
                      { backgroundColor: i < guestUsage.used ? '#F5D03A' : '#D1D5DB' }
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.usageMainCount}>{guestUsage.remaining} left</Text>
            </View>
          </View>

          {/* Upload Section */}
          <View style={styles.uploadCard}>
            <SecureImageUpload onAnalysisComplete={handleAnalysisComplete} />
          </View>

          {/* Tips Section */}
          <View style={styles.card}>
            <Text style={styles.tipsTitle}>📸 Tips for Best Results</Text>
            <View style={styles.tipsGrid}>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>Full-body photo in good lighting</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>Plain background works best</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>Show your complete outfit clearly</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>Avoid heavy filters or editing</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sparkleContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  headerMainTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  headerMainSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  usageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  usageText: {
    color: '#6B7280',
    fontSize: 14,
  },
  usageCount: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
  },
  usageRemaining: {
    color: '#F59E0B',
    fontSize: 12,
    marginLeft: 4,
  },
  usageIndicatorMain: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  usageMainLabel: {
    color: '#6B7280',
    fontSize: 16,
  },
  usageDots: {
    flexDirection: 'row',
    marginHorizontal: 16,
  },
  usageDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  usageMainCount: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
  },
  scoreCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  scoreGrade: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  overallScoreTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  overallScoreValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  overallScoreSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  tilesContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  tile: {
    flex: 1,
    backgroundColor: '#2D2D2D',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 6,
    minHeight: 140,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#404040',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tileLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  tileValue: {
    fontSize: 12,
    fontWeight: '400',
    color: '#B0B0B0',
    textTransform: 'capitalize',
    marginBottom: 8,
    lineHeight: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  tileScoreContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#404040',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tileScore: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  cardContent: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  listText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  feedbackContent: {
    alignItems: 'center',
    gap: 12,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  feedbackSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  feedbackButton: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  thankYouCard: {
    backgroundColor: '#F0FDF4',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  thankYouIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  thankYouTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 4,
  },
  thankYouText: {
    fontSize: 14,
    color: '#047857',
    textAlign: 'center',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#1F2937',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  upgradeCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9A3412',
    marginBottom: 8,
  },
  upgradeText: {
    fontSize: 14,
    color: '#C2410C',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  upgradeButton: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  tipsGrid: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1F2937',
  },
  tipText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  expertTile: {
    backgroundColor: '#2D2D2D',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
});
