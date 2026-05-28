import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types/navigation';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { GameLogo } from '../components/GameLogo';
import {
  GKP_GAMES,
  GKP_GAMES_BRAND_LOGO_URL,
  fetchGameLeaderboard,
  formatGameScore,
  resolveGamePlayerName,
  type GkpGameId,
  type GkpGameMeta,
  type LeaderboardEntry,
} from '../lib/games';
import { openGamesBrowser } from '../lib/openGamesBrowser';

type GamesNavProp = NativeStackNavigationProp<RootStackParamList>;

function GameCard({
  game,
  leaderboard,
  loadingLeaderboard,
  opening,
  onPlay,
  theme,
  isDark,
}: {
  game: GkpGameMeta;
  leaderboard: LeaderboardEntry[];
  loadingLeaderboard: boolean;
  opening: boolean;
  onPlay: () => void;
  theme: ReturnType<typeof useTheme>['theme'];
  isDark: boolean;
}) {
  return (
    <View
      style={[
        styles.gameCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: `${game.color}44`,
        },
      ]}
    >
      <View style={styles.gameCardHeader}>
        <GameLogo
          uri={game.logoUrl}
          size={64}
          borderColor={`${game.color}66`}
          fallbackColor={`${game.color}11`}
        />
        <View style={styles.gameCardText}>
          <Text style={[styles.gameName, { color: theme.colors.text }]}>{game.name}</Text>
          <Text style={[styles.gameDescription, { color: theme.colors.textSecondary }]}>
            {game.description}
          </Text>
        </View>
      </View>

      <AnimatedPressable
        onPress={onPlay}
        disabled={opening}
        style={[
          styles.playButton,
          { backgroundColor: game.color, opacity: opening ? 0.7 : 1 },
        ]}
      >
        {opening ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="play" size={16} color="#fff" />
            <Text style={styles.playButtonText}>Play Now</Text>
          </>
        )}
      </AnimatedPressable>

      <View style={[styles.leaderboardBox, { backgroundColor: theme.colors.surfaceSecondary }]}>
        <Text style={[styles.leaderboardTitle, { color: theme.colors.textMuted }]}>
          TOP SCORES
        </Text>
        {loadingLeaderboard ? (
          <ActivityIndicator color={game.color} style={styles.leaderboardLoader} />
        ) : leaderboard.length === 0 ? (
          <Text style={[styles.leaderboardEmpty, { color: theme.colors.textMuted }]}>
            Be the first on the leaderboard!
          </Text>
        ) : (
          leaderboard.slice(0, 3).map((entry, index) => (
            <View key={`${entry.player_name}-${entry.created_at}-${index}`} style={styles.leaderboardRow}>
              <Text style={[styles.leaderboardRank, { color: game.color }]}>{index + 1}</Text>
              <Text
                style={[styles.leaderboardName, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {entry.player_name}
              </Text>
              <Text style={[styles.leaderboardScore, { color: isDark ? '#fafafa' : '#18181b' }]}>
                {formatGameScore(entry.score)}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

export function GamesScreen() {
  const navigation = useNavigation<GamesNavProp>();
  const showBackButton = navigation.canGoBack();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const gamePlayerName = resolveGamePlayerName(user);
  const [leaderboards, setLeaderboards] = useState<Record<GkpGameId, LeaderboardEntry[]>>({
    'righteous-quest': [],
    'word-search': [],
    crossword: [],
  });
  const [loadingLeaderboards, setLoadingLeaderboards] = useState(true);
  const [openingGameId, setOpeningGameId] = useState<GkpGameId | 'all' | null>(null);

  const loadLeaderboards = useCallback(async () => {
    setLoadingLeaderboards(true);
    try {
      const results = await Promise.all(
        GKP_GAMES.map(async (game) => {
          const entries = await fetchGameLeaderboard(game.id, 5);
          return [game.id, entries] as const;
        }),
      );
      setLeaderboards(Object.fromEntries(results) as Record<GkpGameId, LeaderboardEntry[]>);
    } finally {
      setLoadingLeaderboards(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboards();
  }, [loadLeaderboards]);

  const handlePlay = async (gameId?: GkpGameId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOpeningGameId(gameId ?? 'all');
    try {
      await openGamesBrowser(gameId, gamePlayerName);
      await loadLeaderboards();
    } catch {
      Alert.alert(
        'Could not open games',
        'We could not open GKP Bible Games in your browser. Please try again.',
      );
    } finally {
      setOpeningGameId(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        {showBackButton ? (
          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              { backgroundColor: theme.colors.surface },
              pressed && styles.headerButtonPressed,
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              navigation.goBack();
            }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Bible Games</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={isDark ? ['#064e3b', '#09090b'] : ['#ecfdf5', theme.colors.background]}
          style={styles.hero}
        >
          <GameLogo
            uri={GKP_GAMES_BRAND_LOGO_URL}
            size={96}
            borderColor={`${theme.colors.primary}66`}
            style={styles.heroLogo}
          />
          <Text style={[styles.heroTitle, { color: theme.colors.text }]}>GKP Bible Games</Text>
          <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>
            {gamePlayerName
              ? `Playing as ${gamePlayerName} — scores sync to the website leaderboard.`
              : 'Play on the same leaderboards as the website. Scores sync automatically.'}
          </Text>
          <AnimatedPressable
            onPress={() => handlePlay()}
            disabled={openingGameId !== null}
            style={[styles.heroButton, { backgroundColor: theme.colors.primary }]}
          >
            {openingGameId === 'all' ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="globe-outline" size={18} color="#fff" />
                <Text style={styles.heroButtonText}>Browse All Games</Text>
              </>
            )}
          </AnimatedPressable>
        </LinearGradient>

        {GKP_GAMES.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            leaderboard={leaderboards[game.id]}
            loadingLeaderboard={loadingLeaderboards}
            opening={openingGameId === game.id}
            onPlay={() => handlePlay(game.id)}
            theme={theme}
            isDark={isDark}
          />
        ))}

        <Text style={[styles.footerNote, { color: theme.colors.textMuted }]}>
          Games open in a secure in-app browser — the same experience as godkingdomprinciplesradio.com/games.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonPressed: {
    opacity: 0.7,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  hero: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  heroLogo: {
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  heroButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  gameCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  gameCardHeader: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
    alignItems: 'center',
  },
  gameCardText: {
    flex: 1,
  },
  gameName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  leaderboardBox: {
    borderRadius: 10,
    padding: 12,
  },
  leaderboardTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  leaderboardLoader: {
    marginVertical: 8,
  },
  leaderboardEmpty: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  leaderboardRank: {
    width: 18,
    fontSize: 13,
    fontWeight: '800',
  },
  leaderboardName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  leaderboardScore: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  footerNote: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 8,
  },
});
