import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { StyleSheet, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inTabsGroup = segments[0] === '(tabs)';

    if (!user && inTabsGroup) {
      router.replace('/(auth)/login');
    } else if (user && segments[0] === '(auth)') {
      router.replace('/');
    }
  }, [user, loading, segments, router]);

  // Custom loading screen with animation
  if (loading) {
    return (
      <LinearGradient
        colors={['#fef1e1', '#ffffff', '#dfe8e6']}
        style={styles.loadingContainer}
        locations={[0, 0.5, 1]}
      >
        <View style={styles.loadingContent}>
          <View style={styles.loadingLogo}>
            <LinearGradient
              colors={['#fc350b', '#a0430a']}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Animated.Text style={styles.logoText}>T</Animated.Text>
            </LinearGradient>
          </View>
          <Animated.View style={styles.loadingBar}>
            <LinearGradient
              colors={['#fc350b', '#a0430a']}
              style={styles.loadingProgress}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor="#fef1e1" />
      <Stack
        screenOptions={{
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
          headerBackTitleStyle: styles.headerBackTitle,
          headerTintColor: '#fc350b',
          headerShadowVisible: false,
          contentStyle: styles.content,
          headerBackground: () => (
            <LinearGradient
              colors={['#ffffff', '#fef1e1']}
              style={styles.headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          ),
        }}
      >
        <Stack.Screen 
          name="(auth)" 
          options={{ 
            headerShown: false,
            animation: 'fade',
          }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right',
          }} 
        />
        <Stack.Screen 
          name="+not-found" 
          options={{
            title: '404 - Page Not Found',
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        {/* Additional screens for better navigation */}
        <Stack.Screen 
          name="task/[id]" 
          options={{
            title: 'Task Details',
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="project/[id]" 
          options={{
            title: 'Project Details',
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="workspace/[id]" 
          options={{
            title: 'Workspace',
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="workspace/[id]/members" 
          options={{
            title: 'Workspace Members',
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="project/create" 
          options={{
            title: 'Create Project',
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen 
          name="task/create" 
          options={{
            title: 'Create Task',
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    gap: 24,
  },
  loadingLogo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#fc350b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fef1e1',
    fontFamily: 'Inter_700Bold',
  },
  loadingBar: {
    width: 200,
    height: 4,
    backgroundColor: '#fc350b20',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    width: '60%',
    height: '100%',
    borderRadius: 2,
  },
  header: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
  headerGradient: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#fc350b20',
  },
  headerTitle: {
    color: '#a0430a',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  headerBackTitle: {
    color: '#fc350b',
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  content: {
    backgroundColor: 'transparent',
  },
});