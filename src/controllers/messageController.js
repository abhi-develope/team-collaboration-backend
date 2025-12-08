const Message = require("../models/Message");
const Team = require("../models/Team");
const User = require("../models/User");
const { successResponse } = require("../utils/responseHandler");
const { NotFoundError, ForbiddenError } = require("../utils/errorTypes");
const { HTTP_STATUS, ROLES } = require("../config/constants");

// @desc    Send message in team chat
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { content, teamId } = req.body;

    // Verify team exists
    const team = await Team.findById(teamId);
    if (!team) {
      throw new NotFoundError("Team not found");
    }

    // Verify user belongs to team
    if (req.user.teamId.toString() !== teamId) {
      throw new ForbiddenError("You can only send messages to your own team");
    }

    const message = await Message.create({
      content,
      senderId: req.user.id,
      teamId,
      timestamp: new Date(),
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("senderId", "name email role")
      .populate("teamId", "name");

    // Emit to team room via Socket.IO - everyone sees all messages
    const io = req.app.get("io");
    if (io) {
      io.to(`team:${teamId}`).emit("new-message", populatedMessage);
    }

    successResponse(res, HTTP_STATUS.CREATED, "Message sent successfully", {
      message: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get team chat messages
// @route   GET /api/messages?teamId=xxx&limit=50
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const { teamId, limit = 50 } = req.query;

    if (!teamId) {
      throw new NotFoundError("Team ID is required");
    }

    // Verify team exists
    const team = await Team.findById(teamId);
    if (!team) {
      throw new NotFoundError("Team not found");
    }

    // Verify user belongs to team
    if (req.user.teamId.toString() !== teamId) {
      throw new ForbiddenError("You can only view messages from your own team");
    }

    // Everyone sees all messages regardless of role
    const messages = await Message.find({ teamId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate("senderId", "name email role")
      .populate("teamId", "name");

    successResponse(res, HTTP_STATUS.OK, "Messages retrieved successfully", {
      messages: messages.reverse(),
      count: messages.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getMessages,
};
