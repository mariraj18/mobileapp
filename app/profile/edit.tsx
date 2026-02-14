import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image, Animated, ScrollView, Platform } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Camera, User, Mail, Save, Edit2, Shield, Award, Clock } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function EditProfileScreen() {
    const { user, updateProfile } = useAuth();
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
            } else {
                setProfileImage(asset.uri);
            }
        }
    };

    const handleUpdate = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }

        setSaving(true);
        const response = await updateProfile({ name, profile_image: profileImage });
        setSaving(false);

        if (response.success) {
            Alert.alert('Success', 'Profile updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } else {
            Alert.alert('Error', response.message || 'Failed to update profile');
        }
    };

    const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    }) : 'Recently';

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#fef1e1', '#ffffff', '#dfe8e6']}
                style={StyleSheet.absoluteFill}
                locations={[0, 0.5, 1]}
            />
            
            <Stack.Screen
                options={{
                    title: 'Edit Profile',
                    headerBackTitle: 'Back',
                    headerTintColor: '#fc350b',
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
                <View style={styles.header}>
                    <LinearGradient
                        colors={['#fc350b', '#a0430a']}
                        style={styles.headerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.headerContent}>
                            <Award size={24} color="#fef1e1" />
                            <Text style={styles.headerTitle}>Edit Your Profile</Text>
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
                                <Image source={{ uri: profileImage }} style={styles.profileImage} />
                            ) : (
                                <LinearGradient
                                    colors={['#fef1e1', '#dfe8e6']}
                                    style={styles.profileImagePlaceholder}
                                >
                                    <User size={48} color="#fc350b" />
                                </LinearGradient>
                            )}
                            <BlurView intensity={80} style={styles.cameraButton}>
                                <LinearGradient
                                    colors={['#fc350b', '#a0430a']}
                                    style={styles.cameraButtonGradient}
                                >
                                    <Camera size={18} color="#fef1e1" />
                                </LinearGradient>
                            </BlurView>
                        </TouchableOpacity>
                        
                        <View style={styles.memberBadge}>
                            <Clock size={14} color="#a0430a" />
                            <Text style={styles.memberText}>Member since {memberSince}</Text>
                        </View>
                    </Animated.View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Personal Information</Text>

                        <View style={styles.inputGroup}>
                            <View style={[styles.inputIcon, { backgroundColor: '#fc350b15' }]}>
                                <User size={20} color="#fc350b" />
                            </View>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Full Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Enter your full name"
                                    placeholderTextColor="#a0430a60"
                                    autoCapitalize="words"
                                />
                            </View>
                            <Edit2 size={16} color="#fc350b" style={styles.editIcon} />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={[styles.inputIcon, { backgroundColor: '#a0430a15' }]}>
                                <Mail size={20} color="#a0430a" />
                            </View>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Email Address</Text>
                                <TextInput
                                    style={[styles.input, styles.disabledInput]}
                                    value={user?.email || ''}
                                    editable={false}
                                />
                            </View>
                            <Shield size={16} color="#10B981" style={styles.editIcon} />
                        </View>

                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>
                                Your email is verified and cannot be changed
                            </Text>
                        </View>
                    </View>

                    <View style={styles.buttonGroup}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => router.back()}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleUpdate}
                            disabled={saving}
                            activeOpacity={0.7}
                        >
                            <LinearGradient
                                colors={saving ? ['#dfe8e6', '#c0cfcb'] : ['#fc350b', '#a0430a']}
                                style={styles.saveButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <>
                                        <Save size={18} color="#fef1e1" />
                                        <Text style={styles.saveButtonText}>Save Changes</Text>
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
                shadowColor: '#fc350b',
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
        color: '#fef1e1',
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
        borderColor: '#fc350b',
        ...Platform.select({
            web: {
                boxShadow: '0px 12px 24px rgba(252, 53, 11, 0.25)',
            },
            default: {
                shadowColor: '#fc350b',
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
        borderColor: '#fc350b',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            web: {
                boxShadow: '0px 12px 24px rgba(252, 53, 11, 0.25)',
            },
            default: {
                shadowColor: '#fc350b',
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
        backgroundColor: '#fef1e1',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 30,
        gap: 8,
        borderWidth: 1,
        borderColor: '#fc350b30',
    },
    memberText: {
        fontSize: 14,
        color: '#a0430a',
        fontFamily: 'Inter_500Medium',
    },
    section: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#fc350b20',
        ...Platform.select({
            web: {
                boxShadow: '0px 8px 16px rgba(160, 67, 10, 0.08)',
            },
            default: {
                shadowColor: '#a0430a',
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
        color: '#a0430a',
        fontFamily: 'Inter_700Bold',
        marginBottom: 20,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#fef1e1',
        borderRadius: 16,
        padding: 8,
        borderWidth: 1,
        borderColor: '#fc350b30',
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
        color: '#a0430a',
        fontFamily: 'Inter_500Medium',
        marginBottom: 4,
    },
    input: {
        fontSize: 16,
        color: '#1E293B',
        fontFamily: 'Inter_400Regular',
        padding: 0,
    },
    disabledInput: {
        color: '#a0430a',
        opacity: 0.7,
    },
    editIcon: {
        marginRight: 12,
    },
    infoBox: {
        backgroundColor: '#dfe8e6',
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
    },
    infoText: {
        fontSize: 13,
        color: '#a0430a',
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
        backgroundColor: '#fef1e1',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fc350b30',
    },
    cancelButtonText: {
        color: '#a0430a',
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
                shadowColor: '#fc350b',
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
        color: '#fef1e1',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
});