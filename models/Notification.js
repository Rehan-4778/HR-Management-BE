const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    required: true,
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "File",
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EmployeeProfile",
    required: true,
  },
  createdFor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EmployeeProfile",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  message: {
    type: String,
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
