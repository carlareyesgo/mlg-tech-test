import React from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { Formik } from "formik";
import * as Yup from "yup";
import { useLogin } from "../../auth/hooks";
import { friendlyError } from "../../utils/errors";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

const schema = Yup.object({
  email: Yup.string().email("Email inválido").required("Requerido"),
  password: Yup.string().min(6, "Mínimo 6 caracteres").required("Requerido"),
});

export default function LoginScreen({ navigation }: Props) {
  const login = useLogin();
  const [formError, setFormError] = React.useState<string | null>(null);

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>Bienvenida 👋</Text>

      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting }) => {
          setFormError(null);
          login.reset();
          try {
            await login.mutateAsync(values);
          } catch (e) {
            Alert.alert("Error", friendlyError(e, "login"));
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
              onChangeText={(t) => {
                setFormError(null);
                handleChange("email")(t);
              }}
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
              onChangeText={(t) => {
                setFormError(null);
                handleChange("password")(t);
              }}
              secureTextEntry
              style={{ borderWidth: 1, padding: 8, borderRadius: 8 }}
            />
            {touched.password && errors.password ? (
              <Text style={{ color: "red" }}>{errors.password}</Text>
            ) : null}

            <Button
              title={
                isSubmitting || login.isPending ? "Ingresando…" : "Ingresar"
              }
              onPress={() => handleSubmit()}
              disabled={isSubmitting || login.isPending}
            />

            <Button
              title="Crear cuenta"
              onPress={() => navigation.navigate("Register")}
            />

            {formError ? (
              <Text style={{ color: "red" }}>{formError}</Text>
            ) : null}
          </View>
        )}
      </Formik>
    </View>
  );
}
