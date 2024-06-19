const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RoleSchema = new Schema({
  name: { type: String, required: true, unique: true },
  permissions: [String], // e.g., ['create_user', 'delete_user']
});

module.exports = mongoose.model("Role", RoleSchema);
