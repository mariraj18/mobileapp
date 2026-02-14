import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Animated,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ListTodo, 
  Target, 
  Calendar, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Circle,
  Search,
  Filter,
  Plus,
  AlertCircle,
  ChevronDown,
} from 'lucide-react-native';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({ active: 0, dueToday: 0, completed: 0 });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchTasks();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(searchAnim, {
        toValue: 1,
        tension: 30,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
      case 'HIGH': return '#fc350b';
      case 'MEDIUM': return '#a0430a';
      case 'LOW': return '#f89b7a';
      default: return '#dfe8e6';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE':
        return <CheckCircle2 size={18} color="#f89b7a" />;
      case 'IN_PROGRESS':
        return <Circle size={18} color="#fc350b" />;
      default:
        return <Circle size={18} color="#a0430a" />;
    }
  };

  const filterTasks = (tasks: TaskWithProject[]) => {
    let filtered = tasks.filter(task => !task.project || !task.project.is_completed);

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    switch (selectedFilter) {
      case 'todo':
        filtered = filtered.filter(task => task.status === 'TODO');
        break;
      case 'inProgress':
        filtered = filtered.filter(task => task.status === 'IN_PROGRESS');
        break;
      case 'done':
        filtered = filtered.filter(task => task.status === 'DONE');
        break;
      case 'dueToday':
        const today = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(task => task.due_date === today);
        break;
      default:
        break;
    }

    return filtered;
  };

  const renderTaskItem = ({ item, index }: { item: TaskWithProject; index: number }) => (
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
      <TouchableOpacity
        style={styles.taskCard}
        onPress={() => router.push(`/task/${item.id}`)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#ffffff', '#fef1e1']}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.taskHeader}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                {item.priority}
              </Text>
            </View>
            {item.due_date && (
              <View style={styles.dateContainer}>
                <Calendar size={12} color="#a0430a" />
                <Text style={styles.dateText}>
                  {new Date(item.due_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.taskTitle} numberOfLines={2}>{item.title}</Text>
          
          {item.description ? (
            <Text style={styles.taskDescription} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.taskMeta}>
            <View style={styles.projectTag}>
              <Text style={styles.projectTagText}>
                {item.project?.name || '📋 Personal'}
              </Text>
            </View>
          </View>

          <View style={styles.taskFooter}>
            <View style={styles.statusContainer}>
              {getStatusIcon(item.status)}
              <Text style={[
                styles.statusText,
                item.status === 'DONE' && styles.completedText,
                item.status === 'IN_PROGRESS' && styles.inProgressText
              ]}>
                {item.status === 'DONE' ? 'Completed' :
                 item.status === 'IN_PROGRESS' ? 'In Progress' : 'To Do'}
              </Text>
            </View>

            {item.status !== 'DONE' && (
              <TouchableOpacity style={styles.quickAction}>
                <CheckCircle2 size={18} color="#fc350b" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const filteredTasks = filterTasks(tasks);

  const FilterChip = ({ label, value }: { label: string; value: string }) => (
    <TouchableOpacity
      style={[styles.filterChip, selectedFilter === value && styles.filterChipActive]}
      onPress={() => setSelectedFilter(value)}
    >
      <Text style={[styles.filterChipText, selectedFilter === value && styles.filterChipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#fef1e1', '#ffffff']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#fc350b" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#fef1e1', '#ffffff', '#dfe8e6']}
        style={styles.gradientBackground}
        locations={[0, 0.6, 1]}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View>
            <Text style={styles.headerTitle}>My Tasks</Text>
            <Text style={styles.headerSubtitle}>
              {stats.active} active · {stats.dueToday} due today
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => router.push('/task/create')}
          >
            <LinearGradient
              colors={['#fc350b', '#a0430a']}
              style={styles.createButtonGradient}
            >
              <Plus size={20} color="#fef1e1" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Cards */}
        <Animated.View style={[styles.statsContainer, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={['#ffffff', '#fef1e1']}
            style={styles.statCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Target size={20} color="#fc350b" />
            <Text style={styles.statNumber}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#ffffff', '#fef1e1']}
            style={styles.statCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Calendar size={20} color="#a0430a" />
            <Text style={styles.statNumber}>{stats.dueToday}</Text>
            <Text style={styles.statLabel}>Due Today</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#ffffff', '#fef1e1']}
            style={styles.statCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <CheckCircle2 size={20} color="#f89b7a" />
            <Text style={styles.statNumber}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </LinearGradient>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View style={[styles.searchContainer, { transform: [{ scale: searchAnim }] }]}>
          <View style={styles.searchWrapper}>
            <Search size={18} color="#a0430a" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tasks..."
              placeholderTextColor="#a0430a60"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity 
            style={[styles.filterButton, showFilters && styles.filterButtonActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} color={showFilters ? '#fef1e1' : '#a0430a'} />
          </TouchableOpacity>
        </Animated.View>

        {/* Filter Chips */}
        {showFilters && (
          <Animated.View style={[styles.filterSection, { opacity: fadeAnim }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                <FilterChip label="All" value="all" />
                <FilterChip label="To Do" value="todo" />
                <FilterChip label="In Progress" value="inProgress" />
                <FilterChip label="Done" value="done" />
                <FilterChip label="Due Today" value="dueToday" />
              </View>
            </ScrollView>
          </Animated.View>
        )}

        <FlatList
          data={filteredTasks}
          renderItem={renderTaskItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#fc350b"
              colors={['#fc350b']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <LinearGradient
                colors={['#ffffff', '#fef1e1']}
                style={styles.emptyIllustration}
              >
                <ListTodo size={48} color="#fc350b" />
              </LinearGradient>
              <Text style={styles.emptyTitle}>No tasks found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? "No tasks match your search"
                  : "Create your first task to get started"}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/task/create')}
                >
                  <LinearGradient
                    colors={['#fc350b', '#a0430a']}
                    style={styles.emptyButtonGradient}
                  >
                    <Plus size={18} color="#fef1e1" />
                    <Text style={styles.emptyButtonText}>Create Task</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
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
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#a0430a',
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fc350b',
    fontFamily: 'Inter_400Regular',
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#fc350b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fc350b20',
    shadowColor: '#a0430a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#a0430a',
    fontFamily: 'Inter_700Bold',
    marginVertical: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#fc350b',
    fontFamily: 'Inter_500Medium',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 16,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#fc350b20',
    shadowColor: '#a0430a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 10,
    fontSize: 14,
    color: '#a0430a',
    fontFamily: 'Inter_400Regular',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fc350b20',
    shadowColor: '#a0430a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: '#fc350b',
    borderColor: '#fc350b',
  },
  filterSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 24,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#fc350b20',
    shadowColor: '#a0430a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipActive: {
    backgroundColor: '#fc350b',
    borderColor: '#fc350b',
  },
  filterChipText: {
    fontSize: 12,
    color: '#a0430a',
    fontFamily: 'Inter_500Medium',
  },
  filterChipTextActive: {
    color: '#fef1e1',
  },
  listContent: {
    padding: 24,
    paddingTop: 0,
    paddingBottom: 100,
  },
  taskCard: {
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: '#a0430a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardGradient: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fc350b20',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef1e1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 11,
    color: '#a0430a',
    fontFamily: 'Inter_500Medium',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a0430a',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
  },
  taskDescription: {
    fontSize: 13,
    color: '#fc350b',
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
    lineHeight: 18,
    opacity: 0.8,
  },
  taskMeta: {
    marginBottom: 12,
  },
  projectTag: {
    backgroundColor: '#fef1e1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  projectTagText: {
    fontSize: 11,
    color: '#a0430a',
    fontFamily: 'Inter_500Medium',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#fc350b20',
    paddingTop: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#a0430a',
    fontFamily: 'Inter_500Medium',
  },
  completedText: {
    color: '#f89b7a',
  },
  inProgressText: {
    color: '#fc350b',
  },
  quickAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
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
    borderColor: '#fc350b30',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#a0430a',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#fc350b',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.7,
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#fc350b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fef1e1',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});

import { ScrollView } from 'react-native';