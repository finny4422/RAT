import type { ReactNode } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { MainTabParamList } from '@/app/navigation/types';
import { ScreenContainer } from '@/components';
import { Colors } from '@/constants';
import { useCreateActivity } from '@/hooks';
import { ActivityFrequency } from '@/types';

const FREQUENCY_OPTIONS: { value: ActivityFrequency; label: string }[] = [
  { value: ActivityFrequency.Daily, label: 'Daily' },
  { value: ActivityFrequency.Weekly, label: 'Weekly' },
  { value: ActivityFrequency.Monthly, label: 'Monthly' },
  { value: ActivityFrequency.OneTime, label: 'One-Time' },
];

const WEEKDAY_OPTIONS = [
  { value: '0', label: 'Sun' },
  { value: '1', label: 'Mon' },
  { value: '2', label: 'Tue' },
  { value: '3', label: 'Wed' },
  { value: '4', label: 'Thu' },
  { value: '5', label: 'Fri' },
  { value: '6', label: 'Sat' },
];

type FormFieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

function FormField({ label, error, children }: FormFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function CreateActivityScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { form, fieldErrors, submitError, isSubmitting, setField, submit } = useCreateActivity();

  const handleSave = async () => {
    const saved = await submit();

    if (saved) {
      navigation.navigate('Activities');
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.title}>Create Activity</Text>

        {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

        <FormField label="Title" error={fieldErrors.title}>
          <TextInput
            value={form.title}
            onChangeText={(value) => setField('title', value)}
            style={styles.input}
            placeholder="Activity title"
            placeholderTextColor={Colors.textSecondary}
          />
        </FormField>

        <FormField label="Caption" error={fieldErrors.caption}>
          <TextInput
            value={form.caption}
            onChangeText={(value) => setField('caption', value)}
            style={styles.input}
            placeholder="Short description"
            placeholderTextColor={Colors.textSecondary}
          />
        </FormField>

        <FormField label="Frequency" error={fieldErrors.frequency}>
          <View style={styles.optionRow}>
            {FREQUENCY_OPTIONS.map((option) => {
              const selected = form.frequency === option.value;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => setField('frequency', option.value)}
                  style={[styles.optionButton, selected && styles.optionButtonSelected]}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </FormField>

        <FormField label="Due Time (HH:MM)" error={fieldErrors.dueTime}>
          <TextInput
            value={form.dueTime}
            onChangeText={(value) => setField('dueTime', value)}
            style={styles.input}
            placeholder="20:00"
            placeholderTextColor={Colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </FormField>

        <FormField label="Warning Minutes" error={fieldErrors.warningMinutes}>
          <TextInput
            value={form.warningMinutes}
            onChangeText={(value) => setField('warningMinutes', value)}
            style={styles.input}
            placeholder="60"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="number-pad"
          />
        </FormField>

        {form.frequency === ActivityFrequency.Weekly ? (
          <FormField label="Week Day" error={fieldErrors.weekDay}>
            <View style={styles.optionRow}>
              {WEEKDAY_OPTIONS.map((option) => {
                const selected = form.weekDay === option.value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setField('weekDay', option.value)}
                    style={[styles.optionButton, selected && styles.optionButtonSelected]}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </FormField>
        ) : null}

        {form.frequency === ActivityFrequency.Monthly ? (
          <FormField label="Month Day (1-31)" error={fieldErrors.monthDay}>
            <TextInput
              value={form.monthDay}
              onChangeText={(value) => setField('monthDay', value)}
              style={styles.input}
              placeholder="15"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="number-pad"
            />
          </FormField>
        ) : null}

        {form.frequency === ActivityFrequency.OneTime ? (
          <FormField label="Date (YYYY-MM-DD)" error={fieldErrors.oneTimeDate}>
            <TextInput
              value={form.oneTimeDate}
              onChangeText={(value) => setField('oneTimeDate', value)}
              style={styles.input}
              placeholder="2026-07-10"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </FormField>
        ) : null}

        <Pressable
          disabled={isSubmitting}
          onPress={() => void handleSave()}
          style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
        >
          <Text style={styles.saveButtonText}>{isSubmitting ? 'Saving...' : 'Save Activity'}</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  form: {
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: Colors.text,
  },
  field: {
    marginBottom: 16,
  },
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
  fieldError: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.error,
  },
  submitError: {
    marginBottom: 12,
    fontSize: 14,
    color: Colors.error,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
});
