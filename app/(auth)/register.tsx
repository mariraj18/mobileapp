import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Animated, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle, XCircle, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
  const slideAnim = useRef(new Animated.Value(30)).current;
  const formAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 25,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(formAnim, {
        toValue: 1,
        duration: 400,
        delay: 200,
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
    if (pass.length === 0) return { score: 0, color: '#CBD5E1' };
    if (pass.length < 6) return { score: 1, color: '#EF4444' };
    if (pass.length < 8) return { score: 2, color: '#F59E0B' };
    if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) {
      return { score: 4, color: '#10B981' };
    }
    return { score: 3, color: '#3B82F6' };
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
        colors={['#F1F5F9', '#FFFFFF']}
        style={styles.gradientBackground}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
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
              <ArrowLeft size={24} color="#64748B" />
            </TouchableOpacity>
            
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join TaskFlow to organize your work</Text>
          </Animated.View>

          <Animated.View 
            style={[
              styles.form,
              {
                opacity: formAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <User size={20} color="#64748B" />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <Mail size={20} color="#64748B" />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <Lock size={20} color="#64748B" />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Create a password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#94A3B8" />
                    ) : (
                      <Eye size={20} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                </View>
                
                {password.length > 0 && (
                  <Animated.View 
                    style={[
                      styles.passwordStrength,
                      { opacity: formAnim }
                    ]}
                  >
                    <View style={styles.strengthBar}>
                      <View style={[styles.strengthFill, { 
                        width: `${(passwordStrength.score / 4) * 100}%`,
                        backgroundColor: passwordStrength.color
                      }]} />
                    </View>
                    <Text style={[
                      styles.strengthText,
                      { color: passwordStrength.color }
                    ]}>
                      {passwordStrength.score === 0 && 'Enter password'}
                      {passwordStrength.score === 1 && 'Very Weak'}
                      {passwordStrength.score === 2 && 'Weak'}
                      {passwordStrength.score === 3 && 'Good'}
                      {passwordStrength.score === 4 && 'Strong'}
                    </Text>
                  </Animated.View>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <Lock size={20} color="#64748B" />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Confirm your password"
                    placeholderTextColor="#94A3B8"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    activeOpacity={0.7}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color="#94A3B8" />
                    ) : (
                      <Eye size={20} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                </View>
                
                {confirmPassword.length > 0 && (
                  <Animated.View 
                    style={[
                      styles.passwordMatch,
                      { opacity: formAnim }
                    ]}
                  >
                    {passwordsMatch ? (
                      <>
                        <CheckCircle size={16} color="#10B981" />
                        <Text style={[styles.matchText, { color: '#10B981' }]}>
                          Passwords match
                        </Text>
                      </>
                    ) : (
                      <>
                        <XCircle size={16} color="#EF4444" />
                        <Text style={[styles.matchText, { color: '#EF4444' }]}>
                          Passwords do not match
                        </Text>
                      </>
                    )}
                  </Animated.View>
                )}
              </View>
            </View>

            <View style={styles.requirements}>
              <Text style={styles.requirementsTitle}>Password Requirements</Text>
              {requirements.map((req, index) => (
                <Animated.View
                  key={req.label}
                  style={[
                    styles.requirementItem,
                    {
                      opacity: formAnim,
                      transform: [{
                        translateX: formAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50 * (index + 1), 0]
                        })
                      }]
                    }
                  ]}
                >
                  {req.met ? (
                    <CheckCircle size={16} color="#10B981" />
                  ) : (
                    <View style={styles.requirementDot} />
                  )}
                  <Text style={[
                    styles.requirementText,
                    req.met ? styles.requirementMet : styles.requirementUnmet
                  ]}>
                    {req.label}
                  </Text>
                </Animated.View>
              ))}
            </View>

            <Animated.View
              style={{
                opacity: formAnim,
                transform: [{
                  scale: formAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1]
                  })
                }]
              }}
            >
              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
                disabled={loading || !passwordsMatch || passwordStrength.score < 2}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={loading || !passwordsMatch || passwordStrength.score < 2 
                    ? ['#94A3B8', '#CBD5E1'] 
                    : ['#10B981', '#34D399']}
                  style={styles.registerButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {loading ? (
                    <Text style={styles.registerButtonText}>Creating account...</Text>
                  ) : (
                    <Text style={styles.registerButtonText}>Create Account</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By creating an account, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text>{' '}
                and <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
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
    paddingBottom: 32,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 60,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter_500Medium',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontFamily: 'Inter_400Regular',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordStrength: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginRight: 12,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    minWidth: 60,
  },
  passwordMatch: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  matchText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginLeft: 6,
  },
  requirements: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  requirementsTitle: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
    marginRight: 10,
  },
  requirementText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  requirementMet: {
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  requirementUnmet: {
    color: '#475569',
  },
  registerButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  registerButtonGradient: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
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
    color: '#64748B',
    fontFamily: 'Inter_400Regular',
  },
  loginLink: {
    fontSize: 14,
    color: '#6366F1',
    fontFamily: 'Inter_600SemiBold',
  },
  termsContainer: {
    paddingHorizontal: 8,
  },
  termsText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#6366F1',
    fontFamily: 'Inter_500Medium',
  },
});