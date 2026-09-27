export const environment = {
  nameApp: 'Factor',
  BFF: '/api/bff',
  msAuth: '/api/auth/security',
  appLogin: '/pages/login',

  /**
   * URL base del gateway, inyectada en runtime via window.__env.API_BASE_URL.
   * Sin ese valor: window.location.origin (NO un host:puerto fijo), para que
   * las llamadas caigan en el propio origen y el proxyConfig del dev-server
   * las reenvíe al gateway sin CORS.
   */
  getBaseUrl(): string {
    const injected = (window as any).__env?.API_BASE_URL;
    if (injected) return injected.replace(/\/$/, '');
    return window.location.origin;
  },

  /**
   * URL absoluta del login. En desarrollo (portal en :4200 con ng serve) el login corre aparte en :8082;
   * detrás del gateway comparte origen. LOGIN_URL (env.js) tiene prioridad si viene definida.
   */
  get loginUrl(): string {
    const injected = (window as any).__env?.LOGIN_URL;
    if (injected && /^https?:\/\//.test(injected)) return injected;
    if (window.location.port === '4200') return `http://localhost:8082${environment.appLogin}`;
    return `${environment.getBaseUrl()}${environment.appLogin}`;
  },

  getEndpoint(path = ''): string {
    const base = environment.getBaseUrl();
    if (!path) return base;
    return `${base}/${path.replace(/^\//, '')}`;
  },

  enableDevLogs: true,
};

