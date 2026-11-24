const db = require("../config/db");

const getHolidays = async (req, res) => {
  try {
    const [holidays] = await db.promise().query(`
      SELECT
        id,
        name,
        holiday_date AS holidayDate,
        created_at AS createdAt
      FROM holidays
      ORDER BY holiday_date ASC
    `);

    res.status(200).json(holidays);
  } catch (error) {
    console.error("Get holidays error:", error);
    res.status(500).json({ message: "Failed to fetch holidays" });
  }
};

const createHoliday = async (req, res) => {
  const { name, holidayDate } = req.body;

  if (!name || !holidayDate) {
    return res.status(400).json({
      message: "Holiday name and date are required",
    });
  }

  try {
    const [result] = await db.promise().query(
      `
      INSERT INTO holidays (name, holiday_date)
      VALUES (?, ?)
      `,
      [name, holidayDate]
    );

    res.status(201).json({
      message: "Holiday created successfully",
      holiday: {
        id: result.insertId,
        name,
        holidayDate,
      },
    });
  } catch (error) {
    console.error("Create holiday error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        message: "A holiday already exists on this date",
      });
    }

    res.status(500).json({ message: "Failed to create holiday" });
  }
};

const updateHoliday = async (req, res) => {
  const { id } = req.params;
  const { name, holidayDate } = req.body;

  if (!name || !holidayDate) {
    return res.status(400).json({
      message: "Holiday name and date are required",
    });
  }

  try {
    const [holidayRows] = await db.promise().query(
      "SELECT id FROM holidays WHERE id = ?",
      [id]
    );

    if (holidayRows.length === 0) {
      return res.status(404).json({ message: "Holiday not found" });
    }

    await db.promise().query(
      `
      UPDATE holidays
      SET name = ?, holiday_date = ?
      WHERE id = ?
      `,
      [name, holidayDate, id]
    );

    res.status(200).json({
      message: "Holiday updated successfully",
      holiday: {
        id: Number(id),
        name,
        holidayDate,
      },
    });
  } catch (error) {
    console.error("Update holiday error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        message: "A holiday already exists on this date",
      });
    }

    res.status(500).json({ message: "Failed to update holiday" });
  }
};

const deleteHoliday = async (req, res) => {
  const { id } = req.params;

  try {
    const [holidayRows] = await db.promise().query(
      "SELECT id FROM holidays WHERE id = ?",
      [id]
    );

    if (holidayRows.length === 0) {
      return res.status(404).json({ message: "Holiday not found" });
    }

    await db.promise().query("DELETE FROM holidays WHERE id = ?", [id]);

    res.status(200).json({ message: "Holiday deleted successfully" });
  } catch (error) {
    console.error("Delete holiday error:", error);
    res.status(500).json({ message: "Failed to delete holiday" });
  }
};

module.exports = {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
};