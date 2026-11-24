const express = require("express");
const router = express.Router();

const {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} = require("../controllers/holidayController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.use(authMiddleware);

router.get("/", roleMiddleware("admin", "user"), getHolidays);
router.post("/", roleMiddleware("admin"), createHoliday);
router.put("/:id", roleMiddleware("admin"), updateHoliday);
router.delete("/:id", roleMiddleware("admin"), deleteHoliday);

module.exports = router;