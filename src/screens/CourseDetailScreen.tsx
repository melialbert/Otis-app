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
import { Course, CourseWeek, CourseActivity, CourseProject, ProjectEvaluationCriteria, UserActivityCompletion } from '../types/database';
import { getCourseWeeks, getWeekActivities, getCourseProject, getProjectCriteria, getUserActivityCompletions, toggleActivityCompletion } from '../services/courseDetailService';
import { getCurrentUser } from '../services/userService';

interface CourseDetailScreenProps {
  course: Course;
  onBack: () => void;
}

export default function CourseDetailScreen({ course, onBack }: CourseDetailScreenProps) {
  const [loading, setLoading] = useState(true);
  const [weeks, setWeeks] = useState<CourseWeek[]>([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [activities, setActivities] = useState<CourseActivity[]>([]);
  const [project, setProject] = useState<CourseProject | null>(null);
  const [criteria, setCriteria] = useState<ProjectEvaluationCriteria[]>([]);
  const [completions, setCompletions] = useState<Map<string, boolean>>(new Map());
  const [showProjectDetails, setShowProjectDetails] = useState(false);

  useEffect(() => {
    loadCourseDetails();
  }, []);

  useEffect(() => {
    if (weeks.length > 0) {
      loadWeekActivities(weeks[selectedWeekIndex].id);
    }
  }, [selectedWeekIndex, weeks]);

  const loadCourseDetails = async () => {
    try {
      const [weeksData, projectData] = await Promise.all([
        getCourseWeeks(course.id),
        getCourseProject(course.id),
      ]);

      setWeeks(weeksData);
      setProject(projectData);

      if (projectData) {
        const criteriaData = await getProjectCriteria(projectData.id);
        setCriteria(criteriaData);
      }
    } catch (error) {
      console.error('Error loading course details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWeekActivities = async (weekId: string) => {
    try {
      const activitiesData = await getWeekActivities(weekId);
      setActivities(activitiesData);

      const user = await getCurrentUser();
      if (user && activitiesData.length > 0) {
        const activityIds = activitiesData.map(a => a.id);
        const completionsData = await getUserActivityCompletions(user.id, activityIds);

        const completionsMap = new Map();
        completionsData.forEach(c => {
          completionsMap.set(c.activity_id, c.completed);
        });
        setCompletions(completionsMap);
      }
    } catch (error) {
      console.error('Error loading week activities:', error);
    }
  };

  const handleActivityToggle = async (activityId: string) => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const currentStatus = completions.get(activityId) || false;
      const newStatus = !currentStatus;

      await toggleActivityCompletion(user.id, activityId, newStatus);

      setCompletions(prev => {
        const updated = new Map(prev);
        updated.set(activityId, newStatus);
        return updated;
      });
    } catch (error) {
      console.error('Error toggling activity:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'COURS':
        return '📖';
      case 'VIDÉO':
        return '🎬';
      case 'QUIZ':
        return '❓';
      case 'EXERCICE':
        return '✏️';
      default:
        return '📝';
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'COURS':
        return '#06B6D4';
      case 'VIDÉO':
        return '#8B5CF6';
      case 'QUIZ':
        return '#EF4444';
      case 'EXERCICE':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getCourseGradient = () => {
    const gradients = [
      ['#EC4899', '#DB2777'],
      ['#8B5CF6', '#7C3AED'],
      ['#06B6D4', '#0891B2'],
    ];
    return gradients[0];
  };

  const groupActivitiesByDay = () => {
    const grouped: Record<number, CourseActivity[]> = {};
    activities.forEach(activity => {
      if (!grouped[activity.day_number]) {
        grouped[activity.day_number] = [];
      }
      grouped[activity.day_number].push(activity);
    });
    return grouped;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size={48} color="#5B52FF" />
      </View>
    );
  }

  const gradient = getCourseGradient();
  const groupedActivities = groupActivitiesByDay();

  const totalWeeks = weeks.length;
  const totalXP = weeks.reduce((sum, week) => {
    return sum + activities.filter(a => a.week_id === week.id).reduce((s, a) => s + a.xp_reward, 0);
  }, 0);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradient}
        style={styles.header}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← (tabs)</Text>
        </TouchableOpacity>
        <Text style={styles.headerSubtitle}>{course.title}</Text>

        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>✂️</Text>
        </View>

        <Text style={styles.headerMainTitle}>{course.title}</Text>
        <Text style={styles.headerDescription}>{course.description}</Text>

        <View style={styles.headerBadges}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeIcon}>📅</Text>
            <Text style={styles.headerBadgeText}>{totalWeeks} semaines</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeIcon}>⭐</Text>
            <Text style={styles.headerBadgeText}>{totalXP} XP</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeIcon}>📹</Text>
            <Text style={styles.headerBadgeText}>Monteur Virtuose</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.startButton}>
          <Text style={styles.startButtonText}>🚀 Démarrer le module</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📋 Informations</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={styles.infoLabel}>Dates</Text>
            <Text style={styles.infoValue}>01/01/2026 - 31/01/2026</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📊</Text>
            <Text style={styles.infoLabel}>Niveau</Text>
            <Text style={styles.infoBadge}>{course.difficulty === 'beginner' ? 'Débutant' : course.difficulty === 'intermediate' ? 'Intermédiaire' : 'Avancé'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📚</Text>
            <Text style={styles.infoLabel}>Semaines</Text>
            <Text style={styles.infoValue}>{totalWeeks} semaines</Text>
          </View>
        </View>
        {weeks.length > 0 && (
          <View style={styles.weeksContainer}>
            <Text style={styles.sectionTitle}>🗓 Semaines</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weeksScroll}>
              {weeks.map((week, index) => (
                <TouchableOpacity
                  key={week.id}
                  style={[
                    styles.weekTab,
                    selectedWeekIndex === index && styles.weekTabActive,
                  ]}
                  onPress={() => setSelectedWeekIndex(index)}
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
          </View>
        )}

        <View style={styles.activitiesContainer}>
          <Text style={styles.sectionTitle}>🎯 Activités</Text>
          {Object.keys(groupedActivities).sort((a, b) => Number(a) - Number(b)).map(dayNumber => (
            <View key={dayNumber} style={styles.daySection}>
              <Text style={styles.dayTitle}>Jour {dayNumber} - {groupedActivities[Number(dayNumber)][0].title}</Text>
              {groupedActivities[Number(dayNumber)].map(activity => {
                const isCompleted = completions.get(activity.id) || false;
                return (
                  <TouchableOpacity
                    key={activity.id}
                    style={[
                      styles.activityCard,
                      isCompleted && styles.activityCardCompleted,
                    ]}
                    onPress={() => handleActivityToggle(activity.id)}
                  >
                    <View style={styles.activityContent}>
                      <View style={styles.activityIconContainer}>
                        <Text style={styles.activityIcon}>{getActivityIcon(activity.activity_type)}</Text>
                      </View>
                      <View style={styles.activityInfo}>
                        <View style={styles.activityHeader}>
                          <View style={[styles.activityTypeBadge, { backgroundColor: getActivityTypeColor(activity.activity_type) }]}>
                            <Text style={styles.activityTypeText}>{activity.activity_type}</Text>
                          </View>
                        </View>
                        <Text style={styles.activityTitle}>{activity.title}</Text>
                        <View style={styles.activityMeta}>
                          <Text style={styles.activityMetaText}>⏱ {activity.duration_minutes} min</Text>
                          <Text style={styles.activityMetaText}>⭐ {activity.xp_reward} XP</Text>
                        </View>
                      </View>
                      {isCompleted && (
                        <View style={styles.completionCheck}>
                          <Text style={styles.completionCheckText}>✓</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {project && (
          <View style={styles.projectContainer}>
            <Text style={styles.sectionTitle}>🎯 Projet Final</Text>
            <View style={styles.projectCard}>
              <Text style={styles.projectTitle}>{project.title}</Text>
              <Text style={styles.projectDescription}>{project.description}</Text>

              <View style={styles.projectMeta}>
                <View style={styles.projectMetaItem}>
                  <Text style={styles.projectMetaIcon}>⭐</Text>
                  <Text style={styles.projectMetaText}>{project.xp_reward} points</Text>
                </View>
                <View style={styles.projectMetaItem}>
                  <Text style={styles.projectMetaIcon}>📅</Text>
                  <Text style={styles.projectMetaText}>{new Date().toLocaleDateString('fr-FR')}</Text>
                </View>
              </View>

              {!showProjectDetails ? (
                <>
                  <Text style={styles.requirementsTitle}>Exigences :</Text>
                  {project.requirements.slice(0, 3).map((req, index) => (
                    <View key={index} style={styles.requirementItem}>
                      <Text style={styles.requirementBullet}>•</Text>
                      <Text style={styles.requirementText}>{req}</Text>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => setShowProjectDetails(true)}
                  >
                    <Text style={styles.detailsButtonText}>Voir les détails</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.requirementsTitle}>Exigences :</Text>
                  {project.requirements.map((req, index) => (
                    <View key={index} style={styles.requirementItem}>
                      <Text style={styles.requirementBullet}>•</Text>
                      <Text style={styles.requirementText}>{req}</Text>
                    </View>
                  ))}

                  {criteria.length > 0 && (
                    <View style={styles.criteriaContainer}>
                      <Text style={styles.criteriaTitle}>📊 Critères d'évaluation</Text>
                      {criteria.map(criterion => (
                        <View key={criterion.id} style={styles.criterionItem}>
                          <View style={styles.criterionHeader}>
                            <Text style={styles.criterionTitle}>{criterion.title}</Text>
                            <Text style={styles.criterionPoints}>{criterion.max_points} pts</Text>
                          </View>
                          <Text style={styles.criterionDescription}>{criterion.description}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => setShowProjectDetails(false)}
                  >
                    <Text style={styles.detailsButtonText}>Masquer les détails</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
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
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 20,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerIconText: {
    fontSize: 40,
  },
  headerMainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  headerDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    gap: 5,
  },
  headerBadgeIcon: {
    fontSize: 14,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  startButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5B52FF',
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoIcon: {
    fontSize: 20,
    width: 40,
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
  infoBadge: {
    fontSize: 13,
    color: '#5B52FF',
    fontWeight: '600',
  },
  weeksContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  weeksScroll: {
    flexDirection: 'row',
  },
  weekTab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  weekTabTextActive: {
    color: '#5B52FF',
  },
  activitiesContainer: {
    padding: 20,
  },
  daySection: {
    marginBottom: 20,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  activityCardCompleted: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIcon: {
    fontSize: 24,
  },
  activityInfo: {
    flex: 1,
  },
  activityHeader: {
    marginBottom: 4,
  },
  activityTypeBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  activityTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  activityMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  activityMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  completionCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionCheckText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  projectContainer: {
    padding: 20,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#EC4899',
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 15,
    lineHeight: 20,
  },
  projectMeta: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
  },
  projectMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  projectMetaIcon: {
    fontSize: 14,
  },
  projectMetaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  requirementsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 10,
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 5,
  },
  requirementBullet: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  requirementText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
    lineHeight: 18,
  },
  detailsButton: {
    marginTop: 15,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#5B52FF',
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B52FF',
  },
  criteriaContainer: {
    marginTop: 20,
  },
  criteriaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  criterionItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  criterionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  criterionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  criterionPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EC4899',
  },
  criterionDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
});
