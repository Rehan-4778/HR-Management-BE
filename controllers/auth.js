const User = require("../models/User");
const Company = require("../models/Company");
const Role = require("../models/Role");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/async");
// const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const EmployeeProfile = require("../models/EmployeeProfile");

// @description       Register company and make admin user
// @route             POST  api/v1/auth/register
// @access            Public
exports.register = asyncHandler(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    password,
    phone,
    jobTitle,
    companyName,
    employeeCount,
    country,
    domain,
  } = req.body;

  let user = await User.findOne({ email });

  if (user) {
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return next(
        new ErrorResponse("Incorrect password for existing user", 400)
      );
    }
  }

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
  // Create employee profile
  const employeeProfile = await EmployeeProfile.create({
    firstName,
    lastName,
    email,
    jobTitle,
    company: company._id,
  });

  if (!user) {
    // Create user
    user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      companies: [
        {
          company: company._id,
          role: role._id,
          profile: employeeProfile._id,
        },
      ],
    });
  } else {
    user.companies.push({
      company: company._id,
      role: role._id,
      profile: employeeProfile._id,
    });

    await user.save();
  }

  // send user without password
  user = await User.findById(user._id).select("-password");

  sendTokenResponse(
    user,
    role._id,
    200,
    `Account has been created successfully.`,
    res
  );
});

// @description       Login user
// @route             POST  api/v1/auth/login
// @access            Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email and password
  if (!email || !password) {
    return next(new ErrorResponse("Please provide an email and password", 400));
  }

  // Check for user
  const user = await User.findOne({
    email,
  });

  if (!user) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  // check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  const companies = await Company.find({
    _id: { $in: user.companies.map((c) => c.company) },
  });

  res.status(200).json({
    success: true,
    message: "Logged in successfully.",
    companies,
  });
});

// @description       Select company
// @route             POST  api/v1/auth/selectcompany
// @access            Private
exports.selectCompany = asyncHandler(async (req, res, next) => {
  const { companyId } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  const companyRole = user.companies.find((c) => c.company.equals(companyId));

  if (!companyRole) {
    return next(new ErrorResponse("Company not found for ", 404));
  }

  sendTokenResponse(
    user,
    companyRole.role,
    200,
    `Company selected successfully.`,
    res
  );
});

// @description       Send Token
const sendTokenResponse = (user, role, statusCode, message, res) => {
  const token = user.getSignedJwtToken(role);

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
