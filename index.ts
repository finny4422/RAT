import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';

import { App } from './src/app/App';
import widgetCompletionTask from './src/widget/completionTask';
import widgetHeadlessTask from './src/widget/headlessTask';

registerRootComponent(App);

AppRegistry.registerHeadlessTask('RoutineTrackerWidgetSync', () => widgetHeadlessTask);
AppRegistry.registerHeadlessTask(
  'RoutineTrackerWidgetCompletion',
  () => async (taskData?: unknown) => {
    await widgetCompletionTask(taskData);
  },
);
