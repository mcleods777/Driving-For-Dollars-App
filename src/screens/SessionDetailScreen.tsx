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
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.customMarker}>
              <View style={styles.startMarkerGlow}>
                <View style={styles.startMarkerBubble}>
                  <Ionicons name="play" size={20} color="#fff" />
                </View>
              </View>
              <View style={styles.startMarkerArrow} />
            </View>
          </Marker>
        )}

        {endCoord && routeCoords.length > 1 && (
          <Marker
            coordinate={endCoord}
            title="End"
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.customMarker}>
              <View style={styles.endMarkerGlow}>
                <View style={styles.endMarkerBubble}>
                  <Ionicons name="stop" size={20} color="#fff" />
                </View>
              </View>
              <View style={styles.endMarkerArrow} />
            </View>
          </Marker>
        )}

        {leads.map((lead) => (
          <Marker
            key={lead.id}
            coordinate={{ latitude: lead.latitude, longitude: lead.longitude }}
            title={lead.address || 'Flagged Property'}
            description={lead.notes || undefined}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.customMarker}>
              <View style={styles.leadMarkerGlow}>
                <View style={styles.leadMarker}>
                  <Ionicons name="flag" size={24} color="#fff" />
                </View>
              </View>
              <View style={styles.leadMarkerArrow} />
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
  customMarker: {
    alignItems: 'center',
  },
  startMarkerGlow: {
    backgroundColor: 'rgba(67, 160, 71, 0.3)',
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startMarkerBubble: {
    backgroundColor: Colors.success,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 10,
  },
  startMarkerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
    marginTop: -2,
  },
  endMarkerGlow: {
    backgroundColor: 'rgba(229, 57, 53, 0.3)',
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endMarkerBubble: {
    backgroundColor: Colors.danger,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 10,
  },
  endMarkerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
    marginTop: -2,
  },
  leadMarkerGlow: {
    backgroundColor: 'rgba(255, 59, 48, 0.3)',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadMarker: {
    backgroundColor: '#FF3B30',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 10,
  },
  leadMarkerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
    marginTop: -2,
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
