import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { workspaceApi, Workspace } from '@/utils/api/workspaces';
import { projectApi, Project } from '@/utils/api/projects';
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
  ChevronRight 
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
      case 'OWNER': return '#fc350b';
      case 'ADMIN': return '#a0430a';
      case 'MEMBER': return '#f89b7a';
      default: return '#dfe8e6';
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
          colors={['#ffffff', '#fef1e1']}
          style={styles.gridCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.gridHeader}>
            <View style={[styles.projectIcon, { backgroundColor: '#fc350b15' }]}>
              <Folder size={24} color="#fc350b" />
            </View>
            <View style={[styles.taskCount, { backgroundColor: '#10B98115' }]}>
              <Text style={[styles.taskCountText, { color: '#10B981' }]}>12</Text>
            </View>
          </View>

          <Text style={styles.gridTitle} numberOfLines={2}>{item.name}</Text>

          {item.description ? (
            <Text style={styles.gridDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : (
            <Text style={styles.gridDescPlaceholder}>No description</Text>
          )}

          <View style={styles.gridFooter}>
            <View style={styles.dateContainer}>
              <Calendar size={12} color="#a0430a" />
              <Text style={styles.dateText}>
                {new Date(item.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
            <View style={[styles.arrowContainer, { backgroundColor: '#fc350b15' }]}>
              <Eye size={14} color="#fc350b" />
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
          colors={['#ffffff', '#fef1e1']}
          style={styles.listCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.listContent}>
            <View style={[styles.listIcon, { backgroundColor: '#fc350b15' }]}>
              <Folder size={20} color="#fc350b" />
            </View>
            <View style={styles.listDetails}>
              <Text style={styles.listTitle}>{item.name}</Text>
              <Text style={styles.listDesc} numberOfLines={1}>
                {item.description || 'No description'}
              </Text>
              <View style={styles.listMeta}>
                <Calendar size={12} color="#a0430a" />
                <Text style={styles.listDate}>
                  {new Date(item.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
                <View style={styles.listTasks}>
                  <Clock size={12} color="#10B981" />
                  <Text style={styles.listTasksText}>12 tasks</Text>
                </View>
              </View>
            </View>
          </View>
          <ChevronRight size={18} color="#fc350b" />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#fef1e1', '#ffffff']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fc350b" />
      </LinearGradient>
    );
  }

  if (!workspace) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Workspace not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#fef1e1', '#ffffff', '#dfe8e6']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.5, 1]}
      />

      <Stack.Screen
        options={{
          title: workspace.name,
          headerBackTitle: 'Back',
          headerTintColor: '#fc350b',
          headerStyle: {
            backgroundColor: '#fef1e1',
          },
          headerTitleStyle: {
            color: '#a0430a',
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
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <LinearGradient
              colors={['#ffffff', '#fef1e1']}
              style={styles.headerGradient}
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
                  <TouchableOpacity
                    style={[styles.viewToggle, { backgroundColor: '#fc350b15' }]}
                    onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  >
                    {viewMode === 'grid' ? 
                      <List size={16} color="#fc350b" /> : 
                      <Grid size={16} color="#fc350b" />
                    }
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.membersButton, { backgroundColor: '#fc350b15' }]}
                    onPress={() => router.push(`/workspace/${id}/members`)}
                  >
                    <Users size={16} color="#fc350b" />
                    <Text style={styles.membersButtonText}>Members</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.stats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{projects.length}</Text>
                  <Text style={styles.statLabel}>Projects</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: '#fc350b30' }]} />
                <View style={styles.statItem}>
                  <TrendingUp size={20} color="#fc350b" />
                  <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: '#fc350b30' }]} />
                <View style={styles.statItem}>
                  <Users size={20} color="#a0430a" />
                  <Text style={styles.statLabel}>8 members</Text>
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
              colors={['#ffffff', '#fef1e1']}
              style={styles.emptyIllustration}
            >
              <Folder size={48} color="#fc350b" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No projects yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first project to start organizing tasks
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => setModalVisible(true)}
            >
              <LinearGradient
                colors={['#fc350b', '#a0430a']}
                style={styles.emptyButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Plus size={18} color="#fef1e1" />
                <Text style={styles.emptyButtonText}>Create Project</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        }
      />

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
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#fc350b', '#a0430a']}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Plus color="#fef1e1" size={24} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Create Project Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
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
            <LinearGradient
              colors={['#ffffff', '#fef1e1']}
              style={styles.modalGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Project</Text>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: '#fc350b15' }]}
                  onPress={() => setModalVisible(false)}
                >
                  <X size={20} color="#fc350b" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Folder size={18} color="#fc350b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={newProjectName}
                  onChangeText={setNewProjectName}
                  placeholder="Project name"
                  placeholderTextColor="#a0430a60"
                  autoFocus
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newProjectDesc}
                  onChangeText={setNewProjectDesc}
                  placeholder="Description (optional)"
                  placeholderTextColor="#a0430a60"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateProject}
                disabled={creating}
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
                    <Text style={styles.createButtonText}>Create Project</Text>
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
    color: '#a0430a',
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
    borderColor: '#fc350b20',
    shadowColor: '#fc350b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
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
    color: '#a0430a',
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#fc350b',
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
    borderColor: '#fc350b20',
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
    color: '#a0430a',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
    lineHeight: 20,
  },
  gridDesc: {
    fontSize: 12,
    color: '#fc350b',
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
    color: '#a0430a',
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
    borderColor: '#fc350b20',
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
    color: '#a0430a',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  listDesc: {
    fontSize: 12,
    color: '#fc350b',
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
    color: '#a0430a',
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
    shadowColor: '#a0430a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
  modalGradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: '#fc350b30',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef1e1',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fc350b30',
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
    color: '#a0430a',
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
});