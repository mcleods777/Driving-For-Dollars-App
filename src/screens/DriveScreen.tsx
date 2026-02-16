import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import {
  startSession,
  stopSession,
  getCurrentSession,
  onSessionUpdate,
  onLocationUpdate,
  resumeActiveSession,
  getCurrentLocation,
} from '../services/locationTracking';
import { DrivingSession, Coordinate, PropertyLead } from '../types';
import { formatDistance, formatDuration, generateId } from '../utils/geo';
import { createLead, getAllLeads } from '../services/database';
import FlagPropertyModal from '../components/FlagPropertyModal';
import { Colors, darkMapStyle } from '../theme';

export default function DriveScreen() {
  const mapRef = useRef<MapView>(null);
  const [session, setSession] = useState<DrivingSession | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [leads, setLeads] = useState<PropertyLead[]>([]);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [followUser, setFollowUser] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize
  useEffect(() => {
    (async () => {
      const loc = await getCurrentLocation();
      if (loc) setCurrentLocation(loc);

      const existingSession = await resumeActiveSession();
      if (existingSession) {
        setSession(existingSession);
      }

      const allLeads = await getAllLeads();
      setLeads(allLeads);
    })();
  }, []);

  // Subscribe to session updates
  useEffect(() => {
    const unsubSession = onSessionUpdate((updatedSession) => {
      setSession({ ...updatedSession });
    });

    const unsubLocation = onLocationUpdate((coords) => {
      if (coords.length > 0) {
        const latest = coords[coords.length - 1];
        setCurrentLocation(latest);
        if (followUser && mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude: latest.latitude,
              longitude: latest.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            },
            500
          );
        }
      }
    });

    return () => {
      unsubSession();
      unsubLocation();
    };
  }, [followUser]);

  // Timer for elapsed time
  useEffect(() => {
    if (session?.isActive) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - session.startTime);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedTime(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session?.isActive, session?.startTime]);

  const handleStartDriving = async () => {
    const newSession = await startSession();
    if (!newSession) {
      Alert.alert(
        'Permission Required',
        'Location permission is needed to track your driving. Please enable it in your device settings.'
      );
    }
  };

  const handleStopDriving = () => {
    Alert.alert('Stop Driving?', 'Are you sure you want to end this session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Stop',
        style: 'destructive',
        onPress: async () => {
          await stopSession();
          setSession(null);
        },
      },
    ]);
  };

  const handleFlagProperty = () => {
    if (!currentLocation) {
      Alert.alert('Location Unknown', 'Cannot flag property without a current location.');
      return;
    }
    setShowFlagModal(true);
  };

  const handleSaveLead = async (lead: Omit<PropertyLead, 'id' | 'createdAt' | 'latitude' | 'longitude' | 'sessionId'>) => {
    if (!currentLocation) return;

    const newLead: PropertyLead = {
      id: generateId(),
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      createdAt: Date.now(),
      sessionId: session?.id || null,
      ...lead,
    };

    await createLead(newLead);
    setLeads((prev) => [newLead, ...prev]);
    setShowFlagModal(false);
  };

  const initialRegion: Region = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }
    : {
        latitude: 39.8283,
        longitude: -98.5795,
        latitudeDelta: 30,
        longitudeDelta: 30,
      };

  const routeCoords = session?.coordinates.map((c) => ({
    latitude: c.latitude,
    longitude: c.longitude,
  })) || [];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        onPanDrag={() => setFollowUser(false)}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={darkMapStyle}
      >
        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={Colors.primary}
            strokeWidth={5}
          />
        )}

        {leads.map((lead) => (
          <Marker
            key={lead.id}
            coordinate={{ latitude: lead.latitude, longitude: lead.longitude }}
            title={lead.address || 'Flagged Property'}
            description={lead.notes || undefined}
            pinColor={Colors.flagRed}
          />
        ))}
      </MapView>

      {/* Stats overlay */}
      {session?.isActive && (
        <View style={styles.statsOverlay}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>
              {formatDistance(session.distanceMiles)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statValue}>{formatDuration(elapsedTime)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Leads</Text>
            <Text style={styles.statValue}>
              {leads.filter((l) => l.sessionId === session.id).length}
            </Text>
          </View>
        </View>
      )}

      {/* Control buttons */}
      <View style={styles.controls}>
        {!followUser && (
          <TouchableOpacity
            style={styles.recenterButton}
            onPress={() => {
              setFollowUser(true);
              if (currentLocation && mapRef.current) {
                mapRef.current.animateToRegion(
                  {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  },
                  500
                );
              }
            }}
          >
            <Ionicons name="locate" size={24} color="#fff" />
          </TouchableOpacity>
        )}

        {session?.isActive && (
          <TouchableOpacity
            style={styles.flagButton}
            onPress={handleFlagProperty}
          >
            <Ionicons name="flag" size={28} color="#fff" />
            <Text style={styles.flagButtonText}>Flag Property</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.mainButton,
            session?.isActive ? styles.stopButton : styles.startButton,
          ]}
          onPress={session?.isActive ? handleStopDriving : handleStartDriving}
        >
          <Ionicons
            name={session?.isActive ? 'stop-circle' : 'navigate'}
            size={28}
            color="#fff"
          />
          <Text style={styles.mainButtonText}>
            {session?.isActive ? 'Stop Driving' : 'Start Driving'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlagPropertyModal
        visible={showFlagModal}
        onClose={() => setShowFlagModal(false)}
        onSave={handleSaveLead}
      />
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
  statsOverlay: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: Colors.overlayBg,
    borderRadius: 12,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.borderLight,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    alignItems: 'center',
    gap: 12,
  },
  recenterButton: {
    backgroundColor: Colors.overlayBg,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  flagButton: {
    backgroundColor: Colors.flagRed,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    gap: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  flagButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    gap: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  startButton: {
    backgroundColor: Colors.primary,
  },
  stopButton: {
    backgroundColor: Colors.danger,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
