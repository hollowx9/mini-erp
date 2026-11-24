const express = require("express");
const router = express.Router();

const {
  getLeaveBalances,
  setLeaveBalance,
} = require("../controllers/leaveBalanceController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.use(authMiddleware);

router.get("/", roleMiddleware("admin", "user"), getLeaveBalances);
router.post("/", roleMiddleware("admin"), setLeaveBalance);

module.exports = router;