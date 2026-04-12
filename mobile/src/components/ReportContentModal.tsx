import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  REPORT_REASONS,
  type ReportReasonId,
  buildReportReason,
} from '../constants/reportReasons';
import {
  reportCommunityContent,
  type CommunityReportTarget,
} from '../lib/backend';

export type ReportSubmittedInfo = {
  targetType: CommunityReportTarget;
  targetId: string;
};
import { useTheme, type Theme } from '../contexts/ThemeContext';

const DETAILS_MAX = 500;

export interface ReportContentModalProps {
  visible: boolean;
  onClose: () => void;
  reporterId: string;
  targetType: CommunityReportTarget;
  targetId: string;
  /** Shown under the title (e.g. “Your report is anonymous to other members”). */
  subtitle?: string;
  onSubmitted?: (info: ReportSubmittedInfo) => void;
}

export function ReportContentModal({
  visible,
  onClose,
  reporterId,
  targetType,
  targetId,
  subtitle = 'Reports are reviewed by our team. Other members are not notified who reported.',
  onSubmitted,
}: ReportContentModalProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [selectedId, setSelectedId] = useState<ReportReasonId>(REPORT_REASONS[0].id);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = useCallback(() => {
    setSelectedId(REPORT_REASONS[0].id);
    setDetails('');
    setSubmitting(false);
  }, []);

  useEffect(() => {
    if (!visible) {
      reset();
    }
  }, [visible, reset]);

  const title = targetType === 'post' ? 'Report post' : 'Report comment';

  const handleSubmit = async () => {
    if (!reporterId?.trim() || !targetId?.trim()) {
      Alert.alert('Sign in required', 'Please sign in to submit a report.');
      return;
    }
    setSubmitting(true);
    try {
      await reportCommunityContent({
        reporterId,
        targetType,
        targetId,
        reason: buildReportReason(selectedId, details),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSubmitted?.({ targetType, targetId });
      onClose();
    } catch (e: any) {
      Alert.alert('Could not send report', e?.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.headerBtn} hitSlop={12} accessibilityRole="button">
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={styles.headerBtn} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.subtitle}>{subtitle}</Text>
            <Text style={styles.sectionLabel}>Why are you reporting this?</Text>

            {REPORT_REASONS.map((item) => {
              const selected = item.id === selectedId;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedId(item.id);
                  }}
                  style={[styles.reasonRow, selected && styles.reasonRowSelected]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                    {selected ? <View style={styles.radioInner} /> : null}
                  </View>
                  <View style={styles.reasonTextWrap}>
                    <Text style={[styles.reasonLabel, selected && styles.reasonLabelSelected]}>
                      {item.label}
                    </Text>
                    <Text style={styles.reasonDescription}>{item.description}</Text>
                  </View>
                </Pressable>
              );
            })}

            <Text style={styles.sectionLabel}>Additional details (optional)</Text>
            <TextInput
              style={styles.detailsInput}
              placeholder="Add context to help our reviewers…"
              placeholderTextColor={theme.colors.textMuted}
              value={details}
              onChangeText={(t) => setDetails(t.slice(0, DETAILS_MAX))}
              multiline
              maxLength={DETAILS_MAX}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {details.length}/{DETAILS_MAX}
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Submit report</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    flex: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    headerBtn: {
      minWidth: 72,
      paddingVertical: 8,
      paddingHorizontal: 8,
    },
    cancelText: {
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.colors.text,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.textSecondary,
      marginTop: 8,
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 10,
      marginTop: 8,
    },
    reasonRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 10,
      backgroundColor: theme.colors.surface,
    },
    reasonRowSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.dark ? theme.colors.surfaceSecondary : theme.colors.primaryLight,
    },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: theme.colors.border,
      marginRight: 12,
      marginTop: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOuterSelected: {
      borderColor: theme.colors.primary,
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.primary,
    },
    reasonTextWrap: {
      flex: 1,
    },
    reasonLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    reasonLabelSelected: {
      color: theme.colors.text,
    },
    reasonDescription: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.textMuted,
      marginTop: 4,
    },
    detailsInput: {
      minHeight: 100,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
    },
    charCount: {
      fontSize: 12,
      color: theme.colors.textMuted,
      textAlign: 'right',
      marginTop: 6,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    submitBtn: {
      backgroundColor: theme.colors.error,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitBtnDisabled: {
      opacity: 0.7,
    },
    submitText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
