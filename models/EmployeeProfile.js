const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EmployeeProfileSchema = new Schema({
  employeeId: { type: String },
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  dob: { type: Date },
  gender: { type: String },
  maritalStatus: { type: String },
  ssn: { type: String },
  street1: { type: String },
  street2: { type: String },
  city: { type: String },
  state: { type: String },
  zip: { type: String },
  country: { type: String },
  paySchedule: { type: String },
  payType: { type: String },
  payRate: { type: String },
  payRateUnit: { type: String },
  ethnicity: { type: String },
  workPhone: { type: String },
  mobilePhone: { type: String },
  workEmail: {
    type: String,
    match: [/.+\@.+\..+/, "Please fill a valid email address for work email"],
  },
  homeEmail: {
    type: String,
    match: [/.+\@.+\..+/, "Please fill a valid email address for home email"],
  },
  hiringDate: { type: Date },
  employmentStatus: { type: String },
  jobTitle: { type: String },
  reportsTo: { type: String },
  department: { type: String },
  division: { type: String },
  location: { type: String },
  company: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  loginAccess: { type: Boolean, default: false },
  onboardingToken: String,
  onboardingTokenExpires: Date,
});

module.exports = mongoose.model("EmployeeProfile", EmployeeProfileSchema);
