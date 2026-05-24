# Hostinger n8n Node App

Repo minimo para intentar ejecutar una instancia funcional de n8n como **App web Node.js** en Hostinger.

## Como funciona

- `package.json` instala `n8n` como dependencia local.
- `start.js` ejecuta el binario local de n8n con `n8n start`.
- Hostinger puede usar `npm start` y `start.js` como entry file.

## Local

```bash
npm install
npm start
```

Luego abre `http://localhost:5678`.

## Hostinger

Ver [HOSTINGER.md](./HOSTINGER.md).

## Nota honesta

Esta configuracion es un intento practico para aprovechar el hosting Node.js que ya tenes. Si Hostinger bloquea WebSockets, no conserva el filesystem entre deploys, reinicia el proceso agresivamente o no permite ciertos binarios, n8n puede no ser estable ahi. En ese caso no hay que seguir peleando el repo: conviene mover n8n a VPS/Docker y dejar Hostinger para el sitio publico.
