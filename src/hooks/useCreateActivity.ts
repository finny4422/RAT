import { useCallback, useState } from 'react';

import { activityService, ActivityValidationError, syncActivitiesAndWidget } from '@/services';
import type { CreateActivityInput } from '@/types';
import { ActivityFrequency } from '@/types';
import { toDateString } from '@/utils';

export type CreateActivityFormValues = {
  title: string;
  caption: string;
  frequency: ActivityFrequency;
  dueTime: string;
  warningMinutes: string;
  weekDay: string;
  monthDay: string;
  oneTimeDate: string;
};

export function createEmptyCreateActivityForm(): CreateActivityFormValues {
  return {
    title: '',
    caption: '',
    frequency: ActivityFrequency.Daily,
    dueTime: '',
    warningMinutes: '0',
    weekDay: '0',
    monthDay: '1',
    oneTimeDate: toDateString(new Date()),
  };
}

function parseOptionalInt(value: string): number | null {
  if (value.trim().length === 0) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function buildCreateActivityInput(form: CreateActivityFormValues): CreateActivityInput {
  const warningMinutes = Number.parseInt(form.warningMinutes, 10);

  const input: CreateActivityInput = {
    title: form.title.trim(),
    caption: form.caption.trim(),
    frequency: form.frequency,
    dueTime: form.dueTime.trim(),
    warningMinutes: Number.isNaN(warningMinutes) ? Number.NaN : warningMinutes,
    weekDay: null,
    monthDay: null,
    oneTimeDate: null,
    active: true,
  };

  switch (form.frequency) {
    case ActivityFrequency.Weekly:
      input.weekDay = parseOptionalInt(form.weekDay);
      break;
    case ActivityFrequency.Monthly:
      input.monthDay = parseOptionalInt(form.monthDay);
      break;
    case ActivityFrequency.OneTime:
      input.oneTimeDate = form.oneTimeDate.trim() || null;
      break;
    default:
      break;
  }

  return input;
}

type UseCreateActivityState = {
  form: CreateActivityFormValues;
  fieldErrors: Record<string, string>;
  submitError: string | null;
  isSubmitting: boolean;
};

export function useCreateActivity() {
  const [state, setState] = useState<UseCreateActivityState>({
    form: createEmptyCreateActivityForm(),
    fieldErrors: {},
    submitError: null,
    isSubmitting: false,
  });

  const setField = useCallback(
    <K extends keyof CreateActivityFormValues>(field: K, value: CreateActivityFormValues[K]) => {
      setState((current: UseCreateActivityState) => ({
        ...current,
        form: {
          ...current.form,
          [field]: value,
        },
        fieldErrors: {
          ...current.fieldErrors,
          [field]: '',
        },
        submitError: null,
      }));
    },
    [],
  );

  const resetForm = useCallback(() => {
    setState({
      form: createEmptyCreateActivityForm(),
      fieldErrors: {},
      submitError: null,
      isSubmitting: false,
    });
  }, []);

  const submit = useCallback(async () => {
    const input = buildCreateActivityInput(state.form);

    setState((current: UseCreateActivityState) => ({
      ...current,
      isSubmitting: true,
      fieldErrors: {},
      submitError: null,
    }));

    try {
      activityService.validateActivityInput(input);
      await activityService.createActivity(input);
      await syncActivitiesAndWidget('activity_mutation');
      resetForm();
      return true;
    } catch (error) {
      if (error instanceof ActivityValidationError) {
        setState((current: UseCreateActivityState) => ({
          ...current,
          isSubmitting: false,
          fieldErrors: error.fieldErrors,
        }));
        return false;
      }

      const message = error instanceof Error ? error.message : 'Failed to create activity.';

      setState((current: UseCreateActivityState) => ({
        ...current,
        isSubmitting: false,
        submitError: message,
      }));
      return false;
    }
  }, [resetForm, state.form]);

  return {
    form: state.form,
    fieldErrors: state.fieldErrors,
    submitError: state.submitError,
    isSubmitting: state.isSubmitting,
    setField,
    resetForm,
    submit,
  };
}
