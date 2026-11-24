import API from "./api";

export const getHolidays = async () => {
  const response = await API.get("/holidays");
  return response.data;
};

export const createHoliday = async (holidayData) => {
  const response = await API.post("/holidays", holidayData);
  return response.data;
};

export const updateHoliday = async (id, holidayData) => {
  const response = await API.put(`/holidays/${id}`, holidayData);
  return response.data;
};

export const deleteHoliday = async (id) => {
  const response = await API.delete(`/holidays/${id}`);
  return response.data;
};