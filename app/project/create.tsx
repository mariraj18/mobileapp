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
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { X, User, Check, Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
        // Navigate to the newly created project
        router.replace(`/project/${response.data.id}`);
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
    <>
      <Stack.Screen
        options={{
          title: 'Create Project',
          headerBackTitle: 'Cancel',
          headerTintColor: '#6366F1',
        }}
      />

      <ScrollView style={styles.container}>
        <LinearGradient
          colors={['#F1F5F9', '#FFFFFF']}
          style={styles.gradientBackground}
        >
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Project Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter project name"
                value={name}
                onChangeText={setName}
                maxLength={255}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter project description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={1000}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Add Members</Text>
                <TouchableOpacity
                  onPress={() => setShowMemberModal(true)}
                  style={styles.addButton}
                >
                  <Text style={styles.addButtonText}>Select Members</Text>
                </TouchableOpacity>
              </View>

              {selectedMembers.length > 0 && (
                <View style={styles.selectedMembers}>
                  {workspaceMembers
                    .filter(member => selectedMembers.includes(member.userId))
                    .map(member => (
                      <View key={member.userId} style={styles.selectedMemberTag}>
                        <User size={12} color="#64748B" />
                        <Text style={styles.selectedMemberText}>
                          {member.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => toggleMemberSelection(member.userId)}
                          style={styles.removeMemberButton}
                        >
                          <X size={12} color="#64748B" />
                        </TouchableOpacity>
                      </View>
                    ))}
                </View>
              )}

              <Text style={styles.helperText}>
                Selected members will be added to the project with access to all tasks.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.createButton, loading && styles.createButtonDisabled]}
              onPress={handleCreateProject}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#94A3B8', '#CBD5E1'] : ['#6366F1', '#8B5CF6']}
                style={styles.createButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.createButtonText}>Create Project</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ScrollView>

      <Modal
        visible={showMemberModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Members</Text>
              <TouchableOpacity
                onPress={() => setShowMemberModal(false)}
                style={styles.closeModalButton}
              >
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search members..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <FlatList
              data={filteredMembers}
              keyExtractor={item => item.userId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.memberItem}
                  onPress={() => toggleMemberSelection(item.userId)}
                >
                  <View style={styles.memberInfo}>
                    <View style={styles.memberAvatar}>
                      <User size={20} color="#64748B" />
                    </View>
                    <View>
                      <Text style={styles.memberName}>{item.name}</Text>
                      <Text style={styles.memberEmail}>{item.email}</Text>
                      <Text style={styles.memberCode}>Code: {item.userCode}</Text>
                    </View>
                  </View>
                  {selectedMembers.includes(item.userId) && (
                    <Check size={20} color="#10B981" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyMembers}>
                  <Text style={styles.emptyMembersText}>No members found</Text>
                </View>
              }
            />

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowMemberModal(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  gradientBackground: {
    flex: 1,
    padding: 20,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter_600SemiBold',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    fontFamily: 'Inter_400Regular',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  addButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  selectedMembers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  selectedMemberTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  selectedMemberText: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter_400Regular',
  },
  removeMemberButton: {
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
  },
  createButtonDisabled: {
    opacity: 0.7,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Inter_700Bold',
  },
  closeModalButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    fontFamily: 'Inter_400Regular',
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter_600SemiBold',
  },
  memberEmail: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter_400Regular',
  },
  memberCode: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter_400Regular',
  },
  emptyMembers: {
    padding: 40,
    alignItems: 'center',
  },
  emptyMembersText: {
    fontSize: 16,
    color: '#94A3B8',
    fontFamily: 'Inter_400Regular',
  },
  doneButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});