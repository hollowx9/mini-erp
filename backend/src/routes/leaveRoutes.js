const express = require("express");
const router = express.Router();

const {
  getAllLeaveRequests,
  createLeaveRequest,
  updateLeaveRequest,
  updateLeaveStatus,
  deleteLeaveRequest,
} = require("../controllers/leaveController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.use(authMiddleware);

router.get("/", roleMiddleware("admin", "user"), getAllLeaveRequests);
router.post("/", roleMiddleware("admin", "user"), createLeaveRequest);
router.put("/:id", roleMiddleware("admin", "user"), updateLeaveRequest);

router.patch("/:id/status", roleMiddleware("admin"), updateLeaveStatus);
router.delete("/:id", roleMiddleware("admin"), deleteLeaveRequest);

module.exports = router;