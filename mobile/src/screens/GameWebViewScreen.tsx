import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../types/navigation';

type GameWebViewRoute = RouteProp<RootStackParamList, 'GameWebView'>;
type GameWebViewNav = NativeStackNavigationProp<RootStackParamList, 'GameWebView'>;

export function GameWebViewScreen() {
  const navigation = useNavigation<GameWebViewNav>();
  const route = useRoute<GameWebViewRoute>();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [isNavigatingAway, setIsNavigatingAway] = useState(false);
  const isFocused = useIsFocused();

  const { url, title, returnTab = 'Live', hideHeader } = route.params;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const returnLabel = returnTab === 'Home' ? 'Back to Home' : 'Return to Radio';
  const returnIcon = returnTab === 'Home' ? 'home' : 'radio';
  const isGame = useMemo(() => url.includes('/games'), [url]);

  const HIDE_HEADER_SCRIPT = `
    (function() {
      // Injected CSS to hide all header/footer elements, sidebar, and page titles
      var css = 'header, footer, nav, [role="banner"], [role="contentinfo"], ' +
                '.site-header, .site-footer, #masthead, .navigation, #header, #footer, ' +
                '.navbar, .floating-navbar-container, .floating-navbar, .navbar-header, ' +
                '.elementor-header, .elementor-footer, .header-main, #logo, .logo, ' +
                '.app-layout > nav, .glass, ' +
                '.entry-header, .entry-title, .page-title, h1.entry-title, h1.page-title, ' +
                '.title-section, .post-title, .entry-meta, .sidebar, #sidebar, .widget-area { ' +
                '  display: none !important; ' +
                '}';
      
      // Force page background to a deep dark purple matching the game card (#0a0514)
      css += ' body, html { ' +
             '   padding: 0 !important; margin: 0 !important; ' +
             '   background: #0a0514 !important; ' +
             '   background-color: #0a0514 !important; ' +
             '   background-image: none !important; ' +
             '   width: 100% !important; ' +
             '   height: 100% !important; ' +
             ' }';
             
      // Disable flexbox/grid centering on all layout wrappers so nested elements stretch full width
      css += ' #root, main, .app-layout, #__next, .min-h-screen, ' +
             ' #page, #content, .site-content, #primary, #main, .site-main, ' +
             ' article, .entry-content, .post-content, .page-content { ' +
             '   display: block !important; ' +
             '   width: 100% !important; ' +
             '   max-width: 100% !important; ' +
             '   padding: 0 !important; ' +
             '   margin: 0 !important; ' +
             '   border: none !important; ' +
             '   box-shadow: none !important; ' +
             '   border-radius: 0 !important; ' +
             '   background: transparent !important; ' +
             '   background-color: transparent !important; ' +
             '   background-image: none !important; ' +
             ' }';
             
      // Force high-level wrappers to fill the screen width
      css += ' #root > div, #root > div > div, main > div, main > div > div, ' +
             ' .app-layout > div, .app-layout > div > div, #__next > div, #__next > div > div, ' +
             ' .entry-content > div, .entry-content > div > div { ' +
             '   width: 100% !important; ' +
             '   max-width: 100% !important; ' +
             '   margin: 0 !important; ' +
             '   padding: 0 !important; ' +
             ' }';
             
      // Force all layout divs to be transparent to reveal the body background, 
      // excluding the game card, level buttons, and actual buttons.
      css += ' div:not(.game-card):not([class*="card"]):not([class*="game"]):not([class*="quest"]):not([class*="btn"]):not([class*="button"]):not(button) { ' +
             '   background: transparent !important; ' +
             '   background-image: none !important; ' +
             '   background-color: transparent !important; ' +
             ' }';
             
      // Remove border, shadow, and background from the game card to let it blend in
      css += ' .game-card, [class*="game-card"], [class*="card"], [class*="game-container"], #game-container, #game-canvas { ' +
             '   width: 100% !important; ' +
             '   max-width: 100% !important; ' +
             '   margin: 0 !important; ' +
             '   padding: 16px !important; ' +
             '   border: none !important; ' +
             '   border-radius: 0 !important; ' +
             '   box-shadow: none !important; ' +
             '   background: transparent !important; ' +
             '   background-color: transparent !important; ' +
             ' }';
             
      css += ' canvas, iframe { ' +
             '   width: 100% !important; ' +
             '   max-width: 100% !important; ' +
             '   border: none !important; ' +
             ' }';
      
      var style = document.createElement('style');
      style.type = 'text/css';
      style.appendChild(document.createTextNode(css));
      
      var inject = function() {
        var parent = document.head || document.documentElement || document.body;
        if (parent && !style.parentNode) {
          parent.appendChild(style);
        }
      };
      
      inject();
      
      // Reinject on DOMContentLoaded and window load to be absolutely sure
      document.addEventListener('DOMContentLoaded', inject);
      window.addEventListener('load', inject);
      
      // Also clean up inline styles on div elements
      var cleanDivs = function() {
        var divs = document.querySelectorAll('div');
        divs.forEach(function(div) {
          var styleAttr = div.getAttribute('style') || '';
          if (styleAttr.indexOf('padding-top') !== -1 || styleAttr.indexOf('paddingTop') !== -1) {
            div.style.paddingTop = '0px';
          }
        });
      };
      
      document.addEventListener('DOMContentLoaded', cleanDivs);
      window.addEventListener('load', cleanDivs);
      
      var interval = setInterval(function() {
        inject();
        cleanDivs();
      }, 150);
      
      setTimeout(function() {
        clearInterval(interval);
      }, 5000);
    })();
    true;
  `;

  const handleReturn = () => {
    setIsNavigatingAway(true);
    setTimeout(() => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('MainTabs', { screen: returnTab });
      }
    }, 50);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isGame ? '#0a0514' : theme.colors.background }]} edges={['top']}>
      {isGame && <StatusBar barStyle="light-content" />}
      <View 
        style={[
          styles.toolbar, 
          { 
            borderBottomColor: isGame ? 'transparent' : theme.colors.border, 
            backgroundColor: isGame ? '#0a0514' : theme.colors.surface 
          }
        ]}
      >
        <Pressable
          onPress={handleReturn}
          style={({ pressed }) => [styles.returnButton, pressed && styles.returnButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel={returnLabel}
        >
          <Ionicons name={returnIcon} size={20} color="#fff" />
          <Text style={styles.returnButtonText}>{returnLabel}</Text>
        </Pressable>
        {title ? (
          <Text style={[styles.title, { color: isGame ? '#ffffff' : theme.colors.text }]} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        <Pressable
          onPress={handleReturn}
          style={styles.closeButton}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close game"
        >
          <Ionicons name="close" size={24} color={isGame ? '#ffffff' : theme.colors.text} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : null}

      {!isNavigatingAway && isFocused && (
        <WebView
          source={{ uri: url }}
          style={[styles.webview, isGame && { backgroundColor: '#0a0514' }]}
          onLoadEnd={() => setLoading(false)}
          onError={() => setLoading(false)}
          allowsBackForwardNavigationGestures
          setSupportMultipleWindows={false}
          injectedJavaScriptBeforeContentLoaded={hideHeader ? HIDE_HEADER_SCRIPT : undefined}
          injectedJavaScript={hideHeader ? HIDE_HEADER_SCRIPT : undefined}
          onMessage={() => {}}
        />
      )}
    </SafeAreaView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      gap: 8,
    },
    returnButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      maxWidth: '46%',
    },
    returnButtonPressed: {
      opacity: 0.88,
    },
    returnButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    title: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      textAlign: 'center',
    },
    closeButton: {
      padding: 4,
    },
    loadingWrap: {
      ...StyleSheet.absoluteFill,
      top: 56,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
      backgroundColor: theme.colors.background,
    },
    webview: {
      flex: 1,
    },
  });
}
