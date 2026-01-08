import { Tabs } from 'expo-router';
import { Home, ListTodo, Bell, User } from 'lucide-react-native';
import { StyleSheet, Animated } from 'react-native';
import { useState, useEffect } from 'react';

export default function TabLayout() {
  const [scaleAnim] = useState(new Animated.Value(1));

  const animateTabPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        listeners={{
          tabPress: animateTabPress,
        }}
        options={{
          title: 'Workspaces',
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={focused ? styles.activeIcon : null}>
              <Home color={color} size={size} strokeWidth={focused ? 2.5 : 2} />
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        listeners={{
          tabPress: animateTabPress,
        }}
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={focused ? styles.activeIcon : null}>
              <ListTodo color={color} size={size} strokeWidth={focused ? 2.5 : 2} />
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        listeners={{
          tabPress: animateTabPress,
        }}
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={focused ? styles.activeIcon : null}>
              <Bell color={color} size={size} strokeWidth={focused ? 2.5 : 2} />
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        listeners={{
          tabPress: animateTabPress,
        }}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={focused ? styles.activeIcon : null}>
              <User color={color} size={size} strokeWidth={focused ? 2.5 : 2} />
            </Animated.View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  tabLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 2,
  },
  tabItem: {
    paddingVertical: 4,
  },
  activeIcon: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 8,
    borderRadius: 12,
  },
});