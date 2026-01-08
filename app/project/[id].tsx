import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { projectApi, Project } from '@/utils/api/projects';
import { taskApi, Task, CreateTaskData } from '@/utils/api/tasks';
import { Plus, X, Calendar, CheckCircle, Clock, AlertCircle, Target, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProjectDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
    const [creating, setCreating] = useState(false);
    
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        if (id) {
            loadData();
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
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

    const loadData = async () => {
        setLoading(true);
        const [projResponse, tasksResponse] = await Promise.all([
            projectApi.getById(id!),
            taskApi.getAll(id!)
        ]);

        if (projResponse.success) {
            setProject(projResponse.data);
        }

        if (tasksResponse.success) {
            setTasks(tasksResponse.data);
        }

        setLoading(false);
    };

    const handleCreateTask = async () => {
        if (!newTaskTitle.trim()) {
            Alert.alert('Error', 'Please enter a task title');
            return;
        }

        setCreating(true);
        const taskData: CreateTaskData = {
            title: newTaskTitle,
            description: newTaskDesc,
            priority: newTaskPriority,
            status: 'TODO'
        };

        const response = await taskApi.create(id!, taskData);
        setCreating(false);

        if (response.success) {
            setNewTaskTitle('');
            setNewTaskDesc('');
            setNewTaskPriority('MEDIUM');
            setModalVisible(false);
            loadData();
        } else {
            Alert.alert('Error', response.message || 'Failed to create task');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DONE': return '#10B981';
            case 'IN_PROGRESS': return '#3B82F6';
            case 'TODO': return '#F59E0B';
            default: return '#94A3B8';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH': return '#EF4444';
            case 'URGENT': return '#DC2626';
            case 'MEDIUM': return '#F59E0B';
            case 'LOW': return '#6B7280';
            default: return '#94A3B8';
        }
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
                <View style={[styles.statusStrip, { backgroundColor: getStatusColor(item.status) }]} />
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
                                <Calendar size={12} color="#94A3B8" style={{ marginRight: 4 }} />
                                <Text style={styles.metaText}>
                                    {new Date(item.due_date).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric' 
                                    })}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
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

    if (!project) {
        return (
            <View style={styles.centered}>
                <Text>Project not found</Text>
            </View>
        );
    }

    const todoCount = getStatusCount('TODO');
    const inProgressCount = getStatusCount('IN_PROGRESS');
    const doneCount = getStatusCount('DONE');

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <LinearGradient
                colors={['#F1F5F9', '#FFFFFF']}
                style={styles.gradientBackground}
            >
                <Stack.Screen 
                    options={{ 
                        title: project.name,
                        headerBackTitle: 'Back',
                        headerTintColor: '#6366F1',
                    }} 
                />

                <Animated.View 
                    style={[
                        styles.header,
                        {
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <LinearGradient
                        colors={['#FFFFFF', '#F8FAFC']}
                        style={styles.headerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.projectName}>{project.name}</Text>
                        {project.description && (
                            <Text style={styles.projectDescription}>{project.description}</Text>
                        )}
                        
                        <View style={styles.statsContainer}>
                            <View style={styles.statCard}>
                                <Target size={20} color="#F59E0B" />
                                <Text style={styles.statValue}>{todoCount}</Text>
                                <Text style={styles.statLabel}>To Do</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Clock size={20} color="#3B82F6" />
                                <Text style={styles.statValue}>{inProgressCount}</Text>
                                <Text style={styles.statLabel}>In Progress</Text>
                            </View>
                            <View style={styles.statCard}>
                                <CheckCircle size={20} color="#10B981" />
                                <Text style={styles.statValue}>{doneCount}</Text>
                                <Text style={styles.statLabel}>Done</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>

                <FlatList
                    data={tasks}
                    renderItem={renderTask}
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
                                <Target size={48} color="#CBD5E1" />
                            </View>
                            <Text style={styles.emptyTitle}>No tasks yet</Text>
                            <Text style={styles.emptySubtitle}>
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
                        style={styles.fab}
                        onPress={() => setModalVisible(true)}
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
                                <Text style={styles.modalTitle}>New Task</Text>
                                <TouchableOpacity 
                                    style={styles.closeButton}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <X size={20} color="#64748B" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Title</Text>
                                <TextInput
                                    style={styles.input}
                                    value={newTaskTitle}
                                    onChangeText={setNewTaskTitle}
                                    placeholder="What needs to be done?"
                                    placeholderTextColor="#94A3B8"
                                    autoFocus
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={newTaskDesc}
                                    onChangeText={setNewTaskDesc}
                                    placeholder="Add details..."
                                    placeholderTextColor="#94A3B8"
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Priority</Text>
                                <View style={styles.prioritySelector}>
                                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
                                        <TouchableOpacity
                                            key={p}
                                            style={[
                                                styles.priorityOption,
                                                newTaskPriority === p && styles.priorityOptionSelected,
                                                newTaskPriority === p && { 
                                                    borderColor: getPriorityColor(p),
                                                    backgroundColor: getPriorityColor(p) + '15'
                                                }
                                            ]}
                                            onPress={() => setNewTaskPriority(p)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[
                                                styles.priorityOptionText,
                                                newTaskPriority === p && { color: getPriorityColor(p) }
                                            ]}>
                                                {p}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.createButton}
                                onPress={handleCreateTask}
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
                                        <Text style={styles.createButtonText}>Create Task</Text>
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
    projectName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0F172A',
        fontFamily: 'Inter_700Bold',
        marginBottom: 8,
    },
    projectDescription: {
        fontSize: 14,
        color: '#64748B',
        fontFamily: 'Inter_400Regular',
        lineHeight: 20,
        marginBottom: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        marginHorizontal: 6,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
        fontFamily: 'Inter_700Bold',
        marginVertical: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
        fontFamily: 'Inter_400Regular',
        textAlign: 'center',
    },
    list: {
        padding: 20,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 16,
        flexDirection: 'row',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    statusStrip: {
        width: 6,
        height: '100%',
    },
    cardContent: {
        flex: 1,
        padding: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
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
        fontSize: 14,
        color: '#64748B',
        fontFamily: 'Inter_400Regular',
        lineHeight: 20,
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        marginBottom: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    metaText: {
        fontSize: 12,
        color: '#64748B',
        fontFamily: 'Inter_400Regular',
        textTransform: 'capitalize',
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
    prioritySelector: {
        flexDirection: 'row',
        gap: 10,
    },
    priorityOption: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    priorityOptionSelected: {
        borderWidth: 2,
    },
    priorityOptionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        fontFamily: 'Inter_600SemiBold',
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