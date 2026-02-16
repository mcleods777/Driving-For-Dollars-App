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

// Dark mode map style for Google Maps — buildings & structures visible
export const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#141425' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#141425' }] },
  // Administrative
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  // Buildings — high contrast fill and bright outlines
  { featureType: 'landscape.man_made', elementType: 'geometry.fill', stylers: [{ color: '#2f3055' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry.stroke', stylers: [{ color: '#7070a0' }, { weight: 2.5 }] },
  // Natural landscape
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#141425' }] },
  // POI — parks and businesses visible but subtle
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6a6a6a' }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1e3a1e' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#4a7a4a' }] },
  { featureType: 'poi.business', elementType: 'geometry', stylers: [{ color: '#2a2a40' }] },
  // Roads — brighter so they stand out as you drive
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#3a3a4a' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#2a2a3a' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9a9a9a' }] },
  { featureType: 'road.arterial', elementType: 'geometry.fill', stylers: [{ color: '#444460' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#505068' }] },
  { featureType: 'road.highway.controlled_access', elementType: 'geometry.fill', stylers: [{ color: '#5a5a72' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#707070' }] },
  // Transit
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  // Water
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1a2b' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
];
