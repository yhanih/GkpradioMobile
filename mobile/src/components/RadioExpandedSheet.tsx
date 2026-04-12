import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Share,
  Alert,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAudio } from '../contexts/AudioContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchRadioQueueInfo } from '../lib/backend';
import { supabase } from '../lib/supabase';

const { width: SCREEN_W } = Dimensions.get('window');
const ART_SIZE = Math.min(Math.round(SCREEN_W * 0.72), 320);

const LIVE_CHAT_ROOM_ID = (() => {
  const raw = process.env.EXPO_PUBLIC_LIVE_CHAT_ROOM_ID as string | undefined;
  const t = typeof raw === 'string' ? raw.trim() : '';
  return t.length > 0 ? t : 'gkp_radio_main';
})();

const C = {
  bg: '#0c0c0e',
  overlay: ['rgba(12,12,14,0.88)', 'rgba(5,5,8,0.96)'] as const,
  text: '#ffffff',
  textMuted: 'rgba(255,255,255,0.55)',
  textDim: 'rgba(255,255,255,0.38)',
  line: 'rgba(255,255,255,0.12)',
  pill: 'rgba(255,255,255,0.14)',
};

type LiveRadioMessageRow = {
  id: string;
  room_id: string;
  author_id: string | null;
  display_name: string;
  body: string;
  created_at: string;
};

type ChatMessage = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  isMine: boolean;
};

function mapRow(row: LiveRadioMessageRow, currentUserId?: string): ChatMessage {
  return {
    id: row.id,
    author: row.display_name || 'Listener',
    body: row.body,
    createdAt: row.created_at,
    isMine: Boolean(currentUserId && row.author_id === currentUserId),
  };
}

function formatChatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 60_000) return 'Just now';
    if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
    if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

