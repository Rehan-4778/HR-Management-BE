const User = require("../models/User");
const Company = require("../models/Company");
const Role = require("../models/Role");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/async");
const sendEmail = require("../utils/sendEmail");
const EmployeeProfile = require("../models/EmployeeProfile");
const Folder = require("../models/Folder");
const File = require("../models/File");
const upload = require("../middlewares/uploadFile");
const Notification = require("../models/Notification");

// @description       Get company employees names
// @route             GET  api/v1/employee/getCompanyEmployeesNames/:companyId
// @access            Private
exports.getCompanyEmployeesNames = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const companyId = req.params.companyId;

  // check if this user is part of the company
  const user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
  });

  if (!user) {
    return next(new ErrorResponse("User is not part of this company", 401));
  }

  const employees = await EmployeeProfile.find({
    company: companyId,
  }).select("firstName middleName lastName");

  res.status(200).json({
    success: true,
    data: employees,
  });
});

// @description       Get company employees
// @route             GET  api/v1/employee/getCompanyEmployees/:companyId
// @access            Private
exports.getCompanyEmployees = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const companyId = req.params.companyId;

  // check if this user is part of the company
  const user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
  });

  if (!user) {
    return next(new ErrorResponse("User is not part of this company", 401));
  }

  let employees = await EmployeeProfile.find({
    company: companyId,
  });

  if (employees && employees.length > 0) {
    employees = employees.map((employee) => {
      const employeeObject = employee.toObject();
      if (employeeObject?.jobInformation?.length > 0) {
        employeeObject.jobInformation.sort(
          (a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate)
        );
      }
      return employeeObject;
    });
  }
  res.status(200).json({
    success: true,
    data: employees,
  });
});

// @description       Get employee info
// @route             GET  api/v1/employee/:employeeId/info?companyId=companyId
// @access            Private

exports.getEmployeeInfo = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const employeeId = req.params.employeeId;
  const { companyId } = req.query;

  // Check if this user is part of the company
  let user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
  });

  if (!user) {
    return next(new ErrorResponse("User is not part of this company", 401));
  }

  // Find the employee with the specified employeeId and companyId
  const employee = await EmployeeProfile.findOne({
    employeeId,
    company: companyId,
  }).populate("jobInformation.reportsTo");

  if (!employee) {
    return next(new ErrorResponse("Employee not found", 404));
  }

  res.status(200).json({
    success: true,
    data: employee,
  });
});

// @description       Add employee
// @route             POST  api/v1/employee/employeeInfo/:employeeId
// @access            Private
exports.addEmployeeField = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const employeeId = req.params.employeeId;
  const { companyId, fieldName, fieldValue } = req.body;

  // check if this user is part of the company and get user's profile for the company
  let user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
  });

  if (!user) {
    return next(new ErrorResponse("User is not part of this company", 401));
  }

  const allowedFields = [
    "jobInformation",
    "education",
    "visaInfo",
    "employmentStatusHistory",
    "compensationHistory",
    "bonuses",
    "assets",
  ];

  if (!allowedFields.includes(fieldName)) {
    return next(new ErrorResponse("Field name is not allowed", 400));
  }

  // only the owner of the company or manager can add employee field
  let userCompany = user.companies.find((c) => c.company.equals(companyId));

  const employee = await EmployeeProfile.findOne({
    employeeId,
    company: companyId,
  });

  if (!employee) {
    return next(new ErrorResponse("Employee not found", 404));
  }

  const owner = await Role.findOne({ name: "owner" });
  const isManager =
    employee.jobInformation?.length > 0
      ? employee.jobInformation[0].reportsTo?.equals(userCompany.profile)
      : false;

  if (userCompany.role.equals(owner._id) || isManager) {
    employee[fieldName].push(fieldValue);
    await employee.save();

    res.status(200).json({
      success: true,
      data: employee,
    });
  } else {
    return next(
      new ErrorResponse("User is not authorized to add employee field", 401)
    );
  }
});

