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
import { useTheme } from '@/contexts/ThemeContext';

export default function CreateProjectScreen() {
  const { colors, theme } = useTheme();
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.cardDark, colors.background, colors.darkBg]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.5, 1]}
      />

      <Stack.Screen
        options={{
          title: 'Create Project',
          headerBackTitle: 'Cancel',
          headerTintColor: colors.primary,
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
            colors={[colors.primary, colors.secondary]}
            style={[styles.headerGradient, { shadowColor: colors.primary }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerContent}>
              <Users size={28} color={colors.textLight} />
              <View>
                <Text style={[styles.headerTitle, { color: colors.textLight }]}>New Project</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textLight }]}>Create a project in your workspace</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.form}>
          <View style={[styles.section, { backgroundColor: colors.cardLight, borderColor: colors.border, shadowColor: colors.shadow }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Project Details</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Project Name *</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.cardDark, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g., Mobile App Development"
                  placeholderTextColor={colors.textSecondary + '60'}
                  value={name}
                  onChangeText={setName}
                  maxLength={255}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Description</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper, { backgroundColor: colors.cardDark, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, styles.textArea, { color: colors.text }]}
                  placeholder="Describe your project goals and objectives..."
                  placeholderTextColor={colors.textSecondary + '60'}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  maxLength={1000}
                />
              </View>
              <Text style={[styles.hint, { color: colors.textSecondary }]}>Optional, but recommended</Text>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.cardLight, borderColor: colors.border, shadowColor: colors.shadow }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Team Members</Text>
              <TouchableOpacity
                onPress={() => setShowMemberModal(true)}
                style={[styles.addButton, { shadowColor: colors.primary }]}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.addButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Plus size={16} color={colors.textLight} />
                  <Text style={[styles.addButtonText, { color: colors.textLight }]}>Add Members</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {selectedMembers.length > 0 ? (
              <View style={styles.selectedMembers}>
                {workspaceMembers
                  .filter(member => selectedMembers.includes(member.userId))
                  .map(member => (
                    <View key={member.userId} style={[styles.selectedMemberCard, { borderColor: colors.border }]}>
                      <LinearGradient
                        colors={[colors.cardLight, colors.cardDark]}
                        style={styles.selectedMemberGradient}
                      >
                        <View style={styles.memberInfo}>
                          <View style={[styles.memberAvatar, { backgroundColor: colors.primary + '15' }]}>
                            <User size={16} color={colors.primary} />
                          </View>
                          <View>
                            <Text style={[styles.selectedMemberName, { color: colors.text }]}>{member.name}</Text>
                            <Text style={[styles.selectedMemberRole, { color: colors.primary }]}>{member.role}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => toggleMemberSelection(member.userId)}
                          style={[styles.removeButton, { backgroundColor: colors.cardDark, borderColor: colors.border }]}
                        >
                          <X size={14} color={colors.text} />
                        </TouchableOpacity>
                      </LinearGradient>
                    </View>
                  ))}
              </View>
            ) : (
              <View style={[styles.emptyMembers, { backgroundColor: colors.cardDark, borderColor: colors.border }]}>
                <Shield size={32} color={colors.primary} opacity={0.3} />
                <Text style={[styles.emptyMembersText, { color: colors.text }]}>No members selected</Text>
                <Text style={[styles.emptyMembersSubtext, { color: colors.textSecondary }]}>
                  Add team members to collaborate on this project
                </Text>
              </View>
            )}

            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              Selected members will have access to all tasks in this project
            </Text>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.cardDark, borderColor: colors.border }]}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.createButton, { shadowColor: colors.primary }, loading && styles.createButtonDisabled]}
              onPress={handleCreateProject}
              disabled={loading}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={loading ? [colors.border, colors.border] : [colors.primary, colors.secondary]}
                style={styles.createButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {loading ? (
                  <ActivityIndicator color={colors.textLight} />
                ) : (
                  <>
                    <Users size={18} color={colors.textLight} />
                    <Text style={[styles.createButtonText, { color: colors.textLight }]}>Create Project</Text>
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
        <BlurView intensity={20} tint={theme} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Team Members</Text>
              <TouchableOpacity
                onPress={() => setShowMemberModal(false)}
                style={[styles.closeModalButton, { backgroundColor: colors.cardDark, borderColor: colors.border }]}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: colors.cardDark, borderColor: colors.border }]}>
              <Search size={20} color={colors.primary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search members by name or email..."
                placeholderTextColor={colors.textSecondary + '60'}
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
                      ? [colors.primary + '15', colors.cardDark]
                      : [colors.cardLight, colors.cardDark]}
                    style={[styles.memberItemGradient, { borderColor: colors.border }]}
                  >
                    <View style={styles.memberItemContent}>
                      <View style={[styles.memberAvatar, { backgroundColor: colors.primary + '15' }]}>
                        <User size={20} color={colors.primary} />
                      </View>
                      <View style={styles.memberDetails}>
                        <Text style={[styles.memberName, { color: colors.text }]}>{item.name}</Text>
                        <View style={styles.memberMeta}>
                          <Mail size={12} color={colors.textSecondary} />
                          <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>{item.email}</Text>
                        </View>
                        <View style={[styles.memberRoleBadge, { backgroundColor: colors.primary + '15' }]}>
                          <Text style={[styles.memberRoleText, { color: colors.primary }]}>{item.role}</Text>
                        </View>
                      </View>
                    </View>
                    {selectedMembers.includes(item.userId) && (
                      <View style={[styles.checkmark, { backgroundColor: colors.primary + '15' }]}>
                        <Check size={20} color={colors.primary} />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptySearch}>
                  <Search size={40} color={colors.primary} opacity={0.3} />
                  <Text style={[styles.emptySearchText, { color: colors.text }]}>No members found</Text>
                  <Text style={[styles.emptySearchSubtext, { color: colors.textSecondary }]}>
                    Try adjusting your search
                  </Text>
                </View>
              }
            />

            <View style={styles.modalFooter}>
              <Text style={[styles.selectedCount, { color: colors.textSecondary }]}>
                {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
              </Text>
              <TouchableOpacity
                style={[styles.doneButton, { shadowColor: colors.primary }]}
                onPress={() => setShowMemberModal(false)}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.doneButtonGradient}
                >
                  <Text style={[styles.doneButtonText, { color: colors.textLight }]}>Done</Text>
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