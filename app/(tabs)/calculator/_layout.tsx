import { Stack } from 'expo-router';
import React from 'react';

export default function CalculatorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Calculadora',
        }}
      />
      <Stack.Screen
        name="drilling"
        options={{
          title: 'Barrenado',
        }}
      />
      <Stack.Screen
        name="milling"
        options={{
          title: 'Fresado',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Configuración',
        }}
      />
    </Stack>
  );
}