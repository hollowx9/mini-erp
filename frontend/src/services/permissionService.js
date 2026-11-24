import API from "./api";

export const getPermissions = async () => {
  const response = await API.get("/permissions");
  return response.data;
};

export const createPermission = async (permissionData) => {
  const response = await API.post(
    "/permissions",
    permissionData
  );

  return response.data;
};

export const updatePermissionStatus = async (
  id,
  status
) => {
  const response = await API.patch(
    `/permissions/${id}/status`,
    { status }
  );

  return response.data;
};