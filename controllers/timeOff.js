const User = require("../models/User");
const Role = require("../models/Role");
const TimeLog = require("../models/TimeLog");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/async");
const EmployeeProfile = require("../models/EmployeeProfile");
const TimeOffRequest = require("../models/TimeOffRequest");
const LeavePolicy = require("../models/LeavePolicy");

// description         request time off
// route               POST /api/v1/timeOff/:employeeId/request-time-off
// access              Private

exports.requestTimeOff = asyncHandler(async (req, res, next) => {
  const { employeeId } = req.params;
  const { leaveTypeId, startDate, endDate, dayHours, note, companyId } =
    req.body;

  const userId = req.user.id;

  const user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
  });
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

  const userProfile = user.companies.find((c) =>
    c.company.equals(companyId)
  ).profile;

  if (!userProfile.equals(employee._id)) {
    return next(new ErrorResponse("You are not authorized", 401));
  }

  const timeOffRequest = new TimeOffRequest({
    employee: employee._id,
    leaveType: leaveTypeId,
    startDate,
    endDate,
    hoursPerDay: dayHours.map((d) => ({
      date: new Date(d.date),
      hours: d.hours,
    })),
    note,
  });

  await timeOffRequest.save();

  res.status(201).json({
    success: true,
    data: timeOffRequest,
  });
});

// description         approve/deny time off
// route               PUT /api/v1/timeOff/time-off-requests/:requestId
// access              Private
exports.approveDenyTimeOff = asyncHandler(async (req, res, next) => {
  const { requestId } = req.params;
  const { status } = req.body;
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
    _id: userProfile,
    company: companyId,
  });

  if (!employee) {
    return next(new ErrorResponse("Employee not found", 404));
  }

  // only manager or owner can approve/deny time off
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

  if (!isManager && !isOwner) {
    res.status(401).json({
      success: false,
      message: "You are not authorized to get the data",
      access: false,
    });
  } else {
    const timeOffRequest = await TimeOffRequest.findById(requestId);

    if (!timeOffRequest) {
      return res.status(404).json({
        success: false,
        message: "Time off request not found",
      });
    }

    timeOffRequest.status = status;
    timeOffRequest.approvedAt = new Date();
    timeOffRequest.approvedBy = req.user._id;

    await timeOffRequest.save();

    if (status === "Approved") {
      // Update employee leave balance
      const employee = await EmployeeProfile.findById(timeOffRequest.employee);
      const leaveBalance = employee.leaveBalances.find((lb) =>
        lb.leaveType.equals(timeOffRequest.leaveType)
      );

      if (leaveBalance) {
        timeOffRequest.hoursPerDay.forEach(({ hours }) => {
          leaveBalance.remainingHours -= hours;
        });
        await employee.save();
      }
    }

    res.status(200).json({
      success: true,
      data: timeOffRequest,
    });
  }
});

// description         add/reduce leave balance for employee
// route               PUT /api/v1/timeOff/:employeeId/update-leave-balance
// access              Private
exports.updateLeaveBalance = asyncHandler(async (req, res, next) => {
  const { employeeId } = req.params;
  const { companyId, leaveTypeId, hours } = req.body;
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
    _id: userProfile,
    company: companyId,
  });

  if (!employee) {
    return next(new ErrorResponse("Employee not found", 404));
  }

  // only manager or owner can approve/deny time off
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

  if (!isManager && !isOwner) {
    res.status(401).json({
      success: false,
      message: "You are not authorized to get the data",
      access: false,
    });
  } else {
    const leaveBalance = employee.leaveBalances.find((lb) =>
      lb.leaveType.equals(leaveTypeId)
    );

    if (leaveBalance) {
      leaveBalance.remainingHours += hours;
    } else {
      employee.leaveBalances.push({
        leaveType: leaveTypeId,
        remainingHours: hours,
      });
    }

    await employee.save();

    res.status(200).json({
      success: true,
      data: employee.leaveBalances,
    });
  }
});

// description         add public holiday
// route               POST /api/v1/timeOff/:companyId/add-public-holiday
// access              Private

