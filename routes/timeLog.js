const express = require("express");
const router = express.Router();

const {
  updateTimeLog,
  getWorkLog,
  getTimeLogs,
} = require("../controllers/timeLog");
const { protect } = require("../middlewares/auth");

router.route("/:employeeId/updateTimeLog").post(protect, updateTimeLog);
router.route("/:companyId/:employeeId/getWorkLog").get(protect, getWorkLog);
router.route("/:companyId/:employeeId/getTimeLogs").get(protect, getTimeLogs);

module.exports = router;