exports.deleteEmployeeField = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const employeeId = req.params.employeeId;
  const { companyId, fieldName, fieldId } = req.body;

  // check if this user is part of the company and get user's profile for the company
  let user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
  });

  if (!user) {
    return next(new ErrorResponse("User is not part of this company", 401));
  }

  const allowedFields = [
    "jobInformation",
    "education",
    "visaInfo",
    "employmentStatusHistory",
    "compensationHistory",
    "bonuses",
    "assets",
  ];

  if (!allowedFields.includes(fieldName)) {
    return next(new ErrorResponse("Field name is not allowed", 400));
  }

  // only the owner of the company or manager can add employee field
  let userCompany = user.companies.find((c) => c.company.equals(companyId));

  const employee = await EmployeeProfile.findOne({
    employeeId,
    company: companyId,
  });

  if (!employee) {
    return next(new ErrorResponse("Employee not found", 404));
  }

  const owner = await Role.findOne({ name: "owner" });
  const isManager =
    employee.jobInformation?.length > 0
      ? employee.jobInformation[0].reportsTo?.equals(userCompany.profile)
      : false;

  if (userCompany.role.equals(owner._id) || isManager) {
    const fieldArray = employee[fieldName];
    const index = fieldArray.findIndex((item) => item._id.equals(fieldId));

    if (index === -1) {
      return next(new ErrorResponse("Field item not found", 404));
    }

    fieldArray.splice(index, 1);
    await employee.save();

    res.status(200).json({
      success: true,
      data: employee,
      message: `${
        fieldName.charAt(0).toUpperCase() + fieldName.slice(1).slice(0, -1)
      } deleted successfully`,
    });
  } else {
    return next(
      new ErrorResponse("User is not authorized to delete employee field", 401)
    );
  }
});

// @description       Update employee info
// @route             PUT  api/v1/employee/:employeeId
// @access            Private
exports.updateEmployeeField = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const employeeId = req.params.employeeId;
  const { companyId, fieldName, fieldId, fieldValue } = req.body;

  // check if this user is part of the company and get user's profile for the company
  let user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
  });

  if (!user) {
    return next(new ErrorResponse("User is not part of this company", 401));
  }

  const allowedFields = [
    "jobInformation",
    "education",
    "visaInfo",
    "employmentStatusHistory",
    "compensationHistory",
    "bonuses",
    "assets",
  ];

  if (!allowedFields.includes(fieldName)) {
    return next(new ErrorResponse("Field name is not allowed", 400));
  }

  // only the owner of the company or manager can update employee info
  let userCompany = user.companies.find((c) => c.company.equals(companyId));

  const employee = await EmployeeProfile.findOne({
    employeeId,
    company: companyId,
  });

  if (!employee) {
    return next(new ErrorResponse("Employee not found", 404));
  }

  const owner = await Role.findOne({ name: "owner" });
  const isManager =
    employee.jobInformation?.length > 0
      ? employee.jobInformation[0].reportsTo?.equals(userCompany.profile)
      : false;

  if (userCompany.role.equals(owner._id) || isManager) {
    const itemIndex = employee[fieldName].findIndex((item) =>
      item._id.equals(fieldId)
    );

    if (itemIndex === -1) {
      return next(new ErrorResponse("Field item not found", 404));
    }

    employee[fieldName][itemIndex] = fieldValue;

    await employee.save();

    res.status(200).json({
      success: true,
      data: employee,
    });
  } else {
    return next(
      new ErrorResponse("User is not authorized to update employee info", 401)
    );
  }
});

