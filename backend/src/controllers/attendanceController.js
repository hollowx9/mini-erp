const db = require("../config/db");

const getAllAttendance = async (req, res) => {
  try {
    const query = `
      SELECT
        a.id,
        a.employee_id AS employeeId,
        e.full_name AS employeeName,
        a.date,
        a.status,
        a.created_at AS createdAt
      FROM attendance a
      INNER JOIN employees e ON e.id = a.employee_id
      ORDER BY a.date DESC, a.id DESC
    `;

    const [results] = await db.promise().query(query);
    res.status(200).json(results);
  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({ message: "Failed to fetch attendance records" });
  }
};

const createAttendance = async (req, res) => {
  const { employeeId, date, status } = req.body;

  if (!employeeId || !date || !status) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (!["present", "absent", "late"].includes(status)) {
    return res.status(400).json({ message: "Invalid attendance status" });
  }

  try {
    const [employeeRows] = await db.promise().query(
      `
        SELECT id
        FROM employees
        WHERE id = ?
      `,
      [employeeId]
    );

    if (employeeRows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const [existingRows] = await db.promise().query(
      `
        SELECT id
        FROM attendance
        WHERE employee_id = ? AND date = ?
      `,
      [employeeId, date]
    );

    if (existingRows.length > 0) {
      return res.status(400).json({
        message: "Attendance already exists for this employee on this date",
      });
    }

    const [result] = await db.promise().query(
      `
        INSERT INTO attendance (employee_id, date, status)
        VALUES (?, ?, ?)
      `,
      [employeeId, date, status]
    );

    res.status(201).json({
      message: "Attendance created successfully",
      attendance: {
        id: result.insertId,
        employeeId: Number(employeeId),
        date,
        status,
      },
    });
  } catch (error) {
    console.error("Create attendance error:", error);
    res.status(500).json({ message: "Failed to create attendance" });
  }
};

const updateAttendance = async (req, res) => {
  const { id } = req.params;
  const { employeeId, date, status } = req.body;

  if (!employeeId || !date || !status) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (!["present", "absent", "late"].includes(status)) {
    return res.status(400).json({ message: "Invalid attendance status" });
  }

  try {
    const [attendanceRows] = await db.promise().query(
      `
        SELECT id
        FROM attendance
        WHERE id = ?
      `,
      [id]
    );

    if (attendanceRows.length === 0) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    const [employeeRows] = await db.promise().query(
      `
        SELECT id
        FROM employees
        WHERE id = ?
      `,
      [employeeId]
    );

    if (employeeRows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const [duplicateRows] = await db.promise().query(
      `
        SELECT id
        FROM attendance
        WHERE employee_id = ? AND date = ? AND id != ?
      `,
      [employeeId, date, id]
    );

    if (duplicateRows.length > 0) {
      return res.status(400).json({
        message: "Another attendance record already exists for this employee on this date",
      });
    }

    await db.promise().query(
      `
        UPDATE attendance
        SET employee_id = ?, date = ?, status = ?
        WHERE id = ?
      `,
      [employeeId, date, status, id]
    );

    res.status(200).json({
      message: "Attendance updated successfully",
      attendance: {
        id: Number(id),
        employeeId: Number(employeeId),
        date,
        status,
      },
    });
  } catch (error) {
    console.error("Update attendance error:", error);
    res.status(500).json({ message: "Failed to update attendance" });
  }
};

const deleteAttendance = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.promise().query(
      `
        SELECT id
        FROM attendance
        WHERE id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    await db.promise().query(
      `
        DELETE FROM attendance
        WHERE id = ?
      `,
      [id]
    );

    res.status(200).json({ message: "Attendance deleted successfully" });
  } catch (error) {
    console.error("Delete attendance error:", error);
    res.status(500).json({ message: "Failed to delete attendance" });
  }
};

module.exports = {
  getAllAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
};