import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCourses, getCourseContent, getUserCourseProgress, startCourse, updateCourseProgress, getAllUserProgress } from '../services/courseService';
import { getCurrentUser } from '../services/userService';
import { Course, CourseContent, UserCourseProgress } from '../types/database';

export default function CoursesScreen() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userProgress, setUserProgress] = useState<Map<string, UserCourseProgress>>(new Map());
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseContent, setCourseContent] = useState<CourseContent[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
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
      setSelectedCourse(course);
      const content = await getCourseContent(course.id);
      setCourseContent(content);
      setModalVisible(true);

      const user = await getCurrentUser();
      if (!user) return;

      if (!userProgress.has(course.id)) {
        await startCourse(user.id, course.id);
        loadCourses();
      }
    } catch (error) {
      console.error('Error opening course:', error);
    }
  };

  const completeCourse = async () => {
    try {
      const user = await getCurrentUser();
      if (!user || !selectedCourse) return;

      await updateCourseProgress(user.id, selectedCourse.id, 100);
      setModalVisible(false);
      loadCourses();
    } catch (error) {
      console.error('Error completing course:', error);
    }
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
                <View style={styles.courseHeader}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.icon}>{getCourseIcon(index)}</Text>
                  </View>
                  <View style={styles.difficultyBadge}>
                    <Text style={styles.difficultyText}>{getDifficultyLabel(course.difficulty)}</Text>
                  </View>
                </View>

                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseDescription} numberOfLines={2}>
                  {course.description}
                </Text>

                <View style={styles.courseFooter}>
                  <View style={styles.courseInfo}>
                    <Text style={styles.infoIcon}>⏱</Text>
                    <Text style={styles.infoText}>{course.estimated_duration_minutes} min</Text>
                  </View>
                  <View style={styles.courseInfo}>
                    <Text style={styles.infoIcon}>⭐</Text>
                    <Text style={styles.infoText}>{course.points_reward} XP</Text>
                  </View>
                </View>

                {progress && progress.progress_percentage > 0 && (
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${progress.progress_percentage}%` }]} />
                  </View>
                )}

                {isCompleted && (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedText}>✓ Terminé</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={selectedCourse ? getCourseGradient(courses.indexOf(selectedCourse)) : ['#5B52FF', '#7C3AED']}
            style={styles.modalHeader}
          >
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>←</Text>
            </TouchableOpacity>
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalIconContainer}>
                <Text style={styles.modalIcon}>
                  {selectedCourse ? getCourseIcon(courses.indexOf(selectedCourse)) : '📚'}
                </Text>
              </View>
              <Text style={styles.modalTitle}>{selectedCourse?.title}</Text>
              <Text style={styles.modalSubtitle}>{selectedCourse?.description}</Text>

              <View style={styles.modalStats}>
                <View style={styles.modalStat}>
                  <Text style={styles.modalStatIcon}>⏱</Text>
                  <Text style={styles.modalStatText}>{selectedCourse?.estimated_duration_minutes} min</Text>
                </View>
                <View style={styles.modalStat}>
                  <Text style={styles.modalStatIcon}>⭐</Text>
                  <Text style={styles.modalStatText}>{selectedCourse?.points_reward} XP</Text>
                </View>
                <View style={styles.modalStat}>
                  <Text style={styles.modalStatIcon}>📊</Text>
                  <Text style={styles.modalStatText}>
                    {selectedCourse ? getDifficultyLabel(selectedCourse.difficulty) : ''}
                  </Text>
                </View>
              </View>

              {userProgress.get(selectedCourse?.id || '') && (
                <View style={styles.modalProgressContainer}>
                  <Text style={styles.modalProgressText}>
                    {userProgress.get(selectedCourse?.id || '')?.progress_percentage}% terminé
                  </Text>
                  <View style={styles.modalProgressBar}>
                    <View
                      style={[
                        styles.modalProgressFill,
                        { width: `${userProgress.get(selectedCourse?.id || '')?.progress_percentage || 0}%` }
                      ]}
                    />
                  </View>
                </View>
              )}
            </View>
          </LinearGradient>

          <ScrollView style={styles.modalContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📚 Contenu du module</Text>
              {courseContent && courseContent.map((content, index) => (
                <View key={content.id} style={styles.contentBlock}>
                  <View style={styles.contentNumber}>
                    <Text style={styles.contentNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.contentInfo}>
                    <Text style={styles.contentTitle}>{content.title}</Text>
                    <Text style={styles.contentText} numberOfLines={2}>{content.content}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.completeButton} onPress={completeCourse}>
              <Text style={styles.completeButtonText}>▶ Continuer le module</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
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
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 28,
  },
  difficultyBadge: {
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
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginTop: 15,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  completedBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  modalHeader: {
    paddingTop: 60,
    paddingBottom: 30,
  },
  closeButton: {
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  closeButtonText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalHeaderContent: {
    paddingHorizontal: 20,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalIcon: {
    fontSize: 40,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 22,
    marginBottom: 20,
  },
  modalStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  modalStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  modalStatIcon: {
    fontSize: 16,
  },
  modalStatText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalProgressContainer: {
    marginTop: 10,
  },
  modalProgressText: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  modalProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  modalProgressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  modalContent: {
    flex: 1,
    paddingTop: 10,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  contentBlock: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contentNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5B52FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  contentText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  completeButton: {
    backgroundColor: '#5B52FF',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 20,
    shadowColor: '#5B52FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
