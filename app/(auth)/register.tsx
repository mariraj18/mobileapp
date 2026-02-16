import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Animated, KeyboardAvoidingView, Platform, Dimensions, Modal, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, ChevronLeft, ChevronRight, X, Shield } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { register } = useAuth();
    const { theme, colors } = useTheme();
    const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

    // Dynamic styles that depend on theme colors
    const themedStyles = {
        brandBadge: {
            backgroundColor: `${colors.primary}15`,
            borderColor: `${colors.primary}30`,
        },
        brandBadgeText: {
            color: colors.primary,
        },
        welcomeTitle: {
            color: colors.text,
        },
        formCard: {
            shadowColor: colors.shadow,
        },
        formGradient: {
            borderColor: colors.border,
        },
        inputLabel: {
            color: colors.text,
        },
        input: {
            color: colors.text,
        },
        passwordHint: {
            color: colors.textSecondary,
        },
        registerButton: {
            shadowColor: colors.primary,
        },
        registerButtonText: {
            color: colors.textLight,
        },
        footerText: {
            color: colors.textSecondary,
        },
        footerLink: {
            color: colors.primary,
        },
        termsText: {
            color: colors.textSecondary,
        },
        decorativeCircle1: {
            backgroundColor: `${colors.primary}20`,
        },
        decorativeCircle2: {
            backgroundColor: `${colors.secondary}20`,
        },
        logoWrapper: {
            shadowColor: colors.primary,
        }
    };
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
                colors={[colors.background, colors.cardDark]}
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
                        <Animated.View style={[styles.decorativeCircle1, { transform: [{ rotate: spin }], backgroundColor: `${colors.primary}20` }]} />
                        <Animated.View style={[styles.decorativeCircle2, { transform: [{ rotate: spin }], backgroundColor: `${colors.secondary}20` }]} />
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
                            style={[styles.backButton, { backgroundColor: colors.cardLight }]}
                            onPress={() => router.back()}
                            activeOpacity={0.7}
                        >
                            <ChevronLeft size={24} color={colors.primary} />
                        </TouchableOpacity>

                        <View style={[styles.logoWrapper, themedStyles.logoWrapper]}>
                            <LinearGradient
                                colors={[colors.primary, colors.secondary]}
                                style={styles.logoGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Image
                                    source={require('@/assets/images/icon.png')}
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                            </LinearGradient>
                        </View>

                        <View style={styles.brandContainer}>
                            <Text style={[styles.brandName, { color: colors.text }]}>TaskFlow</Text>
                            <View style={[styles.brandBadge, themedStyles.brandBadge]}>
                                <Text style={[styles.brandBadgeText, themedStyles.brandBadgeText]}>workspace</Text>
                            </View>
                        </View>

                        <Text style={[styles.welcomeTitle, themedStyles.welcomeTitle]}>Create Account</Text>
                        <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>Join our community of productive builders</Text>
                    </Animated.View>

                    {/* Form Card */}
                    <Animated.View
                        style={[
                            styles.formCard,
                            themedStyles.formCard,
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
                            colors={[colors.cardLight, colors.cardDark]}
                            style={[styles.formGradient, themedStyles.formGradient]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            {/* Full Name Input */}
                            <View style={styles.inputContainer}>
                                <Text style={[styles.inputLabel, themedStyles.inputLabel]}>Full Name</Text>
                                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                    <View style={styles.inputIconContainer}>
                                        <User size={18} color={colors.primary} />
                                    </View>
                                    <TextInput
                                        style={[styles.input, themedStyles.input]}
                                        placeholder="John Doe"
                                        placeholderTextColor={colors.textSecondary + '60'}
                                        value={name}
                                        onChangeText={setName}
                                        autoCapitalize="words"
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>

                            {/* Email Input */}
                            <View style={styles.inputContainer}>
                                <Text style={[styles.inputLabel, themedStyles.inputLabel]}>Email Address</Text>
                                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                    <View style={styles.inputIconContainer}>
                                        <Mail size={18} color={colors.primary} />
                                    </View>
                                    <TextInput
                                        style={[styles.input, themedStyles.input]}
                                        placeholder="your@email.com"
                                        placeholderTextColor={colors.textSecondary + '60'}
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
                                <Text style={[styles.inputLabel, themedStyles.inputLabel]}>Password</Text>
                                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                    <View style={styles.inputIconContainer}>
                                        <Lock size={18} color={colors.primary} />
                                    </View>
                                    <TextInput
                                        style={[styles.input, styles.passwordInput, themedStyles.input]}
                                        placeholder="••••••••"
                                        placeholderTextColor={colors.textSecondary + '60'}
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
                                            <EyeOff size={18} color={colors.textSecondary} />
                                        ) : (
                                            <Eye size={18} color={colors.textSecondary} />
                                        )}
                                    </TouchableOpacity>
                                </View>
                                <Text style={[styles.passwordHint, themedStyles.passwordHint]}>Minimum 8 characters</Text>
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
                                    style={[styles.registerButton, themedStyles.registerButton]}
                                    onPress={handleRegister}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={loading ? [colors.border, colors.border] : [colors.primary, colors.secondary]}
                                        style={styles.registerButtonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color={colors.textLight} />
                                        ) : (
                                            <>
                                                <Text style={[styles.registerButtonText, themedStyles.registerButtonText]}>Create Account</Text>
                                                <ChevronRight size={20} color={colors.textLight} />
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>

                            {/* Login Redirect */}
                            <View style={styles.footer}>
                                <Text style={[styles.footerText, themedStyles.footerText]}>Already have an account? </Text>
                                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                                    <Text style={[styles.footerLink, themedStyles.footerLink]}>Sign In</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Terms */}
                            <View style={styles.termsContainer}>
                                <Text style={[styles.termsText, themedStyles.termsText]}>
                                    By creating an account, you agree to our{' '}
                                    <TouchableOpacity onPress={() => setPrivacyModalVisible(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                        <Text style={[styles.termsLink, { color: colors.primary }]}>Terms</Text>
                                    </TouchableOpacity> &{' '}
                                    <TouchableOpacity onPress={() => setPrivacyModalVisible(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                        <Text style={[styles.termsLink, { color: colors.primary }]}>Privacy Policy</Text>
                                    </TouchableOpacity>
                                </Text>
                            </View>
                        </LinearGradient>
                    </Animated.View>
                </Animated.ScrollView>
            </LinearGradient>

            {/* Privacy Policy Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={privacyModalVisible}
                onRequestClose={() => setPrivacyModalVisible(false)}
            >
                <BlurView intensity={20} tint={theme} style={styles.modalOverlay}>
                    <View style={[styles.privacyModalContent, { backgroundColor: colors.modalBackground, shadowColor: colors.shadow }]}>
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            style={styles.privacyModalHeader}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.privacyHeaderContent}>
                                <Shield size={24} color={colors.textLight} />
                                <Text style={[styles.privacyModalTitle, { color: colors.textLight }]}>Privacy & Security</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.privacyCloseButton, { backgroundColor: `${colors.textLight}20` }]}
                                onPress={() => setPrivacyModalVisible(false)}
                            >
                                <X size={20} color={colors.textLight} />
                            </TouchableOpacity>
                        </LinearGradient>

                        <ScrollView
                            style={styles.privacyScrollView}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.privacyContent}
                        >
                            <Text style={[styles.privacySectionTitle, { color: colors.text }]}>Taskflow – Privacy Policy</Text>
                            <Text style={[styles.privacyEffectiveDate, { color: colors.textSecondary }]}>Effective Date: February 15, 2026</Text>

                            <Text style={[styles.privacyParagraph, { color: colors.textSecondary }]}>
                                Welcome to Taskflow, a task management application designed to help users organize work efficiently.
                                Your privacy and data protection are important to us. This policy explains how we collect, use, store,
                                and protect your information when you use Taskflow.
                            </Text>

                            <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>1. Information We Collect</Text>

                            <Text style={[styles.privacySubSubtitle, { color: colors.primary }]}>a) Personal Information</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Name and profile details</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Email address or login credentials</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Account preferences</Text>

                            <Text style={[styles.privacySubSubtitle, { color: colors.primary }]}>b) Task Data</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Tasks, notes, messages, schedules, and attachments created inside Taskflow</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Team collaboration content (if workspace features are enabled)</Text>

                            <Text style={[styles.privacySubSubtitle, { color: colors.primary }]}>c) Technical Information</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Device type, OS version, browser/app version</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• IP address and log data for security monitoring</Text>

                            <Text style={[styles.privacyParagraph, { color: colors.textSecondary }]}>
                                We collect only the information required to operate the application.
                            </Text>

                            <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>2. How We Use Your Information</Text>
                            <Text style={[styles.privacyParagraph, { color: colors.textSecondary }]}>
                                Your data is used to:
                            </Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Provide task management features</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Sync tasks across devices</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Enable collaboration between users</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Improve performance and user experience</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Detect fraud, abuse, or unauthorized access</Text>
                            <Text style={[styles.privacyParagraph, { color: colors.textSecondary }]}>
                                Taskflow does not sell personal data to third parties.
                            </Text>

                            <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>3. Data Storage and Retention</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Data is stored securely on cloud infrastructure.</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Information remains stored while your account is active.</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Users can request deletion of their account and data at any time.</Text>

                            <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>4. Data Sharing</Text>
                            <Text style={[styles.privacyParagraph, { color: colors.textSecondary }]}>
                                We may share limited information only when:
                            </Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Required by law or legal request</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Needed for secure infrastructure providers (database, hosting, email services)</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Necessary to prevent security threats</Text>
                            <Text style={[styles.privacyParagraph, { color: colors.textSecondary }]}>
                                Third-party services used by Taskflow follow their own privacy standards.
                            </Text>

                            <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>5. User Rights</Text>
                            <Text style={[styles.privacyParagraph, { color: colors.textSecondary }]}>
                                You have the right to:
                            </Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Access your personal data</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Update or correct information</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Request account deletion</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Control notification and privacy settings</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Contact us at: cxndy.mee@example.com</Text>

                            <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>6. Children's Privacy</Text>
                            <Text style={[styles.privacyParagraph, { color: colors.textSecondary }]}>
                                Taskflow is not intended for users under 13 years old. We do not knowingly collect data from children.
                            </Text>

                            <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>7. Changes to Policy</Text>
                            <Text style={[styles.privacyParagraph, { color: colors.textSecondary }]}>
                                We may update this policy when features or legal requirements change. Users will be notified through
                                the app or email when significant updates occur.
                            </Text>

                            <Text style={[styles.privacySectionTitle, { color: colors.text }]}>Taskflow – Security Statement</Text>
                            <Text style={[styles.privacyParagraph, { color: colors.textSecondary }]}>
                                Taskflow is built with security as a core priority. We use modern practices to keep user data protected.
                            </Text>

                            <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>1. Data Encryption</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• HTTPS encryption for all network communication</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Secure token-based authentication</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Passwords stored using strong hashing methods</Text>

                            <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>2. Account Protection</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Secure login sessions</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Optional email verification</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Protection against brute-force attacks</Text>

                            <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>3. Infrastructure Security</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Cloud-hosted backend with firewall protection</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Database access restricted through environment variables</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Regular monitoring of logs and suspicious activities</Text>

                            <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>4. Access Control</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Role-based permissions for teams or organizations</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Users can only access their own tasks unless shared</Text>

                            <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>5. Backup & Recovery</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Periodic database backups</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Disaster recovery procedures to prevent data loss</Text>

                            <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>8. Contact Information</Text>
                            <Text style={[styles.privacyParagraph, { color: colors.textSecondary }]}>
                                If you have questions regarding privacy or security:
                            </Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>App Name: Taskflow</Text>
                            <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>Email: cxndy.mee@example.com</Text>

                            {/* Add some bottom padding */}
                            <View style={{ height: 20 }} />
                        </ScrollView>

                        <View style={[styles.privacyModalFooter, { borderTopColor: colors.border }]}>
                            <TouchableOpacity
                                style={[styles.privacyAcceptButton, { shadowColor: colors.primary }]}
                                onPress={() => setPrivacyModalVisible(false)}
                            >
                                <LinearGradient
                                    colors={[colors.primary, colors.secondary]}
                                    style={styles.privacyAcceptGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Text style={[styles.privacyAcceptText, { color: colors.textLight }]}>Close</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </BlurView>
            </Modal>
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
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        zIndex: 10,
    },
    logoWrapper: {
        marginBottom: 20,
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
        overflow: 'hidden',
    },
    logoImage: {
        width: 48,
        height: 48,
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
        fontFamily: 'Inter_800ExtraBold',
    },
    brandBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
    },
    brandBadgeText: {
        fontSize: 10,
        fontFamily: 'Inter_600SemiBold',
        textTransform: 'uppercase',
    },
    welcomeTitle: {
        fontSize: 32,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    welcomeSubtitle: {
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.8,
    },
    formCard: {
        borderRadius: 32,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 16,
    },
    formGradient: {
        padding: 24,
        borderWidth: 1,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontFamily: 'Inter_500Medium',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
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
        fontFamily: 'Inter_400Regular',
    },
    passwordInput: {
        paddingRight: 48,
    },
    passwordHint: {
        fontSize: 12,
        fontFamily: 'Inter_400Regular',
        marginTop: 4,
        marginLeft: 4,
        opacity: 0.6,
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
        fontFamily: 'Inter_400Regular',
    },
    footerLink: {
        fontSize: 14,
        fontFamily: 'Inter_700Bold',
    },
    termsContainer: {
        paddingHorizontal: 8,
    },
    termsText: {
        fontSize: 12,
        fontFamily: 'Inter_400Regular',
        textAlign: 'center',
        lineHeight: 18,
        opacity: 0.8,
    },
    termsLink: {
        fontFamily: 'Inter_600SemiBold',
    },
    themeToggle: {
        position: 'absolute',
        top: 60,
        right: 0,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    privacyModalContent: {
        width: '95%',
        maxWidth: 500,
        maxHeight: '85%',
        borderRadius: 32,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    privacyModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
    },
    privacyHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    privacyModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
    },
    privacyCloseButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    privacyScrollView: {
        flex: 1,
    },
    privacyContent: {
        padding: 24,
    },
    privacySectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
        marginBottom: 8,
    },
    privacyEffectiveDate: {
        fontSize: 14,
        fontFamily: 'Inter_500Medium',
        marginBottom: 24,
        fontStyle: 'italic',
        opacity: 0.8,
    },
    privacySectionSubtitle: {
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
        marginTop: 24,
        marginBottom: 12,
    },
    privacySubSubtitle: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
        marginTop: 16,
        marginBottom: 8,
    },
    privacyParagraph: {
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        lineHeight: 22,
        marginBottom: 16,
        opacity: 0.8,
    },
    privacyBullet: {
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        lineHeight: 22,
        marginLeft: 12,
        marginBottom: 8,
        opacity: 0.8,
    },
    privacyModalFooter: {
        padding: 24,
        borderTopWidth: 1,
    },
    privacyAcceptButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    privacyAcceptGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    privacyAcceptText: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
});
