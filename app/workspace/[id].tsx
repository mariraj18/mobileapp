import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Animated, Platform, ScrollView } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { workspaceApi, Workspace, WorkspaceMember } from '@/utils/api/workspaces';
import { projectApi, Project } from '@/utils/api/projects';
import { memberApi } from '@/utils/api/members';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus,
  X,
  Folder,
  Users,
  Calendar,
  ArrowRight,
  TrendingUp,
  Grid,
  List,
  Filter,
  MoreHorizontal,
  Eye,
  Clock,
  ChevronRight,
  Check,
  Trash2
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WorkspaceDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
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
          tension: 30,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    const [wsResponse, projectsResponse, membersResponse] = await Promise.all([
      workspaceApi.getById(id!),
      projectApi.getByWorkspace(id!),
      workspaceApi.getMembers(id!)
    ]);

    if (wsResponse.success) {
      setWorkspace(wsResponse.data);
    }

    if (projectsResponse.success) {
      setProjects(projectsResponse.data);
    }

    if (membersResponse.success) {
      setWorkspaceMembers(membersResponse.data);
    }

    setLoading(false);
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      Alert.alert('Error', 'Please enter a project name');
      return;
    }

    setCreating(true);
    const response = await projectApi.create(id!, newProjectName, newProjectDesc, selectedMemberIds);
    setCreating(false);

    if (response.success) {
      setNewProjectName('');
      setNewProjectDesc('');
      setSelectedMemberIds([]);
      setModalVisible(false);
      loadData();
      Alert.alert('Success', 'Project created successfully');
    } else {
      Alert.alert('Error', response.message || 'Failed to create project');
    }
  };

  const handleDeleteWorkspace = async () => {
    Alert.alert('DEBUG', 'handleDeleteWorkspace entered');
    Alert.alert(
      'Delete Workspace',
      'Are you sure you want to delete this workspace? This will delete all projects and tasks within it. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Alert.alert('DEBUG', 'Starting API call to delete workspace');
            console.log(`[WorkspaceDetails] Deleting workspace ${id}`);
            const response = await workspaceApi.delete(id!);
            console.log(`[WorkspaceDetails] Delete response:`, response);
            Alert.alert('DEBUG', `API Result: success=${response.success}`);
            if (response.success) {
              router.replace('/(tabs)');
            } else {
              Alert.alert('Error', response.message || 'Failed to delete workspace');
            }
          },
        },
      ]
    );
  };

  const getRoleColor = (role: string | undefined) => {
    switch (role || 'MEMBER') {
      case 'OWNER': return colors.primary;
      case 'ADMIN': return colors.secondary;
      case 'MEMBER': return colors.tertiary;
      default: return colors.border;
    }
  };

  const renderProjectGrid = ({ item, index }: { item: Project; index: number }) => (
    <Animated.View
      style={[
        styles.gridItem,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [30 * (index + 1), 0]
            })
          }],
        }
      ]}
    >
      <TouchableOpacity
        style={styles.gridCard}
        onPress={() => router.push(`/project/${item.id}`)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[colors.cardLight, colors.cardDark]}
          style={[styles.gridCardGradient, { borderColor: colors.border }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.gridHeader}>
            <View style={[styles.projectIcon, { backgroundColor: colors.primary + '15' }]}>
              <Folder size={24} color={colors.primary} />
            </View>
            <View style={[styles.taskCount, { backgroundColor: colors.success + '15' }]}>
              <Text style={[styles.taskCountText, { color: colors.success }]}>{item.taskCount || 0}</Text>
            </View>
          </View>

          <Text style={[styles.gridTitle, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>

          {item.description ? (
            <Text style={[styles.gridDesc, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : (
            <Text style={[styles.gridDescPlaceholder, { color: colors.textSecondary + '60' }]}>No description</Text>
          )}

          <View style={styles.gridFooter}>
            <View style={styles.dateContainer}>
              <Calendar size={12} color={colors.textSecondary} />
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                {new Date(item.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
            <View style={[styles.arrowContainer, { backgroundColor: colors.primary + '15' }]}>
              <Eye size={14} color={colors.primary} />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderProjectList = ({ item, index }: { item: Project; index: number }) => (
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
        style={styles.listCard}
        onPress={() => router.push(`/project/${item.id}`)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[colors.cardLight, colors.cardDark]}
          style={[styles.listCardGradient, { borderColor: colors.border }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.listContent}>
            <View style={[styles.listIcon, { backgroundColor: colors.primary + '15' }]}>
              <Folder size={20} color={colors.primary} />
            </View>
            <View style={styles.listDetails}>
              <Text style={[styles.listTitle, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.listDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.description || 'No description'}
              </Text>
              <View style={styles.listMeta}>
                <Calendar size={12} color={colors.textSecondary} />
                <Text style={[styles.listDate, { color: colors.textSecondary }]}>
                  {new Date(item.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
                <View style={styles.listTasks}>
                  <Clock size={12} color={colors.success} />
                  <Text style={[styles.listTasksText, { color: colors.success }]}>
                    {item.taskCount || 0} {item.taskCount === 1 ? 'task' : 'tasks'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <ChevronRight size={18} color={colors.primary} />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading) {
    return (
      <LinearGradient colors={[colors.cardDark, colors.cardLight]} style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </LinearGradient>
    );
  }

  if (!workspace) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Workspace not found</Text>
      </View>
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
          title: workspace.name,
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

      <FlatList
        data={projects}
        renderItem={viewMode === 'grid' ? renderProjectGrid : renderProjectList}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Animated.View style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              paddingTop: insets.top + (Platform.OS === 'ios' ? 60 : 80), // Adjust for header
            }
          ]}>
            <LinearGradient
              colors={[colors.cardLight, colors.cardDark]}
              style={[styles.headerGradient, { borderColor: colors.border, shadowColor: colors.shadow }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.roleContainer}>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(workspace.role) + '15' }]}>
                  <Text style={[styles.roleText, { color: getRoleColor(workspace.role) }]}>
                    {workspace.role}
                  </Text>
                </View>

                <View style={styles.headerActions}>
                  {(workspace.role === 'OWNER' || workspace.created_by === user?.id) && (
                    <TouchableOpacity
                      style={[styles.headerOptionButton, { backgroundColor: colors.secondary + '15' }]}
                      onPress={handleDeleteWorkspace}
                    >
                      <Trash2 size={18} color={colors.secondary} />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.viewToggle, { backgroundColor: colors.primary + '15' }]}
                    onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  >
                    {viewMode === 'grid' ?
                      <List size={16} color={colors.primary} /> :
                      <Grid size={16} color={colors.primary} />
                    }
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.membersButton, { backgroundColor: colors.primary + '15' }]}
                    onPress={() => router.push(`/workspace/${id}/members`)}
                  >
                    <Users size={16} color={colors.primary} />
                    <Text style={[styles.membersButtonText, { color: colors.primary }]}>Members</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.stats}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{projects.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Projects</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <TrendingUp size={20} color={colors.primary} />
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={[styles.statItem, { opacity: 0.8 }]}>
                  <Users size={20} color={colors.secondary} />
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    {workspace.memberCount || 0} {workspace.memberCount === 1 ? 'member' : 'members'}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        }
        ListEmptyComponent={
          <Animated.View
            style={[
              styles.emptyState,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
            ]}
          >
            <LinearGradient
              colors={[colors.cardLight, colors.cardDark]}
              style={[styles.emptyIllustration, { borderColor: colors.border }]}
            >
              <Folder size={48} color={colors.primary} />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No projects yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Create your first project to start organizing tasks
            </Text>
            {workspace.role === 'OWNER' && (
              <TouchableOpacity
                style={[styles.emptyButton, { shadowColor: colors.primary }]}
                onPress={() => setModalVisible(true)}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.emptyButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Plus size={18} color={colors.textLight} />
                  <Text style={[styles.emptyButtonText, { color: colors.textLight }]}>Create Project</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </Animated.View>
        }
      />

      {workspace.role === 'OWNER' && (
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
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.fabGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Plus color={colors.textLight} size={24} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Create Project Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
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
            <LinearGradient
              colors={['#ffffff', '#fef1e1']}
              style={styles.modalGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>New Project</Text>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.primary + '15' }]}
                  onPress={() => setModalVisible(false)}
                >
                  <X size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.inputContainer, { backgroundColor: colors.cardDark, borderColor: colors.border }]}>
                <Folder size={18} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={newProjectName}
                  onChangeText={setNewProjectName}
                  placeholder="Project name"
                  placeholderTextColor={colors.textSecondary + '60'}
                  autoFocus
                />
              </View>

              {workspaceMembers.length > 0 && (
                <View style={styles.memberSelectionContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Add Members</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.memberScroll}
                  >
                    {workspaceMembers.map((member) => {
                      const isSelected = selectedMemberIds.includes(member.userId);
                      return (
                        <TouchableOpacity
                          key={member.id}
                          style={[
                            styles.memberItem,
                            isSelected && { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
                            { borderColor: colors.border }
                          ]}
                          onPress={() => {
                            if (isSelected) {
                              setSelectedMemberIds(selectedMemberIds.filter(mid => mid !== member.userId));
                            } else {
                              setSelectedMemberIds([...selectedMemberIds, member.userId]);
                            }
                          }}
                        >
                          <LinearGradient
                            colors={isSelected ? [colors.primary, colors.secondary] : [colors.cardLight, colors.cardDark]}
                            style={styles.memberAvatar}
                          >
                            <Text style={[styles.memberAvatarText, isSelected && { color: colors.textLight }]}>
                              {member.name.charAt(0).toUpperCase()}
                            </Text>
                          </LinearGradient>
                          <Text style={[styles.memberNameText, { color: colors.text }]} numberOfLines={1}>
                            {member.name.split(' ')[0]}
                          </Text>
                          {isSelected && (
                            <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                              <Check size={8} color={colors.textLight} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              <View style={[styles.inputContainer, { backgroundColor: colors.cardDark, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, styles.textArea, { color: colors.text }]}
                  value={newProjectDesc}
                  onChangeText={setNewProjectDesc}
                  placeholder="Description (optional)"
                  placeholderTextColor={colors.textSecondary + '60'}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity
                style={[styles.createButton, { shadowColor: colors.primary }]}
                onPress={handleCreateProject}
                disabled={creating}
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
                    <Text style={[styles.createButtonText, { color: colors.textLight }]}>Create Project</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
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
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerGradient: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
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
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewToggle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  membersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  membersButtonText: {
    fontSize: 13,
    color: '#fc350b',
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  // Grid View Styles
  gridItem: {
    flex: 1,
    maxWidth: '50%',
    padding: 4,
  },
  gridCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  gridCardGradient: {
    padding: 16,
    borderWidth: 1,
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCount: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskCountText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  gridTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
    lineHeight: 20,
  },
  gridDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
    marginBottom: 12,
    opacity: 0.8,
  },
  gridDescPlaceholder: {
    fontSize: 12,
    color: '#a0430a60',
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  arrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // List View Styles
  listCard: {
    marginBottom: 8,
    borderRadius: 18,
    overflow: 'hidden',
  },
  listCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
  },
  listContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  listIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listDetails: {
    flex: 1,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  listDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
    opacity: 0.8,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listDate: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginLeft: 2,
  },
  listTasks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listTasksText: {
    fontSize: 11,
    color: '#10B981',
    fontFamily: 'Inter_500Medium',
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
    marginBottom: 24,
    borderWidth: 2,
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
    marginBottom: 24,
    opacity: 0.8,
    paddingHorizontal: 40,
  },
  emptyButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#fc350b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
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
    right: 20,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#fc350b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
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
    borderRadius: 28,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 24,
    borderWidth: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
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
  memberSelectionContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginBottom: 8,
  },
  memberScroll: {
    paddingRight: 10,
    gap: 12,
  },
  memberItem: {
    width: 60,
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  memberNameText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
});