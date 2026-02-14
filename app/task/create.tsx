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
      case 'HIGH': return '#fc350b';
      case 'URGENT': return '#a0430a';
      case 'MEDIUM': return '#f89b7a';
      case 'LOW': return '#10B981';
      default: return '#dfe8e6';
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'TODO': return '#a0430a';
      case 'IN_PROGRESS': return '#fc350b';
      case 'DONE': return '#10B981';
      default: return '#dfe8e6';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#fef1e1', '#ffffff', '#dfe8e6']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.5, 1]}
      />

      <Stack.Screen
        options={{
          title: 'Create New Task',
          headerBackTitle: 'Cancel',
          headerTintColor: '#fc350b',
          headerStyle: {
            backgroundColor: '#fef1e1',
          },
          headerTitleStyle: {
            color: '#a0430a',
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
            colors={['#ffffff', '#fef1e1']}
            style={styles.inputCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.inputIconContainer}>
              <CheckSquare size={20} color="#fc350b" />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Task Title <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Design new homepage"
                placeholderTextColor="#a0430a60"
                value={title}
                onChangeText={setTitle}
                maxLength={255}
              />
            </View>
          </LinearGradient>

          {/* Description Input */}
          <LinearGradient
            colors={['#ffffff', '#fef1e1']}
            style={styles.inputCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.inputIconContainer}>
              <FileText size={20} color="#fc350b" />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add more details about this task..."
                placeholderTextColor="#a0430a60"
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
            colors={['#ffffff', '#fef1e1']}
            style={styles.inputCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.inputIconContainer}>
              <Flag size={20} color="#fc350b" />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Priority</Text>
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
                          { color: priority === p ? '#ffffff' : getPriorityColor(p) }
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
            colors={['#ffffff', '#fef1e1']}
            style={styles.inputCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.inputIconContainer}>
              <Tag size={20} color="#fc350b" />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Status</Text>
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
                          { color: status === s ? '#ffffff' : getStatusColor(s) }
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
            colors={['#ffffff', '#fef1e1']}
            style={styles.inputCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.inputIconContainer}>
              <Calendar size={20} color="#fc350b" />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Due Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD (optional)"
                placeholderTextColor="#a0430a60"
                value={dueDate}
                onChangeText={setDueDate}
              />
            </View>
          </LinearGradient>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreateTask}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#dfe8e6', '#c0cfcb'] : ['#fc350b', '#a0430a']}
              style={styles.createButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Check size={20} color="#ffffff" />
                  <Text style={styles.createButtonText}>Create Task</Text>
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
    borderColor: '#fc350b20',
    shadowColor: '#fc350b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#fc350b15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    color: '#a0430a',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
  },
  required: {
    color: '#fc350b',
  },
  input: {
    fontSize: 15,
    color: '#a0430a',
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
    shadowColor: '#fc350b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
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