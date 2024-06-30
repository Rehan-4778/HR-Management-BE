const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EmployeeProfileSchema = new Schema({
  jobTitle: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  zip: { type: String },
  country: { type: String },
  dateOfBirth: { type: Date },
  hireDate: { type: Date },

  company: {
    type: Schema.Types.ObjectId,
    ref: "Company",
  },
  employeeId: {
    type: Number,
  },
});

module.exports = mongoose.model("EmployeeProfile", EmployeeProfileSchema);
