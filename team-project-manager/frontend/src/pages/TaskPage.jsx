import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { apiUrl } from '../api';

export default function TaskPage() {
  const { token, user, logout } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignedTo: '' });
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };
  const ownerId = project?.owner?._id || project?.owner;
  const canManage = user?.role === 'admin' || (user?.role === 'manager' && ownerId === user?.id);
  const assignableUsers = [
    ...(project?.owner ? [project.owner] : []),
    ...(project?.members || [])
  ].filter(Boolean);

  useEffect(() => {
    // Fetch project info to show nice title
    axios.get(apiUrl('/projects'), { headers })
      .then(res => {
        const proj = res.data.find(p => p._id === id);
        if (proj) setProject(proj);
      })
      .catch(console.error);

    axios.get(apiUrl(`/tasks/${id}`), { headers })
      .then(res => setTasks(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const createTask = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !canManage) return;
    setCreateLoading(true);
    try {
      const res = await axios.post(apiUrl(`/tasks/${id}`), form, { headers });
      setTasks([...tasks, res.data]);
      setForm({ title: '', description: '', priority: 'medium', assignedTo: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setCreateLoading(false);
    }
  };

  const updateStatus = async (taskId, status) => {
    try {
      const res = await axios.put(apiUrl(`/tasks/${taskId}`), { status }, { headers });
      setTasks(tasks.map(t => t._id === taskId ? res.data : t));
    } catch (err) {
      console.error(err);
    }
  };

  const updateAssignee = async (taskId, assignedTo) => {
    try {
      const res = await axios.put(apiUrl(`/tasks/${taskId}`), { assignedTo }, { headers });
      setTasks(tasks.map(t => t._id === taskId ? res.data : t));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await axios.delete(apiUrl(`/tasks/${taskId}`), { headers });
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (err) {
      console.error(err);
    }
  };

  const canUpdateTaskStatus = (task) => {
    const assigneeId = task.assignedTo?._id || task.assignedTo;
    return canManage || assigneeId === user?.id;
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div>
      {/* Premium Sticky Header */}
      <header className="dashboard-header">
        <h2>Team Task Manager</h2>
        <div className="dashboard-user">
          <div className="avatar" title={user?.email}>
            {getUserInitials(user?.name)}
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user?.name}</span>
          <span className="role-chip">{user?.role}</span>
          <button className="btn btn-secondary" onClick={logout} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-container">
        {/* Back Link */}
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <svg style={{ width: 18, height: 18, fill: 'currentColor' }} viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </button>

        {canManage && (
          <section className="creator-section">
            <h3 className="creator-title">
              <svg style={{ width: 22, height: 22, fill: 'hsl(var(--primary))' }} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add New Task
            </h3>
            <form onSubmit={createTask} className="creator-inputs">
              <input 
                placeholder="Task Title" 
                value={form.title} 
                onChange={e => setForm({ ...form, title: e.target.value })} 
                required 
                style={{ flex: 1.5 }}
              />
              <input 
                placeholder="Description" 
                value={form.description} 
                onChange={e => setForm({ ...form, description: e.target.value })} 
                style={{ flex: 2 }}
              />
              <select 
                value={form.assignedTo} 
                onChange={e => setForm({ ...form, assignedTo: e.target.value })}
                style={{ flex: 1 }}
              >
                <option value="">Unassigned</option>
                {assignableUsers.map(member => (
                  <option key={member._id} value={member._id}>{member.name}</option>
                ))}
              </select>
              <select 
                value={form.priority} 
                onChange={e => setForm({ ...form, priority: e.target.value })}
                style={{ flex: 1 }}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <button type="submit" className="btn btn-primary" disabled={createLoading}>
                {createLoading ? 'Adding...' : 'Add Task'}
              </button>
            </form>
          </section>
        )}

        {/* Project Header and Tasks Section */}
        <div className="section-title">
          <h3>Tasks for {project?.title || 'Project'}</h3>
          <span style={{ fontSize: '0.9rem', color: 'hsl(var(--text-secondary))', fontWeight: 500 }}>
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <svg style={{ width: 48, height: 48, fill: 'currentColor', marginBottom: 12, opacity: 0.5 }} viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h4>No tasks in this project yet</h4>
            <p style={{ marginTop: 6, fontSize: '0.9rem' }}>Fill in the details above and add your first task to keep track of progress.</p>
          </div>
        ) : (
          <div className="task-list">
            {tasks.map(t => (
              <div key={t._id} className="task-card">
                <div className="task-details">
                  <div className="task-title-row">
                    <span className="task-title">{t.title}</span>
                    <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                    <span className={`badge badge-${t.status === 'in-progress' ? 'progress' : t.status}`}>
                      {t.status === 'in-progress' ? 'in progress' : t.status}
                    </span>
                  </div>
                  <p className="task-desc">{t.description || 'No description provided.'}</p>
                  <div className="meta-row">
                    <span>Assigned to: {t.assignedTo?.name || 'Unassigned'}</span>
                    {t.assignedTo?.role && <span>{t.assignedTo.role}</span>}
                  </div>
                </div>
                
                <div className="task-controls">
                  {canManage && (
                    <select
                      value={t.assignedTo?._id || ''}
                      onChange={e => updateAssignee(t._id, e.target.value)}
                      className="task-select"
                    >
                      <option value="">Unassigned</option>
                      {assignableUsers.map(member => (
                        <option key={member._id} value={member._id}>{member.name}</option>
                      ))}
                    </select>
                  )}
                  <select 
                    value={t.status} 
                    onChange={e => updateStatus(t._id, e.target.value)} 
                    className="task-select"
                    disabled={!canUpdateTaskStatus(t)}
                  >
                    <option value="todo">Todo</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  {canManage && (
                    <button className="btn btn-danger" onClick={() => deleteTask(t._id)} style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg style={{ width: 16, height: 16, fill: 'currentColor' }} viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
