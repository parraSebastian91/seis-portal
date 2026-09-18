export const environment = {
    nameApp: 'Factor',
    BFF: '/api/bff',
    msAuth: '/api/auth/security',
    appLogin: '/pages/login',

    /**
     * URL base del gateway, inyectada en runtime via window.__env.API_BASE_URL
     * (desde entrypoint.portal.sh en Docker/prod).
     * Sin ese valor: window.location.origin (NO un host:puerto fijo), para
     * que las llamadas caigan en el propio origen sin CORS.
     */
    getBaseUrl(): string {
        const injected = (window as any).__env?.API_BASE_URL;
        if (injected) return injected.replace(/\/$/, '');
        return window.location.origin;
    },

    getEndpoint(path = ''): string {
        const base = environment.getBaseUrl();
        if (!path) return base;
        return `${base}/${path.replace(/^\//, '')}`;
    },

    enableDevLogs: false
};

