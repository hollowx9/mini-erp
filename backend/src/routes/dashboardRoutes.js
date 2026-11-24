const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getSalesAnalytics,
  getRecentOrders,
} = require("../controllers/dashboardController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.use(authMiddleware);

router.get("/", roleMiddleware("admin", "user"), getDashboardStats);
router.get("/analytics", roleMiddleware("admin", "user"), getSalesAnalytics);
router.get("/recent-orders", roleMiddleware("admin", "user"), getRecentOrders);

module.exports = router;