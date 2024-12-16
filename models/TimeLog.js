const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TimeLogSchema = new Schema({
  employeeProfile: {
    type: Schema.Types.ObjectId,
    ref: "EmployeeProfile",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  clockIn: {
    type: Date,
    required: true,
  },
  clockOut: Date,
  breakStart: Date,
  breakEnd: Date,
});

module.exports = mongoose.model("TimeLog", TimeLogSchema);
