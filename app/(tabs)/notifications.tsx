// app/(tabs)/notifications.tsx
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Animated, RefreshControl, ScrollView } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { notificationApi, Notification } from '@/utils/api/notifications';
import { Bell, Check, Clock, AlertCircle, MessageSquare, UserPlus, Calendar, CheckCircle, XCircle, Filter } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';

export default function NotificationsScreen() {
  const { colors, theme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showFilter, setShowFilter] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadNotifications();
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
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const response = await notificationApi.getAll();
    if (response.success) {
      setNotifications(response.data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    const response = await notificationApi.markAsRead(id);
    if (response.success) {
      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      ));
    }
  };

  const handleMarkAllRead = async () => {
    const response = await notificationApi.markAllAsRead();
    if (response.success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons = {
      'TASK_ASSIGNMENT': <AlertCircle size={22} color={colors.primary} />,
      'COMMENT': <MessageSquare size={22} color={colors.secondary} />,
      'PROJECT_INVITE': <UserPlus size={22} color={colors.primary} />,
      'PROJECT_COMPLETED': <CheckCircle size={22} color={colors.tertiary} />,
      'DUE_DATE': <Clock size={22} color={colors.secondary} />,
      'PRIORITY': <AlertCircle size={22} color={colors.primary} />,
    };
    return icons[type as keyof typeof icons] || <Bell size={22} color={colors.secondary} />;
  };

  const getNotificationColor = (type: string) => {
    const colors_map = {
      'TASK_ASSIGNMENT': colors.primary + '20',
      'COMMENT': colors.secondary + '20',
      'PROJECT_INVITE': colors.tertiary + '20',
      'PROJECT_COMPLETED': colors.border,
      'DUE_DATE': colors.secondary + '20',
      'PRIORITY': colors.primary + '20',
    };
    return colors_map[type as keyof typeof colors_map] || colors.badgeBackground;
  };

  const filteredNotifications = filter === 'all'
    ? notifications
    : filter === 'unread'
      ? notifications.filter(n => !n.is_read)
      : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const renderNotification = ({ item, index }: { item: Notification; index: number }) => (
    <Animated.View
      style={[
        styles.notificationContainer,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [30 * (index + 1), 0]
            })
          }]
        }
      ]}
    >
      <TouchableOpacity
        style={[styles.card, !item.is_read && styles.unreadCard]}
        onPress={() => !item.is_read && handleMarkAsRead(item.id)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={!item.is_read ? [colors.cardLight, colors.cardDark] : [colors.cardLight, colors.cardLight]}
          style={[styles.cardGradient, { borderColor: colors.border }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) }]}>
              {getNotificationIcon(item.type)}
            </View>

            <View style={styles.textContainer}>
              <Text style={[styles.message, !item.is_read && styles.unreadText, { color: colors.textSecondary }]}>
                {item.message}
              </Text>

              <View style={styles.metaContainer}>
                <Clock size={12} color={colors.secondary} />
                <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                  {new Date(item.created_at).toLocaleDateString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>

                {!item.is_read && (
                  <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                )}
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const FilterChip = ({ label, value }: { label: string; value: string }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        { backgroundColor: colors.cardLight, borderColor: colors.border, shadowColor: colors.shadow },
        filter === value && { backgroundColor: colors.primary, borderColor: colors.primary }
      ]}
      onPress={() => setFilter(value)}
    >
      <Text style={[
        styles.filterChipText,
        { color: colors.textSecondary },
        filter === value && { color: colors.textLight }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[colors.cardDark, colors.background]}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.cardDark, colors.background, colors.darkBg]}
        style={styles.gradientBackground}
        locations={[0, 0.6, 1]}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Text>
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              style={[styles.markAllButton, { shadowColor: colors.primary }]}
              onPress={handleMarkAllRead}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.markAllGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Check size={16} color={colors.textLight} />
                <Text style={[styles.markAllText, { color: colors.textLight }]}>Mark all read</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Filter Section */}
        <Animated.View style={[styles.filterSection, { opacity: fadeAnim }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            <FilterChip label="All" value="all" />
            <FilterChip label="Unread" value="unread" />
            <FilterChip label="Tasks" value="TASK_ASSIGNMENT" />
            <FilterChip label="Comments" value="COMMENT" />
            <FilterChip label="Invites" value="PROJECT_INVITE" />
          </ScrollView>
        </Animated.View>

        <FlatList
          data={filteredNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <Animated.View
              style={[
                styles.emptyState,
                { opacity: fadeAnim }
              ]}
            >
              <LinearGradient
                colors={[colors.cardLight, colors.cardDark]}
                style={[styles.emptyIllustration, { borderColor: colors.border }]}
              >
                <Bell size={48} color={colors.primary} />
              </LinearGradient>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>All caught up!</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                No notifications to show
              </Text>
            </Animated.View>
          }
        />
      </LinearGradient>
    </View>
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
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  markAllButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  markAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 6,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  filterSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  filterContainer: {
    paddingRight: 24,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  list: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 100,
  },
  notificationContainer: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#fc350b',
  },
  cardGradient: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: 'row',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginBottom: 8,
  },
  unreadText: {
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    opacity: 0.7,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    marginTop: 60,
  },
  emptyIllustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.7,
  },
});