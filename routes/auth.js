const express = require("express");
const router = express.Router();

const {
  register,
  login,
  selectCompany,
  //   getMe,
  //   updateDetails,
  //   updatePassword,
  //   forgetPassword,
  //   resetPassword,
  //   logout,
} = require("../controllers/auth");
// const { protect } = require("../middlewares/auth");

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/selectcompany").post(selectCompany);
// router.route("/me").get(protect, getMe);
// router.route("/updatedetails").put(protect, updateDetails);
// router.route("/updatepassword").put(protect, updatePassword);
// router.route("/forgetpassword").post(forgetPassword);
// router.route("/resetpassword/:resettoken").put(resetPassword);
// router.route("/logout").get(logout);

module.exports = router;
