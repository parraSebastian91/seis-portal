import { initFederation } from '@angular-architects/native-federation';

initFederation('/federation.manifest.json')
  .catch(err => console.error('Error cargando federation manifest:', err))
  .then(() => import('./bootstrap'))
  .catch(err => console.error(err));
