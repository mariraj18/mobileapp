import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Animated,
  FlatList,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { taskApi, Task, UpdateTaskData } from '@/utils/api/tasks';
import { commentApi, Comment, CreateCommentData } from '@/utils/api/comments';
import { attachmentApi } from '@/utils/api/attachments';
import { useAuth } from '@/contexts/AuthContext';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Send,
  Calendar,
  Edit2,
  User,
  Paperclip,
  ChevronRight,
  Reply,
  X,
  Download,
  Trash2,
  File,
  Image as ImageIcon,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Attachment {
  id: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  uploaded_at: string;
}

export default function TaskDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const commentAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Check if this is a standalone task (no project_id)
  const isStandaloneTask = task?.project_id === null;

  useEffect(() => {
    if (id) {
      loadData();
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 30,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(commentAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);

    // Load task details
    const taskRes = await taskApi.getById(id!);

    if (taskRes.success) {
      setTask(taskRes.data);
      setEditTitle(taskRes.data.title);
      setEditDesc(taskRes.data.description || '');
      if (taskRes.data.due_date) {
        setSelectedDate(new Date(taskRes.data.due_date));
      }
    }

    // Only load comments and attachments if it's not a standalone task
    if (!isStandaloneTask) {
      const [commentsRes, attachmentsRes] = await Promise.all([
        commentApi.getByTask(id!),
        attachmentApi.getByTask(id!),
      ]);

      if (commentsRes.success) {
        setComments(commentsRes.data);
      }

      if (attachmentsRes.success) {
        setAttachments(attachmentsRes.data);
      }
    }

    setLoading(false);
  };

  const handleUpdateStatus = async (status: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    if (!task) return;
    const response = await taskApi.update(task.id, { status });
    if (response.success) {
      setTask({ ...task, status });
    } else {
      Alert.alert('Error', response.message || 'Failed to update task status');
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      handleSaveDate(date);
    }
  };

  const handleSaveDate = async (date: Date) => {
    if (!task) return;
    const response = await taskApi.update(task.id, {
      due_date: date.toISOString(),
    });
    if (response.success) {
      setTask({ ...task, due_date: date.toISOString() });
    } else {
      Alert.alert('Error', response.message || 'Failed to update due date');
    }
  };

  const handleSaveDetails = async () => {
    if (!task) return;
    const response = await taskApi.update(task.id, {
      title: editTitle,
      description: editDesc,
    });
    if (response.success) {
      setTask({ ...task, title: editTitle, description: editDesc });
      setEditMode(false);
    } else {
      Alert.alert('Error', response.message || 'Failed to update task details');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setSending(true);
    const commentData: CreateCommentData = {
      content: newComment,
    };

    if (replyingTo) {
      commentData.parentId = replyingTo.parent_id || replyingTo.id;
      commentData.replyTo = replyingTo.user_id;
    }

    const response = await commentApi.create(id!, commentData);
    setSending(false);

    if (response.success) {
      setNewComment('');
      setReplyingTo(null);
      loadData();
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } else {
      Alert.alert('Error', response.message || 'Failed to send comment');
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setUploading(true);

      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.mimeType || 'application/octet-stream',
        name: file.name,
      } as any);

      const response = await attachmentApi.upload(id!, formData);

      if (response.success) {
        loadData();
      } else {
        Alert.alert('Error', 'Failed to upload file');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    Alert.alert(
      'Delete Attachment',
      'Are you sure you want to delete this attachment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const response = await attachmentApi.delete(attachmentId);
            if (response.success) {
              loadData();
            } else {
              Alert.alert('Error', 'Failed to delete attachment');
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon size={20} color="#6366F1" />;
    }
    return <File size={20} color="#6366F1" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return '#10B981';
      case 'IN_PROGRESS': return '#3B82F6';
      case 'TODO': return '#F59E0B';
      default: return '#94A3B8';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return '#EF4444';
      case 'URGENT': return '#DC2626';
      case 'MEDIUM': return '#F59E0B';
      case 'LOW': return '#6B7280';
      default: return '#94A3B8';
    }
  };

  const renderComment = (comment: Comment, level = 0) => {
    const isReply = level > 0;

    return (
      <View key={comment.id} style={[styles.commentContainer, { marginLeft: level * 20 }]}>
        <View style={[styles.commentCard, isReply && styles.replyCard]}>
          <View style={styles.commentHeader}>
            <View style={styles.commentUser}>
              <View style={styles.userAvatar}>
                <User size={14} color="#64748B" />
              </View>
              <View>
                <Text style={styles.commentUserName}>{comment.user.name}</Text>
                {comment.replyToUser && (
                  <View style={styles.replyInfo}>
                    <Reply size={10} color="#94A3B8" />
                    <Text style={styles.replyToText}>
                      replying to {comment.replyToUser.name}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.commentDate}>
              {new Date(comment.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <Text style={styles.commentContent}>{comment.content}</Text>
          <TouchableOpacity
            style={styles.replyButton}
            onPress={() => setReplyingTo(comment)}
          >
            <Text style={styles.replyButtonText}>Reply</Text>
          </TouchableOpacity>
        </View>

        {comment.replies?.map((reply: Comment) => renderComment(reply, level + 1))}
      </View>
    );
  };

  const renderAttachment = ({ item }: { item: Attachment }) => (
    <View style={styles.attachmentItem}>
      <View style={styles.attachmentInfo}>
        {getFileIcon(item.file_type)}
        <View style={styles.attachmentDetails}>
          <Text style={styles.attachmentName} numberOfLines={1}>
            {item.original_filename}
          </Text>
          <Text style={styles.attachmentMeta}>
            {formatFileSize(item.file_size)} • {new Date(item.uploaded_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.attachmentActions}>
        <TouchableOpacity
          style={styles.attachmentButton}
          onPress={() => attachmentApi.download(item.id)}
        >
          <Download size={18} color="#64748B" />
        </TouchableOpacity>
        {item.uploaded_by === user?.id && (
          <TouchableOpacity
            style={styles.attachmentButton}
            onPress={() => handleDeleteAttachment(item.id)}
          >
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.centered}>
        <Text>Task not found</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Stack.Screen
        options={{
          title: isStandaloneTask ? 'Personal Task' : 'Task Details',
          headerBackTitle: 'Back',
          headerTintColor: '#6366F1',
        }}
      />

      <Animated.ScrollView
        ref={scrollViewRef}
        style={[
          styles.scrollView,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.taskHeader}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC']}
            style={styles.taskHeaderGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerTop}>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(task.status) + '15' },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(task.status) },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(task.status) },
                    ]}
                  >
                    {task.status.replace('_', ' ')}
                  </Text>
                </View>
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(task.priority) + '15' },
                  ]}
                >
                  <AlertCircle size={14} color={getPriorityColor(task.priority)} />
                  <Text
                    style={[
                      styles.priorityText,
                      { color: getPriorityColor(task.priority) },
                    ]}
                  >
                    {task.priority}
                  </Text>
                </View>
              </View>

              {!task.project?.is_completed && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setEditMode(!editMode)}
                  activeOpacity={0.7}
                >
                  <Edit2 size={18} color="#6366F1" />
                </TouchableOpacity>
              )}
            </View>

            {editMode ? (
              <View style={styles.editForm}>
                <TextInput
                  style={styles.editTitleInput}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Task title"
                />
                <TextInput
                  style={styles.editDescInput}
                  value={editDesc}
                  onChangeText={setEditDesc}
                  placeholder="Description"
                  multiline
                />
                <View style={styles.editActions}>
                  <TouchableOpacity
                    onPress={() => setEditMode(false)}
                    style={styles.cancelButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveDetails}
                    style={styles.saveButton}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#10B981', '#34D399']}
                      style={styles.saveButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.saveText}>Save</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.title}>{task.title}</Text>
                <Text style={styles.description}>
                  {task.description || 'No description provided.'}
                </Text>
              </>
            )}

            <View style={styles.dueDateSection}>
              <View style={styles.sectionHeader}>
                <Calendar size={16} color="#64748B" />
                <Text style={styles.sectionTitle}>Due Date</Text>
              </View>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
                disabled={task.project?.is_completed}
              >
                {selectedDate ? (
                  <Text style={styles.dateText}>
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                ) : (
                  <Text style={styles.datePlaceholder}>Set due date</Text>
                )}
                <ChevronRight size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {!task.project?.is_completed && (
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Update Status</Text>
            <View style={styles.statusButtons}>
              {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusButton,
                    task.status === s && styles.statusButtonActive,
                    task.status === s && { backgroundColor: getStatusColor(s) },
                  ]}
                  onPress={() => handleUpdateStatus(s)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      task.status === s && styles.statusButtonTextActive,
                    ]}
                  >
                    {s.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Attachments Section - Only for workspace tasks */}
        {!isStandaloneTask && (
          <View style={styles.attachmentsSection}>
            <View style={styles.sectionHeader}>
              <Paperclip size={16} color="#64748B" />
              <Text style={styles.sectionTitle}>Attachments ({attachments.length})</Text>
            </View>

            {attachments.length > 0 ? (
              <FlatList
                data={attachments}
                renderItem={renderAttachment}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.emptyAttachments}>No attachments yet</Text>
            )}

            {!task.project?.is_completed && (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handlePickDocument}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#6366F1" />
                ) : (
                  <>
                    <Paperclip size={16} color="#6366F1" />
                    <Text style={styles.uploadButtonText}>Upload File</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Comments Section - Only for workspace tasks */}
        {!isStandaloneTask && (
          <Animated.View style={[styles.commentsSection, { opacity: commentAnim }]}>
            <View style={styles.commentsHeader}>
              <Text style={styles.sectionTitle}>
                Comments ({comments.length})
              </Text>
              {replyingTo && (
                <View style={styles.replyingTo}>
                  <Text style={styles.replyingToText}>
                    Replying to {replyingTo.user.name}
                  </Text>
                  <TouchableOpacity onPress={() => setReplyingTo(null)}>
                    <X size={16} color="#64748B" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {comments.map((comment) => renderComment(comment))}
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Comment Input - Only for workspace tasks */}
      {!task.project?.is_completed && !isStandaloneTask && (
        <Animated.View
          style={[
            styles.inputBar,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC']}
            style={styles.inputBarGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TextInput
              style={styles.commentInput}
              placeholder={
                replyingTo
                  ? `Reply to ${replyingTo.user.name}...`
                  : 'Add a comment...'
              }
              placeholderTextColor="#94A3B8"
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity
              onPress={handleAddComment}
              disabled={sending || !newComment.trim()}
              style={[
                styles.sendButton,
                (!newComment.trim() || sending) && styles.sendButtonDisabled,
              ]}
              activeOpacity={0.7}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#94A3B8" />
              ) : (
                <Send
                  size={20}
                  color={newComment.trim() ? '#6366F1' : '#94A3B8'}
                />
              )}
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </Animated.View>
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
    backgroundColor: '#F8FAFC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  taskHeader: {
    padding: 20,
  },
  taskHeaderGradient: {
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      web: {
        boxShadow: '0px 8px 16px rgba(15, 23, 42, 0.08)',
      },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editForm: {
    gap: 16,
    marginBottom: 16,
  },
  editTitleInput: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter_700Bold',
    borderBottomWidth: 2,
    borderBottomColor: '#6366F1',
    paddingVertical: 8,
  },
  editDescInput: {
    fontSize: 16,
    color: '#334155',
    fontFamily: 'Inter_400Regular',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  cancelText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#475569',
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
    marginBottom: 20,
  },
  dueDateSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter_600SemiBold',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateText: {
    fontSize: 16,
    color: '#1E293B',
    fontFamily: 'Inter_400Regular',
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#94A3B8',
    fontFamily: 'Inter_400Regular',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusButtonActive: {
    borderColor: 'transparent',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  attachmentsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  attachmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  attachmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  attachmentDetails: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },
  attachmentMeta: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter_400Regular',
  },
  attachmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  attachmentButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  emptyAttachments: {
    fontSize: 14,
    color: '#94A3B8',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    padding: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    marginTop: 12,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    fontFamily: 'Inter_600SemiBold',
  },
  commentsSection: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  commentsHeader: {
    marginBottom: 16,
  },
  replyingTo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  replyingToText: {
    fontSize: 14,
    color: '#6366F1',
    fontFamily: 'Inter_500Medium',
  },
  commentContainer: {
    marginBottom: 12,
  },
  commentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 2px rgba(15, 23, 42, 0.05)',
      },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  replyCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  commentUser: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    fontFamily: 'Inter_600SemiBold',
  },
  replyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  replyToText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter_400Regular',
  },
  commentDate: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter_400Regular',
  },
  commentContent: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  replyButton: {
    alignSelf: 'flex-start',
  },
  replyButtonText: {
    fontSize: 14,
    color: '#6366F1',
    fontFamily: 'Inter_500Medium',
  },
  inputBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
  },
  inputBarGradient: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 12px rgba(15, 23, 42, 0.05)',
      },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
      },
    }),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
    fontFamily: 'Inter_400Regular',
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#F1F5F9',
  },
});