import { Tabs } from 'expo-router';
import { colors } from '@/theme';
import { useSession } from '@/store/session';

export default function TabsLayout() {
  const role = useSession((state) => state.user?.role);
  const supply = role === 'LANDLORD' || role === 'AGENT';
  return <Tabs screenOptions={{ headerStyle: { backgroundColor: colors.canvas }, headerShadowVisible: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.surface }, tabBarLabelStyle: { fontSize: 12, fontWeight: '700' } }}>
    <Tabs.Screen name="home" options={{ title: 'Home', headerShown: false }} />
    <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
    <Tabs.Screen name="saved" options={{ title: 'Saved', href: role === 'STUDENT' ? '/(tabs)/saved' : null }} />
    <Tabs.Screen name="properties" options={{ title: 'Properties', href: supply ? '/(tabs)/properties' : null }} />
    <Tabs.Screen name="admin" options={{ title: 'Admin', href: role === 'ADMIN' ? '/(tabs)/admin' : null }} />
    <Tabs.Screen name="account" options={{ title: 'Account' }} />
  </Tabs>;
}

