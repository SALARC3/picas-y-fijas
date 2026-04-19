# 🎯 Picas y Fijas

Implementación del clásico juego de **Picas y Fijas** (Bulls and Cows) usando **Arquitectura Hexagonal** en TypeScript.

El jugador debe adivinar un número secreto de 4 dígitos únicos. Tras cada intento recibe:

- **Fijas**: dígitos correctos en la posición correcta.
- **Picas**: dígitos correctos en una posición incorrecta.

## 🎮 Modos de Juego

| Modo | Descripción |
|------|-------------|
| **1 Jugador** | Partida individual contra el sistema |
| **2 Jugadores** | Competencia por turnos entre dos jugadores |

---

## 📐 Arquitectura

El proyecto sigue los principios de **Arquitectura Hexagonal (Ports & Adapters)**, separando claramente dominio, aplicación e infraestructura.

```
src/
├── game/                          # Módulo: Partidas (single-player y multiplayer)
│   ├── domain/
│   │   ├── entities/              # SinglePlayerGame, MultiplayerGame
│   │   └── value_objects/         # GameState, PlayerTurn, MultiplayerResult
│   ├── application/
│   │   ├── ports/                 # SinglePlayerGameRepository, MultiplayerGameRepository
│   │   ├── use-cases/             # StartSinglePlayerGame, MakeGuessInGame,
│   │   │                          # GetGameStatus, GetSinglePlayerRanking,
│   │   │                          # StartMultiplayerGame, MakeMultiplayerGuess,
│   │   │                          # GetMultiplayerGameStatus
│   │   ├── dto/                   # SinglePlayerGameDTO, MultiplayerGameDTO,
│   │   │                          # SinglePlayerRankingElementDTO
│   │   └── mappers/               # SinglePlayerGameMapper, MultiplayerGameMapper
│   └── infrastructure/
│       ├── input/                 # ExpressGameAdapter, ConsoleGameAdapter,
│       │                          # ConsoleMultiplayerAdapter, BrowserGameAdapter
│       └── output/                # FileSystem, MySQL, LocalStorage repos
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
| **Dominio** | Entidades (`Trivia`, `Player`, `SinglePlayerGame`, `MultiplayerGame`), Value Objects (`SecretNumber`, `Guess`, `GuessResult`, `Nickname`, `GameState`, `PlayerTurn`, `MultiplayerResult`) y reglas de negocio. Sin dependencias externas. |
| **Aplicación** | Casos de uso, DTOs, mappers y **puertos** (interfaces). Orquesta la lógica de dominio. |
| **Infraestructura** | **Adaptadores de entrada** (Express, Consola, Browser) y **adaptadores de salida** (FileSystem, MySQL, LocalStorage). Implementan los puertos. |

### Puertos (Interfaces)

| Puerto | Métodos |
|---|---|
| `SinglePlayerGameRepository` | `save()`, `findById()`, `findAll()` |
| `MultiplayerGameRepository` | `save()`, `findById()`, `findAll()` |
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
# Modo 1 jugador
npm run start-console

# Modo 2 jugadores
npm run start-console-multiplayer
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

### Endpoints Multiplayer

#### `POST /multiplayer/games` — Iniciar partida 2 jugadores

```json
// Request
{ "nickname1": "jugador1", "nickname2": "jugador2" }

// Response 201
{
  "id": "uuid",
  "player1": { "playerId": "uuid", "playerNickname": "jugador1", "guesses": [], "attemptsCount": 0, "score": null },
  "player2": { "playerId": "uuid", "playerNickname": "jugador2", "guesses": [], "attemptsCount": 0, "score": null },
  "currentTurn": "PLAYER_1",
  "currentPlayerId": "uuid",
  "state": "PLAYING",
  "result": null,
  "winnerId": null,
  "winnerNickname": null
}
```

#### `POST /multiplayer/games/:gameId/guesses` — Hacer intento (turno)

```json
// Request
{ "playerId": "uuid", "guess": "1234" }

// Response 200
{
  "id": "uuid",
  "player1": { "guesses": [{ "guess": "1234", "picas": 1, "fijas": 2 }], ... },
  "player2": { ... },
  "currentTurn": "PLAYER_2",
  "state": "PLAYING",
  ...
}
```

#### `GET /multiplayer/games/:gameId` — Consultar estado

```json
// Response 200
{
  "id": "uuid",
  "player1": { ... },
  "player2": { ... },
  "currentTurn": "PLAYER_1",
  "state": "FINISHED",
  "result": "PLAYER_1_WINS",
  "winnerId": "uuid",
  "winnerNickname": "jugador1"
}
```

---

## 👥 Reglas Multiplayer

En el modo 2 jugadores, cada jugador tiene su propio número secreto a adivinar. El juego sigue estas reglas:

1. **Turnos alternados**: Comienza el Jugador 1, luego alterna con cada intento fallido.
2. **Mecánica de Equalizer**: Cuando un jugador acierta, el otro tiene **una oportunidad** de empatar.
3. **Resolución por puntaje**: Si ambos aciertan, gana quien tenga mejor puntaje.
4. **Empate**: Si ambos aciertan con el mismo puntaje, la partida termina en empate.

### Flujo del juego

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  PLAYER_1   │────▶│  PLAYER_2   │────▶│  PLAYER_1   │ ...
│   intenta   │     │   intenta   │     │   intenta   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       ▼                   ▼
   ¿Acierta?           ¿Acierta?
       │                   │
       ▼                   ▼
  Activar             Activar
  Equalizer           Equalizer
       │                   │
       ▼                   ▼
┌─────────────────────────────────────┐
│  Oponente tiene 1 intento para     │
│  igualar. Si falla, pierde.        │
│  Si acierta, se comparan scores.   │
└─────────────────────────────────────┘
```

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
| `npm run start-console` | Inicia el juego en consola — 1 jugador |
| `npm run start-console-multiplayer` | Inicia el juego en consola — 2 jugadores |
| `npm run start-http` | Inicia la API REST Express (puerto 3000) |
| `npm run start-www` | Sirve el frontend www (puerto 8080) |
| `npm run build-front` | Empaqueta el frontend standalone |
| `npm run start-front` | Sirve el frontend standalone (puerto 8080) |
| `npm test` | Ejecuta los tests unitarios |

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
- **Testing**: Jest + ts-jest

