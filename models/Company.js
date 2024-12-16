const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const permissionSchema = require("./Permission");

const CompanySchema = new Schema(
  {
    image: { type: String },
    name: { type: String, required: true },
    domain: { type: String, required: true, unique: true },
    employeeCount: { type: String, required: true },
    country: { type: String, required: true },
    permissions: {
      informationUpdates: permissionSchema,
      timeOffRequests: permissionSchema,
      employmentStatus: permissionSchema,
      jobInformation: permissionSchema,
      promotion: permissionSchema,
      assetRequest: permissionSchema,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", CompanySchema);
