import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE, Region, MapPressEvent } from 'react-native-maps';
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

interface SelectedLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export default function DriveScreen() {
  const mapRef = useRef<MapView>(null);
  const [session, setSession] = useState<DrivingSession | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [leads, setLeads] = useState<PropertyLead[]>([]);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [followUser, setFollowUser] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
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
              latitudeDelta: 0.002,
              longitudeDelta: 0.002,
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

  const handleMapPress = async (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setFollowUser(false);
    setIsGeocoding(true);
    setSelectedLocation({ latitude, longitude, address: '' });

    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results.length > 0) {
        const place = results[0];
        const parts: string[] = [];
        if (place.streetNumber) parts.push(place.streetNumber);
        if (place.street) parts.push(place.street);
        const streetLine = parts.join(' ');
        const cityLine = [place.city, place.region, place.postalCode].filter(Boolean).join(', ');
        const fullAddress = [streetLine, cityLine].filter(Boolean).join(', ');
        setSelectedLocation({ latitude, longitude, address: fullAddress });
      } else {
        setSelectedLocation({ latitude, longitude, address: '' });
      }
    } catch {
      setSelectedLocation({ latitude, longitude, address: '' });
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleFlagSelected = () => {
    setShowFlagModal(true);
  };

  const handleFlagProperty = () => {
    if (!currentLocation) {
      Alert.alert('Location Unknown', 'Cannot flag property without a current location.');
      return;
    }
    setSelectedLocation({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      address: '',
    });
    setIsGeocoding(true);

    Location.reverseGeocodeAsync({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    }).then((results) => {
      if (results.length > 0) {
        const place = results[0];
        const parts: string[] = [];
        if (place.streetNumber) parts.push(place.streetNumber);
        if (place.street) parts.push(place.street);
        const streetLine = parts.join(' ');
        const cityLine = [place.city, place.region, place.postalCode].filter(Boolean).join(', ');
        const fullAddress = [streetLine, cityLine].filter(Boolean).join(', ');
        setSelectedLocation({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          address: fullAddress,
        });
      }
    }).catch(() => {}).finally(() => {
      setIsGeocoding(false);
      setShowFlagModal(true);
    });
  };

  const handleSaveLead = async (lead: Omit<PropertyLead, 'id' | 'createdAt' | 'latitude' | 'longitude' | 'sessionId'>) => {
    const loc = selectedLocation || currentLocation;
    if (!loc) return;

    const newLead: PropertyLead = {
      id: generateId(),
      latitude: loc.latitude,
      longitude: loc.longitude,
      createdAt: Date.now(),
      sessionId: session?.id || null,
      ...lead,
    };

    await createLead(newLead);
    setLeads((prev) => [newLead, ...prev]);
    setShowFlagModal(false);
    setSelectedLocation(null);
  };

  const handleCloseModal = () => {
    setShowFlagModal(false);
    setSelectedLocation(null);
  };

  const handleDismissSelection = () => {
    setSelectedLocation(null);
  };

  const initialRegion: Region = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
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
        showsBuildings
        onPanDrag={() => setFollowUser(false)}
        onPress={handleMapPress}
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
            anchor={{ x: 0.5, y: 0.9 }}
          >
            <View style={styles.houseMarker}>
              <View style={styles.houseRoof} />
              <View style={styles.houseBody}>
                <Ionicons name="flag" size={22} color="#fff" />
                <Text style={styles.houseLabel} numberOfLines={1}>
                  {lead.address ? lead.address.split(',')[0] : 'Flagged'}
                </Text>
              </View>
            </View>
          </Marker>
        ))}

        {selectedLocation && !showFlagModal && (
          <Marker
            coordinate={{
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
            }}
            anchor={{ x: 0.5, y: 0.9 }}
          >
            <View style={styles.houseMarkerSelected}>
              <View style={styles.houseRoofSelected} />
              <View style={styles.houseBodySelected}>
                <Ionicons name="home" size={22} color="#000" />
                <Text style={styles.houseLabelSelected} numberOfLines={1}>
                  {selectedLocation.address ? selectedLocation.address.split(',')[0] : 'Tap to flag'}
                </Text>
              </View>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Selected location info card */}
      {selectedLocation && !showFlagModal && (
        <View style={styles.selectedCard}>
          <TouchableOpacity style={styles.dismissButton} onPress={handleDismissSelection}>
            <Ionicons name="close" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.selectedInfo}>
            <Ionicons name="location" size={22} color="#FFD600" />
            <View style={styles.selectedTextContainer}>
              {isGeocoding ? (
                <View style={styles.geocodingRow}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.geocodingText}>Looking up address...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.selectedAddress} numberOfLines={2}>
                    {selectedLocation.address || 'Unknown address'}
                  </Text>
                  <Text style={styles.selectedCoords}>
                    {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                  </Text>
                </>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.flagSelectedButton}
            onPress={handleFlagSelected}
            disabled={isGeocoding}
          >
            <Ionicons name="flag" size={20} color="#fff" />
            <Text style={styles.flagSelectedText}>Flag This Property</Text>
          </TouchableOpacity>
        </View>
      )}

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
        {!followUser && !selectedLocation && (
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

        {session?.isActive && !selectedLocation && (
          <TouchableOpacity
            style={styles.flagButton}
            onPress={handleFlagProperty}
          >
            <Ionicons name="flag" size={28} color="#fff" />
            <Text style={styles.flagButtonText}>Flag Property</Text>
          </TouchableOpacity>
        )}

        {!selectedLocation && (
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
        )}
      </View>

      <FlagPropertyModal
        visible={showFlagModal}
        onClose={handleCloseModal}
        onSave={handleSaveLead}
        initialAddress={selectedLocation?.address || ''}
        initialCoords={
          selectedLocation
            ? { latitude: selectedLocation.latitude, longitude: selectedLocation.longitude }
            : undefined
        }
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
  selectedCard: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dismissButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 4,
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
    paddingRight: 24,
  },
  selectedTextContainer: {
    flex: 1,
  },
  selectedAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  selectedCoords: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  geocodingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  geocodingText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  flagSelectedButton: {
    backgroundColor: Colors.flagRed,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  flagSelectedText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
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
  houseMarker: {
    alignItems: 'center',
    width: 90,
  },
  houseRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 45,
    borderRightWidth: 45,
    borderBottomWidth: 28,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#CC2200',
    marginBottom: -1,
  },
  houseBody: {
    backgroundColor: '#FF3B30',
    width: 90,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderWidth: 3,
    borderTopWidth: 0,
    borderColor: '#fff',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
  },
  houseLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  houseMarkerSelected: {
    alignItems: 'center',
    width: 90,
  },
  houseRoofSelected: {
    width: 0,
    height: 0,
    borderLeftWidth: 45,
    borderRightWidth: 45,
    borderBottomWidth: 28,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#CCB000',
    marginBottom: -1,
  },
  houseBodySelected: {
    backgroundColor: '#FFD600',
    width: 90,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderWidth: 3,
    borderTopWidth: 0,
    borderColor: '#fff',
    shadowColor: '#FFD600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
  },
  houseLabelSelected: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
