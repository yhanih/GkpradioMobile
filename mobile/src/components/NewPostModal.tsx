import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BackendThread, CreatePostError, createCommunityPost } from '../lib/backend';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../types/navigation';
import {
    Category,
    PostType,
    getPostTypeForCategory,
    getPostableCategoriesByType,
} from '../constants/categories';

interface NewPostModalProps {
    visible: boolean;
    onClose: () => void;
    /** When set, opening the sheet starts on this type (e.g. match Community prayers vs discussions tab). */
    defaultPostType?: PostType;
    onSuccess: (createdPost: BackendThread) => Promise<void> | void;
    onOptimisticCreate?: (tempPost: BackendThread) => void;
    onCommitCreate?: (tempId: string, persistedPost: BackendThread) => void;
    onCreateFailed?: (tempId: string) => void;
}

export function NewPostModal({
    visible,
    onClose,
    defaultPostType,
    onSuccess,
    onOptimisticCreate,
    onCommitCreate,
    onCreateFailed
}: NewPostModalProps) {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { user } = useAuth();
    const { theme } = useTheme();
    const styles = useMemo(() => createNewPostModalStyles(theme), [theme]);
    const [postType, setPostType] = useState<PostType>('prayer');
    const categories = getPostableCategoriesByType(postType);
    const [selectedCategory, setSelectedCategory] = useState<Category>(categories[0]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);
    const submitInFlightRef = useRef(false);
    const isMountedRef = useRef(true);
    const wasVisibleRef = useRef(false);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const resetForm = useCallback(() => {
        const t = defaultPostType ?? 'prayer';
        setPostType(t);
        setSelectedCategory(getPostableCategoriesByType(t)[0]);
        setTitle('');
        setContent('');
        setIsAnonymous(false);
    }, [defaultPostType]);

    useEffect(() => {
        if (visible && !wasVisibleRef.current) {
            resetForm();
        }
        wasVisibleRef.current = visible;
    }, [visible, resetForm]);

    useEffect(() => {
        if (!categories.some((cat) => cat.id === selectedCategory?.id)) {
            setSelectedCategory(categories[0]);
        }
    }, [categories, selectedCategory?.id]);

    const handleClose = () => {
        if (!loading) {
            resetForm();
            onClose();
        }
    };

    const handleSubmit = async () => {
        if (loading || submitInFlightRef.current) {
            return;
        }

        if (!user) {
            Alert.alert('Authentication Required', 'Please sign in to post.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign in', onPress: () => navigation.navigate('Login', { redirectBack: true }) },
            ]);
            return;
        }

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

        const normalizedTitle = title.trim();
        const normalizedContent = content.trim();
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const optimisticPost: BackendThread = {
            id: tempId,
            title: normalizedTitle,
            content: normalizedContent,
            category: selectedCategory.id,
            post_type: postType,
            createdat: new Date().toISOString(),
            like_count: 0,
            prayer_count: 0,
            comment_count: 0,
            user_has_liked: false,
            user_has_prayed: false,
            userid: user.id,
            is_anonymous: isAnonymous,
            ispinned: false,
            users: {
                id: user.id,
                fullname: user.fullname || user.email?.split('@')[0] || 'You',
                avatarurl: user.avatarurl || null,
                avatarseed: user.avatarseed ?? null,
            },
        };

        onOptimisticCreate?.(optimisticPost);

        try {
            submitInFlightRef.current = true;
            setLoading(true);

            const createdPost = await createCommunityPost({
                title: normalizedTitle,
                content: normalizedContent,
                category: selectedCategory.id,
                userId: user.id,
                postType,
                isAnonymous,
            });

            onCommitCreate?.(tempId, createdPost);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await onSuccess(createdPost);

            resetForm();
            onClose();
        } catch (error) {
            console.error('Error creating post:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            onCreateFailed?.(tempId);

            const createError = error instanceof CreatePostError ? error : null;
            if (createError?.code === 'validation') {
                Alert.alert('Unable to Post', createError.message);
            } else if (createError?.code === 'auth') {
                Alert.alert('Authentication Required', 'Please sign in again and try posting.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Sign in', onPress: () => navigation.navigate('Login', { redirectBack: true }) },
                ]);
            } else if (createError?.code === 'timeout' || createError?.code === 'network') {
                Alert.alert('Network Issue', 'We could not publish your post. Please try again.');
            } else {
                Alert.alert('Unable to Post', 'Something went wrong. Please try again.');
            }
        } finally {
            submitInFlightRef.current = false;
            if (isMountedRef.current) {
                setLoading(false);
            }
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
                    <View style={styles.header}>
                        <Pressable onPress={handleClose} style={styles.closeButton} disabled={loading}>
                            <Ionicons name="close" size={28} color={theme.colors.text} />
                        </Pressable>
                        <Text style={styles.headerTitle}>New Post</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        <View style={styles.section}>
                            <Text style={styles.label}>Post Type</Text>
                            <View style={styles.postTypeContainer}>
                                <Pressable
                                    style={[styles.postTypeButton, postType === 'prayer' && styles.postTypeButtonActive]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setPostType('prayer');
                                    }}
                                    disabled={loading}
                                >
                                    <Ionicons
                                        name={postType === 'prayer' ? 'hand-right' : 'hand-right-outline'}
                                        size={16}
                                        color={postType === 'prayer' ? '#fff' : theme.colors.textMuted}
                                    />
                                    <Text style={[styles.postTypeText, postType === 'prayer' && styles.postTypeTextActive]}>
                                        Prayer
                                    </Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.postTypeButton, postType === 'discussion' && styles.postTypeButtonActive]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setPostType('discussion');
                                    }}
                                    disabled={loading}
                                >
                                    <Ionicons
                                        name={postType === 'discussion' ? 'chatbubbles' : 'chatbubbles-outline'}
                                        size={16}
                                        color={postType === 'discussion' ? '#fff' : theme.colors.textMuted}
                                    />
                                    <Text style={[styles.postTypeText, postType === 'discussion' && styles.postTypeTextActive]}>
                                        Discussion
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.label}>Category</Text>
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.categoryScrollContent}
                            >
                                {categories.map(category => (
                                    <Pressable
                                        key={category.id}
                                        style={[
                                            styles.categoryButton,
                                            selectedCategory.id === category.id && styles.categoryButtonActive
                                        ]}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setSelectedCategory(category);
                                            setPostType(getPostTypeForCategory(category.id));
                                        }}
                                        disabled={loading}
                                    >
                                        <Ionicons
                                            name={selectedCategory.id === category.id 
                                                ? category.iconActive 
                                                : category.icon}
                                            size={18}
                                            color={selectedCategory.id === category.id ? '#fff' : theme.colors.primary}
                                        />
                                        <Text
                                            style={[
                                                styles.categoryButtonText,
                                                selectedCategory.id === category.id && styles.categoryButtonTextActive,
                                            ]}
                                        >
                                            {category.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                            <Text style={styles.categoryDescription}>{selectedCategory.description}</Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.label}>Title</Text>
                            <TextInput
                                style={styles.titleInput}
                                placeholder={selectedCategory.placeholder.title}
                                placeholderTextColor={theme.colors.textMuted}
                                value={title}
                                onChangeText={setTitle}
                                maxLength={100}
                                editable={!loading}
                            />
                            <Text style={styles.charCount}>{title.length}/100</Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.label}>Details</Text>
                            <TextInput
                                style={styles.contentInput}
                                placeholder={selectedCategory.placeholder.content}
                                placeholderTextColor={theme.colors.textMuted}
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

                        <View style={styles.section}>
                            <View style={styles.anonymousRow}>
                                <View style={styles.anonymousInfo}>
                                    <Ionicons name="eye-off" size={20} color={isAnonymous ? theme.colors.primary : theme.colors.textMuted} />
                                    <View>
                                        <Text style={styles.anonymousLabel}>Post Anonymously</Text>
                                        <Text style={styles.anonymousDescription}>
                                            Your display name is hidden from other members; your account stays linked for
                                            moderation and safety.
                                        </Text>
                                    </View>
                                </View>
                                <Pressable
                                    style={[styles.toggle, isAnonymous && styles.toggleActive]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setIsAnonymous(!isAnonymous);
                                    }}
                                    disabled={loading}
                                >
                                    <View style={[styles.toggleKnob, isAnonymous && styles.toggleKnobActive]} />
                                </Pressable>
                            </View>
                        </View>

                        <View style={styles.guidanceContainer}>
                            <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
                            <Text style={styles.guidanceText}>
                                {isAnonymous 
                                    ? 'Other members will not see your name on this post. GKP Radio may still identify your account for moderation and enforcement.'
                                    : postType === 'prayer'
                                        ? 'Prayer posts invite the community to stand with you through prayer.'
                                        : 'Discussion posts invite public conversation and replies from the community.'
                                }
                            </Text>
                        </View>
                    </ScrollView>

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
                                    colors={[theme.colors.primary, '#059669']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.submitGradient}
                                >
                                    <Ionicons name="send" size={20} color="#fff" />
                                    <Text style={styles.submitText}>
                                        {postType === 'prayer' ? 'Share Prayer' : `Start ${selectedCategory.label}`}
                                    </Text>
                                </LinearGradient>
                            )}
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}

