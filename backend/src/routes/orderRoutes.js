const express = require("express");
const router = express.Router();

const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} = require("../controllers/orderController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.use(authMiddleware);

router.get("/", roleMiddleware("admin", "user"), getAllOrders);
router.get("/:id", roleMiddleware("admin", "user"), getOrderById);
router.post("/", roleMiddleware("admin", "user"), createOrder);
router.put("/:id", roleMiddleware("admin", "user"), updateOrder);
router.delete("/:id", roleMiddleware("admin"), deleteOrder);

module.exports = router;