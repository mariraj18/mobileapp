import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Animated, Platform, ScrollView } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { projectApi, Project, ProjectMember } from '@/utils/api/projects';
import { taskApi, Task, CreateTaskData } from '@/utils/api/tasks';
import { workspaceApi, WorkspaceMember } from '@/utils/api/workspaces';
import { Plus, X, Calendar, CheckCircle, Clock, AlertCircle, Target, TrendingUp, Users, Filter, ChevronRight, UserPlus, Trash2, Check, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { useTheme } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProjectDetailsScreen() {
    const insets = useSafeAreaInsets();
    const { colors, theme } = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();

    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'TODO' | 'IN_PROGRESS' | 'DONE'>('ALL');
    const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
    const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
    const [memberModalVisible, setMemberModalVisible] = useState(false);
    const [addingMember, setAddingMember] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        if (id) {
            loadData();
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
        }
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        const [projResponse, tasksResponse, projMembersResponse] = await Promise.all([
            projectApi.getById(id!),
            taskApi.getAll(id!),
            projectApi.getMembers(id!)
        ]);

        if (projResponse.success) {
            setProject(projResponse.data);
            // Fetch workspace members to allow adding them
            const wsMembersResponse = await workspaceApi.getMembers(projResponse.data.workspace_id);
            if (wsMembersResponse.success) {
                setWorkspaceMembers(wsMembersResponse.data);
            }
        } else {
            setError(projResponse.message || 'Project not found');
        }

        if (tasksResponse.success) {
            setTasks(tasksResponse.data);
        }

        if (projMembersResponse.success) {
            setProjectMembers(projMembersResponse.data);
        }

        setLoading(false);
    };

    const handleAddMember = async (userId: string) => {
        setAddingMember(true);
        const response = await projectApi.addMember(id!, userId);
        setAddingMember(false);

        if (response.success) {
            loadData();
            Alert.alert('Success', 'Member added to project');
        } else {
            Alert.alert('Error', response.message || 'Failed to add member');
        }
    };

    const handleDeleteProject = async () => {
        Alert.alert('DEBUG', 'handleDeleteProject entered');
        Alert.alert('Delete Project', 'Are you sure you want to delete this project? This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    Alert.alert('DEBUG', 'Starting API call to delete project');
                    const response = await projectApi.delete(id!);
                    Alert.alert('DEBUG', `API Result: success=${response.success}`);
                    if (response.success && project) {
                        router.replace(`/workspace/${project.workspace_id}`);
                    } else if (response.success) {
                        router.replace('/(tabs)');
                    } else {
                        Alert.alert('Error', response.message || 'Failed to delete project');
                    }
                }
            }
        ]);
    };

    const handleRemoveMember = async (userId: string) => {
        Alert.alert('Remove Member', 'Are you sure you want to remove this member from the project?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                    const response = await projectApi.removeMember(id!, userId);
                    if (response.success) {
                        loadData();
                    } else {
                        Alert.alert('Error', response.message || 'Failed to remove member');
                    }
                }
            }
        ]);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DONE': return colors.success;
            case 'IN_PROGRESS': return colors.secondary;
            case 'TODO': return colors.primary;
            default: return colors.border;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH': return colors.primary;
            case 'MEDIUM': return colors.secondary;
            case 'LOW': return colors.tertiary;
            default: return colors.border;
        }
    };

    const getFilteredTasks = () => {
        if (selectedFilter === 'ALL') return tasks;
        return tasks.filter(task => task.status === selectedFilter);
    };

    const getStatusCount = (status: string) => {
        return tasks.filter(task => task.status === status).length;
    };

    const renderTask = ({ item, index }: { item: Task; index: number }) => (
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
            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/task/${item.id}`)}
                activeOpacity={0.7}
            >
                <LinearGradient
                    colors={[colors.cardLight, colors.cardDark]}
                    style={[styles.cardGradient, { borderColor: colors.border }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(item.priority) }]} />

                    <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                            <View style={[
                                styles.priorityBadge,
                                { backgroundColor: getPriorityColor(item.priority) + '15' }
                            ]}>
                                <Text style={[
                                    styles.priorityText,
                                    { color: getPriorityColor(item.priority) }
                                ]}>
                                    {item.priority}
                                </Text>
                            </View>
                        </View>

                        {item.description ? (
                            <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                        ) : null}

                        <View style={styles.cardFooter}>
                            <View style={styles.metaItem}>
                                <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                                <Text style={styles.metaText}>
                                    {item.status.replace('_', ' ')}
                                </Text>
                            </View>

                            {item.due_date && (
                                <View style={styles.metaItem}>
                                    <Calendar size={12} color="#a0430a" />
                                    <Text style={styles.metaText}>
                                        {new Date(item.due_date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.avatarGroup}>
                                <View style={[styles.avatar, { backgroundColor: '#fc350b' }]}>
                                    <Text style={styles.avatarText}>JD</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <LinearGradient
                    colors={[colors.cardDark, colors.background]}
                    style={StyleSheet.absoluteFill}
                />
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!project) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background, padding: 20 }]}>
                <AlertCircle size={48} color={colors.secondary} style={{ marginBottom: 16 }} />
                <Text style={[styles.errorText, { color: colors.text }]}>
                    {error || 'Project not found'}
                </Text>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: colors.primary + '15', marginTop: 24 }]}
                    onPress={() => router.back()}
                >
                    <Text style={{ color: colors.primary, fontWeight: '600' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const todoCount = getStatusCount('TODO');
    const inProgressCount = getStatusCount('IN_PROGRESS');
    const doneCount = getStatusCount('DONE');
    const filteredTasks = getFilteredTasks();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[colors.cardDark, colors.background, colors.darkBg]}
                style={StyleSheet.absoluteFill}
                locations={[0, 0.5, 1]}
            />

            <Stack.Screen
                options={{
                    title: project.name,
                    headerBackTitle: 'Back',
                    headerTintColor: colors.primary,
                    headerStyle: {
                        backgroundColor: 'transparent',
                    },
                    headerTransparent: true,
                }}
            />

            <Animated.View
                style={[
                    styles.header,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                        paddingTop: insets.top + (Platform.OS === 'ios' ? 60 : 80),
                    }
                ]}
            >
                <LinearGradient
                    colors={[colors.cardLight, colors.cardDark]}
                    style={[styles.headerGradient, { borderColor: colors.border, shadowColor: colors.shadow }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerTop}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.projectName}>{project.name}</Text>
                        </View>
                        <View style={styles.headerTopActions}>
                            {project.created_by === user?.id && (
                                <TouchableOpacity
                                    style={[styles.headerOptionButton, { backgroundColor: colors.secondary + '15' }]}
                                    onPress={handleDeleteProject}
                                >
                                    <Trash2 size={18} color={colors.secondary} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.filterButton}
                                onPress={() => setFilterModalVisible(true)}
                            >
                                <Filter size={18} color="#fc350b" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {project.description && (
                        <Text style={styles.projectDescription}>{project.description}</Text>
                    )}

                    <View style={styles.statsContainer}>
                        <View style={[styles.statCard, { backgroundColor: '#fc350b15' }]}>
                            <Target size={20} color="#fc350b" />
                            <Text style={styles.statValue}>{todoCount}</Text>
                            <Text style={styles.statLabel}>To Do</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#3B82F615' }]}>
                            <Clock size={20} color="#3B82F6" />
                            <Text style={styles.statValue}>{inProgressCount}</Text>
                            <Text style={styles.statLabel}>In Progress</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#10B98115' }]}>
                            <CheckCircle size={20} color="#10B981" />
                            <Text style={styles.statValue}>{doneCount}</Text>
                            <Text style={styles.statLabel}>Done</Text>
                        </View>
                    </View>

                    <View style={[styles.progressBar, { backgroundColor: colors.cardDark }]}>
                        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${(doneCount / (tasks.length || 1)) * 100}%` }]} />
                    </View>

                    {/* Project Members Section */}
                    <View style={styles.membersSection}>
                        <View style={styles.membersHeader}>
                            <View style={styles.membersTitleContainer}>
                                <Users size={16} color={colors.primary} />
                                <Text style={[styles.membersTitle, { color: colors.text }]}>Members</Text>
                                <View style={[styles.memberBadge, { backgroundColor: colors.primary + '15' }]}>
                                    <Text style={[styles.memberBadgeText, { color: colors.primary }]}>{projectMembers.length}</Text>
                                </View>
                            </View>
                            {project.created_by === user?.id && (
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <TouchableOpacity
                                        style={[styles.addMemberButton, { backgroundColor: colors.primary + '15' }]}
                                        onPress={() => router.push(`/project/${id}/members`)}
                                    >
                                        <ArrowRight size={16} color={colors.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.addMemberButton, { backgroundColor: colors.primary + '15' }]}
                                        onPress={() => setMemberModalVisible(true)}
                                    >
                                        <UserPlus size={16} color={colors.primary} />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.membersScroll}
                        >
                            {projectMembers.map((member) => (
                                <View key={member.id} style={styles.memberAvatarContainer}>
                                    <LinearGradient
                                        colors={[colors.primary, colors.secondary]}
                                        style={styles.memberAvatar}
                                    >
                                        <Text style={styles.memberAvatarText}>
                                            {member.user.name.charAt(0).toUpperCase()}
                                        </Text>
                                    </LinearGradient>
                                    <Text style={[styles.memberSmallName, { color: colors.textSecondary }]} numberOfLines={1}>
                                        {member.user.name.split(' ')[0]}
                                    </Text>
                                    {project.created_by === user?.id && (
                                        <TouchableOpacity
                                            style={styles.removeMemberBadge}
                                            onPress={() => handleRemoveMember(member.user_id)}
                                        >
                                            <X size={8} color={colors.textLight} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                            {projectMembers.length === 0 && (
                                <Text style={[styles.noMembersText, { color: colors.textSecondary }]}>No members assigned</Text>
                            )}
                        </ScrollView>
                    </View>
                </LinearGradient>
            </Animated.View>

            <FlatList
                data={filteredTasks}
                renderItem={renderTask}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <Text style={styles.listTitle}>
                            Tasks {selectedFilter !== 'ALL' && `- ${selectedFilter.replace('_', ' ')}`}
                        </Text>
                        <Text style={styles.listCount}>{filteredTasks.length}</Text>
                    </View>
                }
                ListEmptyComponent={
                    <Animated.View
                        style={[
                            styles.emptyState,
                            { opacity: fadeAnim }
                        ]}
                    >
                        <LinearGradient
                            colors={[colors.cardLight, colors.cardDark]}
                            style={[styles.emptyIllustration, { borderColor: colors.border }]}
                        >
                            <Target size={48} color={colors.primary} />
                        </LinearGradient>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No tasks yet</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                            Create your first task to get started
                        </Text>
                    </Animated.View>
                }
            />

            <Animated.View
                style={[
                    styles.fabContainer,
                    {
                        transform: [{
                            scale: fadeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.5, 1]
                            })
                        }]
                    }
                ]}
            >
                <TouchableOpacity
                    style={[styles.fab, { shadowColor: colors.primary }]}
                    onPress={() => router.push({ pathname: '/task/create', params: { projectId: id } })}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        style={styles.fabGradient}
                    >
                        <Plus color={colors.textLight} size={24} />
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>



            {/* Filter Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={filterModalVisible}
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <BlurView intensity={20} tint={theme} style={styles.modalOverlay}>
                    <Animated.View
                        style={[
                            styles.modalContent,
                            styles.filterModal,
                            {
                                backgroundColor: colors.modalBackground,
                                shadowColor: colors.shadow,
                                transform: [{
                                    scale: scaleAnim
                                }]
                            }
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter Tasks</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setFilterModalVisible(false)}
                            >
                                <X size={20} color="#a0430a" />
                            </TouchableOpacity>
                        </View>

                        {(['ALL', 'TODO', 'IN_PROGRESS', 'DONE'] as const).map((filter) => (
                            <TouchableOpacity
                                key={filter}
                                style={[
                                    styles.filterOption,
                                    { borderColor: colors.border },
                                    selectedFilter === filter && { backgroundColor: colors.badgeBackground, borderColor: colors.primary }
                                ]}
                                onPress={() => {
                                    setSelectedFilter(filter);
                                    setFilterModalVisible(false);
                                }}
                            >
                                <Text style={[
                                    styles.filterOptionText,
                                    { color: colors.text },
                                    selectedFilter === filter && { color: colors.primary, fontWeight: '700' }
                                ]}>
                                    {filter === 'ALL' ? 'All Tasks' : filter.replace('_', ' ')}
                                </Text>
                                <Text style={[styles.filterCount, { color: colors.textSecondary }]}>
                                    {filter === 'ALL' ? tasks.length : getStatusCount(filter)}
                                </Text>
                                {selectedFilter === filter && (
                                    <ChevronRight size={18} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                </BlurView>
            </Modal>

            {/* Add Member Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={memberModalVisible}
                onRequestClose={() => setMemberModalVisible(false)}
            >
                <BlurView intensity={20} tint={theme} style={styles.modalOverlay}>
                    <Animated.View
                        style={[
                            styles.modalContent,
                            {
                                backgroundColor: colors.modalBackground,
                                shadowColor: colors.shadow,
                                transform: [{
                                    scale: scaleAnim
                                }]
                            }
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Project Member</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setMemberModalVisible(false)}
                            >
                                <X size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={workspaceMembers.filter(wm => !projectMembers.some(pm => pm.user_id === wm.userId))}
                            keyExtractor={(item) => item.id}
                            style={{ maxHeight: 400 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.memberSelectItem, { borderColor: colors.border }]}
                                    onPress={() => handleAddMember(item.userId)}
                                    disabled={addingMember}
                                >
                                    <View style={styles.memberSelectInfo}>
                                        <LinearGradient
                                            colors={[colors.primary, colors.secondary]}
                                            style={styles.memberSelectAvatar}
                                        >
                                            <Text style={styles.memberAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                                        </LinearGradient>
                                        <View>
                                            <Text style={[styles.memberSelectName, { color: colors.text }]}>{item.name}</Text>
                                            <Text style={[styles.memberSelectEmail, { color: colors.textSecondary }]}>{item.email}</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.addBadge, { backgroundColor: colors.primary + '15' }]}>
                                        {addingMember ? <ActivityIndicator size="small" color={colors.primary} /> : <Plus size={16} color={colors.primary} />}
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyMembersSelect}>
                                    <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>All workspace members are already in this project</Text>
                                </View>
                            }
                        />
                    </Animated.View>
                </BlurView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 100,
        paddingBottom: 20,
    },
    headerGradient: {
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#fc350b20',
        shadowColor: '#a0430a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    projectName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#a0430a',
        fontFamily: 'Inter_700Bold',
        flex: 1,
    },
    headerTopActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerOptionButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fc350b30',
    },
    filterButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#fef1e1',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fc350b30',
    },
    projectDescription: {
        fontSize: 14,
        color: '#a0430a',
        fontFamily: 'Inter_400Regular',
        lineHeight: 20,
        marginBottom: 20,
        opacity: 0.8,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        marginHorizontal: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#a0430a',
        fontFamily: 'Inter_700Bold',
        marginVertical: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#a0430a',
        fontFamily: 'Inter_400Regular',
        opacity: 0.8,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#fef1e1',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#fc350b',
        borderRadius: 3,
    },
    list: {
        padding: 20,
        paddingBottom: 100,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#a0430a',
        fontFamily: 'Inter_600SemiBold',
    },
    listCount: {
        fontSize: 14,
        color: '#fc350b',
        fontFamily: 'Inter_600SemiBold',
        backgroundColor: '#fc350b15',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    card: {
        marginBottom: 12,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#fc350b20',
        shadowColor: '#a0430a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardGradient: {
        flexDirection: 'row',
    },
    priorityIndicator: {
        width: 6,
        height: 'auto',
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
    },
    cardContent: {
        flex: 1,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#a0430a',
        fontFamily: 'Inter_600SemiBold',
        flex: 1,
        marginRight: 12,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
        textTransform: 'uppercase',
    },
    cardDesc: {
        fontSize: 13,
        color: '#a0430a',
        fontFamily: 'Inter_400Regular',
        lineHeight: 18,
        marginBottom: 12,
        opacity: 0.8,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    metaText: {
        fontSize: 11,
        color: '#a0430a',
        fontFamily: 'Inter_400Regular',
        textTransform: 'capitalize',
    },
    avatarGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fef1e1',
    },
    avatarText: {
        fontSize: 9,
        fontWeight: '600',
        color: '#fef1e1',
        fontFamily: 'Inter_600SemiBold',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyIllustration: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#fc350b30',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#a0430a',
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#fc350b',
        fontFamily: 'Inter_400Regular',
        textAlign: 'center',
        lineHeight: 20,
        opacity: 0.8,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 30,
        right: 24,
    },
    fab: {
        width: 64,
        height: 64,
        borderRadius: 32,
        shadowColor: '#fc350b',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    fabGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#ffffff',
        borderRadius: 28,
        padding: 24,
        borderWidth: 1,
        borderColor: '#fc350b20',
        shadowColor: '#a0430a',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 16,
    },
    filterModal: {
        maxWidth: 300,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#a0430a',
        fontFamily: 'Inter_700Bold',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#fef1e1',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fc350b30',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#a0430a',
        fontFamily: 'Inter_500Medium',
        marginBottom: 8,
    },
    inputWrapper: {
        backgroundColor: '#fef1e1',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#fc350b30',
        paddingHorizontal: 16,
    },
    textAreaWrapper: {
        paddingVertical: 8,
    },
    input: {
        fontSize: 16,
        color: '#a0430a',
        fontFamily: 'Inter_400Regular',
        paddingVertical: 14,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    prioritySelector: {
        flexDirection: 'row',
        gap: 8,
    },
    priorityOption: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fc350b30',
        alignItems: 'center',
        backgroundColor: '#fef1e1',
    },
    priorityOptionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#a0430a',
        fontFamily: 'Inter_600SemiBold',
    },
    createButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 8,
        shadowColor: '#fc350b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    createButtonGradient: {
        padding: 16,
        alignItems: 'center',
    },
    createButtonText: {
        color: '#fef1e1',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
    filterOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#fef1e1',
        borderWidth: 1,
        borderColor: '#fc350b20',
    },
    filterOptionSelected: {
        backgroundColor: '#fc350b15',
        borderColor: '#fc350b',
    },
    filterOptionText: {
        fontSize: 15,
        color: '#a0430a',
        fontFamily: 'Inter_500Medium',
    },
    filterOptionTextSelected: {
        fontWeight: '600',
        color: '#fc350b',
    },
    filterCount: {
        fontSize: 14,
        color: '#a0430a',
        fontFamily: 'Inter_600SemiBold',
        marginRight: 8,
    },
    membersSection: {
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#fc350b20',
    },
    membersHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    membersTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    membersTitle: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
    memberBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    memberBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    addMemberButton: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    membersScroll: {
        paddingRight: 20,
        gap: 15,
    },
    memberAvatarContainer: {
        alignItems: 'center',
        width: 50,
    },
    memberAvatar: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    memberAvatarText: {
        color: '#fef1e1',
        fontSize: 14,
        fontWeight: '700',
    },
    memberSmallName: {
        fontSize: 9,
        fontFamily: 'Inter_500Medium',
        textAlign: 'center',
    },
    removeMemberBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#fc350b',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fef1e1',
    },
    noMembersText: {
        fontSize: 12,
        fontStyle: 'italic',
        opacity: 0.7,
    },
    memberSelectItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 10,
    },
    memberSelectInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    memberSelectAvatar: {
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    memberSelectName: {
        fontSize: 15,
        fontWeight: '600',
    },
    memberSelectEmail: {
        fontSize: 12,
        opacity: 0.7,
    },
    addBadge: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyMembersSelect: {
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
        fontFamily: 'Inter_500Medium',
        lineHeight: 24,
    },
    backButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
});
