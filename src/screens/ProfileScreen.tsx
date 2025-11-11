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
import { getUserProfile, getCurrentUser } from '../services/userService';
import { getAllUserProgress } from '../services/courseService';
import { UserProfile } from '../types/database';
import { LEVEL_THRESHOLDS } from '../utils/points';
import { supabase } from '../config/supabase';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState('');
  const [totalModules, setTotalModules] = useState(0);
  const [totalBadges, setTotalBadges] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser?.email) {
        setEmail(authUser.email);
      }

      const [profileData, progressData] = await Promise.all([
        getUserProfile(user.id),
        getAllUserProgress(user.id),
      ]);

      setProfile(profileData);
      setTotalModules(progressData.filter(p => p.progress_percentage === 100).length);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size={48} color="#5B52FF" />
      </View>
    );
  }

  const levelInfo = LEVEL_THRESHOLDS[profile?.current_level || 'seedling'];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#5B52FF', '#7C3AED']} style={styles.header}>
        <Text style={styles.headerTitle}>Mon Profil</Text>

        <View style={styles.levelCircle}>
          <Text style={styles.levelNumber}>{profile?.current_level === 'seedling' ? '1' : '2'}</Text>
        </View>

        <Text style={styles.userName}>Utilisateur OTIS</Text>
        <Text style={styles.userEmail}>{email}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.total_points || 0}</Text>
            <Text style={styles.statLabel}>XP Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalBadges}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalModules}</Text>
            <Text style={styles.statLabel}>Modules</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMPTE</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>👤</Text>
            </View>
            <Text style={styles.menuText}>Modifier le profil</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>✉️</Text>
            </View>
            <Text style={styles.menuText}>Changer l'email</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>🔒</Text>
            </View>
            <Text style={styles.menuText}>Mot de passe</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRÉFÉRENCES</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>🔔</Text>
            </View>
            <Text style={styles.menuText}>Notifications</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>🌐</Text>
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Langue</Text>
              <Text style={styles.menuValue}>Français</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>🌙</Text>
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Thème</Text>
              <Text style={styles.menuValue}>Clair</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>❓</Text>
            </View>
            <Text style={styles.menuText}>Aide & FAQ</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>💬</Text>
            </View>
            <Text style={styles.menuText}>Contactez-nous</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>📄</Text>
            </View>
            <Text style={styles.menuText}>Conditions d'utilisation</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  levelCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 25,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIcon: {
    fontSize: 24,
  },
  menuTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  menuValue: {
    fontSize: 14,
    color: '#5B52FF',
    marginRight: 8,
  },
  menuArrow: {
    fontSize: 24,
    color: '#D1D5DB',
    fontWeight: '300',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 15,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
