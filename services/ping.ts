import axios from "axios";
import Toast from "react-native-toast-message";

export const ping = async (url: string) => {
  try {
    console.log("ping server");
    const response = await axios.get(`${url}/ping`);
    console.log({ stat: response.status, t: response.statusText });
    // if (response.status)
    console.log({ response });
    return response.data;
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
