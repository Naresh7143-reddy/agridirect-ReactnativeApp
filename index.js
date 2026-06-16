/**
 * AgriDirect — Entry Point
 *
 * Firebase background message handler must be registered before React mounts.
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Register FCM background handler (no-op if Firebase not yet configured)
try {
  const { registerHeadlessTask } = require('./src/utils/notifications');
  registerHeadlessTask();
} catch (e) {
  // Firebase not configured — safe to ignore during development
}

AppRegistry.registerComponent(appName, () => App);
