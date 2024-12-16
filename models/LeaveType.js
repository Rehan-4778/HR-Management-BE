const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LeaveTypeSchema = new Schema({
  name: { type: String, required: true },
  defaultHours: { type: Number, default: 0 },
});

module.exports = mongoose.model("LeaveType", LeaveTypeSchema);
