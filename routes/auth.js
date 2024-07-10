const express = require("express");
const router = express.Router();

const {
  register,
  login,
  selectCompany,
  logout,
  addEmployee,
  sendOnboardingInvite,
} = require("../controllers/auth");
const { protect } = require("../middlewares/auth");

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/selectcompany").post(protect, selectCompany);
router.route("/addEmployee").post(addEmployee);
router.route("/logout").get(logout);
// router.route("/me").get(protect, getMe);
// router.route("/updatedetails").put(protect, updateDetails);
// router.route("/updatepassword").put(protect, updatePassword);
// router.route("/forgetpassword").post(forgetPassword);
// router.route("/resetpassword/:resettoken").put(resetPassword);

module.exports = router;
