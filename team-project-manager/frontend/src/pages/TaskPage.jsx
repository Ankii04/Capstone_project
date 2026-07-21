import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useParams, useNavigate } from 'react-router-dom';
import { apiUrl } from '../api';
import KanbanBoard from '../components/KanbanBoard';
import CommentsPanel from '../components/CommentsPanel';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

export default function TaskPage() {
  const { token, user, logout } = useAuth();
  const socketRef = useSocket();
  const { id } = useParams();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '' });
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [commentsTask, setCommentsTask] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsKey, setAnalyticsKey] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const headers = { Authorization: `Bearer ${token}` };
  const ownerId = project?.owner?._id || project?.owner;
  const canManage = user?.role === 'admin' || (user?.role === 'manager' && ownerId === user?.id);
  const assignableUsers = [
    ...(project?.owner ? [project.owner] : []),
    ...(project?.members || [])
  ].filter(Boolean);

  useEffect(() => {
    axios.get(apiUrl('/projects'), { headers })
      .then(res => { const proj = res.data.find(p => p._id === id); if (proj) setProject(proj); })
      .catch(() => toast.error('Failed to load project'));

    axios.get(apiUrl(`/tasks/${id}`), { headers })
      .then(res => setTasks(res.data))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  }, [id]);

  // Socket.IO real-time updates
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;
    socket.emit('join:project', id);
    socket.on('task:created', (task) => setTasks(prev => [task, ...prev]));
    socket.on('task:updated', (task) => setTasks(prev => prev.map(t => t._id === task._id ? task : t)));
    socket.on('task:deleted', ({ taskId }) => setTasks(prev => prev.filter(t => t._id !== taskId)));
    return () => {
      socket.emit('leave:project', id);
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:deleted');
    };
  }, [id, socketRef?.current]);

  const createTask = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !canManage) return;
    setCreateLoading(true);
    try {
      await axios.post(apiUrl(`/tasks/${id}`), form, { headers });
      setForm({ title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '' });
      toast.success('Task created!');
      setAnalyticsKey(k => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setCreateLoading(false);
    }
  };

  const updateStatus = async (taskId, status) => {
    try {
      await axios.put(apiUrl(`/tasks/${taskId}`), { status }, { headers });
      toast.success(`Moved to ${status}`);
      setAnalyticsKey(k => k + 1);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const updateAssignee = async (taskId, assignedTo) => {
    try {
      await axios.put(apiUrl(`/tasks/${taskId}`), { assignedTo }, { headers });
      toast.success('Assignee updated');
    } catch {
      toast.error('Failed to update assignee');
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await axios.delete(apiUrl(`/tasks/${taskId}`), { headers });
      toast.success('Task deleted');
      setAnalyticsKey(k => k + 1);
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || (t.description || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  return (
    <div>
      <header className="dashboard-header">
        <h2>Team Task Manager</h2>
        <div className="dashboard-user">
          <div className="avatar" title={user?.email}>{getUserInitials(user?.name)}</div>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user?.name}</span>
          <span className="role-chip">{user?.role}</span>
          <button className="btn btn-secondary" onClick={logout} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Logout</button>
        </div>
      </header>

      <div className="dashboard-container">
        <div className="taskpage-top-bar">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            <svg style={{ width: 18, height: 18, fill: 'currentColor' }} viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
            Back to Dashboard
          </button>
          <button className="btn btn-secondary analytics-toggle" onClick={() => setShowAnalytics(s => !s)}>
            {showAnalytics ? '📊 Hide Analytics' : '📊 Show Analytics'}
          </button>
        </div>

        {showAnalytics && (
          <AnalyticsDashboard key={analyticsKey} projectId={id} token={token} />
        )}

        {canManage && (
          <section className="creator-section">
            <h3 className="creator-title">
              <svg style={{ width: 22, height: 22, fill: 'hsl(var(--primary))' }} viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
              Add New Task
            </h3>
            <form onSubmit={createTask} className="creator-inputs creator-inputs-grid">
              <input placeholder="Task Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={{ flex: 1.5 }} />
              <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ flex: 2 }} />
              <select value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} style={{ flex: 1 }}>
                <option value="">Unassigned</option>
                {assignableUsers.map(member => <option key={member._id} value={member._id}>{member.name}</option>)}
              </select>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={{ flex: 1 }}>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="date-input" title="Due Date" style={{ flex: 1 }} />
              <button type="submit" className="btn btn-primary" disabled={createLoading}>{createLoading ? 'Adding...' : 'Add Task'}</button>
            </form>
          </section>
        )}

        <div className="section-title">
          <h3>Tasks — {project?.title || 'Project'}</h3>
          <span style={{ fontSize: '0.9rem', color: 'hsl(var(--text-secondary))', fontWeight: 500 }}>{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Search & Filter */}
        <div className="search-filter-bar">
          <input className="search-input" placeholder="🔍 Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="todo">Todo</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select className="filter-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          {(search || filterStatus !== 'all' || filterPriority !== 'all') && (
            <button className="btn btn-secondary" onClick={() => { setSearch(''); setFilterStatus('all'); setFilterPriority('all'); }} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Clear</button>
          )}
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /><p>Loading tasks...</p></div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <svg style={{ width: 48, height: 48, fill: 'currentColor', marginBottom: 12, opacity: 0.5 }} viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            <h4>No tasks yet</h4>
            <p style={{ marginTop: 6, fontSize: '0.9rem' }}>Add your first task above.</p>
          </div>
        ) : (
          <KanbanBoard
            tasks={filteredTasks}
            canManage={canManage}
            assignableUsers={assignableUsers}
            onUpdateStatus={updateStatus}
            onDelete={deleteTask}
            onOpenComments={setCommentsTask}
            onUpdateAssignee={updateAssignee}
          />
        )}
      </div>

      {commentsTask && (
        <CommentsPanel
          taskId={commentsTask._id}
          taskTitle={commentsTask.title}
          token={token}
          onClose={() => setCommentsTask(null)}
        />
      )}
    </div>
  );
}