exports.updatePersonalInfo = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const employeeId = req.params.employeeId;
  const { companyId, personalInfo, updateKey } = req.body;

  // check if this user is part of the company and get user's profile for the company
  let user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
  });

  if (!user) {
    return next(new ErrorResponse("User is not part of this company", 401));
  }

  // only the owner of the company or manager can update employee info
  let userCompany = user.companies.find((c) => c.company.equals(companyId));

  let employee = await EmployeeProfile.findOne({
    employeeId,
    company: companyId,
  });

  if (!employee) {
    return next(new ErrorResponse("Employee not found", 404));
  }

  const owner = await Role.findOne({ name: "owner" });
  const isManager =
    employee.jobInformation?.length > 0
      ? employee.jobInformation[0].reportsTo?.equals(userCompany.profile)
      : false;

  if (userCompany.role.equals(owner._id) || isManager) {
    if (updateKey === "hiringDate") {
      employee.hiringDate = new Date(personalInfo.hiringDate);
    } else {
      if (personalInfo.image) {
        employee.image = personalInfo.image;
      }
      employee.city = personalInfo.city;
      employee.country = personalInfo.country;
      employee.education = personalInfo.education;
      employee.employeeId = personalInfo.employeeId;
      employee.firstName = personalInfo.firstName;
      employee.middleName = personalInfo.middleName;
      employee.gender = personalInfo.gender;
      employee.homeEmail = personalInfo.homeEmail;
      employee.lastName = personalInfo.lastName;
      employee.maritalStatus = personalInfo.maritalStatus;
      employee.mobilePhone = personalInfo.mobilePhone;
      employee.ssn = personalInfo.ssn;
      employee.state = personalInfo.state;
      employee.street1 = personalInfo.street1;
      employee.street2 = personalInfo.street2;
      employee.workEmail = personalInfo.workEmail;
      employee.workPhone = personalInfo.workPhone;
      employee.zip = personalInfo.zip;
      employee.dob = new Date(personalInfo.dob);
      employee.loginAccess = personalInfo.status === "active";
      employee.education = personalInfo.education;
    }

    await employee.save();
    res.status(200).json({
      success: true,
      data: employee,
    });
  } else {
    return next(
      new ErrorResponse("User is not authorized to update employee info", 401)
    );
  }
});

// description       Create folder
// route             POST  api/v1/employee/:employeeId/folders
// access            Private
exports.createFolder = asyncHandler(async (req, res, next) => {
  const { employeeId } = req.params;
  const { name, description, companyId } = req.body;
  const userId = req.user.id;

  const user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
  });

  if (!user) {
    return next(new ErrorResponse("User is not part of this company", 401));
  }

  const createrProfile = user.companies.find((c) =>
    c.company.equals(companyId)
  ).profile;

  const employee = await EmployeeProfile.findOne({
    employeeId,
    company: companyId,
  });

  if (!employee) {
    return next(new ErrorResponse("Employee not found", 404));
  }

  const newFolder = {
    name,
    createdBy: createrProfile,
    createdFor: employee._id,
    description,
  };

  const folder = await Folder.create(newFolder);
  employee.documents.push(folder);

  await employee.save();

  res.status(201).json({
    success: true,
    data: employee.documents,
  });
});

// description       Upload file
// route             POST  api/v1/employee/:employeeId/folders/:folderId/files
// access            Private
exports.uploadFile = asyncHandler(async (req, res, next) => {
  const { employeeId, folderId } = req.params;
  const { companyId } = req.body;
  const userId = req.user.id;

  const user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
  });

  const uploaderProfile = user.companies.find((c) =>
    c.company.equals(companyId)
  ).profile;

  if (!user) {
    return next(new ErrorResponse("User is not part of this company", 401));
  }

  const employee = await EmployeeProfile.findOne({
    employeeId,
    company: companyId,
  });

  if (!employee) {
    return next(new ErrorResponse("Employee not found", 404));
  }

  const folder = employee.documents.find((f) => f._id.equals(folderId));

  if (!folder) {
    return next(new ErrorResponse("Folder not found", 404));
  }

  if (!req.file) {
    return next(new ErrorResponse("Please upload a file", 400));
  }

  const fileObj = {
    name: req.file.originalname,
    url: req.file.location,
    uploadedBy: uploaderProfile,
  };

  const file = await File.create(fileObj);
  let targetFolder = await Folder.findById(folderId);
  targetFolder.files.push(file);

  await targetFolder.save();
  res.status(201).json({
    success: true,
    data: targetFolder,
  });
});

