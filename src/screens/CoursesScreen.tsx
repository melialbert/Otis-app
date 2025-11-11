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
import { getCourses, getCourseContent, getUserCourseProgress, startCourse, updateCourseProgress, getAllUserProgress } from '../services/courseService';
import { getCurrentUser } from '../services/userService';
import { Course, CourseContent, UserCourseProgress } from '../types/database';
import { supabase } from '../config/supabase';

export default function CoursesScreen() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userProgress, setUserProgress] = useState<Map<string, UserCourseProgress>>(new Map());
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseContent, setCourseContent] = useState<CourseContent[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '#10B981';
      case 'intermediate':
        return '#F59E0B';
      case 'advanced':
        return '#EF4444';
      default:
        return '#6B7280';
    }
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cours & Formation</Text>
        <Text style={styles.headerSubtitle}>Développez vos compétences audiovisuelles</Text>
      </View>

      <ScrollView style={styles.content}>
        {courses.map((course) => {
          const progress = userProgress.get(course.id);
          const isStarted = !!progress;
          const isCompleted = progress?.progress_percentage === 100;

          return (
            <TouchableOpacity
              key={course.id}
              style={styles.courseCard}
              onPress={() => openCourse(course)}
            >
              <View style={styles.courseHeader}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                {isCompleted && <Text style={styles.completedBadge}>✓</Text>}
              </View>
              <Text style={styles.courseDescription}>{course.description}</Text>

              <View style={styles.courseFooter}>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(course.difficulty) }]}>
                  <Text style={styles.difficultyText}>{getDifficultyLabel(course.difficulty)}</Text>
                </View>
                <Text style={styles.courseDuration}>{course.estimated_duration_minutes} min</Text>
                <Text style={styles.coursePoints}>+{course.points_reward} pts</Text>
              </View>

              {isStarted && progress && progress.progress_percentage < 100 && (
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { width: `${progress.progress_percentage}%` }]} />
                </View>
              )}
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
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedCourse?.title}</Text>
          </View>

          <ScrollView style={styles.modalContent}>
            {courseContent.map((content, index) => (
              <View key={content.id} style={styles.contentBlock}>
                <Text style={styles.contentTitle}>
                  {index + 1}. {content.title}
                </Text>
                <Text style={styles.contentText}>{content.content}</Text>
              </View>
            ))}

            <TouchableOpacity style={styles.completeButton} onPress={completeCourse}>
              <Text style={styles.completeButtonText}>Terminer le cours</Text>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#4F46E5',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E0E7FF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  completedBadge: {
    fontSize: 24,
    color: '#10B981',
  },
  courseDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 15,
    lineHeight: 20,
  },
  courseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  difficultyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  courseDuration: {
    fontSize: 14,
    color: '#6B7280',
  },
  coursePoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    marginLeft: 'auto',
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginTop: 15,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4F46E5',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    fontSize: 28,
    color: '#FFFFFF',
    marginRight: 15,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  contentBlock: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  contentText: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  completeButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 20,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
