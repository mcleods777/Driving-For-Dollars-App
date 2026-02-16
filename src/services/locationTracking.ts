import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Coordinate, DrivingSession } from '../types';
import { generateId, calculateTotalDistance } from '../utils/geo';
import * as db from './database';

const LOCATION_TASK_NAME = 'background-location-task';

type LocationUpdateCallback = (coordinates: Coordinate[]) => void;
type SessionUpdateCallback = (session: DrivingSession) => void;

let currentSession: DrivingSession | null = null;
let locationCallbacks: LocationUpdateCallback[] = [];
let sessionCallbacks: SessionUpdateCallback[] = [];
let foregroundSubscription: Location.LocationSubscription | null = null;

// Register the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }
  if (data && currentSession) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const newCoords: Coordinate[] = locations.map((loc) => ({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      timestamp: loc.timestamp,
      speed: loc.coords.speed,
      heading: loc.coords.heading,
    }));

    await db.addCoordinatesBatch(currentSession.id, newCoords);
    currentSession.coordinates.push(...newCoords);
    currentSession.distanceMiles = calculateTotalDistance(currentSession.coordinates);
    await db.updateSession(currentSession);

    locationCallbacks.forEach((cb) => cb(newCoords));
    sessionCallbacks.forEach((cb) => cb({ ...currentSession! }));
  }
});

export function onLocationUpdate(callback: LocationUpdateCallback): () => void {
  locationCallbacks.push(callback);
  return () => {
    locationCallbacks = locationCallbacks.filter((cb) => cb !== callback);
  };
}

export function onSessionUpdate(callback: SessionUpdateCallback): () => void {
  sessionCallbacks.push(callback);
  return () => {
    sessionCallbacks = sessionCallbacks.filter((cb) => cb !== callback);
  };
}

export function getCurrentSession(): DrivingSession | null {
  return currentSession;
}

export async function requestPermissions(): Promise<boolean> {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus !== 'granted') {
    return false;
  }

  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  if (backgroundStatus !== 'granted') {
    console.warn('Background location permission not granted. Tracking will only work in foreground.');
  }

  return true;
}

export async function startSession(): Promise<DrivingSession | null> {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return null;

  // Check for an existing active session
  const existingSession = await db.getActiveSession();
  if (existingSession) {
    currentSession = existingSession;
    await startLocationUpdates();
    sessionCallbacks.forEach((cb) => cb({ ...currentSession! }));
    return currentSession;
  }

  const session: DrivingSession = {
    id: generateId(),
    startTime: Date.now(),
    endTime: null,
    coordinates: [],
    distanceMiles: 0,
    isActive: true,
  };

  await db.createSession(session);
  currentSession = session;

  await startLocationUpdates();

  sessionCallbacks.forEach((cb) => cb({ ...currentSession! }));
  return session;
}

export async function stopSession(): Promise<DrivingSession | null> {
  if (!currentSession) return null;

  currentSession.endTime = Date.now();
  currentSession.isActive = false;
  currentSession.distanceMiles = calculateTotalDistance(currentSession.coordinates);
  await db.updateSession(currentSession);

  await stopLocationUpdates();

  const finishedSession = { ...currentSession };
  sessionCallbacks.forEach((cb) => cb(finishedSession));
  currentSession = null;
  return finishedSession;
}

export async function resumeActiveSession(): Promise<DrivingSession | null> {
  const activeSession = await db.getActiveSession();
  if (!activeSession) return null;

  currentSession = activeSession;
  await startLocationUpdates();
  sessionCallbacks.forEach((cb) => cb({ ...currentSession! }));
  return currentSession;
}

async function startLocationUpdates(): Promise<void> {
  // Start foreground location updates
  foregroundSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 2000,
      distanceInterval: 5,
    },
    async (location) => {
      if (!currentSession) return;

      const coord: Coordinate = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        speed: location.coords.speed,
        heading: location.coords.heading,
      };

      await db.addCoordinate(currentSession.id, coord);
      currentSession.coordinates.push(coord);
      currentSession.distanceMiles = calculateTotalDistance(currentSession.coordinates);
      await db.updateSession(currentSession);

      locationCallbacks.forEach((cb) => cb([coord]));
      sessionCallbacks.forEach((cb) => cb({ ...currentSession! }));
    }
  );

  // Also start background location updates
  try {
    const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (!isTaskRegistered) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000,
        distanceInterval: 10,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'Driving for Dollars',
          notificationBody: 'Tracking your driving route...',
          notificationColor: '#4A90D9',
        },
      });
    }
  } catch (e) {
    console.warn('Could not start background location updates:', e);
  }
}

async function stopLocationUpdates(): Promise<void> {
  if (foregroundSubscription) {
    foregroundSubscription.remove();
    foregroundSubscription = null;
  }

  try {
    const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isTaskRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  } catch (e) {
    console.warn('Could not stop background location updates:', e);
  }
}

export async function getCurrentLocation(): Promise<Coordinate | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp,
      speed: location.coords.speed,
      heading: location.coords.heading,
    };
  } catch {
    return null;
  }
}
