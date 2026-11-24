const db = require("../config/db");

const calculateLeaveDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const diffTime = end.getTime() - start.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  return diffDays + 1;
};

const getLeaveBalances = async (req, res) => {
  try {
    const [employees] = await db.promise().query(`
      SELECT
        e.id AS employeeId,
        e.full_name AS employeeName,
        COALESCE(lb.total_days, 25) AS totalDays
      FROM employees e
      LEFT JOIN leave_balances lb ON lb.employee_id = e.id
      ORDER BY e.full_name ASC
    `);

    const [approvedLeaves] = await db.promise().query(`
      SELECT
        employee_id AS employeeId,
        start_date AS startDate,
        end_date AS endDate
      FROM leave_requests
      WHERE status = 'approved'
    `);

    const balances = employees.map((employee) => {
      const employeeLeaves = approvedLeaves.filter(
        (leave) => Number(leave.employeeId) === Number(employee.employeeId)
      );

      const usedDays = employeeLeaves.reduce((total, leave) => {
        return total + calculateLeaveDays(leave.startDate, leave.endDate);
      }, 0);

      const totalDays = Number(employee.totalDays);
      const remainingDays = totalDays - usedDays;

      return {
        employeeId: employee.employeeId,
        employeeName: employee.employeeName,
        totalDays,
        usedDays,
        remainingDays,
      };
    });

    res.status(200).json(balances);
  } catch (error) {
    console.error("Get leave balances error:", error);
    res.status(500).json({ message: "Failed to fetch leave balances" });
  }
};

const setLeaveBalance = async (req, res) => {
  const { employeeId, totalDays } = req.body;

  if (!employeeId || totalDays === undefined) {
    return res.status(400).json({
      message: "Employee and total days are required",
    });
  }

  if (Number(totalDays) < 0) {
    return res.status(400).json({
      message: "Total days cannot be negative",
    });
  }

  try {
    const [employeeRows] = await db.promise().query(
      "SELECT id FROM employees WHERE id = ?",
      [employeeId]
    );

    if (employeeRows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await db.promise().query(
      `
      INSERT INTO leave_balances (employee_id, total_days)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE total_days = VALUES(total_days)
      `,
      [employeeId, totalDays]
    );

    res.status(200).json({
      message: "Leave balance updated successfully",
      balance: {
        employeeId: Number(employeeId),
        totalDays: Number(totalDays),
      },
    });
  } catch (error) {
    console.error("Set leave balance error:", error);
    res.status(500).json({ message: "Failed to update leave balance" });
  }
};

module.exports = {
  getLeaveBalances,
  setLeaveBalance,
};