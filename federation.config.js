const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');
const { sharedConfig } = require('../../shared-federation.config');

module.exports = withNativeFederation({

  // shared: {
  //   ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  //   '@angular/material/menu': { singleton: true, strictVersion: true, requiredVersion: 'auto' },
  // },
  shared: sharedConfig,

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    // Add further packages you don't need at runtime
  ]

  // Please read our FAQ about sharing libs:
  // https://shorturl.at/jmzH0
  
});
