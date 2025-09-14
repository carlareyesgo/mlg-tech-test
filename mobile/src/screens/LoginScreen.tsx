import React from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { Formik } from "formik";
import * as Yup from "yup";
import { login } from "../api/auth";
import { useAuth } from "../store/auth";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

const schema = Yup.object({
  email: Yup.string().email("Email inválido").required("Requerido"),
  password: Yup.string().min(6).required("Requerido"),
});

export default function LoginScreen({ navigation }: Props) {
  const setAuth = useAuth((s) => s.setAuth);

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>Bienvenida 👋</Text>

      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            const { user, tokens } = await login(values.email, values.password);
            setAuth(user, tokens.accessToken, tokens.refreshToken);
          } catch (e: any) {
            Alert.alert(
              "Error",
              e?.response?.data?.message ?? "No se pudo iniciar sesión"
            );
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({
          handleChange,
          handleSubmit,
          values,
          errors,
          touched,
          isSubmitting,
        }) => (
          <View style={{ gap: 8 }}>
            <Text>Email</Text>
            <TextInput
              value={values.email}
              onChangeText={handleChange("email")}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{ borderWidth: 1, padding: 8, borderRadius: 8 }}
            />
            {touched.email && errors.email ? (
              <Text style={{ color: "red" }}>{errors.email}</Text>
            ) : null}

            <Text>Contraseña</Text>
            <TextInput
              value={values.password}
              onChangeText={handleChange("password")}
              secureTextEntry
              style={{ borderWidth: 1, padding: 8, borderRadius: 8 }}
            />
            {touched.password && errors.password ? (
              <Text style={{ color: "red" }}>{errors.password}</Text>
            ) : null}

            <Button
              title={isSubmitting ? "Ingresando…" : "Ingresar"}
              onPress={() => handleSubmit()}
            />
            <Button
              title="Crear cuenta"
              onPress={() => navigation.navigate("Register")}
            />
          </View>
        )}
      </Formik>
    </View>
  );
}
