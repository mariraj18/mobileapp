// app/(tabs)/profile.tsx
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, RefreshControl, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { User, Settings, LogOut, Award, Clock, Calendar, Briefcase, Moon, Sun } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { theme, toggleTheme, colors } = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [imageError, setImageError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      console.log('Profile screen focused - refreshing user data');
      refreshUser();
      setImageError(false);
    }, [refreshUser])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshUser();
    setImageError(false);
    setRefreshing(false);
  }, [refreshUser]);

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
        }
      ]
    );
  };

  const handleImageError = () => {
    console.log('Failed to load profile image:', user?.profile_image);
    setImageError(true);
  };

  const memberSince = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      }) 
    : 'Recently';

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <LinearGradient
        colors={[colors.cardDark, colors.background]}
        style={styles.gradient}
      />

      {/* Theme Toggle Button */}
      <TouchableOpacity
        style={[styles.themeToggle, { backgroundColor: colors.cardLight, borderColor: colors.border }]}
        onPress={toggleTheme}
        activeOpacity={0.7}
      >
        {theme === 'light' ? (
          <Moon size={22} color={colors.primary} />
        ) : (
          <Sun size={22} color={colors.primary} />
        )}
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={[styles.profileImageContainer, { shadowColor: colors.primary }]}>
          {user?.profile_image && !imageError ? (
            <Image 
              source={{ uri: user.profile_image }} 
              style={[styles.profileImage, { borderColor: colors.textLight }]} 
              key={user.profile_image}
              onError={handleImageError}
              onLoad={() => console.log('Image loaded successfully')}
            />
          ) : (
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={[styles.profileImagePlaceholder, { borderColor: colors.textLight }]}
            >
              <User size={50} color={colors.textLight} />
            </LinearGradient>
          )}
        </View>
        
        <Text style={[styles.name, { color: colors.text }]}>{user?.name || 'User'}</Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email || ''}</Text>
        
        <View style={[styles.memberBadge, { backgroundColor: colors.badgeBackground, borderColor: colors.border }]}>
          <Calendar size={16} color={colors.secondary} />
          <Text style={[styles.memberText, { color: colors.textSecondary }]}>Member since {memberSince}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <LinearGradient
          colors={[colors.cardLight, colors.cardDark]}
          style={[styles.statCard, { borderColor: colors.border, shadowColor: colors.shadow }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Briefcase size={24} color={colors.primary} />
          <Text style={[styles.statNumber, { color: colors.text }]}>12</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Projects</Text>
        </LinearGradient>

        <LinearGradient
          colors={[colors.cardLight, colors.cardDark]}
          style={[styles.statCard, { borderColor: colors.border, shadowColor: colors.shadow }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Award size={24} color={colors.secondary} />
          <Text style={[styles.statNumber, { color: colors.text }]}>48</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tasks</Text>
        </LinearGradient>

        <LinearGradient
          colors={[colors.cardLight, colors.cardDark]}
          style={[styles.statCard, { borderColor: colors.border, shadowColor: colors.shadow }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Clock size={24} color={colors.tertiary} />
          <Text style={[styles.statNumber, { color: colors.text }]}>3</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Workspaces</Text>
        </LinearGradient>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={[styles.menuItem, { backgroundColor: colors.cardLight, borderColor: colors.border, shadowColor: colors.shadow }]}
          onPress={() => router.push('/profile/edit')}
        >
          <Settings size={22} color={colors.secondary} />
          <Text style={[styles.menuText, { color: colors.text }]}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, styles.logoutItem, { backgroundColor: colors.cardLight, borderColor: colors.primary + '40', shadowColor: colors.shadow }]}
          onPress={handleLogout}
        >
          <LogOut size={22} color={colors.primary} />
          <Text style={[styles.menuText, { color: colors.primary }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
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
    borderWidth: 1,
    zIndex: 10,
    ...Platform.select({
      web: {
        shadowColor: '#a0430a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      default: {
        shadowColor: '#a0430a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  profileImageContainer: {
    marginBottom: 16,
    ...Platform.select({
      web: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      default: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 12,
      },
    }),
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    opacity: 0.8,
    marginBottom: 12,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    gap: 8,
    borderWidth: 1,
  },
  memberText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginVertical: 30,
  },
  statCard: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1,
    ...Platform.select({
      web: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      default: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    opacity: 0.8,
  },
  menuContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    ...Platform.select({
      web: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      default: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  menuText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  logoutItem: {
    marginTop: 20,
  },
});