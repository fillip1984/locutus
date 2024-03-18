import { Tabs } from "expo-router";
import { FontAwesome, Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={
        {
          // tabBarActiveTintColor: "white",
          // tabBarBackground: () => <View className="bg-slate-800"></View>,
        }
      }>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-sharp" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="gears" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
