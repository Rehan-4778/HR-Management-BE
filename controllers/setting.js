const User = require("../models/User");
const Role = require("../models/Role");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/async");
const EmployeeProfile = require("../models/EmployeeProfile");
const Company = require("../models/Company");
const EmployeeFields = require("../models/EmployeeFields");
const Holiday = require("../models/Holiday");

// @desc      Get employee fields for company
// @route     GET /api/v1/setting/companyEmployeeFields/:companyId
// @access    Private
exports.getCompanyEmployeeFields = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const userId = req.user.id;

  const user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
  });

  if (!user) {
    return next(new ErrorResponse(`User not found`, 404));
  }

  //   check companyId in EmployeeFields and return the fields
  const company = await Company.findById(companyId);

  if (!company) {
    return next(new ErrorResponse(`Company not found`, 404));
  }

  const employeeFields =
    (await EmployeeFields.findOne({ company: companyId }).select(
      "-_id -company"
    )) || {};

  res.status(200).json({ success: true, data: employeeFields });
});

// desc     Add employee fields for company
// @route   POST /api/v1/setting/companyEmployeeFields/:companyId
// @access  Private

exports.addCompanyEmployeeFields = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const { fieldName, fieldValue } = req.body;
  const userId = req.user.id;

  // find role of user in company
  const role = await Role.findOne({ name: "owner" });

  const user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
    "companies.role": role._id,
  });

  if (!user) {
    return next(new ErrorResponse(`You are not allowed to add fields`, 401));
  }

  const allowedFields = [
    "degree",
    "department",
    "division",
    "employmentStatus",
    "jobTitle",
    "visaType",
    "assetCategory",
  ];

  if (!allowedFields.includes(fieldName)) {
    return next(new ErrorResponse(`Invalid field name`, 400));
  }

  // update the employee fields
  const employeeFields = await EmployeeFields.findOne({ company: companyId });

  if (!employeeFields) {
    return next(
      new ErrorResponse(`Employee fields not found for this company`, 404)
    );
  }

  const field = { label: fieldValue, value: fieldValue };

  employeeFields[fieldName].push(field);

  await employeeFields.save();

  res.status(200).json({ success: true, data: employeeFields });
});

// desc     Update employee fields for company
// @route   PUT /api/v1/setting/companyEmployeeFields/:companyId
// @access  Private

exports.updateCompanyEmployeeFields = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const { fieldName, fieldId, fieldValue } = req.body;
  const userId = req.user.id;

  // find role of user in company
  const role = await Role.findOne({ name: "owner" });

  const user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
    "companies.role": role._id,
  });

  if (!user) {
    return next(new ErrorResponse(`You are not allowed to update fields`, 401));
  }

  const allowedFields = [
    "degree",
    "department",
    "division",
    "employmentStatus",
    "jobTitle",
    "visaType",
    "assetCategory",
  ];

  if (!allowedFields.includes(fieldName)) {
    return next(new ErrorResponse(`Invalid field name`, 400));
  }

  // update the employee fields
  const employeeFields = await EmployeeFields.findOne({ company: companyId });

  if (!employeeFields) {
    return next(
      new ErrorResponse(`Employee fields not found for this company`, 404)
    );
  }

  const field = employeeFields[fieldName].filter((field) =>
    field._id.equals(fieldId)
  );

  if (field.length === 0) {
    return next(new ErrorResponse(`Field not found`, 404));
  }

  employeeFields[fieldName] = employeeFields[fieldName].map((field) => {
    if (field._id.toString() === fieldId) {
      field.label = fieldValue;
      field.value = fieldValue;
    }
    return field;
  });

  await employeeFields.save();

  res.status(200).json({ success: true, data: employeeFields });
});

// desc     Delete employee fields for company
// @route   DELETE /api/v1/setting/companyEmployeeFields/:companyId
// @access  Private

