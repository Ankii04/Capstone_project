const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g. 'created', 'updated', 'deleted', 'commented'
  entity: { type: String, required: true }, // 'task' | 'project' | 'comment'
  entityName: { type: String },
  detail: { type: String }, // extra info like "status changed to done"
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
