const User = require("../models/User");
const Company = require("../models/Company");
const Role = require("../models/Role");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/async");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const EmployeeProfile = require("../models/EmployeeProfile");
const LeaveType = require("../models/LeaveType");
const LeavePolicy = require("../models/LeavePolicy");
const EmployeeFields = require("../models/EmployeeFields");
const constants = require("../constants/employeeFieldsConst");

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

  const defaultPermissions = {
    informationUpdates: { approver: "manager" },
    timeOffRequests: { approver: "manager" },
    employmentStatus: { approver: "manager" },
    jobInformation: { approver: "manager" },
    promotion: { approver: "manager" },
    assetRequest: { approver: "manager" },
  };

  // Create company
  const company = await Company.create({
    name: companyName,
    domain,
    employeeCount,
    country,
    permissions: defaultPermissions,
  });

  // Create leave policy
  const leaveTypes = await LeaveType.insertMany([
    { name: "Sick", defaultHours: 56 },
    { name: "Vacation", defaultHours: 56 },
    { name: "Bereavement" },
    { name: "Paternity" },
  ]);

  const leavePolicy = new LeavePolicy({
    company: company._id,
    name: "Fixed Policy",
    leaveTypes: leaveTypes.map((leaveType) => leaveType._id),
  });
  await leavePolicy.save();

  let empCount = await EmployeeProfile.countDocuments({
    company: company._id,
  });

  let newEmployeeId = empCount + 1;

  const role = await Role.findOne({ name: "owner" });
  // Create employee profile
  const employeeProfile = await EmployeeProfile.create({
    employeeId: newEmployeeId,
    firstName,
    lastName,
    workEmail: email,
    mobilePhone: phone,
    jobTitle,
    company: company._id,
    jobInformation: [{ effectiveDate: Date.now(), jobTitle }],
    loginAccess: true,
    leavePolicy: leavePolicy._id,
    leaveBalances: leaveTypes.map((leaveType) => ({
      leaveType: leaveType._id,
      remainingHours: leaveType.defaultHours,
    })),
  });

  console.log(employeeProfile, "employeeProfile");

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
  }
  await user.save();

  console.log(user, "user");

  // Create EmployeeFields
  await EmployeeFields.create({
    company: company._id,
    degree: constants.degree,
    department: constants.department,
    division: constants.division,
    employmentStatus: constants.employmentStatus,
    jobTitle: constants.jobTitle,
    visaType: constants.visaType,
    assetCategory: constants.assetCategory,
  });

  // send user without password
  user = await User.findById(user._id).select("-password");

  const companies = await Company.find({
    _id: { $in: user.companies.map((c) => c.company) },
  });

  sendTokenResponse(
    user,
    companies,
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
  let user = await User.findOne({
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

  // remove password and company from user object
  user = await User.findOne({
    email,
  }).select("-password");

  sendTokenResponse(user, companies, 200, "Logged in successfully.", res);
});

// @description       Select company
// @route             POST  api/v1/auth/selectcompany
// @access            Private
exports.selectCompany = asyncHandler(async (req, res, next) => {
  const { companyId } = req.body;

  console.log("companyId", companyId);
  console.log("userID", req.user.id);

  if (!req.user.id) {
    return next(new ErrorResponse("User not found", 404));
  }

  const user = await User.findById(req.user.id);
  console.log(user, "user");
  console.log(companyId, "companyId");

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  console.log(user.companies);
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
    {
      path: `companies.${user.companies.indexOf(userCompany)}.profile`,
      model: "EmployeeProfile",
      select: "employeeId loginAccess firstName lastName jobInformation image",
    },
  ]);

  if (userCompany.profile.loginAccess === false) {
    return next(
      new ErrorResponse("You are not allowed to login to this company", 403)
    );
  }

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
    secondaryLanguage,
    hiringDate,
    paySchedule,
    payType,
    payRate,
    payRateUnit,
    workPhone,
    mobilePhone,
    workEmail,
    homeEmail,
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

  let manager;
  if (reportsTo) {
    const isManagerExist = await EmployeeProfile.findOne({
      company: companyId,
      _id: reportsTo,
    });

    if (!isManagerExist) {
      return next(new ErrorResponse("Manager not found", 404));
    }

    manager = reportsTo;
  } else {
    // get the owner of the company as the manager
    const ownerRole = await Role.findOne({ name: "owner" });
    const owner = await User.findOne({
      "companies.company": companyId,
      "companies.role": ownerRole._id,
    });

    if (!owner) {
      return next(new ErrorResponse("Owner not found", 404));
    }

    const ownerProfile = owner.companies.find((c) =>
      c.company.equals(companyId)
    ).profile;

    if (!ownerProfile) {
      return next(
        new ErrorResponse("Owner profile not found for this company", 404)
      );
    }

    manager = ownerProfile;
  }

  const leavePolicy = await LeavePolicy.findOne({
    company: companyId,
  });

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
    hiringDate,
    workPhone,
    mobilePhone,
    workEmail,
    homeEmail,
    loginAccess,
    company: companyId,

    jobInformation: [
      {
        effectiveDate: hiringDate,
        location,
        division,
        department,
        jobTitle,
        reportsTo: manager,
      },
    ],
    employmentStatusHistory: [
      {
        effectiveDate: hiringDate,
        employmentStatus,
        comment: "N/A",
      },
    ],

    compensationHistory: [
      {
        effectiveDate: hiringDate,
        paySchedule,
        payType,
        payRate,
        payRateUnit,
        changeReason: "N/A",
        comment: "N/A",
      },
    ],

    leavePolicy: leavePolicy._id,
    leaveBalances: leavePolicy.leaveTypes.map((leaveType) => ({
      leaveType: leaveType,
      remainingHours: leaveType.defaultHours,
    })),
  });

  res.status(200).json({
    success: true,
    message: "Employee added successfully.",
    employeeProfile,
  });
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
const sendTokenResponse = (user, companies, statusCode, message, res) => {
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
    user,
    companies,
    token,
  });
};
