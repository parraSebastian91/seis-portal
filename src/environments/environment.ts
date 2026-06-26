export const environment = {
    nameApp: 'ERP Seis',
    BFF: '/api/bff',
    msAuth: '/api/auth/security',
    msErp: 'http://localhost:3001',
    msSession: 'http://localhost:3002',
    get appLogin(): string {
        return (window as any).__env?.LOGIN_URL || 'http://localhost:8000';
    },
    apiProtocol: 'http',
    apiPort: '8000',
    enableDevLogs: false
};
