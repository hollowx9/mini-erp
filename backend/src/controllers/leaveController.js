const db = require("../config/db");

const createNotification = async (userId, title, message, type = "info") => {
  await db.promise().query(
    `
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (?, ?, ?, ?)
    `,
    [userId, title, message, type]
  );
};

const notifyAdmins = async (title, message, type = "info") => {
  const [admins] = await db.promise().query(
    "SELECT id FROM users WHERE role = 'admin'"
  );

  for (const admin of admins) {
    await createNotification(admin.id, title, message, type);
  }
};

const formatDateForMysql = (date) => {
  return date.toISOString().split("T")[0];
};

const getDatesBetween = (startDate, endDate) => {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  current.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

const validateLeaveDates = async (startDate, endDate) => {
  const dates = getDatesBetween(startDate, endDate);

  for (const date of dates) {
    if (date.getDay() === 0) {
      return {
        valid: false,
        message: "Leave request cannot include a Sunday",
      };
    }
  }

  const formattedDates = dates.map(formatDateForMysql);

  const placeholders = formattedDates.map(() => "?").join(",");

  const [holidayRows] = await db.promise().query(
    `
    SELECT holiday_date AS holidayDate
    FROM holidays
    WHERE holiday_date IN (${placeholders})
    `,
    formattedDates
  );

  if (holidayRows.length > 0) {
    return {
      valid: false,
      message: "Leave request cannot include a holiday",
    };
  }

  return {
    valid: true,
  };
};

const getAllLeaveRequests = async (req, res) => {
  try {
    let query = `
      SELECT
        lr.id,
        lr.employee_id AS employeeId,
        e.full_name AS employeeName,
        lr.start_date AS startDate,
        lr.end_date AS endDate,
        lr.reason,
        lr.status,
        lr.created_at AS createdAt
      FROM leave_requests lr
      INNER JOIN employees e ON e.id = lr.employee_id
    `;

    const values = [];

    if (req.user.role === "user") {
      query += ` WHERE lr.employee_id = ?`;
      values.push(req.user.id);
    }

    query += ` ORDER BY lr.id DESC`;

    const [requests] = await db.promise().query(query, values);

    res.status(200).json(requests);
  } catch (error) {
    console.error("Get leave requests error:", error);
    res.status(500).json({ message: "Failed to fetch leave requests" });
  }
};

const createLeaveRequest = async (req, res) => {
  let { employeeId, startDate, endDate, reason } = req.body;

  if (req.user.role === "user") {
    employeeId = req.user.id;
  }

  if (!employeeId || !startDate || !endDate) {
    return res.status(400).json({
      message: "Employee, start date and end date are required",
    });
  }

  if (new Date(startDate) > new Date(endDate)) {
    return res.status(400).json({
      message: "Start date cannot be after end date",
    });
  }

  try {
    const validation = await validateLeaveDates(startDate, endDate);

    if (!validation.valid) {
      return res.status(400).json({
        message: validation.message,
      });
    }

    const [employeeRows] = await db.promise().query(
      "SELECT id, full_name FROM employees WHERE id = ?",
      [employeeId]
    );

    if (employeeRows.length === 0) {
      return res.status(404).json({
        message:
          "Employee profile not found. The user ID must match an employee ID.",
      });
    }

    const employee = employeeRows[0];

    const [result] = await db.promise().query(
      `
      INSERT INTO leave_requests (
        employee_id,
        start_date,
        end_date,
        reason,
        status
      )
      VALUES (?, ?, ?, ?, 'pending')
      `,
      [employeeId, startDate, endDate, reason || null]
    );

    await notifyAdmins(
      "New Leave Request",
      `${employee.full_name} submitted a leave request`,
      "leave"
    );

    res.status(201).json({
      message: "Leave request created successfully",
      leaveRequest: {
        id: result.insertId,
        employeeId: Number(employeeId),
        startDate,
        endDate,
        reason: reason || "",
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Create leave request error:", error);
    res.status(500).json({ message: "Failed to create leave request" });
  }
};

const updateLeaveRequest = async (req, res) => {
  const { id } = req.params;
  let { employeeId, startDate, endDate, reason } = req.body;

  if (req.user.role === "user") {
    employeeId = req.user.id;
  }

  if (!employeeId || !startDate || !endDate) {
    return res.status(400).json({
      message: "Employee, start date and end date are required",
    });
  }

  if (new Date(startDate) > new Date(endDate)) {
    return res.status(400).json({
      message: "Start date cannot be after end date",
    });
  }

  try {
    const validation = await validateLeaveDates(startDate, endDate);

    if (!validation.valid) {
      return res.status(400).json({
        message: validation.message,
      });
    }

    let leaveQuery =
      "SELECT id, employee_id AS employeeId, status FROM leave_requests WHERE id = ?";
    const leaveValues = [id];

    if (req.user.role === "user") {
      leaveQuery += " AND employee_id = ?";
      leaveValues.push(req.user.id);
    }

    const [leaveRows] = await db.promise().query(leaveQuery, leaveValues);

    if (leaveRows.length === 0) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    const leaveRequest = leaveRows[0];

    if (leaveRequest.status !== "pending") {
      return res.status(400).json({
        message: "Only pending leave requests can be edited",
      });
    }

    const [employeeRows] = await db.promise().query(
      "SELECT id FROM employees WHERE id = ?",
      [employeeId]
    );

    if (employeeRows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await db.promise().query(
      `
      UPDATE leave_requests
      SET employee_id = ?, start_date = ?, end_date = ?, reason = ?
      WHERE id = ?
      `,
      [employeeId, startDate, endDate, reason || null, id]
    );

    res.status(200).json({ message: "Leave request updated successfully" });
  } catch (error) {
    console.error("Update leave request error:", error);
    res.status(500).json({ message: "Failed to update leave request" });
  }
};

const updateLeaveStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({
      message: "Status must be approved or rejected",
    });
  }

  try {
    const [leaveRows] = await db.promise().query(
      `
      SELECT
        lr.id,
        lr.employee_id AS employeeId,
        e.full_name AS employeeName
      FROM leave_requests lr
      INNER JOIN employees e ON e.id = lr.employee_id
      WHERE lr.id = ?
      `,
      [id]
    );

    if (leaveRows.length === 0) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    const leave = leaveRows[0];

    await db.promise().query(
      `
      UPDATE leave_requests
      SET status = ?
      WHERE id = ?
      `,
      [status, id]
    );

    await createNotification(
      leave.employeeId,
      "Leave Request Updated",
      `Your leave request was ${status}`,
      "leave"
    );

    res.status(200).json({
      message: `Leave request ${status} successfully`,
    });
  } catch (error) {
    console.error("Update leave status error:", error);
    res.status(500).json({ message: "Failed to update leave status" });
  }
};

const deleteLeaveRequest = async (req, res) => {
  const { id } = req.params;

  try {
    const [leaveRows] = await db.promise().query(
      "SELECT id FROM leave_requests WHERE id = ?",
      [id]
    );

    if (leaveRows.length === 0) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    await db.promise().query("DELETE FROM leave_requests WHERE id = ?", [id]);

    res.status(200).json({ message: "Leave request deleted successfully" });
  } catch (error) {
    console.error("Delete leave request error:", error);
    res.status(500).json({ message: "Failed to delete leave request" });
  }
};

module.exports = {
  getAllLeaveRequests,
  createLeaveRequest,
  updateLeaveRequest,
  updateLeaveStatus,
  deleteLeaveRequest,
};