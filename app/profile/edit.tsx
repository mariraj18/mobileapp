// app/profile/edit.tsx
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image, Animated, ScrollView, Platform } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Camera, User, Mail, Save, Edit2, Shield, Award, Clock } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function EditProfileScreen() {
    const { user, updateProfile } = useAuth();
    const { colors, theme } = useTheme();
    const [name, setName] = useState(user?.name ?? '');
    const [profileImage, setProfileImage] = useState<string | undefined>(user?.profile_image);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
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
                tension: 40,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please enable camera roll permissions to upload a profile picture.');
                return;
            }

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                if (asset.base64) {
                    const base64Image = `data:image/jpeg;base64,${asset.base64}`;
                    setProfileImage(base64Image);
                    console.log('Image selected (base64)');
                } else {
                    setProfileImage(asset.uri);
                    console.log('Image selected (uri):', asset.uri);
                }
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
    };

    const handleUpdate = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }

        setSaving(true);
        console.log('Updating profile with:', { name, profile_image: profileImage });
        
        const response = await updateProfile({ 
            name: name.trim(), 
            profile_image: profileImage 
        });
        
        setSaving(false);

        if (response.success) {
            Alert.alert(
                'Success', 
                'Profile updated successfully', 
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } else {
            Alert.alert('Error', response.message || 'Failed to update profile');
        }
    };

    const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    }) : 'Recently';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[colors.cardDark, colors.background, colors.darkBg]}
                style={StyleSheet.absoluteFill}
                locations={[0, 0.5, 1]}
            />
            
            <Stack.Screen
                options={{
                    title: 'Edit Profile',
                    headerBackTitle: 'Back',
                    headerTintColor: colors.primary,
                    headerStyle: {
                        backgroundColor: 'transparent',
                    },
                    headerTransparent: true,
                }}
            />

            <Animated.ScrollView
                style={[
                    styles.scrollView,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={[styles.header, { shadowColor: colors.primary }]}>
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        style={styles.headerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.headerContent}>
                            <Award size={24} color={colors.textLight} />
                            <Text style={[styles.headerTitle, { color: colors.textLight }]}>Edit Your Profile</Text>
                        </View>
                    </LinearGradient>
                </View>

                <View style={styles.form}>
                    <Animated.View style={[styles.imageSection, { transform: [{ scale: scaleAnim }] }]}>
                        <TouchableOpacity
                            style={styles.imagePicker}
                            onPress={pickImage}
                            activeOpacity={0.8}
                        >
                            {profileImage ? (
                                <Image 
                                    source={{ uri: profileImage }} 
                                    style={[styles.profileImage, { borderColor: colors.primary, shadowColor: colors.primary }]}
                                    onError={(error) => console.log('Image loading error in edit screen:', error.nativeEvent.error)}
                                />
                            ) : (
                                <LinearGradient
                                    colors={[colors.cardLight, colors.cardDark]}
                                    style={[styles.profileImagePlaceholder, { borderColor: colors.primary, shadowColor: colors.primary }]}
                                >
                                    <User size={48} color={colors.primary} />
                                </LinearGradient>
                            )}
                            <BlurView intensity={80} tint={theme} style={styles.cameraButton}>
                                <LinearGradient
                                    colors={[colors.primary, colors.secondary]}
                                    style={styles.cameraButtonGradient}
                                >
                                    <Camera size={18} color={colors.textLight} />
                                </LinearGradient>
                            </BlurView>
                        </TouchableOpacity>
                        
                        <View style={[styles.memberBadge, { backgroundColor: colors.badgeBackground, borderColor: colors.border }]}>
                            <Clock size={14} color={colors.secondary} />
                            <Text style={[styles.memberText, { color: colors.textSecondary }]}>Member since {memberSince}</Text>
                        </View>
                    </Animated.View>

                    <View style={[styles.section, { backgroundColor: colors.cardLight, borderColor: colors.border, shadowColor: colors.shadow }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>

                        <View style={[styles.inputGroup, { backgroundColor: colors.badgeBackground, borderColor: colors.border }]}>
                            <View style={[styles.inputIcon, { backgroundColor: colors.primary + '20' }]}>
                                <User size={20} color={colors.primary} />
                            </View>
                            <View style={styles.inputWrapper}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Enter your full name"
                                    placeholderTextColor={colors.textSecondary + '60'}
                                    autoCapitalize="words"
                                />
                            </View>
                            <Edit2 size={16} color={colors.primary} style={styles.editIcon} />
                        </View>

                        <View style={[styles.inputGroup, { backgroundColor: colors.badgeBackground, borderColor: colors.border }]}>
                            <View style={[styles.inputIcon, { backgroundColor: colors.secondary + '20' }]}>
                                <Mail size={20} color={colors.secondary} />
                            </View>
                            <View style={styles.inputWrapper}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
                                <TextInput
                                    style={[styles.input, styles.disabledInput, { color: colors.textSecondary }]}
                                    value={user?.email || ''}
                                    editable={false}
                                />
                            </View>
                            <Shield size={16} color={colors.success} style={styles.editIcon} />
                        </View>

                        <View style={[styles.infoBox, { backgroundColor: colors.border }]}>
                            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                                Your email is verified and cannot be changed
                            </Text>
                        </View>
                    </View>

                    <View style={styles.buttonGroup}>
                        <TouchableOpacity
                            style={[styles.cancelButton, { backgroundColor: colors.badgeBackground, borderColor: colors.border }]}
                            onPress={() => router.back()}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.saveButton, { shadowColor: colors.primary }]}
                            onPress={handleUpdate}
                            disabled={saving}
                            activeOpacity={0.7}
                        >
                            <LinearGradient
                                colors={saving ? [colors.border, colors.border] : [colors.primary, colors.secondary]}
                                style={styles.saveButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                {saving ? (
                                    <ActivityIndicator color={colors.textLight} />
                                ) : (
                                    <>
                                        <Save size={18} color={colors.textLight} />
                                        <Text style={[styles.saveButtonText, { color: colors.textLight }]}>Save Changes</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        marginTop: 100,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 20,
        overflow: 'hidden',
        ...Platform.select({
            web: {
                boxShadow: '0px 8px 16px rgba(252, 53, 11, 0.2)',
            },
            default: {
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
                elevation: 6,
            },
        }),
    },
    headerGradient: {
        padding: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
    },
    form: {
        padding: 20,
    },
    imageSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    imagePicker: {
        position: 'relative',
        marginBottom: 16,
    },
    profileImage: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 4,
        ...Platform.select({
            web: {
                boxShadow: '0px 12px 24px rgba(252, 53, 11, 0.25)',
            },
            default: {
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 20,
                elevation: 12,
            },
        }),
    },
    profileImagePlaceholder: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            web: {
                boxShadow: '0px 12px 24px rgba(252, 53, 11, 0.25)',
            },
            default: {
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 20,
                elevation: 12,
            },
        }),
    },
    cameraButton: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#fef1e1',
    },
    cameraButtonGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    memberBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 30,
        gap: 8,
        borderWidth: 1,
    },
    memberText: {
        fontSize: 14,
        fontFamily: 'Inter_500Medium',
    },
    section: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        ...Platform.select({
            web: {
                boxShadow: '0px 8px 16px rgba(160, 67, 10, 0.08)',
            },
            default: {
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 4,
            },
        }),
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
        marginBottom: 20,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderRadius: 16,
        padding: 8,
        borderWidth: 1,
    },
    inputIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    inputWrapper: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        fontFamily: 'Inter_500Medium',
        marginBottom: 4,
    },
    input: {
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
        padding: 0,
    },
    disabledInput: {
        opacity: 0.7,
    },
    editIcon: {
        marginRight: 12,
    },
    infoBox: {
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
    },
    infoText: {
        fontSize: 13,
        fontFamily: 'Inter_400Regular',
        textAlign: 'center',
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
    saveButton: {
        flex: 2,
        borderRadius: 16,
        overflow: 'hidden',
        ...Platform.select({
            web: {
                boxShadow: '0px 8px 16px rgba(252, 53, 11, 0.3)',
            },
            default: {
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
            },
        }),
    },
    saveButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
});