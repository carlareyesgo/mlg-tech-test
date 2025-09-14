## Teoría y preguntas abiertas

## 5.1. Tres amenazas comunes en apps móviles bancarias y cómo mitigarlas

1.- Ataques Man-in-the-Middle (MiTM) / redes inseguras

Riesgo: intercepción de tráfico si el atacante controla el Wi-Fi o instala un proxy.

Mitigación:

* TLS 1.2+ obligatorio y HSTS en backend.

* Certificate/Key Pinning en la app (p. ej. react-native-pinch o pinning nativo).

* Rechazar HTTP plano; validar fechas/cadena del certificado; fail-closed ante errores de verificación.

2.- Exfiltración de credenciales o tokens desde el dispositivo

Riesgo: robo de tokens si se guardan en almacenamiento no cifrado (AsyncStorage, logs).

Mitigación:

* Guardar solo en Keychain (iOS) / Keystore (Android) vía expo-secure-store o react-native-keychain.

* Tokens de corta vida + refresh rotation (revocar el refresh usado).

* No registrar secretos en logs; ofuscar/cifrar datos extremadamente sensibles lado servidor.

3.- Dispositivo comprometido (root/jailbreak) y tampering

Riesgo: hooks, instrumentación, lectura de memoria, modificación de la app.

Mitigación:

* Detección de root/jailbreak, debugger detection, emulator detection.

* Integrity/Attestation (Play Integrity / DeviceCheck).

* Ofuscación/anti-tampering y validaciones de firma.

## Diferencias entre almacenamiento seguro en iOS y Android

* iOS – Keychain

Cifrado por sistema; puede integrar Secure Enclave.

Políticas de acceso (p. ej., WhenUnlocked, AfterFirstUnlock, biometryAny).

Soporte de Keychain Access Groups y sincronización con iCloud (opcional).

* Android – Keystore + EncryptedSharedPreferences

Keystore genera/gestiona claves por app (a menudo en hardware-backed si disponible).

Datos de aplicación se cifran con una clave simétrica protegida por Keystore.

Semántica de desbloqueo/biometría diferente (StrongBox/TEE); cuidado con backup/restore.

## ¿Cómo aplicarías Adapter al integrar EncryptedStorage?

1.- Defino un contrato agnóstico a librería:

```TS
export interface ISecureStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}
```
2.- Implemento un Adapter sobre la librería elegida (ej.: expo-secure-store):

```TS

import * as SecureStore from 'expo-secure-store';
export class SecureStoreAdapter implements ISecureStorage {
  async get(k: string){ return (await SecureStore.getItemAsync(k)) ?? null; }
  async set(k: string, v: string){ await SecureStore.setItemAsync(k, v); }
  async delete(k: string){ await SecureStore.deleteItemAsync(k); }
}
```
3.- Inyecto ISecureStorage donde lo necesito (Zustand persist, servicios), sin acoplar la UI a la librería concreta.


## ¿Qué ventaja ofrece react-query sobre Redux para datos asincrónicos?

* Cache orientada a servidor (staleTime, GC, revalidación).

* Deduplicación de peticiones y retry automáticos.

* Refetch en background, window focus y network reconnection.

* Estados derivados (isLoading, isError, isFetching) sin boilerplate.

* Deja Redux/Zustand para client state (UI flags), y react-query para server state.


## ¿Qué patrón aplicarías para aislar reglas de negocio del UI?

Clean Architecture + Dependency Inversion (Domain aislado) con Use Cases y Repositories.

La UI depende de abstracciones (interfaces en domain), y las implementaciones viven en data/infrastructure y se resuelven por DI.

Beneficios: testeabilidad, reemplazo de fuentes (mock/API/offline), y escalabilidad.

## Sección 6: Refactor de código inseguro

* api.ts

```TS
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://api.banco.com'; // HTTPS obligatorio
export const api = axios.create({ baseURL: BASE_URL, timeout: 8000 });

const TOKENS_KEY = 'auth_tokens';

export async function getTokens() {
  const v = await SecureStore.getItemAsync(TOKENS_KEY);
  return v ? JSON.parse(v) as { accessToken: string; refreshToken?: string } : null;
}
export async function setTokens(accessToken: string, refreshToken?: string) {
  await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify({ accessToken, refreshToken }));
}
export async function clearTokens() {
  await SecureStore.deleteItemAsync(TOKENS_KEY);
}

// Bearer en cada request
api.interceptors.request.use(async (cfg) => {
  if (!cfg.baseURL?.startsWith('https://')) throw new Error('HTTPS requerido');
  const t = await getTokens();
  if (t?.accessToken) cfg.headers.Authorization = `Bearer ${t.accessToken}`;
  return cfg;
});
```

* auth.ts

```TS
import { api, setTokens } from './api';

export async function login(email: string, password: string) {
  try {
    const { data } = await api.post('/login', { email, password });
    const at = data.tokens?.accessToken ?? data.accessToken ?? data.token;
    const rt = data.tokens?.refreshToken;

    if (!at) throw new Error('Token inválido');
    await setTokens(at, rt);
    return data.user ?? null; // devolver user para la UI
  } catch (e: any) {
    const status = e?.response?.status;
    const serverMsg = e?.response?.data?.message;
    if (status === 401) throw new Error('Correo o contraseña inválidos. Si no tienes cuenta, regístrate.');
    if (!status)   throw new Error('No se pudo conectar con el servidor. Revisa tu red.');
    throw new Error(serverMsg || 'No se pudo iniciar sesión.');
  }
}
```
* Uso en la pantalla

```TS
const handleSubmit = async () => {
  setLoading(true);
  try {
    const user = await login(values.email, values.password);
    navigation.replace('Home');  // ahora sí
  } catch (err: any) {
    Alert.alert('Error', err.message);
  } finally {
    setLoading(false);
  }
};
```
