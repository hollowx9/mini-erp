import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../../services/employeeService";
import {
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
} from "../../services/attendanceService";

function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);

  const [editId, setEditId] = useState(null);
  const [attendanceEditId, setAttendanceEditId] = useState(null);

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    position: "",
    salary: "",
  });

  const [attendanceForm, setAttendanceForm] = useState({
    employeeId: "",
    date: "",
    status: "present",
  });

  const fetchEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load employees");
    }
  };

  const fetchAttendance = async () => {
    try {
      const data = await getAttendance();
      setAttendanceList(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load attendance");
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAttendanceChange = (e) => {
    setAttendanceForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateEmployeeForm = () => {
    const { fullName, email, phone, position, salary } = formData;

    if (!fullName || !email || !phone || !position || !salary) {
      toast.warning("Please fill in all employee fields");
      return false;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      toast.warning("Please enter a valid employee email");
      return false;
    }

    if (fullName.trim().length < 3) {
      toast.warning("Full name must contain at least 3 characters");
      return false;
    }

    if (position.trim().length < 2) {
      toast.warning("Position must contain at least 2 characters");
      return false;
    }

    if (Number(salary) <= 0) {
      toast.warning("Salary must be greater than 0");
      return false;
    }

    return true;
  };

  const validateAttendanceForm = () => {
    const { employeeId, date, status } = attendanceForm;

    if (!employeeId || !date || !status) {
      toast.warning("Please fill in all attendance fields");
      return false;
    }

    if (!["present", "absent", "late"].includes(status)) {
      toast.warning("Invalid attendance status");
      return false;
    }

    return true;
  };

  const resetEmployeeForm = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      position: "",
      salary: "",
    });
    setEditId(null);
  };

  const resetAttendanceForm = () => {
    setAttendanceForm({
      employeeId: "",
      date: "",
      status: "present",
    });
    setAttendanceEditId(null);
  };

  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmployeeForm()) return;

    try {
      if (editId) {
        await updateEmployee(editId, formData);
        toast.success("Employee updated successfully");
      } else {
        await createEmployee(formData);
        toast.success("Employee created successfully");
      }

      resetEmployeeForm();
      fetchEmployees();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Employee operation failed");
    }
  };

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();

    if (!validateAttendanceForm()) return;

    try {
      if (attendanceEditId) {
        await updateAttendance(attendanceEditId, attendanceForm);
        toast.success("Attendance updated successfully");
      } else {
        await createAttendance(attendanceForm);
        toast.success("Attendance created successfully");
      }

      resetAttendanceForm();
      fetchAttendance();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Attendance operation failed");
    }
  };

  const handleEditEmployee = (employee) => {
    setFormData({
      fullName: employee.fullName,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      salary: employee.salary,
    });
    setEditId(employee.id);
  };

  const handleEditAttendance = (attendance) => {
    setAttendanceForm({
      employeeId: String(attendance.employeeId),
      date: attendance.date,
      status: attendance.status,
    });
    setAttendanceEditId(attendance.id);
  };

  const openEmployeeDeleteModal = (employee) => {
    setSelectedEmployee(employee);
    setIsEmployeeModalOpen(true);
  };

  const openAttendanceDeleteModal = (attendance) => {
    setSelectedAttendance(attendance);
    setIsAttendanceModalOpen(true);
  };

  const handleConfirmDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      await deleteEmployee(selectedEmployee.id);
      toast.success("Employee deleted successfully");

      if (editId === selectedEmployee.id) {
        resetEmployeeForm();
      }

      fetchEmployees();
      fetchAttendance();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete employee");
    } finally {
      setIsEmployeeModalOpen(false);
      setSelectedEmployee(null);
    }
  };

  const handleConfirmDeleteAttendance = async () => {
    if (!selectedAttendance) return;

    try {
      await deleteAttendance(selectedAttendance.id);
      toast.success("Attendance deleted successfully");

      if (attendanceEditId === selectedAttendance.id) {
        resetAttendanceForm();
      }

      fetchAttendance();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete attendance");
    } finally {
      setIsAttendanceModalOpen(false);
      setSelectedAttendance(null);
    }
  };

  return (
    <div className="employees-page">
      <h2>Employees</h2>

      <form className="employee-form" onSubmit={handleEmployeeSubmit}>
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
        />
        <input
          type="text"
          name="position"
          placeholder="Position"
          value={formData.position}
          onChange={handleChange}
        />
        <input
          type="number"
          name="salary"
          placeholder="Salary"
          value={formData.salary}
          onChange={handleChange}
        />

        <div className="employee-form-actions">
          <button type="submit">
            {editId ? "Update Employee" : "Add Employee"}
          </button>

          {editId && (
            <button
              type="button"
              className="cancel-btn"
              onClick={resetEmployeeForm}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="employee-table-wrapper">
        <table className="employee-table">
          <thead>
            <tr>
             
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Position</th>
              <th>Salary</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length > 0 ? (
              employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.fullName}</td>
                  <td>{employee.email}</td>
                  <td>{employee.phone}</td>
                  <td>{employee.position}</td>
                  <td>${employee.salary}</td>
                  <td>
                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() => handleEditEmployee(employee)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => openEmployeeDeleteModal(employee)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">No employees found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="attendance-section">
        <h2>Attendance</h2>

        <form className="attendance-form" onSubmit={handleAttendanceSubmit}>
          <select
            name="employeeId"
            value={attendanceForm.employeeId}
            onChange={handleAttendanceChange}
          >
            <option value="">Select Employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.fullName}
              </option>
            ))}
          </select>

          <input
            type="date"
            name="date"
            value={attendanceForm.date}
            onChange={handleAttendanceChange}
          />

          <select
            name="status"
            value={attendanceForm.status}
            onChange={handleAttendanceChange}
          >
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </select>

          <div className="attendance-form-actions">
            <button type="submit">
              {attendanceEditId ? "Update Attendance" : "Add Attendance"}
            </button>

            {attendanceEditId && (
              <button
                type="button"
                className="cancel-btn"
                onClick={resetAttendanceForm}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        <div className="attendance-table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendanceList.length > 0 ? (
                attendanceList.map((attendance) => (
                  <tr key={attendance.id}>
                    <td>{attendance.id}</td>
                    <td>{attendance.employeeName}</td>
                    <td>{attendance.date}</td>
                    <td>
                      <span
                        className={`status-badge attendance-status-${attendance.status}`}
                      >
                        {attendance.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() => handleEditAttendance(attendance)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => openAttendanceDeleteModal(attendance)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No attendance records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={isEmployeeModalOpen}
        onClose={() => {
          setIsEmployeeModalOpen(false);
          setSelectedEmployee(null);
        }}
        onConfirm={handleConfirmDeleteEmployee}
        message={`Are you sure you want to delete ${
          selectedEmployee?.fullName || "this employee"
        }?`}
      />

      <ConfirmModal
        isOpen={isAttendanceModalOpen}
        onClose={() => {
          setIsAttendanceModalOpen(false);
          setSelectedAttendance(null);
        }}
        onConfirm={handleConfirmDeleteAttendance}
        message={`Are you sure you want to delete attendance record #${
          selectedAttendance?.id || ""
        }?`}
      />
    </div>
  );
}

export default EmployeesPage;