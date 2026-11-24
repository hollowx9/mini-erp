import API from "./api";

export const loginUser = async (formData) => {
  const response = await API.post("/auth/login", formData);
  return response.data;
};