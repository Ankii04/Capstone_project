const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Project = require('../models/Project');
const ActivityLog = require('../models/ActivityLog');

const canAccessProject = (project, req) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';
  const isOwner = project.owner?.toString() === userId;
  const isMember = project.members.some(m => m.toString() === userId);
  return isAdmin || isOwner || isMember;
};

exports.getComments = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!project || !canAccessProject(project, req)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const comments = await Comment.find({ task: req.params.taskId })
      .populate('author', 'name email role')
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Comment text is required' });

    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!project || !canAccessProject(project, req)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const comment = await Comment.create({ task: req.params.taskId, author: req.user.id, text: text.trim() });
    const populated = await comment.populate('author', 'name email role');

    await ActivityLog.create({
      project: task.project,
      user: req.user.id,
      action: 'commented',
      entity: 'task',
      entityName: task.title,
      detail: text.trim().slice(0, 100)
    });

    // Emit socket event if io is available
    const io = req.app.get('io');
    if (io) io.to(task.project.toString()).emit('comment:added', { taskId: req.params.taskId, comment: populated });

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const isOwner = comment.author.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Access denied' });

    await Comment.findByIdAndDelete(req.params.id);

    const io = req.app.get('io');
    if (io) {
      const task = await Task.findById(comment.task);
      if (task) io.to(task.project.toString()).emit('comment:deleted', { commentId: req.params.id, taskId: comment.task });
    }

    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
