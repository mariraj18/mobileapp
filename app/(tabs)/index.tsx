import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Animated, ScrollView, Dimensions } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { workspaceApi, Workspace } from '@/utils/api/workspaces';
import { taskApi, CreateStandaloneTaskData } from '@/utils/api/tasks';
import { Plus, X, Users, Calendar, ArrowRight, Sparkles, CheckSquare, Briefcase, Clock, Target, TrendingUp, Layers, Zap, Star, Award, ChevronRight, Hash, Circle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function WorkspacesScreen() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [choiceModalVisible, setChoiceModalVisible] = useState(false);
  const [workspaceModalVisible, setWorkspaceModalVisible] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newTask, setNewTask] = useState<CreateStandaloneTaskData>({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    due_date: undefined,
  });
  const [creating, setCreating] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const [stats, setStats] = useState({ active: 0, completed: 0, dueToday: 0 });

  useEffect(() => {
    loadData();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 30,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [wsResponse, tasksResponse] = await Promise.all([
        workspaceApi.getAll(),
        taskApi.getUserTasks()
      ]);

      if (wsResponse.success) {
        setWorkspaces(wsResponse.data);
      }

      if (tasksResponse.success && tasksResponse.stats) {
        setStats(tasksResponse.stats);
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      Alert.alert('Error', 'Please enter a workspace name');
      return;
    }

    setCreating(true);
    const response = await workspaceApi.create(newWorkspaceName);
    setCreating(false);

    if (response.success) {
      const workspaceWithRole = { ...response.data, role: 'OWNER', joined_at: new Date().toISOString() };
      setWorkspaces(prev => [workspaceWithRole, ...prev]);
      setNewWorkspaceName('');
      setWorkspaceModalVisible(false);
      setChoiceModalVisible(false);
      loadData();
    } else {
      Alert.alert('Error', response.message || 'Failed to create workspace');
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    setCreatingTask(true);
    const response = await taskApi.createStandalone(newTask);
    setCreatingTask(false);

    if (response.success) {
      setNewTask({
        title: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        due_date: undefined,
      });
      setTaskModalVisible(false);
      setChoiceModalVisible(false);
      Alert.alert('Success', 'Task created successfully!', [
        { text: 'OK', onPress: () => router.push('/tasks') }
      ]);
    } else {
      Alert.alert('Error', response.message || 'Failed to create task');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return '#fc350b';
      case 'ADMIN': return '#a0430a';
      case 'MEMBER': return '#f89b7a';
      default: return '#dfe8e6';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER': return <Award size={12} color="#fc350b" />;
      case 'ADMIN': return <Star size={12} color="#a0430a" />;
      case 'MEMBER': return <Users size={12} color="#f89b7a" />;
      default: return <Circle size={12} color="#dfe8e6" />;
    }
  };

  const renderAnalyticsCard = (title: string, count: number, icon: any, color: string, delay: number) => (
    <Animated.View
      style={[
        styles.analyticsCardContainer,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [30 * delay, 0]
            })
          }]
        }
      ]}
    >
      <LinearGradient
        colors={['#ffffff', '#fef1e1']}
        style={styles.analyticsCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.analyticsIcon, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        <View style={styles.analyticsContent}>
          <Text style={styles.analyticsCount}>{count}</Text>
          <Text style={styles.analyticsLabel}>{title}</Text>
        </View>

      </LinearGradient>
    </Animated.View>
  );

  const renderWorkspace = ({ item, index }: { item: Workspace; index: number }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [50 * (index + 1), 0]
          })
        }],
      }}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/workspace/${item.id}`)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#ffffff', '#fef1e1']}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.workspaceIcon, { backgroundColor: getRoleColor(item.role || 'MEMBER') + '15' }]}>
              <Layers size={22} color={getRoleColor(item.role || 'MEMBER')} />
            </View>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role || 'MEMBER') + '15' }]}>
              {getRoleIcon(item.role || 'MEMBER')}
              <Text style={[styles.roleText, { color: getRoleColor(item.role || 'MEMBER') }]}>
                {item.role || 'MEMBER'}
              </Text>
            </View>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <View style={styles.cardMeta}>
              <View style={styles.dateContainer}>
                <Calendar size={12} color="#a0430a" />
                <Text style={styles.dateText}>
                  {new Date(item.joined_at || new Date().toISOString()).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
              </View>
              <View style={styles.taskCountContainer}>
                <CheckSquare size={12} color="#fc350b" />
                <Text style={styles.taskCountText}>12 tasks</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.memberAvatars}>
              <View style={[styles.avatar, { backgroundColor: '#fc350b' }]}>
                <Text style={styles.avatarText}>JD</Text>
              </View>
              <View style={[styles.avatar, styles.avatarOverlap, { backgroundColor: '#a0430a' }]}>
                <Text style={styles.avatarText}>MK</Text>
              </View>
              <View style={[styles.avatar, styles.avatarOverlap, { backgroundColor: '#f89b7a' }]}>
                <Text style={styles.avatarText}>+3</Text>
              </View>
            </View>
            <View style={styles.arrowContainer}>
              <ChevronRight size={18} color="#fc350b" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#fef1e1', '#ffffff']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#fc350b" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#fef1e1', '#ffffff', '#dfe8e6']}
        style={styles.gradientBackground}
        locations={[0, 0.6, 1]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View>
              <View style={styles.dateBadge}>
                <Clock size={14} color="#a0430a" />
                <Text style={styles.dateText}>{currentDate}</Text>
              </View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.name?.split(' ')[0]}</Text>
            </View>

            <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileWrapper}>
              <LinearGradient
                colors={['#fc350b', '#a0430a']}
                style={styles.profileGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.profileImageContainer}>
                  <Text style={styles.profileInitials}>
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Welcome Banner */}
          <Animated.View
            style={[
              styles.welcomeBanner,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <LinearGradient
              colors={['#fc350b', '#a0430a']}
              style={styles.welcomeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.welcomeContent}>
                <View>
                  <Text style={styles.welcomeTitle}>Ready to conquer today?</Text>
                  <Text style={styles.welcomeSubtitle}>You have {stats.active} active tasks</Text>
                </View>
                <View style={styles.welcomeIcon}>
                  <Target size={32} color="#fef1e1" />
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Analytics Section */}
          <View style={styles.analyticsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Zap size={20} color="#fc350b" />
                <Text style={styles.sectionTitle}>Quick Stats</Text>
              </View>
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => router.push('/tasks')}
              >
                <Text style={styles.seeAllText}>Tasks</Text>
                <ArrowRight size={14} color="#fc350b" />
              </TouchableOpacity>
            </View>

            <View style={styles.analyticsRow}>
              {renderAnalyticsCard('Due Today', stats.dueToday,
                <Calendar size={20} color="#fc350b" />, '#fc350b', 1)}
              {renderAnalyticsCard('Active', stats.active,
                <Target size={20} color="#a0430a" />, '#a0430a', 2)}
              {renderAnalyticsCard('Completed', stats.completed,
                <Sparkles size={20} color="#f89b7a" />, '#f89b7a', 3)}
            </View>
          </View>

          {/* Workspaces Section */}
          <View style={styles.workspacesSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Briefcase size={20} color="#fc350b" />
                <Text style={styles.sectionTitle}>Your Workspaces</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{workspaces.length}</Text>
              </View>
            </View>

            {workspaces.length === 0 ? (
              <View style={styles.emptyState}>
                <LinearGradient
                  colors={['#ffffff', '#fef1e1']}
                  style={styles.emptyIllustration}
                >
                  <Layers size={48} color="#fc350b" />
                </LinearGradient>
                <Text style={styles.emptyTitle}>No workspaces yet</Text>
                <Text style={styles.emptySubtitle}>
                  Create your first workspace to start collaborating with your team
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => setChoiceModalVisible(true)}
                >
                  <LinearGradient
                    colors={['#fc350b', '#a0430a']}
                    style={styles.emptyButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Plus size={18} color="#ffffff" />
                    <Text style={styles.emptyButtonText}>Create Workspace</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              workspaces.map((item, index) => (
                <View key={item.id} style={{ marginBottom: 16 }}>
                  {renderWorkspace({ item, index })}
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* FAB */}
        <Animated.View
          style={[
            styles.fabContainer,
            {
              opacity: fadeAnim,
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
            onPress={() => setChoiceModalVisible(true)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#fc350b', '#a0430a']}
              style={styles.fabGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Plus color="#fef1e1" size={28} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Modals */}
        {/* Choice Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={choiceModalVisible}
          onRequestClose={() => setChoiceModalVisible(false)}
        >
          <BlurView intensity={20} style={styles.modalOverlay}>
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
                <Text style={styles.modalTitle}>Create New</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setChoiceModalVisible(false)}
                >
                  <X size={20} color="#a0430a" />
                </TouchableOpacity>
              </View>

              <View style={styles.choiceContainer}>
                <TouchableOpacity
                  style={styles.choiceCard}
                  onPress={() => {
                    setChoiceModalVisible(false);
                    setTaskModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#fef1e1', '#ffffff']}
                    style={styles.choiceGradient}
                  >
                    <View style={[styles.choiceIconContainer, { backgroundColor: '#fc350b15' }]}>
                      <CheckSquare size={32} color="#fc350b" />
                    </View>
                    <Text style={styles.choiceTitle}>Quick Task</Text>
                    <Text style={styles.choiceDescription}>
                      Create a personal task
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.choiceCard}
                  onPress={() => {
                    setChoiceModalVisible(false);
                    setWorkspaceModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#fef1e1', '#ffffff']}
                    style={styles.choiceGradient}
                  >
                    <View style={[styles.choiceIconContainer, { backgroundColor: '#a0430a15' }]}>
                      <Briefcase size={32} color="#a0430a" />
                    </View>
                    <Text style={styles.choiceTitle}>New Workspace</Text>
                    <Text style={styles.choiceDescription}>
                      Collaborate with team
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </BlurView>
        </Modal>

        {/* Workspace Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={workspaceModalVisible}
          onRequestClose={() => setWorkspaceModalVisible(false)}
        >
          <BlurView intensity={20} style={styles.modalOverlay}>
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
                <Text style={styles.modalTitle}>Create Workspace</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setWorkspaceModalVisible(false)}
                >
                  <X size={20} color="#a0430a" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Workspace Name</Text>
                <View style={styles.inputWrapper}>
                  <Hash size={18} color="#fc350b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={newWorkspaceName}
                    onChangeText={setNewWorkspaceName}
                    placeholder="e.g., Product Design Team"
                    placeholderTextColor="#a0430a60"
                    autoFocus
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateWorkspace}
                disabled={creating}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={creating ? ['#dfe8e6', '#c0cfcb'] : ['#fc350b', '#a0430a']}
                  style={styles.createButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {creating ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.createButtonText}>Create Workspace</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </BlurView>
        </Modal>

        {/* Task Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={taskModalVisible}
          onRequestClose={() => setTaskModalVisible(false)}
        >
          <BlurView intensity={20} style={styles.modalOverlay}>
            <ScrollView
              contentContainerStyle={styles.scrollModalContent}
              showsVerticalScrollIndicator={false}
            >
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
                  <Text style={styles.modalTitle}>Create Quick Task</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setTaskModalVisible(false)}
                  >
                    <X size={20} color="#a0430a" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Title *</Text>
                  <View style={styles.inputWrapper}>
                    <CheckSquare size={18} color="#fc350b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={newTask.title}
                      onChangeText={(text) => setNewTask({ ...newTask, title: text })}
                      placeholder="What needs to be done?"
                      placeholderTextColor="#a0430a60"
                      autoFocus
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Description</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={newTask.description}
                      onChangeText={(text) => setNewTask({ ...newTask, description: text })}
                      placeholder="Add details..."
                      placeholderTextColor="#a0430a60"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.label}>Priority</Text>
                    <View style={styles.pickerContainer}>
                      <TouchableOpacity
                        style={[styles.pickerButton, newTask.priority === 'LOW' && styles.pickerButtonActiveLow]}
                        onPress={() => setNewTask({ ...newTask, priority: 'LOW' })}
                      >
                        <Text style={[styles.pickerText, newTask.priority === 'LOW' && styles.pickerTextActive]}>Low</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.pickerButton, newTask.priority === 'MEDIUM' && styles.pickerButtonActiveMedium]}
                        onPress={() => setNewTask({ ...newTask, priority: 'MEDIUM' })}
                      >
                        <Text style={[styles.pickerText, newTask.priority === 'MEDIUM' && styles.pickerTextActive]}>Med</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.pickerButton, newTask.priority === 'HIGH' && styles.pickerButtonActiveHigh]}
                        onPress={() => setNewTask({ ...newTask, priority: 'HIGH' })}
                      >
                        <Text style={[styles.pickerText, newTask.priority === 'HIGH' && styles.pickerTextActive]}>High</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.label}>Status</Text>
                    <View style={styles.pickerContainer}>
                      <TouchableOpacity
                        style={[styles.pickerButton, newTask.status === 'TODO' && styles.pickerButtonActiveStatus]}
                        onPress={() => setNewTask({ ...newTask, status: 'TODO' })}
                      >
                        <Text style={[styles.pickerText, newTask.status === 'TODO' && styles.pickerTextActive]}>To Do</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.pickerButton, newTask.status === 'IN_PROGRESS' && styles.pickerButtonActiveStatus]}
                        onPress={() => setNewTask({ ...newTask, status: 'IN_PROGRESS' })}
                      >
                        <Text style={[styles.pickerText, newTask.status === 'IN_PROGRESS' && styles.pickerTextActive]}>Doing</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.pickerButton, newTask.status === 'DONE' && styles.pickerButtonActiveStatus]}
                        onPress={() => setNewTask({ ...newTask, status: 'DONE' })}
                      >
                        <Text style={[styles.pickerText, newTask.status === 'DONE' && styles.pickerTextActive]}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Due Date</Text>
                  <View style={styles.inputWrapper}>
                    <Calendar size={18} color="#fc350b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={newTask.due_date || ''}
                      onChangeText={(text) => setNewTask({ ...newTask, due_date: text || undefined })}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#a0430a60"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.createButton}
                  onPress={handleCreateTask}
                  disabled={creatingTask}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={creatingTask ? ['#dfe8e6', '#c0cfcb'] : ['#fc350b', '#a0430a']}
                    style={styles.createButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {creatingTask ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.createButtonText}>Create Task</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </ScrollView>
          </BlurView>
        </Modal>
      </LinearGradient>
    </View>
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
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
    marginBottom: 12,
    alignSelf: 'flex-start',
    shadowColor: '#fc350b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#a0430a',
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 6,
  },
  greeting: {
    fontSize: 14,
    color: '#a0430a',
    fontFamily: 'Inter_400Regular',
  },
  userName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fc350b',
    fontFamily: 'Inter_700Bold',
    lineHeight: 40,
  },
  profileWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#fc350b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
  },
  profileGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    backgroundColor: '#fef1e1',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: '#a0430a',
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  welcomeBanner: {
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#fc350b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  welcomeGradient: {
    padding: 24,
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fef1e1',
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#fef1e1',
    fontFamily: 'Inter_400Regular',
    opacity: 0.9,
  },
  welcomeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(254, 241, 225, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyticsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#a0430a',
    fontFamily: 'Inter_700Bold',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#fc350b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  seeAllText: {
    fontSize: 12,
    color: '#fc350b',
    fontFamily: 'Inter_600SemiBold',
  },
  analyticsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  analyticsCardContainer: {
    flex: 1,
  },
  analyticsCard: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fc350b20',
    shadowColor: '#fc350b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  analyticsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyticsContent: {
    flex: 1,
  },
  analyticsCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#a0430a',
    fontFamily: 'Inter_700Bold',
    lineHeight: 22,
  },
  analyticsLabel: {
    fontSize: 10,
    color: '#fc350b',
    fontFamily: 'Inter_500Medium',
  },
  analyticsTrend: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workspacesSection: {
    paddingHorizontal: 24,
  },
  countBadge: {
    backgroundColor: '#fc350b15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fc350b30',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fc350b',
    fontFamily: 'Inter_600SemiBold',
  },
  card: {
    borderRadius: 24,
    shadowColor: '#a0430a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGradient: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fc350b20',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  workspaceIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 2,
  },
  cardContent: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#a0430a',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  taskCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskCountText: {
    fontSize: 12,
    color: '#a0430a',
    fontFamily: 'Inter_400Regular',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fef1e1',
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fef1e1',
    fontFamily: 'Inter_600SemiBold',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fc350b15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#fc350b20',
    shadowColor: '#a0430a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIllustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#fc350b30',
  },
  emptyTitle: {
    fontSize: 20,
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
    marginBottom: 24,
    opacity: 0.8,
  },
  emptyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#fc350b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fef1e1',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
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
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
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
    borderRadius: 32,
    padding: 24,
    shadowColor: '#a0430a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef1e1',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fc350b30',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#a0430a',
    fontFamily: 'Inter_400Regular',
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  createButtonGradient: {
    padding: 18,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fef1e1',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  choiceContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  choiceCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#fc350b30',
  },
  choiceGradient: {
    padding: 20,
    alignItems: 'center',
  },
  choiceIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  choiceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a0430a',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  choiceDescription: {
    fontSize: 12,
    color: '#fc350b',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    opacity: 0.8,
  },
  scrollModalContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  pickerButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fef1e1',
    borderWidth: 1,
    borderColor: '#fc350b30',
    alignItems: 'center',
  },
  pickerButtonActiveLow: {
    backgroundColor: '#f89b7a',
    borderColor: '#f89b7a',
  },
  pickerButtonActiveMedium: {
    backgroundColor: '#fc350b',
    borderColor: '#fc350b',
  },
  pickerButtonActiveHigh: {
    backgroundColor: '#a0430a',
    borderColor: '#a0430a',
  },
  pickerButtonActiveStatus: {
    backgroundColor: '#fc350b',
    borderColor: '#fc350b',
  },
  pickerText: {
    fontSize: 11,
    color: '#a0430a',
    fontFamily: 'Inter_500Medium',
  },
  pickerTextActive: {
    color: '#fef1e1',
  },
});