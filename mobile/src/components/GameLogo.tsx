import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleProp, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { SvgXml } from 'react-native-svg';

interface GameLogoProps {
  uri: string;
  size: number;
  style?: StyleProp<ViewStyle>;
  borderColor?: string;
  fallbackColor?: string;
}

export function GameLogo({ uri, size, style, borderColor, fallbackColor }: GameLogoProps) {
  const [svgXml, setSvgXml] = useState<string | null>(null);
  const [loadingSvg, setLoadingSvg] = useState(false);
  const isSvg = uri.toLowerCase().includes('.svg');

  useEffect(() => {
    if (!isSvg) {
      setSvgXml(null);
      return;
    }

    let cancelled = false;
    setLoadingSvg(true);

    fetch(uri)
      .then((response) => (response.ok ? response.text() : Promise.reject(new Error('logo fetch failed'))))
      .then((xml) => {
        if (!cancelled) {
          setSvgXml(xml);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSvgXml(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingSvg(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [uri, isSvg]);

  const frameStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderColor ? 1.5 : 0,
    borderColor: borderColor ?? 'transparent',
    backgroundColor: fallbackColor ?? 'transparent',
  };

  if (isSvg) {
    return (
      <View style={[frameStyle, style]}>
        {loadingSvg || !svgXml ? (
          <ActivityIndicator size="small" color={borderColor ?? '#4ade80'} />
        ) : (
          <SvgXml xml={svgXml} width={size} height={size} />
        )}
      </View>
    );
  }

  return (
    <View style={[frameStyle, style]}>
      <Image
        source={{ uri }}
        style={{ width: size, height: size }}
        contentFit="cover"
        transition={200}
      />
    </View>
  );
}
