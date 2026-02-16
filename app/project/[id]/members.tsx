import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { projectApi, ProjectMember } from '@/utils/api/projects';
import { useAuth } from '@/contexts/AuthContext';
import {
    UserPlus,
    X,
    Trash2,
    Shield,
    Mail,
    User,
    Crown,
    Award,
    Star,
    ChevronRight,
    Search,
    MoreVertical,
    Users
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';

export default function ProjectMembersScreen() {
    const { colors, theme } = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [userIsCreator, setUserIsCreator] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useAuth();
    const router = useRouter();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        if (id) {
            loadMembers();
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 30,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [id]);

    const loadMembers = async () => {
        setLoading(true);
        const [membersRes, projectRes] = await Promise.all([
            projectApi.getMembers(id!),
            projectApi.getById(id!)
        ]);

        if (membersRes.success) {
            setMembers(membersRes.data);
        }

        if (projectRes.success) {
            setUserIsCreator(projectRes.data.created_by === user?.id);
        }

        setLoading(false);
    };

    const handleRemoveMember = (member: ProjectMember) => {
        Alert.alert('Remove Member', `Are you sure you want to remove ${member.user.name} from this project?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                    const response = await projectApi.removeMember(id!, member.user_id);
                    if (response.success) {
                        loadMembers();
                    } else {
                        Alert.alert('Error', response.message || 'Failed to remove member');
                    }
                }
            }
        ]);
    };

    const filteredMembers = members.filter(member =>
        member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderMember = ({ item, index }: { item: ProjectMember; index: number }) => (
        <Animated.View
            style={{
                opacity: fadeAnim,
                transform: [{
                    translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30 * (index + 1), 0]
                    })
                }],
            }}
        >
            <LinearGradient
                colors={[colors.cardLight, colors.cardDark]}
                style={[styles.card, { borderColor: colors.border }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.memberInfo}>
                    <LinearGradient
                        colors={[colors.primary, colors.primary + '80']}
                        style={styles.avatar}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={[styles.avatarText, { color: colors.textLight }]}>{item.user.name.charAt(0).toUpperCase()}</Text>
                    </LinearGradient>

                    <View style={styles.memberDetails}>
                        <View style={styles.nameContainer}>
                            <Text style={[styles.memberName, { color: colors.text }]}>{item.user.name}</Text>
                            {item.user_id === user?.id && (
                                <View style={[styles.youBadge, { backgroundColor: colors.primary + '15' }]}>
                                    <Text style={[styles.youText, { color: colors.primary }]}>You</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>{item.user.email}</Text>
                    </View>
                </View>

                {item.user_id !== user?.id && userIsCreator && (
                    <TouchableOpacity
                        onPress={() => handleRemoveMember(item)}
                        style={[styles.removeButton, { backgroundColor: colors.secondary + '15' }]}
                    >
                        <Trash2 size={18} color={colors.secondary} />
                    </TouchableOpacity>
                )}
            </LinearGradient>
        </Animated.View>
    );

    if (loading) {
        return (
            <LinearGradient colors={[colors.cardDark, colors.cardLight]} style={[styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </LinearGradient>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[colors.cardDark, colors.background, colors.darkBg]}
                style={StyleSheet.absoluteFill}
                locations={[0, 0.5, 1]}
            />

            <Stack.Screen
                options={{
                    title: 'Project Members',
                    headerBackTitle: 'Back',
                    headerTintColor: colors.primary,
                    headerStyle: {
                        backgroundColor: colors.background,
                    },
                    headerTitleStyle: {
                        color: colors.text,
                        fontWeight: '600',
                    },
                }}
            />

            {/* Search Bar */}
            <Animated.View style={[styles.searchContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <LinearGradient
                    colors={[colors.cardLight, colors.cardDark]}
                    style={[styles.searchBar, { borderColor: colors.border }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Search size={18} color={colors.primary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search members..."
                        placeholderTextColor={colors.textSecondary + '60'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </LinearGradient>
            </Animated.View>

            <FlatList
                data={filteredMembers}
                renderItem={renderMember}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <Animated.View style={[styles.statsHeader, { opacity: fadeAnim }]}>
                        <LinearGradient
                            colors={[colors.primary + '15', colors.secondary + '15']}
                            style={[styles.statsBadge, { borderColor: colors.border }]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Users size={16} color={colors.primary} />
                            <Text style={[styles.statsText, { color: colors.textSecondary }]}>{members.length} Members</Text>
                        </LinearGradient>
                    </Animated.View>
                }
                ListEmptyComponent={
                    <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
                        <LinearGradient
                            colors={[colors.cardLight, colors.cardDark]}
                            style={[styles.emptyIllustration, { borderColor: colors.border }]}
                        >
                            <User size={48} color={colors.primary} />
                        </LinearGradient>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No members found</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                            Invite new members to this project
                        </Text>
                    </Animated.View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Inter_400Regular',
        padding: 0,
    },
    statsHeader: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    statsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 30,
        gap: 8,
        borderWidth: 1,
        borderColor: '#fc350b30',
    },
    statsText: {
        fontSize: 13,
        fontFamily: 'Inter_600SemiBold',
    },
    list: {
        padding: 16,
        paddingTop: 0,
    },
    card: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
    },
    memberDetails: {
        flex: 1,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 2,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
    youBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    youText: {
        fontSize: 10,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
    memberEmail: {
        fontSize: 12,
        fontFamily: 'Inter_400Regular',
        marginBottom: 6,
        opacity: 0.8,
    },
    removeButton: {
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyIllustration: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#fc350b30',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        textAlign: 'center',
        opacity: 0.8,
    },
});
