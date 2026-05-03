import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FontAwesome6 } from "@expo/vector-icons";
import { toast } from "sonner-native";

import { colors } from "@/components/ui/colors";
import { dropDB } from "@/db";
import { pingBackend } from "@/services/pingApi";
import { syncProgressWithServer } from "@/services/progressService";
import { useLibraryStore } from "@/stores/library-store";
import { useSessionStore } from "@/stores/session-store";

export default function SettingsPage() {
  const { status, syncWithServer, refetch } = useLibraryStore();
  const { logOut } = useSessionStore();

  const handlePing = async () => {
    const pendingToastId = toast.loading("Pinging server...");
    const pingResult = await pingBackend();
    if (pingResult) {
      toast.success("Connected to backend server", { id: pendingToastId });
    } else {
      toast.error("Backend server unavailable", { id: pendingToastId });
    }
  };

  const handleSyncProgress = async () => {
    console.log("Syncing progress...");
    await syncProgressWithServer();
    refetch();
  };

  const handleSync = async () => {
    toast.promise<boolean>(syncWithServer(), {
      loading: "Syncing with server...",
      success: (result) => "Sync complete",
      error: "Sync failed",
    });
  };

  const handleDropData = () => {
    toast("This will drop all local data and log you out", {
      action: {
        label: "Confirm",
        onClick: async () => {
          await dropDB();
          logOut();
        },
      },
    });
  };

  const handleLogOut = () => {
    logOut();
  };

  return (
    <SafeAreaView style={{ backgroundColor: colors.background }}>
      <View className="flex h-screen gap-4 p-4">
        {/* <Text className="text-3xl text-white">AudioBookShelf Settings</Text> */}

        <View className="flex gap-2">
          <Text className="text-3xl text-white">Server</Text>
          <Pressable
            onPress={handlePing}
            className={`flex w-full flex-row items-center justify-center gap-2 rounded border border-white bg-transparent ${status === "loading" ? "opacity-40" : ""} px-4 py-2`}
          >
            <Text className="text-2xl text-white">Ping server</Text>
          </Pressable>

          <Pressable
            onPress={handleSyncProgress}
            className={`flex w-full flex-row items-center justify-center gap-2 rounded border border-white bg-green-300 ${status === "loading" ? "opacity-40" : ""} px-4 py-2`}
          >
            <Text className="text-2xl text-white">Sync Progress</Text>
          </Pressable>

          <Pressable
            onPress={handleSync}
            disabled={status === "loading"}
            className={`flex w-full flex-row items-center justify-center gap-2 rounded bg-sky-300 ${status === "loading" ? "opacity-40" : ""} px-4 py-2`}
          >
            {status === "loading" && (
              <FontAwesome6 name="spinner" size={24} color="white" />
            )}
            <Text className="text-2xl text-white">Sync</Text>
          </Pressable>

          <Pressable
            onPress={handleDropData}
            disabled={status === "loading"}
            className={`flex w-full flex-row items-center justify-center gap-2 rounded bg-red-300 ${status === "loading" ? "opacity-40" : ""} px-4 py-2`}
          >
            {status === "loading" && (
              <FontAwesome6 name="spinner" size={24} color="white" />
            )}
            <Text className="text-2xl text-white">Drop data</Text>
          </Pressable>

          <Pressable
            onPress={handleLogOut}
            disabled={status === "loading"}
            className={`flex w-full flex-row items-center justify-center gap-2 rounded bg-yellow-800 ${status === "loading" ? "opacity-40" : ""} px-4 py-2`}
          >
            {status === "loading" && (
              <FontAwesome6 name="spinner" size={24} color="white" />
            )}
            <Text className="text-2xl text-white">Log Out</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
