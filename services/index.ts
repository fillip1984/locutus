import { audiobookshelf_token } from "@env";
import axios from "axios";

// export const getLibraries = async () => {
//   try {
//     console.log("fetching libraries");
//     return await axios.get<{ libraries: LibraryType[] }>(
//       "http://192.168.68.68:13378/api/libraries",
//       {
//         headers: {
//           Authorization: `Bearer ${audiobookshelf_token}`,
//         },
//       },
//     );
//   } catch (err) {
//     console.error("Exception occurred while fetching libraries", err);
//     throw err;
//   }
// };

// export const getLibraryItems = async (libraryId: string) => {
//   try {
//     console.log(`fetching library items for library with id: ${libraryId}`);
//     return await axios.get<{ results: Librar }>();
//   } catch (err) {
//     console.error(
//       `Exception occurred while fetching items for library with id: ${libraryId}`,
//       err,
//     );
//     throw err;
//   }
// };
