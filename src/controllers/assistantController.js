const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const { successResponse } = require("../utils/responseHandler");
const { NotFoundError, ForbiddenError, BadRequestError } = require("../utils/errorTypes");
const { HTTP_STATUS, ROLES, TASK_STATUS } = require("../config/constants");

/**
 * Natural Language Processing for Task Assistant
 * Parses user commands and extracts intent and entities
 */
class TaskAssistant {
  constructor(user, projectId) {
    this.user = user;
    this.projectId = projectId;
  }

  /**
   * Parse natural language command
   */
  parseCommand(command) {
    const lowerCommand = command.toLowerCase().trim();
    
    // Create task patterns
    if (this.matchesPattern(lowerCommand, ['create', 'add', 'new', 'make']) && 
        this.matchesPattern(lowerCommand, ['task'])) {
      return this.parseCreateTask(lowerCommand);
    }

    // Update task patterns
    if (this.matchesPattern(lowerCommand, ['update', 'change', 'modify', 'edit', 'set']) && 
        this.matchesPattern(lowerCommand, ['task'])) {
      return this.parseUpdateTask(lowerCommand);
    }

    // Move task patterns
    if (this.matchesPattern(lowerCommand, ['move', 'change', 'set']) && 
        this.matchesPattern(lowerCommand, ['status', 'to', 'progress', 'done', 'todo'])) {
      return this.parseMoveTask(lowerCommand);
    }

    // Assign task patterns
    if (this.matchesPattern(lowerCommand, ['assign', 'give', 'allocate']) && 
        this.matchesPattern(lowerCommand, ['task', 'to'])) {
      return this.parseAssignTask(lowerCommand);
    }

    // Delete task patterns
    if (this.matchesPattern(lowerCommand, ['delete', 'remove', 'cancel']) && 
        this.matchesPattern(lowerCommand, ['task'])) {
      return this.parseDeleteTask(lowerCommand);
    }

    // List/Show tasks patterns
    if (this.matchesPattern(lowerCommand, ['show', 'list', 'get', 'display', 'what', 'which']) && 
        this.matchesPattern(lowerCommand, ['task', 'tasks'])) {
      return this.parseListTasks(lowerCommand);
    }

    // Help pattern
    if (this.matchesPattern(lowerCommand, ['help', 'what can', 'how', 'commands'])) {
      return { intent: 'help' };
    }

    return { intent: 'unknown', message: 'I didn\'t understand that command. Try "help" for available commands.' };
  }

  matchesPattern(text, patterns) {
    return patterns.some(pattern => text.includes(pattern));
  }

  parseCreateTask(command) {
    const titleMatch = command.match(/(?:create|add|new|make)\s+(?:a\s+)?task\s+(?:to|for|about)?\s*(.+?)(?:\s+in\s+project|\s+with\s+description|\s+assigned\s+to|$)/i);
    const descriptionMatch = command.match(/(?:description|desc|details?):\s*(.+?)(?:\s+assigned\s+to|\s+status|$)/i);
    const assigneeMatch = command.match(/(?:assign|assigned|to)\s+(?:to\s+)?([a-z\s]+?)(?:\s+with\s+status|\s+status|$)/i);
    const statusMatch = command.match(/(?:status|state):\s*(todo|in-progress|in progress|done|completed)/i);

    let title = titleMatch ? titleMatch[1].trim() : null;
    if (!title) {
      // Try alternative pattern
      const altMatch = command.match(/(?:create|add|new|make)\s+(?:a\s+)?task\s+(?:called|named|titled)?\s*["']?([^"']+)["']?/i);
      title = altMatch ? altMatch[1].trim() : null;
    }

    if (!title) {
      return { intent: 'error', message: 'Could not extract task title. Please specify what task to create.' };
    }

    // Clean up title
    title = title.replace(/\s+(?:in\s+project|with\s+description|assigned\s+to).*$/i, '').trim();

    const description = descriptionMatch ? descriptionMatch[1].trim() : null;
    const assigneeName = assigneeMatch ? assigneeMatch[1].trim() : null;
    let status = statusMatch ? statusMatch[1].toLowerCase().replace(/\s+/, '-') : TASK_STATUS.TODO;
    
    // Normalize status
    if (status === 'in progress') status = TASK_STATUS.IN_PROGRESS;
    if (status === 'completed') status = TASK_STATUS.DONE;

    return {
      intent: 'create',
      title,
      description,
      assigneeName,
      status,
    };
  }

