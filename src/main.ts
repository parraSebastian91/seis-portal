import { initFederation } from '@angular-architects/native-federation';

initFederation(new URL('federation.manifest.json', document.baseURI).toString())
  .catch(err => console.error('Error cargando federation manifest:', err))
  .then(() => import('./bootstrap'))
  .catch(err => console.error(err));
