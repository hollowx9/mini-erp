const express = require("express");
const router = express.Router();

const {
  getAllPayments,
  getFinanceSummary,
  createPayment,
  updatePayment,
  deletePayment,
} = require("../controllers/paymentController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.use(authMiddleware);

router.get("/", roleMiddleware("admin", "user"), getAllPayments);
router.get("/summary", roleMiddleware("admin", "user"), getFinanceSummary);
router.post("/", roleMiddleware("admin"), createPayment);
router.put("/:id", roleMiddleware("admin"), updatePayment);
router.delete("/:id", roleMiddleware("admin"), deletePayment);

module.exports = router;