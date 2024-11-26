const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FileSchema = new Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: "EmployeeProfile",
    required: true,
  },
  uploadDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("File", FileSchema);