exports.addPublicHoliday = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const { date, name } = req.body;
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

  const owner = await Role.findOne({ name: "owner" });

  const isOwner = user.companies
    .find((c) => c.company.equals(companyId))
    .role.equals(owner._id);

  if (!isOwner) {
    res.status(401).json({
      success: false,
      message: "You are not authorized to get the data",
      access: false,
    });
  } else {
    const employees = await EmployeeProfile.find({ company: companyId });
    employees.forEach(async (employee) => {
      const timeOffRequest = new TimeOffRequest({
        employee: employee._id,
        leaveType: null, // Public holiday, not associated with any leave type
        startDate: date,
        endDate: date,
        hoursPerDay: [{ date, hours: 8 }],
        status: "Approved",
        requestedAt: new Date(),
        approvedAt: new Date(),
        approvedBy: req.user._id,
        note,
      });

      await timeOffRequest.save();
    });

    res.status(201).json({
      success: true,
      message: "Public holiday added for all employees",
    });
  }
});

// description         get time off details for employee
// route               GET /api/v1/timeOff/:companyId/:employeeId/get-time-off-details
// access              Private
exports.getTimeOffDetails = asyncHandler(async (req, res, next) => {
  const { companyId, employeeId } = req.params;
  const userId = req.user.id;

  console.log("userId", userId);
  console.log("companyId", companyId);
  console.log("employeeId", employeeId);

  const user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
  });

  if (!user) {
    return next(new ErrorResponse("You are not part of this company", 401));
  }

  const employee = await EmployeeProfile.findOne({
    employeeId,
    company: companyId,
  });

  if (!employee) {
    return next(new ErrorResponse("Employee not found", 404));
  }

  const leavePolicyId = employee.leavePolicy;
  const leavePolicy = await LeavePolicy.findById(leavePolicyId).populate(
    "leaveTypes"
  );
  const leaveBalances = employee.leaveBalances;

  const currentDate = new Date();
  const timeOffRequests = await TimeOffRequest.find({
    employee: employee._id,
    // startDate: { $gte: currentDate },
    // check the day not date
    startDate: { $gte: currentDate.setHours(0, 0, 0, 0) },
  });

  const leaveDetails = leavePolicy.leaveTypes.map((leaveType) => {
    const balance = leaveBalances.find((lb) =>
      lb.leaveType.equals(leaveType._id)
    ) || { remainingHours: 0 };
    const scheduledHours = timeOffRequests
      .filter((req) => req.leaveType.equals(leaveType._id))
      .reduce((sum, req) => {
        req.hoursPerDay.forEach(({ hours }) => {
          sum += hours;
        });
        return sum;
      }, 0);

    return {
      leaveId: leaveType._id,
      leaveName: leaveType.name,
      leaveTotalTime: leaveType.defaultHours,
      leaveRemainingTime: balance.remainingHours,
      leaveScheduledHours: scheduledHours,
    };
  });

  res.status(200).json({
    success: true,
    data: leaveDetails,
  });
});

// description         get scheduled time off requests and history time off requests
// route               GET /api/v1/timeOff/:companyId/:employeeId/get-time-off-requests
// access              Private

exports.getTimeOffRequests = asyncHandler(async (req, res, next) => {
  const { companyId, employeeId } = req.params;

  const userId = req.user.id;

  const user = await User.findOne({
    _id: userId,
    "companies.company": companyId,
  });

  if (!user) {
    return next(new ErrorResponse("You are not part of this company", 401));
  }

  const employee = await EmployeeProfile.findOne({
    employeeId,
    company: companyId,
  });

  if (!employee) {
    return next(new ErrorResponse("Employee not found", 404));
  }

  const currentDate = new Date();

  const timeOffRequests =
    (await TimeOffRequest.find({ employee: employee._id }).populate(
      "leaveType"
    )) || [];

  const scheduled = timeOffRequests.filter(
    (request) => request.endDate >= currentDate
  );
  const history = timeOffRequests.filter(
    (request) => request.endDate < currentDate
  );

  res.status(200).json({
    success: true,
    data: {
      scheduled,
      history,
    },
  });
});
