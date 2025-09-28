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
  Platform,
} from 'react-native';
import { fashionAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
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
  const { user, isAuthenticated } = useAuth();
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const maxReviews = isAuthenticated ? 5 : 3;

  useEffect(() => {
    loadAnalysisHistory();
  }, [isAuthenticated]);

  const loadAnalysisHistory = async () => {
    try {
      setLoading(true);
      
      // Only load history if user is authenticated
      if (isAuthenticated) {
        const response = await fashionAPI.getAnalysisHistory();
        setAnalysisHistory(response.data);
        console.log('✅ Analysis history loaded successfully');
      } else {
        // For guests, show empty history
        setAnalysisHistory([]);
        console.log('🧑‍🤝‍🧑 Guest user - showing empty history');
      }
    } catch (error: any) {
      console.error('❌ Failed to load analysis history:', error);
      
      // Don't show error toast for 401 errors (authentication issues)
      if (error.response?.status !== 401) {
        Toast.show({
          type: 'error',
          text1: 'Failed to Load History',
          text2: 'Please check your connection and try again',
        });
      }
      
      // Set empty history on error
      setAnalysisHistory([]);
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
    if (score >= 7) return '#3B82F6'; // Blue
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
          {isAuthenticated 
            ? `Your fashion journey - showing last ${maxReviews} reviews`
            : `Guest access - showing last ${maxReviews} reviews`
          }
        </Text>
        {!isAuthenticated && (
          <View style={styles.upgradeHint}>
            <Text style={styles.upgradeHintText}>
              Sign up to see up to 5 reviews and unlock premium features!
            </Text>
          </View>
        )}
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
        <View style={styles.tilesContainer}>
          {analysisHistory.slice(0, maxReviews).map((analysis, index) => {
            const avgScore = calculateAverageScore(analysis);
            return (
              <View key={analysis.id} style={styles.historyTile}>
                {/* Tile Header with Index */}
                <View style={styles.tileHeader}>
                  <Text style={styles.tileNumber}>{String(index + 1).padStart(2, '0')}</Text>
                  <View style={styles.tileScoreContainer}>
                    <Text style={styles.tileScore}>{avgScore}</Text>
                  </View>
                </View>

                {/* Tile Content */}
                <View style={styles.tileContent}>
                  <Text style={styles.tileCategory}>{analysis.styleCategory || 'Style Review'}</Text>
                  <Text style={styles.tileDate}>{formatDate(analysis.createdAt)}</Text>
                  
                  {/* Mini Score Bars */}
                  <View style={styles.miniScoreContainer}>
                    <View style={styles.miniScoreItem}>
                      <Text style={styles.miniScoreLabel}>Fit</Text>
                      <Text style={styles.miniScoreValue}>{analysis.fit}/10</Text>
                    </View>
                    <View style={styles.miniScoreItem}>
                      <Text style={styles.miniScoreLabel}>Color</Text>
                      <Text style={styles.miniScoreValue}>{analysis.colorHarmony}/10</Text>
                    </View>
                    <View style={styles.miniScoreItem}>
                      <Text style={styles.miniScoreLabel}>Occasion</Text>
                      <Text style={styles.miniScoreValue}>{analysis.occasionSuitability}/10</Text>
                    </View>
                  </View>
                  
                  {/* Best Highlight */}
                  {analysis.highlights && analysis.highlights.length > 0 && (
                    <Text style={styles.tileHighlight} numberOfLines={2}>
                      ✨ {analysis.highlights[0]}
                    </Text>
                  )}
                </View>
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
    backgroundColor: '#F5F1E8',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtext: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 8,
  },
  upgradeHint: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  upgradeHintText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
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
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  tilesContainer: {
    padding: 20,
    paddingTop: 12,
  },
  historyTile: {
    backgroundColor: '#2D2D2D',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    minHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tileNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  tileScoreContainer: {
    backgroundColor: '#404040',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tileScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  tileContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  tileCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  tileDate: {
    fontSize: 12,
    color: '#B0B0B0',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  miniScoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  miniScoreItem: {
    alignItems: 'center',
  },
  miniScoreLabel: {
    fontSize: 10,
    color: '#B0B0B0',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  miniScoreValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  tileHighlight: {
    fontSize: 11,
    color: '#B0B0B0',
    lineHeight: 16,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});
