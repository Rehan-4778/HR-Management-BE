const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FolderSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "EmployeeProfile",
    required: true,
  },
  createdFor: {
    type: Schema.Types.ObjectId,
    ref: "EmployeeProfile",
    required: true,
  },
  createdDate: { type: Date, default: Date.now },
  isPrivate: { type: Boolean, default: false },
  files: [
    {
      type: Schema.Types.ObjectId,
      ref: "File",
    },
  ],
});

module.exports = mongoose.model("Folder", FolderSchema);
