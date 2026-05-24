# n8n en Hostinger Node.js App

Este repo intenta ejecutar n8n como una app Node.js administrada de Hostinger.

Importante: esto no es el despliegue recomendado por n8n ni por Hostinger para produccion. Puede funcionar si Hostinger permite el proceso persistente, escritura en disco y webhooks, pero si aparecen errores de WebSocket, almacenamiento o reinicios, el camino correcto es VPS/Docker.

## Configuracion en Hostinger

En **Anadir sitio web -> App web Node.js**:

- Fuente: este repositorio de GitHub o ZIP.
- Framework: `Other` si no detecta uno automaticamente.
- Node.js: `22.x` o `24.x`. Esta version de n8n requiere Node `>=22.16`.
- Install command: `npm install`.
- Build command: dejar vacio.
- Start command: `npm start`.
- Entry file: `start.js`.

## Variables de entorno

Configura estas variables en Hostinger. No subas `.env`.

```env
N8N_LISTEN_ADDRESS=0.0.0.0
N8N_HOST=TU-DOMINIO
N8N_PROTOCOL=https
N8N_EDITOR_BASE_URL=https://TU-DOMINIO
WEBHOOK_URL=https://TU-DOMINIO/
N8N_ENCRYPTION_KEY=CAMBIAR_POR_UNA_CLAVE_LARGA_DE_32_CARACTERES_O_MAS
GENERIC_TIMEZONE=America/Argentina/Buenos_Aires
TZ=America/Argentina/Buenos_Aires
N8N_SECURE_COOKIE=true
N8N_DIAGNOSTICS_ENABLED=false
```

No fuerces `N8N_PORT` si Hostinger inyecta `PORT`. El wrapper `start.js` ya usa `PORT` cuando existe.

Para `n8n.laind.io`, usa:

```env
N8N_LISTEN_ADDRESS=0.0.0.0
N8N_HOST=n8n.laind.io
N8N_PROTOCOL=https
N8N_EDITOR_BASE_URL=https://n8n.laind.io
WEBHOOK_URL=https://n8n.laind.io/
```

## Primer arranque

Cuando Hostinger termine el deploy, abre la URL publica. n8n deberia mostrar el onboarding para crear el usuario propietario.

## Senales de que Hostinger Node.js no alcanza

- El deploy muestra `EBADENGINE` con Node `20.x`; cambia la version de Node a `22.x` o `24.x`.
- El panel muestra reinicios constantes.
- n8n carga pero aparece "connection lost".
- Los webhooks externos no responden.
- Los workflows se pierden luego de un redeploy.
- No se pueden instalar community nodes.

Si pasa eso, no es un problema del repo: es una limitacion del entorno administrado. Para produccion estable, usa VPS con Docker, n8n cloud, Railway, Render, Fly.io o similar.
