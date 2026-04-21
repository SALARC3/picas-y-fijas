# 🎯 Picas y Fijas

Implementación del clásico juego de **Picas y Fijas** (Bulls and Cows) usando **Arquitectura Hexagonal** en TypeScript.

El jugador debe adivinar un número secreto de 4 dígitos únicos. Tras cada intento recibe:

- **Fijas**: dígitos correctos en la posición correcta.
- **Picas**: dígitos correctos en una posición incorrecta.

---

## 📐 Arquitectura

El proyecto sigue los principios de **Arquitectura Hexagonal (Ports & Adapters)**, separando claramente dominio, aplicación e infraestructura.

```
src/
├── game/                          # Módulo: Partida single-player
│   ├── domain/entities/           # SinglePlayerGame
│   ├── application/
│   │   ├── ports/                 # SinglePlayerGameRepository
│   │   ├── use-cases/             # StartSinglePlayerGame, MakeGuessInGame,
│   │   │                          # GetGameStatus, GetSinglePlayerRanking
│   │   ├── dto/                   # SinglePlayerGameDTO, SinglePlayerRankingElementDTO
│   │   └── mappers/               # SinglePlayerGameMapper
│   └── infrastructure/
│       ├── input/                 # ExpressGameAdapter, ConsoleGameAdapter,
│       │                          # BrowserGameAdapter
│       └── output/                # FileSystem, MySQL, LocalStorage repos
│
├── multiplayer/                   # Módulo: Partida multijugador
│   ├── domain/
│   │   ├── entities/              # MultiPlayerGame, PlayerSession
│   │   └── value_objects/         # MultiPlayerGameState
│   ├── application/
│   │   ├── ports/                 # MultiPlayerGameRepository
│   │   ├── use-cases/             # CreateMultiPlayerGame, JoinMultiPlayerGame,
│   │   │                          # StartMultiPlayerGame, MakeGuessInMultiPlayerGame,
│   │   │                          # GetMultiPlayerGameStatus
│   │   ├── dto/                   # MultiPlayerGameDTO, PlayerSessionDTO
│   │   └── mappers/               # MultiPlayerGameMapper
│   └── infrastructure/output/     # FileSystem, MySQL, LocalStorage repos
│
├── trivia/                        # Módulo: Trivia (lógica del acertijo)
│   ├── domain/
│   │   ├── entities/              # Trivia
│   │   └── value_objects/         # SecretNumber, Guess, GuessResult
│   ├── application/
│   │   ├── ports/                 # TriviaRepository
│   │   ├── use-cases/             # CreateTrivia, MakeGuess, GetTriviaSummary
│   │   └── dto/                   # TriviaDTO
│   └── infrastructure/output/     # FileSystem, MySQL, LocalStorage repos
│
├── player/                        # Módulo: Jugador
│   ├── domain/
│   │   ├── entities/              # Player
│   │   └── value_objects/         # Nickname
│   ├── application/
│   │   ├── ports/                 # IPlayerRepository
│   │   └── use-cases/             # GetOrCreatePlayer
│   └── infrastructure/output/     # FileSystem, MySQL, LocalStorage repos
│
└── shared/                        # Módulo: Compartido
    ├── application/ports/         # IdProvider, SecretProvider
    └── infrastructure/output/     # UuidV4IdProvider, DotEnvSecretProvider,
                                   # MySqlConnectionPool
```

### Capas

| Capa | Responsabilidad |
|---|---|
| **Dominio** | Entidades (`Trivia`, `Player`, `SinglePlayerGame`, `MultiPlayerGame`, `PlayerSession`), Value Objects (`SecretNumber`, `Guess`, `GuessResult`, `Nickname`, `GameState`, `MultiPlayerGameState`) y reglas de negocio. Sin dependencias externas. |
| **Aplicación** | Casos de uso, DTOs, mappers y **puertos** (interfaces). Orquesta la lógica de dominio. |
| **Infraestructura** | **Adaptadores de entrada** (Express, Consola, Browser) y **adaptadores de salida** (FileSystem, MySQL, LocalStorage). Implementan los puertos. |

### Puertos (Interfaces)

| Puerto | Métodos |
|---|---|
| `SinglePlayerGameRepository` | `save()`, `findById()`, `findAll()` |
| `MultiPlayerGameRepository` | `save()`, `findById()`, `findAll()` |
| `TriviaRepository` | `save()`, `findById()` |
| `IPlayerRepository` | `save()`, `findById()`, `findByNickname()` |
| `IdProvider` | `generate()` |
| `SecretProvider` | `get(key)` |

### Adaptadores de Salida (Repositorios)

| Estrategia | Uso | Configuración |
|---|---|---|
| **FileSystem** | Desarrollo local | `ENV=DEV` (por defecto) |
| **MySQL** | Producción | `ENV=PROD` + Docker/MySQL |
| **LocalStorage** | Navegador (bundle) | Frontend standalone |

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- npm
- Docker y Docker Compose (solo para MySQL)

### Instalación

```bash
npm install
```

### Modos de Ejecución

El proyecto ofrece **3 adaptadores de entrada** diferentes:

#### 1. Consola (CLI)

```bash
npm run start-console
```

Juego interactivo por terminal. Usa repositorios FileSystem (`./data/`).

#### 2. API HTTP (Express)

```bash
npm run start-http
```

Levanta la API REST en `http://localhost:3000`. Por defecto usa FileSystem.

#### 3. Frontend en Navegador

```bash
# Opción A: Frontend que consume la API Express
npm run start-www

# Opción B: Frontend standalone con LocalStorage
npm run build-front && npm run start-front
```

