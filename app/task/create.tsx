import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { taskApi, CreateTaskData } from '@/utils/api/tasks';
import { useTheme } from '@/contexts/ThemeContext';
import {
  ArrowLeft,
  CheckSquare,
  Flag,
  Calendar,
  FileText,
  Tag,
  AlertCircle,
  Check,
  X
} from 'lucide-react-native';

export default function CreateTaskScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { projectId } = useLocalSearchParams();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'TODO' | 'IN_PROGRESS' | 'DONE'>('TODO');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
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

  const handleCreateTask = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (projectId) {
        const taskData: CreateTaskData = {
          title,
          description: description.trim() || undefined,
          status,
          priority,
          due_date: dueDate || undefined,
        };
        response = await taskApi.create(projectId as string, taskData);
      } else {
        response = await taskApi.createStandalone({
          title,
          description: description.trim() || undefined,
          status,
          priority,
          due_date: dueDate || undefined,
        });
      }

      if (response.success) {
        router.back();
      } else {
        Alert.alert('Error', response.message || 'Failed to create task');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while creating the task');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'HIGH': return colors.primary;
      case 'URGENT': return colors.secondary;
      case 'MEDIUM': return colors.tertiary;
      case 'LOW': return colors.success;
      default: return colors.border;
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'TODO': return colors.secondary;
      case 'IN_PROGRESS': return colors.primary;
      case 'DONE': return colors.success;
      default: return colors.border;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.cardDark, colors.background, colors.darkBg]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.5, 1]}
      />

      <Stack.Screen
        options={{
          title: 'Create New Task',
          headerBackTitle: 'Cancel',
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

      <Animated.ScrollView
        style={[
          styles.scrollView,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          {/* Title Input */}
          <LinearGradient
            colors={[colors.cardLight, colors.cardDark]}
            style={[styles.inputCard, { borderColor: colors.border, shadowColor: colors.shadow }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.inputIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <CheckSquare size={20} color={colors.primary} />
            </View>
            <View style={styles.inputContent}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Task Title <Text style={[styles.required, { color: colors.primary }]}>*</Text></Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g., Design new homepage"
                placeholderTextColor={colors.textSecondary + '60'}
                value={title}
                onChangeText={setTitle}
                maxLength={255}
              />
            </View>
          </LinearGradient>

          {/* Description Input */}
          <LinearGradient
            colors={[colors.cardLight, colors.cardDark]}
            style={[styles.inputCard, { borderColor: colors.border, shadowColor: colors.shadow }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.inputIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <FileText size={20} color={colors.primary} />
            </View>
            <View style={styles.inputContent}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.text }]}
                placeholder="Add more details about this task..."
                placeholderTextColor={colors.textSecondary + '60'}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={1000}
              />
            </View>
          </LinearGradient>

          {/* Priority Selection */}
          <LinearGradient
            colors={[colors.cardLight, colors.cardDark]}
            style={[styles.inputCard, { borderColor: colors.border, shadowColor: colors.shadow }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.inputIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Flag size={20} color={colors.primary} />
            </View>
            <View style={styles.inputContent}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Priority</Text>
              <View style={styles.optionsContainer}>
                {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.optionButton,
                      priority === p && styles.optionButtonActive,
                      { borderColor: getPriorityColor(p) + '30' }
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <LinearGradient
                      colors={priority === p ? [getPriorityColor(p), getPriorityColor(p) + '80'] : ['transparent', 'transparent']}
                      style={styles.optionGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          priority === p && styles.optionTextActive,
                          { color: priority === p ? colors.textLight : getPriorityColor(p) }
                        ]}
                      >
                        {p}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </LinearGradient>

          {/* Status Selection */}
          <LinearGradient
            colors={[colors.cardLight, colors.cardDark]}
            style={[styles.inputCard, { borderColor: colors.border, shadowColor: colors.shadow }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.inputIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Tag size={20} color={colors.primary} />
            </View>
            <View style={styles.inputContent}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Status</Text>
              <View style={styles.optionsContainer}>
                {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.optionButton,
                      status === s && styles.optionButtonActive,
                      { borderColor: getStatusColor(s) + '30' }
                    ]}
                    onPress={() => setStatus(s)}
                  >
                    <LinearGradient
                      colors={status === s ? [getStatusColor(s), getStatusColor(s) + '80'] : ['transparent', 'transparent']}
                      style={styles.optionGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          status === s && styles.optionTextActive,
                          { color: status === s ? colors.textLight : getStatusColor(s) }
                        ]}
                      >
                        {s === 'IN_PROGRESS' ? 'DOING' : s}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </LinearGradient>

          {/* Due Date */}
          <LinearGradient
            colors={[colors.cardLight, colors.cardDark]}
            style={[styles.inputCard, { borderColor: colors.border, shadowColor: colors.shadow }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.inputIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Calendar size={20} color={colors.primary} />
            </View>
            <View style={styles.inputContent}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Due Date</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="YYYY-MM-DD (optional)"
                placeholderTextColor={colors.textSecondary + '60'}
                value={dueDate}
                onChangeText={setDueDate}
              />
            </View>
          </LinearGradient>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, { shadowColor: colors.primary }, loading && styles.createButtonDisabled]}
            onPress={handleCreateTask}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? [colors.border, colors.border] : [colors.primary, colors.secondary]}
              style={styles.createButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {loading ? (
                <ActivityIndicator color={colors.textLight} />
              ) : (
                <>
                  <Check size={20} color={colors.textLight} />
                  <Text style={[styles.createButtonText, { color: colors.textLight }]}>Create Task</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  inputCard: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  inputIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
  },
  required: {
    fontWeight: '700',
  },
  input: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 8,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    minWidth: 70,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionButtonActive: {
    borderWidth: 0,
  },
  optionGradient: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  optionTextActive: {
    color: '#ffffff',
  },
  createButton: {
    marginTop: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
});