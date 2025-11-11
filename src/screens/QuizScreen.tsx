import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { getQuizzes, getQuizQuestions, submitQuizAttempt, getBestQuizAttempt } from '../services/quizService';
import { getCurrentUser } from '../services/userService';
import { Quiz, QuizQuestion, UserQuizAttempt } from '../types/database';

export default function QuizScreen() {
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<UserQuizAttempt | null>(null);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      const quizzesData = await getQuizzes();
      setQuizzes(quizzesData);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (quiz: Quiz) => {
    try {
      setSelectedQuiz(quiz);
      const questionsData = await getQuizQuestions(quiz.id);
      setQuestions(questionsData);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setQuizStartTime(new Date());
      setShowResults(false);
      setModalVisible(true);
    } catch (error) {
      console.error('Error starting quiz:', error);
      Alert.alert('Erreur', 'Impossible de charger le quiz');
    }
  };

  const selectAnswer = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitQuiz = async () => {
    try {
      if (Object.keys(answers).length < questions.length) {
        Alert.alert('Attention', 'Veuillez répondre à toutes les questions');
        return;
      }

      const user = await getCurrentUser();
      if (!user || !selectedQuiz || !quizStartTime) return;

      const timeTaken = Math.round((new Date().getTime() - quizStartTime.getTime()) / 60000);

      const attempt = await submitQuizAttempt(user.id, selectedQuiz.id, answers, timeTaken);
      setResult(attempt);
      setShowResults(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      Alert.alert('Erreur', 'Impossible de soumettre le quiz');
    }
  };

  const closeQuiz = () => {
    setModalVisible(false);
    setSelectedQuiz(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setQuizStartTime(null);
    setShowResults(false);
    setResult(null);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size={48} color="#4F46E5" />
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quiz</Text>
        <Text style={styles.headerSubtitle}>Testez vos connaissances</Text>
      </View>

      <ScrollView style={styles.content}>
        {quizzes && quizzes.map((quiz) => (
          <TouchableOpacity
            key={quiz.id}
            style={styles.quizCard}
            onPress={() => startQuiz(quiz)}
          >
            <View style={styles.quizHeader}>
              <Text style={styles.quizTitle}>{quiz.title}</Text>
              <Text style={styles.quizPoints}>+{quiz.points_reward} pts</Text>
            </View>
            <Text style={styles.quizDescription}>{quiz.description}</Text>
            <View style={styles.quizFooter}>
              <Text style={styles.quizInfo}>⏱ {quiz.time_limit_minutes} min</Text>
              <Text style={styles.quizInfo}>✓ {quiz.passing_score}% requis</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={closeQuiz}
      >
        <View style={styles.modalContainer}>
          {!showResults ? (
            <>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeQuiz}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{selectedQuiz?.title}</Text>
              </View>

              {currentQuestion && (
                <View style={styles.quizContent}>
                  <View style={styles.progressIndicator}>
                    <Text style={styles.progressText}>
                      Question {currentQuestionIndex + 1} / {questions.length}
                    </Text>
                    <View style={styles.progressBarContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` },
                        ]}
                      />
                    </View>
                  </View>

                  <ScrollView style={styles.questionContainer}>
                    <Text style={styles.questionText}>{currentQuestion?.question_text}</Text>

                    <View style={styles.optionsContainer}>
                      {currentQuestion?.options?.map((option, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.optionButton,
                            answers[currentQuestion.id] === option && styles.optionSelected,
                          ]}
                          onPress={() => selectAnswer(currentQuestion.id, option)}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              answers[currentQuestion.id] === option && styles.optionTextSelected,
                            ]}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  <View style={styles.navigationButtons}>
                    <TouchableOpacity
                      style={[styles.navButton, currentQuestionIndex === 0 && styles.navButtonDisabled]}
                      onPress={previousQuestion}
                      disabled={currentQuestionIndex === 0}
                    >
                      <Text style={styles.navButtonText}>← Précédent</Text>
                    </TouchableOpacity>

                    {currentQuestionIndex < questions.length - 1 ? (
                      <TouchableOpacity style={styles.navButton} onPress={nextQuestion}>
                        <Text style={styles.navButtonText}>Suivant →</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.submitButton} onPress={submitQuiz}>
                        <Text style={styles.submitButtonText}>Terminer</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </>
          ) : (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>
                {result?.passed ? '🎉 Félicitations!' : '😕 Pas encore...'}
              </Text>
              <Text style={styles.resultsScore}>
                Score: {result?.score} / {result?.max_score}
              </Text>
              <Text style={styles.resultsPercentage}>
                {result ? Math.round((result.score / result.max_score) * 100) : 0}%
              </Text>

              {result?.passed ? (
                <Text style={styles.resultsMessage}>
                  Vous avez réussi le quiz et gagné {selectedQuiz?.points_reward} points!
                </Text>
              ) : (
                <Text style={styles.resultsMessage}>
                  Score minimum requis: {selectedQuiz?.passing_score}%. Réessayez!
                </Text>
              )}

              <TouchableOpacity style={styles.closeResultsButton} onPress={closeQuiz}>
                <Text style={styles.closeResultsButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          )}
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
    backgroundColor: '#7C3AED',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E9D5FF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  quizCard: {
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
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  quizPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  quizDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 15,
    lineHeight: 20,
  },
  quizFooter: {
    flexDirection: 'row',
    gap: 15,
  },
  quizInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#7C3AED',
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
  quizContent: {
    flex: 1,
  },
  progressIndicator: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#7C3AED',
  },
  questionContainer: {
    flex: 1,
    padding: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 30,
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 15,
  },
  optionButton: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F3E8FF',
  },
  optionText: {
    fontSize: 16,
    color: '#4B5563',
  },
  optionTextSelected: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 15,
  },
  navButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#10B981',
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  resultsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  resultsScore: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
  },
  resultsPercentage: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 30,
  },
  resultsMessage: {
    fontSize: 18,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
  closeResultsButton: {
    paddingVertical: 16,
    paddingHorizontal: 60,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
  },
  closeResultsButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
