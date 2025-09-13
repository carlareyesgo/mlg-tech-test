# MLG Tech Test — Backend (.NET 8, Minimal API + JWT)

Backend de autenticación para la prueba técnica: **register / login / me / refresh** con **JWT (HS256)**, **BCrypt**, **Swagger**, **CORS**, y **almacenamiento in-memory** (usuarios + refresh tokens). Arquitectura basada en capas tipo Clean.

## Requisitos
- .NET SDK 8.x (`dotnet --info`)
- macOS/Windows/Linux
- (Opcional) `openssl` para generar claves y `curl`/`jq` para probar

## Estructura

backend/
src/
MLG.Auth.sln
MLG.Auth.Api/ # Minimal API + Swagger + JwtBearer
MLG.Auth.Domain/ # Entidades/contratos (User, IUserRepository)
MLG.Auth.Application/ # (reservado para casos de uso)
MLG.Auth.Infrastructure/ # Repo in-memory + JwtTokenService + InMemoryRefreshStore


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

## Detalles técnicos

NET 8 con Minimal APIs.

JwtBearer configurado con:

MapInboundClaims = false (evita renombrado automático de claims).

Validación de lifetime/clave y ClockSkew = 0.

Claims emitidas: sub, email, typ = access/refresh.

/me busca sub/email y soporta también ClaimTypes.NameIdentifier/Email.

BCrypt para hash de contraseñas.

InMemoryUserRepository (usuarios) y InMemoryRefreshStore (refresh tokens).

Swagger con esquema Bearer para pruebas.

CORS abierto en DEV (ajustar para PROD).





