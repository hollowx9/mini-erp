import API from "./api";

export const getLeaveBalances = async () => {
  const response = await API.get("/leave-balances");
  return response.data;
};

export const setLeaveBalance = async (balanceData) => {
  const response = await API.post("/leave-balances", balanceData);
  return response.data;
};