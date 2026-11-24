import API from "./api";

export const getOrders = async () => {
  const response = await API.get("/orders");
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await API.get(`/orders/${id}`);
  return response.data;
};

export const createOrder = async (orderData) => {
  const response = await API.post("/orders", orderData);
  return response.data;
};

export const updateOrder = async (id, orderData) => {
  const response = await API.put(`/orders/${id}`, orderData);
  return response.data;
};

export const deleteOrder = async (id) => {
  const response = await API.delete(`/orders/${id}`);
  return response.data;
};