const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = require("../middlewares/uploadFile");

const {
  getCompanyEmployeesNames,
  getCompanyEmployees,
  deleteCompanyEmployee,
  getEmployeeInfo,
  addEmployeeField,
  updateEmployeeField,
  deleteEmployeeField,
  updatePersonalInfo,
  createFolder,
  uploadFile,
  deleteFile,
  changeFolderAccessibility,
  getFoldersAndFiles,
  uploadProfilePicture,
  getSignableFiles,
  createSignatureRequest,
  getNotifications,
  getAllFiles,
  getOrganizationChart,
} = require("../controllers/employee");
const { protect } = require("../middlewares/auth");

router
  .route("/getCompanyEmployeesNames/:companyId")
  .get(protect, getCompanyEmployeesNames);

router
  .route("/getCompanyEmployees/:companyId")
  .get(protect, getCompanyEmployees);

router
  .route("/deleteEmployee/:employeeId")
  .delete(protect, deleteCompanyEmployee);

router.route("/:employeeId/info").get(protect, getEmployeeInfo);

router
  .route("/:employeeId")
  .post(protect, addEmployeeField)
  .put(protect, updateEmployeeField)
  .delete(protect, deleteEmployeeField);

router
  .route("/:employeeId/uploadProfilePicture")
  .post(protect, upload.single("image"), uploadProfilePicture);

router
  .route("/updatePersonalInfo/:employeeId")
  .put(protect, updatePersonalInfo);

router
  .route("/:employeeId/:companyId/folders")
  .get(protect, getFoldersAndFiles);
router.route("/:employeeId/folders").post(protect, createFolder);
router
  .route("/:employeeId/folders/:folderId/files")
  .post(protect, upload.single("file"), uploadFile);

router.route("/:companyId/allFoldersAndFiles").get(protect, getAllFiles);

router
  .route("/:employeeId/folders/:folderId/files/:fileId")
  .delete(protect, deleteFile);

router
  .route("/:employeeId/folders/:folderId/accessibility")
  .put(protect, changeFolderAccessibility);

router.route("/:companyId/:employeeId/files").get(protect, getSignableFiles);
router
  .route("/:employeeId/requestSignature")
  .post(protect, createSignatureRequest);

router.route("/:companyId/getNotifications").get(protect, getNotifications);

router
  .route("/:companyId/getOrganizationChart")
  .get(protect, getOrganizationChart);

module.exports = router;
