import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import SecureImageUpload from '../../components/upload/SecureImageUpload';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

interface AnalysisResult {
  reviewId: string;
  outfitAnalysis: {
    styleCategory: string;
    fit: number;
    colorHarmony: number;
    occasionSuitability: number;
    highlights: string[];
    improvementSuggestions: string[];
  };
}

export default function UploadScreen() {
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const router = useRouter();

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setCurrentAnalysis(result);
    
    // Calculate average score
    const avgScore = Math.round((result.outfitAnalysis.fit + result.outfitAnalysis.colorHarmony + result.outfitAnalysis.occasionSuitability) / 3);
    
    // Show success feedback
    Toast.show({
      type: 'success',
      text1: 'Analysis Complete! 🎉',
      text2: `Your outfit scored ${avgScore}/10`,
      visibilityTime: 3000,
    });

    // Optional: Navigate to history or show result
    console.log('✅ Analysis completed:', result);
  };

  const handleUploadProgress = (progress: number) => {
    setUploadProgress(progress);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#10B981'; // Green
    if (score >= 6) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 9) return '🔥';
    if (score >= 8) return '✨';
    if (score >= 7) return '👌';
    if (score >= 6) return '👍';
    if (score >= 5) return '🤔';
    return '💡';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Style Analysis</Text>
        <Text style={styles.headerSubtext}>
          Upload a photo of your outfit and get instant AI-powered fashion feedback
        </Text>
      </View>

      {/* Upload Component */}
      <View style={styles.uploadContainer}>
        <SecureImageUpload
          onAnalysisComplete={handleAnalysisComplete}
          onUploadProgress={handleUploadProgress}
        />
      </View>

      {/* Analysis Results */}
      {currentAnalysis && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Analysis Results</Text>
          
          {/* Score Display */}
          <View style={styles.scoreContainer}>
            {(() => {
              const avgScore = Math.round((currentAnalysis.outfitAnalysis.fit + currentAnalysis.outfitAnalysis.colorHarmony + currentAnalysis.outfitAnalysis.occasionSuitability) / 3);
              return (
                <>
                  <View style={[styles.scoreCircle, { backgroundColor: getScoreColor(avgScore) }]}>
                    <Text style={styles.scoreText}>{avgScore}</Text>
                    <Text style={styles.scoreOutOf}>/10</Text>
                  </View>
                  
                  <View style={styles.scoreInfo}>
                    <Text style={styles.scoreEmoji}>
                      {getScoreEmoji(avgScore)}
                    </Text>
                    <Text style={styles.scoreLabel}>
                      {avgScore >= 8 ? 'Excellent Style!' :
                       avgScore >= 6 ? 'Good Look!' :
                       avgScore >= 4 ? 'Room for Improvement' :
                       'Let\'s Elevate Your Style'}
                    </Text>
                  </View>
                </>
              );
            })()}
          </View>

          {/* Score Breakdown */}
          <View style={styles.scoreBreakdownContainer}>
            <Text style={styles.scoreBreakdownTitle}>Score Breakdown</Text>
            
            <View style={styles.scoreBreakdownItem}>
              <Text style={styles.scoreBreakdownLabel}>Fit</Text>
              <View style={styles.scoreBreakdownBar}>
                <View style={[styles.scoreBreakdownFill, { width: `${currentAnalysis.outfitAnalysis.fit * 10}%`, backgroundColor: getScoreColor(currentAnalysis.outfitAnalysis.fit) }]} />
              </View>
              <Text style={styles.scoreBreakdownValue}>{currentAnalysis.outfitAnalysis.fit}/10</Text>
            </View>
            
            <View style={styles.scoreBreakdownItem}>
              <Text style={styles.scoreBreakdownLabel}>Color Harmony</Text>
              <View style={styles.scoreBreakdownBar}>
                <View style={[styles.scoreBreakdownFill, { width: `${currentAnalysis.outfitAnalysis.colorHarmony * 10}%`, backgroundColor: getScoreColor(currentAnalysis.outfitAnalysis.colorHarmony) }]} />
              </View>
              <Text style={styles.scoreBreakdownValue}>{currentAnalysis.outfitAnalysis.colorHarmony}/10</Text>
            </View>
            
            <View style={styles.scoreBreakdownItem}>
              <Text style={styles.scoreBreakdownLabel}>Occasion Suitability</Text>
              <View style={styles.scoreBreakdownBar}>
                <View style={[styles.scoreBreakdownFill, { width: `${currentAnalysis.outfitAnalysis.occasionSuitability * 10}%`, backgroundColor: getScoreColor(currentAnalysis.outfitAnalysis.occasionSuitability) }]} />
              </View>
              <Text style={styles.scoreBreakdownValue}>{currentAnalysis.outfitAnalysis.occasionSuitability}/10</Text>
            </View>
          </View>

          {/* Style Category */}
          <View style={styles.categoriesContainer}>
            <Text style={styles.categoriesTitle}>Style Category</Text>
            <View style={styles.categoriesWrapper}>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{currentAnalysis.outfitAnalysis.styleCategory}</Text>
              </View>
            </View>
          </View>

          {/* Highlights */}
          {currentAnalysis.outfitAnalysis.highlights && currentAnalysis.outfitAnalysis.highlights.length > 0 && (
            <View style={styles.highlightsContainer}>
              <Text style={styles.highlightsTitle}>✨ What's Working Well</Text>
              {currentAnalysis.outfitAnalysis.highlights.map((highlight, index) => (
                <View key={index} style={styles.highlightItem}>
                  <Text style={styles.highlightBullet}>✓</Text>
                  <Text style={styles.highlightText}>{highlight}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Suggestions */}
          {currentAnalysis.outfitAnalysis.improvementSuggestions && currentAnalysis.outfitAnalysis.improvementSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>💡 Style Suggestions</Text>
              {currentAnalysis.outfitAnalysis.improvementSuggestions.map((suggestion, index) => (
                <View key={index} style={styles.suggestionItem}>
                  <Text style={styles.suggestionBullet}>•</Text>
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Analysis Date */}
          <View style={styles.timestampContainer}>
            <Text style={styles.timestampText}>
              Analyzed on {new Date().toLocaleString()}
            </Text>
          </View>
        </View>
      )}

      {/* Tips Section */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>📸 Photo Tips for Best Results</Text>
        
        <View style={styles.tipItem}>
          <Text style={styles.tipEmoji}>💡</Text>
          <Text style={styles.tipText}>Take photos in good lighting (natural light works best)</Text>
        </View>
        
        <View style={styles.tipItem}>
          <Text style={styles.tipEmoji}>👤</Text>
          <Text style={styles.tipText}>Show your full outfit from head to toe</Text>
        </View>
        
        <View style={styles.tipItem}>
          <Text style={styles.tipEmoji}>🎯</Text>
          <Text style={styles.tipText}>Stand against a plain background if possible</Text>
        </View>
        
        <View style={styles.tipItem}>
          <Text style={styles.tipEmoji}>📱</Text>
          <Text style={styles.tipText}>Hold your phone steady or use a timer</Text>
        </View>
      </View>

      {/* Privacy Notice */}
      <View style={styles.privacyContainer}>
        <Text style={styles.privacyTitle}>🔒 Privacy & Security</Text>
        <Text style={styles.privacyText}>
          Your photos are analyzed securely and are not stored permanently on our servers. 
          All analysis happens with end-to-end encryption to protect your privacy.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtext: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  uploadContainer: {
    backgroundColor: '#ffffff',
    marginTop: 12,
    paddingTop: 20,
  },
  resultContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  scoreOutOf: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 14,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  feedbackContainer: {
    marginBottom: 24,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  categoriesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionsContainer: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  suggestionBullet: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    marginTop: 2,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  timestampContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 12,
    alignItems: 'center',
  },
  timestampText: {
    fontSize: 12,
    color: '#999',
  },
  tipsContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipEmoji: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  privacyContainer: {
    backgroundColor: '#e8f5e8',
    margin: 20,
    marginTop: 0,
    marginBottom: 40,
    borderRadius: 16,
    padding: 20,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d5016',
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 14,
    color: '#2d5016',
    lineHeight: 20,
  },
  // New styles for score breakdown
  scoreBreakdownContainer: {
    marginBottom: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  scoreBreakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  scoreBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreBreakdownLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  scoreBreakdownBar: {
    flex: 2,
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  scoreBreakdownFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreBreakdownValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
  // Highlights styles
  highlightsContainer: {
    marginBottom: 24,
  },
  highlightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  highlightBullet: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    marginTop: 2,
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
});
