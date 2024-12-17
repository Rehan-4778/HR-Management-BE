const express = require("express");
const router = express.Router();

const {
  requestTimeOff,
  approveDenyTimeOff,
  updateLeaveBalance,
  addPublicHoliday,
  getTimeOffRequests,
  getTimeOffDetails,
  deleteTimeOffRequest,
} = require("../controllers/timeOff");
const { protect } = require("../middlewares/auth");

router.route("/:employeeId/request-time-off").post(protect, requestTimeOff);
router
  .route("/:employeeId/delete-time-off/:requestId")
  .delete(protect, deleteTimeOffRequest);

router.route("/time-off-requests/:requestId").put(protect, approveDenyTimeOff);
router
  .route("/:employeeId/update-leave-balance")
  .put(protect, updateLeaveBalance);

router.route("/:companyId/add-public-holiday").post(protect, addPublicHoliday);

// GET /api/v1/timeOff/:companyId/:employeeId/get-time-off-details
router
  .route("/:companyId/:employeeId/get-time-off-details")
  .get(protect, getTimeOffDetails);

router
  .route("/:companyId/:employeeId/get-time-off-requests")
  .get(protect, getTimeOffRequests);

module.exports = router;
