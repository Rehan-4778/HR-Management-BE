const mongoose = require("mongoose");

const EmployeeFieldsSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  degree: [
    {
      label: String,
      value: String,
    },
  ],
  department: [
    {
      label: String,
      value: String,
    },
  ],
  division: [
    {
      label: String,
      value: String,
    },
  ],
  employmentStatus: [
    {
      label: String,
      value: String,
    },
  ],
  jobTitle: [
    {
      label: String,
      value: String,
    },
  ],
  visaType: [
    {
      label: String,
      value: String,
    },
  ],
  assetCategory: [
    {
      label: String,
      value: String,
    },
  ],
});

const EmployeeFields = mongoose.model("EmployeeFields", EmployeeFieldsSchema);
module.exports = EmployeeFields;
