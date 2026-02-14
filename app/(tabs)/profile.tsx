import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Stack, useRouter } from 'expo-router';
import {
  User,
  Mail,
  Key,
  LogOut,
  Copy,
  Share2,
  Edit2,
  Settings,
  Target,
  Calendar,
  TrendingUp,
  Award,
  Shield,
  Clock,
  Star,
  ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/utils/api/auth';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ projects: 0, tasks: 0, workspaces: 0 });
  const [fadeAnim] = useState(new Animated.Value(0));

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  useEffect(() => {
    fetchUserStats();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchUserStats = async () => {
    try {
      const response = await authApi.getUserStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
    router.replace('/(auth)/login');
  };

  const copyUserCode = () => {
    if (user?.user_id) {
      Alert.alert('Copied!', 'User code copied to clipboard');
    }
  };

  const shareUserCode = async () => {
    if (user?.user_id) {
      try {
        await Share.share({
          message: `Join me on TaskFlow! My user code: ${user.user_id}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fc350b" />
      </View>
    );
  }

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const memberSince = new Date(user.created_at || Date.now()).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Profile',
          headerShown: false,
        }}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#fc350b', '#a0430a']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Decorative Elements */}
          <View style={styles.headerDecoration}>
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
          </View>

          <Animated.View style={[styles.profileHeader, { opacity: fadeAnim }]}>
            {/* Profile Image */}
            <View style={styles.profileImageWrapper}>
              <LinearGradient
                colors={['#ffffff', '#fef1e1']}
                style={styles.profileImageGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.profileImageContainer}>
                  <Text style={styles.profileInitials}>{initials}</Text>
                </View>
              </LinearGradient>

              <View style={styles.badgeContainer}>
                <Award size={16} color="#fc350b" />
              </View>
            </View>

            {/* User Info */}
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>

            {/* Member Since */}
            <View style={styles.memberContainer}>
              <Clock size={14} color="#fef1e1" />
              <Text style={styles.memberText}>Member since {memberSince}</Text>
            </View>

            {/* User Code Card */}
            <LinearGradient
              colors={['#ffffff', '#fef1e1']}
              style={styles.userCodeCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.userCodeContent}>
                <View style={styles.userCodeLeft}>
                  <View style={styles.keyIconContainer}>
                    <Key size={16} color="#fc350b" />
                  </View>
                  <View>
                    <Text style={styles.userCodeLabel}>Your User Code</Text>
                    <Text style={styles.userCode}>{user.user_id}</Text>
                  </View>
                </View>

                <View style={styles.codeActions}>
                  <TouchableOpacity
                    style={styles.codeActionButton}
                    onPress={copyUserCode}
                  >
                    <Copy size={16} color="#fc350b" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.codeActionButton}
                    onPress={shareUserCode}
                  >
                    <Share2 size={16} color="#fc350b" />
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </LinearGradient>

        {/* Stats Section */}
        <Animated.View style={[styles.statsSection, { opacity: fadeAnim }]}>


          <View style={styles.statsGrid}>
            <LinearGradient
              colors={['#ffffff', '#fef1e1']}
              style={styles.statCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={[styles.statIcon, { backgroundColor: '#fc350b15' }]}>
                <Target size={20} color="#fc350b" />
              </View>
              <Text style={styles.statNumber}>{stats.projects}</Text>
              <Text style={styles.statLabel}>Projects</Text>
            </LinearGradient>

            <LinearGradient
              colors={['#ffffff', '#fef1e1']}
              style={styles.statCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={[styles.statIcon, { backgroundColor: '#a0430a15' }]}>
                <Calendar size={20} color="#a0430a" />
              </View>
              <Text style={styles.statNumber}>{stats.tasks}</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </LinearGradient>

            <LinearGradient
              colors={['#ffffff', '#fef1e1']}
              style={styles.statCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={[styles.statIcon, { backgroundColor: '#f89b7a15' }]}>
                <User size={20} color="#f89b7a" />
              </View>
              <Text style={styles.statNumber}>{stats.workspaces}</Text>
              <Text style={styles.statLabel}>Workspaces</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Actions Section */}
        <Animated.View style={[styles.actionsSection, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Settings size={20} color="#fc350b" />
              <Text style={styles.sectionTitle}>Account Settings</Text>
            </View>
          </View>

          <LinearGradient
            colors={['#ffffff', '#fef1e1']}
            style={styles.actionsCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/profile/edit')}
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: '#fc350b15' }]}>
                  <Edit2 size={18} color="#fc350b" />
                </View>
                <View>
                  <Text style={styles.actionTitle}>Edit Profile</Text>
                  <Text style={styles.actionSubtitle}>Update your personal information</Text>
                </View>
              </View>
              <ChevronRight size={18} color="#fc350b" />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Coming Soon', 'This feature is under development')}
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: '#a0430a15' }]}>
                  <Shield size={18} color="#a0430a" />
                </View>
                <View>
                  <Text style={styles.actionTitle}>Privacy & Security</Text>
                  <Text style={styles.actionSubtitle}>Manage your account security</Text>
                </View>
              </View>
              <ChevronRight size={18} color="#fc350b" />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Coming Soon', 'This feature is under development')}
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: '#f89b7a15' }]}>
                  <Star size={18} color="#f89b7a" />
                </View>
                <View>
                  <Text style={styles.actionTitle}>Preferences</Text>
                  <Text style={styles.actionSubtitle}>Customize your experience</Text>
                </View>
              </View>
              <ChevronRight size={18} color="#fc350b" />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity
              style={[styles.actionButton, styles.logoutButton]}
              onPress={handleLogout}
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: '#fc350b15' }]}>
                  <LogOut size={18} color="#fc350b" />
                </View>
                <View>
                  <Text style={[styles.actionTitle, styles.logoutTitle]}>Logout</Text>
                  <Text style={styles.actionSubtitle}>Sign out from your account</Text>
                </View>
              </View>
              <ChevronRight size={18} color="#fc350b" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Version Info */}
        <Animated.View style={[styles.versionContainer, { opacity: fadeAnim }]}>
          <Text style={styles.versionText}>TaskFlow v1.0.0</Text>
          <View style={styles.versionDot} />
          <Text style={styles.versionText}>Premium Plan</Text>
        </Animated.View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <BlurView intensity={20} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <LogOut size={24} color="#fc350b" />
            </View>
            <Text style={styles.modalTitle}>Log Out</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to log out? You'll need to sign in again to access your tasks.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalLogoutButton}
                onPress={confirmLogout}
              >
                <LinearGradient
                  colors={['#fc350b', '#a0430a']}
                  style={styles.modalLogoutGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.modalLogoutText}>Log Out</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fef1e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#a0430a',
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#fc350b',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fc350b30',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a0430a',
    fontFamily: 'Inter_600SemiBold',
  },
  modalLogoutButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalLogoutGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalLogoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fef1e1',
    fontFamily: 'Inter_600SemiBold',
  },
  container: {
    flex: 1,
    backgroundColor: '#fef1e1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fef1e1',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    position: 'relative',
    overflow: 'hidden',
  },
  headerDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#fef1e120',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fef1e120',
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  profileImageWrapper: {
    marginBottom: 16,
    position: 'relative',
  },
  profileImageGradient: {
    width: 100,
    height: 100,
    borderRadius: 30,
    padding: 2,
  },
  profileImageContainer: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: '#fef1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fc350b',
    fontFamily: 'Inter_700Bold',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fc350b',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fef1e1',
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#fef1e1',
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
    opacity: 0.9,
  },
  memberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  memberText: {
    fontSize: 12,
    color: '#fef1e1',
    fontFamily: 'Inter_500Medium',
    opacity: 0.8,
  },
  userCodeCard: {
    width: '100%',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fc350b30',
    shadowColor: '#a0430a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  userCodeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userCodeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  keyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fc350b15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCodeLabel: {
    fontSize: 12,
    color: '#a0430a',
    fontFamily: 'Inter_400Regular',
  },
  userCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fc350b',
    fontFamily: 'Inter_600SemiBold',
  },
  codeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  codeActionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fef1e1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fc350b30',
  },
  statsSection: {
    padding: 24,
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
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#fc350b',
    fontFamily: 'Inter_500Medium',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fc350b20',
    shadowColor: '#a0430a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#a0430a',
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#fc350b',
    fontFamily: 'Inter_500Medium',
  },
  actionsSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  actionsCard: {
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
    borderColor: '#fc350b20',
    shadowColor: '#a0430a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    color: '#a0430a',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#fc350b',
    fontFamily: 'Inter_400Regular',
    opacity: 0.7,
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#fc350b20',
    marginHorizontal: 16,
  },
  logoutButton: {
    marginTop: 0,
  },
  logoutTitle: {
    color: '#fc350b',
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 30,
    gap: 8,
  },
  versionText: {
    fontSize: 12,
    color: '#a0430a',
    fontFamily: 'Inter_400Regular',
    opacity: 0.7,
  },
  versionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fc350b',
    opacity: 0.3,
  },
});