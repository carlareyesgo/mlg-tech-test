import "react-native-gesture-handler";
import "react-native-reanimated";
import React from "react";
import AuthProvider from "./src/auth/AuthProvider";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
