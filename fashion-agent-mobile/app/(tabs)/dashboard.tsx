import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { fashionAPI } from '../../services/api';
import Toast from 'react-native-toast-message';

interface RecentAnalysis {
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

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const response = await fashionAPI.getAnalysisHistory();
      
      // Get the 3 most recent analyses
      const recent = response.data
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
      
      setRecentAnalyses(recent);
      
      console.log('✅ Dashboard data loaded successfully');
    } catch (error: any) {
      console.error('❌ Failed to load dashboard data:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Data',
        text2: 'Please check your connection and try again',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>
          Welcome back, {user?.name || 'Fashionista'}! 👋
        </Text>
        <Text style={styles.welcomeSubtext}>
          Ready to analyze your style today?
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{recentAnalyses.length}</Text>
          <Text style={styles.statLabel}>Recent Analyses</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {recentAnalyses.length > 0 
              ? Math.round(recentAnalyses.reduce((sum, analysis) => sum + (analysis.fit + analysis.colorHarmony + analysis.occasionSuitability) / 3, 0) / recentAnalyses.length)
              : '--'
            }
          </Text>
          <Text style={styles.statLabel}>Avg Score</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {new Set(recentAnalyses
              .filter(a => a.styleCategory)
              .map(a => a.styleCategory)
            ).size}
          </Text>
          <Text style={styles.statLabel}>Style Categories</Text>
        </View>
      </View>

      {/* Recent Analyses */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Recent Style Analyses</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading your style history...</Text>
          </View>
        ) : recentAnalyses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📸</Text>
            <Text style={styles.emptyText}>No analyses yet</Text>
            <Text style={styles.emptySubtext}>
              Upload your first outfit photo to get started!
            </Text>
          </View>
        ) : (
          recentAnalyses.map((analysis) => {
            const avgScore = Math.round((analysis.fit + analysis.colorHarmony + analysis.occasionSuitability) / 3);
            return (
              <View key={analysis.id} style={styles.analysisCard}>
                <View style={styles.analysisHeader}>
                  {analysis.imageUrl && (
                    <Image source={{ uri: analysis.imageUrl }} style={styles.analysisImage} />
                  )}
                  <View style={styles.analysisContent}>
                    <View style={styles.analysisTopRow}>
                      <View style={[styles.scoreCircle, { backgroundColor: getScoreColor(avgScore) }]}>
                        <Text style={styles.scoreText}>{avgScore}</Text>
                      </View>
                      <View style={styles.analysisInfo}>
                        <Text style={styles.analysisDate}>{formatDate(analysis.createdAt)}</Text>
                        <Text style={styles.analysisCategories}>
                          {analysis.styleCategory || 'General Style'}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.analysisFeedback} numberOfLines={2}>
                      {analysis.highlights && analysis.highlights.length > 0 
                        ? analysis.highlights.join('. ') 
                        : analysis.description || 'Style analysis completed'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>📸 Analyze New Outfit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>📋 View Full History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.logoutButton]} 
          onPress={handleLogout}
        >
          <Text style={[styles.actionButtonText, styles.logoutButtonText]}>
            🚪 Logout
          </Text>
        </TouchableOpacity>
      </View>

      {/* Security Footer */}
      <View style={styles.securityFooter}>
        <Text style={styles.securityText}>
          🔒 Your data is secured with enterprise-grade encryption
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
  welcomeSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sectionContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
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
  analysisCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  analysisHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  analysisImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  analysisContent: {
    flex: 1,
  },
  analysisTopRow: {
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
  analysisInfo: {
    flex: 1,
  },
  analysisDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  analysisCategories: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
  },
  analysisFeedback: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  actionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  actionButton: {
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
  },
  logoutButtonText: {
    color: '#ffffff',
  },
  securityFooter: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  securityText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
