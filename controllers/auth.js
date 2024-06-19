const User = require("../models/User");
const Company = require("../models/Company");
const Role = require("../models/Role");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/async");
// const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

// @description       Register company and make admin user
// @route             POST  api/v1/auth/register
// @access            Public
exports.register = asyncHandler(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    password,
    jobTitle,
    companyName,
    phone,
    employeeCount,
    country,
    domain,
  } = req.body;

  const existingCompany = await Company.findOne({
    domain,
  });

  if (existingCompany) {
    return next(
      new ErrorResponse("Company already exists with this domain", 400)
    );
  }

  // Create company
  const company = await Company.create({
    name: companyName,
    domain,
    employeeCount,
    country,
  });

  const role = await Role.findOne({ name: "admin" });
  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    jobTitle,
    phone,
    role: role._id,
    company: company._id,
  });

  // send token response
  sendTokenResponse(user, 200, `Account has been created successfully.`, res);
});

// @description       Login user
// @route             POST  api/v1/auth/:domain/login
// @access            Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const domain = req.params.domain;

  // Validate email and password
  if (!email || !password) {
    return next(new ErrorResponse("Please provide an email and password", 400));
  }

  if (!domain) {
    return next(new ErrorResponse("Please provide a domain", 400));
  }

  // Check for company
  const company = await Company.findOne({
    domain,
  });

  if (!company) {
    return next(new ErrorResponse("Invalid domain", 400));
  }

  // Check for user
  const user = await User.findOne({
    email,
    company: company._id,
  }).select("+password");

  if (!user) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  // check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  // send token response
  sendTokenResponse(user, 200, `Login successful.`, res);
});

// @description       Send Token
const sendTokenResponse = (user, statusCode, message, res) => {
  const token = user.getSignedJwtToken();

  // set cookie options
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ), // convert to ms
    httpOnly: true, // cookie cannot be accessed by the browser
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    message,
    token,
  });
};
