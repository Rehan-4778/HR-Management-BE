const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CompanySchema = new Schema(
  {
    name: { type: String, required: true },
    domain: { type: String, required: true, unique: true },
    employeeCount: { type: String, required: true },
    country: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", CompanySchema);
