# VetWeb - Plataforma Veterinaria y Rescate

Proyecto web para POR UN AMIGO FIEL - PILLARO, desplegado en Firebase.

URL actual:
- https://vetweb-ec.web.app

## Stack

- Frontend estatico: HTML, CSS, JavaScript en public
- Backend API: Firebase Cloud Functions v2 + Express en functions
- Base de datos: Firestore
- Auth: Firebase Authentication
- CI/CD Hosting: GitHub Actions

## Configuracion Firebase (unificada)

- Archivo unico de configuracion: firebase.json (en la raiz)
- Ese archivo contiene:
	- Hosting (public)
	- Functions (source: functions)
	- Firestore rules (functions/firestore.rules)
	- Emulators

Nota:
- Ya no se usa functions/firebase.json ni deploy-functions.sh.

## Documentacion completa

- Documento principal para Notion: docs/NOTION_VETWEB_DOCUMENTACION.md
- Checklist de entrega: docs/CHECKLIST_ENTREGA.md
- Guia para importar en Notion: docs/GUIA_NOTION.md

## Requisitos

- Node.js 20
- Firebase CLI (npm i -g firebase-tools)
- Proyecto Firebase vetweb-917b9

## Frontend

Archivos principales:
- public/index.html
- public/styles.css
- public/eventos.html
- public/veterinarios.html
- public/citas.html
- public/reportes.html
- public/donaciones.html
- public/apadrinamiento.html
- public/admin.html
- public/js/firebase-client.js
- public/js/site.js
- public/js/forms.js

Deploy manual Hosting:

firebase deploy --only hosting --project vetweb-917b9

## Backend

Instalacion:

cd functions
npm install

Build:

npm run build

Deploy functions:

firebase deploy --only functions --project vetweb-917b9

Deploy reglas de Firestore:

firebase deploy --only firestore:rules --project vetweb-917b9

## Roles

Roles del sistema:
- ciudadano
- dueno
- voluntario
- donante
- veterinario
- administrador

Reglas por rol definidas en:
- functions/firestore.rules

## Seguridad

- Se ignoran llaves de service account en git con la regla:
	- *firebase-adminsdk*.json

Recomendacion:
- Rotar cualquier service account key que haya sido compartida fuera de un canal seguro.