export interface RadioExpandedSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function RadioExpandedSheet({ visible, onClose }: RadioExpandedSheetProps) {
  const styles = useMemo(() => createStyles(), []);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const pullDismissArmedRef = useRef(false);
  const { isPlaying, isLoading, nowPlaying, togglePlayback } = useAudio();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setMessages([]);
      setDraft('');
      setChatError(null);
      setChatLoading(false);
      setSending(false);
      setQueueLoading(false);
      pullDismissArmedRef.current = false;
    }
  }, [visible]);

  const closeSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  const panDownToClose = useMemo(
    () =>
      Gesture.Pan().onEnd((e) => {
        const { translationX, translationY, velocityY } = e;
        const mostlyDown = translationY > Math.abs(translationX) * 0.65;
        if (mostlyDown && (translationY > 72 || (velocityY > 650 && translationY > 28))) {
          runOnJS(closeSheet)();
        }
      }),
    [closeSheet]
  );

  const handleScrollPullToClose = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      if (y < -56) {
        if (!pullDismissArmedRef.current) {
          pullDismissArmedRef.current = true;
          closeSheet();
        }
      } else if (y >= -6) {
        pullDismissArmedRef.current = false;
      }
    },
    [closeSheet]
  );

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;

    (async () => {
      setChatLoading(true);
      setChatError(null);
      const { data, error } = await supabase
        .from('live_radio_messages')
        .select('id, room_id, author_id, display_name, body, created_at')
        .eq('room_id', LIVE_CHAT_ROOM_ID)
        .order('created_at', { ascending: true })
        .limit(120);

      if (cancelled) return;
      if (error) {
        setChatError(error.message);
        setMessages([]);
      } else {
        setMessages((data ?? []).map((row) => mapRow(row as LiveRadioMessageRow, user?.id)));
      }
      setChatLoading(false);
    })();

    const channel = supabase
      .channel(`live_radio:${LIVE_CHAT_ROOM_ID}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_radio_messages',
          filter: `room_id=eq.${LIVE_CHAT_ROOM_ID}`,
        },
        (payload) => {
          const row = payload.new as LiveRadioMessageRow;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, mapRow(row, user?.id)];
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [visible, user?.id]);

  useEffect(() => {
    if (!visible || messages.length === 0) return;
    const id = requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(id);
  }, [messages.length, visible]);

  const song = nowPlaying?.now_playing?.song;
  const hasArt = Boolean(song?.art && song.art.trim() !== '');
  const title = song?.title || 'Kingdom Principles Radio';
  const artist = song?.artist || 'Live stream';

  const handleShare = useCallback(async () => {
    Haptics.selectionAsync();
    try {
      await Share.share({ message: `${title} — ${artist}\nGKP Radio`, title });
    } catch {
      /* ignore */
    }
  }, [artist, title]);

  const handleSend = useCallback(async () => {
    const t = draft.trim();
    if (!t || sending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSending(true);
    const {
      data: { session },
      error: sessionErr,
    } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (sessionErr || !uid) {
      setSending(false);
      Alert.alert(
        'Sign in required',
        sessionErr?.message ?? 'Your session expired. Sign in again to use live chat.'
      );
      return;
    }
    const { error } = await supabase.from('live_radio_messages').insert({
      room_id: LIVE_CHAT_ROOM_ID,
      author_id: uid,
      display_name: user?.fullname || session.user.email?.split('@')[0] || 'You',
      body: t,
    });
    setSending(false);
    if (error) {
      Alert.alert('Message not sent', error.message);
      return;
    }
    setDraft('');
  }, [draft, user, sending]);

  const openQueue = useCallback(async () => {
    Haptics.selectionAsync();
    setQueueLoading(true);
    const info = await fetchRadioQueueInfo();
    setQueueLoading(false);
    if (!info) {
      Alert.alert(
        'Station queue',
        'Couldn’t load queue info. Check your connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }
    const parts: string[] = [];
    if (info.upNext) {
      parts.push(`Up next\n${info.upNext.title} — ${info.upNext.artist || 'GKP Radio'}`);
    } else {
      parts.push(
        'Up next isn’t published for this stream right now. It usually appears when AutoDJ schedules the following track.'
      );
    }
    if (info.recent.length > 0) {
      parts.push(
        '\nRecently played\n' +
          info.recent.map((r, i) => `${i + 1}. ${r.title} — ${r.artist || 'GKP Radio'}`).join('\n')
      );
    }
    Alert.alert('Station queue', parts.join('\n'), [{ text: 'OK' }], { userInterfaceStyle: 'dark' });
  }, []);

  const retryLoadChat = useCallback(() => {
    if (!visible) return;
    setChatError(null);
    setChatLoading(true);
    void (async () => {
      const { data, error } = await supabase
        .from('live_radio_messages')
        .select('id, room_id, author_id, display_name, body, created_at')
        .eq('room_id', LIVE_CHAT_ROOM_ID)
        .order('created_at', { ascending: true })
        .limit(120);
      if (error) {
        setChatError(error.message);
        setMessages([]);
      } else {
        setMessages((data ?? []).map((row) => mapRow(row as LiveRadioMessageRow, user?.id)));
      }
      setChatLoading(false);
    })();
  }, [visible, user?.id]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={closeSheet}
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
        <View style={styles.root}>
        {hasArt ? (
          <>
            <Image
              source={{ uri: song!.art }}
              style={styles.bgBlur}
              blurRadius={50}
            />
            <LinearGradient colors={C.overlay} style={StyleSheet.absoluteFill} />
          </>
        ) : (
          <LinearGradient colors={['#1a2e24', '#0a0f0c', C.bg]} style={StyleSheet.absoluteFill} />
        )}

        <SafeAreaView style={styles.safe} edges={['top']}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 6 : 0}
          >
            <View style={styles.topChrome}>
              <Pressable
                onPress={closeSheet}
                style={styles.topChromeSide}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Done"
              >
                <Text style={styles.doneLabel}>Done</Text>
              </Pressable>
              <GestureDetector gesture={panDownToClose}>
                <View
                  style={styles.dragHandleHit}
                  accessibilityLabel="Drag handle"
                  accessibilityHint="Swipe down to close the player"
                >
                  <View style={styles.dragHandle} />
                </View>
              </GestureDetector>
              <Pressable
                onPress={closeSheet}
                style={styles.topChromeSide}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={28} color={C.text} />
              </Pressable>
            </View>

            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              bounces
              overScrollMode="always"
              onScroll={handleScrollPullToClose}
            >
              <View style={styles.heroArtWrap}>
                {hasArt ? (
                  <Image source={{ uri: song!.art }} style={styles.heroArt} />
                ) : (
                  <LinearGradient colors={['#047857', '#064e3b']} style={styles.heroArt}>
                    <Ionicons name="radio" size={Math.round(ART_SIZE * 0.22)} color="#fff" />
                  </LinearGradient>
                )}
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaTextCol}>
                  <Text style={styles.title} numberOfLines={2}>
                    {title}
                  </Text>
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {artist}
                  </Text>
                </View>
                <View style={styles.metaActions}>
                  <Pressable
                    style={styles.iconPill}
                    onPress={handleShare}
                    accessibilityRole="button"
                    accessibilityLabel="Share"
                  >
                    <Ionicons name="share-outline" size={22} color={C.text} />
                  </Pressable>
                  <Pressable
                    style={styles.iconPill}
                    onPress={() => void openQueue()}
                    disabled={queueLoading}
                    accessibilityRole="button"
                    accessibilityLabel="Station queue and recently played"
                  >
                    {queueLoading ? (
                      <ActivityIndicator color={C.text} size="small" />
                    ) : (
                      <Ionicons name="list-outline" size={22} color={C.text} />
                    )}
                  </Pressable>
                </View>
              </View>

              <View style={styles.liveRule}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.45)']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.fadeLine}
                />
                <Text style={styles.liveRuleLabel}>LIVE</Text>
                <LinearGradient
                  colors={['rgba(255,255,255,0.45)', 'transparent']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.fadeLine}
                />
              </View>

              <View style={styles.transportRow}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.45)']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.fadeLine}
                />
                <Pressable
                  style={styles.transport}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    togglePlayback();
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#0a0a0a" />
                  ) : (
                    <Ionicons name={isPlaying ? 'pause' : 'play'} size={34} color="#0a0a0a" />
                  )}
                </Pressable>
                <LinearGradient
                  colors={['rgba(255,255,255,0.45)', 'transparent']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.fadeLine}
                />
              </View>

              <View style={styles.chatSection}>
                <View style={styles.chatPanel}>
                  <View style={styles.chatPanelHeader}>
                    <View>
                      <Text style={styles.chatSectionTitle}>Live chat</Text>
                      <Text style={styles.chatHint}>
                        {user
                          ? 'Everyone listening can read messages. Keep it encouraging.'
                          : 'Sign in to join the conversation.'}
                      </Text>
                    </View>
                  </View>

                  {chatError ? (
                    <View style={styles.chatErrorBox}>
                      <Text style={styles.chatErrorText}>Couldn’t load messages.</Text>
                      <Pressable onPress={retryLoadChat} style={styles.retryBtn} accessibilityRole="button">
                        <Text style={styles.retryBtnLabel}>Try again</Text>
                      </Pressable>
                    </View>
                  ) : null}

                  {chatLoading ? (
                    <View style={styles.chatLoadingRow}>
                      <ActivityIndicator color={C.textMuted} />
                      <Text style={styles.chatLoadingLabel}>Loading chat…</Text>
                    </View>
                  ) : null}

                  {!chatLoading && !chatError && messages.length === 0 ? (
                    <View style={styles.emptyChat}>
                      <Ionicons name="chatbubble-ellipses-outline" size={36} color={C.textDim} />
                      <Text style={styles.emptyChatTitle}>No messages yet</Text>
                      <Text style={styles.emptyChatSub}>Be the first to say hello.</Text>
                    </View>
                  ) : null}

                  {!chatLoading &&
                    messages.map((m) => (
                      <View
                        key={m.id}
                        style={[styles.bubbleRow, m.isMine ? styles.bubbleRowUser : styles.bubbleRowPeer]}
                      >
                        <Text
                          style={[
                            styles.bubbleAuthor,
                            m.isMine ? styles.bubbleAuthorUser : styles.bubbleAuthorPeer,
                          ]}
                        >
                          {m.isMine ? 'You' : m.author}
                        </Text>
                        <View style={[styles.bubble, m.isMine ? styles.bubbleUser : styles.bubblePeer]}>
                          <Text style={styles.bubbleText}>{m.body}</Text>
                          <Text style={styles.bubbleTime}>{formatChatTimestamp(m.createdAt)}</Text>
                        </View>
                      </View>
                    ))}
                </View>
              </View>
              <View style={{ height: 24 }} />
            </ScrollView>

            <View style={[styles.composer, { paddingBottom: 10 + insets.bottom }]}>
              {!user ? (
                <Text style={styles.composerDisabled}>Sign in to send a message.</Text>
              ) : null}
              <View style={styles.composerPill}>
                <TextInput
                  style={styles.input}
                  placeholder={user ? 'Message the room…' : 'Sign in to type…'}
                  placeholderTextColor={C.textDim}
                  value={draft}
                  onChangeText={setDraft}
                  editable={Boolean(user) && !sending}
                  maxLength={280}
                  multiline
                />
                <Pressable
                  style={[styles.sendBtn, (!user || !draft.trim() || sending) && styles.sendBtnDisabled]}
                  onPress={() => void handleSend()}
                  disabled={!user || !draft.trim() || sending}
                >
                  {sending ? (
                    <ActivityIndicator color="#0a0a0a" size="small" />
                  ) : (
                    <Ionicons name="arrow-up" size={22} color="#0a0a0a" />
                  )}
                </Pressable>
              </View>
              {user ? (
                <Text style={styles.charCount}>{draft.length}/280</Text>
              ) : null}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function createStyles() {
  return StyleSheet.create({
    gestureRoot: {
      flex: 1,
    },
    root: {
      flex: 1,
      backgroundColor: C.bg,
    },
    bgBlur: {
      ...StyleSheet.absoluteFillObject,
      transform: [{ scale: 1.15 }],
    },
    safe: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    flex: {
      flex: 1,
    },
    topChrome: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 4,
      paddingBottom: 6,
      paddingHorizontal: 6,
      minHeight: 48,
    },
    topChromeSide: {
      minWidth: 56,
      minHeight: 44,
      paddingHorizontal: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    doneLabel: {
      fontSize: 17,
      fontWeight: '600',
      color: C.text,
    },
    dragHandleHit: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      maxHeight: 52,
    },
    dragHandle: {
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: 'rgba(255,255,255,0.22)',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 22,
      paddingBottom: 8,
    },
    heroArtWrap: {
      alignItems: 'center',
      marginTop: 4,
    },
    heroArt: {
      width: ART_SIZE,
      height: ART_SIZE,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.45,
      shadowRadius: 28,
      elevation: 16,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: 28,
      gap: 12,
    },
    metaTextCol: {
      flex: 1,
      paddingRight: 4,
    },
    metaActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 2,
    },
    iconPill: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: C.pill,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: C.text,
      letterSpacing: -0.3,
      lineHeight: 32,
    },
    subtitle: {
      marginTop: 6,
      fontSize: 17,
      fontWeight: '400',
      color: C.textMuted,
    },
    liveRule: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 36,
      gap: 10,
    },
    liveRuleLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.55)',
      letterSpacing: 2,
    },
    transportRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
      gap: 14,
    },
    fadeLine: {
      flex: 1,
      height: 3,
      borderRadius: 1.5,
    },
    transport: {
      width: 76,
      height: 76,
      borderRadius: 18,
      backgroundColor: '#ffffff',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 12,
    },
    chatSection: {
      marginTop: 36,
    },
    chatPanel: {
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 20,
      backgroundColor: 'rgba(255,255,255,0.035)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.07)',
    },
    chatPanelHeader: {
      marginBottom: 14,
    },
    chatSectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.45)',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      marginBottom: 6,
    },
    chatHint: {
      fontSize: 12,
      lineHeight: 17,
      color: C.textDim,
    },
    chatLoadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 20,
      justifyContent: 'center',
    },
    chatLoadingLabel: {
      fontSize: 14,
      color: C.textMuted,
    },
    chatErrorBox: {
      paddingVertical: 12,
      alignItems: 'center',
      gap: 10,
    },
    chatErrorText: {
      fontSize: 14,
      color: 'rgba(251, 191, 36, 0.95)',
      textAlign: 'center',
    },
    retryBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    retryBtnLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: C.text,
    },
    emptyChat: {
      alignItems: 'center',
      paddingVertical: 28,
      paddingHorizontal: 12,
    },
    emptyChatTitle: {
      marginTop: 12,
      fontSize: 17,
      fontWeight: '600',
      color: C.textMuted,
    },
    emptyChatSub: {
      marginTop: 6,
      fontSize: 14,
      color: C.textDim,
      textAlign: 'center',
    },
    bubbleRow: {
      marginBottom: 16,
    },
    bubbleRowPeer: {
      alignItems: 'flex-start',
    },
    bubbleRowUser: {
      alignItems: 'flex-end',
    },
    bubbleAuthor: {
      fontSize: 11,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.42)',
      marginBottom: 5,
    },
    bubbleAuthorPeer: {
      marginLeft: 4,
      alignSelf: 'flex-start',
    },
    bubbleAuthorUser: {
      marginRight: 4,
      alignSelf: 'flex-end',
    },
    bubble: {
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      maxWidth: '88%',
    },
    bubblePeer: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    bubbleUser: {
      alignSelf: 'flex-end',
      backgroundColor: 'rgba(52, 211, 153, 0.22)',
    },
    bubbleText: {
      fontSize: 16,
      lineHeight: 22,
      color: C.text,
      letterSpacing: -0.2,
    },
    bubbleTime: {
      marginTop: 8,
      fontSize: 11,
      color: C.textDim,
      alignSelf: 'flex-end',
    },
    composer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: 'rgba(255,255,255,0.08)',
      paddingHorizontal: 22,
      paddingTop: 10,
      backgroundColor: 'transparent',
    },
    composerDisabled: {
      fontSize: 12,
      color: C.textDim,
      marginBottom: 10,
      textAlign: 'center',
    },
    composerPill: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: 26,
      paddingLeft: 16,
      paddingRight: 6,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 100,
      paddingVertical: 8,
      paddingRight: 8,
      fontSize: 16,
      lineHeight: 21,
      color: C.text,
      backgroundColor: 'transparent',
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#ffffff',
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendBtnDisabled: {
      opacity: 0.28,
    },
    charCount: {
      marginTop: 6,
      alignSelf: 'stretch',
      textAlign: 'right',
      paddingRight: 10,
      fontSize: 11,
      color: C.textDim,
    },
  });
}
