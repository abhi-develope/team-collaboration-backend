const Joi = require("joi");

const sendMessageSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required().messages({
    "string.min": "Message cannot be empty",
    "string.max": "Message cannot exceed 2000 characters",
    "any.required": "Message content is required",
  }),
  // Optional for global chat; allow null/empty
  teamId: Joi.string()
    .hex()
    .length(24)
    .allow(null, "")
    .optional()
    .messages({
      "string.length": "Invalid Team ID format",
    }),
});

module.exports = {
  sendMessageSchema,
};
