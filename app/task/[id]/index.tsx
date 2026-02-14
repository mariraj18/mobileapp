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
import { taskApi, Task } from '@/utils/api/tasks';
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
  Flag,
  Tag,
  MoreHorizontal,
  Circle,
  Check,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

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
  const [showOptions, setShowOptions] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Check if this is a standalone task (no project_id)
  const isStandaloneTask = task?.project_id === null;

  useEffect(() => {
    if (id) {
      loadData();
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
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);

    const taskRes = await taskApi.getById(id!);

    if (taskRes.success) {
      setTask(taskRes.data);
      setEditTitle(taskRes.data.title);
      setEditDesc(taskRes.data.description || '');
      if (taskRes.data.due_date) {
        setSelectedDate(new Date(taskRes.data.due_date));
      }
    }

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
      return <ImageIcon size={20} color="#fc350b" />;
    }
    return <File size={20} color="#a0430a" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return '#10B981';
      case 'IN_PROGRESS': return '#fc350b';
      case 'TODO': return '#a0430a';
      default: return '#dfe8e6';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return '#fc350b';
      case 'URGENT': return '#a0430a';
      case 'MEDIUM': return '#f89b7a';
      case 'LOW': return '#10B981';
      default: return '#dfe8e6';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH': return <Flag size={14} color="#fc350b" />;
      case 'URGENT': return <AlertCircle size={14} color="#a0430a" />;
      case 'MEDIUM': return <Flag size={14} color="#f89b7a" />;
      case 'LOW': return <Flag size={14} color="#10B981" />;
      default: return <Flag size={14} color="#dfe8e6" />;
    }
  };

  const renderComment = (comment: Comment, level = 0) => {
    const isReply = level > 0;

    return (
      <View key={comment.id} style={[styles.commentContainer, { marginLeft: level * 16 }]}>
        <LinearGradient
          colors={isReply ? ['#fef1e1', '#ffffff'] : ['#ffffff', '#fef1e1']}
          style={[styles.commentCard, isReply && styles.replyCard]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.commentHeader}>
            <View style={styles.commentUser}>
              <LinearGradient
                colors={['#fc350b', '#a0430a']}
                style={styles.userAvatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.userAvatarText}>
                  {comment.user.name.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
              <View>
                <Text style={styles.commentUserName}>{comment.user.name}</Text>
                {comment.replyToUser && (
                  <View style={styles.replyInfo}>
                    <Reply size={10} color="#a0430a" />
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
        </LinearGradient>

        {comment.replies?.map((reply: Comment) => renderComment(reply, level + 1))}
      </View>
    );
  };

  const renderAttachment = ({ item }: { item: Attachment }) => (
    <LinearGradient
      colors={['#ffffff', '#fef1e1']}
      style={styles.attachmentItem}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.attachmentInfo}>
        <View style={[styles.attachmentIcon, { backgroundColor: '#fc350b15' }]}>
          {getFileIcon(item.file_type)}
        </View>
        <View style={styles.attachmentDetails}>
          <Text style={styles.attachmentName} numberOfLines={1}>
            {item.original_filename}
          </Text>
          <Text style={styles.attachmentMeta}>
            {formatFileSize(item.file_size)} • Uploaded {new Date(item.uploaded_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.attachmentActions}>
        <TouchableOpacity
          style={[styles.attachmentButton, { backgroundColor: '#fc350b15' }]}
          onPress={() => attachmentApi.download(item.id)}
        >
          <Download size={16} color="#fc350b" />
        </TouchableOpacity>
        {item.uploaded_by === user?.id && (
          <TouchableOpacity
            style={[styles.attachmentButton, { backgroundColor: '#fc350b15' }]}
            onPress={() => handleDeleteAttachment(item.id)}
          >
            <Trash2 size={16} color="#a0430a" />
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#fef1e1', '#ffffff']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fc350b" />
      </LinearGradient>
    );
  }

  if (!task) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Task not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#fef1e1', '#ffffff', '#dfe8e6']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.5, 1]}
      />
      
      <Stack.Screen
        options={{
          title: isStandaloneTask ? 'Personal Task' : 'Task Details',
          headerBackTitle: 'Back',
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
        {/* Task Header */}
        <View style={styles.taskHeader}>
          <LinearGradient
            colors={['#ffffff', '#fef1e1']}
            style={styles.taskHeaderGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerTop}>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '15' }]}>
                  <Circle size={10} color={getStatusColor(task.status)} />
                  <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                    {task.status.replace('_', ' ')}
                  </Text>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '15' }]}>
                  {getPriorityIcon(task.priority)}
                  <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                    {task.priority}
                  </Text>
                </View>
              </View>

              {!task.project?.is_completed && (
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: '#fc350b15' }]}
                  onPress={() => setEditMode(!editMode)}
                >
                  <Edit2 size={18} color="#fc350b" />
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
                  placeholderTextColor="#a0430a60"
                />
                <TextInput
                  style={styles.editDescInput}
                  value={editDesc}
                  onChangeText={setEditDesc}
                  placeholder="Description"
                  placeholderTextColor="#a0430a60"
                  multiline
                />
                <View style={styles.editActions}>
                  <TouchableOpacity
                    onPress={() => setEditMode(false)}
                    style={[styles.cancelButton, { backgroundColor: '#dfe8e6' }]}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveDetails}
                    style={styles.saveButton}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
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
                <Calendar size={16} color="#a0430a" />
                <Text style={styles.sectionTitle}>Due Date</Text>
              </View>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: '#fef1e1' }]}
                onPress={() => setShowDatePicker(true)}
                disabled={task.project?.is_completed}
              >
                <View style={styles.dateIconContainer}>
                  <Clock size={16} color="#fc350b" />
                </View>
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
                <ChevronRight size={16} color="#fc350b" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Status Update */}
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
                    { borderColor: getStatusColor(s) + '30' }
                  ]}
                  onPress={() => handleUpdateStatus(s)}
                >
                  <LinearGradient
                    colors={task.status === s ? [getStatusColor(s), getStatusColor(s) + '80'] : ['#ffffff', '#fef1e1']}
                    style={styles.statusButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {task.status === s && <Check size={14} color="#ffffff" style={styles.statusCheck} />}
                    <Text
                      style={[
                        styles.statusButtonText,
                        task.status === s && styles.statusButtonTextActive,
                      ]}
                    >
                      {s === 'IN_PROGRESS' ? 'DOING' : s}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Attachments */}
        {!isStandaloneTask && (
          <View style={styles.attachmentsSection}>
            <View style={styles.sectionHeader}>
              <Paperclip size={16} color="#a0430a" />
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
              <LinearGradient
                colors={['#ffffff', '#fef1e1']}
                style={styles.emptyAttachments}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Paperclip size={32} color="#fc350b40" />
                <Text style={styles.emptyAttachmentsText}>No attachments yet</Text>
              </LinearGradient>
            )}

            {!task.project?.is_completed && (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handlePickDocument}
                disabled={uploading}
              >
                <LinearGradient
                  colors={['#fc350b15', '#a0430a15']}
                  style={styles.uploadButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#fc350b" />
                  ) : (
                    <>
                      <Paperclip size={16} color="#fc350b" />
                      <Text style={styles.uploadButtonText}>Upload File</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Comments */}
        {!isStandaloneTask && (
          <View style={styles.commentsSection}>
            <View style={styles.commentsHeader}>
              <MessageSquare size={16} color="#a0430a" />
              <Text style={styles.sectionTitle}>
                Comments ({comments.length})
              </Text>
            </View>

            {replyingTo && (
              <LinearGradient
                colors={['#fc350b15', '#a0430a15']}
                style={styles.replyingTo}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.replyingToText}>
                  Replying to {replyingTo.user.name}
                </Text>
                <TouchableOpacity onPress={() => setReplyingTo(null)}>
                  <X size={16} color="#a0430a" />
                </TouchableOpacity>
              </LinearGradient>
            )}

            {comments.length > 0 ? (
              comments.map((comment) => renderComment(comment))
            ) : (
              <LinearGradient
                colors={['#ffffff', '#fef1e1']}
                style={styles.emptyComments}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MessageSquare size={32} color="#fc350b40" />
                <Text style={styles.emptyCommentsText}>No comments yet</Text>
                <Text style={styles.emptyCommentsSubtext}>Be the first to comment</Text>
              </LinearGradient>
            )}

            <View style={{ height: 100 }} />
          </View>
        )}
      </Animated.ScrollView>

      {/* Comment Input */}
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
            colors={['#ffffff', '#fef1e1']}
            style={styles.inputBarGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.commentInput}
                placeholder={
                  replyingTo
                    ? `Reply to ${replyingTo.user.name}...`
                    : 'Add a comment...'
                }
                placeholderTextColor="#a0430a60"
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
              >
                <LinearGradient
                  colors={newComment.trim() ? ['#fc350b', '#a0430a'] : ['#dfe8e6', '#c0cfcb']}
                  style={styles.sendButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Send size={18} color="#ffffff" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#a0430a',
    fontFamily: 'Inter_500Medium',
  },
  scrollView: {
    flex: 1,
  },
  taskHeader: {
    padding: 16,
  },
  taskHeaderGradient: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fc350b20',
    shadowColor: '#fc350b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    color: '#a0430a',
    fontFamily: 'Inter_700Bold',
    borderBottomWidth: 2,
    borderBottomColor: '#fc350b',
    paddingVertical: 8,
  },
  editDescInput: {
    fontSize: 16,
    color: '#a0430a',
    fontFamily: 'Inter_400Regular',
    borderWidth: 1,
    borderColor: '#fc350b30',
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#fef1e1',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  cancelText: {
    color: '#a0430a',
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
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#a0430a',
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
    lineHeight: 32,
  },
  description: {
    fontSize: 15,
    color: '#fc350b',
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    marginBottom: 20,
    opacity: 0.9,
  },
  dueDateSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#fc350b20',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#a0430a',
    fontFamily: 'Inter_600SemiBold',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fc350b30',
  },
  dateIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#fc350b15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    color: '#a0430a',
    fontFamily: 'Inter_500Medium',
  },
  datePlaceholder: {
    flex: 1,
    fontSize: 14,
    color: '#a0430a60',
    fontFamily: 'Inter_400Regular',
  },
  actionsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  statusButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statusButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  statusCheck: {
    marginRight: 2,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a0430a',
    fontFamily: 'Inter_600SemiBold',
  },
  statusButtonTextActive: {
    color: '#ffffff',
  },
  attachmentsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  attachmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#fc350b20',
  },
  attachmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  attachmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentDetails: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#a0430a',
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },
  attachmentMeta: {
    fontSize: 11,
    color: '#fc350b',
    fontFamily: 'Inter_400Regular',
    opacity: 0.7,
  },
  attachmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  attachmentButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyAttachments: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fc350b20',
    borderStyle: 'dashed',
  },
  emptyAttachmentsText: {
    marginTop: 8,
    fontSize: 14,
    color: '#a0430a',
    fontFamily: 'Inter_500Medium',
  },
  uploadButton: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  uploadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fc350b30',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fc350b',
    fontFamily: 'Inter_600SemiBold',
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  replyingTo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fc350b30',
  },
  replyingToText: {
    fontSize: 13,
    color: '#a0430a',
    fontFamily: 'Inter_500Medium',
  },
  emptyComments: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fc350b20',
    borderStyle: 'dashed',
  },
  emptyCommentsText: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#a0430a',
    fontFamily: 'Inter_600SemiBold',
  },
  emptyCommentsSubtext: {
    fontSize: 13,
    color: '#fc350b',
    fontFamily: 'Inter_400Regular',
    opacity: 0.7,
  },
  commentContainer: {
    marginBottom: 12,
  },
  commentCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fc350b20',
  },
  replyCard: {
    borderWidth: 1,
    borderColor: '#fc350b30',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  commentUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fef1e1',
    fontFamily: 'Inter_700Bold',
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a0430a',
    fontFamily: 'Inter_600SemiBold',
  },
  replyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  replyToText: {
    fontSize: 11,
    color: '#fc350b',
    fontFamily: 'Inter_400Regular',
    opacity: 0.7,
  },
  commentDate: {
    fontSize: 11,
    color: '#a0430a',
    fontFamily: 'Inter_400Regular',
    opacity: 0.6,
  },
  commentContent: {
    fontSize: 14,
    color: '#a0430a',
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginBottom: 8,
  },
  replyButton: {
    alignSelf: 'flex-start',
  },
  replyButtonText: {
    fontSize: 12,
    color: '#fc350b',
    fontFamily: 'Inter_600SemiBold',
  },
  inputBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 34,
  },
  inputBarGradient: {
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fc350b30',
    shadowColor: '#fc350b',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#fef1e1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#a0430a',
    fontFamily: 'Inter_400Regular',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#fc350b30',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});