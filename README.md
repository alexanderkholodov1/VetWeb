# Backend Sistema de Rescate y Gestion de Mascotas

Backend en Node.js + Firebase Cloud Functions v2 + Firestore con arquitectura monolitica Express en un unico entry point (`api`).

## Requisitos

- Node.js 20
- Firebase CLI (`npm i -g firebase-tools`)
- Proyecto Firebase configurado

## Instalacion

```bash
cd functions
npm install
```

## Variables de entorno

No se requieren variables extra para el mock actual de pagos. Para emulador local, autentica Firebase CLI:

```bash
firebase login
firebase use <tu-proyecto>
```

## Ejecutar en local (Emulator Suite)

Desde la raiz del proyecto (donde esta `firebase.json` si lo agregas):

```bash
cd functions
npm run build
npm run serve
```

## Scripts utiles

- `npm run build`: compila TypeScript a `lib/`
- `npm run lint`: ejecuta ESLint sobre `src/**/*.ts`
- `npm run deploy:auto`: compila y despliega Functions automaticamente
- `npm run clean`: elimina carpeta `lib/`

## Despliegue automatico

Este script de despliegue automatico soporta solo Linux.

Desde la raiz del workspace:

```bash
./deploy-functions.sh
```

Opcionalmente puedes indicar proyecto:

```bash
./deploy-functions.sh <firebase-project-id>
```

Tambien puedes usar el script desde `functions/`:

```bash
npm run deploy:auto -- <firebase-project-id>
```

## Estructura principal

- `src/index.ts`: Cloud Function v2 `api`
- `src/app.ts`: instancia de Express y montaje de routers
- `src/middleware`: autenticacion y manejo global de errores
- `src/modules`: modulos por dominio (rescate, veterinaria, donaciones, administracion, comunidad)
- `src/shared`: wrappers para Firestore, FCM, pagos mock y utilidades

## Autenticacion y autorizacion

Todos los endpoints requieren `Authorization: Bearer <token>` valido de Firebase Auth.
El rol se resuelve desde la coleccion `usuarios` y se valida con `requireRole(...)`.

## Nota de pagos

`src/shared/payment.service.ts` usa una implementacion mock (90% de exito).
Ese servicio esta preparado para reemplazar internamente la llamada por Stripe o MercadoPago sin modificar la logica de negocio de los modulos.
