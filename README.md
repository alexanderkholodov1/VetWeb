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
- public/app.js

Deploy manual Hosting:

firebase deploy --only hosting --project vetweb-917b9

## Backend

Instalacion:

cd functions
npm install

Build:

npm run build

Deploy functions:

firebase deploy --only functions --project vetweb-917b9 --config functions/firebase.json

Deploy reglas de Firestore:

firebase deploy --only firestore:rules --project vetweb-917b9 --config functions/firebase.json

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
