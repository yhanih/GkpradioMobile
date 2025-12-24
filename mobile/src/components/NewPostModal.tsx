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
import { getPostableCategories, Category, getCategoryLabel } from '../constants/categories';

interface NewPostModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NewPostModal({ visible, onClose, onSuccess }: NewPostModalProps) {
    const { user } = useAuth();
    const categories = getPostableCategories();
    const [selectedCategory, setSelectedCategory] = useState<Category>(categories[0]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setSelectedCategory(categories[0]);
        setTitle('');
        setContent('');
        setIsAnonymous(false);
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
                category: selectedCategory.id,
                privacy_level: 'public',
                is_anonymous: isAnonymous,
            });

            if (error) throw error;

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Success will be shown via toast from parent component

            resetForm();
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating post:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            throw error; // Let parent handle error display
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
                    <View style={styles.header}>
                        <Pressable onPress={handleClose} style={styles.closeButton} disabled={loading}>
                            <Ionicons name="close" size={28} color="#09090b" />
                        </Pressable>
                        <Text style={styles.headerTitle}>New Post</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
                                        }}
                                        disabled={loading}
                                    >
                                        <Ionicons
                                            name={selectedCategory.id === category.id 
                                                ? category.iconActive 
                                                : category.icon}
                                            size={18}
                                            color={selectedCategory.id === category.id ? '#fff' : '#047857'}
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
                                placeholderTextColor="#a1a1aa"
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

                        <View style={styles.section}>
                            <View style={styles.anonymousRow}>
                                <View style={styles.anonymousInfo}>
                                    <Ionicons name="eye-off" size={20} color={isAnonymous ? '#047857' : '#71717a'} />
                                    <View>
                                        <Text style={styles.anonymousLabel}>Post Anonymously</Text>
                                        <Text style={styles.anonymousDescription}>
                                            Your name will be hidden from other users
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
                            <Ionicons name="information-circle" size={20} color="#047857" />
                            <Text style={styles.guidanceText}>
                                {isAnonymous 
                                    ? 'Your post will be shared anonymously. Your identity will remain private.'
                                    : 'Your post will be visible to the community. Others can interact, support, and pray with you.'
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
                                    colors={['#047857', '#059669']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.submitGradient}
                                >
                                    <Ionicons name="send" size={20} color="#fff" />
                                    <Text style={styles.submitText}>Post {selectedCategory.label}</Text>
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
        backgroundColor: '#f4f4f5',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    categoryButtonActive: {
        backgroundColor: '#047857',
        borderColor: '#047857',
    },
    categoryButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#047857',
    },
    categoryButtonTextActive: {
        color: '#fff',
    },
    categoryDescription: {
        fontSize: 13,
        color: '#71717a',
        marginTop: 12,
        fontStyle: 'italic',
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
    anonymousRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f4f4f5',
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
        color: '#09090b',
    },
    anonymousDescription: {
        fontSize: 12,
        color: '#71717a',
        marginTop: 2,
    },
    toggle: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#e4e4e7',
        padding: 2,
        justifyContent: 'center',
    },
    toggleActive: {
        backgroundColor: '#047857',
    },
    toggleKnob: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
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
