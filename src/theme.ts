// Dark theme colors used throughout the app
export const Colors = {
  // Backgrounds
  background: '#121212',
  surface: '#1E1E1E',
  surfaceLight: '#252525',
  surfaceHighlight: '#2A2A2A',

  // Text
  textPrimary: '#E0E0E0',
  textSecondary: '#AAAAAA',
  textMuted: '#888888',
  textSubtle: '#666666',

  // Borders
  border: '#2A2A2A',
  borderLight: '#333333',

  // Inputs
  inputBg: '#252525',
  inputBorder: '#333333',

  // Accents (kept vibrant for dark mode)
  primary: '#5A9FE8',
  danger: '#E53935',
  success: '#43A047',
  warning: '#FB8C00',
  purple: '#8E24AA',
  cyan: '#00ACC1',
  flagRed: '#FF6B6B',

  // Tab bar
  tabBarBg: '#1A1A1A',
  tabBarBorder: '#333333',
  tabBarInactive: '#666666',

  // Tags
  tagBg: '#1A2A3A',

  // Overlays
  overlayBg: 'rgba(0, 0, 0, 0.85)',
  emptyOverlayBg: 'rgba(18, 18, 18, 0.95)',
};

// Dark mode map style for Google Maps
export const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#4e4e4e' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
];
