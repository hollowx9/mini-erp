import { useEffect, useState } from "react";

import { toast } from "react-toastify";

import { useAuth } from "../../context/AuthContext";

import {
  getPermissions,
  createPermission,
  updatePermissionStatus,
} from "../../services/permissionService";

function PermissionsPage() {
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

  const [permissions, setPermissions] = useState([]);

  const [formData, setFormData] = useState({
    permissionDate: "",
    startTime: "",
    endTime: "",
    reason: "",
  });

  const fetchPermissions = async () => {
    try {
      const data = await getPermissions();
      setPermissions(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch permissions");
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.permissionDate ||
      !formData.startTime ||
      !formData.endTime
    ) {
      toast.warning("Please fill in all required fields");
      return;
    }

    try {
      await createPermission(formData);

      toast.success("Permission request submitted");

      setFormData({
        permissionDate: "",
        startTime: "",
        endTime: "",
        reason: "",
      });

      fetchPermissions();
    } catch (error) {
      console.error(error);
      toast.error("Permission request can't exeed 2 hours");
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await updatePermissionStatus(id, status);

      toast.success(`Permission ${status}`);

      fetchPermissions();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update permission");
    }
  };

  return (
    <div className="employees-page">
      <h2>Permission Requests</h2>

      {!isAdmin && (
        <form
          className="employee-form"
          onSubmit={handleSubmit}
        >
          <input
            type="date"
            name="permissionDate"
            value={formData.permissionDate}
            onChange={handleChange}
          />

          <input
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
          />

          <input
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
          />

          <input
            type="text"
            name="reason"
            placeholder="Reason"
            value={formData.reason}
            onChange={handleChange}
          />

          <button type="submit">
            Request Permission
          </button>
        </form>
      )}

      <div className="employee-table-wrapper">
        <table className="employee-table">
          <thead>
            <tr>
              {isAdmin && <th>Employee</th>}

              <th>Date</th>
              <th>Start</th>
              <th>End</th>
              <th>Reason</th>
              <th>Status</th>

              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {permissions.length > 0 ? (
              permissions.map((permission) => (
                <tr key={permission.id}>
                  {isAdmin && (
                    <td>
                      {permission.employeeName}
                    </td>
                  )}

                  <td>
                    {permission.permissionDate}
                  </td>

                  <td>{permission.startTime}</td>

                  <td>{permission.endTime}</td>

                  <td>{permission.reason || "-"}</td>

                  <td>
                    <span
                      className={`status-badge status-${permission.status}`}
                    >
                      {permission.status}
                    </span>
                  </td>

                  {isAdmin && (
                    <td>
                      {permission.status ===
                        "pending" && (
                        <div className="table-actions">
                          <button
                            className="edit-btn"
                            onClick={() =>
                              handleStatusUpdate(
                                permission.id,
                                "approved"
                              )
                            }
                          >
                            Approve
                          </button>

                          <button
                            className="delete-btn"
                            onClick={() =>
                              handleStatusUpdate(
                                permission.id,
                                "rejected"
                              )
                            }
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isAdmin ? 7 : 5}>
                  No permission requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PermissionsPage;