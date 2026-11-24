const db = require("../config/db");

const createNotification = async (
  userId,
  title,
  message,
  type = "permission"
) => {
  await db.promise().query(
    `
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type
    )
    VALUES (?, ?, ?, ?)
    `,
    [userId, title, message, type]
  );
};

const notifyAdmins = async (title, message) => {
  const [admins] = await db.promise().query(
    "SELECT id FROM users WHERE role = 'admin'"
  );

  for (const admin of admins) {
    await createNotification(admin.id, title, message);
  }
};

const calculatePermissionHours = (startTime, endTime) => {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  return (endTotalMinutes - startTotalMinutes) / 60;
};

const getPermissionRequests = async (req, res) => {
  try {
    let query = `
      SELECT
        pr.id,
        pr.employee_id AS employeeId,
        e.full_name AS employeeName,
        pr.permission_date AS permissionDate,
        pr.start_time AS startTime,
        pr.end_time AS endTime,
        pr.reason,
        pr.status,
        pr.created_at AS createdAt
      FROM permission_requests pr
      INNER JOIN employees e
      ON e.id = pr.employee_id
    `;

    const values = [];

    if (req.user.role === "user") {
      query += ` WHERE pr.employee_id = ?`;
      values.push(req.user.id);
    }

    query += ` ORDER BY pr.id DESC`;

    const [rows] = await db.promise().query(query, values);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Get permissions error:", error);

    res.status(500).json({
      message: "Failed to fetch permission requests",
    });
  }
};

const createPermissionRequest = async (req, res) => {
  let { employeeId, permissionDate, startTime, endTime, reason } = req.body;

  if (req.user.role === "user") {
    employeeId = req.user.id;
  }

  if (!employeeId || !permissionDate || !startTime || !endTime) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  const durationHours = calculatePermissionHours(startTime, endTime);

  if (durationHours <= 0) {
    return res.status(400).json({
      message: "End time must be after start time",
    });
  }

  if (durationHours > 2) {
    return res.status(400).json({
      message: "Permission request cannot exceed 2 hours",
    });
  }

  try {
    const [employeeRows] = await db.promise().query(
      `
      SELECT id, full_name
      FROM employees
      WHERE id = ?
      `,
      [employeeId]
    );

    if (employeeRows.length === 0) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const employee = employeeRows[0];

    await db.promise().query(
      `
      INSERT INTO permission_requests (
        employee_id,
        permission_date,
        start_time,
        end_time,
        reason
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [employeeId, permissionDate, startTime, endTime, reason || null]
    );

    await notifyAdmins(
      "New Permission Request",
      `${employee.full_name} submitted a permission request`
    );

    res.status(201).json({
      message: "Permission request created successfully",
    });
  } catch (error) {
    console.error("Create permission error:", error);

    res.status(500).json({
      message: "Failed to create permission request",
    });
  }
};

const updatePermissionStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({
      message: "Invalid status",
    });
  }

  try {
    const [rows] = await db.promise().query(
      `
      SELECT
        pr.employee_id AS employeeId,
        e.full_name AS employeeName
      FROM permission_requests pr
      INNER JOIN employees e
      ON e.id = pr.employee_id
      WHERE pr.id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Permission request not found",
      });
    }

    const permission = rows[0];

    await db.promise().query(
      `
      UPDATE permission_requests
      SET status = ?
      WHERE id = ?
      `,
      [status, id]
    );

    await createNotification(
      permission.employeeId,
      "Permission Request Updated",
      `Your permission request was ${status}`
    );

    res.status(200).json({
      message: `Permission request ${status}`,
    });
  } catch (error) {
    console.error("Update permission error:", error);

    res.status(500).json({
      message: "Failed to update permission request",
    });
  }
};

module.exports = {
  getPermissionRequests,
  createPermissionRequest,
  updatePermissionStatus,
};