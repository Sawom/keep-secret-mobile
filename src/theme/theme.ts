import type { ViewStyle } from 'react-native';

export type Theme = {
  bg: string; card: string; text: string; muted: string; border: string;
  brand: string; danger: string; success: string; soft: string;
};
export const brand = '#6D5EF5';
export const palette = (dark: boolean): Theme => dark ? {
  bg: '#0D111B', card: '#171E2B', text: '#F3F5FA', muted: '#A5AEC0',
  border: '#30394A', brand, danger: '#F16B78', success: '#48C99A', soft: '#24233C',
} : {
  bg: '#F5F6FA', card: '#FFFFFF', text: '#18202F', muted: '#697386',
  border: '#E5E8EF', brand, danger: '#D94B5B', success: '#1D9A6C', soft: '#ECE9FF',
};
export const cardStyle = (theme: Theme): ViewStyle => ({ backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, borderRadius: 16 });
