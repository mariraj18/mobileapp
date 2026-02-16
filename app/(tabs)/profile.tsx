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
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Stack, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
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
  X,
  Moon,
  Sun,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/utils/api/auth';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme, colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ projects: 0, tasks: 0, workspaces: 0 });
  const [fadeAnim] = useState(new Animated.Value(0));
  const [imageError, setImageError] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  useEffect(() => {
    fetchUserStats();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Reset image error when user changes
  useEffect(() => {
    setImageError(false);
  }, [user?.profile_image]);

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

  const copyUserCode = async () => {
    if (user?.user_id) {
      await Clipboard.setStringAsync(user.user_id);
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

  const handleImageError = () => {
    console.log('Failed to load profile image:', user?.profile_image);
    setImageError(true);
  };

  if (!user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
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

  console.log('Profile screen - user profile image:', user?.profile_image);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Decorative Elements */}
          <View style={styles.headerDecoration}>
            <View style={[styles.decorativeCircle1, { backgroundColor: `${colors.textLight}20` }]} />
            <View style={[styles.decorativeCircle2, { backgroundColor: `${colors.textLight}20` }]} />
          </View>

          {/* Dark Mode Toggle Button */}
          <TouchableOpacity
            style={[styles.themeToggle, { backgroundColor: `${colors.textLight}20` }]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            {theme === 'light' ? (
              <Moon size={20} color={colors.textLight} />
            ) : (
              <Sun size={20} color={colors.textLight} />
            )}
          </TouchableOpacity>

          <Animated.View style={[styles.profileHeader, { opacity: fadeAnim }]}>
            {/* Profile Image */}
            <View style={styles.profileImageWrapper}>
              <LinearGradient
                colors={[colors.cardLight, colors.cardDark]}
                style={styles.profileImageGradient}
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
                      onLoad={() => console.log('Profile image loaded successfully')}
                    />
                  ) : (
                    <Text style={[styles.profileInitials, { color: colors.primary }]}>{initials}</Text>
                  )}
                </View>
              </LinearGradient>

              <View style={[styles.badgeContainer, { backgroundColor: colors.cardLight, borderColor: colors.primary }]}>
                <Award size={16} color={colors.primary} />
              </View>
            </View>

            {/* User Info */}
            <Text style={[styles.userName, { color: colors.textLight }]}>{user.name}</Text>
            <Text style={[styles.userEmail, { color: colors.textLight }]}>{user.email}</Text>

            {/* Member Since */}
            <View style={styles.memberContainer}>
              <Clock size={14} color={colors.textLight} />
              <Text style={[styles.memberText, { color: colors.textLight }]}>Member since {memberSince}</Text>
            </View>

            {/* User Code Card */}
            <LinearGradient
              colors={[colors.cardLight, colors.cardDark]}
              style={[styles.userCodeCard, { borderColor: colors.border, shadowColor: colors.shadow }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.userCodeContent}>
                <View style={styles.userCodeLeft}>
                  <View style={[styles.keyIconContainer, { backgroundColor: colors.badgeBackground }]}>
                    <Key size={16} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.userCodeLabel, { color: colors.textSecondary }]}>Your User Code</Text>
                    <Text style={[styles.userCode, { color: colors.primary }]}>{user.user_id}</Text>
                  </View>
                </View>

                <View style={styles.codeActions}>
                  <TouchableOpacity
                    style={[styles.codeActionButton, { backgroundColor: colors.badgeBackground, borderColor: colors.border }]}
                    onPress={copyUserCode}
                  >
                    <Copy size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.codeActionButton, { backgroundColor: colors.badgeBackground, borderColor: colors.border }]}
                    onPress={shareUserCode}
                  >
                    <Share2 size={16} color={colors.primary} />
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
              colors={[colors.cardLight, colors.cardDark]}
              style={[styles.statCard, { borderColor: colors.border, shadowColor: colors.shadow }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={[styles.statIcon, { backgroundColor: colors.badgeBackground }]}>
                <Target size={20} color={colors.primary} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.projects}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Projects</Text>
            </LinearGradient>

            <LinearGradient
              colors={[colors.cardLight, colors.cardDark]}
              style={[styles.statCard, { borderColor: colors.border, shadowColor: colors.shadow }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={[styles.statIcon, { backgroundColor: colors.badgeBackground }]}>
                <Calendar size={20} color={colors.secondary} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.tasks}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tasks</Text>
            </LinearGradient>

            <LinearGradient
              colors={[colors.cardLight, colors.cardDark]}
              style={[styles.statCard, { borderColor: colors.border, shadowColor: colors.shadow }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={[styles.statIcon, { backgroundColor: colors.badgeBackground }]}>
                <User size={20} color={colors.tertiary} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.workspaces}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Workspaces</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Actions Section */}
        <Animated.View style={[styles.actionsSection, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Settings size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Settings</Text>
            </View>
          </View>

          <LinearGradient
            colors={[colors.cardLight, colors.cardDark]}
            style={[styles.actionsCard, { borderColor: colors.border, shadowColor: colors.shadow }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/profile/edit')}
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: colors.badgeBackground }]}>
                  <Edit2 size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>Edit Profile</Text>
                  <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>Update your personal information</Text>
                </View>
              </View>
              <ChevronRight size={18} color={colors.primary} />
            </TouchableOpacity>

            <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setPrivacyModalVisible(true)}
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: colors.badgeBackground }]}>
                  <Shield size={18} color={colors.secondary} />
                </View>
                <View>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>Privacy & Security</Text>
                  <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>View our privacy policy and security practices</Text>
                </View>
              </View>
              <ChevronRight size={18} color={colors.primary} />
            </TouchableOpacity>

            <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={[styles.actionButton, styles.logoutButton]}
              onPress={handleLogout}
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: colors.badgeBackground }]}>
                  <LogOut size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.actionTitle, styles.logoutTitle, { color: colors.primary }]}>Logout</Text>
                  <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>Sign out from your account</Text>
                </View>
              </View>
              <ChevronRight size={18} color={colors.primary} />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Version Info */}
        <Animated.View style={[styles.versionContainer, { opacity: fadeAnim }]}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>TaskFlow v1.0.0</Text>
          <View style={[styles.versionDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>Premium Plan</Text>
        </Animated.View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <BlurView intensity={20} tint={theme} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground, shadowColor: colors.shadow }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: colors.badgeBackground }]}>
              <LogOut size={24} color={colors.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Log Out</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Are you sure you want to log out? You'll need to sign in again to access your tasks.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { borderColor: colors.border }]}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalLogoutButton, { shadowColor: colors.primary }]}
                onPress={confirmLogout}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.modalLogoutGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={[styles.modalLogoutText, { color: colors.textLight }]}>Log Out</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={privacyModalVisible}
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <BlurView intensity={20} tint={theme} style={styles.modalOverlay}>
          <View style={[styles.privacyModalContent, { backgroundColor: colors.modalBackground, shadowColor: colors.shadow }]}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.privacyModalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.privacyHeaderContent}>
                <Shield size={24} color={colors.textLight} />
                <Text style={[styles.privacyModalTitle, { color: colors.textLight }]}>Privacy & Security</Text>
              </View>
              <TouchableOpacity
                style={[styles.privacyCloseButton, { backgroundColor: `${colors.textLight}20` }]}
                onPress={() => setPrivacyModalVisible(false)}
              >
                <X size={20} color={colors.textLight} />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView
              style={styles.privacyScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.privacyContent}
            >
              <Text style={[styles.privacySectionTitle, { color: colors.text }]}>Taskflow – Privacy Policy</Text>
              <Text style={[styles.privacyEffectiveDate, { color: colors.textSecondary }]}>Effective Date: [Add Date]</Text>

              <Text style={[styles.privacyParagraph, { color: colors.textSecondary }]}>
                Welcome to Taskflow, a task management application designed to help users organize work efficiently.
                Your privacy and data protection are important to us. This policy explains how we collect, use, store,
                and protect your information when you use Taskflow.
              </Text>

              <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>1. Information We Collect</Text>

              <Text style={[styles.privacySubSubtitle, { color: colors.primary }]}>a) Personal Information</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Name and profile details</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Email address or login credentials</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Account preferences</Text>

              <Text style={[styles.privacySubSubtitle, { color: colors.primary }]}>b) Task Data</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Tasks, notes, messages, schedules, and attachments created inside Taskflow</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Team collaboration content (if workspace features are enabled)</Text>

              <Text style={[styles.privacySubSubtitle, { color: colors.primary }]}>c) Technical Information</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Device type, OS version, browser/app version</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• IP address and log data for security monitoring</Text>

              <Text style={[styles.privacyParagraph, { color: colors.textSecondary }]}>
                We collect only the information required to operate the application.
              </Text>

              <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>2. How We Use Your Information</Text>
              <Text style={[styles.privacyParagraph, { color: colors.textSecondary }]}>
                Your data is used to:
              </Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Provide task management features</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Sync tasks across devices</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Enable collaboration between users</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Improve performance and user experience</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Detect fraud, abuse, or unauthorized access</Text>
              <Text style={[styles.privacyParagraph, { color: colors.textSecondary }]}>
                Taskflow does not sell personal data to third parties.
              </Text>

              <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>3. Data Storage and Retention</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Data is stored securely on cloud infrastructure.</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Information remains stored while your account is active.</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Users can request deletion of their account and data at any time.</Text>

              <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>4. Data Sharing</Text>
              <Text style={[styles.privacyParagraph, { color: colors.textSecondary }]}>
                We may share limited information only when:
              </Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Required by law or legal request</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Needed for secure infrastructure providers (database, hosting, email services)</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Necessary to prevent security threats</Text>
              <Text style={[styles.privacyParagraph, { color: colors.textSecondary }]}>
                Third-party services used by Taskflow follow their own privacy standards.
              </Text>

              <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>5. User Rights</Text>
              <Text style={[styles.privacyParagraph, { color: colors.textSecondary }]}>
                You have the right to:
              </Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Access your personal data</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Update or correct information</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Request account deletion</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Control notification and privacy settings</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Contact us at: cxndy.mee@example.com</Text>

              <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>6. Children's Privacy</Text>
              <Text style={[styles.privacyParagraph, { color: colors.textSecondary }]}>
                Taskflow is not intended for users under 13 years old. We do not knowingly collect data from children.
              </Text>

              <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>7. Changes to Policy</Text>
              <Text style={[styles.privacyParagraph, { color: colors.textSecondary }]}>
                We may update this policy when features or legal requirements change. Users will be notified through
                the app or email when significant updates occur.
              </Text>

              <Text style={[styles.privacySectionTitle, { color: colors.text }]}>Taskflow – Security Statement</Text>
              <Text style={[styles.privacyParagraph, { color: colors.textSecondary }]}>
                Taskflow is built with security as a core priority. We use modern practices to keep user data protected.
              </Text>

              <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>1. Data Encryption</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• HTTPS encryption for all network communication</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Secure token-based authentication</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Passwords stored using strong hashing methods</Text>

              <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>2. Account Protection</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Secure login sessions</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Optional email verification</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Protection against brute-force attacks</Text>

              <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>3. Infrastructure Security</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Cloud-hosted backend with firewall protection</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Database access restricted through environment variables</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Regular monitoring of logs and suspicious activities</Text>

              <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>4. Access Control</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Role-based permissions for teams or organizations</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Users can only access their own tasks unless shared</Text>

              <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>5. Backup & Recovery</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Periodic database backups</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>• Disaster recovery procedures to prevent data loss</Text>

              <Text style={[styles.privacySectionSubtitle, { color: colors.text }]}>8. Contact Information</Text>
              <Text style={[styles.privacyParagraph, { color: colors.textSecondary }]}>
                If you have questions regarding privacy or security:
              </Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>App Name: Taskflow</Text>
              <Text style={[styles.privacyBullet, { color: colors.textSecondary }]}>Email: cxndy.mee@example.com</Text>

              {/* Add some bottom padding */}
              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={[styles.privacyModalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.privacyAcceptButton, { shadowColor: colors.primary }]}
                onPress={() => setPrivacyModalVisible(false)}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.privacyAcceptGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={[styles.privacyAcceptText, { color: colors.textLight }]}>Close</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
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
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
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
    fontFamily: 'Inter_600SemiBold',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  themeToggle: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
    fontSize: 36,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
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
    fontFamily: 'Inter_500Medium',
    opacity: 0.8,
  },
  userCodeCard: {
    width: '100%',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCodeLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  userCode: {
    fontSize: 16,
    fontWeight: '600',
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
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
    fontFamily: 'Inter_700Bold',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
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
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
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
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    opacity: 0.7,
  },
  actionDivider: {
    height: 1,
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
    fontFamily: 'Inter_400Regular',
    opacity: 0.7,
  },
  versionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.3,
  },
  // Privacy Modal Styles
  privacyModalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  privacyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#fc350b30',
  },
  privacyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  privacyModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  privacyCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyScrollView: {
    maxHeight: '70%',
  },
  privacyContent: {
    padding: 20,
  },
  privacySectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
    marginTop: 8,
  },
  privacyEffectiveDate: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  privacySectionSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginTop: 20,
    marginBottom: 8,
  },
  privacySubSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    marginTop: 12,
    marginBottom: 4,
  },
  privacyParagraph: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  privacyBullet: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginLeft: 8,
    marginBottom: 4,
  },
  privacyModalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  privacyAcceptButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  privacyAcceptGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  privacyAcceptText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});