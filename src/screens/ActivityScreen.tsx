import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { getCurrentUser } from '../services/userService';
import { createOrUpdateActivity, getActivityByDate } from '../services/activityService';
import { DailyActivity } from '../types/database';

export default function ActivityScreen() {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [photosCount, setPhotosCount] = useState('0');
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [editingCompleted, setEditingCompleted] = useState(false);
  const [editingTime, setEditingTime] = useState('0');
  const [comments, setComments] = useState('');
  const [currentActivity, setCurrentActivity] = useState<DailyActivity | null>(null);

  useEffect(() => {
    loadActivityForDate(selectedDate);
  }, [selectedDate]);

  const loadActivityForDate = async (date: string) => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const activity = await getActivityByDate(user.id, date);
      if (activity) {
        setCurrentActivity(activity);
        setPhotosCount(activity.photos_count.toString());
        setVideoCompleted(activity.video_completed);
        setEditingCompleted(activity.editing_completed);
        setEditingTime(activity.editing_time_minutes.toString());
        setComments(activity.comments);
      } else {
        resetForm();
      }
    } catch (error) {
      console.error('Error loading activity:', error);
    }
  };

  const resetForm = () => {
    setCurrentActivity(null);
    setPhotosCount('0');
    setVideoCompleted(false);
    setEditingCompleted(false);
    setEditingTime('0');
    setComments('');
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Erreur', 'Utilisateur non connecté');
        return;
      }

      const photosNum = parseInt(photosCount) || 0;
      const editingTimeNum = parseInt(editingTime) || 0;

      const activity = await createOrUpdateActivity(user.id, {
        activity_date: selectedDate,
        photos_count: photosNum,
        video_completed: videoCompleted,
        editing_completed: editingCompleted,
        editing_time_minutes: editingTimeNum,
        comments: comments,
      });

      setCurrentActivity(activity);
      Alert.alert(
        'Succès',
        `Activité enregistrée ! +${activity.points_earned} points${
          activity.is_complete ? ' (Jour complet!)' : ''
        }`
      );
    } catch (error) {
      console.error('Error saving activity:', error);
      Alert.alert('Erreur', "Impossible d'enregistrer l'activité");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendrier & Suivi</Text>
      </View>

      <View style={styles.calendarContainer}>
        <Calendar
          current={selectedDate}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={{
            [selectedDate]: {
              selected: true,
              selectedColor: '#4F46E5',
            },
          }}
          theme={{
            todayTextColor: '#4F46E5',
            arrowColor: '#4F46E5',
            monthTextColor: '#1F2937',
            textMonthFontWeight: 'bold',
          }}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.dateTitle}>
          {new Date(selectedDate).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📸 Photos quotidiennes</Text>
          <Text style={styles.cardSubtitle}>Objectif: 3 photos</Text>
          <View style={styles.counterContainer}>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setPhotosCount((Math.max(0, parseInt(photosCount) - 1 || 0)).toString())}
            >
              <Text style={styles.counterButtonText}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.counterInput}
              value={photosCount}
              onChangeText={setPhotosCount}
              keyboardType="number-pad"
            />
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setPhotosCount(((parseInt(photosCount) || 0) + 1).toString())}
            >
              <Text style={styles.counterButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎬 Vidéo réalisée</Text>
          <TouchableOpacity
            style={[styles.checkbox, videoCompleted && styles.checkboxChecked]}
            onPress={() => setVideoCompleted(!videoCompleted)}
          >
            <Text style={styles.checkboxText}>
              {videoCompleted ? '✓ Complétée' : 'Non complétée'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>✂️ Montage post-production</Text>
          <TouchableOpacity
            style={[styles.checkbox, editingCompleted && styles.checkboxChecked]}
            onPress={() => setEditingCompleted(!editingCompleted)}
          >
            <Text style={styles.checkboxText}>
              {editingCompleted ? '✓ Terminé' : 'Non terminé'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.inputLabel}>Temps de montage (minutes)</Text>
          <TextInput
            style={styles.input}
            value={editingTime}
            onChangeText={setEditingTime}
            keyboardType="number-pad"
            placeholder="0"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>💬 Commentaires</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={comments}
            onChangeText={setComments}
            placeholder="Notes, réflexions, progrès..."
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          )}
        </TouchableOpacity>

        {currentActivity && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Résumé</Text>
            <Text style={styles.summaryText}>
              Points gagnés: {currentActivity.points_earned}
            </Text>
            {currentActivity.is_complete && (
              <Text style={styles.completeText}>🎉 Jour complet!</Text>
            )}
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
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    padding: 20,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
    textTransform: 'capitalize',
  },
  card: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 15,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButton: {
    width: 50,
    height: 50,
    backgroundColor: '#4F46E5',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  counterInput: {
    width: 80,
    height: 50,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 15,
    color: '#1F2937',
  },
  checkbox: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkboxText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  inputLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: '#EFF6FF',
    padding: 20,
    borderRadius: 15,
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 5,
  },
  completeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 5,
  },
});
