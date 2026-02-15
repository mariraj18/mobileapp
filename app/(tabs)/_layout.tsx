import { Tabs } from 'expo-router';
import { Home, ListTodo, Bell, Settings } from 'lucide-react-native';
import { StyleSheet, Animated, Pressable, View, Text } from 'react-native';
import { useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#fc350b',
        tabBarInactiveTintColor: '#a0430a',
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarButton: CustomTabBarButton,
        tabBarBackground: () => (
          <LinearGradient
            colors={['#ffffff', '#fef1e1']}
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
                colors={focused ? ['#fc350b', '#a0430a'] : ['#dfe8e6', '#dfe8e6']}
                style={[styles.iconGradient, focused && styles.activeIconGradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Home color={focused ? '#fef1e1' : '#a0430a'} size={size} />
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
                colors={focused ? ['#fc350b', '#a0430a'] : ['#dfe8e6', '#dfe8e6']}
                style={[styles.iconGradient, focused && styles.activeIconGradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <ListTodo color={focused ? '#fef1e1' : '#a0430a'} size={size} />
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
                colors={focused ? ['#fc350b', '#a0430a'] : ['#dfe8e6', '#dfe8e6']}
                style={[styles.iconGradient, focused && styles.activeIconGradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Bell color={focused ? '#fef1e1' : '#a0430a'} size={size} />
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
                colors={focused ? ['#fc350b', '#a0430a'] : ['#dfe8e6', '#dfe8e6']}
                style={[styles.iconGradient, focused && styles.activeIconGradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Settings color={focused ? '#fef1e1' : '#a0430a'} size={size} />
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
        {focused && <View style={styles.activeDot} />}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    borderTopColor: '#fc350b20',
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#a0430a',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    backgroundColor: 'transparent',
    // Remove this line: position: 'absolute',
  },
  tabLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    marginTop: 4,
    color: '#a0430a',
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
    backgroundColor: '#fc350b',
    marginTop: 4,
  },
});