import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ActivitiesScreen, CreateActivityScreen, ReportsScreen } from '@/screens';

import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
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
