import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    StyleSheet,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type PostCategory = 'Prayers' | 'Testimonies';

interface NewPostModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NewPostModal({ visible, onClose, onSuccess }: NewPostModalProps) {
    const { user } = useAuth();
    const [category, setCategory] = useState<PostCategory>('Prayers');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setCategory('Prayers');
        setTitle('');
        setContent('');
    };

    const handleClose = () => {
        if (!loading) {
            resetForm();
            onClose();
        }
    };

    const handleSubmit = async () => {
        if (!user) {
            Alert.alert('Authentication Required', 'Please sign in to post.');
            return;
        }

        // Validation
        if (title.trim().length < 3) {
            Alert.alert('Invalid Title', 'Title must be at least 3 characters.');
            return;
        }

        if (title.trim().length > 100) {
            Alert.alert('Title Too Long', 'Title must be less than 100 characters.');
            return;
        }

        if (content.trim().length < 10) {
            Alert.alert('Invalid Content', 'Content must be at least 10 characters.');
            return;
        }

        if (content.trim().length > 1000) {
            Alert.alert('Content Too Long', 'Content must be less than 1000 characters.');
            return;
        }

        try {
            setLoading(true);

            const { error } = await supabase.from('communitythreads').insert({
                userid: user.id,
                title: title.trim(),
                content: content.trim(),
                category,
                privacy_level: 'public',
                is_anonymous: false,
            });

            if (error) throw error;

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', `Your ${category === 'Prayers' ? 'prayer request' : 'testimony'} has been shared!`);

            resetForm();
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating post:', error);
            Alert.alert('Error', 'Unable to create post. Please try again.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <SafeAreaView style={styles.container} edges={['top']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoid}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable onPress={handleClose} style={styles.closeButton} disabled={loading}>
                            <Ionicons name="close" size={28} color="#09090b" />
                        </Pressable>
                        <Text style={styles.headerTitle}>New Post</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        {/* Category Selector */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Category</Text>
                            <View style={styles.categoryContainer}>
                                <Pressable
                                    style={[styles.categoryButton, category === 'Prayers' && styles.categoryButtonActive]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setCategory('Prayers');
                                    }}
                                    disabled={loading}
                                >
                                    <Ionicons
                                        name="hand-right"
                                        size={20}
                                        color={category === 'Prayers' ? '#fff' : '#047857'}
                                    />
                                    <Text
                                        style={[
                                            styles.categoryButtonText,
                                            category === 'Prayers' && styles.categoryButtonTextActive,
                                        ]}
                                    >
                                        Prayer Request
                                    </Text>
                                </Pressable>

                                <Pressable
                                    style={[styles.categoryButton, category === 'Testimonies' && styles.categoryButtonActive]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setCategory('Testimonies');
                                    }}
                                    disabled={loading}
                                >
                                    <Ionicons
                                        name="sparkles"
                                        size={20}
                                        color={category === 'Testimonies' ? '#fff' : '#047857'}
                                    />
                                    <Text
                                        style={[
                                            styles.categoryButtonText,
                                            category === 'Testimonies' && styles.categoryButtonTextActive,
                                        ]}
                                    >
                                        Testimony
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Title Input */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Title</Text>
                            <TextInput
                                style={styles.titleInput}
                                placeholder={category === 'Prayers' ? 'What can we pray for?' : 'Share your blessing'}
                                placeholderTextColor="#a1a1aa"
                                value={title}
                                onChangeText={setTitle}
                                maxLength={100}
                                editable={!loading}
                            />
                            <Text style={styles.charCount}>{title.length}/100</Text>
                        </View>

                        {/* Content Input */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Details</Text>
                            <TextInput
                                style={styles.contentInput}
                                placeholder={
                                    category === 'Prayers'
                                        ? 'Share your prayer request with the community...'
                                        : 'Tell us how God has worked in your life...'
                                }
                                placeholderTextColor="#a1a1aa"
                                value={content}
                                onChangeText={setContent}
                                maxLength={1000}
                                multiline
                                numberOfLines={8}
                                textAlignVertical="top"
                                editable={!loading}
                            />
                            <Text style={styles.charCount}>{content.length}/1000</Text>
                        </View>

                        {/* Guidance */}
                        <View style={styles.guidanceContainer}>
                            <Ionicons name="information-circle" size={20} color="#047857" />
                            <Text style={styles.guidanceText}>
                                {category === 'Prayers'
                                    ? 'Your prayer request will be visible to the community. Others can pray for you and offer support.'
                                    : 'Share how God has moved in your life to encourage and inspire others in their faith journey.'}
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Submit Button */}
                    <View style={styles.footer}>
                        <Pressable
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading || !title.trim() || !content.trim()}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <LinearGradient
                                    colors={['#047857', '#059669']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.submitGradient}
                                >
                                    <Ionicons name="send" size={20} color="#fff" />
                                    <Text style={styles.submitText}>Post {category === 'Prayers' ? 'Prayer' : 'Testimony'}</Text>
                                </LinearGradient>
                            )}
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardAvoid: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e4e4e7',
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#09090b',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#09090b',
        marginBottom: 12,
    },
    categoryContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    categoryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#f4f4f5',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    categoryButtonActive: {
        backgroundColor: '#047857',
        borderColor: '#047857',
    },
    categoryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#047857',
    },
    categoryButtonTextActive: {
        color: '#fff',
    },
    titleInput: {
        backgroundColor: '#f4f4f5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#09090b',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    contentInput: {
        backgroundColor: '#f4f4f5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#09090b',
        minHeight: 160,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    charCount: {
        fontSize: 12,
        color: '#a1a1aa',
        textAlign: 'right',
        marginTop: 6,
    },
    guidanceContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginHorizontal: 20,
        marginTop: 20,
        backgroundColor: '#f0fdf4',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    guidanceText: {
        flex: 1,
        fontSize: 13,
        color: '#047857',
        lineHeight: 18,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e4e4e7',
    },
    submitButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
