import { initFederation } from '@angular-architects/native-federation';

initFederation({
  'seis-mfe-gestion-usuario': '/mfe-gestion-usuario/remoteEntry.json',
  'seis-mfe-dashboard-facturas': '/mfe-dashboard-facturas/remoteEntry.json',
  'seis-mfe-publicador-facturas': '/mfe-publicador-facturas/remoteEntry.json'
})
  .catch(err => console.error(err))
  .then(_ => import('./bootstrap'))
  .catch(err => console.error(err));
