import { useSnackbar } from "../utils/SnackbarContext";

export const useApiHandler = () => {
  const { showSnackbar } = useSnackbar();

  const handleApiResponse = (response, data, snackbarText) => {
    // let data;
    // try {
    //   data = await response.json();
    // } catch (error) {
    //   data = { message: "An unexpected error occurred." };
    // }

    // console.log(response)
    if (!response.ok && response.status !== 200) {
      if (response.status === 403) {
        showSnackbar("You do not have required permissions.", "error");
      } else {
        showSnackbar(data.detail || "An error occurred.", "error");
      }
      return null;
    } else {
      showSnackbar(snackbarText || "Operation successful", "success");
      return data;
    }
  };

  return { handleApiResponse };
};
