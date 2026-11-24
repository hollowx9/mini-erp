const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const {
  getPermissionRequests,
  createPermissionRequest,
  updatePermissionStatus,
} = require("../controllers/permissionController");

router.use(authMiddleware);

router.get("/", getPermissionRequests);

router.post("/", createPermissionRequest);

router.patch("/:id/status", updatePermissionStatus);

module.exports = router;