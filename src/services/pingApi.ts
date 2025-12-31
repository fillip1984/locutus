import axios from "axios";
import Toast from "react-native-toast-message";

export const ping = async (url: string) => {
  try {
    // TODO: finish this if we're going to keep it
    // console.log("ping server");
    const response = await axios.get<Root>(`${url}/ping`);

    // if (response.status)

    return response.data.success;
  } catch (err) {
    console.error("Exception occurred while pinging server", err);
    Toast.show({
      position: "bottom",
      type: "error",
      text1: "AudioBookShelf server is unreachable",
    });
    return false;
  }
};

export interface Root {
  success: boolean;
}
