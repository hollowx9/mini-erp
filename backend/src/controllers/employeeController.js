const db = require("../config/db");

const getAllEmployees = (req, res) => {
  const query = `
    SELECT 
      id,
      full_name AS fullName,
      email,
      phone,
      position,
      salary,
      created_at AS createdAt
    FROM employees
    ORDER BY id DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Get employees error:", err);
      return res.status(500).json({ message: "Failed to fetch employees" });
    }

    res.status(200).json(results);
  });
};

const getEmployeeById = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      id,
      full_name AS fullName,
      email,
      phone,
      position,
      salary,
      created_at AS createdAt
    FROM employees
    WHERE id = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Get employee by id error:", err);
      return res.status(500).json({ message: "Failed to fetch employee" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json(results[0]);
  });
};

const createEmployee = (req, res) => {
  const { fullName, email, phone, position, salary } = req.body;

  if (!fullName || !email || !phone || !position || !salary) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const checkEmailQuery = `SELECT id FROM employees WHERE email = ?`;

  db.query(checkEmailQuery, [email], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Check email error:", checkErr);
      return res.status(500).json({ message: "Failed to validate employee" });
    }

    if (checkResults.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const insertQuery = `
      INSERT INTO employees (full_name, email, phone, position, salary)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      insertQuery,
      [fullName, email, phone, position, salary],
      (insertErr, result) => {
        if (insertErr) {
          console.error("Create employee error:", insertErr);
          return res.status(500).json({ message: "Failed to create employee" });
        }

        res.status(201).json({
          message: "Employee created successfully",
          employee: {
            id: result.insertId,
            fullName,
            email,
            phone,
            position,
            salary,
          },
        });
      }
    );
  });
};

const updateEmployee = (req, res) => {
  const { id } = req.params;
  const { fullName, email, phone, position, salary } = req.body;

  if (!fullName || !email || !phone || !position || !salary) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const checkEmployeeQuery = `SELECT id FROM employees WHERE id = ?`;

  db.query(checkEmployeeQuery, [id], (checkErr, employeeResults) => {
    if (checkErr) {
      console.error("Check employee error:", checkErr);
      return res.status(500).json({ message: "Failed to validate employee" });
    }

    if (employeeResults.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const checkEmailQuery = `
      SELECT id 
      FROM employees 
      WHERE email = ? AND id != ?
    `;

    db.query(checkEmailQuery, [email, id], (emailErr, emailResults) => {
      if (emailErr) {
        console.error("Check duplicate email error:", emailErr);
        return res.status(500).json({ message: "Failed to validate email" });
      }

      if (emailResults.length > 0) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const updateQuery = `
        UPDATE employees
        SET full_name = ?, email = ?, phone = ?, position = ?, salary = ?
        WHERE id = ?
      `;

      db.query(
        updateQuery,
        [fullName, email, phone, position, salary, id],
        (updateErr) => {
          if (updateErr) {
            console.error("Update employee error:", updateErr);
            return res.status(500).json({ message: "Failed to update employee" });
          }

          res.status(200).json({
            message: "Employee updated successfully",
            employee: {
              id: Number(id),
              fullName,
              email,
              phone,
              position,
              salary,
            },
          });
        }
      );
    });
  });
};

const deleteEmployee = (req, res) => {
  const { id } = req.params;

  const checkQuery = `SELECT id FROM employees WHERE id = ?`;

  db.query(checkQuery, [id], (checkErr, results) => {
    if (checkErr) {
      console.error("Check employee before delete error:", checkErr);
      return res.status(500).json({ message: "Failed to validate employee" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const deleteQuery = `DELETE FROM employees WHERE id = ?`;

    db.query(deleteQuery, [id], (deleteErr) => {
      if (deleteErr) {
        console.error("Delete employee error:", deleteErr);
        return res.status(500).json({ message: "Failed to delete employee" });
      }

      res.status(200).json({ message: "Employee deleted successfully" });
    });
  });
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};