import { audiobookshelf_token } from "@env";
import axios from "axios";
import { create } from "zustand";

// import { LibraryType } from "@/db/schema";

// type LibraryState = {
//   libraries: LibraryType[] | null;
//   execute: () => void;
// };

// export const useLibraryStore = create<LibraryState>()((set) => ({
//   libraries: null,
//   execute: async () => {
//     try {

//       set({ libraries: response.data.libraries });
//     } catch (err) {
//       console.error("Error fetching data", err);
//     }
//   },
// }));
