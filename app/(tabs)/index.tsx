import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { workspaceApi, Workspace } from '@/utils/api/workspaces';
import { Plus, X, Users, Calendar, ArrowRight, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function WorkspacesScreen() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    loadWorkspaces();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadWorkspaces = async () => {
    const response = await workspaceApi.getAll();
    if (response.success) {
      setWorkspaces(response.data);
    }
    setLoading(false);
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
      setModalVisible(false);
      loadWorkspaces();
    } else {
      Alert.alert('Error', response.message || 'Failed to create workspace');
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

  const renderWorkspace = ({ item, index }: { item: Workspace; index: number }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: fadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [50 * (index + 1), 0]
        })}],
      }}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/workspace/${item.id}`)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardHeader}>
            <View style={styles.workspaceIcon}>
              <Users size={20} color="#6366F1" />
            </View>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '15' }]}>
              <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
                {item.role}
              </Text>
            </View>
          </View>
          
          <Text style={styles.cardTitle}>{item.name}</Text>
          
          <View style={styles.cardFooter}>
            <View style={styles.dateContainer}>
              <Calendar size={14} color="#94A3B8" />
              <Text style={styles.dateText}>
                Joined {new Date(item.joined_at || '').toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric' 
                })}
              </Text>
            </View>
            <View style={styles.arrowContainer}>
              <ArrowRight size={18} color="#6366F1" />
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

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient
        colors={['#F1F5F9', '#FFFFFF']}
        style={styles.gradientBackground}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
          <View style={styles.headerBadge}>
            <Sparkles size={16} color="#8B5CF6" />
            <Text style={styles.badgeText}>{workspaces.length} workspaces</Text>
          </View>
        </View>

        {workspaces.length === 0 ? (
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
            <View style={styles.emptyIllustration}>
              <Users size={64} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyTitle}>No workspaces yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first workspace to collaborate with your team
            </Text>
          </Animated.View>
        ) : (
          <FlatList
            data={workspaces}
            renderItem={renderWorkspace}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}

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
                <Text style={styles.modalTitle}>Create Workspace</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Workspace Name</Text>
                <TextInput
                  style={styles.input}
                  value={newWorkspaceName}
                  onChangeText={setNewWorkspaceName}
                  placeholder="Ex. Engineering Team"
                  placeholderTextColor="#94A3B8"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateWorkspace}
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
                    <Text style={styles.createButtonText}>Create Workspace</Text>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Inter_700Bold',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 6,
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
  workspaceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter_600SemiBold',
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
    fontSize: 13,
    color: '#64748B',
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIllustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
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
    marginBottom: 24,
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