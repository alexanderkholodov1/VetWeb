# VetWeb - Documentacion Completa (Formato Notion)

## 1. Resumen ejecutivo

Proyecto para la organizacion POR UN AMIGO FIEL - PILLARO.
Objetivo: centralizar procesos de rescate, veterinaria, comunidad y donaciones en Firebase.

Estado actual:
- Frontend web publicado en Hosting.
- Backend API en Cloud Functions (Express).
- Autenticacion con Firebase Auth.
- Base de datos en Firestore.
- Reglas por rol desplegadas en Firestore.
- Deploy automatico por GitHub Actions para Hosting.

URL de produccion:
- https://vetweb-ec.web.app

Proyecto Firebase:
- vetweb-917b9

## 2. Arquitectura implementada

### 2.1 Frontend
- Carpeta: public
- Archivos principales:
  - index.html
  - styles.css
  - eventos.html
  - veterinarios.html
  - citas.html
  - reportes.html
  - donaciones.html
  - apadrinamiento.html
  - admin.html
  - js/firebase-client.js
  - js/site.js
  - js/forms.js
- Funciones del frontend:
  - Home publica enfocada a usuarios no tecnicos.
  - Login y registro con Firebase Auth mediante modal.
  - Creacion inicial de perfil en coleccion usuarios.
  - Seleccion de rol inicial de registro: ciudadano, dueno, voluntario, donante.
  - Flujos separados por pagina para reportes, citas, donacion y apadrinamiento.
  - Portal staff separado en admin.html con validacion de rol.
  - Lectura de campanas activas.
  - Lectura de veterinarios disponibles.
  - Mensajes de interfaz amigables para publico general.

### 2.2 Backend
- Carpeta: functions
- Stack:
  - Node.js 20
  - TypeScript
  - Firebase Functions v2
  - Express
- Entry point:
  - src/index.ts expone funcion api
- Modulos:
  - rescate
  - veterinaria
  - donaciones
  - administracion
  - comunidad
- Seguridad API:
  - middleware global de autenticacion por Bearer token
  - control de permisos con requireRole

### 2.3 Base de datos
- Firestore
- Colecciones usadas:
  - usuarios
  - campanas
  - inscripciones
  - reportes
  - mascotas
  - citas
  - atencionesmedicas
  - donaciones
  - apadrinamientos
  - suministros

## 3. Roles definidos

Roles del sistema:
- ciudadano
- dueno
- voluntario
- donante
- veterinario
- administrador

### 3.1 Criterio de roles
- Roles base (registro publico): ciudadano, dueno, voluntario, donante.
- Roles de staff (asignacion manual por admin): veterinario, administrador.

## 4. Reglas de seguridad Firestore

Archivo:
- functions/firestore.rules

Implementado:
- Usuario autenticado obligatorio para acceso de negocio.
- Resolucion de rol desde usuarios/{uid}.
- Registro de perfil inicial limitado (no puede auto-asignarse admin o veterinario).
- Lectura/escritura segmentada por coleccion y por rol.
- Fallback deny all para cualquier ruta no contemplada.

Resumen por modulo:
- usuarios:
  - create propio perfil con rol permitido
  - update propio perfil sin cambiar rol/email
  - admin puede leer/editar/eliminar cualquier perfil
- campanas:
  - lectura comunidad autenticada
  - escritura solo administrador
- inscripciones:
  - usuario crea su propia inscripcion
  - admin gestiona todo
- reportes:
  - crean: ciudadano, dueno, voluntario, admin
  - leen: admin, voluntario, o quien reporto
  - actualizar estado: admin
- mascotas/citas/atenciones:
  - flujo por dueno, veterinario y admin
- donaciones/apadrinamientos:
  - crea el propio usuario
  - admin ve todo
- suministros:
  - solo admin

## 5. Hosting y despliegue automatico

Configuracion aplicada:
- Hosting target configurado a sitio vetweb-ec.
- URL final: https://vetweb-ec.web.app

Archivos clave:
- firebase.json
- .firebaserc
- .github/workflows/firebase-hosting-merge.yml
- .github/workflows/firebase-hosting-pull-request.yml

Aclaracion de estructura:
- Se usa un unico firebase.json en la raiz del repositorio.
- Desde ese archivo se configuran Hosting, Functions, Firestore rules y Emulators.
- No se usa functions/firebase.json ni script deploy-functions.sh.

Flujo CI/CD:
- Push a main: deploy a canal live (sitio vetweb-ec).
- Pull request: preview deployment sobre mismo target configurado.

## 6. Variables y configuracion de frontend

En js/firebase-client.js:
- API base por defecto:
  - https://southamerica-east1-vetweb-917b9.cloudfunctions.net/api
- Soporte local:
  - http://127.0.0.1:5001/vetweb-917b9/southamerica-east1/api
- API base editable en UI y guardada en localStorage (vetweb_api_base).

## 7. Operacion manual recomendada

### 7.1 Crear usuarios staff
1. Crear cuenta en Auth (email/password).
2. Crear/editar documento usuarios/{uid} en Firestore.
3. Asignar rol veterinario o administrador.

### 7.2 Publicar cambios de frontend
1. Commit y push a main para CI/CD automatico.
2. O despliegue manual:
   - firebase deploy --only hosting --project vetweb-917b9

### 7.3 Publicar cambios de reglas
- firebase deploy --only firestore:rules --project vetweb-917b9

## 8. Seguridad y cumplimiento

Se agrego exclusion de llaves sensibles en gitignore:
- *firebase-adminsdk*.json

Accion obligatoria recomendada:
- Rotar/revocar cualquier service account key compartida externamente.

Buenas practicas:
- No subir archivos JSON de service accounts al repositorio.
- Usar GitHub Secrets para CI/CD.
- Evitar exponer claves en chats, tickets o capturas.

## 9. Pendientes para version productiva

Alta prioridad:
- Integrar pasarela de pago real (Stripe/MercadoPago).
- Implementar panel admin para cambio de roles en frontend.
- Crear validaciones y UX de errores mas detalladas en formularios.
- Crear seeds iniciales para campanas y veterinarios.
- Definir politica de respaldo y retencion de datos.

Media prioridad:
- Panel de mapa de abandono con visualizacion geoespacial.
- Notificaciones push FCM desde frontend con permisos.
- Historico y dashboard KPI para gerencia.

## 10. Modo de entrega para Notion

Opcion A (rapida):
- Copiar este archivo completo y pegar en una pagina de Notion.

Opcion B (import):
- En Notion usar Import -> Markdown & CSV.
- Seleccionar este archivo y los demas de docs.

## 11. Changelog de trabajo realizado

- Se reemplazo pagina default de Firebase por landing completa de VetWeb.
- Se rediseno la experiencia a arquitectura multipagina para publico no tecnico.
- Se implementaron formularios funcionales por pagina para procesos clave.
- Se conecto frontend con Auth y Firestore en cliente.
- Se dejo puente de consumo API con token Bearer.
- Se definieron y desplegaron reglas de Firestore por rol.
- Se ajusto CI/CD para hosting estatico sin paso de build inexistente.
- Se configuro target hosting para publicar especificamente en vetweb-ec.web.app.
- Se reforzo gitignore para evitar incluir llaves adminsdk.
- Se elimino app.js legacy y se separo logica en js/firebase-client.js, js/site.js y js/forms.js.
