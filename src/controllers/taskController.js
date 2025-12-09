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
          // Members only see tasks assigned to them (not unassigned tasks)
          if (!task.assignedTo) return false;
          const assignedToId =
            typeof task.assignedTo === "object"
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

    // Remove teamId-based access checks
    // Any member can see their assigned tasks in any project

    let tasks = await Task.find({ projectId })
      .populate("projectId", "name")
      .populate("assignedTo", "name email");

    // Filter tasks based on role:
    // - MEMBER: Only see tasks assigned to them
    // - MANAGER/ADMIN: See all tasks
    if (req.user.role === ROLES.MEMBER) {
      tasks = tasks.filter((task) => {
        // Members only see tasks assigned to them (not unassigned tasks)
        if (!task.assignedTo) return false;
        const assignedToId =
          typeof task.assignedTo === "object"
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
// @access  Private (Admin/Manager only - Members cannot create tasks)
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, projectId, assignedTo } = req.body;

    // Members cannot create tasks
    if (req.user.role === ROLES.MEMBER) {
      throw new ForbiddenError(
        "Members cannot create tasks. Only Admins and Managers can create tasks."
      );
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    // Verify user belongs to project's team (if team exists)
    if (
      project.teamId &&
      req.user.teamId &&
      req.user.teamId.toString() !== project.teamId.toString()
    ) {
      throw new ForbiddenError(
        "You can only create tasks in your team's projects"
      );
    }

    // Only MANAGER can assign tasks to members
    if (assignedTo && req.user.role !== ROLES.MANAGER) {
      throw new ForbiddenError(
        "Only Managers can assign tasks to members. Admins can create tasks but cannot assign them."
      );
    }

    // Verify assignee is a MEMBER (if provided)
    if (assignedTo) {
      const assignee = await User.findById(assignedTo);
      if (!assignee) {
        throw new NotFoundError("User not found");
      }
      if (assignee.role !== ROLES.MEMBER) {
        throw new ForbiddenError("Tasks can only be assigned to members");
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

    // Emit task creation to team room (if team exists)
    const io = req.app.get("io");
    if (io && project.teamId) {
      io.to(`team:${project.teamId}`).emit("task-updated", populatedTask);
    } else if (io) {
      io.emit("task-updated", populatedTask); // Broadcast to all if no team
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
    const { assignedTo, status, title, description } = req.body;

    let task = await Task.findById(id)
      .populate("projectId")
      .populate("assignedTo");
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    // MEMBER can only update status of tasks assigned to them
    if (req.user.role === ROLES.MEMBER) {
      // Check if task is assigned to this member
      const assignedToId = task.assignedTo
        ? typeof task.assignedTo === "object"
          ? task.assignedTo._id.toString()
          : task.assignedTo.toString()
        : null;

      if (assignedToId !== req.user.id.toString()) {
        throw new ForbiddenError("You can only update tasks assigned to you");
      }

      // Members can only update status, not other fields
      const updateData = { status: req.body.status };
      task = await Task.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      })
        .populate("projectId", "name")
        .populate("assignedTo", "name email");
    } else {
      // ADMIN and MANAGER can update all fields
      // Only MANAGER can assign/update task assignment
      if (assignedTo !== undefined && req.user.role !== ROLES.MANAGER) {
        throw new ForbiddenError(
          "Only Managers can assign tasks to members. Admins can update tasks but cannot assign them."
        );
      }

      // Verify assignee is a MEMBER (if updating assignee)
      if (assignedTo) {
        const assignee = await User.findById(assignedTo);
        if (!assignee) {
          throw new NotFoundError("User not found");
        }
        if (assignee.role !== ROLES.MEMBER) {
          throw new ForbiddenError("Tasks can only be assigned to members");
        }
      }

      task = await Task.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      })
        .populate("projectId", "name")
        .populate("assignedTo", "name email");
    }

    // Emit task update to team room (if team exists)
    const io = req.app.get("io");
    if (io && task.projectId?.teamId) {
      io.to(`team:${task.projectId.teamId}`).emit("task-updated", task);
    } else if (io) {
      io.emit("task-updated", task); // Broadcast to all if no team
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
