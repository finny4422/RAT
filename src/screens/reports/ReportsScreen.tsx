import { StyleSheet, Text } from 'react-native';

import { ScreenContainer } from '@/components';

export function ReportsScreen() {
  return (
    <ScreenContainer>
      <Text style={styles.title}>Reports</Text>
      <Text style={styles.subtitle}>Historical reports will appear here.</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
  },
});
