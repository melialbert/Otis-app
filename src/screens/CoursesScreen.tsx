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
import { getCourses, startCourse, getAllUserProgress } from '../services/courseService';
import { getCurrentUser } from '../services/userService';
import { Course, UserCourseProgress } from '../types/database';
import CourseDetailScreen from './CourseDetailScreen';

export default function CoursesScreen() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userProgress, setUserProgress] = useState<Map<string, UserCourseProgress>>(new Map());
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const [coursesData, progressData] = await Promise.all([
        getCourses(),
        getAllUserProgress(user.id),
      ]);

      setCourses(coursesData);

      const progressMap = new Map();
      progressData.forEach((p: UserCourseProgress) => {
        progressMap.set(p.course_id, p);
      });
      setUserProgress(progressMap);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCourse = async (course: Course) => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      if (!userProgress.has(course.id)) {
        await startCourse(user.id, course.id);
        await loadCourses();
      }

      setSelectedCourse(course);
    } catch (error) {
      console.error('Error opening course:', error);
    }
  };

  const closeCourse = () => {
    setSelectedCourse(null);
  };

  const getCourseGradient = (index: number) => {
    const gradients = [
      ['#EC4899', '#DB2777'],
      ['#8B5CF6', '#7C3AED'],
      ['#06B6D4', '#0891B2'],
      ['#F59E0B', '#D97706'],
      ['#10B981', '#059669'],
    ];
    return gradients[index % gradients.length];
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'Débutant';
      case 'intermediate':
        return 'Intermédiaire';
      case 'advanced':
        return 'Avancé';
      default:
        return difficulty;
    }
  };

  const getCourseIcon = (index: number) => {
    const icons = ['📷', '🎬', '✂️', '🎨', '📹'];
    return icons[index % icons.length];
  };

  const getFilteredCourses = () => {
    if (!courses || courses.length === 0) return [];
    if (activeFilter === 'all') return courses;
    return courses.filter(c => c.difficulty === activeFilter);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size={48} color="#5B52FF" />
      </View>
    );
  }

  const filteredCourses = getFilteredCourses();

  if (selectedCourse) {
    return <CourseDetailScreen course={selectedCourse} onBack={closeCourse} />;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#5B52FF', '#7C3AED']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Modules de Formation</Text>
        <Text style={styles.headerSubtitle}>
          Explore nos modules de formation créative et développe{'\n'}tes compétences en photographie, vidéo et montage.
        </Text>
      </LinearGradient>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>
              Tous
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'beginner' && styles.filterButtonActive]}
            onPress={() => setActiveFilter('beginner')}
          >
            <Text style={[styles.filterText, activeFilter === 'beginner' && styles.filterTextActive]}>
              Débutant
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'intermediate' && styles.filterButtonActive]}
            onPress={() => setActiveFilter('intermediate')}
          >
            <Text style={[styles.filterText, activeFilter === 'intermediate' && styles.filterTextActive]}>
              Intermédiaire
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'advanced' && styles.filterButtonActive]}
            onPress={() => setActiveFilter('advanced')}
          >
            <Text style={[styles.filterText, activeFilter === 'advanced' && styles.filterTextActive]}>
              Avancé
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        {filteredCourses.map((course, index) => {
          const progress = userProgress.get(course.id);
          const isCompleted = progress?.progress_percentage === 100;
          const gradient = getCourseGradient(index);

          const badges = [
            { icon: '🏆', text: 'CEI d\'Aigle' },
            { icon: '🎬', text: 'Réalisateur Émergent' },
            { icon: '✂️', text: 'Monteur Virtuose' },
          ];

          return (
            <TouchableOpacity
              key={course.id}
              onPress={() => openCourse(course)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={gradient}
                style={styles.courseCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyText}>{getDifficultyLabel(course.difficulty)}</Text>
                </View>

                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>{getCourseIcon(index)}</Text>
                </View>

                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseDescription} numberOfLines={3}>
                  {course.description}
                </Text>

                <View style={styles.courseFooter}>
                  <View style={styles.courseInfo}>
                    <Text style={styles.infoIcon}>⏱</Text>
                    <Text style={styles.infoText}>4 semaines</Text>
                  </View>
                  <View style={styles.courseInfo}>
                    <Text style={styles.infoIcon}>⭐</Text>
                    <Text style={styles.infoText}>{course.points_reward} XP</Text>
                  </View>
                </View>

                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeIcon}>{badges[index % badges.length].icon}</Text>
                  <Text style={styles.badgeText}>{badges[index % badges.length].text}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}

        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>📊 Statistiques globales</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{courses.length}</Text>
              <Text style={styles.statLabel}>Modules{`\n`}disponibles</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>3500</Text>
              <Text style={styles.statLabel}>XP total{`\n`}possible</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Semaines de{`\n`}contenu</Text>
            </View>
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
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 20,
  },
  filterContainer: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#5B52FF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  courseCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    position: 'relative',
  },
  difficultyBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  icon: {
    fontSize: 32,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 15,
    lineHeight: 20,
  },
  courseFooter: {
    flexDirection: 'row',
    gap: 15,
  },
  courseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginTop: 15,
    alignSelf: 'flex-start',
  },
  badgeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#5B52FF',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
});
