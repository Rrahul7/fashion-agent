import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { fashionAPI } from '../../services/api';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

interface AnalysisHistory {
  id: string;
  imageUrl: string;
  description: string;
  styleCategory: string;
  fit: number;
  colorHarmony: number;
  occasionSuitability: number;
  highlights: string[];
  improvementSuggestions: string[];
  createdAt: string;
  accepted?: boolean;
}

export default function HistoryScreen() {
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalysisHistory();
  }, []);

  const loadAnalysisHistory = async () => {
    try {
      setLoading(true);
      
      const response = await fashionAPI.getAnalysisHistory();
      setAnalysisHistory(response.data);
      
      console.log('✅ Analysis history loaded successfully');
    } catch (error: any) {
      console.error('❌ Failed to load analysis history:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Failed to Load History',
        text2: 'Please check your connection and try again',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalysisHistory();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#10B981'; // Green
    if (score >= 6) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const calculateAverageScore = (analysis: AnalysisHistory) => {
    return Math.round((analysis.fit + analysis.colorHarmony + analysis.occasionSuitability) / 3);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Style History</Text>
        <Text style={styles.headerSubtext}>
          Your complete fashion analysis journey
        </Text>
      </View>

      {/* Analysis History */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your style history...</Text>
        </View>
      ) : analysisHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📸</Text>
          <Text style={styles.emptyText}>No analysis history yet</Text>
          <Text style={styles.emptySubtext}>
            Upload your first outfit photo to start building your style profile!
          </Text>
        </View>
      ) : (
        <View style={styles.historyContainer}>
          {analysisHistory.map((analysis) => {
            const avgScore = calculateAverageScore(analysis);
            return (
              <View key={analysis.id} style={styles.historyCard}>
                {/* Image and Score */}
                <View style={styles.cardHeader}>
                  <Image source={{ uri: analysis.imageUrl }} style={styles.outfitImage} />
                  
                  <View style={styles.cardInfo}>
                    <View style={styles.scoreContainer}>
                      <View style={[styles.scoreCircle, { backgroundColor: getScoreColor(avgScore) }]}>
                        <Text style={styles.scoreText}>{avgScore}</Text>
                      </View>
                      <View style={styles.scoreDetails}>
                        <Text style={styles.scoreLabel}>Overall Score</Text>
                        <Text style={styles.categoryText}>{analysis.styleCategory}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.dateText}>{formatDate(analysis.createdAt)}</Text>
                  </View>
                </View>

                {/* Score Breakdown */}
                <View style={styles.breakdownContainer}>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Fit</Text>
                    <View style={styles.breakdownBar}>
                      <View style={[styles.breakdownFill, { 
                        width: `${analysis.fit * 10}%`, 
                        backgroundColor: getScoreColor(analysis.fit) 
                      }]} />
                    </View>
                    <Text style={styles.breakdownScore}>{analysis.fit}</Text>
                  </View>
                  
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Color</Text>
                    <View style={styles.breakdownBar}>
                      <View style={[styles.breakdownFill, { 
                        width: `${analysis.colorHarmony * 10}%`, 
                        backgroundColor: getScoreColor(analysis.colorHarmony) 
                      }]} />
                    </View>
                    <Text style={styles.breakdownScore}>{analysis.colorHarmony}</Text>
                  </View>
                  
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Occasion</Text>
                    <View style={styles.breakdownBar}>
                      <View style={[styles.breakdownFill, { 
                        width: `${analysis.occasionSuitability * 10}%`, 
                        backgroundColor: getScoreColor(analysis.occasionSuitability) 
                      }]} />
                    </View>
                    <Text style={styles.breakdownScore}>{analysis.occasionSuitability}</Text>
                  </View>
                </View>

                {/* Highlights */}
                {analysis.highlights && analysis.highlights.length > 0 && (
                  <View style={styles.highlightsContainer}>
                    <Text style={styles.sectionTitle}>✨ Highlights</Text>
                    {analysis.highlights.slice(0, 2).map((highlight, index) => (
                      <Text key={index} style={styles.highlightText}>• {highlight}</Text>
                    ))}
                  </View>
                )}

                {/* Suggestions Preview */}
                {analysis.improvementSuggestions && analysis.improvementSuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.sectionTitle}>💡 Suggestions</Text>
                    <Text style={styles.suggestionText}>
                      {analysis.improvementSuggestions[0]}
                      {analysis.improvementSuggestions.length > 1 && ` (+${analysis.improvementSuggestions.length - 1} more)`}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  historyContainer: {
    padding: 20,
    paddingTop: 12,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  outfitImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  scoreDetails: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'flex-end',
  },
  breakdownContainer: {
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#666',
    width: 60,
  },
  breakdownBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    borderRadius: 3,
  },
  breakdownScore: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    width: 20,
    textAlign: 'right',
  },
  highlightsContainer: {
    marginBottom: 12,
  },
  suggestionsContainer: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  highlightText: {
    fontSize: 12,
    color: '#10B981',
    lineHeight: 16,
    marginBottom: 2,
  },
  suggestionText: {
    fontSize: 12,
    color: '#667eea',
    lineHeight: 16,
  },
});
