import { audiobookshelf_token } from "@env";
import axios from "axios";
import { create } from "zustand";

import { LibraryType } from "@/db/schema";

type LibraryState = {
  libraries: LibraryType[] | null;
  execute: () => void;
};

export const useLibraryStore = create<LibraryState>()((set) => ({
  libraries: null,
  execute: async () => {
    try {
      console.log("fetching libraries");
      const response = await axios.get<{ libraries: LibraryType[] }>(
        "http://192.168.68.68:13378/api/libraries",
        {
          headers: {
            Authorization: `Bearer ${audiobookshelf_token}`,
          },
        },
      );
      const libraries = response.data;
      console.log(libraries);
      set({ libraries: response.data.libraries });
    } catch (err) {
      console.error("Error fetching data", err);
    }
  },
}));