//
exports.deleteFile = asyncHandler(async (req, res, next) => {
  const { employeeId, folderId, fileId } = req.params;
  const { companyId } = req.body;
  const userId = req.user.id;

  const user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
  });

  const uploaderProfile = user.companies.find((c) =>
    c.company.equals(companyId)
  ).profile;

  console.log(uploaderProfile);

  if (!user) {
    return next(new ErrorResponse("User is not part of this company", 401));
  }

  const employee = await EmployeeProfile.findOne({
    employeeId,
    company: companyId,
  });

  if (!employee) {
    return next(new ErrorResponse("Employee not found", 404));
  }

  const isFolderExist = employee.documents.find((f) => f._id.equals(folderId));

  const folder = await Folder.findById(folderId);

  if (!isFolderExist || !folder) {
    return next(new ErrorResponse("Folder not found", 404));
  }
  const file = await File.findById(fileId);
  if (!file) {
    return next(new ErrorResponse("File not found", 404));
  }

  console.log(folder);

  folder.files = folder.files.filter((f) => !f.equals(fileId));
  await folder.save();

  await File.findByIdAndDelete(fileId);

  res.status(200).json({
    success: true,
    message: "File deleted successfully",
  });
});

// description       Change folder accessibility
// route             PUT  api/v1/employee/:employeeId/folders/:folderId/accessibility
// access            Private
exports.changeFolderAccessibility = asyncHandler(async (req, res, next) => {
  const { employeeId, folderId } = req.params;
  const { companyId, isPrivate } = req.body;
  const userId = req.user.id;

  const user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
  });

  const userProfile = user.companies.find((c) =>
    c.company.equals(companyId)
  ).profile;

  if (!user) {
    return next(new ErrorResponse("User is not part of this company", 401));
  }

  const employee = await EmployeeProfile.findById({
    employeeId,
    company: companyId,
  });

  if (!employee) {
    return next(new ErrorResponse("Employee not found", 404));
  }

  const folder = employee.documents.find((f) => f._id.equals(folderId));

  if (!folder) {
    return next(new ErrorResponse("Folder not found", 404));
  }

  // check userProfile should be the creater of the folder
  if (!folder.createdBy.equals(userProfile)) {
    return next(
      new ErrorResponse(
        "You are not authorized to change folder accessibility",
        401
      )
    );
  }

  folder.isPrivate = isPrivate;

  await employee.save();

  res.status(200).json({
    success: true,
    data: folder,
  });
});

// description       Get folders and files
// route             GET api/v1/employee/:employeeId/folders
// access            Private
exports.getFoldersAndFiles = asyncHandler(async (req, res, next) => {
  const { employeeId, companyId } = req.params;
  const userId = req.user.id;

  const user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
  });

  const userProfile = user.companies.find((c) =>
    c.company.equals(companyId)
  ).profile;

  if (!user) {
    return next(new ErrorResponse("User is not part of this company", 401));
  }

  const employee = await EmployeeProfile.findOne({
    employeeId,
    company: companyId,
  });

  if (!employee) {
    return next(new ErrorResponse("Employee not found", 404));
  }

  // only manager or owner can get data or user can get his own data
  const ownerRole = await Role.findOne({ name: "owner" });
  const isManager =
    employee.jobInformation?.length > 0
      ? employee.jobInformation[0].reportsTo
        ? employee.jobInformation[0].reportsTo?.equals(userProfile)
        : true
      : false;

  const isOwner =
    user.companies
      .find((c) => c.company.equals(companyId))
      ?.role?.equals(ownerRole._id) || false;

  console.log(isOwner, "isOwner");

  if (!isManager && !isOwner && !userProfile.equals(employee._id)) {
    res.status(401).json({
      success: false,
      message: "You are not authorized to get the data",
      access: false,
    });
  }

  let folders;
  if (userProfile.equals(employee._id)) {
    // populate the folders
    folders = await Folder.find({ createdFor: employee._id }).populate("files");

    // remove the folders that are private and not created by him
    folders = folders.filter(
      (folder) =>
        folder.isPrivate === false || folder.createdBy.equals(userProfile)
    );
  } else {
    // manager or owner
    // can see all the folders except the private ones created by employee
    folders = await Folder.find({ createdFor: employee._id }).populate("files");

    // remove the folders that are private and created by employee
    folders = folders.filter(
      (folder) =>
        folder.isPrivate === false || !folder.createdBy.equals(userProfile)
    );
  }

  res.status(200).json({
    success: true,
    data: folders,
  });
});

// description       Upload profile picture
// route             POST api/v1/employee/:employeeId/uploadProfilePic
// access            Private

