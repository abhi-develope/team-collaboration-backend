const Team = require("../models/Team");
const User = require("../models/User");
const { successResponse } = require("../utils/responseHandler");
const { NotFoundError, ForbiddenError } = require("../utils/errorTypes");
const { HTTP_STATUS } = require("../config/constants");

// @desc    Create team
// @route   POST /api/teams
// @access  Private
const createTeam = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    // Check if user already has a team
    if (req.user.teamId) {
      throw new ForbiddenError("You are already part of a team");
    }

    const team = await Team.create({
      name,
      description,
      adminId: req.user.id,
    });

    await User.findByIdAndUpdate(req.user.id, { teamId: team._id });

    const populatedTeam = await Team.findById(team._id).populate("adminId", "name email");

    successResponse(res, HTTP_STATUS.CREATED, "Team created successfully", {
      team: populatedTeam,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get team members
// @route   GET /api/teams/:teamId/members
// @access  Private
const getTeamMembers = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    // Verify team exists
    const team = await Team.findById(teamId);
    if (!team) {
      throw new NotFoundError("Team not found");
    }

    // Verify user belongs to team
    if (req.user.teamId?.toString() !== teamId) {
      throw new ForbiddenError("You do not have access to this team");
    }

    const members = await User.find({ teamId }).select("-password");

    successResponse(res, HTTP_STATUS.OK, "Team members retrieved successfully", {
      members,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's team
// @route   GET /api/teams/my-team
// @access  Private
const getMyTeam = async (req, res, next) => {
  try {
    if (!req.user.teamId) {
      return successResponse(res, HTTP_STATUS.OK, "User has no team", {
        team: null,
        members: [],
      });
    }

    const team = await Team.findById(req.user.teamId).populate("adminId", "name email");
    const members = await User.find({ teamId: req.user.teamId }).select("-password");

    successResponse(res, HTTP_STATUS.OK, "Team retrieved successfully", {
      team,
      members,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTeam, getTeamMembers, getMyTeam };
