import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { workspaceApi, Workspace } from '@/utils/api/workspaces';
import { projectApi, Project } from '@/utils/api/projects';
import { Plus, X, Folder, Users, Calendar, ArrowRight, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function WorkspaceDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [creating, setCreating] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const listAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        if (id) {
            loadData();
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.spring(listAnim, {
                    toValue: 0,
                    tension: 30,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        const [wsResponse, projectsResponse] = await Promise.all([
            workspaceApi.getById(id!),
            projectApi.getByWorkspace(id!)
        ]);

        if (wsResponse.success) {
            setWorkspace(wsResponse.data);
        }

        if (projectsResponse.success) {
            setProjects(projectsResponse.data);
        }

        setLoading(false);
    };

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) {
            Alert.alert('Error', 'Please enter a project name');
            return;
        }

        setCreating(true);
        const response = await projectApi.create(id!, newProjectName, newProjectDesc);
        setCreating(false);

        if (response.success) {
            setNewProjectName('');
            setNewProjectDesc('');
            setModalVisible(false);
            loadData();
        } else {
            Alert.alert('Error', response.message || 'Failed to create project');
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'OWNER': return '#8B5CF6';
            case 'ADMIN': return '#3B82F6';
            case 'MEMBER': return '#10B981';
            default: return '#6B7280';
        }
    };

    const renderProject = ({ item, index }: { item: Project; index: number }) => (
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
                onPress={() => router.push(`/project/${item.id}`)}
                activeOpacity={0.7}
            >
                <LinearGradient
                    colors={['#FFFFFF', '#F8FAFC']}
                    style={styles.cardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.cardHeader}>
                        <View style={styles.projectIcon}>
                            <Folder size={24} color="#6366F1" />
                        </View>
                        <View style={styles.taskCount}>
                            <Text style={styles.taskCountText}>12 tasks</Text>
                        </View>
                    </View>

                    <Text style={styles.cardTitle}>{item.name}</Text>

                    {item.description ? (
                        <Text style={styles.cardDesc} numberOfLines={2}>
                            {item.description}
                        </Text>
                    ) : (
                        <Text style={styles.cardDescPlaceholder}>No description</Text>
                    )}

                    <View style={styles.cardFooter}>
                        <View style={styles.dateContainer}>
                            <Calendar size={12} color="#94A3B8" />
                            <Text style={styles.dateText}>
                                Created {new Date(item.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </Text>
                        </View>
                        <View style={styles.arrowContainer}>
                            <ArrowRight size={16} color="#6366F1" />
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    if (!workspace) {
        return (
            <View style={styles.centered}>
                <Text>Workspace not found</Text>
            </View>
        );
    }

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <LinearGradient
                colors={['#F1F5F9', '#FFFFFF']}
                style={styles.gradientBackground}
            >
                <Stack.Screen
                    options={{
                        title: workspace.name,
                        headerBackTitle: 'Back',
                        headerTintColor: '#6366F1',
                    }}
                />

                <Animated.View
                    style={[
                        styles.header,
                        {
                            transform: [{ translateY: listAnim }]
                        }
                    ]}
                >
                    <LinearGradient
                        colors={['#FFFFFF', '#F8FAFC']}
                        style={styles.headerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.roleContainer}>
                            <View style={[
                                styles.roleBadge,
                                { backgroundColor: getRoleColor(workspace.role) + '15' }
                            ]}>
                                <Text style={[
                                    styles.roleText,
                                    { color: getRoleColor(workspace.role) }
                                ]}>
                                    {workspace.role}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.membersButton}
                                onPress={() => router.push(`/workspace/${id}/members`)}
                                activeOpacity={0.7}
                            >
                                <Users size={16} color="#6366F1" />
                                <Text style={styles.membersButtonText}>Members</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.stats}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{projects.length}</Text>
                                <Text style={styles.statLabel}>Projects</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <TrendingUp size={20} color="#6366F1" />
                                <Text style={styles.statLabel}>Active</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>

                <FlatList
                    data={projects}
                    renderItem={renderProject}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <Animated.View
                            style={[
                                styles.emptyState,
                                { opacity: fadeAnim }
                            ]}
                        >
                            <View style={styles.emptyIllustration}>
                                <Folder size={48} color="#CBD5E1" />
                            </View>
                            <Text style={styles.emptyTitle}>No projects yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Create a project to start organizing tasks
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
                        style={styles.fab}
                        onPress={() => router.push({ pathname: '/project/create', params: { workspaceId: id } })}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#6366F1', '#8B5CF6']}
                            style={styles.fabGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Plus color="#fff" size={24} />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
                        <Animated.View
                            style={[
                                styles.modalContent,
                                {
                                    transform: [{
                                        scale: fadeAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.9, 1]
                                        })
                                    }]
                                }
                            ]}
                        >
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>New Project</Text>
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <X size={20} color="#64748B" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Project Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={newProjectName}
                                    onChangeText={setNewProjectName}
                                    placeholder="Ex. Q3 Roadmap"
                                    placeholderTextColor="#94A3B8"
                                    autoFocus
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Description (Optional)</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={newProjectDesc}
                                    onChangeText={setNewProjectDesc}
                                    placeholder="Brief description of the project..."
                                    placeholderTextColor="#94A3B8"
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.createButton}
                                onPress={handleCreateProject}
                                disabled={creating}
                                activeOpacity={0.7}
                            >
                                <LinearGradient
                                    colors={creating ? ['#94A3B8', '#CBD5E1'] : ['#6366F1', '#8B5CF6']}
                                    style={styles.createButtonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    {creating ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.createButtonText}>Create Project</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </Animated.View>
                </Modal>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradientBackground: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 24,
    },
    headerGradient: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 8,
    },
    roleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
        textTransform: 'uppercase',
    },
    membersButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    membersButtonText: {
        fontSize: 12,
        color: '#6366F1',
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
        marginLeft: 6,
    },
    stats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0F172A',
        fontFamily: 'Inter_700Bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
        fontFamily: 'Inter_400Regular',
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: '#E2E8F0',
    },
    list: {
        padding: 20,
        paddingBottom: 100,
    },
    card: {
        marginBottom: 16,
        borderRadius: 20,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 8,
    },
    cardGradient: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    projectIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    taskCount: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    taskCountText: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 8,
    },
    cardDesc: {
        fontSize: 14,
        color: '#64748B',
        fontFamily: 'Inter_400Regular',
        lineHeight: 20,
        marginBottom: 16,
    },
    cardDescPlaceholder: {
        fontSize: 14,
        color: '#CBD5E1',
        fontFamily: 'Inter_400Regular',
        fontStyle: 'italic',
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 12,
        color: '#94A3B8',
        fontFamily: 'Inter_400Regular',
        marginLeft: 6,
    },
    arrowContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyIllustration: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#475569',
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        fontFamily: 'Inter_400Regular',
        textAlign: 'center',
        lineHeight: 20,
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
        shadowColor: '#6366F1',
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
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.2,
        shadowRadius: 32,
        elevation: 16,
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
        color: '#0F172A',
        fontFamily: 'Inter_700Bold',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#475569',
        fontFamily: 'Inter_500Medium',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        fontFamily: 'Inter_400Regular',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    createButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    createButtonGradient: {
        padding: 18,
        alignItems: 'center',
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
});