import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { ListTodo, Target, Calendar, TrendingUp, Clock, CheckCircle2, Circle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { taskApi } from '@/utils/api/tasks';
import { Task } from '@/utils/api/tasks';

interface TaskWithProject extends Task {
  project?: {
    id: string;
    name: string;
    workspace_id: string;
    is_completed: boolean;
  };
}

export default function TasksScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ active: 0, dueToday: 0, completed: 0 });

  const fetchTasks = useCallback(async () => {
    try {
      const response = await taskApi.getUserTasks();
      if (response.success) {
        const fetchedTasks = response.data as TaskWithProject[];
        setTasks(fetchedTasks);

        if (response.stats) {
          setStats(response.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return '#DC2626';
      case 'HIGH': return '#EF4444';
      case 'MEDIUM': return '#F59E0B';
      case 'LOW': return '#10B981';
      default: return '#64748B';
    }
  };

  const renderTaskItem = ({ item }: { item: TaskWithProject }) => {
    if (item.project?.is_completed) return null;

    return (
      <TouchableOpacity
        style={styles.taskCard}
        onPress={() => router.push(`/task/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.taskHeader}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
              {item.priority}
            </Text>
          </View>
          {item.due_date && (
            <View style={styles.dateContainer}>
              <Calendar size={12} color="#64748B" />
              <Text style={styles.dateText}>
                {new Date(item.due_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.taskTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.projectName} numberOfLines={1}>
          {item.project?.name || 'Unknown Project'}
        </Text>

        <View style={styles.taskFooter}>
          <View style={styles.statusContainer}>
            {item.status === 'DONE' ? (
              <CheckCircle2 size={16} color="#10B981" />
            ) : (
              <Circle size={16} color="#64748B" />
            )}
            <Text style={[
              styles.statusText,
              item.status === 'DONE' && styles.completedText,
              item.status === 'IN_PROGRESS' && styles.inProgressText
            ]}>
              {item.status === 'DONE' ? 'Completed' :
                item.status === 'IN_PROGRESS' ? 'In Progress' : 'To Do'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredTasks = tasks.filter(task => !task.project?.is_completed);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F1F5F9', '#FFFFFF']}
        style={styles.gradientBackground}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Tasks</Text>
          <Text style={styles.headerSubtitle}>Tasks assigned to you across all projects</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Target size={20} color="#10B981" />
            <Text style={styles.statNumber}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Calendar size={20} color="#3B82F6" />
            <Text style={styles.statNumber}>{stats.dueToday}</Text>
            <Text style={styles.statLabel}>Due Today</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={20} color="#8B5CF6" />
            <Text style={styles.statNumber}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredTasks}
            renderItem={renderTaskItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <ListTodo size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>No tasks assigned to you yet.</Text>
                <TouchableOpacity
                  style={styles.browseButton}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Text style={styles.browseButtonText}>Browse Projects</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  gradientBackground: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Inter_700Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
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
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter_500Medium',
  },
  listContent: {
    paddingBottom: 20,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter_500Medium',
    marginLeft: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  projectName: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter_500Medium',
    marginLeft: 6,
  },
  completedText: {
    color: '#10B981',
  },
  inProgressText: {
    color: '#3B82F6',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    fontFamily: 'Inter_500Medium',
    marginTop: 16,
    marginBottom: 24,
  },
  browseButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#6366F1',
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});