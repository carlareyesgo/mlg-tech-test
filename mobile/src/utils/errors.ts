import axios, { AxiosError } from 'axios';

type Ctx = 'login' | 'register' | 'generic';

export function friendlyError(err: unknown, ctx: Ctx = 'generic'): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const serverMsg = (err.response?.data as any)?.message as string | undefined;


    if (status === 401) {
      return ctx === 'login'
        ? 'Correo o contraseña inválidos. Si no tienes cuenta, regístrate.'
        : (serverMsg || 'No autorizado.');
    }
    if (status === 400) {
      return serverMsg || 'Datos inválidos. Revisa los campos.';
    }
    if (status === 409) {
      return 'Ese correo ya está registrado. Inicia sesión.';
    }

    if ((err as AxiosError).code === 'ECONNABORTED' || err.message?.includes('Network')) {
      return 'No se pudo conectar con el servidor. Verifica tu red o que el backend esté corriendo.';
    }

    if (serverMsg) return serverMsg;

    return `Error (${status ?? 'desconocido'})`;
  }
  return 'Ocurrió un error inesperado.';
}
