import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '오늘',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'fork.knife', android: 'restaurant', web: 'restaurant' }}
              tintColor={color as string}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bodylog"
        options={{
          title: '눈바디',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'camera', android: 'camera_alt', web: 'camera_alt' }}
              tintColor={color as string}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="trend"
        options={{
          title: '추이',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'chart.line.uptrend.xyaxis',
                android: 'show_chart',
                web: 'show_chart',
              }}
              tintColor={color as string}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'gearshape', android: 'settings', web: 'settings' }}
              tintColor={color as string}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
