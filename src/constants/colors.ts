import { ActivityStatus } from '@/types';

export const Colors = {
  background: '#121212',
  surface: '#1C1C1E',
  card: '#2C2C2E',
  text: '#F5F5F5',
  textSecondary: '#A0A0A0',
  border: '#3A3A3C',
  primary: '#0A84FF',
  error: '#FF453A',
  warning: '#FFD60A',
  success: '#30D158',
} as const;

export { StatusColors, StatusAccentColors, getStatusCardColors } from './statusColors';
