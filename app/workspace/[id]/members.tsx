import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { memberApi, WorkspaceMember } from '@/utils/api/members';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, X, Trash2, Shield } from 'lucide-react-native';

export default function WorkspaceMembersScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (id) {
            loadMembers();
        }
    }, [id]);

    const loadMembers = async () => {
        setLoading(true);
        const response = await memberApi.getMembers(id!);
        if (response.success) {
            setMembers(response.data);
        }
        setLoading(false);
    };

    const handleInvite = async () => {
        if (!inviteEmail.trim()) {
            Alert.alert('Error', 'Please enter a user ID (Email lookup not implemented yet)');
            return;
        }

        setInviting(true);
        // Note: Backend requires userId. In a real app, we'd lookup by email first.
        // For now, we assume the user enters a valid User ID for testing.
        const response = await memberApi.addMember(id!, inviteEmail, 'MEMBER');
        setInviting(false);

        if (response.success) {
            setInviteEmail('');
            setModalVisible(false);
            loadMembers();
            Alert.alert('Success', 'Member added successfully');
        } else {
            Alert.alert('Error', response.message || 'Failed to add member');
        }
    };

    const handleRemoveMember = (member: WorkspaceMember) => {
        Alert.alert('Remove Member', `Are you sure you want to remove ${member.name}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                    const response = await memberApi.removeMember(id!, member.userId);
                    if (response.success) {
                        loadMembers();
                    } else {
                        Alert.alert('Error', response.message || 'Failed to remove member');
                    }
                }
            }
        ]);
    };

    const renderMember = ({ item }: { item: WorkspaceMember }) => (
        <View style={styles.card}>
            <View style={styles.memberInfo}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                    <Text style={styles.memberName}>{item.name}</Text>
                    <Text style={styles.memberEmail}>{item.email}</Text>
                    <View style={styles.roleContainer}>
                        <Shield size={12} color="#666" style={{ marginRight: 4 }} />
                        <Text style={styles.roleText}>{item.role}</Text>
                    </View>
                </View>
            </View>

            {/* Only allow removing others if not self */}
            {item.userId !== user?.id && (
                <TouchableOpacity onPress={() => handleRemoveMember(item)} style={styles.removeButton}>
                    <Trash2 size={20} color="#FF3B30" />
                </TouchableOpacity>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Workspace Members', headerBackTitle: 'Back' }} />

            <FlatList
                data={members}
                renderItem={renderMember}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setModalVisible(true)}
            >
                <UserPlus color="#fff" size={24} />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Member</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X color="#666" size={24} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>User ID (Development Mode)</Text>
                            <TextInput
                                style={styles.input}
                                value={inviteEmail}
                                onChangeText={setInviteEmail}
                                placeholder="Enter User ID"
                                autoCapitalize="none"
                            />
                            <Text style={styles.hint}>In production, this would be an email lookup.</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={handleInvite}
                            disabled={inviting}
                        >
                            {inviting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.createButtonText}>Add Member</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#007AFF',
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    memberEmail: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    roleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    roleText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#666',
    },
    removeButton: {
        padding: 8,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    hint: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    createButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
