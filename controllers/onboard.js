const User = require("../models/User");
const Company = require("../models/Company");
const Role = require("../models/Role");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/async");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const EmployeeProfile = require("../models/EmployeeProfile");

// @description         Check expiry time of onboarding token
// @route               GET /api/v1/auth/onboardExpireTime/:onboardingToken
// @access              Public
exports.checkOnboardExpiry = asyncHandler(async (req, res, next) => {
  const { onboardingToken } = req.params;

  if (!onboardingToken) {
    return next(new ErrorResponse("Invalid token", 400));
  }

  const employeeProfile = await EmployeeProfile.findOne({
    onboardingToken,
    onboardingTokenExpires: { $gt: Date.now() },
  });

  if (!employeeProfile) {
    return next(new ErrorResponse("Invite token expired", 400));
  }

  const company = await Company.findById(employeeProfile.company);

  res.status(200).json({
    success: true,
    data: company.name,
  });
});

// @description       Onboard Register
// @route             POST  api/v1/auth/onboardRegister
// @access            Public
exports.onboardRegister = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, phone } = req.body;

  let user = await User.findOne({
    email,
  });

  if (user) {
    return next(new ErrorResponse("User already exists", 400));
  }

  // Create user
  user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
  });

  // send user without password
  user = await User.findById(user._id).select("-password");

  // generate token
  const token = user.getSignedJwtToken();
  res.status(200).json({
    success: true,
    message: "Registered successfully",
    token,
    user,
  });
});

// @description       Onboard Login
// @route             POST  api/v1/auth/onboardLogin
// @access            Public
exports.onboardLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse("Please provide an email and password", 400));
  }

  let user = await User.findOne({
    email,
  });

  if (!user) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  // exclude password from user object
  user = await User.findById(user._id).select("-password");

  // generate token
  const token = user.getSignedJwtToken();
  res.status(200).json({
    success: true,
    message: "Logged in successfully.",
    token,
    user,
  });
});

// @description       Send Onboarding Invite
// @route             POST  api/v1/auth/sendOnboardingInvite
// @access            Private

exports.sendOnboardingInvite = asyncHandler(async (req, res, next) => {
  const { email, companyId, employeeId } = req.body;
  const clientUrl = process.env.Client_URL;

  const company = await Company.findById(companyId);

  if (!company) {
    return next(new ErrorResponse("Company not found", 404));
  }

  const employeeProfile = await EmployeeProfile.findOne({
    company: companyId,
    employeeId,
  });

  if (!employeeProfile) {
    return next(new ErrorResponse("Employee not found", 404));
  }

  // generate an onboarding token
  const onboardingToken = crypto.randomBytes(20).toString("hex");
  const hashedOnboardingToken = crypto
    .createHash("sha256")
    .update(onboardingToken)
    .digest("hex");

  employeeProfile.onboardingToken = hashedOnboardingToken;
  employeeProfile.onboardingTokenExpires = Date.now() + 24 * 60 * 60 * 1000;

  await employeeProfile.save();

  // send onboarding email
  const message = `You are receiving this email because you (or someone else) has requested to onboard you to ${company.name}.\n\n Please click on the following link to complete the onboarding process:\n\n${clientUrl}/onboard/${hashedOnboardingToken}\n\n If you did not request this, please ignore this email.`;

  const options = {
    email,
    subject: "Onboarding Invite from " + company.name + " Company",
    message,
  };

  try {
    await sendEmail(options);

    res.status(200).json({
      success: true,
      message: "Onboarding email sent successfully.",
    });
  } catch (error) {
    console.log(error);
    employeeProfile.onboardingToken = undefined;
    employeeProfile.onboardingTokenExpires = undefined;

    await employeeProfile.save();

    return next(new ErrorResponse("Email could not be sent", 500));
  }
});

// @description       Accept Onboarding
// @route             Get api/v1/auth/onboard/
// @access            Public
exports.acceptOnboardingInvite = asyncHandler(async (req, res, next) => {
  const { onboardingToken } = req.body;

  const userId = req?.user?.id;

  if (!onboardingToken) {
    return next(new ErrorResponse("Invalid token", 400));
  }

  const employeeProfile = await EmployeeProfile.findOne({
    onboardingToken,
    onboardingTokenExpires: { $gt: Date.now() },
  });

  if (!employeeProfile) {
    return next(new ErrorResponse("Invite token expired", 400));
  }

  const user = await User.findById(userId);

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  // this is user.companies
  //   companies: [
  //     {
  //       company: company._id,
  //       role: role._id,
  //       profile: employeeProfile._id,
  //     },
  //   ],

  employeeProfile.onboardingToken = undefined;
  employeeProfile.onboardingTokenExpires = undefined;

  await employeeProfile.save();

  user.companies.push({
    company: employeeProfile.company,
    role: employeeProfile.role,
    profile: employeeProfile._id,
  });

  await user.save();

  res.status(200).json({
    success: true,
    message: "Onboarding successful.",
    data: employeeProfile,
  });
});