exports.uploadProfilePicture = asyncHandler(async (req, res, next) => {
  const { employeeId } = req.params;
  const { companyId } = req.body;
  const userId = req.user.id;

  const image = req.file;

  const user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
  });

  const userProfile = user.companies.find((c) =>
    c.company.equals(companyId)
  ).profile;

  if (!user) {
    return next(new ErrorResponse("User is not part of this company", 401));
  }

  const employee = await EmployeeProfile.findOne({
    employeeId,
    company: companyId,
  });

  if (!employee) {
    return next(new ErrorResponse("Employee not found", 404));
  }

  // only manager or owner can get data or user can get his own data
  const owner = await Role.findOne({ name: "owner" });
  const isManager =
    employee.jobInformation?.length > 0
      ? employee.jobInformation[0].reportsTo
        ? employee.jobInformation[0].reportsTo?.equals(userProfile)
        : true
      : false;

  const isOwner = user.companies
    .find((c) => c.company.equals(companyId))
    .role.equals(owner._id);

  if (!isManager && !isOwner && !userProfile.equals(employee._id)) {
    res.status(401).json({
      success: false,
      message: "You are not authorized to get the data",
      access: false,
    });
  }

  if (!image) {
    return next(new ErrorResponse("Please upload a file", 400));
  }

  employee.image = image.location;
  await employee.save();

  res.status(200).json({
    success: true,
    data: employee,
  });
});

// description       Get signable files
// route             GET api/v1/employee/:employeeId/files
// access            Private
exports.getSignableFiles = asyncHandler(async (req, res, next) => {
  const { employeeId, companyId } = req.params;
  const userId = req.user.id;

  const user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
  });

  if (!user) {
    return next(new ErrorResponse("User is not part of this company", 401));
  }

  // check if employee is part of the company
  const employee = await EmployeeProfile.findOne({
    employeeId,
    company: companyId,
  });

  if (!employee) {
    return next(new ErrorResponse("Employee not found", 404));
  }

  const folders = await Folder.find({ createdFor: employee._id }).populate(
    "files"
  );

  res.status(200).json({
    success: true,
    data: folders,
  });
});

// description       Create signature request
// route             POST api/v1/employee/:companyId/employeeId/requestSignature
// access            Private
exports.createSignatureRequest = asyncHandler(async (req, res, next) => {
  const { employeeId } = req.params;
  const { companyId, folderId, fileId, message } = req.body;
  const userId = req.user.id;

  const user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
  });

  if (!user) {
    return next(new ErrorResponse("User is not part of this company", 401));
  }

  // find user's profile for the company
  const userProfile = user.companies.find((c) =>
    c.company.equals(companyId)
  ).profile;

  const employee = await EmployeeProfile.findOne({
    employeeId,
    company: companyId,
  });

  if (!employee) {
    return next(new ErrorResponse("Employee not found", 404));
  }

  const folder = await Folder.findById(folderId);

  if (!folder) {
    return next(new ErrorResponse("Folder not found", 404));
  }

  // check if the file is in the folder
  const file = folder.files.find((f) => f._id.equals(fileId));

  if (!file) {
    return next(new ErrorResponse("File not found", 404));
  }

  // create notification
  const notification = await Notification.create({
    type: "signature_request",
    folderId,
    fileId,
    createdBy: userProfile,
    createdFor: employee._id,
    message,
  });

  res.status(201).json({
    success: true,
    data: notification,
  });
});

// description       Get notifications for an employee
// route             GET api/v1/employee/:companyId/:employeeId/notifications
// access            Private
exports.getNotifications = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const userId = req.user.id;

  const user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
  });

  if (!user) {
    return next(new ErrorResponse("User is not part of this company", 401));
  }

  const userProfile = user.companies.find((c) =>
    c.company.equals(companyId)
  ).profile;

  const employee = await EmployeeProfile.findOne({
    _id: userProfile,
    company: companyId,
  });

  if (!employee) {
    return next(new ErrorResponse("Employee not found", 404));
  }

  const notifications = await Notification.find({
    createdFor: employee._id,
  }).populate(
    "createdBy createdBy.firstName createdBy.lastName folderId fileId"
  );

  // also populate the folder object

  // only need these of createdBy object
  // firstName: 'Tester',
  // lastName: '1',

  res.status(200).json({
    success: true,
    data: notifications,
  });
});
