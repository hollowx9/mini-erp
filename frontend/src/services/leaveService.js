import API from "./api";

// Récupérer toutes les demandes de congé
export const getLeaveRequests = async () => {
  const response = await API.get("/leaves");
  return response.data;
};

// Créer une demande de congé
export const createLeaveRequest = async (leaveData) => {
  const response = await API.post("/leaves", leaveData);
  return response.data;
};

// Modifier une demande de congé
export const updateLeaveRequest = async (id, leaveData) => {
  const response = await API.put(`/leaves/${id}`, leaveData);
  return response.data;
};

// Approuver / refuser une demande
export const updateLeaveStatus = async (id, status) => {
  const response = await API.patch(`/leaves/${id}/status`, { status });
  return response.data;
};

// Supprimer une demande de congé
export const deleteLeaveRequest = async (id) => {
  const response = await API.delete(`/leaves/${id}`);
  return response.data;
};