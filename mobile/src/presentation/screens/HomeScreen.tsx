import React from "react";
import { View, Text, Button, Alert } from "react-native";
import { useAuth } from "../../store/auth";
import { useMutation } from "@tanstack/react-query";
import { container } from "../../infrastructure/container";

export default function HomeScreen() {
  const { user, clear } = useAuth();

  const me = useMutation({
    mutationFn: () => container.authRepo.me(),
  });

  const handleMe = async () => {
    try {
      await me.mutateAsync();
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.message ?? e?.message ?? "No se pudo consultar /me"
      );
    }
  };

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18 }}>Hola, {user?.name ?? user?.email}</Text>

      <Button
        title={me.isPending ? "Consultando…" : "Probar /me"}
        onPress={handleMe}
      />

      {me.data ? (
        <Text style={{ fontFamily: "Courier" }}>{JSON.stringify(me.data)}</Text>
      ) : null}

      <Button title="Cerrar sesión" color="crimson" onPress={clear} />
    </View>
  );
}
