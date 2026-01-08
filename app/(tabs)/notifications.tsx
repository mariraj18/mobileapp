import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { notificationApi, Notification } from '@/utils/api/notifications';
import { Bell, Check, Clock, AlertCircle, MessageSquare, UserPlus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadNotifications();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(listAnim, {
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
  };

  const handleMarkAsRead = async (id: string) => {
    const response = await notificationApi.markAsRead(id);
    if (response.success) {
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    }
  };

  const handleMarkAllRead = async () => {
    const response = await notificationApi.markAllAsRead();
    if (response.success) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED': return <AlertCircle size={20} color="#3B82F6" />;
      case 'MENTION': return <MessageSquare size={20} color="#8B5CF6" />;
      case 'INVITATION': return <UserPlus size={20} color="#10B981" />;
      default: return <Bell size={20} color="#6366F1" />;
    }
  };

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
        style={[styles.card, !item.read && styles.unreadCard]}
        onPress={() => !item.read && handleMarkAsRead(item.id)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardHeader}>
            <View style={[
              styles.iconContainer,
              { backgroundColor: !item.read ? 'rgba(99, 102, 241, 0.1)' : '#F1F5F9' }
            ]}>
              {getNotificationIcon(item.type)}
            </View>
            <View style={styles.timeContainer}>
              <Clock size={12} color="#94A3B8" />
              <Text style={styles.timeText}>
                {new Date(item.created_at).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.message, !item.read && styles.unreadText]}>
            {item.message}
          </Text>
          
          {!item.read && (
            <View style={styles.unreadIndicator}>
              <View style={styles.dot} />
              <Text style={styles.unreadLabel}>New</Text>
            </View>
          )}
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
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#F1F5F9', '#FFFFFF']}
        style={styles.gradientBackground}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              {notifications.filter(n => !n.read).length} unread
            </Text>
          </View>
          
          {notifications.some(n => !n.read) && (
            <TouchableOpacity 
              style={styles.markAllButton}
              onPress={handleMarkAllRead}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#10B981', '#34D399']}
                style={styles.markAllGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Check size={16} color="#fff" />
                <Text style={styles.markAllText}>Mark all read</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Animated.View 
              style={[
                styles.emptyState,
                { opacity: fadeAnim }
              ]}
            >
              <View style={styles.emptyIllustration}>
                <Bell size={48} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                We'll notify you when important things happen
              </Text>
            </Animated.View>
          }
        />
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter_400Regular',
  },
  markAllButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#10B981',
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
    borderRadius: 12,
  },
  markAllText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 6,
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  notificationContainer: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
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
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter_400Regular',
    marginLeft: 4,
  },
  message: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  unreadText: {
    color: '#1E293B',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  unreadIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
    marginRight: 8,
  },
  unreadLabel: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    marginTop: 60,
  },
  emptyIllustration: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
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
});