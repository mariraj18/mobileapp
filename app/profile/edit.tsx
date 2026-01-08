import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image, Animated, ScrollView } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Camera, User, Mail, Save } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

export default function EditProfileScreen() {
    const { user, updateProfile } = useAuth();
    const [name, setName] = useState(user?.name ?? '');
    const [profileImage, setProfileImage] = useState<string | undefined>(user?.profile_image);
    const [saving, setSaving] = useState(false);
    const router = useRouter();
    
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 30,
                friction: 7,
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

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <Stack.Screen 
                options={{ 
                    title: 'Edit Profile',
                    headerBackTitle: 'Back',
                    headerTintColor: '#6366F1',
                }} 
            />

            <Animated.ScrollView 
                style={[
                    styles.scrollView,
                    {
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.form}>
                    <View style={styles.imageSection}>
                        <Text style={styles.sectionTitle}>Profile Picture</Text>
                        <TouchableOpacity 
                            style={styles.imagePicker}
                            onPress={pickImage}
                            activeOpacity={0.8}
                        >
                            {profileImage ? (
                                <Image source={{ uri: profileImage }} style={styles.profileImage} />
                            ) : (
                                <LinearGradient
                                    colors={['#F1F5F9', '#E2E8F0']}
                                    style={styles.profileImagePlaceholder}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <User size={40} color="#94A3B8" />
                                </LinearGradient>
                            )}
                            <View style={styles.cameraButton}>
                                <LinearGradient
                                    colors={['#6366F1', '#8B5CF6']}
                                    style={styles.cameraButtonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Camera size={16} color="#fff" />
                                </LinearGradient>
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.imageHint}>Tap to change profile picture</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Personal Information</Text>
                        
                        <View style={styles.inputGroup}>
                            <View style={styles.inputIcon}>
                                <User size={20} color="#64748B" />
                            </View>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Full Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Enter your full name"
                                    placeholderTextColor="#94A3B8"
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
                                    style={[styles.input, styles.disabledInput]}
                                    value={user?.email || ''}
                                    editable={false}
                                />
                                <Text style={styles.hint}>Email cannot be changed</Text>
                            </View>
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
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Save size={18} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.ScrollView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollView: {
        flex: 1,
    },
    form: {
        padding: 20,
    },
    imageSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 16,
        alignSelf: 'flex-start',
    },
    imagePicker: {
        position: 'relative',
        marginBottom: 12,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#FFFFFF',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    profileImagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        overflow: 'hidden',
    },
    cameraButtonGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageHint: {
        fontSize: 13,
        color: '#94A3B8',
        fontFamily: 'Inter_400Regular',
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 32,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    inputIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    inputWrapper: {
        flex: 1,
    },
    label: {
        fontSize: 13,
        color: '#64748B',
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
    disabledInput: {
        color: '#94A3B8',
        backgroundColor: '#F1F5F9',
    },
    hint: {
        fontSize: 12,
        color: '#94A3B8',
        fontFamily: 'Inter_400Regular',
        marginTop: 4,
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    cancelButton: {
        flex: 1,
        padding: 18,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        marginRight: 12,
    },
    cancelButtonText: {
        color: '#64748B',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
    saveButton: {
        flex: 2,
        padding: 18,
        borderRadius: 12,
        backgroundColor: '#6366F1',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
});