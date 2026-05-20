const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');

const isAdmin = (req) => req.user.role === 'admin';
const isManager = (req) => req.user.role === 'manager';
const ownsProject = (project, req) => project.owner?.toString() === req.user.id;

const canManageProject = (project, req) => {
  return isAdmin(req) || (isManager(req) && ownsProject(project, req));
};

exports.getProjects = async (req, res) => {
  try {
    const query = isAdmin(req)
      ? {}
      : { $or: [{ owner: req.user.id }, { members: req.user.id }] };

    const projects = await Project.find(query)
      .populate('owner', 'name email role')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    if (!isAdmin(req) && !isManager(req)) {
      return res.status(403).json({ message: 'Only admins and managers can create projects' });
    }

    const { title, description, members = [], status } = req.body;
    const validMembers = await User.find({ _id: { $in: members } }).select('_id');

    const project = await Project.create({
      title,
      description,
      status,
      owner: req.user.id,
      members: validMembers.map(user => user._id)
    });

    const populated = await project.populate([
      { path: 'owner', select: 'name email role' },
      { path: 'members', select: 'name email role' }
    ]);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!canManageProject(project, req)) return res.status(403).json({ message: 'Access denied' });

    const updates = { ...req.body };
    if (updates.members) {
      const validMembers = await User.find({ _id: { $in: updates.members } }).select('_id');
      updates.members = validMembers.map(user => user._id);
    }

    const updatedProject = await Project.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('owner', 'name email role')
      .populate('members', 'name email role');

    res.json(updatedProject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!canManageProject(project, req)) return res.status(403).json({ message: 'Access denied' });

    await Task.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
