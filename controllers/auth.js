const User = require("../models/User");
const Company = require("../models/Company");
const Role = require("../models/Role");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/async");
const sendEmail = require("../utils/sendEmail");
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
    user.companies,
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

  sendTokenResponse(
    user,
    companies,
    user.companies[0].role,
    200,
    "Logged in successfully.",
    res
  );
  // res.status(200).json({
  //   success: true,
  //   message: "Logged in successfully.",
  //   companies,
  // });
});

// @description       Select company
// @route             POST  api/v1/auth/selectcompany
// @access            Private
exports.selectCompany = asyncHandler(async (req, res, next) => {
  const { companyId } = req.body;

  if (!req.user.id) {
    return next(new ErrorResponse("User not found", 404));
  }

  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  const userCompany = user.companies.find((c) => c.company.equals(companyId));

  if (!userCompany) {
    return next(new ErrorResponse("Company not found for this user", 404));
  }

  // Populate the role field for the specific company
  await User.populate(user, [
    {
      path: `companies.${user.companies.indexOf(userCompany)}.role`,
      model: "Role",
    },
    {
      path: `companies.${user.companies.indexOf(userCompany)}.company`,
      model: "Company",
    },
  ]);

  res.status(200).json({
    success: true,
    message: "Company selected successfully.",
    company: userCompany,
  });
});

// @description       Add employee
// @route             POST  api/v1/auth/addEmployee
// @access            Private

exports.addEmployee = asyncHandler(async (req, res, next) => {
  const {
    companyId,
    employeeId,
    firstName,
    middleName,
    lastName,
    dob,
    gender,
    maritalStatus,
    ssn,
    street1,
    street2,
    city,
    state,
    zip,
    country,
    paySchedule,
    payType,
    payRate,
    payRateUnit,
    ethnicity,
    workPhone,
    mobilePhone,
    workEmail,
    homeEmail,
    hiringDate,
    employmentStatus,
    jobTitle,
    reportsTo,
    department,
    division,
    location,
    loginAccess,
  } = req.body;

  const company = await Company.findById(companyId);

  if (!company) {
    return next(new ErrorResponse("Company not found", 404));
  }

  let newEmployeeId;

  if (employeeId) {
    const isEmpIdExist = await EmployeeProfile.findOne({
      company: companyId,
      employeeId,
    });

    if (isEmpIdExist) {
      return next(new ErrorResponse("Employee Id already exists", 400));
    } else {
      newEmployeeId = employeeId;
    }
  } else {
    const employeeCount = await EmployeeProfile.countDocuments({
      company: companyId,
    });

    newEmployeeId = employeeCount + 1;
  }

  const employeeProfile = await EmployeeProfile.create({
    employeeId: newEmployeeId,
    firstName,
    middleName,
    lastName,
    dob,
    gender,
    maritalStatus,
    ssn,
    street1,
    street2,
    city,
    state,
    zip,
    country,
    paySchedule,
    payType,
    payRate,
    payRateUnit,
    ethnicity,
    workPhone,
    mobilePhone,
    workEmail,
    homeEmail,
    hiringDate,
    employmentStatus,
    jobTitle,
    reportsTo,
    department,
    division,
    location,
    loginAccess,
    company: companyId,
  });

  res.status(200).json({
    success: true,
    message: "Employee added successfully.",
    employeeProfile,
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
  employeeProfile.onboardingTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 1 day to expire

  await employeeProfile.save();

  // send onboarding email
  const message = `You are receiving this email because you (or someone else) has requested to onboard you to ${company.name}.\n\n Please click on the following link to complete the onboarding process:\n\n${clientUrl}/onboarding/${hashedOnboardingToken}\n\n If you did not request this, please ignore this email.`;

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

// @description       Onboard Register
// @route             POST  api/v1/auth/onboardRegister
// @access            Public

exports.onboardRegister = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, phone, onboardingToken } =
    req.body;

  if (!onboardingToken) {
    return next(new ErrorResponse("Invalid token", 400));
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(onboardingToken)
    .digest("hex");

  const employeeProfile = await EmployeeProfile.findOne({
    onboardingToken: hashedToken,
    onboardingTokenExpires: { $gt: Date.now() },
  });

  if (!employeeProfile) {
    return next(new ErrorResponse("Invalid token", 400));
  }

  const user = await User.findOne({
    email,
  });

  if (user) {
    return next(new ErrorResponse("User already exists", 400));
  }

  const role = await Role.findOne({ name: "employee" });

  // Create user
  user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    companies: [
      {
        company: employeeProfile.company,
        role: role._id,
        profile: employeeProfile._id,
      },
    ],
  });

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

// @description       Logout user
// @route             GET  api/v1/auth/logout
// @access            Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

// @description       Send Token
const sendTokenResponse = (user, companies, role, statusCode, message, res) => {
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
    user,
    companies,
    token,
  });
};
