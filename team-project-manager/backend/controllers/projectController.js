const Project = require('../models/Project');

exports.getProjects = async (req, res) => {
  const projects = await Project.find({ owner: req.user.id }).populate('members', 'name email');
  res.json(projects);
};

exports.createProject = async (req, res) => {
  const project = await Project.create({ ...req.body, owner: req.user.id });
  res.status(201).json(project);
};

exports.updateProject = async (req, res) => {
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(project);
};

exports.deleteProject = async (req, res) => {
  await Project.findByIdAndDelete(req.params.id);
  res.json({ message: 'Project deleted' });
};
