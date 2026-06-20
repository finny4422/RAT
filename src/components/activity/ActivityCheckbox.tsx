import { Pressable, StyleSheet } from 'react-native';

import { Colors } from '@/constants/colors';

type ActivityCheckboxProps = {
  checked?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};

export function ActivityCheckbox({
  checked = false,
  disabled = false,
  onPress,
}: ActivityCheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.checkbox,
        checked ? styles.checked : null,
        disabled ? styles.disabled : null,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    backgroundColor: Colors.surface,
  },
  checked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
});
