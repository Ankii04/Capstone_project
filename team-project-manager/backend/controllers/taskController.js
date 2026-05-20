const Task = require('../models/Task');
const Project = require('../models/Project');

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

    const task = await Task.create({ ...req.body, assignedTo, project: req.params.projectId });
    const populated = await task.populate('assignedTo', 'name email role');
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

    const userIsAssignee = task.assignedTo?.toString() === req.user.id;
    const allowedMemberUpdate = Object.keys(updates).every(key => key === 'status') && userIsAssignee;

    if (!canManageProject(project, req) && !allowedMemberUpdate) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (updates.assignedTo && !isProjectMember(project, updates.assignedTo) && project.owner?.toString() !== updates.assignedTo) {
      return res.status(400).json({ message: 'Assigned user must be a project member' });
    }

    const updatedTask = await populateTask(Task.findByIdAndUpdate(req.params.id, updates, { new: true }));
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
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
