import { StatusBar } from 'expo-status-bar';

import { MainTabNavigator } from './navigation';
import { AppProviders } from './providers';

export function App() {
  return (
    <AppProviders>
      <StatusBar style="auto" />
      <MainTabNavigator />
    </AppProviders>
  );
}
