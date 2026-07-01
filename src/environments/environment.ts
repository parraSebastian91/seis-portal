export const environment = {
    nameApp: 'Factor',
    BFF: '/api/bff',
    msAuth: '/api/auth/security',
    appLogin: '/pages/login',

    /**
     * URL base de Kong inyectada en runtime via window.__env.API_BASE_URL (desde entrypoint.portal.sh).
     * Ejemplo: http://192.168.3.10:8000
     * Sin env.js ó en desarrollo local: fallback a localhost:8000.
     */
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

    enableDevLogs: false
};

