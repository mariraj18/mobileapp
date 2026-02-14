import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Animated, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle, XCircle, ArrowLeft, Sparkles, Shield, Award } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 35,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 45,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await register({ name, email, password });
    setLoading(false);

    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Registration Failed', result.message || 'Please try again');
    }
  };

  const checkPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { score: 0, label: 'Enter password', color: '#dfe8e6' };
    if (pass.length < 6) return { score: 1, label: 'Too short', color: '#fc350b' };
    if (pass.length < 8) return { score: 2, label: 'Weak', color: '#fc350b' };
    if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) {
      return { score: 4, label: 'Strong', color: '#a0430a' };
    }
    return { score: 3, label: 'Good', color: '#a0430a' };
  };

  const passwordStrength = checkPasswordStrength(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains number', met: /[0-9]/.test(password) },
    { label: 'Passwords match', met: passwordsMatch },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#fef1e1', '#dfe8e6']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={22} color="#fc350b" />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <LinearGradient
                colors={['#fc350b', '#a0430a']}
                style={styles.headerIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Sparkles size={28} color="#fef1e1" />
              </LinearGradient>
              
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join TaskFlow to boost productivity</Text>
            </View>
          </Animated.View>

          {/* Form Card */}
          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            <LinearGradient
              colors={['#ffffff', '#fef1e1']}
              style={styles.formGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <User size={18} color="#fc350b" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    placeholderTextColor="#a0430a60"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <Mail size={18} color="#fc350b" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="john@example.com"
                    placeholderTextColor="#a0430a60"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <Lock size={18} color="#fc350b" />
                  </View>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="••••••••"
                    placeholderTextColor="#a0430a60"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#a0430a" />
                    ) : (
                      <Eye size={18} color="#a0430a" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Password Strength */}
                {password.length > 0 && (
                  <Animated.View style={styles.passwordStrength}>
                    <View style={styles.strengthBarContainer}>
                      <View style={[styles.strengthBar, { 
                        width: `${(passwordStrength.score / 4) * 100}%`,
                        backgroundColor: passwordStrength.color 
                      }]} />
                    </View>
                    <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                      {passwordStrength.label}
                    </Text>
                  </Animated.View>
                )}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <Shield size={18} color="#fc350b" />
                  </View>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="••••••••"
                    placeholderTextColor="#a0430a60"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} color="#a0430a" />
                    ) : (
                      <Eye size={18} color="#a0430a" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Match Indicator */}
                {confirmPassword.length > 0 && (
                  <View style={styles.matchIndicator}>
                    {passwordsMatch ? (
                      <>
                        <CheckCircle size={14} color="#a0430a" />
                        <Text style={[styles.matchText, { color: '#a0430a' }]}>
                          Passwords match
                        </Text>
                      </>
                    ) : (
                      <>
                        <XCircle size={14} color="#fc350b" />
                        <Text style={[styles.matchText, { color: '#fc350b' }]}>
                          Passwords don't match
                        </Text>
                      </>
                    )}
                  </View>
                )}
              </View>

              {/* Requirements */}
              <View style={styles.requirementsContainer}>
                <Text style={styles.requirementsTitle}>Password Requirements</Text>
                {requirements.map((req, index) => (
                  <Animated.View
                    key={req.label}
                    style={[
                      styles.requirementItem,
                      {
                        opacity: fadeAnim,
                        transform: [{
                          translateX: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [50 * (index + 1), 0]
                          })
                        }]
                      }
                    ]}
                  >
                    {req.met ? (
                      <CheckCircle size={14} color="#a0430a" />
                    ) : (
                      <View style={styles.requirementDot} />
                    )}
                    <Text style={[
                      styles.requirementText,
                      req.met && styles.requirementMet
                    ]}>
                      {req.label}
                    </Text>
                  </Animated.View>
                ))}
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
                disabled={loading || !passwordsMatch || passwordStrength.score < 2}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={loading || !passwordsMatch || passwordStrength.score < 2
                    ? ['#dfe8e6', '#c0cfcb']
                    : ['#fc350b', '#a0430a']}
                  style={styles.registerButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {loading ? (
                    <Text style={styles.registerButtonText}>Creating Account...</Text>
                  ) : (
                    <>
                      <Award size={20} color="#fef1e1" />
                      <Text style={styles.registerButtonText}>Create Account</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>

              {/* Terms */}
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  By creating an account, you agree to our{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text> &{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fc350b30',
    shadowColor: '#fc350b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#fc350b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#a0430a',
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#fc350b',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  formCard: {
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#a0430a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
  formGradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: '#fc350b20',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#a0430a',
    fontFamily: 'Inter_500Medium',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef1e1',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fc350b30',
    paddingHorizontal: 12,
  },
  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#a0430a',
    fontFamily: 'Inter_400Regular',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordStrength: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  strengthBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: '#dfe8e6',
    borderRadius: 2,
    marginRight: 12,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  matchText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  requirementsContainer: {
    backgroundColor: '#fef1e1',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fc350b30',
  },
  requirementsTitle: {
    fontSize: 14,
    color: '#a0430a',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  requirementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fc350b',
    opacity: 0.3,
  },
  requirementText: {
    fontSize: 12,
    color: '#a0430a',
    fontFamily: 'Inter_400Regular',
  },
  requirementMet: {
    color: '#a0430a',
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  registerButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#fc350b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  registerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 8,
  },
  registerButtonText: {
    color: '#fef1e1',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#a0430a',
    fontFamily: 'Inter_400Regular',
  },
  loginLink: {
    fontSize: 14,
    color: '#fc350b',
    fontFamily: 'Inter_600SemiBold',
  },
  termsContainer: {
    paddingHorizontal: 8,
  },
  termsText: {
    fontSize: 12,
    color: '#a0430a',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.8,
  },
  termsLink: {
    color: '#fc350b',
    fontFamily: 'Inter_600SemiBold',
  },
});