import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { DrivingSession, PropertyLead } from '../types';
import { getSession, getAllLeads } from '../services/database';
import { formatDistance, formatDuration, formatDateTime, getBoundingRegion } from '../utils/geo';
import { Colors, darkMapStyle } from '../theme';

type RouteParams = {
  SessionDetail: { sessionId: string };
};

export default function SessionDetailScreen() {
  const route = useRoute<RouteProp<RouteParams, 'SessionDetail'>>();
  const mapRef = useRef<MapView>(null);
  const [session, setSession] = useState<DrivingSession | null>(null);
  const [leads, setLeads] = useState<PropertyLead[]>([]);

  useEffect(() => {
    (async () => {
      const s = await getSession(route.params.sessionId);
      setSession(s);

      const allLeads = await getAllLeads();
      setLeads(allLeads.filter((l) => l.sessionId === route.params.sessionId));

      if (s && s.coordinates.length > 0) {
        const region = getBoundingRegion(s.coordinates);
        if (region && mapRef.current) {
          setTimeout(() => {
            mapRef.current?.animateToRegion(region, 500);
          }, 500);
        }
      }
    })();
  }, [route.params.sessionId]);

  if (!session) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading session...</Text>
      </View>
    );
  }

  const duration = session.endTime
    ? session.endTime - session.startTime
    : Date.now() - session.startTime;

  const routeCoords = session.coordinates.map((c) => ({
    latitude: c.latitude,
    longitude: c.longitude,
  }));

  const startCoord = routeCoords[0];
  const endCoord = routeCoords[routeCoords.length - 1];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={darkMapStyle}
        initialRegion={
          session.coordinates.length > 0
            ? getBoundingRegion(session.coordinates) || undefined
            : undefined
        }
      >
        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={Colors.primary}
            strokeWidth={5}
          />
        )}

        {startCoord && (
          <Marker
            coordinate={startCoord}
            title="Start"
            pinColor="green"
          />
        )}

        {endCoord && routeCoords.length > 1 && (
          <Marker
            coordinate={endCoord}
            title="End"
            pinColor="red"
          />
        )}

        {leads.map((lead) => (
          <Marker
            key={lead.id}
            coordinate={{ latitude: lead.latitude, longitude: lead.longitude }}
            title={lead.address || 'Flagged Property'}
            description={lead.notes || undefined}
          >
            <View style={styles.leadMarker}>
              <Ionicons name="flag" size={20} color={Colors.flagRed} />
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.detailsPanel}>
        <Text style={styles.dateText}>
          {formatDateTime(session.startTime)}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="speedometer-outline" size={20} color={Colors.primary} />
            <Text style={styles.statValue}>
              {formatDistance(session.distanceMiles)}
            </Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={20} color={Colors.primary} />
            <Text style={styles.statValue}>{formatDuration(duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="flag-outline" size={20} color={Colors.primary} />
            <Text style={styles.statValue}>{leads.length}</Text>
            <Text style={styles.statLabel}>Leads</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="location-outline" size={20} color={Colors.primary} />
            <Text style={styles.statValue}>
              {session.coordinates.length}
            </Text>
            <Text style={styles.statLabel}>GPS Points</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  map: {
    flex: 1,
  },
  leadMarker: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: Colors.flagRed,
  },
  detailsPanel: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
