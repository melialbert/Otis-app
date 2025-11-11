import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getUserProfile, getCurrentUser } from '../services/userService';
import { getDailyActivities } from '../services/activityService';
import { getAllUserProgress } from '../services/courseService';
import { UserProfile, DailyActivity } from '../types/database';
import { LEVEL_THRESHOLDS, getProgressPercentage } from '../utils/points';

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentActivities, setRecentActivities] = useState<DailyActivity[]>([]);
  const [coursesCount, setCoursesCount] = useState(0);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const [profileData, activitiesData, progressData] = await Promise.all([
        getUserProfile(user.id),
        getDailyActivities(user.id, 7),
        getAllUserProgress(user.id),
      ]);

      setProfile(profileData);
      setRecentActivities(activitiesData);
      setCoursesCount(progressData.length);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size={48} color="#5B52FF" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Profil non trouvé</Text>
      </View>
    );
  }

  const levelInfo = LEVEL_THRESHOLDS[profile.current_level];
  const progressPercentage = getProgressPercentage(profile.completed_days);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <LinearGradient colors={['#5B52FF', '#7C3AED']} style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelEmoji}>{levelInfo.emoji}</Text>
          <Text style={styles.levelText}>{profile.current_level.toUpperCase()}</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <LinearGradient colors={['#EC4899', '#DB2777']} style={styles.statCard}>
            <Text style={styles.statValue}>{coursesCount}</Text>
            <Text style={styles.statLabel}>Modules disponibles</Text>
          </LinearGradient>

          <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.statCard}>
            <Text style={styles.statValue}>{profile.total_points}</Text>
            <Text style={styles.statLabel}>XP total possible</Text>
          </LinearGradient>

          <LinearGradient colors={['#06B6D4', '#0891B2']} style={styles.statCard}>
            <Text style={styles.statValue}>{profile.completed_days}</Text>
            <Text style={styles.statLabel}>Semaines de contenu</Text>
          </LinearGradient>
        </View>

        <View style={styles.globalStatsCard}>
          <Text style={styles.sectionTitle}>📊 Statistiques globales</Text>
          <View style={styles.globalStatsGrid}>
            <View style={styles.globalStatItem}>
              <Text style={styles.globalStatValue}>{coursesCount}</Text>
              <Text style={styles.globalStatLabel}>Modules{'\n'}disponibles</Text>
            </View>
            <View style={styles.globalStatDivider} />
            <View style={styles.globalStatItem}>
              <Text style={styles.globalStatValue}>{profile.total_points}</Text>
              <Text style={styles.globalStatLabel}>XP total{'\n'}possible</Text>
            </View>
            <View style={styles.globalStatDivider} />
            <View style={styles.globalStatItem}>
              <Text style={styles.globalStatValue}>{profile.completed_days}</Text>
              <Text style={styles.globalStatLabel}>Semaines de{'\n'}contenu</Text>
            </View>
          </View>
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Progression vers la maîtrise</Text>
          <View style={styles.progressBarContainer}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={[styles.progressBar, { width: `${progressPercentage}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
        </View>

        {recentActivities.length > 0 && (
          <View style={styles.recentCard}>
            <Text style={styles.sectionTitle}>🔥 Activités récentes</Text>
            {recentActivities.slice(0, 5).map((activity, index) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityDateBadge}>
                  <Text style={styles.activityDay}>
                    {new Date(activity.activity_date).toLocaleDateString('fr-FR', { day: '2-digit' })}
                  </Text>
                  <Text style={styles.activityMonth}>
                    {new Date(activity.activity_date).toLocaleDateString('fr-FR', { month: 'short' })}
                  </Text>
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityDate}>
                    {new Date(activity.activity_date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                  <Text style={styles.activityPoints}>+{activity.points_earned} XP</Text>
                </View>
                {activity.is_complete && (
                  <View style={styles.completeCheck}>
                    <Text style={styles.completeCheckText}>✓</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.pointsCard}>
          <Text style={styles.sectionTitle}>⭐ Système de points</Text>
          <View style={styles.pointsGrid}>
            <LinearGradient colors={['#EC4899', '#DB2777']} style={styles.pointItem}>
              <Text style={styles.pointEmoji}>📸</Text>
              <Text style={styles.pointLabel}>Photo</Text>
              <Text style={styles.pointValue}>10 pts</Text>
            </LinearGradient>
            <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.pointItem}>
              <Text style={styles.pointEmoji}>🎬</Text>
              <Text style={styles.pointLabel}>Vidéo</Text>
              <Text style={styles.pointValue}>30 pts</Text>
            </LinearGradient>
            <LinearGradient colors={['#06B6D4', '#0891B2']} style={styles.pointItem}>
              <Text style={styles.pointEmoji}>✂️</Text>
              <Text style={styles.pointLabel}>Montage</Text>
              <Text style={styles.pointValue}>20 pts</Text>
            </LinearGradient>
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.pointItem}>
              <Text style={styles.pointEmoji}>🎁</Text>
              <Text style={styles.pointLabel}>Bonus</Text>
              <Text style={styles.pointValue}>50 pts</Text>
            </LinearGradient>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  levelEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  levelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    padding: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  globalStatsCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  globalStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  globalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  globalStatValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#5B52FF',
    marginBottom: 8,
  },
  globalStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  globalStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    textAlign: 'right',
  },
  pointsCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pointsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pointItem: {
    flex: 1,
    minWidth: '47%',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pointEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  pointLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
  },
  pointValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  recentCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityDateBadge: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#5B52FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  activityMonth: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.9,
    textTransform: 'uppercase',
  },
  activityInfo: {
    flex: 1,
  },
  activityDate: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  activityPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  completeCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeCheckText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
  },
});
