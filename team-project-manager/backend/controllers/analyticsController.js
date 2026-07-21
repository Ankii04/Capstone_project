const Task = require('../models/Task');
const Project = require('../models/Project');
const ActivityLog = require('../models/ActivityLog');

exports.getProjectAnalytics = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).populate('members', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const tasks = await Task.find({ project: projectId }).populate('assignedTo', 'name');

    const total = tasks.length;
    const byStatus = {
      todo: tasks.filter(t => t.status === 'todo').length,
      'in-progress': tasks.filter(t => t.status === 'in-progress').length,
      done: tasks.filter(t => t.status === 'done').length,
    };
    const byPriority = {
      low: tasks.filter(t => t.priority === 'low').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      high: tasks.filter(t => t.priority === 'high').length,
    };
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;
    const completionRate = total > 0 ? Math.round((byStatus.done / total) * 100) : 0;

    // Per-member workload
    const memberWorkload = [];
    const allAssignable = [
      ...(project.owner ? [project.owner] : []),
      ...(project.members || [])
    ];

    for (const member of allAssignable) {
      const memberId = member._id || member;
      const memberTasks = tasks.filter(t => t.assignedTo?._id?.toString() === memberId.toString() || t.assignedTo?.toString() === memberId.toString());
      memberWorkload.push({
        name: member.name || 'Unknown',
        total: memberTasks.length,
        done: memberTasks.filter(t => t.status === 'done').length,
        inProgress: memberTasks.filter(t => t.status === 'in-progress').length,
        todo: memberTasks.filter(t => t.status === 'todo').length,
      });
    }

    // Recent activity
    const recentActivity = await ActivityLog.find({ project: projectId })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ total, byStatus, byPriority, overdue, completionRate, memberWorkload, recentActivity });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOverviewAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const projectQuery = isAdmin ? {} : { $or: [{ owner: userId }, { members: userId }] };
    const projects = await Project.find(projectQuery);
    const projectIds = projects.map(p => p._id);

    const tasks = await Task.find({ project: { $in: projectIds } });
    const total = tasks.length;
    const byStatus = {
      todo: tasks.filter(t => t.status === 'todo').length,
      'in-progress': tasks.filter(t => t.status === 'in-progress').length,
      done: tasks.filter(t => t.status === 'done').length,
    };
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;
    const completionRate = total > 0 ? Math.round((byStatus.done / total) * 100) : 0;

    res.json({ totalProjects: projects.length, total, byStatus, overdue, completionRate });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