- **Opción A** (`start-www`): Sirve `www/` en el puerto 8080. Requiere la API corriendo en el puerto 3000.
- **Opción B** (`build-front` + `start-front`): Empaqueta todo en `public/bundle.js` y sirve `public/` en el puerto 8080. No requiere API, usa LocalStorage.

---

## 🗄️ Base de Datos (MySQL)

Para usar MySQL como persistencia:

### 1. Levantar MySQL con Docker

```bash
docker-compose up -d
```

Esto crea un contenedor MySQL 8.0 con:
- **Base de datos**: `picasyfijas`
- **Usuario**: `picasyfijas`
- **Password**: `picasyfijas_secret`
- **Puerto**: `3306`

### 2. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
ENV=PROD
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=picasyfijas
MYSQL_PASSWORD=picasyfijas_secret
MYSQL_DATABASE=picasyfijas
```

### 3. Ejecutar con MySQL

```bash
ENV=PROD npm run start-http
```

Las tablas se crean automáticamente al iniciar la aplicación.

---

## 🌐 API REST

Base URL: `http://localhost:3000`

### Endpoints

#### `POST /games` — Iniciar partida

```json
// Request
{ "nickname": "jugador1" }

// Response 201
{
  "id": "uuid",
  "playerId": "uuid",
  "playerNickname": "jugador1",
  "triviaId": "uuid",
  "guesses": [],
  "state": "PLAYING",
  "createdAt": "2026-04-16T...",
  "updatedAt": "2026-04-16T..."
}
```

#### `POST /games/:gameId/guesses` — Hacer un intento

```json
// Request
{ "guess": "1234" }

// Response 200
{
  "id": "uuid",
  "playerNickname": "jugador1",
  "guesses": [
    { "guess": "1234", "picas": 1, "fijas": 2 }
  ],
  "state": "PLAYING",
  ...
}
```

#### `GET /games/:gameId` — Consultar estado

```json
// Response 200
{
  "id": "uuid",
  "playerNickname": "jugador1",
  "guesses": [...],
  "state": "PLAYING",
  ...
}
```

#### `GET /ranking` — Ranking de jugadores

```json
// Response 200
[
  {
    "avatarUrl": "https://api.dicebear.com/9.x/thumbs/svg?seed=jugador1",
    "playerNickname": "jugador1",
    "gamesPlayed": 5,
    "bestScore": 24500,
    "totalScore": 98000
  }
]
```

### Endpoints Multijugador

#### `POST /multiplayer` — Crear partida multijugador

```json
// Request
{ "nickname": "host_player", "maxPlayers": 4 }

// Response 201
{
  "id": "uuid",
  "hostPlayerId": "uuid",
  "maxPlayers": 4,
  "state": "WAITING",
  "winnerId": null,
  "winnerNickname": null,
  "players": [
    {
      "playerId": "uuid",
      "playerNickname": "host_player",
      "triviaId": "uuid",
      "guesses": [],
      "finished": false,
      "score": null,
      "joinedAt": "2026-04-21T..."
    }
  ],
  "createdAt": "2026-04-21T...",
  "updatedAt": "2026-04-21T..."
}
```

#### `POST /multiplayer/:gameId/join` — Unirse a partida

```json
// Request
{ "nickname": "jugador2" }

// Response 200 — Mismo formato que crear partida, con el nuevo jugador incluido
```

#### `POST /multiplayer/:gameId/start` — Iniciar partida (solo host)

```json
// Request
{ "playerId": "uuid-del-host" }

// Response 200 — Estado cambia a "PLAYING"
```

#### `POST /multiplayer/:gameId/guesses` — Hacer un intento

```json
// Request
{ "playerId": "uuid-del-jugador", "guess": "1234" }

// Response 200 — Estado de la partida con los intentos de todos los jugadores
```

#### `GET /multiplayer/:gameId` — Consultar estado de la partida

```json
// Response 200 — Mismo formato que crear partida
```

#### Flujo Multijugador

1. Un jugador crea la partida (`POST /multiplayer`) y se convierte en host.
2. Otros jugadores se unen (`POST /multiplayer/:gameId/join`) mientras el estado es `WAITING`.
3. El host inicia la partida (`POST /multiplayer/:gameId/start`). Se necesitan mínimo 2 jugadores.
4. Todos los jugadores adivinan el mismo número secreto de forma independiente (`POST /multiplayer/:gameId/guesses`).
5. El primer jugador en adivinar gana y la partida pasa a `FINISHED`.

---

## 🏆 Sistema de Puntuación

El puntaje se calcula al finalizar cada partida:

```
score = max(25 - turnos, 0) × 1000 + max(300 - segundos, 0) × 5
```

- **Bonus por turnos**: Menos intentos = más puntos (máx. 25,000).
- **Bonus por tiempo**: Menos tiempo = más puntos (máx. 1,500).
- **Puntaje máximo teórico**: 26,500 (adivinar en 1 intento, < 1 segundo).

El ranking ordena los jugadores por su **mejor puntaje**.

---

## 🧪 Scripts Disponibles

| Script | Descripción |
|---|---|
| `npm run start-console` | Inicia el juego en consola (CLI) |
| `npm run start-http` | Inicia la API REST Express (puerto 3000) |
| `npm run start-www` | Sirve el frontend www (puerto 8080) |
| `npm run build-front` | Empaqueta el frontend standalone |
| `npm run start-front` | Sirve el frontend standalone (puerto 8080) |

---

## 🛠️ Stack Tecnológico

- **Lenguaje**: TypeScript 6
- **Runtime**: Node.js + ts-node
- **HTTP**: Express 5
- **Base de datos**: MySQL 8.0 (mysql2)
- **Bundler**: esbuild
- **IDs**: uuid v4
- **Contenedores**: Docker Compose
- **Arquitectura**: Hexagonal (Ports & Adapters)
