import React, { useState } from "react";
import { View, Text, Button, Alert } from "react-native";
import { useAuth } from "../store/auth";
import { me } from "../api/auth";

export default function HomeScreen() {
  const { user, clear } = useAuth();
  const [lastMe, setLastMe] = useState<any>(null);

  const handleMe = async () => {
    try {
      const data = await me();
      setLastMe(data);
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.status === 401
          ? "Sesión expirada"
          : "No se pudo obtener /me"
      );
    }
  };

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18 }}>Hola, {user?.name ?? user?.email}</Text>
      <Button title="Llamar /me" onPress={handleMe} />
      {lastMe ? <Text>{JSON.stringify(lastMe)}</Text> : null}
      <Button title="Cerrar sesión" color="crimson" onPress={clear} />
    </View>
  );
}
