const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TimeOffRequestSchema = new Schema({
  employee: {
    type: Schema.Types.ObjectId,
    ref: "EmployeeProfile",
    required: true,
  },
  leaveType: { type: Schema.Types.ObjectId, ref: "LeaveType", required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  hoursPerDay: [
    {
      date: {
        type: Date,
        required: true,
      },
      hours: {
        type: Number,
        required: true,
      },
    },
  ],
  note: { type: String },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Denied"],
    default: "Pending",
  },
  requestedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  approvedBy: { type: Schema.Types.ObjectId, ref: "EmployeeProfile" },
});

module.exports = mongoose.model("TimeOffRequest", TimeOffRequestSchema);