exports.deleteCompanyEmployeeFields = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const { fieldName, fieldId } = req.body;
  const userId = req.user.id;

  // find role of user in company
  const role = await Role.findOne({ name: "owner" });

  const user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
    "companies.role": role._id,
  });

  if (!user) {
    return next(new ErrorResponse(`You are not allowed to delete fields`, 401));
  }

  const allowedFields = [
    "degree",
    "department",
    "division",
    "employmentStatus",
    "jobTitle",
    "visaType",
    "assetCategory",
  ];

  if (!allowedFields.includes(fieldName)) {
    return next(new ErrorResponse(`Invalid field name`, 400));
  }

  // update the employee fields
  const employeeFields = await EmployeeFields.findOne({ company: companyId });

  if (!employeeFields) {
    return next(
      new ErrorResponse(`Employee fields not found for this company`, 404)
    );
  }

  const field = employeeFields[fieldName].filter(
    (field) => field._id.toString() === fieldId
  );

  if (field.length === 0) {
    return next(new ErrorResponse(`Field not found`, 404));
  }

  employeeFields[fieldName] = employeeFields[fieldName].filter(
    (field) => field._id.toString() !== fieldId
  );

  await employeeFields.save();

  res.status(200).json({ success: true, data: employeeFields });
});

// desc               Get company information
// @route             GET /api/v1/setting/company/:companyId
// @access            Private

exports.getCompanyInfo = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const userId = req.user.id;

  const company = await Company.findById(companyId);
  if (!company) {
    return next(new ErrorResponse(`Company not found`, 404));
  }

  // get employees of the company with their profiles
  const employees = await EmployeeProfile.find({ company: companyId }).select(
    "firstName middleName lastName _id"
  );

  // now find the owner of the company
  const role = await Role.findOne({ name: "owner" });

  const user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
    "companies.role": role._id,
  });

  if (!user) {
    return next(new ErrorResponse(`User not found`, 404));
  }

  const owner = user.companies.find((c) => c.company.equals(companyId)).profile;

  console.log(owner);

  res.status(200).json({ success: true, data: { employees, owner } });
});

//  desc          Update company information
// @route         PUT /api/v1/setting/companyInfo/:companyId
// @access        Private
exports.updateCompanyInfo = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const userId = req.user.id;
  const { name, owner, employeeCount, country } = req.body;

  const company = await Company.findById(companyId);
  if (!company) {
    return next(new ErrorResponse(`Company not found`, 404));
  }

  const ownerRole = await Role.findOne({ name: "owner" });
  if (!ownerRole) {
    return next(new ErrorResponse(`Role 'owner' not found`, 404));
  }

  const user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
    "companies.role": ownerRole._id,
  });

  if (!user) {
    return next(new ErrorResponse(`You are not allowed`, 404));
  }

  console.log(req.file);
  if (req.file) {
    company.image = req.file.location;
  }

  company.name = name;
  company.employeeCount = employeeCount;
  company.country = country;
  await company.save();

  // Check if the owner is being updated
  const previousOwnerProfileId = user.companies.find((c) =>
    c.company.equals(companyId)
  ).profile;

  var newOwnerProfile = null;
  if (!previousOwnerProfileId.equals(owner)) {
    // Find the previous owner user
    const previousOwnerUser = await User.findOne({
      "companies.company": companyId,
      "companies.profile": previousOwnerProfileId,
    });

    // Find the new owner profile
    newOwnerProfile = await EmployeeProfile.findOne({ _id: owner });
    if (!newOwnerProfile) {
      return next(new ErrorResponse(`New owner not found`, 404));
    }

    console.log(owner, "owner");
    // Find the new owner user
    const newOwnerUser = await User.findOne({
      "companies.company": companyId,
      "companies.profile": owner,
    });

    if (!newOwnerUser) {
      return next(
        new ErrorResponse(`Employee has not completed onboarding`, 404)
      );
    }

    if (previousOwnerUser) {
      // Remove the 'owner' role from the previous owner
      previousOwnerUser.companies = previousOwnerUser.companies.map((c) => {
        if (c.company.equals(companyId)) {
          c.role = null;
        }
        return c;
      });
      await previousOwnerUser.save();
    }

    // Update the new owner role to 'owner'
    newOwnerUser.companies = newOwnerUser.companies.map((c) => {
      if (c.company.equals(companyId)) {
        c.role = ownerRole._id;
      }
      return c;
    });
    await newOwnerUser.save();
  }

  res.status(200).json({
    success: true,
    data: {
      owner: newOwnerProfile?._id || owner,
      company,
    },
  });
});

