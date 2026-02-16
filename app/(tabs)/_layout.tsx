import { Tabs } from 'expo-router';
import { Home, ListTodo, Bell, Settings } from 'lucide-react-native';
import { StyleSheet, Animated, Pressable, View, Text } from 'react-native';
import { useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

export default function TabLayout() {
  const { colors, theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { borderTopColor: colors.border, shadowColor: colors.shadow }],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondary,
        tabBarLabelStyle: [styles.tabLabel, { color: colors.secondary }],
        tabBarItemStyle: styles.tabItem,
        tabBarButton: CustomTabBarButton,
        tabBarBackground: () => (
          <LinearGradient
            colors={theme === 'light' ? ['#ffffff', '#fef1e1'] : [colors.cardLight, colors.background]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: ' ',
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={focused ? styles.activeIconWrapper : null}>
              <LinearGradient
                colors={focused ? [colors.gradientStart, colors.gradientEnd] : [colors.border, colors.border]}
                style={[styles.iconGradient, focused && styles.activeIconGradient, { shadowColor: colors.primary }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Home color={focused ? colors.background : colors.secondary} size={size} />
              </LinearGradient>
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: ' ',
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={focused ? styles.activeIconWrapper : null}>
              <LinearGradient
                colors={focused ? [colors.gradientStart, colors.gradientEnd] : [colors.border, colors.border]}
                style={[styles.iconGradient, focused && styles.activeIconGradient, { shadowColor: colors.primary }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <ListTodo color={focused ? colors.background : colors.secondary} size={size} />
              </LinearGradient>
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: ' ',
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={focused ? styles.activeIconWrapper : null}>
              <LinearGradient
                colors={focused ? [colors.gradientStart, colors.gradientEnd] : [colors.border, colors.border]}
                style={[styles.iconGradient, focused && styles.activeIconGradient, { shadowColor: colors.primary }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Bell color={focused ? colors.background : colors.secondary} size={size} />
              </LinearGradient>
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: ' ',
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={focused ? styles.activeIconWrapper : null}>
              <LinearGradient
                colors={focused ? [colors.gradientStart, colors.gradientEnd] : [colors.border, colors.border]}
                style={[styles.iconGradient, focused && styles.activeIconGradient, { shadowColor: colors.primary }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Settings color={focused ? colors.background : colors.secondary} size={size} />
              </LinearGradient>
            </Animated.View>
          ),
        }}
      />
    </Tabs>
  );
}

const CustomTabBarButton = (props: any) => {
  const { children, onPress, accessibilityState } = props;
  const focused = accessibilityState?.selected;
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      Animated.spring(translateY, {
        toValue: -4,
        useNativeDriver: true,
        friction: 5,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 5,
      }).start();
    }
  }, [focused]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.buttonContainer}
    >
      <Animated.View style={[
        styles.buttonContent,
        {
          transform: [{ scale }, { translateY }],
        }
      ]}>
        {children}
        {focused && <TabBarDot />}
      </Animated.View>
    </Pressable>
  );
};

const TabBarDot = () => {
  const { colors } = useTheme();
  return <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />;
};

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 8,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    backgroundColor: 'transparent',
  },
  tabLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    marginTop: 4,
  },
  tabItem: {
    paddingVertical: 4,
  },
  buttonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconGradient: {
    shadowColor: '#fc350b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  activeIconWrapper: {
    transform: [{ scale: 1.1 }],
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
});