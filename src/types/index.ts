export interface Coordinate {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed?: number | null;
  heading?: number | null;
}

export interface DrivingSession {
  id: string;
  startTime: number;
  endTime: number | null;
  coordinates: Coordinate[];
  distanceMiles: number;
  isActive: boolean;
}

export interface PropertyLead {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  notes: string;
  photoUri: string | null;
  tags: string[];
  createdAt: number;
  sessionId: string | null;
  status: 'new' | 'contacted' | 'negotiating' | 'closed' | 'passed';
}

export interface AppSettings {
  routeColor: string;
  routeWidth: number;
  trackingInterval: number; // milliseconds
  distanceFilter: number; // meters
  mapType: 'standard' | 'satellite' | 'hybrid';
  keepScreenOn: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  routeColor: '#4A90D9',
  routeWidth: 4,
  trackingInterval: 3000,
  distanceFilter: 10,
  mapType: 'standard',
  keepScreenOn: true,
};

export const LEAD_STATUS_COLORS: Record<PropertyLead['status'], string> = {
  new: '#FF6B6B',
  contacted: '#FFA726',
  negotiating: '#FFEE58',
  closed: '#66BB6A',
  passed: '#BDBDBD',
};

export const LEAD_STATUS_LABELS: Record<PropertyLead['status'], string> = {
  new: 'New Lead',
  contacted: 'Contacted',
  negotiating: 'Negotiating',
  closed: 'Closed Deal',
  passed: 'Passed',
};
