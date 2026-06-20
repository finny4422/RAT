import { StyleSheet } from 'react-native';

import { Colors } from './colors';

export const Theme = {
  colors: Colors,
  screenTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 16,
    color: Colors.text,
  },
  screenError: {
    fontSize: 14,
    color: Colors.error,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  centered: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center' as const,
  },
};

export const FormTheme = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    borderRadius: 8,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  optionButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: Colors.text,
  },
  optionTextSelected: {
    color: Colors.text,
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  fieldError: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.error,
  },
});
