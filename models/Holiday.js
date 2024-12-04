const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const HolidaySchema = new Schema(
  {
    name: { type: String, required: true },
    date: { type: Date, required: true },
    description: { type: String },
    isRecurring: { type: Boolean, default: false },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    // createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Holiday", HolidaySchema);
