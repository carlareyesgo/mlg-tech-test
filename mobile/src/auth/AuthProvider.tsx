import React, { useEffect } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { container } from "../infrastructure/container";
import { useAuth } from "../store/auth";

const client = new QueryClient();

function SessionVerifier() {
  const { user, accessToken, setAuth, clear } = useAuth();
  const enabled = !!accessToken;

  const q = useQuery({
    queryKey: ["me"],
    queryFn: () => container.authRepo.me(),
    enabled,
    staleTime: 60_000,
    retry: 1,
  });

  // Si /me trae datos y no hay user, sincroniza
  useEffect(() => {
    if (q.data && !user)
      setAuth(
        { id: q.data.id, email: q.data.email, name: null },
        accessToken!,
        useAuth.getState().refreshToken!
      );
  }, [q.data]);

  // Si falla con 401, limpia sesión
  useEffect(() => {
    if (q.error && enabled) clear();
  }, [q.error]);

  // Escucha refresh/token/logout
  useEffect(() => {
    const onLogout = () => clear();
    container.bus.on("auth:logout", onLogout);

    return () => {
      container.bus.off("auth:logout", onLogout);
    };
  }, []);

  return null;
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={client}>
      <SessionVerifier />
      {children}
    </QueryClientProvider>
  );
}
