const User = require("../models/User");
const Role = require("../models/Role");
const TimeLog = require("../models/TimeLog");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/async");
const EmployeeProfile = require("../models/EmployeeProfile");

// description         update time log
// route               POST /api/v1/employee/:employeeId/time-log
// access              Private

exports.updateTimeLog = asyncHandler(async (req, res, next) => {
  const { employeeId } = req.params;
  const { action, companyId } = req.body;

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

  let timeLog;

  switch (action) {
    case "clock-in":
      timeLog = new TimeLog({
        employeeProfile: employee._id,
        date: new Date(),
        clockIn: new Date(),
      });
      await timeLog.save();
      break;

    case "start-break":
      timeLog = await TimeLog.findOne({
        employeeProfile: employee._id,
        clockIn: { $ne: null },
        clockOut: null,
      }).sort({
        date: -1,
      });
      if (!timeLog) {
        return res
          .status(400)
          .json({ success: false, error: "No active clock-in found" });
      }
      timeLog.breakStart = new Date();
      await timeLog.save();
      break;

    case "end-break":
      timeLog = await TimeLog.findOne({
        employeeProfile: employee._id,
        breakStart: { $ne: null },
        clockOut: null,
      }).sort({
        date: -1,
      });
      if (!timeLog) {
        return res
          .status(400)
          .json({ success: false, error: "No active clock-in found" });
      }
      timeLog.breakEnd = new Date();
      await timeLog.save();
      break;

    case "clock-out":
      timeLog = await TimeLog.findOne({
        employeeProfile: employee._id,
        clockIn: { $ne: null },
        clockOut: null,
      }).sort({
        date: -1,
      });
      if (!timeLog) {
        return res
          .status(400)
          .json({ success: false, error: "No active clock-in found" });
      }
      timeLog.clockOut = new Date();
      await timeLog.save();
      break;

    default:
      return res.status(400).json({ success: false, error: "Invalid action" });
  }

  res.status(200).json({ success: true, data: timeLog });
});

// description         get daily and weekly work time
// route               GET /api/v1/employee/:employeeId/getWorkLog
// access              Private

exports.getWorkLog = asyncHandler(async (req, res, next) => {
  const { companyId, employeeId } = req.params;

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

  // Calculate daily total
  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
  const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));
  const dailyTimeLogs = await TimeLog.find({
    employeeProfile: employee._id,
    date: { $gte: startOfDay, $lt: endOfDay },
  });

  let totalDailyWorkTime = 0;
  let totalDailyBreakTime = 0;

  dailyTimeLogs.forEach((log) => {
    if (log.clockIn && log.clockOut) {
      totalDailyWorkTime += new Date(log.clockOut) - new Date(log.clockIn);
    }
    if (log.breakStart && log.breakEnd) {
      totalDailyBreakTime += new Date(log.breakEnd) - new Date(log.breakStart);
    }
  });

  // Calculate weekly total
  const currentDate = new Date();
  const startOfWeek = new Date(
    currentDate.setDate(currentDate.getDate() - currentDate.getDay())
  );
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  endOfWeek.setHours(23, 59, 59, 999);
  const weeklyTimeLogs = await TimeLog.find({
    employeeProfile: employee._id,
    date: { $gte: startOfWeek, $lt: endOfWeek },
  });

  let totalWeeklyWorkTime = 0;
  let totalWeeklyBreakTime = 0;

  weeklyTimeLogs.forEach((log) => {
    if (log.clockIn && log.clockOut) {
      totalWeeklyWorkTime += new Date(log.clockOut) - new Date(log.clockIn);
    }
    if (log.breakStart && log.breakEnd) {
      totalWeeklyBreakTime += new Date(log.breakEnd) - new Date(log.breakStart);
    }
  });

  const mostRecentLog = await TimeLog.findOne({ employeeProfile: employee._id })
    .sort({ date: -1 })
    .limit(1);

  res.status(200).json({
    success: true,
    data: {
      currentWorkLog: mostRecentLog,
      daily: {
        work: totalDailyWorkTime,
        break: totalDailyBreakTime,
      },
      weekly: {
        work: totalWeeklyWorkTime,
        break: totalWeeklyBreakTime,
      },
    },
  });
});

// description         get all time logs
// route               GET /api/v1/employee/:employeeId/getTimeLogs
// access              Private

exports.getTimeLogs = asyncHandler(async (req, res, next) => {
  const { companyId, employeeId } = req.params;

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

  // find the time logs for the employee
  const timeLogs = await TimeLog.find({
    employeeProfile: employee._id,
  });

  res.status(200).json({ success: true, data: timeLogs });
});
