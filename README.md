# VetWeb - Plataforma Veterinaria

VetWeb quedó consolidado sobre una sola base: monorepo con frontend React, backend NestJS, PostgreSQL, Prisma y Docker Compose. La superficie Firebase anterior fue retirada del flujo principal para que el repositorio responda a una arquitectura única, mantenible y desplegable.

## Stack actual

- Frontend: React 19 + TypeScript + Vite en `apps/web`
- Backend: NestJS + TypeScript en `apps/api`
- Base de datos: PostgreSQL 16
- ORM: Prisma
- Auth: JWT con registro/login propio
- Infra local: Docker Compose

## Arquitectura

- `apps/web`: SPA React con rutas para sitio público, portal cliente, portal staff y panel admin
- `apps/api`: API modular NestJS con dominios `auth`, `users`, `rescue`, `veterinary`, `donations`, `community` y `admin`
- `apps/api/prisma/schema.prisma`: modelo relacional central
- `docker-compose.yml`: orquestación de `postgres`, `api` y `web`

## Modelo funcional migrado

Esta reescritura contempla el mismo alcance funcional alto de la versión anterior:

- Rescate y reportes de abandono
- Gestión de mascotas
- Citas veterinarias y agenda
- Historial médico
- Campañas comunitarias e inscripciones
- Donaciones y apadrinamientos
- Inventario básico de suministros
- Roles: `CITIZEN`, `OWNER`, `VOLUNTEER`, `DONOR`, `VETERINARIAN`, `ADMIN`

## Arranque local con Docker

1. Copia `.env.example` a `.env` si quieres cambiar variables.
2. Ejecuta:

```bash
npm install
docker compose up --build
```

Servicios esperados:

- Web: http://localhost:5173
- API: http://localhost:3000/api
- Swagger: http://localhost:3000/docs
- PostgreSQL: localhost:5432

Credenciales demo cargadas por seed:

- Admin: `admin@vetweb.local` / `Admin12345!`
- Dueño: `owner@vetweb.local` / `VetWeb123!`
- Veterinaria: `vet@vetweb.local` / `VetWeb123!`
- Ciudadano: `citizen@vetweb.local` / `VetWeb123!`
- Voluntaria: `volunteer@vetweb.local` / `VetWeb123!`
- Donante: `donor@vetweb.local` / `VetWeb123!`

Datos demo incluidos:

- 2 mascotas (`Luna`, `Simba`)
- 2 citas
- 1 historial medico
- 1 campana comunitaria con 2 inscripciones
- 1 reporte de rescate
- 1 donacion
- 1 apadrinamiento
- 2 suministros de inventario

## Arranque local sin Docker

1. Levanta PostgreSQL localmente.
2. Usa el `DATABASE_URL` de `.env.example` o uno equivalente.
3. Ejecuta:

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

## Scripts principales

```bash
npm run dev
npm run build
npm run db:generate
npm run db:push
npm run db:seed
npm run docker:up
npm run docker:down
```

## Login

- Desde la UI, usa el modal de autenticacion y cualquiera de las credenciales demo.
- Contra API directa, el login se hace en `POST /api/auth/login` con `email` y `password`.

## Funcionalidades implementadas

- Registro y login con JWT para roles auto-registrables
- Consulta publica de campanas y veterinarios disponibles
- Alta y consulta de mascotas para propietario y admin
- Creacion de citas para mascotas del usuario autenticado
- Agenda para veterinaria y admin
- Creacion de historial medico para veterinaria y admin
- Reportes de rescate para ciudadano, voluntariado y admin
- Donaciones y apadrinamientos para donante y admin
- Metricas, usuarios e inventario para admin

## Estado del repositorio

- La implementacion activa vive en `apps/api` y `apps/web`.
- El repositorio ya no depende de Firebase, Firestore ni Cloud Functions para operar localmente.
