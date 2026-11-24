import API from "./api";

export const getDashboardStats = async () => {
  const response = await API.get("/dashboard");
  return response.data;
};

export const getAnalytics = async () => {
  const response = await API.get("/dashboard/analytics");
  return response.data;
};

export const getRecentOrders = async () => {
  const response = await API.get("/dashboard/recent-orders");
  return response.data;
};