// desc     Get company permissions
// @route   GET /api/v1/setting/:companyId/permissions
// @access  Private

exports.getCompanyPermissions = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const userId = req.user.id;

  const company = await Company.findById(companyId);
  if (!company) {
    return next(new ErrorResponse(`Company not found`, 404));
  }

  const user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
  });

  if (!user) {
    return next(new ErrorResponse(`User not found`, 404));
  }

  res.status(200).json({ success: true, data: company.permissions });
});

// desc     Update company permissions
// @route   PUT /api/v1/setting/:companyId/permissions
// @access  Private
exports.updateCompanyPermissions = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const userId = req.user.id;
  const { permissionName, approver, specificPerson } = req.body;

  const company = await Company.findById(companyId);

  if (!company) {
    return next(new ErrorResponse(`Company not found`, 404));
  }

  const user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
  });

  if (!user) {
    return next(new ErrorResponse(`User not found`, 404));
  }

  // this user should be the owner of the company
  const ownerRole = await Role.findOne({ name: "owner" });

  const owner = user.companies.find((c) => c.company.equals(companyId));

  if (!owner.role.equals(ownerRole._id)) {
    return next(
      new ErrorResponse(`You are not allowed to update permissions`, 401)
    );
  }

  const allowedPermissions = [
    "informationUpdates",
    "timeOffRequests",
    "employmentStatus",
    "jobInformation",
    "promotion",
    "assetRequest",
  ];

  if (!allowedPermissions.includes(permissionName)) {
    return next(new ErrorResponse(`Invalid permission name`, 400));
  }
  const permissionUpdate = {
    approver: approver,
    specificPerson: approver === "specific" ? specificPerson : null,
  };

  company.permissions[permissionName] = permissionUpdate;

  await company.save();

  res.status(200).json({ success: true, data: company.permissions });
});

// desc     Add Holiday for company
// @route   POST /api/v1/setting/holidays
// @access  Private
exports.addHoliday = asyncHandler(async (req, res, next) => {
  const { name, date, description, isRecurring, companyId } = req.body;
  const userId = req.user.id;

  // Check if the user is authorized to add holidays for the company
  const user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
  });

  if (!user) {
    return next(
      new ErrorResponse("You are not authorized to manage holidays", 403)
    );
  }

  const holiday = await Holiday.create({
    name,
    date,
    description,
    isRecurring,
    companyId,
    // createdBy: userId,
  });

  res.status(201).json({
    success: true,
    message: "Holiday created successfully",
    data: holiday,
  });
});

// desc     Get Holidays for company
// @route   GET /api/v1/setting/holidays/:companyId
// @access  Private
exports.getHolidays = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;

  const holidays = await Holiday.find({ companyId });

  res.status(200).json({
    success: true,
    data: holidays,
  });
});

// desc     Update Holidays
// @route   PUT /api/v1/setting/holidays/:holidayId
// @access  Private
exports.updateHoliday = asyncHandler(async (req, res, next) => {
  const { holidayId } = req.params;
  const { name, date, description, isRecurring } = req.body;

  const holiday = await Holiday.findById(holidayId);

  if (!holiday) {
    return next(new ErrorResponse("Holiday not found", 404));
  }

  Object.assign(holiday, { name, date, description, isRecurring });
  await holiday.save();

  res.status(200).json({
    success: true,
    message: "Holiday updated successfully",
    data: holiday,
  });
});

// desc     Delete Holiday
// @route   PUT /api/v1/setting/holidays/:holidayId
// @access  Private
exports.deleteHoliday = asyncHandler(async (req, res, next) => {
  const { holidayId } = req.params;

  const holiday = await Holiday.findById(holidayId);

  if (!holiday) {
    return next(new ErrorResponse("Holiday not found", 404));
  }

  await holiday.deleteOne();

  res.status(200).json({
    success: true,
    message: "Holiday removed successfully",
  });
});
