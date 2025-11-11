import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Course, CourseWeek, CourseActivity } from '../types/database';
import { getCourseWeeks, getCourseActivities } from '../services/courseDetailService';
import { getCurrentUser } from '../services/userService';
import { getUserActivityProgress } from '../services/activityService';

interface CourseDetailScreenProps {
  course: Course;
  onBack: () => void;
}

export default function CourseDetailScreen({ course, onBack }: CourseDetailScreenProps) {
  const [loading, setLoading] = useState(true);
  const [weeks, setWeeks] = useState<CourseWeek[]>([]);
  const [activities, setActivities] = useState<CourseActivity[]>([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set());
  const [showActivities, setShowActivities] = useState(false);

  useEffect(() => {
    loadCourseDetails();
  }, []);

  const loadCourseDetails = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const [weeksData, activitiesData] = await Promise.all([
        getCourseWeeks(course.id),
        getCourseActivities(course.id),
      ]);

      setWeeks(weeksData);
      setActivities(activitiesData);

      const completedSet = new Set<string>();
      for (const activity of activitiesData) {
        const progress = await getUserActivityProgress(user.id, activity.id);
        if (progress?.completed) {
          completedSet.add(activity.id);
        }
      }
      setCompletedActivities(completedSet);
    } catch (error) {
      console.error('Error loading course details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCourseGradient = () => {
    if (course.title.toLowerCase().includes('photo')) {
      return ['#EC4899', '#DB2777'];
    } else if (course.title.toLowerCase().includes('vid')) {
      return ['#8B5CF6', '#7C3AED'];
    } else if (course.title.toLowerCase().includes('montage')) {
      return ['#06B6D4', '#0891B2'];
    }
    return ['#5B52FF', '#7C3AED'];
  };

  const getCourseIcon = () => {
    if (course.title.toLowerCase().includes('photo')) return '📷';
    if (course.title.toLowerCase().includes('vid')) return '🎬';
    if (course.title.toLowerCase().includes('montage')) return '✂️';
    return '📚';
  };

  const getBadgeText = () => {
    if (course.title.toLowerCase().includes('photo')) return '🏆 CEI d\'Aigle';
    if (course.title.toLowerCase().includes('vid')) return '🎬 Réalisateur Émergent';
    if (course.title.toLowerCase().includes('montage')) return '✂️ Monteur Virtuose';
    return '🏆 Badge';
  };

  const getSelectedWeek = () => {
    return weeks[selectedWeekIndex];
  };

  const getWeekActivities = () => {
    const selectedWeek = getSelectedWeek();
    if (!selectedWeek) return [];
    return activities.filter(a => a.week_id === selectedWeek.id);
  };

  const groupActivitiesByDay = () => {
    const weekActivities = getWeekActivities();
    const grouped: Record<number, CourseActivity[]> = {};
    weekActivities.forEach(activity => {
      if (!grouped[activity.day_number]) {
        grouped[activity.day_number] = [];
      }
      grouped[activity.day_number].push(activity);
    });
    return grouped;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lecture': return '📖';
      case 'video': return '🎥';
      case 'quiz': return '❓';
      case 'exercise': return '💪';
      default: return '📝';
    }
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'lecture': return 'COURS';
      case 'video': return 'VIDÉO';
      case 'quiz': return 'QUIZ';
      case 'exercise': return 'EXERCICE';
      default: return type.toUpperCase();
    }
  };

  const totalXP = activities.reduce((sum, a) => sum + a.xp_reward, 0);
  const earnedXP = Array.from(completedActivities).reduce((sum, activityId) => {
    const activity = activities.find(a => a.id === activityId);
    return sum + (activity?.xp_reward || 0);
  }, 0);
  const progressPercentage = totalXP > 0 ? Math.round((earnedXP / totalXP) * 100) : 0;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size={48} color="#5B52FF" />
      </View>
    );
  }

  const gradient = getCourseGradient();
  const groupedActivities = groupActivitiesByDay();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradient}
        style={styles.header}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ (tabs)</Text>
        </TouchableOpacity>
        <Text style={styles.headerSubtitle}>{course.title}</Text>

        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>{getCourseIcon()}</Text>
        </View>

        <Text style={styles.headerMainTitle}>{course.title}</Text>
        <Text style={styles.headerDescription}>{course.description}</Text>

        <View style={styles.headerBadges}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeIcon}>🗓</Text>
            <Text style={styles.headerBadgeText}>{weeks.length} semaines</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeIcon}>⭐</Text>
            <Text style={styles.headerBadgeText}>{totalXP} XP</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{getBadgeText()}</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <Text style={styles.progressText}>{earnedXP} / {totalXP} XP</Text>
          <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
        </View>

        <TouchableOpacity style={styles.continueButton}>
          <Text style={styles.continueButtonText}>▶ Continuer le module</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoIcon}>📋</Text>
            <Text style={styles.infoTitle}>Informations</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Text style={styles.infoRowIcon}>📅</Text>
            </View>
            <Text style={styles.infoLabel}>Dates</Text>
            <Text style={styles.infoValue}>01/11/2025 - 30/11/2025</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Text style={styles.infoRowIcon}>📊</Text>
            </View>
            <Text style={styles.infoLabel}>Niveau</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>
                {course.difficulty === 'beginner' ? 'Débutant' : course.difficulty === 'intermediate' ? 'Intermédiaire' : 'Avancé'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Text style={styles.infoRowIcon}>📚</Text>
            </View>
            <Text style={styles.infoLabel}>Semaines</Text>
            <Text style={styles.infoValue}>{weeks.length} semaines</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🗓</Text>
            <Text style={styles.sectionTitle}>Semaines</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekTabs}>
            {weeks.map((week, index) => (
              <TouchableOpacity
                key={week.id}
                style={[
                  styles.weekTab,
                  selectedWeekIndex === index && styles.weekTabActive,
                ]}
                onPress={() => {
                  setSelectedWeekIndex(index);
                  setShowActivities(false);
                }}
              >
                <Text
                  style={[
                    styles.weekTabText,
                    selectedWeekIndex === index && styles.weekTabTextActive,
                  ]}
                >
                  Semaine {week.week_number}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {getSelectedWeek() && (
            <View style={styles.weekContent}>
              <View style={styles.weekHeader}>
                <Text style={styles.weekLabel}>AINÉ {selectedWeekIndex + 1}</Text>
                <Text style={styles.weekXP}>⭐ {getWeekActivities().reduce((s, a) => s + a.xp_reward, 0)} XP</Text>
              </View>
              <Text style={styles.weekTitle}>{getSelectedWeek().title}</Text>
              <Text style={styles.weekDescription}>{getSelectedWeek().description}</Text>

              <View style={styles.activityList}>
                {getWeekActivities().map((activity, index) => (
                  <View key={activity.id} style={styles.activityItem}>
                    <View style={styles.activityNumber}>
                      <Text style={styles.activityNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activityXP}>{activity.xp_reward} XP</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.activitiesToggle}
          onPress={() => setShowActivities(!showActivities)}
        >
          <View style={styles.activitiesToggleContent}>
            <Text style={styles.activitiesToggleIcon}>🎯</Text>
            <Text style={styles.activitiesToggleText}>Activités</Text>
          </View>
          <Text style={styles.activitiesToggleArrow}>{showActivities ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {showActivities && (
          <View style={styles.activitiesSection}>
            {Object.entries(groupedActivities).sort(([a], [b]) => Number(a) - Number(b)).map(([day, dayActivities]) => (
              <View key={day}>
                <Text style={styles.dayTitle}>Jour {day} - {dayActivities[0]?.title}</Text>
                {dayActivities.map(activity => {
                  const isCompleted = completedActivities.has(activity.id);
                  return (
                    <View key={activity.id} style={[styles.activityCard, isCompleted && styles.activityCardCompleted]}>
                      <View style={styles.activityCardIcon}>
                        <Text style={styles.activityCardIconText}>{getActivityIcon(activity.activity_type)}</Text>
                      </View>
                      <View style={styles.activityCardContent}>
                        <Text style={styles.activityCardType}>{getActivityTypeLabel(activity.activity_type)}</Text>
                        <Text style={styles.activityCardTitle}>{activity.title}</Text>
                        <View style={styles.activityCardFooter}>
                          <Text style={styles.activityCardTime}>⏱ {activity.estimated_duration_minutes} min</Text>
                          <Text style={styles.activityCardXP}>⭐ {activity.xp_reward} XP</Text>
                        </View>
                      </View>
                      {isCompleted && (
                        <View style={styles.activityCardCheck}>
                          <Text style={styles.activityCardCheckIcon}>✓</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        <View style={styles.projectSection}>
          <View style={styles.projectHeader}>
            <Text style={styles.projectIcon}>🎯</Text>
            <Text style={styles.projectTitle}>Projet Final</Text>
          </View>

          <View style={styles.projectCard}>
            <Text style={styles.projectCardTitle}>Raconte ton histoire en 5 photos</Text>
            <Text style={styles.projectCardDescription}>
              Créer une mini-série photographique cohérente de 5 photographies qui racontent une histoire.
            </Text>

            <View style={styles.projectMeta}>
              <View style={styles.projectMetaItem}>
                <Text style={styles.projectMetaIcon}>⭐</Text>
                <Text style={styles.projectMetaText}>100 points</Text>
              </View>
              <View style={styles.projectMetaItem}>
                <Text style={styles.projectMetaIcon}>📅</Text>
                <Text style={styles.projectMetaText}>30/11/2025</Text>
              </View>
            </View>

            <Text style={styles.projectRequirementsTitle}>Exigences :</Text>
            <Text style={styles.projectRequirement}>• Au moins 1 photo en grande ouverture (f/1.4 - f/2.8)</Text>
            <Text style={styles.projectRequirement}>• Au moins 1 photo en petite ouverture (f/8 - f/16)</Text>
            <Text style={styles.projectRequirement}>• Au moins 1 photo avec vitesse rapide (≥1/500)</Text>
            <Text style={styles.projectRequirement}>• Variété dans les cadrages</Text>
            <Text style={styles.projectRequirement}>• Cohérence esthétique</Text>

            <TouchableOpacity style={styles.projectButton}>
              <Text style={styles.projectButtonText}>Voir les détails</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.criteriaSection}>
          <View style={styles.criteriaHeader}>
            <Text style={styles.criteriaIcon}>📊</Text>
            <Text style={styles.criteriaTitle}>Critères d'évaluation</Text>
          </View>

          <View style={styles.criteriaCard}>
            <View style={styles.criteriaItem}>
              <Text style={styles.criteriaItemTitle}>Maîtrise technique</Text>
              <Text style={styles.criteriaItemPoints}>30 pts</Text>
            </View>
            <Text style={styles.criteriaItemDescription}>Triangle d'exposition, netteté</Text>
          </View>

          <View style={styles.criteriaCard}>
            <View style={styles.criteriaItem}>
              <Text style={styles.criteriaItemTitle}>Composition</Text>
              <Text style={styles.criteriaItemPoints}>25 pts</Text>
            </View>
            <Text style={styles.criteriaItemDescription}>Règle des tiers, équilibre</Text>
          </View>
        </View>
      </ScrollView>
    </View>
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
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.95,
    marginBottom: 15,
  },
  headerIcon: {
    width: 70,
    height: 70,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerIconText: {
    fontSize: 36,
  },
  headerMainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerDescription: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.95,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 18,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 15,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  headerBadgeIcon: {
    fontSize: 12,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 15,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  continueButton: {
    backgroundColor: '#5B52FF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    margin: 15,
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoIconContainer: {
    width: 35,
  },
  infoRowIcon: {
    fontSize: 18,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  levelBadge: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  levelBadgeText: {
    fontSize: 13,
    color: '#5B52FF',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  weekTabs: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  weekTab: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  weekTabActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#5B52FF',
  },
  weekTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  weekTabTextActive: {
    color: '#5B52FF',
  },
  weekContent: {
    marginTop: 10,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weekLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EC4899',
    letterSpacing: 0.5,
  },
  weekXP: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  weekDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 15,
    lineHeight: 18,
  },
  activityList: {
    gap: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activityNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5B52FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  activityContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTitle: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },
  activityXP: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activitiesToggle: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  activitiesToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activitiesToggleIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  activitiesToggleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  activitiesToggleArrow: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  activitiesSection: {
    marginHorizontal: 15,
    marginBottom: 15,
  },
  dayTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  activityCardCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  activityCardIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityCardIconText: {
    fontSize: 24,
  },
  activityCardContent: {
    flex: 1,
  },
  activityCardType: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  activityCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 5,
  },
  activityCardFooter: {
    flexDirection: 'row',
    gap: 15,
  },
  activityCardTime: {
    fontSize: 11,
    color: '#6B7280',
  },
  activityCardXP: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
  },
  activityCardCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityCardCheckIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  projectSection: {
    marginHorizontal: 15,
    marginBottom: 15,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 18,
    borderWidth: 2,
    borderColor: '#EC4899',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  projectCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  projectCardDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  projectMeta: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  projectMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  projectMetaIcon: {
    fontSize: 14,
  },
  projectMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  projectRequirementsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  projectRequirement: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 4,
  },
  projectButton: {
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#5B52FF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  projectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B52FF',
  },
  criteriaSection: {
    marginHorizontal: 15,
    marginBottom: 30,
  },
  criteriaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  criteriaIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  criteriaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  criteriaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  criteriaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  criteriaItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  criteriaItemPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EC4899',
  },
  criteriaItemDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
});
