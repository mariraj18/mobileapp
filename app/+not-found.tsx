import { Link, Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Home, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react-native';

export default function NotFoundScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 30,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Page Not Found',
          headerShown: true,
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTitleStyle: {
            color: '#a0430a',
            fontFamily: 'Inter_600SemiBold',
          },
          headerTintColor: '#fc350b',
          headerBackground: () => (
            <LinearGradient
              colors={['#ffffff', '#fef1e1']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          ),
        }} 
      />
      
      <LinearGradient
        colors={['#fef1e1', '#ffffff', '#dfe8e6']}
        style={styles.container}
        locations={[0, 0.5, 1]}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim }
              ]
            }
          ]}
        >
          {/* Error Illustration */}
          <View style={styles.illustrationContainer}>
            <LinearGradient
              colors={['#fc350b20', '#a0430a20']}
              style={styles.illustrationGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <AlertCircle size={64} color="#fc350b" />
            </LinearGradient>
          </View>

          {/* Error Code */}
          <LinearGradient
            colors={['#fc350b', '#a0430a']}
            style={styles.errorCode}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.errorCodeText}>404</Text>
          </LinearGradient>

          {/* Error Message */}
          <Text style={styles.title}>Oops! Page Not Found</Text>
          <Text style={styles.message}>
            The page you're looking for doesn't exist or has been moved.
          </Text>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace('/')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#fc350b', '#a0430a']}
                style={styles.primaryButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Home size={18} color="#fef1e1" />
                <Text style={styles.primaryButtonText}>Go Home</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#ffffff', '#fef1e1']}
                style={styles.secondaryButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <ArrowLeft size={18} color="#fc350b" />
                <Text style={styles.secondaryButtonText}>Go Back</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Help Links */}
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>You might also try:</Text>
            <View style={styles.helpLinks}>
              <TouchableOpacity 
                style={styles.helpLink}
                onPress={() => router.push('/')}
              >
                <LinearGradient
                  colors={['#ffffff', '#fef1e1']}
                  style={styles.helpLinkGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.helpLinkText}>Dashboard</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.helpLink}
                onPress={() => router.push('/tasks')}
              >
                <LinearGradient
                  colors={['#ffffff', '#fef1e1']}
                  style={styles.helpLinkGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.helpLinkText}>My Tasks</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.helpLink}
                onPress={() => router.push('/workspaces')}
              >
                <LinearGradient
                  colors={['#ffffff', '#fef1e1']}
                  style={styles.helpLinkGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.helpLinkText}>Workspaces</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Refresh Option */}
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => router.reload()}
          >
            <RefreshCw size={14} color="#a0430a" />
            <Text style={styles.refreshText}>Refresh page</Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  illustrationContainer: {
    marginBottom: 24,
  },
  illustrationGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fc350b30',
  },
  errorCode: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
    marginBottom: 20,
    shadowColor: '#fc350b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  errorCodeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fef1e1',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#a0430a',
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#fc350b',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    opacity: 0.9,
    paddingHorizontal: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#fc350b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fef1e1',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#fc350b30',
  },
  secondaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#fc350b',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  helpSection: {
    width: '100%',
    marginBottom: 24,
  },
  helpTitle: {
    fontSize: 14,
    color: '#a0430a',
    fontFamily: 'Inter_500Medium',
    marginBottom: 12,
    textAlign: 'center',
  },
  helpLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  helpLink: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#fc350b20',
  },
  helpLinkGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  helpLinkText: {
    fontSize: 14,
    color: '#a0430a',
    fontFamily: 'Inter_500Medium',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
  },
  refreshText: {
    fontSize: 13,
    color: '#a0430a',
    fontFamily: 'Inter_500Medium',
  },
});