import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Share,
} from 'react-native';
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
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/utils/api/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ projects: 0, tasks: 0, workspaces: 0 });

  useEffect(() => {
    fetchUserStats();
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

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        },
      ]
    );
  };

  const copyUserCode = () => {
    if (user?.user_id) {
      // Copy to clipboard
      // You'll need to install and use @react-native-clipboard/clipboard
      Alert.alert('Copied!', `User code ${user.user_id} copied to clipboard`);
    }
  };

  const shareUserCode = async () => {
    if (user?.user_id) {
      try {
        await Share.share({
          message: `My user code: ${user.user_id}\nAdd me to your workspace using this code!`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Profile',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/profile/edit')}
              style={styles.editButton}
            >
              <Edit2 size={20} color="#6366F1" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.headerGradient}
        >
          <View style={styles.profileHeader}>
            {user.profile_image ? (
              <View style={styles.profileImageContainer}>
                <Image
                  source={{ uri: user.profile_image }}
                  style={styles.profileImage}
                />
              </View>
            ) : (
              <View style={styles.profilePlaceholder}>
                <User size={48} color="#FFFFFF" />
              </View>
            )}
            
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            
            <View style={styles.userCodeContainer}>
              <View style={styles.userCodeBadge}>
                <Key size={16} color="#6366F1" />
                <Text style={styles.userCodeLabel}>Your Code:</Text>
                <Text style={styles.userCode}>{user.user_id}</Text>
              </View>
              
              <View style={styles.codeActions}>
                <TouchableOpacity
                  style={styles.codeActionButton}
                  onPress={copyUserCode}
                >
                  <Copy size={16} color="#64748B" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.codeActionButton}
                  onPress={shareUserCode}
                >
                  <Share2 size={16} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Activity</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Target size={20} color="#6366F1" />
              <Text style={styles.statNumber}>{stats.projects}</Text>
              <Text style={styles.statLabel}>Projects</Text>
            </View>
            <View style={styles.statCard}>
              <Calendar size={20} color="#10B981" />
              <Text style={styles.statNumber}>{stats.tasks}</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </View>
            <View style={styles.statCard}>
              <TrendingUp size={20} color="#8B5CF6" />
              <Text style={styles.statNumber}>{stats.workspaces}</Text>
              <Text style={styles.statLabel}>Workspaces</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/profile/edit')}
          >
            <Edit2 size={20} color="#64748B" />
            <Text style={styles.actionText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <Settings size={20} color="#64748B" />
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <LogOut size={20} color="#EF4444" />
            <Text style={[styles.actionText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    marginRight: 16,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter_400Regular',
    marginBottom: 20,
  },
  userCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    gap: 12,
  },
  userCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userCodeLabel: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter_500Medium',
  },
  userCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Inter_700Bold',
  },
  codeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  codeActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Inter_700Bold',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter_400Regular',
  },
  actionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    fontFamily: 'Inter_500Medium',
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  logoutText: {
    color: '#EF4444',
  },
});