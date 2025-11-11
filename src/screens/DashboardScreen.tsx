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
import { UserProfile, DailyActivity } from '../types/database';
import { LEVEL_THRESHOLDS, getProgressPercentage } from '../utils/points';

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentActivities, setRecentActivities] = useState<DailyActivity[]>([]);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const [profileData, activitiesData] = await Promise.all([
        getUserProfile(user.id),
        getDailyActivities(user.id, 7),
      ]);

      setProfile(profileData);
      setRecentActivities(activitiesData);
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
        <ActivityIndicator size="large" color="#4F46E5" />
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
      <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.header}>
        <Text style={styles.headerTitle}>Tableau de Bord</Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelEmoji}>{levelInfo.emoji}</Text>
          <Text style={styles.levelText}>{profile.current_level.toUpperCase()}</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.total_points}</Text>
            <Text style={styles.statLabel}>Points totaux</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.completed_days}/100</Text>
            <Text style={styles.statLabel}>Jours complétés</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Progression vers la maîtrise</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
        </View>

        <View style={styles.pointsCard}>
          <Text style={styles.sectionTitle}>Système de points</Text>
          <View style={styles.pointsItem}>
            <Text style={styles.pointsEmoji}>📸</Text>
            <Text style={styles.pointsText}>Photo: 10 pts</Text>
          </View>
          <View style={styles.pointsItem}>
            <Text style={styles.pointsEmoji}>🎬</Text>
            <Text style={styles.pointsText}>Vidéo: 30 pts</Text>
          </View>
          <View style={styles.pointsItem}>
            <Text style={styles.pointsEmoji}>✂️</Text>
            <Text style={styles.pointsText}>Montage: 20 pts</Text>
          </View>
          <View style={styles.pointsItem}>
            <Text style={styles.pointsEmoji}>🎁</Text>
            <Text style={styles.pointsText}>Jour complet: 50 pts bonus</Text>
          </View>
        </View>

        {recentActivities.length > 0 && (
          <View style={styles.recentCard}>
            <Text style={styles.sectionTitle}>Activités récentes</Text>
            {recentActivities.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <Text style={styles.activityDate}>
                  {new Date(activity.activity_date).toLocaleDateString('fr-FR')}
                </Text>
                <Text style={styles.activityPoints}>+{activity.points_earned} pts</Text>
                {activity.is_complete && <Text style={styles.completeCheck}>✓</Text>}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  levelEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 6,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    textAlign: 'right',
  },
  pointsCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  pointsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pointsEmoji: {
    fontSize: 20,
    marginRight: 10,
    width: 30,
  },
  pointsText: {
    fontSize: 16,
    color: '#4B5563',
  },
  recentCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  activityDate: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
  },
  activityPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginRight: 10,
  },
  completeCheck: {
    fontSize: 18,
    color: '#10B981',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
  },
});
