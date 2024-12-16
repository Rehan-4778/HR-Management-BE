const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EmploymentStatusSchema = new Schema({
  effectiveDate: { type: Date },
  employmentStatus: { type: String },
  comment: { type: String },
});

const EducationSchema = new Schema({
  institute: { type: String },
  degree: { type: String },
  major: { type: String },
  gpa: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
});

const VisaInfoSchema = new Schema({
  date: { type: Date, default: Date.now },
  visaType: { type: String },
  issuingCountry: { type: String },
  issuedDate: { type: Date },
  expirationDate: { type: Date },
  note: { type: String },
});

const JobInformationSchema = new Schema({
  effectiveDate: { type: Date },
  location: { type: String },
  division: { type: String },
  department: { type: String },
  jobTitle: { type: String },
  reportsTo: { type: Schema.Types.ObjectId, ref: "EmployeeProfile" },
});

const CompensationSchema = new Schema({
  effectiveDate: { type: Date },
  paySchedule: { type: String },
  payType: { type: String },
  payRate: { type: Number },
  payRateUnit: { type: String },
  overtime: {
    type: String,
    enum: ["Exempt", "Non-Exempt"],
    default: "Exempt",
  },
  changeReason: { type: String },
  comment: { type: String },
});

const BonusSchema = new Schema({
  date: { type: Date },
  amount: { type: Number },
  reason: { type: String },
  comment: { type: String },
});

const AssetSchema = new Schema({
  assetCategory: { type: String },
  assetDescription: { type: String },
  serialNumber: { type: String },
  dateAssigned: { type: Date },
  dateReturned: { type: Date },
});

const EmployeeProfileSchema = new Schema({
  employeeId: { type: String },
  image: { type: String },
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
  secondaryLanguage: { type: String },
  hiringDate: { type: Date, default: Date.now },
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
  loginAccess: { type: Boolean, default: true },

  company: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  education: [EducationSchema],
  visaInfo: [VisaInfoSchema],
  jobInformation: [JobInformationSchema],
  employmentStatusHistory: [EmploymentStatusSchema],
  compensationHistory: [CompensationSchema],
  bonuses: [BonusSchema],
  assets: [AssetSchema],
  documents: [
    {
      type: Schema.Types.ObjectId,
      ref: "Folder",
    },
  ],

  leavePolicy: { type: Schema.Types.ObjectId, ref: "LeavePolicy" },
  leaveBalances: [
    {
      leaveType: { type: Schema.Types.ObjectId, ref: "LeaveType" },
      remainingHours: { type: Number, default: 0 },
    },
  ],

  onboardingToken: String,
  onboardingTokenExpires: Date,
});

module.exports = mongoose.model("EmployeeProfile", EmployeeProfileSchema);