function createNewPostModalStyles(theme: Theme) {
    const guidanceBorder = theme.dark ? 'rgba(16, 185, 129, 0.35)' : '#bbf7d0';

    return StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
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
        borderBottomColor: theme.colors.border,
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
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
        color: theme.colors.text,
        marginBottom: 12,
    },
    postTypeContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    postTypeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.borderLight,
        paddingVertical: 10,
    },
    postTypeButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    postTypeText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textMuted,
    },
    postTypeTextActive: {
        color: '#fff',
    },
    categoryScrollContent: {
        gap: 10,
    },
    categoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: theme.colors.borderLight,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    categoryButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    categoryButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    categoryButtonTextActive: {
        color: '#fff',
    },
    categoryDescription: {
        fontSize: 13,
        color: theme.colors.textMuted,
        marginTop: 12,
        fontStyle: 'italic',
    },
    titleInput: {
        backgroundColor: theme.colors.borderLight,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: theme.colors.text,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    contentInput: {
        backgroundColor: theme.colors.borderLight,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: theme.colors.text,
        minHeight: 160,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    charCount: {
        fontSize: 12,
        color: theme.colors.textMuted,
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
        backgroundColor: theme.colors.primaryLight,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: guidanceBorder,
    },
    guidanceText: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.primary,
        lineHeight: 18,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
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
    anonymousRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.borderLight,
        borderRadius: 12,
        padding: 16,
    },
    anonymousInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    anonymousLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text,
    },
    anonymousDescription: {
        fontSize: 12,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    toggle: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.border,
        padding: 2,
        justifyContent: 'center',
    },
    toggleActive: {
        backgroundColor: theme.colors.primary,
    },
    toggleKnob: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleKnobActive: {
        alignSelf: 'flex-end',
    },
    });
}