---

## 📐 Principios de Diseño

### Arquitectura Hexagonal (Ports & Adapters)

El proyecto implementa una separación estricta de capas:

```
                    ┌─────────────────────────────────┐
                    │       ADAPTADORES ENTRADA       │
                    │  Express, Consola, Browser      │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │         CAPA APLICACIÓN         │
                    │   Use Cases, DTOs, Mappers      │
                    │                                 │
                    │  ┌─────────┐     ┌─────────┐   │
                    │  │ PUERTOS │     │ PUERTOS │   │
                    │  │ ENTRADA │     │ SALIDA  │   │
                    │  └────┬────┘     └────┬────┘   │
                    └───────┼───────────────┼────────┘
                            │               │
                    ┌───────▼───────────────▼────────┐
                    │          CAPA DOMINIO          │
                    │   Entidades, Value Objects     │
                    │      Reglas de Negocio         │
                    └────────────────────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │      ADAPTADORES SALIDA         │
                    │  FileSystem, MySQL, LocalStorage│
                    └─────────────────────────────────┘
```

**Beneficios aplicados:**
- El dominio no conoce la infraestructura (independencia)
- Los adaptadores son intercambiables (FileSystem ↔ MySQL ↔ LocalStorage)
- Los casos de uso dependen de interfaces (puertos), no de implementaciones

### Principios SOLID

| Principio | Aplicación en el Proyecto |
|-----------|---------------------------|
| **S**ingle Responsibility | Cada clase tiene una única responsabilidad: `MultiplayerGame` maneja la lógica de turnos, `MakeMultiplayerGuess` orquesta el caso de uso, `FileSystemMultiplayerGameRepository` persiste datos. |
| **O**pen/Closed | Nuevos repositorios se agregan implementando `MultiplayerGameRepository` sin modificar casos de uso existentes. |
| **L**iskov Substitution | Cualquier implementación de `MultiplayerGameRepository` (FileSystem, MySQL, LocalStorage) es intercambiable sin afectar el comportamiento. |
| **I**nterface Segregation | Interfaces pequeñas y específicas: `IdProvider` solo genera IDs, `TriviaRepository` solo persiste trivias. |
| **D**ependency Inversion | Los casos de uso dependen de abstracciones (`MultiplayerGameRepository`), no de implementaciones concretas (`FileSystemMultiplayerGameRepository`). |

### Programación Orientada a Objetos

| Concepto | Implementación |
|----------|----------------|
| **Encapsulamiento** | Estado privado en `MultiplayerGame` (`_currentTurn`, `_state`, `_result`) con getters públicos. Lógica interna protegida. |
| **Abstracción** | Interfaces como `MultiplayerGameRepository` abstraen los detalles de persistencia. Value Objects abstraen conceptos de dominio. |
| **Herencia** | No se usa herencia de clases para evitar acoplamiento. Se prefiere composición. |
| **Polimorfismo** | Múltiples implementaciones de repositorios (`FileSystem`, `MySQL`, `LocalStorage`) con la misma interfaz. |

### Clean Code

| Práctica | Ejemplo |
|----------|---------|
| **Nombres descriptivos** | `validateTurn()`, `processGuessResult()`, `resolveByScore()`, `waitingForEqualizer` |
| **Funciones pequeñas** | Cada método hace una sola cosa. `switchTurn()` solo cambia turno, `finish()` solo finaliza. |
| **Sin comentarios innecesarios** | El código es autoexplicativo. Los nombres revelan la intención. |
| **Manejo de errores** | Excepciones con mensajes claros: "No es tu turno", "La partida ya terminó". |
| **DRY (Don't Repeat Yourself)** | Mappers reutilizables (`mapPlayerDTO`), lógica centralizada en entidades. |
| **Inmutabilidad** | Value Objects inmutables (`PlayerTurn`, `MultiplayerResult`). Factory methods para creación controlada. |
| **Early Returns** | Validaciones al inicio de métodos para evitar anidación profunda. |

### Patrones de Diseño Aplicados

| Patrón | Uso |
|--------|-----|
| **Factory Method** | `MultiplayerGame.create()` para creación con validación, `MultiplayerGame.restore()` para reconstitución. |
| **Repository** | Abstracción de persistencia con múltiples implementaciones intercambiables. |
| **DTO (Data Transfer Object)** | `MultiplayerGameDTO` para transferir datos entre capas sin exponer entidades. |
| **Mapper** | Funciones puras para convertir entidades a DTOs (`toMultiplayerGameDTO`). |
| **Value Object** | Enums inmutables (`PlayerTurn`, `GameState`, `MultiplayerResult`) que representan conceptos de dominio. |
| **Dependency Injection** | Inyección de dependencias vía constructor en todos los casos de uso. |
