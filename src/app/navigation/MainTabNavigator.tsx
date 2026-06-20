import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

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

const textOnlyTabOptions: BottomTabNavigationOptions = {
  tabBarIcon: () => null,
  tabBarShowIcon: false,
};

export function MainTabNavigator() {
  return (
    <NavigationContainer theme={tabTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowIcon: false,
          tabBarIcon: () => null,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            height: 56,
            paddingBottom: 6,
            paddingTop: 6,
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: '500',
            marginTop: 0,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
        }}
      >
        <Tab.Screen
          name="Activities"
          component={ActivitiesScreen}
          options={textOnlyTabOptions}
        />
        <Tab.Screen
          name="CreateActivity"
          component={CreateActivityScreen}
          options={{
            ...textOnlyTabOptions,
            title: 'Create Activity',
          }}
        />
        <Tab.Screen
          name="Reports"
          component={ReportsScreen}
          options={textOnlyTabOptions}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
