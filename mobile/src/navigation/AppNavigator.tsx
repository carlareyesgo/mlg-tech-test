import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../store/auth";
import LoginScreen from "../presentation/screens/LoginScreen";
import RegisterScreen from "../presentation/screens/RegisterScreen";
import HomeScreen from "../presentation/screens/HomeScreen";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, accessToken } = useAuth();

  const isLoggedIn = !!(user && accessToken);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isLoggedIn ? (
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: "Inicio" }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: "Iniciar sesión" }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: "Crear cuenta" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
