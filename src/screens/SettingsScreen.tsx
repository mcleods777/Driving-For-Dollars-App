import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { AppSettings, DEFAULT_SETTINGS } from '../types';
import { getSettings, saveSetting, exportLeadsAsCSV, getStats } from '../services/database';
import { formatDistance, formatDuration } from '../utils/geo';

const ROUTE_COLORS = [
  { name: 'Blue', value: '#4A90D9' },
  { name: 'Red', value: '#E53935' },
  { name: 'Green', value: '#43A047' },
  { name: 'Orange', value: '#FB8C00' },
  { name: 'Purple', value: '#8E24AA' },
  { name: 'Cyan', value: '#00ACC1' },
];

const MAP_TYPES = [
  { label: 'Standard', value: 'standard' as const },
  { label: 'Satellite', value: 'satellite' as const },
  { label: 'Hybrid', value: 'hybrid' as const },
];

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState({ totalSessions: 0, totalMiles: 0, totalLeads: 0, totalDrivingTime: 0 });

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [s, st] = await Promise.all([getSettings(), getStats()]);
        setSettings(s);
        setStats(st);
      })();
    }, [])
  );

  const updateSetting = async (key: keyof AppSettings, value: string | number | boolean) => {
    await saveSetting(key, value);
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleExportLeads = async () => {
    try {
      const csv = await exportLeadsAsCSV();
      const exportFile = new File(Paths.cache, 'dfd_leads_export.csv');
      exportFile.create({ overwrite: true });
      exportFile.write(csv);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(exportFile.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Leads',
        });
      } else {
        Alert.alert('Export Complete', 'File saved successfully.');
      }
    } catch (e) {
      Alert.alert('Export Failed', 'Could not export leads. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Stats summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="car" size={24} color="#4A90D9" />
            <Text style={styles.statValue}>{stats.totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="speedometer" size={24} color="#43A047" />
            <Text style={styles.statValue}>
              {formatDistance(stats.totalMiles)}
            </Text>
            <Text style={styles.statLabel}>Driven</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flag" size={24} color="#FF6B6B" />
            <Text style={styles.statValue}>{stats.totalLeads}</Text>
            <Text style={styles.statLabel}>Leads</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#FB8C00" />
            <Text style={styles.statValue}>
              {formatDuration(stats.totalDrivingTime)}
            </Text>
            <Text style={styles.statLabel}>Drive Time</Text>
          </View>
        </View>
      </View>

      {/* Route color */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Route Color</Text>
        <View style={styles.colorRow}>
          {ROUTE_COLORS.map((color) => (
            <TouchableOpacity
              key={color.value}
              style={[
                styles.colorOption,
                { backgroundColor: color.value },
                settings.routeColor === color.value && styles.colorSelected,
              ]}
              onPress={() => updateSetting('routeColor', color.value)}
            >
              {settings.routeColor === color.value && (
                <Ionicons name="checkmark" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Map type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Map Type</Text>
        <View style={styles.optionsRow}>
          {MAP_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.optionButton,
                settings.mapType === type.value && styles.optionButtonActive,
              ]}
              onPress={() => updateSetting('mapType', type.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  settings.mapType === type.value && styles.optionTextActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tracking settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tracking</Text>
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Keep Screen On</Text>
            <Text style={styles.settingDescription}>
              Prevent screen from sleeping while driving
            </Text>
          </View>
          <Switch
            value={settings.keepScreenOn}
            onValueChange={(value) => updateSetting('keepScreenOn', value)}
            trackColor={{ true: '#4A90D9' }}
          />
        </View>
      </View>

      {/* Export */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleExportLeads}>
          <Ionicons name="download-outline" size={22} color="#4A90D9" />
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionLabel}>Export Leads to CSV</Text>
            <Text style={styles.actionDescription}>
              Download all your leads as a spreadsheet
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* App info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Version</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Framework</Text>
          <Text style={styles.aboutValue}>React Native + Expo</Text>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  optionButtonActive: {
    backgroundColor: '#4A90D9',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  optionTextActive: {
    color: '#fff',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  settingDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  actionDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  aboutLabel: {
    fontSize: 14,
    color: '#666',
  },
  aboutValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 40,
  },
});
