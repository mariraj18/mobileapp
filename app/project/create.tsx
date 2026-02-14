import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { X, User, Check, Search, Plus, Users, Shield, Mail } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/contexts/AuthContext';
import { projectApi } from '@/utils/api/projects';
import { workspaceApi, WorkspaceMember } from '@/utils/api/workspaces';

export default function CreateProjectScreen() {
  const router = useRouter();
  const { workspaceId } = useLocalSearchParams();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceMembers();
    }
  }, [workspaceId]);

  const fetchWorkspaceMembers = async () => {
    try {
      const response = await workspaceApi.getMembers(workspaceId as string);
      if (response.success) {
        setWorkspaceMembers(response.data);
      }
    } catch (error) {
      console.error('Error fetching workspace members:', error);
    }
  };

  const handleCreateProject = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a project name');
      return;
    }

    if (!workspaceId) {
      Alert.alert('Error', 'Workspace information is missing');
      return;
    }

    setLoading(true);
    try {
      const response = await projectApi.create(
        workspaceId as string,
        name,
        description.trim() || undefined,
        selectedMembers
      );

      if (response.success) {
        router.replace(`/project/${response.data.id}` as any);
      } else {
        Alert.alert('Error', response.message || 'Failed to create project');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while creating the project');
    } finally {
      setLoading(false);
    }
  };

  const toggleMemberSelection = (userId: string) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const filteredMembers = workspaceMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#fef1e1', '#ffffff', '#dfe8e6']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.5, 1]}
      />

      <Stack.Screen
        options={{
          title: 'Create Project',
          headerBackTitle: 'Cancel',
          headerTintColor: '#fc350b',
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTransparent: true,
        }}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <LinearGradient
            colors={['#fc350b', '#a0430a']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerContent}>
              <Users size={28} color="#fef1e1" />
              <View>
                <Text style={styles.headerTitle}>New Project</Text>
                <Text style={styles.headerSubtitle}>Create a project in your workspace</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.form}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Project Name *</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Mobile App Development"
                  placeholderTextColor="#a0430a60"
                  value={name}
                  onChangeText={setName}
                  maxLength={255}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe your project goals and objectives..."
                  placeholderTextColor="#a0430a60"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  maxLength={1000}
                />
              </View>
              <Text style={styles.hint}>Optional, but recommended</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Team Members</Text>
              <TouchableOpacity
                onPress={() => setShowMemberModal(true)}
                style={styles.addButton}
              >
                <LinearGradient
                  colors={['#fc350b', '#a0430a']}
                  style={styles.addButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Plus size={16} color="#fef1e1" />
                  <Text style={styles.addButtonText}>Add Members</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {selectedMembers.length > 0 ? (
              <View style={styles.selectedMembers}>
                {workspaceMembers
                  .filter(member => selectedMembers.includes(member.userId))
                  .map(member => (
                    <View key={member.userId} style={styles.selectedMemberCard}>
                      <LinearGradient
                        colors={['#fef1e1', '#ffffff']}
                        style={styles.selectedMemberGradient}
                      >
                        <View style={styles.memberInfo}>
                          <View style={[styles.memberAvatar, { backgroundColor: '#fc350b15' }]}>
                            <User size={16} color="#fc350b" />
                          </View>
                          <View>
                            <Text style={styles.selectedMemberName}>{member.name}</Text>
                            <Text style={styles.selectedMemberRole}>{member.role}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => toggleMemberSelection(member.userId)}
                          style={styles.removeButton}
                        >
                          <X size={14} color="#a0430a" />
                        </TouchableOpacity>
                      </LinearGradient>
                    </View>
                  ))}
              </View>
            ) : (
              <View style={styles.emptyMembers}>
                <Shield size={32} color="#fc350b" opacity={0.3} />
                <Text style={styles.emptyMembersText}>No members selected</Text>
                <Text style={styles.emptyMembersSubtext}>
                  Add team members to collaborate on this project
                </Text>
              </View>
            )}

            <Text style={styles.helperText}>
              Selected members will have access to all tasks in this project
            </Text>
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
              style={[styles.createButton, loading && styles.createButtonDisabled]}
              onPress={handleCreateProject}
              disabled={loading}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={loading ? ['#dfe8e6', '#c0cfcb'] : ['#fc350b', '#a0430a']}
                style={styles.createButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Users size={18} color="#fef1e1" />
                    <Text style={styles.createButtonText}>Create Project</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showMemberModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMemberModal(false)}
      >
        <BlurView intensity={20} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Team Members</Text>
              <TouchableOpacity
                onPress={() => setShowMemberModal(false)}
                style={styles.closeModalButton}
              >
                <X size={24} color="#a0430a" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color="#fc350b" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search members by name or email..."
                placeholderTextColor="#a0430a60"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <FlatList
              data={filteredMembers}
              keyExtractor={item => item.userId}
              contentContainerStyle={styles.membersList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.memberItem}
                  onPress={() => toggleMemberSelection(item.userId)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={selectedMembers.includes(item.userId) 
                      ? ['#fc350b15', '#fef1e1'] 
                      : ['#ffffff', '#fef1e1']}
                    style={styles.memberItemGradient}
                  >
                    <View style={styles.memberItemContent}>
                      <View style={[styles.memberAvatar, { backgroundColor: '#fc350b15' }]}>
                        <User size={20} color="#fc350b" />
                      </View>
                      <View style={styles.memberDetails}>
                        <Text style={styles.memberName}>{item.name}</Text>
                        <View style={styles.memberMeta}>
                          <Mail size={12} color="#a0430a" />
                          <Text style={styles.memberEmail}>{item.email}</Text>
                        </View>
                        <View style={styles.memberRoleBadge}>
                          <Text style={styles.memberRoleText}>{item.role}</Text>
                        </View>
                      </View>
                    </View>
                    {selectedMembers.includes(item.userId) && (
                      <View style={styles.checkmark}>
                        <Check size={20} color="#fc350b" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptySearch}>
                  <Search size={40} color="#fc350b" opacity={0.3} />
                  <Text style={styles.emptySearchText}>No members found</Text>
                  <Text style={styles.emptySearchSubtext}>
                    Try adjusting your search
                  </Text>
                </View>
              }
            />

            <View style={styles.modalFooter}>
              <Text style={styles.selectedCount}>
                {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
              </Text>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setShowMemberModal(false)}
              >
                <LinearGradient
                  colors={['#fc350b', '#a0430a']}
                  style={styles.doneButtonGradient}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    marginTop: 100,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 8px 20px rgba(252, 53, 11, 0.25)',
      },
      default: {
        shadowColor: '#fc350b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  headerGradient: {
    padding: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fef1e1',
    fontFamily: 'Inter_700Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fef1e1',
    fontFamily: 'Inter_400Regular',
    opacity: 0.9,
  },
  form: {
    padding: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fc350b20',
    ...Platform.select({
      web: {
        boxShadow: '0px 8px 16px rgba(160, 67, 10, 0.08)',
      },
      default: {
        shadowColor: '#a0430a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#a0430a',
    fontFamily: 'Inter_700Bold',
  },
  inputGroup: {
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#a0430a',
    fontFamily: 'Inter_400Regular',
    marginTop: 6,
    opacity: 0.6,
  },
  addButton: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 8px rgba(252, 53, 11, 0.2)',
      },
      default: {
        shadowColor: '#fc350b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  addButtonText: {
    color: '#fef1e1',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  selectedMembers: {
    gap: 8,
  },
  selectedMemberCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#fc350b20',
  },
  selectedMemberGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedMemberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a0430a',
    fontFamily: 'Inter_600SemiBold',
  },
  selectedMemberRole: {
    fontSize: 11,
    color: '#fc350b',
    fontFamily: 'Inter_500Medium',
    textTransform: 'capitalize',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fef1e1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fc350b30',
  },
  emptyMembers: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fef1e1',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fc350b20',
    borderStyle: 'dashed',
  },
  emptyMembersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a0430a',
    fontFamily: 'Inter_600SemiBold',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyMembersSubtext: {
    fontSize: 13,
    color: '#fc350b',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: 20,
  },
  helperText: {
    fontSize: 12,
    color: '#a0430a',
    fontFamily: 'Inter_400Regular',
    marginTop: 12,
    opacity: 0.6,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fef1e1',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fc350b30',
  },
  cancelButtonText: {
    color: '#a0430a',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  createButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 8px 16px rgba(252, 53, 11, 0.3)',
      },
      default: {
        shadowColor: '#fc350b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  createButtonText: {
    color: '#fef1e1',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#fc350b20',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#a0430a',
    fontFamily: 'Inter_700Bold',
  },
  closeModalButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef1e1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fc350b30',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef1e1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#fc350b30',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#a0430a',
    fontFamily: 'Inter_400Regular',
  },
  membersList: {
    paddingBottom: 20,
  },
  memberItem: {
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#fc350b20',
  },
  memberItemGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  memberItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a0430a',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  memberEmail: {
    fontSize: 13,
    color: '#a0430a',
    fontFamily: 'Inter_400Regular',
    opacity: 0.7,
  },
  memberRoleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fc350b15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  memberRoleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fc350b',
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'capitalize',
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fc350b15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySearch: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySearchText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a0430a',
    fontFamily: 'Inter_600SemiBold',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySearchSubtext: {
    fontSize: 14,
    color: '#fc350b',
    fontFamily: 'Inter_400Regular',
    opacity: 0.7,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#fc350b20',
  },
  selectedCount: {
    fontSize: 14,
    color: '#a0430a',
    fontFamily: 'Inter_600SemiBold',
  },
  doneButton: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 12px rgba(252, 53, 11, 0.25)',
      },
      default: {
        shadowColor: '#fc350b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  doneButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fef1e1',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});