  parseUpdateTask(command) {
    const taskIdMatch = command.match(/(?:task\s+)?(?:#|id\s+)?([a-f0-9]{24})/i);
    const titleMatch = command.match(/(?:title|name):\s*["']?([^"']+)["']?/i);
    const descriptionMatch = command.match(/(?:description|desc|details?):\s*(.+?)(?:\s+status|$)/i);
    const statusMatch = command.match(/(?:status|state):\s*(todo|in-progress|in progress|done|completed)/i);

    const taskId = taskIdMatch ? taskIdMatch[1] : null;
    if (!taskId) {
      // Try to find task by title
      const titleSearchMatch = command.match(/(?:task|update|change)\s+["']?([^"']+)["']?/i);
      return {
        intent: 'update',
        taskTitle: titleSearchMatch ? titleSearchMatch[1].trim() : null,
        title: titleMatch ? titleMatch[1].trim() : null,
        description: descriptionMatch ? descriptionMatch[1].trim() : null,
        status: statusMatch ? statusMatch[1].toLowerCase().replace(/\s+/, '-') : null,
      };
    }

    return {
      intent: 'update',
      taskId,
      title: titleMatch ? titleMatch[1].trim() : null,
      description: descriptionMatch ? descriptionMatch[1].trim() : null,
      status: statusMatch ? statusMatch[1].toLowerCase().replace(/\s+/, '-') : null,
    };
  }

  parseMoveTask(command) {
    const taskIdMatch = command.match(/(?:task\s+)?(?:#|id\s+)?([a-f0-9]{24})/i);
    const statusMatch = command.match(/(?:to|as|status|state)\s+(todo|in-progress|in progress|done|completed)/i);
    
    let status = statusMatch ? statusMatch[1].toLowerCase().replace(/\s+/, '-') : null;
    if (!status) {
      // Try direct status mentions
      if (command.includes('todo') || command.includes('to do')) status = TASK_STATUS.TODO;
      else if (command.includes('in progress') || command.includes('in-progress')) status = TASK_STATUS.IN_PROGRESS;
      else if (command.includes('done') || command.includes('completed')) status = TASK_STATUS.DONE;
    }

    if (status === 'in progress') status = TASK_STATUS.IN_PROGRESS;
    if (status === 'completed') status = TASK_STATUS.DONE;

    const taskId = taskIdMatch ? taskIdMatch[1] : null;
    if (!taskId) {
      // Try to find task by title
      const titleMatch = command.match(/(?:task|move|change)\s+["']?([^"']+)["']?/i);
      return {
        intent: 'move',
        taskTitle: titleMatch ? titleMatch[1].trim() : null,
        status,
      };
    }

    return {
      intent: 'move',
      taskId,
      status,
    };
  }

  parseAssignTask(command) {
    const taskIdMatch = command.match(/(?:task\s+)?(?:#|id\s+)?([a-f0-9]{24})/i);
    const assigneeMatch = command.match(/(?:to|assign|give|allocate)\s+(?:to\s+)?([a-z\s]+?)(?:\s+with|$)/i);

    const taskId = taskIdMatch ? taskIdMatch[1] : null;
    const assigneeName = assigneeMatch ? assigneeMatch[1].trim() : null;

    if (!taskId) {
      // Try to find task by title
      const titleMatch = command.match(/(?:task|assign)\s+["']?([^"']+)["']?\s+to/i);
      return {
        intent: 'assign',
        taskTitle: titleMatch ? titleMatch[1].trim() : null,
        assigneeName,
      };
    }

    return {
      intent: 'assign',
      taskId,
      assigneeName,
    };
  }

  parseDeleteTask(command) {
    const taskIdMatch = command.match(/(?:task\s+)?(?:#|id\s+)?([a-f0-9]{24})/i);
    
    const taskId = taskIdMatch ? taskIdMatch[1] : null;
    if (!taskId) {
      // Try to find task by title
      const titleMatch = command.match(/(?:task|delete|remove)\s+["']?([^"']+)["']?/i);
      return {
        intent: 'delete',
        taskTitle: titleMatch ? titleMatch[1].trim() : null,
      };
    }

    return {
      intent: 'delete',
      taskId,
    };
  }

  parseListTasks(command) {
    const filters = {};
    
    if (command.includes('assigned to me') || command.includes('my tasks')) {
      filters.assignedToMe = true;
    }
    
    if (command.includes('todo') || command.includes('to do')) {
      filters.status = TASK_STATUS.TODO;
    } else if (command.includes('in progress') || command.includes('in-progress')) {
      filters.status = TASK_STATUS.IN_PROGRESS;
    } else if (command.includes('done') || command.includes('completed')) {
      filters.status = TASK_STATUS.DONE;
    }

    return {
      intent: 'list',
      filters,
    };
  }

  /**
   * Find task by title (fuzzy match)
   */
  async findTaskByTitle(title, tasks) {
    if (!title) return null;
    
    const lowerTitle = title.toLowerCase();
    return tasks.find(task => 
      task.title.toLowerCase().includes(lowerTitle) || 
      lowerTitle.includes(task.title.toLowerCase())
    );
  }

  /**
   * Find user by name (fuzzy match)
   */
  async findUserByName(name) {
    if (!name) return null;
    
    const users = await User.find({ 
      role: ROLES.MEMBER,
      teamId: this.user.teamId 
    });
    
    const lowerName = name.toLowerCase();
    return users.find(user => 
      user.name.toLowerCase().includes(lowerName) || 
      lowerName.includes(user.name.toLowerCase()) ||
      user.email.toLowerCase().includes(lowerName)
    );
  }
}

/**
 * Main assistant handler
 */
const handleAssistant = async (req, res, next) => {
  try {
    const { command, projectId } = req.body;
    const user = req.user;

    if (!command || !command.trim()) {
      throw new BadRequestError('Command is required');
    }

    const assistant = new TaskAssistant(user, projectId || req.body.projectId);
    const parsed = assistant.parseCommand(command);

    // Get current project tasks for context
    const currentProjectId = projectId || req.body.projectId;
    let tasks = [];
    if (currentProjectId) {
      tasks = await Task.find({ projectId: currentProjectId })
        .populate('projectId', 'name')
        .populate('assignedTo', 'name email');
      
      // Filter based on role
      if (user.role === ROLES.MEMBER) {
        tasks = tasks.filter(task => {
          if (!task.assignedTo) return false;
          const assignedToId = typeof task.assignedTo === 'object' 
            ? task.assignedTo._id.toString() 
            : task.assignedTo.toString();
          return assignedToId === user.id.toString();
        });
      }
    }

    let result = { message: '', task: null, tasks: null };

    switch (parsed.intent) {
      case 'create':
        // Check permissions
        if (user.role === ROLES.MEMBER) {
          throw new ForbiddenError('Members cannot create tasks. Only Admins and Managers can create tasks.');
        }

        if (!currentProjectId) {
          throw new BadRequestError('Project ID is required to create a task');
        }

        // Verify project exists
        const project = await Project.findById(currentProjectId);
        if (!project) {
          throw new NotFoundError('Project not found');
        }

        // Find assignee if specified
        let assigneeId = null;
        if (parsed.assigneeName && user.role === ROLES.MANAGER) {
          const assignee = await assistant.findUserByName(parsed.assigneeName);
          if (assignee) {
            assigneeId = assignee._id;
          } else {
            result.message = `Warning: Could not find user "${parsed.assigneeName}". Creating task without assignment. `;
          }
        }

        const newTask = await Task.create({
          title: parsed.title,
          description: parsed.description,
          status: parsed.status || TASK_STATUS.TODO,
          projectId: currentProjectId,
          assignedTo: assigneeId,
        });

        const populatedTask = await Task.findById(newTask._id)
          .populate('projectId', 'name')
          .populate('assignedTo', 'name email');

        // Emit task creation
        const io = req.app.get('io');
        if (io && project.teamId) {
          io.to(`team:${project.teamId}`).emit('task-updated', populatedTask);
        }

        result.message = (result.message || '') + `Task "${parsed.title}" created successfully!`;
        result.task = populatedTask;
        break;

      case 'update':
        let taskToUpdate = null;
        
        if (parsed.taskId) {
          taskToUpdate = await Task.findById(parsed.taskId);
        } else if (parsed.taskTitle) {
          taskToUpdate = await assistant.findTaskByTitle(parsed.taskTitle, tasks);
        }

        if (!taskToUpdate) {
          throw new NotFoundError('Task not found');
        }

        // Check permissions
        if (user.role === ROLES.MEMBER) {
          const assignedToId = taskToUpdate.assignedTo
            ? (typeof taskToUpdate.assignedTo === 'object' ? taskToUpdate.assignedTo._id.toString() : taskToUpdate.assignedTo.toString())
            : null;
          
          if (assignedToId !== user.id.toString()) {
            throw new ForbiddenError('You can only update tasks assigned to you');
          }
          
          // Members can only update status
          if (parsed.status) {
            taskToUpdate.status = parsed.status;
          }
        } else {
          // Admin/Manager can update all fields
          if (parsed.title) taskToUpdate.title = parsed.title;
          if (parsed.description !== null) taskToUpdate.description = parsed.description;
          if (parsed.status) taskToUpdate.status = parsed.status;
        }

        await taskToUpdate.save();
        const updatedTask = await Task.findById(taskToUpdate._id)
          .populate('projectId', 'name')
          .populate('assignedTo', 'name email');

        // Emit task update
        const ioUpdate = req.app.get('io');
        if (ioUpdate && updatedTask.projectId?.teamId) {
          ioUpdate.to(`team:${updatedTask.projectId.teamId}`).emit('task-updated', updatedTask);
        }

        result.message = `Task "${updatedTask.title}" updated successfully!`;
        result.task = updatedTask;
        break;

      case 'move':
        let taskToMove = null;
        
        if (parsed.taskId) {
          taskToMove = await Task.findById(parsed.taskId);
        } else if (parsed.taskTitle) {
          taskToMove = await assistant.findTaskByTitle(parsed.taskTitle, tasks);
        }

        if (!taskToMove) {
          throw new NotFoundError('Task not found');
        }

        if (!parsed.status) {
          throw new BadRequestError('Please specify the status to move the task to');
        }

        // Check permissions
        if (user.role === ROLES.MEMBER) {
          const assignedToId = taskToMove.assignedTo
            ? (typeof taskToMove.assignedTo === 'object' ? taskToMove.assignedTo._id.toString() : taskToMove.assignedTo.toString())
            : null;
          
          if (assignedToId !== user.id.toString()) {
            throw new ForbiddenError('You can only update tasks assigned to you');
          }
        }

        taskToMove.status = parsed.status;
        await taskToMove.save();
        
        const movedTask = await Task.findById(taskToMove._id)
          .populate('projectId', 'name')
          .populate('assignedTo', 'name email');

        // Emit task update
        const ioMove = req.app.get('io');
        if (ioMove && movedTask.projectId?.teamId) {
          ioMove.to(`team:${movedTask.projectId.teamId}`).emit('task-updated', movedTask);
        }

        result.message = `Task "${movedTask.title}" moved to ${parsed.status} successfully!`;
        result.task = movedTask;
        break;

      case 'assign':
        if (user.role !== ROLES.MANAGER) {
          throw new ForbiddenError('Only Managers can assign tasks to members');
        }

        let taskToAssign = null;
        
        if (parsed.taskId) {
          taskToAssign = await Task.findById(parsed.taskId);
        } else if (parsed.taskTitle) {
          taskToAssign = await assistant.findTaskByTitle(parsed.taskTitle, tasks);
        }

        if (!taskToAssign) {
          throw new NotFoundError('Task not found');
        }

        if (!parsed.assigneeName) {
          throw new BadRequestError('Please specify who to assign the task to');
        }

        const assignee = await assistant.findUserByName(parsed.assigneeName);
        if (!assignee) {
          throw new NotFoundError(`User "${parsed.assigneeName}" not found`);
        }

        if (assignee.role !== ROLES.MEMBER) {
          throw new ForbiddenError('Tasks can only be assigned to members');
        }

        taskToAssign.assignedTo = assignee._id;
        await taskToAssign.save();
        
        const assignedTask = await Task.findById(taskToAssign._id)
          .populate('projectId', 'name')
          .populate('assignedTo', 'name email');

        // Emit task update
        const ioAssign = req.app.get('io');
        if (ioAssign && assignedTask.projectId?.teamId) {
          ioAssign.to(`team:${assignedTask.projectId.teamId}`).emit('task-updated', assignedTask);
        }

        result.message = `Task "${assignedTask.title}" assigned to ${assignee.name} successfully!`;
        result.task = assignedTask;
        break;

      case 'delete':
        if (user.role !== ROLES.ADMIN) {
          throw new ForbiddenError('Only Admins can delete tasks');
        }

        let taskToDelete = null;
        
        if (parsed.taskId) {
          taskToDelete = await Task.findById(parsed.taskId);
        } else if (parsed.taskTitle) {
          taskToDelete = await assistant.findTaskByTitle(parsed.taskTitle, tasks);
        }

        if (!taskToDelete) {
          throw new NotFoundError('Task not found');
        }

        await Task.findByIdAndDelete(taskToDelete._id);

        // Emit task deletion
        const ioDelete = req.app.get('io');
        if (ioDelete && taskToDelete.projectId) {
          const project = await Project.findById(taskToDelete.projectId);
          if (project && project.teamId) {
            ioDelete.to(`team:${project.teamId}`).emit('task-deleted', { taskId: taskToDelete._id });
          }
        }

        result.message = `Task "${taskToDelete.title}" deleted successfully!`;
        break;

      case 'list':
        let filteredTasks = [...tasks];
        
        if (parsed.filters.assignedToMe) {
          filteredTasks = filteredTasks.filter(task => {
            if (!task.assignedTo) return false;
            const assignedToId = typeof task.assignedTo === 'object' 
              ? task.assignedTo._id.toString() 
              : task.assignedTo.toString();
            return assignedToId === user.id.toString();
          });
        }
        
        if (parsed.filters.status) {
          filteredTasks = filteredTasks.filter(task => task.status === parsed.filters.status);
        }

        if (filteredTasks.length === 0) {
          result.message = 'No tasks found matching your criteria.';
        } else {
          result.message = `Found ${filteredTasks.length} task(s):`;
        }
        
        result.tasks = filteredTasks;
        break;

      case 'help':
        result.message = `I can help you manage tasks! Here are some commands you can use:

**Create Tasks:**
• "Create a task to fix the login bug"
• "Add a new task called 'Update homepage' with description 'Redesign the homepage'"
• "Make a task to review code assigned to John"

**Update Tasks:**
• "Update task [taskId] description to 'New description'"
• "Change task 'Fix login' status to in-progress"

**Move Tasks:**
• "Move task [taskId] to done"
• "Change task 'Fix login' to in-progress"

**Assign Tasks:**
• "Assign task [taskId] to John"
• "Give task 'Fix login' to Sarah"

**Delete Tasks (Admin only):**
• "Delete task [taskId]"
• "Remove task 'Fix login'"

**List Tasks:**
• "Show me all tasks"
• "What tasks are assigned to me?"
• "List all todo tasks"

**Note:** You can use task titles instead of IDs for most commands!`;
        break;

      case 'unknown':
        result.message = parsed.message || 'I didn\'t understand that command. Try "help" for available commands.';
        break;

      default:
        result.message = 'Unknown command. Try "help" for available commands.';
    }

    successResponse(res, HTTP_STATUS.OK, result.message, {
      message: result.message,
      task: result.task,
      tasks: result.tasks,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleAssistant,
};

