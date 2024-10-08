const express = require("express");
const router = express.Router();
const upload = require("../middlewares/uploadFile");

const {
  getCompanyEmployeeFields,
  addCompanyEmployeeFields,
  updateCompanyEmployeeFields,
  deleteCompanyEmployeeFields,
  getCompanyInfo,
  updateCompanyInfo,
  getCompanyPermissions,
  updateCompanyPermissions,
} = require("../controllers/setting");
const { protect } = require("../middlewares/auth");

router
  .route("/companyEmployeeFields/:companyId")
  .get(protect, getCompanyEmployeeFields)
  .post(protect, addCompanyEmployeeFields)
  .put(protect, updateCompanyEmployeeFields)
  .delete(protect, deleteCompanyEmployeeFields);

router
  .route("/companyInfo/:companyId")
  .get(protect, getCompanyInfo)
  .put(protect, upload.single("image"), updateCompanyInfo);

router
  .route("/:companyId/permissions")
  .get(protect, getCompanyPermissions)
  .put(protect, updateCompanyPermissions);

module.exports = router;
