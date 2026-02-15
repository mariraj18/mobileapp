// app/(tabs)/tasks.tsx
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
  ScrollView,
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
import { useTheme } from '@/contexts/ThemeContext';

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
  const { colors } = useTheme();
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
      case 'HIGH': return colors.primary;
      case 'MEDIUM': return colors.secondary;
      case 'LOW': return colors.tertiary;
      default: return colors.border;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE':
        return <CheckCircle2 size={18} color={colors.tertiary} />;
      case 'IN_PROGRESS':
        return <Circle size={18} color={colors.primary} />;
      default:
        return <Circle size={18} color={colors.secondary} />;
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
        style={[styles.taskCard, { shadowColor: colors.shadow }]}
        onPress={() => router.push(`/task/${item.id}`)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[colors.cardLight, colors.cardDark]}
          style={[styles.cardGradient, { borderColor: colors.border }]}
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
              <View style={[styles.dateContainer, { backgroundColor: colors.badgeBackground }]}>
                <Calendar size={12} color={colors.secondary} />
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                  {new Date(item.due_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
          
          {item.description ? (
            <Text style={[styles.taskDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.taskMeta}>
            <View style={[styles.projectTag, { backgroundColor: colors.badgeBackground }]}>
              <Text style={[styles.projectTagText, { color: colors.textSecondary }]}>
                {item.project?.name || '📋 Personal'}
              </Text>
            </View>
          </View>

          <View style={[styles.taskFooter, { borderTopColor: colors.border }]}>
            <View style={styles.statusContainer}>
              {getStatusIcon(item.status)}
              <Text style={[
                styles.statusText,
                { color: colors.textSecondary },
                item.status === 'DONE' && { color: colors.tertiary },
                item.status === 'IN_PROGRESS' && { color: colors.primary }
              ]}>
                {item.status === 'DONE' ? 'Completed' :
                 item.status === 'IN_PROGRESS' ? 'In Progress' : 'To Do'}
              </Text>
            </View>

            {item.status !== 'DONE' && (
              <TouchableOpacity style={[styles.quickAction, { backgroundColor: colors.badgeBackground }]}>
                <CheckCircle2 size={18} color={colors.primary} />
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
      style={[
        styles.filterChip, 
        { backgroundColor: colors.cardLight, borderColor: colors.border, shadowColor: colors.shadow },
        selectedFilter === value && { backgroundColor: colors.primary, borderColor: colors.primary }
      ]}
      onPress={() => setSelectedFilter(value)}
    >
      <Text style={[
        styles.filterChipText, 
        { color: colors.textSecondary },
        selectedFilter === value && { color: colors.textLight }
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
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>My Tasks</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {stats.active} active · {stats.dueToday} due today
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.createButton, { shadowColor: colors.primary }]}
            onPress={() => router.push('/task/create')}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.createButtonGradient}
            >
              <Plus size={20} color={colors.textLight} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Cards */}
        <Animated.View style={[styles.statsContainer, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={[colors.cardLight, colors.cardDark]}
            style={[styles.statCard, { borderColor: colors.border, shadowColor: colors.shadow }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Target size={20} color={colors.primary} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats.active}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
          </LinearGradient>

          <LinearGradient
            colors={[colors.cardLight, colors.cardDark]}
            style={[styles.statCard, { borderColor: colors.border, shadowColor: colors.shadow }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Calendar size={20} color={colors.secondary} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats.dueToday}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Due Today</Text>
          </LinearGradient>

          <LinearGradient
            colors={[colors.cardLight, colors.cardDark]}
            style={[styles.statCard, { borderColor: colors.border, shadowColor: colors.shadow }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <CheckCircle2 size={20} color={colors.tertiary} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats.completed}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
          </LinearGradient>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View style={[styles.searchContainer, { transform: [{ scale: searchAnim }] }]}>
          <View style={[styles.searchWrapper, { backgroundColor: colors.cardLight, borderColor: colors.border, shadowColor: colors.shadow }]}>
            <Search size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search tasks..."
              placeholderTextColor={colors.textSecondary + '60'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              { backgroundColor: colors.cardLight, borderColor: colors.border, shadowColor: colors.shadow },
              showFilters && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} color={showFilters ? colors.textLight : colors.textSecondary} />
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
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <LinearGradient
                colors={[colors.cardLight, colors.cardDark]}
                style={[styles.emptyIllustration, { borderColor: colors.border }]}
              >
                <ListTodo size={48} color={colors.primary} />
              </LinearGradient>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No tasks found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {searchQuery 
                  ? "No tasks match your search"
                  : "Create your first task to get started"}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={[styles.emptyButton, { shadowColor: colors.primary }]}
                  onPress={() => router.push('/task/create')}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    style={styles.emptyButtonGradient}
                  >
                    <Plus size={18} color={colors.textLight} />
                    <Text style={[styles.emptyButtonText, { color: colors.textLight }]}>Create Task</Text>
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
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginVertical: 6,
  },
  statLabel: {
    fontSize: 11,
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
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
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
    fontFamily: 'Inter_400Regular',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    borderRadius: 30,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  listContent: {
    padding: 24,
    paddingTop: 0,
    paddingBottom: 100,
  },
  taskCard: {
    marginBottom: 16,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardGradient: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
  },
  taskDescription: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
    lineHeight: 18,
    opacity: 0.8,
  },
  taskMeta: {
    marginBottom: 12,
  },
  projectTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  projectTagText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  quickAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    lineHeight: 20,
    opacity: 0.7,
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 16,
    overflow: 'hidden',
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
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});