const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    approver: {
      type: String,
      required: true,
      enum: [
        "manager",
        "account_owner",
        "manager-manager",
        "specific",
        "full_admin",
      ],
    },
    specificPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { _id: false }
);

module.exports = permissionSchema;
