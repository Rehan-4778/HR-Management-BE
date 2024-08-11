const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LeavePolicySchema = new Schema({
  company: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  name: { type: String, required: true },
  leaveTypes: [
    {
      type: Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
    },
  ],
});

module.exports = mongoose.model("LeavePolicy", LeavePolicySchema);
