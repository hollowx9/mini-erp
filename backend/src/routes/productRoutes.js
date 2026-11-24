const express = require("express");
const router = express.Router();

const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.use(authMiddleware);

router.get("/", roleMiddleware("admin", "user"), getAllProducts);
router.post("/", roleMiddleware("admin"), createProduct);
router.put("/:id", roleMiddleware("admin"), updateProduct);
router.delete("/:id", roleMiddleware("admin"), deleteProduct);

module.exports = router;