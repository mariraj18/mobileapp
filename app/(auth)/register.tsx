import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Animated, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 40,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        try {
            const result = await register({ name, email, password });
            setLoading(false);

            if (result.success) {
                router.replace('/');
            } else {
                Alert.alert('Registration Failed', result.message || 'Could not create account');
            }
        } catch (error: any) {
            setLoading(false);
            Alert.alert('Error', error.message || 'An unexpected error occurred');
        }
    };

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
                <Animated.ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ opacity: fadeAnim }}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Decorative Circles */}
                    <View style={styles.decorativeContainer}>
                        <Animated.View style={[styles.decorativeCircle1, { transform: [{ rotate: spin }] }]} />
                        <Animated.View style={[styles.decorativeCircle2, { transform: [{ rotate: spin }] }]} />
                    </View>

                    {/* Header */}
                    <Animated.View
                        style={[
                            styles.header,
                            {
                                opacity: fadeAnim,
                                transform: [
                                    { translateY: slideAnim },
                                    { scale: scaleAnim }
                                ]
                            }
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                            activeOpacity={0.7}
                        >
                            <ChevronLeft size={24} color="#a0430a" />
                        </TouchableOpacity>

                        <View style={styles.logoWrapper}>
                            <LinearGradient
                                colors={['#fc350b', '#a0430a']}
                                style={styles.logoGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Sparkles size={32} color="#fef1e1" />
                            </LinearGradient>
                        </View>

                        <View style={styles.brandContainer}>
                            <Text style={styles.brandName}>TaskFlow</Text>
                            <View style={styles.brandBadge}>
                                <Text style={styles.brandBadgeText}>workspace</Text>
                            </View>
                        </View>

                        <Text style={styles.welcomeTitle}>Create Account</Text>
                        <Text style={styles.welcomeSubtitle}>Join us and start managing your tasks beautifully</Text>
                    </Animated.View>

                    {/* Form */}
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
                                    <View style={styles.inputIconContainer}>
                                        <User size={18} color="#fc350b" />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="John Doe"
                                        placeholderTextColor="#a0430a60"
                                        value={name}
                                        onChangeText={setName}
                                        autoCapitalize="words"
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>

                            {/* Email Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Email Address</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.inputIconContainer}>
                                        <Mail size={18} color="#fc350b" />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="your@email.com"
                                        placeholderTextColor="#a0430a60"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Password</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.inputIconContainer}>
                                        <Lock size={18} color="#fc350b" />
                                    </View>
                                    <TextInput
                                        style={[styles.input, styles.passwordInput]}
                                        placeholder="••••••••"
                                        placeholderTextColor="#a0430a60"
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
                                            <EyeOff size={18} color="#a0430a" />
                                        ) : (
                                            <Eye size={18} color="#a0430a" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.passwordHint}>Must be at least 6 characters</Text>
                            </View>

                            {/* Register Button */}
                            <Animated.View
                                style={{
                                    transform: [{
                                        scale: fadeAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.8, 1]
                                        })
                                    }]
                                }}
                            >
                                <TouchableOpacity
                                    style={styles.registerButton}
                                    onPress={handleRegister}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={loading ? ['#dfe8e6', '#c0cfcb'] : ['#fc350b', '#a0430a']}
                                        style={styles.registerButtonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        {loading ? (
                                            <Text style={styles.registerButtonText}>Creating account...</Text>
                                        ) : (
                                            <>
                                                <Text style={styles.registerButtonText}>Create Account</Text>
                                                <ChevronRight size={20} color="#fef1e1" />
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>

                            {/* Login Link */}
                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Already have an account? </Text>
                                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                                    <Text style={styles.footerLink}>Sign In</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Terms */}
                            <View style={styles.termsContainer}>
                                <Text style={styles.termsText}>
                                    By creating an account, you agree to our{' '}
                                    <Text style={styles.termsLink}>Terms</Text> &{' '}
                                    <Text style={styles.termsLink}>Privacy Policy</Text>
                                </Text>
                            </View>
                        </LinearGradient>
                    </Animated.View>
                </Animated.ScrollView>
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
    decorativeContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
        overflow: 'hidden',
    },
    decorativeCircle1: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#fc350b20',
    },
    decorativeCircle2: {
        position: 'absolute',
        top: 100,
        left: -60,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#a0430a20',
    },
    header: {
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 40,
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 0,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#a0430a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        zIndex: 10,
    },
    logoWrapper: {
        marginBottom: 20,
        shadowColor: '#fc350b',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    logoGradient: {
        width: 72,
        height: 72,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    brandName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#a0430a',
        fontFamily: 'Inter_800ExtraBold',
    },
    brandBadge: {
        backgroundColor: '#fc350b15',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#fc350b30',
    },
    brandBadgeText: {
        fontSize: 10,
        color: '#fc350b',
        fontFamily: 'Inter_600SemiBold',
        textTransform: 'uppercase',
    },
    welcomeTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#a0430a',
        fontFamily: 'Inter_700Bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    welcomeSubtitle: {
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
    inputIconContainer: {
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
    passwordHint: {
        fontSize: 12,
        color: '#a0430a80',
        fontFamily: 'Inter_400Regular',
        marginTop: 4,
        marginLeft: 4,
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
    registerButton: {
        borderRadius: 20,
        overflow: 'hidden',
        marginTop: 12,
        marginBottom: 24,
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
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    footerText: {
        fontSize: 14,
        color: '#a0430a',
        fontFamily: 'Inter_400Regular',
    },
    footerLink: {
        fontSize: 14,
        color: '#fc350b',
        fontFamily: 'Inter_700Bold',
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
