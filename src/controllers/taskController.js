const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const { successResponse } = require("../utils/responseHandler");
const { NotFoundError, ForbiddenError } = require("../utils/errorTypes");
const { HTTP_STATUS, ROLES } = require("../config/constants");

// @desc    Get all tasks for a project
// @route   GET /api/tasks?projectId=xxx
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      let tasks = await Task.find()
        .populate("projectId", "name")
        .populate("assignedTo", "name email");
      
      // Filter tasks based on role:
      // - MEMBER: Only see tasks assigned to them
      // - MANAGER/ADMIN: See all tasks
      if (req.user.role === ROLES.MEMBER) {
        tasks = tasks.filter((task) => {
          // Members see tasks assigned to them or unassigned tasks
          if (!task.assignedTo) return true; // Show unassigned tasks
          const assignedToId = typeof task.assignedTo === "object" 
            ? task.assignedTo._id.toString() 
            : task.assignedTo.toString();
          return assignedToId === req.user.id.toString();
        });
      }
      
      return successResponse(
        res,
        HTTP_STATUS.OK,
        "Tasks retrieved successfully",
        { tasks }
      );
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    // Verify user belongs to project's team
    if (req.user.teamId.toString() !== project.teamId.toString()) {
      throw new ForbiddenError(
        "You do not have access to this project's tasks"
      );
    }

    let tasks = await Task.find({ projectId })
      .populate("projectId", "name")
      .populate("assignedTo", "name email");

    // Filter tasks based on role:
    // - MEMBER: Only see tasks assigned to them
    // - MANAGER/ADMIN: See all tasks
    if (req.user.role === ROLES.MEMBER) {
      tasks = tasks.filter((task) => {
        // Members see tasks assigned to them or unassigned tasks
        if (!task.assignedTo) return true; // Show unassigned tasks
        const assignedToId = typeof task.assignedTo === "object" 
          ? task.assignedTo._id.toString() 
          : task.assignedTo.toString();
        return assignedToId === req.user.id.toString();
      });
    }

    successResponse(res, HTTP_STATUS.OK, "Tasks retrieved successfully", {
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, projectId, assignedTo } = req.body;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    // Verify user belongs to project's team
    if (req.user.teamId.toString() !== project.teamId.toString()) {
      throw new ForbiddenError(
        "You can only create tasks in your team's projects"
      );
    }

    // Only MANAGER can assign tasks (ADMIN cannot assign, only manage)
    if (assignedTo && req.user.role !== ROLES.MANAGER) {
      throw new ForbiddenError(
        "Only Managers can assign tasks. Admins can manage but not assign."
      );
    }

    // Verify assignee belongs to same team (if provided)
    if (assignedTo) {
      const assignee = await User.findById(assignedTo);
      if (
        !assignee ||
        assignee.teamId.toString() !== project.teamId.toString()
      ) {
        throw new ForbiddenError("Cannot assign task to user outside the team");
      }
    }

    const task = await Task.create({
      title,
      description,
      status,
      projectId,
      assignedTo,
    });

    const populatedTask = await Task.findById(task._id)
      .populate("projectId", "name")
      .populate("assignedTo", "name email");

    // Emit task creation to team room
    const io = req.app.get("io");
    if (io) {
      io.to(`team:${project.teamId}`).emit("task-updated", populatedTask);
    }

    successResponse(res, HTTP_STATUS.CREATED, "Task created successfully", {
      task: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    let task = await Task.findById(id).populate("projectId");
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    // Verify user belongs to task's team
    const project = await Project.findById(task.projectId._id);
    if (req.user.teamId.toString() !== project.teamId.toString()) {
      throw new ForbiddenError(
        "You can only update tasks in your team's projects"
      );
    }

    // Only MANAGER can assign/update task assignment
    if (assignedTo !== undefined && req.user.role !== ROLES.MANAGER) {
      throw new ForbiddenError(
        "Only Managers can assign tasks. Admins can manage but not assign."
      );
    }

    // Verify assignee belongs to same team (if updating assignee)
    if (assignedTo) {
      const assignee = await User.findById(assignedTo);
      if (
        !assignee ||
        assignee.teamId.toString() !== project.teamId.toString()
      ) {
        throw new ForbiddenError("Cannot assign task to user outside the team");
      }
    }

    task = await Task.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("projectId", "name")
      .populate("assignedTo", "name email");

    // Emit task update to team room
    const io = req.app.get("io");
    if (io) {
      io.to(`team:${project.teamId}`).emit("task-updated", task);
    }

    successResponse(res, HTTP_STATUS.OK, "Task updated successfully", { task });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin only)
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id).populate("projectId");
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    // Verify user belongs to task's team
    const project = await Project.findById(task.projectId._id);
    if (req.user.teamId.toString() !== project.teamId.toString()) {
      throw new ForbiddenError(
        "You can only delete tasks in your team's projects"
      );
    }

    // Only ADMIN can delete tasks
    if (req.user.role !== ROLES.ADMIN) {
      throw new ForbiddenError("Only Admins can delete tasks");
    }

    await Task.findByIdAndDelete(id);

    successResponse(res, HTTP_STATUS.OK, "Task deleted successfully", null);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};
