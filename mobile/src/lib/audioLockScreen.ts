import type { AudioPlayer } from 'expo-audio';
import { resolveRadioTrackArtist } from './radioNowPlaying';

export type LockScreenSource = 'radio' | 'episode';

type NowPlayingSnapshot = {
  now_playing?: { song?: { title?: string; artist?: string; art?: string } };
  is_live?: boolean;
} | null;

export type LockScreenOptions = {
  showSeekForward?: boolean;
  showSeekBackward?: boolean;
  /** iOS: LIVE badge, no scrub bar, no seek. Requires patched expo-audio on SDK 54. */
  isLiveStream?: boolean;
};

type LockScreenCapablePlayer = AudioPlayer & {
  setActiveForLockScreen?: (
    active: boolean,
    metadata?: {
      title?: string;
      artist?: string;
      albumTitle?: string;
      artworkUrl?: string;
    },
    options?: LockScreenOptions,
  ) => void;
  updateLockScreenMetadata?: (metadata: {
    title?: string;
    artist?: string;
    albumTitle?: string;
    artworkUrl?: string;
  }) => void;
};

/** True on dev/production builds with expo-audio native lock screen support (not Expo Go). */
export function supportsLockScreenControls(player: AudioPlayer | null | undefined): boolean {
  if (!player) return false;
  return typeof (player as LockScreenCapablePlayer).setActiveForLockScreen === 'function';
}

export function buildLockScreenMetadata(
  nowPlaying: NowPlayingSnapshot,
  episodeTitle?: string | null,
  episodeArt?: string | null,
): {
  title: string;
  artist: string;
  albumTitle: string;
  artworkUrl?: string;
} {
  if (episodeTitle) {
    return {
      title: episodeTitle,
      artist: resolveRadioTrackArtist(null),
      albumTitle: 'GKP Radio · On Demand',
      artworkUrl: episodeArt || undefined,
    };
  }

  const song = nowPlaying?.now_playing?.song;
  return {
    title: song?.title || 'GKP Radio Live',
    artist: resolveRadioTrackArtist(song?.artist),
    albumTitle: 'GKP Radio',
    artworkUrl: song?.art || undefined,
  };
}

export function buildLockScreenOptions(source: LockScreenSource): LockScreenOptions {
  if (source === 'radio') {
    return {
      isLiveStream: true,
      showSeekForward: false,
      showSeekBackward: false,
    };
  }
  return {
    isLiveStream: false,
    showSeekForward: true,
    showSeekBackward: true,
  };
}

export function activateLockScreenControls(
  player: AudioPlayer,
  metadata: ReturnType<typeof buildLockScreenMetadata>,
  source: LockScreenSource,
): void {
  const lockPlayer = player as LockScreenCapablePlayer;
  if (typeof lockPlayer.setActiveForLockScreen !== 'function') {
    return;
  }
  lockPlayer.setActiveForLockScreen(true, metadata, buildLockScreenOptions(source));
}

export function refreshLockScreenMetadata(
  player: AudioPlayer,
  metadata: ReturnType<typeof buildLockScreenMetadata>,
): void {
  const lockPlayer = player as LockScreenCapablePlayer;
  if (typeof lockPlayer.updateLockScreenMetadata !== 'function') {
    return;
  }
  try {
    lockPlayer.updateLockScreenMetadata(metadata);
  } catch {
    // Player may not be active on lock screen yet.
  }
}

export function deactivateLockScreenControls(player: AudioPlayer): void {
  const lockPlayer = player as LockScreenCapablePlayer;
  if (typeof lockPlayer.setActiveForLockScreen !== 'function') {
    return;
  }
  try {
    lockPlayer.setActiveForLockScreen(false);
  } catch {
    // ignore
  }
}
