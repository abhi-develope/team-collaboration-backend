const Message = require("../models/Message");
const Team = require("../models/Team");
const User = require("../models/User");
const { successResponse } = require("../utils/responseHandler");
const { NotFoundError, ForbiddenError } = require("../utils/errorTypes");
const { HTTP_STATUS, ROLES } = require("../config/constants");

// @desc    Send message in global chat
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;

    // Create message without team requirement - global chat
    const message = await Message.create({
      content,
      senderId: req.user.id,
      teamId: null, // No team required
      timestamp: new Date(),
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("senderId", "name email role");

    // Emit to global room via Socket.IO - everyone sees all messages
    const io = req.app.get("io");
    if (io) {
      io.emit("new-message", populatedMessage); // Broadcast to all connected users
    }

    successResponse(res, HTTP_STATUS.CREATED, "Message sent successfully", {
      message: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all chat messages (global chat - no team required)
// @route   GET /api/messages?limit=50
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const { limit = 100 } = req.query;

    // Get all messages from all users - global chat
    const messages = await Message.find()
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate("senderId", "name email role");

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
