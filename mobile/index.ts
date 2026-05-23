import 'react-native-url-polyfill/auto';

// Ensure FormData is available globally
if (typeof global.FormData === 'undefined') {
  global.FormData = require('react-native/Libraries/Network/FormData');
}

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
