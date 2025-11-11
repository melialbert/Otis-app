import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon, Circle, Line, Text as SvgText } from 'react-native-svg';
import { getUserProfile, getCurrentUser } from '../services/userService';
import { getAllUserProgress } from '../services/courseService';
import { UserProfile } from '../types/database';

const { width } = Dimensions.get('window');

export default function ProgressionScreen() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [completedModules, setCompletedModules] = useState(0);
  const [activitiesCompleted, setActivitiesCompleted] = useState(6);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const [profileData, progressData] = await Promise.all([
        getUserProfile(user.id),
        getAllUserProgress(user.id),
      ]);

      setProfile(profileData);
      setCompletedModules(progressData.filter(p => p.progress_percentage === 100).length);
    } catch (error) {
      console.error('Error loading progression:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderRadarChart = () => {
    const skills = [
      { name: 'Photographie', value: 3 },
      { name: 'Technique', value: 2 },
      { name: 'Vidéographie', value: 2 },
      { name: 'Montage', value: 1 },
      { name: 'Créativité', value: 3 },
    ];

    const maxValue = 5;
    const centerX = 140;
    const centerY = 120;
    const radius = 80;
    const angleStep = (2 * Math.PI) / skills.length;

    const getPoint = (value: number, index: number) => {
      const angle = index * angleStep - Math.PI / 2;
      const distance = (value / maxValue) * radius;
      return {
        x: centerX + distance * Math.cos(angle),
        y: centerY + distance * Math.sin(angle),
      };
    };

    const backgroundPoints = Array.from({ length: skills.length }, (_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      return `${centerX + radius * Math.cos(angle)},${centerY + radius * Math.sin(angle)}`;
    }).join(' ');

    const dataPoints = skills.map((skill, i) => {
      const point = getPoint(skill.value, i);
      return `${point.x},${point.y}`;
    }).join(' ');

    return (
      <Svg width={280} height={280} style={styles.radarChart}>
        {[1, 2, 3, 4, 5].map((level) => {
          const levelRadius = (level / maxValue) * radius;
          const points = Array.from({ length: skills.length }, (_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            return `${centerX + levelRadius * Math.cos(angle)},${centerY + levelRadius * Math.sin(angle)}`;
          }).join(' ');
          return (
            <Polygon
              key={level}
              points={points}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          );
        })}

        {skills.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          return (
            <Line
              key={`line-${i}`}
              x1={centerX}
              y1={centerY}
              x2={centerX + radius * Math.cos(angle)}
              y2={centerY + radius * Math.sin(angle)}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          );
        })}

        <Polygon
          points={dataPoints}
          fill="rgba(91, 82, 255, 0.2)"
          stroke="#5B52FF"
          strokeWidth="2"
        />

        {skills.map((skill, i) => {
          const point = getPoint(skill.value, i);
          return (
            <Circle
              key={`point-${i}`}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#5B52FF"
            />
          );
        })}

        {skills.map((skill, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const labelDistance = radius + 25;
          const x = centerX + labelDistance * Math.cos(angle);
          const y = centerY + labelDistance * Math.sin(angle);

          return (
            <SvgText
              key={`label-${i}`}
              x={x}
              y={y}
              fontSize="11"
              fill="#6B7280"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {skill.name}
            </SvgText>
          );
        })}
      </Svg>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size={48} color="#5B52FF" />
      </View>
    );
  }

  const currentLevel = profile?.current_level || 'seedling';
  const totalXP = profile?.total_points || 0;
  const maxXP = 500;
  const progressPercentage = Math.min((totalXP / maxXP) * 100, 100);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#5B52FF', '#7C3AED']} style={styles.header}>
        <Text style={styles.headerTitle}>Ma Progression</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <LinearGradient
          colors={['#5B52FF', '#7C3AED']}
          style={styles.levelCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.levelLabel}>NIVEAU ACTUEL</Text>
          <Text style={styles.levelNumber}>1</Text>
          <Text style={styles.xpText}>{totalXP} / {maxXP} XP</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statValue}>{activitiesCompleted}</Text>
            <Text style={styles.statLabel}>Activités complétées</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statValue}>{totalXP}</Text>
            <Text style={styles.statLabel}>XP gagnés</Text>
          </View>
        </View>

        <View style={styles.competencesCard}>
          <Text style={styles.sectionTitle}>📊 Compétences</Text>
          <View style={styles.chartContainer}>
            {renderRadarChart()}
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  levelCard: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  levelLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
    letterSpacing: 1,
    marginBottom: 10,
  },
  levelNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  xpText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#5B52FF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  competencesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarChart: {
    marginVertical: 10,
  },
});
