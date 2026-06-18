import { Pressable, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants';

type ActivityCheckboxProps = {
  checked?: boolean;
  onPress?: () => void;
};

export function ActivityCheckbox({ checked = false, onPress }: ActivityCheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={[styles.checkbox, checked && styles.checked]}
    />
  );
}

const styles = StyleSheet.create({
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  checked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
});
