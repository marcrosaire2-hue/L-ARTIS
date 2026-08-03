import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../src/lib/theme';

function TabIcon({ label, focused }) {
  return (
    <Text style={{ fontSize: 11, fontWeight: focused ? '700' : '500', color: focused ? colors.brand : colors.textLight }}>
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="accueil"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.cream,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="accueil"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused }) => <TabIcon label="⌂" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="recherche"
        options={{
          title: 'Recherche',
          tabBarIcon: ({ focused }) => <TabIcon label="⌕" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="compte"
        options={{
          title: 'Compte',
          tabBarIcon: ({ focused }) => <TabIcon label="◎" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
