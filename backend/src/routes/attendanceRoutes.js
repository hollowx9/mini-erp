const express = require("express");
const router = express.Router();

const {
  getAllAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
} = require("../controllers/attendanceController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.use(authMiddleware);

router.get("/", roleMiddleware("admin", "user"), getAllAttendance);
router.post("/", roleMiddleware("admin"), createAttendance);
router.put("/:id", roleMiddleware("admin"), updateAttendance);
router.delete("/:id", roleMiddleware("admin"), deleteAttendance);

module.exports = router;