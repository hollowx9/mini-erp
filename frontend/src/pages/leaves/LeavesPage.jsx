import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useAuth } from "../../context/AuthContext";

import { getEmployees } from "../../services/employeeService";

import {
  getLeaveRequests,
  createLeaveRequest,
  updateLeaveRequest,
  updateLeaveStatus,
  deleteLeaveRequest,
} from "../../services/leaveService";

import {
  getLeaveBalances,
  setLeaveBalance,
} from "../../services/leaveBalanceService";

import {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from "../../services/holidayService";

function LeavesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [holidays, setHolidays] = useState([]);

  const [editId, setEditId] = useState(null);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const [holidayEditId, setHolidayEditId] = useState(null);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);

  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const [leaveForm, setLeaveForm] = useState({
    employeeId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [balanceForm, setBalanceForm] = useState({
    employeeId: "",
    totalDays: "",
  });

  const [holidayForm, setHolidayForm] = useState({
    name: "",
    holidayDate: "",
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

  const fetchLeaves = async () => {
    try {
      const data = await getLeaveRequests();
      setLeaves(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load leave requests");
    }
  };

  const fetchBalances = async () => {
    try {
      const data = await getLeaveBalances();
      setBalances(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load leave balances");
    }
  };

  const fetchHolidays = async () => {
    try {
      const data = await getHolidays();
      setHolidays(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load holidays");
    }
  };

  useEffect(() => {
    fetchLeaves();
    fetchHolidays();

    if (isAdmin) {
      fetchEmployees();
      fetchBalances();
    }
  }, [isAdmin]);

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    return diffTime / (1000 * 60 * 60 * 24) + 1;
  };

  const formatDateForInput = (date) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  };

  const getHolidayDateKey = (date) => {
    return formatDateForInput(date);
  };

  const handleLeaveChange = (e) => {
    setLeaveForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleBalanceChange = (e) => {
    setBalanceForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleHolidayChange = (e) => {
    setHolidayForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetLeaveForm = () => {
    setLeaveForm({
      employeeId: "",
      startDate: "",
      endDate: "",
      reason: "",
    });
    setEditId(null);
  };

  const resetBalanceForm = () => {
    setBalanceForm({
      employeeId: "",
      totalDays: "",
    });
  };

  const resetHolidayForm = () => {
    setHolidayForm({
      name: "",
      holidayDate: "",
    });
    setHolidayEditId(null);
  };

  const validateLeaveForm = () => {
    if (isAdmin && !leaveForm.employeeId) {
      toast.warning("Employee is required");
      return false;
    }

    if (!leaveForm.startDate || !leaveForm.endDate) {
      toast.warning("Start date and end date are required");
      return false;
    }

    if (new Date(leaveForm.startDate) > new Date(leaveForm.endDate)) {
      toast.warning("Start date cannot be after end date");
      return false;
    }

    return true;
  };

  const validateBalanceForm = () => {
    if (!balanceForm.employeeId || balanceForm.totalDays === "") {
      toast.warning("Employee and total days are required");
      return false;
    }

    if (Number(balanceForm.totalDays) < 0) {
      toast.warning("Total days cannot be negative");
      return false;
    }

    return true;
  };

  const validateHolidayForm = () => {
    if (!holidayForm.name || !holidayForm.holidayDate) {
      toast.warning("Holiday name and date are required");
      return false;
    }

    return true;
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();

    if (!validateLeaveForm()) return;

    try {
      const payload = isAdmin
        ? leaveForm
        : {
            startDate: leaveForm.startDate,
            endDate: leaveForm.endDate,
            reason: leaveForm.reason,
          };

      if (editId) {
        await updateLeaveRequest(editId, payload);
        toast.success("Leave request updated successfully");
      } else {
        await createLeaveRequest(payload);
        toast.success("Leave request created successfully");
      }

      resetLeaveForm();
      fetchLeaves();

      if (isAdmin) {
        fetchBalances();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Leave operation failed");
    }
  };

  const handleBalanceSubmit = async (e) => {
    e.preventDefault();

    if (!validateBalanceForm()) return;

    try {
      await setLeaveBalance(balanceForm);
      toast.success("Leave balance updated successfully");

      resetBalanceForm();
      fetchBalances();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Balance update failed");
    }
  };

  const handleHolidaySubmit = async (e) => {
    e.preventDefault();

    if (!validateHolidayForm()) return;

    try {
      if (holidayEditId) {
        await updateHoliday(holidayEditId, holidayForm);
        toast.success("Holiday updated successfully");
      } else {
        await createHoliday(holidayForm);
        toast.success("Holiday created successfully");
      }

      resetHolidayForm();
      fetchHolidays();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Holiday operation failed");
    }
  };

  const handleEditLeave = (leave) => {
    if (leave.status !== "pending") {
      toast.warning("Only pending requests can be edited");
      return;
    }

    setLeaveForm({
      employeeId: String(leave.employeeId),
      startDate: formatDateForInput(leave.startDate),
      endDate: formatDateForInput(leave.endDate),
      reason: leave.reason || "",
    });

    setEditId(leave.id);
  };

  const handleEditHoliday = (holiday) => {
    setHolidayForm({
      name: holiday.name,
      holidayDate: formatDateForInput(holiday.holidayDate),
    });

    setHolidayEditId(holiday.id);
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateLeaveStatus(id, status);
      toast.success(`Leave request ${status}`);

      fetchLeaves();
      fetchBalances();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Status update failed");
    }
  };

  const openLeaveDeleteModal = (leave) => {
    setSelectedLeave(leave);
    setIsLeaveModalOpen(true);
  };

  const openHolidayDeleteModal = (holiday) => {
    setSelectedHoliday(holiday);
    setIsHolidayModalOpen(true);
  };

  const handleConfirmDeleteLeave = async () => {
    if (!selectedLeave) return;

    try {
      await deleteLeaveRequest(selectedLeave.id);
      toast.success("Leave request deleted successfully");

      if (editId === selectedLeave.id) {
        resetLeaveForm();
      }

      fetchLeaves();

      if (isAdmin) {
        fetchBalances();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete leave request");
    } finally {
      setIsLeaveModalOpen(false);
      setSelectedLeave(null);
    }
  };

  const handleConfirmDeleteHoliday = async () => {
    if (!selectedHoliday) return;

    try {
      await deleteHoliday(selectedHoliday.id);
      toast.success("Holiday deleted successfully");

      if (holidayEditId === selectedHoliday.id) {
        resetHolidayForm();
      }

      fetchHolidays();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete holiday");
    } finally {
      setIsHolidayModalOpen(false);
      setSelectedHoliday(null);
    }
  };

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  const monthTitle = currentCalendarDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const firstWeekDay =
    firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1;

  const daysInMonth = lastDayOfMonth.getDate();

  const calendarDays = [];

  for (let i = 0; i < firstWeekDay; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const previousMonth = () => {
    setCurrentCalendarDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentCalendarDate(new Date(year, month + 1, 1));
  };

  const getHolidayForDay = (day) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

    return holidays.find(
      (holiday) => getHolidayDateKey(holiday.holidayDate) === dateKey
    );
  };

  return (
    <div className="leaves-page">
      <h2>Leave Management</h2>

      <section className="leave-section">
        <h3>{isAdmin ? "Leave Requests" : "My Leave Requests"}</h3>

        <form className="leave-form" onSubmit={handleLeaveSubmit}>
          {isAdmin && (
            <select
              name="employeeId"
              value={leaveForm.employeeId}
              onChange={handleLeaveChange}
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName}
                </option>
              ))}
            </select>
          )}

          <input
            type="date"
            name="startDate"
            value={leaveForm.startDate}
            onChange={handleLeaveChange}
          />

          <input
            type="date"
            name="endDate"
            value={leaveForm.endDate}
            onChange={handleLeaveChange}
          />

          <input
            type="text"
            name="reason"
            placeholder="Reason"
            value={leaveForm.reason}
            onChange={handleLeaveChange}
          />

          <div className="leave-form-actions">
            <button type="submit">
              {editId ? "Update Leave" : "Request Leave"}
            </button>

            {editId && (
              <button
                type="button"
                className="cancel-btn"
                onClick={resetLeaveForm}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        <div className="leave-table-wrapper">
          <table className="leave-table">
            <thead>
              <tr>
                <th>ID</th>
                {isAdmin && <th>Employee</th>}
                <th>Start</th>
                <th>End</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {leaves.length > 0 ? (
                leaves.map((leave) => (
                  <tr key={leave.id}>
                    <td>{leave.id}</td>
                    {isAdmin && <td>{leave.employeeName}</td>}
                    <td>{formatDateForInput(leave.startDate)}</td>
                    <td>{formatDateForInput(leave.endDate)}</td>
                    <td>{calculateDays(leave.startDate, leave.endDate)}</td>
                    <td>{leave.reason || "-"}</td>
                    <td>
                      <span
                        className={`status-badge leave-status-${leave.status}`}
                      >
                        {leave.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {leave.status === "pending" && (
                          <button
                            type="button"
                            className="edit-btn"
                            onClick={() => handleEditLeave(leave)}
                          >
                            Edit
                          </button>
                        )}

                        {isAdmin && leave.status === "pending" && (
                          <>
                            <button
                              type="button"
                              className="approve-btn"
                              onClick={() =>
                                handleStatusChange(leave.id, "approved")
                              }
                            >
                              Approve
                            </button>

                            <button
                              type="button"
                              className="reject-btn"
                              onClick={() =>
                                handleStatusChange(leave.id, "rejected")
                              }
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {isAdmin && (
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => openLeaveDeleteModal(leave)}
                          >
                            Delete
                          </button>
                        )}

                        {!isAdmin && leave.status !== "pending" && "-"}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? "8" : "7"}>
                    No leave requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isAdmin && (
        <section className="leave-section">
          <h3>Leave Balances</h3>

          <form className="leave-form" onSubmit={handleBalanceSubmit}>
            <select
              name="employeeId"
              value={balanceForm.employeeId}
              onChange={handleBalanceChange}
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName}
                </option>
              ))}
            </select>

            <input
              type="number"
              name="totalDays"
              placeholder="Total leave days"
              value={balanceForm.totalDays}
              onChange={handleBalanceChange}
            />

            <div className="leave-form-actions">
              <button type="submit">Update Balance</button>
            </div>
          </form>

          <div className="leave-table-wrapper">
            <table className="leave-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Total Days</th>
                  <th>Used Days</th>
                  <th>Remaining Days</th>
                </tr>
              </thead>

              <tbody>
                {balances.length > 0 ? (
                  balances.map((balance) => (
                    <tr key={balance.employeeId}>
                      <td>{balance.employeeName}</td>
                      <td>{balance.totalDays}</td>
                      <td>{balance.usedDays}</td>
                      <td>
                        {balance.remainingDays <= 5 ? (
                          <span className="status-badge status-cancelled">
                            {balance.remainingDays}
                          </span>
                        ) : (
                          <span className="status-badge status-paid">
                            {balance.remainingDays}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No leave balances found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="leave-section">
        <div className="calendar-top">
          <div>
            <h3>Holiday Calendar</h3>
            <p>View company holidays inside a real monthly calendar.</p>
          </div>

          <div className="calendar-controls">
            <button type="button" onClick={previousMonth}>
              Previous
            </button>

            <h3>{monthTitle}</h3>

            <button type="button" onClick={nextMonth}>
              Next
            </button>
          </div>
        </div>

        {isAdmin && (
          <form className="leave-form" onSubmit={handleHolidaySubmit}>
            <input
              type="text"
              name="name"
              placeholder="Holiday name"
              value={holidayForm.name}
              onChange={handleHolidayChange}
            />

            <input
              type="date"
              name="holidayDate"
              value={holidayForm.holidayDate}
              onChange={handleHolidayChange}
            />

            <div className="leave-form-actions">
              <button type="submit">
                {holidayEditId ? "Update Holiday" : "Add Holiday"}
              </button>

              {holidayEditId && (
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={resetHolidayForm}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        )}

        <div className="holiday-calendar">
          <div className="calendar-weekdays">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          <div className="calendar-grid">
            {calendarDays.map((day, index) => {
              const holiday = day ? getHolidayForDay(day) : null;

              return (
                <div
                  key={index}
                  className={`calendar-day ${holiday ? "holiday-day" : ""}`}
                >
                  {day && (
                    <>
                      <span className="calendar-day-number">{day}</span>

                      {holiday && (
                        <div className="holiday-card">
                          <span>{holiday.name}</span>

                          {isAdmin && (
                            <div className="holiday-card-actions">
                              <button
                                type="button"
                                className="edit-btn"
                                onClick={() => handleEditHoliday(holiday)}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="delete-btn"
                                onClick={() => openHolidayDeleteModal(holiday)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <ConfirmModal
        isOpen={isLeaveModalOpen}
        onClose={() => {
          setIsLeaveModalOpen(false);
          setSelectedLeave(null);
        }}
        onConfirm={handleConfirmDeleteLeave}
        message={`Delete leave request #${selectedLeave?.id || ""}?`}
      />

      <ConfirmModal
        isOpen={isHolidayModalOpen}
        onClose={() => {
          setIsHolidayModalOpen(false);
          setSelectedHoliday(null);
        }}
        onConfirm={handleConfirmDeleteHoliday}
        message={`Delete holiday ${selectedHoliday?.name || ""}?`}
      />
    </div>
  );
}

export default LeavesPage;