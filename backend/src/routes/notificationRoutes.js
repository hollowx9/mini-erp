const express = require("express");

const router = express.Router();

const {
  getNotifications,
  markNotificationAsRead,
} = require("../controllers/notificationController");

const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

router.get("/", getNotifications);

router.patch("/:id/read", markNotificationAsRead);

module.exports = router;