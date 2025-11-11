import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './src/config/supabase';
import { getCurrentUser, getUserProfile, createUserProfile } from './src/services/userService';

import DashboardScreen from './src/screens/DashboardScreen';
import ActivityScreen from './src/screens/ActivityScreen';
import CoursesScreen from './src/screens/CoursesScreen';
import QuizScreen from './src/screens/QuizScreen';

const Tab = createBottomTabNavigator();

function AuthScreen({ onSignIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          await createUserProfile(data.user.id);
          Alert.alert('Succès', 'Compte créé! Vous pouvez maintenant vous connecter.');
          setIsSignUp(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          const profile = await getUserProfile(data.user.id);
          if (!profile) {
            await createUserProfile(data.user.id);
          }
          onSignIn();
        }
      }
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.authContainer}>
      <Text style={styles.authTitle}>
        {isSignUp ? 'Créer un compte' : 'Connexion'}
      </Text>

      <View style={styles.authForm}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="votre@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.authButton, loading && styles.authButtonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.authButtonText}>
              {isSignUp ? 'S\'inscrire' : 'Se connecter'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.switchText}>
            {isSignUp
              ? 'Déjà un compte? Se connecter'
              : 'Pas de compte? S\'inscrire'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size={48} color="#4F46E5" />
      </View>
    );
  }

  if (!session) {
    return <AuthScreen onSignIn={() => setSession(true)} />;
  }

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#4F46E5',
            tabBarInactiveTintColor: '#6B7280',
            tabBarStyle: {
              paddingBottom: 8,
              paddingTop: 8,
              height: 60,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
            },
          }}
        >
          <Tab.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{
              tabBarLabel: 'Tableau de bord',
              tabBarIcon: ({ color, size }) => (
                <Text style={{ fontSize: size, color }}>📊</Text>
              ),
            }}
          />
          <Tab.Screen
            name="Activity"
            component={ActivityScreen}
            options={{
              tabBarLabel: 'Activités',
              tabBarIcon: ({ color, size }) => (
                <Text style={{ fontSize: size, color }}>📅</Text>
              ),
            }}
          />
          <Tab.Screen
            name="Courses"
            component={CoursesScreen}
            options={{
              tabBarLabel: 'Cours',
              tabBarIcon: ({ color, size }) => (
                <Text style={{ fontSize: size, color }}>📚</Text>
              ),
            }}
          />
          <Tab.Screen
            name="Quiz"
            component={QuizScreen}
            options={{
              tabBarLabel: 'Quiz',
              tabBarIcon: ({ color, size }) => (
                <Text style={{ fontSize: size, color }}>🎯</Text>
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  authTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 40,
    textAlign: 'center',
  },
  authForm: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  authButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  authButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  switchText: {
    fontSize: 14,
    color: '#4F46E5',
    textAlign: 'center',
    marginTop: 20,
  },
});
