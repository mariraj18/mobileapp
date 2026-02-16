import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Animated, ScrollView, Dimensions, Image } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { workspaceApi, Workspace } from '@/utils/api/workspaces';
import { taskApi, CreateStandaloneTaskData } from '@/utils/api/tasks';
import { Plus, X, Users, Calendar, ArrowRight, Sparkles, CheckSquare, Briefcase, Clock, Target, TrendingUp, Layers, Zap, Star, Award, ChevronRight, Hash, Circle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

export default function WorkspacesScreen() {
  const { colors, theme } = useTheme();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [choiceModalVisible, setChoiceModalVisible] = useState(false);
  const [workspaceModalVisible, setWorkspaceModalVisible] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [imageError, setImageError] = useState(false);

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

  // Reset image error when user changes
  useEffect(() => {
    setImageError(false);
  }, [user?.profile_image]);

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



  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return colors.primary;
      case 'ADMIN': return colors.secondary;
      case 'MEMBER': return colors.tertiary;
      default: return colors.textSecondary;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER': return <Award size={12} color={colors.primary} />;
      case 'ADMIN': return <Star size={12} color={colors.secondary} />;
      case 'MEMBER': return <Users size={12} color={colors.tertiary} />;
      default: return <Circle size={12} color={colors.textSecondary} />;
    }
  };

  const handleImageError = () => {
    console.log('Failed to load profile image in workspaces screen');
    setImageError(true);
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
        colors={[colors.cardLight, colors.cardDark]}
        style={[styles.analyticsCard, { borderColor: colors.border }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.analyticsIcon, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        <View style={styles.analyticsContent}>
          <Text style={[styles.analyticsCount, { color: colors.text }]}>{count}</Text>
          <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>{title}</Text>
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
        style={[styles.card, { shadowColor: colors.shadow }]}
        onPress={() => router.push(`/workspace/${item.id}`)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[colors.cardLight, colors.cardDark]}
          style={[styles.cardGradient, { borderColor: colors.border }]}
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
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
            <View style={styles.cardMeta}>
              <View style={styles.dateContainer}>
                <Calendar size={12} color={colors.secondary} />
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                  {new Date(item.joined_at || new Date().toISOString()).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
              </View>
              <View style={styles.taskCountContainer}>
                <CheckSquare size={12} color={colors.primary} />
                <Text style={[styles.taskCountText, { color: colors.textSecondary }]}>
                  {item.taskCount || 0} {item.taskCount === 1 ? 'task' : 'tasks'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.memberAvatars}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                <Users size={14} color={colors.primary} />
              </View>
              <Text style={[styles.memberCountText, { color: colors.textSecondary }]}>
                {item.memberCount || 0} {item.memberCount === 1 ? 'member' : 'members'}
              </Text>
            </View>
            <View style={[styles.arrowContainer, { backgroundColor: colors.badgeBackground }]}>
              <ChevronRight size={18} color={colors.primary} />
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

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  console.log('Workspaces screen - user profile image:', user?.profile_image);

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.cardDark, colors.background, colors.darkBg]}
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
              <View style={[styles.dateBadge, { backgroundColor: colors.cardLight, shadowColor: colors.primary }]}>
                <Clock size={14} color={colors.secondary} />
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>{currentDate}</Text>
              </View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome back,</Text>
              <Text style={[styles.userName, { color: colors.primary }]}>{user?.name?.split(' ')[0]}</Text>
            </View>

            <TouchableOpacity onPress={() => router.push('/profile')} style={[styles.profileWrapper, { shadowColor: colors.primary }]}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.profileGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={[styles.profileImageContainer, { backgroundColor: colors.cardDark }]}>
                  {user?.profile_image && !imageError ? (
                    <Image
                      source={{ uri: user.profile_image }}
                      style={styles.profileImage}
                      key={user.profile_image}
                      onError={handleImageError}
                      onLoad={() => console.log('Profile image loaded successfully in workspaces')}
                    />
                  ) : (
                    <Text style={[styles.profileInitials, { color: colors.textSecondary }]}>{initials}</Text>
                  )}
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
                transform: [{ scale: scaleAnim }],
                shadowColor: colors.primary
              }
            ]}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.welcomeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.welcomeContent}>
                <View>
                  <Text style={[styles.welcomeTitle, { color: colors.textLight }]}>Ready to conquer today?</Text>
                  <Text style={[styles.welcomeSubtitle, { color: colors.textLight }]}>You have {stats.active} active tasks</Text>
                </View>
                <View style={[styles.welcomeIcon, { backgroundColor: `${colors.textLight}20` }]}>
                  <Target size={32} color={colors.textLight} />
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Analytics Section */}
          <View style={styles.analyticsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Zap size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Stats</Text>
              </View>
              <TouchableOpacity
                style={[styles.seeAllButton, { backgroundColor: colors.cardLight, shadowColor: colors.primary }]}
                onPress={() => router.push('/tasks')}
              >
                <Text style={[styles.seeAllText, { color: colors.primary }]}>Tasks</Text>
                <ArrowRight size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.analyticsRow}>
              {renderAnalyticsCard('Due Today', stats.dueToday,
                <Calendar size={20} color={colors.primary} />, colors.primary, 1)}
              {renderAnalyticsCard('Active', stats.active,
                <Target size={20} color={colors.secondary} />, colors.secondary, 2)}
              {renderAnalyticsCard('Completed', stats.completed,
                <Sparkles size={20} color={colors.tertiary} />, colors.tertiary, 3)}
            </View>
          </View>

          {/* Workspaces Section */}
          <View style={styles.workspacesSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Briefcase size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Workspaces</Text>
              </View>
              <View style={[styles.countBadge, { backgroundColor: colors.badgeBackground, borderColor: colors.border }]}>
                <Text style={[styles.countText, { color: colors.primary }]}>{workspaces.length}</Text>
              </View>
            </View>

            {workspaces.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.cardLight, borderColor: colors.border, shadowColor: colors.shadow }]}>
                <LinearGradient
                  colors={[colors.cardLight, colors.cardDark]}
                  style={[styles.emptyIllustration, { borderColor: colors.border }]}
                >
                  <Layers size={48} color={colors.primary} />
                </LinearGradient>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No workspaces yet</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Create your first workspace to start collaborating with your team
                </Text>
                <TouchableOpacity
                  style={[styles.emptyButton, { shadowColor: colors.primary }]}
                  onPress={() => setChoiceModalVisible(true)}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    style={styles.emptyButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Plus size={18} color={colors.textLight} />
                    <Text style={[styles.emptyButtonText, { color: colors.textLight }]}>Create Workspace</Text>
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
            style={[styles.fab, { shadowColor: colors.primary }]}
            onPress={() => setChoiceModalVisible(true)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.fabGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Plus color={colors.textLight} size={28} />
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
          <BlurView intensity={20} tint={theme} style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  backgroundColor: colors.modalBackground,
                  shadowColor: colors.shadow,
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
                <Text style={[styles.modalTitle, { color: colors.text }]}>Create New</Text>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.badgeBackground }]}
                  onPress={() => setChoiceModalVisible(false)}
                >
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.choiceContainer}>
                <TouchableOpacity
                  style={[styles.choiceCard, { borderColor: colors.border }]}
                  onPress={() => {
                    setChoiceModalVisible(false);
                    router.push('/task/create');
                  }}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[colors.cardDark, colors.cardLight]}
                    style={styles.choiceGradient}
                  >
                    <View style={[styles.choiceIconContainer, { backgroundColor: colors.primary + '15' }]}>
                      <CheckSquare size={32} color={colors.primary} />
                    </View>
                    <Text style={[styles.choiceTitle, { color: colors.text }]}>Quick Task</Text>
                    <Text style={[styles.choiceDescription, { color: colors.textSecondary }]}>
                      Create a personal task
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.choiceCard, { borderColor: colors.border }]}
                  onPress={() => {
                    setChoiceModalVisible(false);
                    setWorkspaceModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[colors.cardDark, colors.cardLight]}
                    style={styles.choiceGradient}
                  >
                    <View style={[styles.choiceIconContainer, { backgroundColor: colors.secondary + '15' }]}>
                      <Briefcase size={32} color={colors.secondary} />
                    </View>
                    <Text style={[styles.choiceTitle, { color: colors.text }]}>New Workspace</Text>
                    <Text style={[styles.choiceDescription, { color: colors.textSecondary }]}>
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
          <BlurView intensity={20} tint={theme} style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  backgroundColor: colors.modalBackground,
                  shadowColor: colors.shadow,
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
                <Text style={[styles.modalTitle, { color: colors.text }]}>Create Workspace</Text>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.badgeBackground }]}
                  onPress={() => setWorkspaceModalVisible(false)}
                >
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Workspace Name</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.cardDark, borderColor: colors.border }]}>
                  <Hash size={18} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={newWorkspaceName}
                    onChangeText={setNewWorkspaceName}
                    placeholder="e.g., Product Design Team"
                    placeholderTextColor={colors.textSecondary + '60'}
                    autoFocus
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.createButton, { shadowColor: colors.primary }]}
                onPress={handleCreateWorkspace}
                disabled={creating}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={creating ? [colors.border, colors.border] : [colors.primary, colors.secondary]}
                  style={styles.createButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {creating ? (
                    <ActivityIndicator color={colors.textLight} />
                  ) : (
                    <Text style={[styles.createButtonText, { color: colors.textLight }]}>Create Workspace</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </BlurView>
        </Modal>
      </LinearGradient>
    </View >
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
    marginBottom: 12,
    alignSelf: 'flex-start',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 6,
  },
  greeting: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  userName: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    lineHeight: 40,
  },
  profileWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileInitials: {
    fontSize: 20,
    fontWeight: '700',
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
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    opacity: 0.9,
  },
  welcomeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    fontFamily: 'Inter_700Bold',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  seeAllText: {
    fontSize: 12,
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
    borderWidth: 1,
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
    fontFamily: 'Inter_700Bold',
    lineHeight: 22,
  },
  analyticsLabel: {
    fontSize: 10,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  card: {
    borderRadius: 24,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGradient: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
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
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskCountText: {
    fontSize: 12,
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
    marginRight: 8,
  },
  memberCountText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
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
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    opacity: 0.8,
  },
  emptyButton: {
    borderRadius: 16,
    overflow: 'hidden',
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
    borderRadius: 32,
    padding: 24,
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
    fontFamily: 'Inter_700Bold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
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
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
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
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  choiceDescription: {
    fontSize: 12,
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
    borderWidth: 1,
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  pickerTextActive: {
    color: '#fef1e1',
  },
});