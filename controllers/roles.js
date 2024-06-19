const Role = require("../models/Role");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/async");

// @desc              Get all roles
// @route             GET  api/v1/roles
// @access            Private
exports.getRoles = asyncHandler(async (req, res, next) => {
  const roles = await Role.find();

  res.status(200).json({
    success: true,
    data: roles,
  });
});

// @description       Create role
// @route             POST  api/v1/roles
// @access            Private
exports.createRole = asyncHandler(async (req, res, next) => {
  const role = await Role.create(req.body);

  res.status(201).json({
    success: true,
    data: role,
  });
});

// @description       Get single role
// @route             GET  api/v1/roles/:id
// @access            Private
exports.getRole = asyncHandler(async (req, res, next) => {
  const role = await Role.findById(req.params.id);

  if (!role) {
    return next(
      new ErrorResponse(`Role not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: role,
  });
});

// @description       Update role
// @route             PUT  api/v1/roles/:id
// @access            Private
exports.updateRole = asyncHandler(async (req, res, next) => {
  const role = await Role.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!role) {
    return next(
      new ErrorResponse(`Role not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: role,
  });
});

// @description       Delete role
// @route             DELETE  api/v1/roles/:id
// @access            Private
exports.deleteRole = asyncHandler(async (req, res, next) => {
  const role = await Role.findByIdAndDelete(req.params.id);

  if (!role) {
    return next(
      new ErrorResponse(`Role not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: {},
  });
});
