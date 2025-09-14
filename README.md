# MLG Tech Test — Backend (.NET 8, Minimal API + JWT)

Backend de autenticación para la prueba técnica: **register / login / me / refresh** con **JWT (HS256)**, **BCrypt**, **Swagger**, **CORS**, y **almacenamiento in-memory** (usuarios + refresh tokens). Arquitectura basada en capas tipo Clean.

## Requisitos
- Node 18+ / npm
- Expo CLI (se instala al volar)
- iOS Simulator (Xcode) y/o Android SDK (opcional)
- Backend corriendo en `http://localhost:5296` (o el host/puerto que corresponda)

## Variables de entorno

Crea un archivo `.env` en `mobile/` (no se versiona) a partir de `.env.example`:

```env
EXPO_PUBLIC_API_URL_IOS=http://localhost:5296
EXPO_PUBLIC_API_URL_ANDROID=http://10.0.2.2:5296
```


## Configuración de JWT
La firma usa **HS256** y requiere una clave de **≥ 32 bytes**.

**Opción recomendada — User Secrets (no se commitea)**
```bash
cd backend/src/MLG.Auth.Api
dotnet user-secrets init
openssl rand -hex 64
dotnet user-secrets set "Jwt:Key" "PEGA_AQUI_TU_CLAVE_LARGA"
```   

## Ejecutar

cd backend/src/MLG.Auth.Api
dotnet restore
dotnet build
dotnet run

## Endpoints
POST /api/auth/register → crea usuario y devuelve { user, tokens }

POST /api/auth/login → autentica y devuelve { user, tokens }

GET /api/auth/me → requiere Authorization: Bearer <accessToken>

POST /api/auth/refresh → body { "refreshToken": "..." }. Rota e invalida el refresh anterior


# Registro
curl -X POST http://localhost:5296/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"carla@test.com","password":"123456","name":"Carla"}'

# Login (recibe { user, tokens })
curl -s -X POST http://localhost:5296/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"carla@test.com","password":"123456"}'

# /me (usa tokens.accessToken del login)
ACCESS='PEGA_EL_ACCESS_TOKEN'
curl -i http://localhost:5296/api/auth/me -H "Authorization: Bearer $ACCESS"

# Refresh (genera nuevo par de tokens)
REFRESH='PEGA_EL_REFRESH_TOKEN'
curl -i -X POST http://localhost:5296/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH\"}"

## Resumen por capas

domain: contratos y modelos (agnóstico a librerías).

data: repos concretos que hablan con la API.

infrastructure: adapters de librerías y composición (axios, secure storage, interceptores, event bus).

presentation: pantallas, navegación y hooks de UI



## Patrones de diseño usados

1.- Repository (domain/AuthRepository.ts, data/ApiAuthRepository.ts)

Desacopla la UI de la fuente de datos. La pantalla no sabe si los datos vienen de REST, cache o mock; depende del contrato.

2.- Adapter

infrastructure/SecureStoreAdapter.ts: encapsula expo-secure-store con una interfaz mínima (ISecureStorage).

infrastructure/AxiosClient.ts: centraliza la creación de axios y la elección de baseURL por plataforma (iOS vs Android), evitando hardcodes en UI.

3.- Factory / Dependency Injection (DI) (infrastructure/container.ts)

Crea e inyecta instancias (axios, repos, bus de eventos) en un solo punto.

Añade interceptores (Authorization + refresh on 401) sin tocar la UI.

4.- Observer (Event Bus) (container.ts con mitt)

Emite eventos globales (auth:logout, auth:tokenRefreshed) que escucha el AuthProvider. Esto permite reaccionar a expiración de token y logout desde cualquier capa.

