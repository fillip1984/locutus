// import { create } from "zustand";

// import { db } from "@/db";
// import { libraryItemWithFilesSchemaType } from "@/db/schema";

// export interface MediaStore {
//   libraryItem: libraryItemWithFilesSchemaType | null;
//   refetch: (id: string) => void;
// }

// export const useMediaStore = create<MediaStore>()((set, get) => ({
//   libraryItem: null,
//   refetch: async (id: string) => {
//     const result = await db.query.libraryItemSchema.findFirst({
//       where: {
//         id,
//       },
//       with: { audioFiles: true, eBookFiles: true },
//     });
//     set(() => ({ libraryItem: result }));
//   },
// }));
