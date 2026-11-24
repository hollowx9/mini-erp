const express = require("express");
const router = express.Router();

const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeeController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.use(authMiddleware);

router.get("/", roleMiddleware("admin", "user"), getAllEmployees);
router.get("/:id", roleMiddleware("admin", "user"), getEmployeeById);
router.post("/", roleMiddleware("admin"), createEmployee);
router.put("/:id", roleMiddleware("admin"), updateEmployee);
router.delete("/:id", roleMiddleware("admin"), deleteEmployee);

module.exports = router;