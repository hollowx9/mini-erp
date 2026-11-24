const db = require("../config/db");

const getNotifications = async (req, res) => {
  try {
    const [notifications] = await db.promise().query(
      `
      SELECT *
      FROM notifications
      WHERE user_id = ?
      ORDER BY id DESC
      `,
      [req.user.id]
    );

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      message: "Failed to fetch notifications",
    });
  }
};

const markNotificationAsRead = async (req, res) => {
  const { id } = req.params;

  try {
    await db.promise().query(
      `
      UPDATE notifications
      SET is_read = true
      WHERE id = ? AND user_id = ?
      `,
      [id, req.user.id]
    );

    res.status(200).json({
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Mark notification error:", error);
    res.status(500).json({
      message: "Failed to update notification",
    });
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
};