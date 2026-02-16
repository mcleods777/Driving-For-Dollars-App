import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from './src/theme';

import DriveScreen from './src/screens/DriveScreen';
import SessionsScreen from './src/screens/SessionsScreen';
import SessionDetailScreen from './src/screens/SessionDetailScreen';
import CoverageScreen from './src/screens/CoverageScreen';
import LeadsScreen from './src/screens/LeadsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const AppDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.textPrimary,
    border: Colors.border,
    primary: Colors.primary,
  },
};

function SessionsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { color: Colors.textPrimary },
      }}
    >
      <Stack.Screen
        name="SessionsList"
        component={SessionsScreen}
        options={{ title: 'Sessions' }}
      />
      <Stack.Screen
        name="SessionDetail"
        component={SessionDetailScreen}
        options={{ title: 'Session Detail' }}
      />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Drive':
              iconName = focused ? 'navigate' : 'navigate-outline';
              break;
            case 'Sessions':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Coverage':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Leads':
              iconName = focused ? 'flag' : 'flag-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: Colors.tabBarBg,
          borderTopColor: Colors.tabBarBorder,
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.textPrimary,
      })}
    >
      <Tab.Screen
        name="Drive"
        component={DriveScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Sessions"
        component={SessionsStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Coverage"
        component={CoverageScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Leads"
        component={LeadsScreen}
        options={{ title: 'Leads' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer theme={AppDarkTheme}>
        <StatusBar style="light" />
        <TabNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
