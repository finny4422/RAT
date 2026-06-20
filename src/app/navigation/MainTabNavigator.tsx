import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

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

export function MainTabNavigator() {
  return (
    <NavigationContainer theme={tabTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowIcon: false,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: '500',
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
