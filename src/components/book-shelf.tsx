import { ScrollView, Text, View } from "react-native";

import { libraryItemSchemaType } from "@/db/schema";
import BookLink from "./book-link";

export default function LibraryShelf({
  label,
  items,
}: {
  label: string;
  items: libraryItemSchemaType[];
}) {
  return (
    <>
      <Text className="text-4xl font-bold text-white">{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex flex-row gap-3">
          {items.map((item) => (
            <BookLink key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>
    </>
  );
}
