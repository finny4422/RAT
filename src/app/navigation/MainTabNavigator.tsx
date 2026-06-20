import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivitiesScreen, CreateActivityScreen, ReportsScreen } from '@/screens';
import { Colors } from '@/constants';

import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.text,
    border: Colors.border,
    primary: Colors.primary,
  },
};

const TAB_BAR_CONTENT_HEIGHT = 48;

export function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);

  return (
    <NavigationContainer theme={tabTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowIcon: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            borderTopWidth: StyleSheet.hairlineWidth,
            height: TAB_BAR_CONTENT_HEIGHT + bottomInset,
            paddingBottom: bottomInset,
            paddingTop: 6,
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarLabel: ({ focused, color, children }) => (
            <Text
              numberOfLines={1}
              style={{
                color,
                fontSize: 12,
                fontWeight: focused ? '600' : '500',
                textAlign: 'center',
              }}
            >
              {children}
            </Text>
          ),
          tabBarItemStyle: {
            paddingVertical: 2,
          },
        }}
      >
        <Tab.Screen name="Activities" component={ActivitiesScreen} />
        <Tab.Screen
          name="CreateActivity"
          component={CreateActivityScreen}
          options={{ title: 'Create Activity' }}
        />
        <Tab.Screen name="Reports" component={ReportsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
