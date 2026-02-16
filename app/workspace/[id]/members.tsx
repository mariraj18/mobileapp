import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { memberApi, WorkspaceMember } from '@/utils/api/members';
import { useAuth } from '@/contexts/AuthContext';
import {
  UserPlus,
  X,
  Trash2,
  Shield,
  Mail,
  User,
  Crown,
  Award,
  Star,
  ChevronRight,
  Search,
  MoreVertical
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';

export default function WorkspaceMembersScreen() {
  const { colors, theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return colors.primary;
      case 'ADMIN': return colors.secondary;
      case 'MEMBER': return colors.tertiary;
      default: return colors.border;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER': return <Crown size={16} color={colors.primary} />;
      case 'ADMIN': return <Award size={16} color={colors.secondary} />;
      case 'MEMBER': return <Star size={16} color={colors.tertiary} />;
      default: return <User size={16} color={colors.border} />;
    }
  };

  useEffect(() => {
    if (id) {
      loadMembers();
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
      ]).start();
    }
  }, [id]);

  const loadMembers = async () => {
    setLoading(true);
    const response = await memberApi.getMembers(id!);
    if (response.success) {
      setMembers(response.data);
      const currentUser = response.data.find(m => m.userId === user?.id);
      if (currentUser) {
        setUserRole(currentUser.role);
      }
    } else if (response.status === 403) {
      Alert.alert('Access Denied', 'Only workspace admins and owners can view members.');
      router.back();
    }
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter a User Code');
      return;
    }

    setInviting(true);
    const response = await memberApi.addMemberByCode(id!, inviteEmail, 'MEMBER');
    setInviting(false);

    if (response.success) {
      setInviteEmail('');
      setModalVisible(false);
      loadMembers();
      Alert.alert('Success', 'Member added successfully');
    } else {
      Alert.alert('Error', response.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = (member: WorkspaceMember) => {
    Alert.alert('Remove Member', `Are you sure you want to remove ${member.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const response = await memberApi.removeMember(id!, member.userId);
          if (response.success) {
            loadMembers();
          } else {
            Alert.alert('Error', response.message || 'Failed to remove member');
          }
        }
      }
    ]);
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMember = ({ item, index }: { item: WorkspaceMember; index: number }) => (
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
      <LinearGradient
        colors={[colors.cardLight, colors.cardDark]}
        style={[styles.card, { borderColor: colors.border }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.memberInfo}>
          <LinearGradient
            colors={[getRoleColor(item.role || 'MEMBER'), getRoleColor(item.role || 'MEMBER') + '80']}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.avatarText, { color: colors.textLight }]}>{item.name.charAt(0).toUpperCase()}</Text>
          </LinearGradient>

          <View style={styles.memberDetails}>
            <View style={styles.nameContainer}>
              <Text style={[styles.memberName, { color: colors.text }]}>{item.name}</Text>
              {item.userId === user?.id && (
                <View style={[styles.youBadge, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.youText, { color: colors.primary }]}>You</Text>
                </View>
              )}
            </View>
            <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>{item.email}</Text>

            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role || 'MEMBER') + '15' }]}>
              {getRoleIcon(item.role || 'MEMBER')}
              <Text style={[styles.roleText, { color: getRoleColor(item.role || 'MEMBER') }]}>
                {item.role || 'MEMBER'}
              </Text>
            </View>
          </View>
        </View>

        {item.userId !== user?.id && (
          (userRole === 'OWNER') ||
          (userRole === 'ADMIN' && item.role === 'MEMBER')
        ) && (
            <TouchableOpacity
              onPress={() => handleRemoveMember(item)}
              style={[styles.removeButton, { backgroundColor: colors.primary + '15' }]}
            >
              <Trash2 size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
      </LinearGradient>
    </Animated.View>
  );

  if (loading) {
    return (
      <LinearGradient colors={[colors.cardDark, colors.cardLight]} style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </LinearGradient>
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
          title: 'Workspace Members',
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

      {/* Search Bar */}
      <Animated.View style={[styles.searchContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient
          colors={[colors.cardLight, colors.cardDark]}
          style={[styles.searchBar, { borderColor: colors.border }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Search size={18} color={colors.primary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search members..."
            placeholderTextColor={colors.textSecondary + '60'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </LinearGradient>
      </Animated.View>

      <FlatList
        data={filteredMembers}
        renderItem={renderMember}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Animated.View style={[styles.statsHeader, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={[colors.primary + '15', colors.secondary + '15']}
              style={[styles.statsBadge, { borderColor: colors.border }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <User size={16} color={colors.primary} />
              <Text style={[styles.statsText, { color: colors.textSecondary }]}>{members.length} Members</Text>
            </LinearGradient>
          </Animated.View>
        }
        ListEmptyComponent={
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={[colors.cardLight, colors.cardDark]}
              style={[styles.emptyIllustration, { borderColor: colors.border }]}
            >
              <UserPlus size={48} color={colors.primary} />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No members found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Try adjusting your search or invite new members
            </Text>
          </Animated.View>
        }
      />

      {(userRole === 'OWNER' || userRole === 'ADMIN') && (
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
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.fabGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <UserPlus color={colors.textLight} size={24} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Invite Modal */}
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
                <Text style={[styles.modalTitle, { color: colors.text }]}>Add Member</Text>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.primary + '15' }]}
                  onPress={() => setModalVisible(false)}
                >
                  <X size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.inputContainer, { backgroundColor: colors.cardDark, borderColor: colors.border }]}>
                <Mail size={18} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  placeholder="Enter User Code"
                  placeholderTextColor={colors.textSecondary + '60'}
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.createButton, { shadowColor: colors.primary }]}
                onPress={handleInvite}
                disabled={inviting}
              >
                <LinearGradient
                  colors={inviting ? [colors.border, colors.border] : [colors.primary, colors.secondary]}
                  style={styles.createButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {inviting ? (
                    <ActivityIndicator color={colors.textLight} />
                  ) : (
                    <>
                      <UserPlus size={18} color={colors.textLight} />
                      <Text style={[styles.createButtonText, { color: colors.textLight }]}>Add Member</Text>
                    </>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    padding: 0,
  },
  statsHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fc350b30',
  },
  statsText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  memberDetails: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  youBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  youText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  memberEmail: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 6,
    opacity: 0.8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
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
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#fc350b30',
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
    opacity: 0.8,
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
    marginBottom: 12,
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
  hint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 20,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
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
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});