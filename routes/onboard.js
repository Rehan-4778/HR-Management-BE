const express = require("express");
const router = express.Router();

const {
  checkOnboardExpiry,
  onboardRegister,
  onboardLogin,
  sendOnboardingInvite,
  acceptOnboardingInvite,
} = require("../controllers/onboard");
const { protect } = require("../middlewares/auth");

router.route("/sendOnboardingInvite").post(sendOnboardingInvite);
router.route("/checkOnboardExpiry/:onboardingToken").get(checkOnboardExpiry);
router.route("/onboardRegister").post(onboardRegister);
router.route("/onboardLogin").post(onboardLogin);
router.route("/acceptOnboardingInvite").post(protect, acceptOnboardingInvite);

module.exports = router;
