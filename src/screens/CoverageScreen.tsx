import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { DrivingSession } from '../types';
import { getAllSessions } from '../services/database';
import { getBoundingRegion, formatDistance } from '../utils/geo';

// Distinct colors for different sessions
const SESSION_COLORS = [
  '#4A90D9',
  '#E53935',
  '#43A047',
  '#FB8C00',
  '#8E24AA',
  '#00ACC1',
  '#FFB300',
  '#5C6BC0',
  '#D81B60',
  '#00897B',
];

export default function CoverageScreen() {
  const mapRef = useRef<MapView>(null);
  const [sessions, setSessions] = useState<DrivingSession[]>([]);
  const [colorMode, setColorMode] = useState<'single' | 'session'>('single');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const allSessions = await getAllSessions();
        setSessions(allSessions.filter((s) => !s.isActive && s.coordinates.length > 1));
      })();
    }, [])
  );

  const allCoordinates = sessions.flatMap((s) => s.coordinates);
  const totalMiles = sessions.reduce((sum, s) => sum + s.distanceMiles, 0);

  const fitMap = () => {
    if (allCoordinates.length > 0) {
      const region = getBoundingRegion(allCoordinates);
      if (region && mapRef.current) {
        mapRef.current.animateToRegion(region, 500);
      }
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        onMapReady={fitMap}
        showsUserLocation
      >
        {sessions.map((session, index) => {
          const coords = session.coordinates.map((c) => ({
            latitude: c.latitude,
            longitude: c.longitude,
          }));

          if (coords.length < 2) return null;

          const color =
            colorMode === 'single'
              ? '#4A90D9'
              : SESSION_COLORS[index % SESSION_COLORS.length];

          return (
            <Polyline
              key={session.id}
              coordinates={coords}
              strokeColor={color}
              strokeWidth={4}
            />
          );
        })}
      </MapView>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{sessions.length}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatDistance(totalMiles)}</Text>
          <Text style={styles.statLabel}>Total Coverage</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() =>
            setColorMode((prev) => (prev === 'single' ? 'session' : 'single'))
          }
        >
          <Ionicons
            name="color-palette"
            size={22}
            color={colorMode === 'session' ? '#4A90D9' : '#666'}
          />
          <Text
            style={[
              styles.controlText,
              colorMode === 'session' && styles.controlTextActive,
            ]}
          >
            {colorMode === 'session' ? 'By Session' : 'Uniform'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={fitMap}>
          <Ionicons name="expand" size={22} color="#666" />
          <Text style={styles.controlText}>Fit All</Text>
        </TouchableOpacity>
      </View>

      {sessions.length === 0 && (
        <View style={styles.emptyOverlay}>
          <Ionicons name="map-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No coverage data yet</Text>
          <Text style={styles.emptySubtext}>
            Complete driving sessions to see your coverage map
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  statsBar: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: '#aaa',
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#444',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  controlText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  controlTextActive: {
    color: '#4A90D9',
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
