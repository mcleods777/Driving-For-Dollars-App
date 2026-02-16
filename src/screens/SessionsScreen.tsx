import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrivingSession } from '../types';
import { getAllSessions, deleteSession, getStats } from '../services/database';
import { formatDistance, formatDuration, formatDateTime } from '../utils/geo';
import { Colors } from '../theme';

type RootStackParamList = {
  SessionDetail: { sessionId: string };
};

export default function SessionsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [sessions, setSessions] = useState<DrivingSession[]>([]);
  const [stats, setStats] = useState({ totalSessions: 0, totalMiles: 0, totalLeads: 0, totalDrivingTime: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [allSessions, allStats] = await Promise.all([
      getAllSessions(),
      getStats(),
    ]);
    setSessions(allSessions.filter((s) => !s.isActive));
    setStats(allStats);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDeleteSession = (session: DrivingSession) => {
    Alert.alert(
      'Delete Session?',
      `Delete the session from ${formatDateTime(session.startTime)}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteSession(session.id);
            await loadData();
          },
        },
      ]
    );
  };

  const renderSession = ({ item }: { item: DrivingSession }) => {
    const duration = item.endTime ? item.endTime - item.startTime : 0;

    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}
      >
        <View style={styles.sessionHeader}>
          <View style={styles.sessionDate}>
            <Ionicons name="car" size={20} color={Colors.primary} />
            <Text style={styles.sessionDateText}>
              {formatDateTime(item.startTime)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteSession(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.textSubtle} />
          </TouchableOpacity>
        </View>
        <View style={styles.sessionStats}>
          <View style={styles.sessionStat}>
            <Text style={styles.sessionStatValue}>
              {formatDistance(item.distanceMiles)}
            </Text>
            <Text style={styles.sessionStatLabel}>Distance</Text>
          </View>
          <View style={styles.sessionStat}>
            <Text style={styles.sessionStatValue}>
              {formatDuration(duration)}
            </Text>
            <Text style={styles.sessionStatLabel}>Duration</Text>
          </View>
          <View style={styles.sessionStat}>
            <Text style={styles.sessionStatValue}>
              {item.coordinates.length}
            </Text>
            <Text style={styles.sessionStatLabel}>Points</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Summary stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{stats.totalSessions}</Text>
          <Text style={styles.summaryLabel}>Sessions</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {formatDistance(stats.totalMiles)}
          </Text>
          <Text style={styles.summaryLabel}>Total Driven</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{stats.totalLeads}</Text>
          <Text style={styles.summaryLabel}>Leads</Text>
        </View>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={renderSession}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.textMuted}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color={Colors.textSubtle} />
            <Text style={styles.emptyText}>No driving sessions yet</Text>
            <Text style={styles.emptySubtext}>
              Start a driving session to see your history here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sessionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionDateText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sessionStat: {
    alignItems: 'center',
  },
  sessionStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sessionStatLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSubtle,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSubtle,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
