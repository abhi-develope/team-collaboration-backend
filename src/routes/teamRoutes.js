const express = require("express");
const router = express.Router();
const { createTeam, getTeamMembers, getMyTeam, getAllMembers } = require("../controllers/teamController");
const { createTeamSchema } = require("../validators/teamValidator");
const { validateRequest } = require("../middleware/validateRequest");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post(
  "/",
  validateRequest(createTeamSchema),
  createTeam
);

router.get("/my-team", getMyTeam);
router.get("/members/all", getAllMembers);
router.get("/:teamId/members", getTeamMembers);

module.exports = router;
