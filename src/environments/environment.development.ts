export const environment = {
  nameApp: 'Factor',
  BFF: '/api/bff',
  msAuth: '/api/auth/security',
  appLogin: '/pages/login',

  getBaseUrl(): string {
    const injected = (window as any).__env?.API_BASE_URL;
    if (injected) return injected.replace(/\/$/, '');
    const protocol = (window as any).__env?.HOST_PROTOCOL || 'http';
    const host     = (window as any).__env?.HOST_LAN_IP    || 'localhost';
    const port     = (window as any).__env?.KONG_PROXY_PORT || '8000';
    return `${protocol}://${host}:${port}`;
  },

  getEndpoint(path = ''): string {
    const base = environment.getBaseUrl();
    if (!path) return base;
    return `${base}/${path.replace(/^\//, '')}`;
  },

  enableDevLogs: true,
};

