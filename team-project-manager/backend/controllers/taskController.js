const Task = require('../models/Task');
const Project = require('../models/Project');
const ActivityLog = require('../models/ActivityLog');

const isAdmin = (req) => req.user.role === 'admin';
const isManager = (req) => req.user.role === 'manager';
const ownsProject = (project, req) => project.owner?.toString() === req.user.id;
const isProjectMember = (project, userId) => {
  return project.members.some(member => member.toString() === userId);
};

const canViewProject = (project, req) => {
  return isAdmin(req) || ownsProject(project, req) || isProjectMember(project, req.user.id);
};

const canManageProject = (project, req) => {
  return isAdmin(req) || (isManager(req) && ownsProject(project, req));
};

const populateTask = (query) => query.populate('assignedTo', 'name email role');

const logActivity = async ({ project, user, action, entity, entityName, detail }) => {
  try {
    await ActivityLog.create({ project, user, action, entity, entityName, detail });
  } catch (e) {
    console.error('ActivityLog error:', e.message);
  }
};

exports.getTasks = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!canViewProject(project, req)) return res.status(403).json({ message: 'Access denied' });

    const query = isAdmin(req) || canManageProject(project, req)
      ? { project: req.params.projectId }
      : { project: req.params.projectId, assignedTo: req.user.id };

    const tasks = await populateTask(Task.find(query).sort({ createdAt: -1 }));
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!canManageProject(project, req)) return res.status(403).json({ message: 'Only project managers and admins can create tasks' });

    const assignedTo = req.body.assignedTo || undefined;
    if (assignedTo && !isProjectMember(project, assignedTo) && project.owner?.toString() !== assignedTo) {
      return res.status(400).json({ message: 'Assigned user must be a project member' });
    }

    const taskData = { ...req.body, assignedTo, project: req.params.projectId };
    if (taskData.dueDate === '') taskData.dueDate = null;

    const task = await Task.create(taskData);
    const populated = await task.populate('assignedTo', 'name email role');

    await logActivity({ project: req.params.projectId, user: req.user.id, action: 'created', entity: 'task', entityName: task.title });

    const io = req.app.get('io');
    if (io) io.to(req.params.projectId).emit('task:created', populated);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const updates = { ...req.body };
    if (updates.assignedTo === '') updates.assignedTo = null;
    if (updates.dueDate === '') updates.dueDate = null;

    const userIsAssignee = task.assignedTo?.toString() === req.user.id;
    const allowedMemberUpdate = Object.keys(updates).every(key => key === 'status') && userIsAssignee;

    if (!canManageProject(project, req) && !allowedMemberUpdate) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (updates.assignedTo && !isProjectMember(project, updates.assignedTo) && project.owner?.toString() !== updates.assignedTo) {
      return res.status(400).json({ message: 'Assigned user must be a project member' });
    }

    const oldStatus = task.status;
    const updatedTask = await populateTask(Task.findByIdAndUpdate(req.params.id, updates, { new: true }));

    let detail = '';
    if (updates.status && updates.status !== oldStatus) detail = `status changed to ${updates.status}`;
    await logActivity({ project: task.project, user: req.user.id, action: 'updated', entity: 'task', entityName: task.title, detail });

    const io = req.app.get('io');
    if (io) io.to(task.project.toString()).emit('task:updated', updatedTask);

    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!canManageProject(project, req)) return res.status(403).json({ message: 'Access denied' });

    await Task.findByIdAndDelete(req.params.id);

    await logActivity({ project: task.project, user: req.user.id, action: 'deleted', entity: 'task', entityName: task.title });

    const io = req.app.get('io');
    if (io) io.to(task.project.toString()).emit('task:deleted', { taskId: req.params.id });

    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
