import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Stack 
        screenOptions={{ 
          headerShown: false,
          contentStyle: styles.stackContent,
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  stackContent: {
    backgroundColor: 'transparent',
  },
});