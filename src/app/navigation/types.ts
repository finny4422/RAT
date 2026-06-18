import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type MainTabParamList = {
  Activities: undefined;
  CreateActivity: undefined;
  Reports: undefined;
};

export type ActivitiesScreenProps = BottomTabScreenProps<MainTabParamList, 'Activities'>;
export type CreateActivityScreenProps = BottomTabScreenProps<MainTabParamList, 'CreateActivity'>;
export type ReportsScreenProps = BottomTabScreenProps<MainTabParamList, 'Reports'>;
