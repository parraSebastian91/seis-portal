Instrucciones para fuentes locales

Coloca aquí los archivos de fuentes si deseas servirlas desde tu aplicación en lugar de depender de Google Fonts.

Nombres recomendados:
- Roboto-Regular.woff2
- Roboto-Medium.woff2
- MaterialIcons-Regular.woff2

Dónde obtenerlas:
- Roboto: https://fonts.google.com/specimen/Roboto -> descargar familia y extraer los woff2
- Material Icons: https://fonts.google.com/icons -> buscar "Material Icons" y descargar la fuente (o obtener MaterialIcons-Regular.woff2 desde el paquete oficial)

Notas:
- Después de colocar los archivos en `src/assets/fonts/`, descomenta las reglas @font-face en `src/styles.scss`.
- Si usas Kong/una gateway con CSP, asegúrate de que sirva `/assets/*` sin restricciones.
