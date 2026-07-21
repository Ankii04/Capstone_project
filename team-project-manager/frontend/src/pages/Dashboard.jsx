import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../api';

export default function Dashboard() {
  const { token, user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [overview, setOverview] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const headers = { Authorization: `Bearer ${token}` };
  const canManage = ['admin', 'manager'].includes(user?.role);

  useEffect(() => {
    axios.get(apiUrl('/projects'), { headers })
      .then(res => setProjects(res.data))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));

    if (canManage) {
      axios.get(apiUrl('/users'), { headers })
        .then(res => setUsers(res.data.filter(u => u.id !== user?.id && u._id !== user?.id)))
        .catch(console.error);
    }

    axios.get(apiUrl('/analytics/overview'), { headers })
      .then(res => setOverview(res.data))
      .catch(console.error);
  }, [user?.role]);

  const createProject = async (e) => {
    e.preventDefault();
    if (!title.trim() || !canManage) return;
    setCreateLoading(true);
    try {
      const res = await axios.post(apiUrl('/projects'), { title, description, members }, { headers });
      setProjects([...projects, res.data]);
      setTitle(''); setDescription(''); setMembers([]);
      toast.success('Project created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreateLoading(false);
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await axios.delete(apiUrl(`/projects/${id}`), { headers });
      setProjects(projects.filter(p => p._id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const updateProjectMembers = async (project, memberId) => {
    const currentMembers = (project.members || []).map(m => m._id || m);
    const nextMembers = currentMembers.includes(memberId)
      ? currentMembers.filter(id => id !== memberId)
      : [...currentMembers, memberId];
    try {
      const res = await axios.put(apiUrl(`/projects/${project._id}`), { members: nextMembers }, { headers });
      setProjects(projects.map(p => p._id === project._id ? res.data : p));
      toast.success('Members updated');
    } catch {
      toast.error('Failed to update members');
    }
  };

  const toggleMember = (memberId) => {
    setMembers(current => current.includes(memberId) ? current.filter(id => id !== memberId) : [...current, memberId]);
  };

  const canDeleteProject = (project) => {
    const ownerId = project.owner?._id || project.owner;
    return user?.role === 'admin' || (user?.role === 'manager' && ownerId === user?.id);
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const filteredProjects = projects.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

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
        {/* Overview Stats */}
        {overview && (
          <div className="overview-stats">
            <div className="stat-card">
              <span className="stat-value">{overview.totalProjects}</span>
              <span className="stat-label">Projects</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{overview.total}</span>
              <span className="stat-label">Total Tasks</span>
            </div>
            <div className="stat-card stat-done">
              <span className="stat-value">{overview.completionRate}%</span>
              <span className="stat-label">Completion Rate</span>
            </div>
            <div className="stat-card stat-overdue">
              <span className="stat-value">{overview.overdue}</span>
              <span className="stat-label">Overdue Tasks</span>
            </div>
            <div className="stat-card stat-progress">
              <span className="stat-value">{overview.byStatus?.['in-progress'] || 0}</span>
              <span className="stat-label">In Progress</span>
            </div>
          </div>
        )}

        {canManage && (
          <section className="creator-section">
            <h3 className="creator-title">
              <svg style={{ width: 22, height: 22, fill: 'hsl(var(--primary))' }} viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
              Create New Project
            </h3>
            <form onSubmit={createProject}>
              <div className="creator-inputs">
                <input placeholder="Project Title" value={title} onChange={e => setTitle(e.target.value)} required />
                <input placeholder="Short Description" value={description} onChange={e => setDescription(e.target.value)} />
                <button type="submit" className="btn btn-primary" disabled={createLoading}>{createLoading ? 'Adding...' : 'Add Project'}</button>
              </div>
              <div className="member-picker">
                {users.filter(u => u.role === 'member').map(member => (
                  <label key={member._id} className="member-option">
                    <input type="checkbox" checked={members.includes(member._id)} onChange={() => toggleMember(member._id)} />
                    <span>{member.name}</span>
                    <small>{member.email}</small>
                  </label>
                ))}
              </div>
            </form>
          </section>
        )}

        <div className="section-title">
          <h3>Your Projects</h3>
          <span style={{ fontSize: '0.9rem', color: 'hsl(var(--text-secondary))', fontWeight: 500 }}>{filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}</span>
        </div>

        {/* Search Projects */}
        <div className="search-filter-bar" style={{ marginBottom: '1.5rem' }}>
          <input className="search-input" placeholder="🔍 Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="btn btn-secondary" onClick={() => setSearch('')} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Clear</button>}
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /><p>Loading projects...</p></div>
        ) : filteredProjects.length === 0 ? (
          <div className="empty-state">
            <svg style={{ width: 48, height: 48, fill: 'currentColor', marginBottom: 12, opacity: 0.5 }} viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0h8v12H6V4z" clipRule="evenodd" /></svg>
            <h4>{search ? 'No projects match your search' : 'No projects yet'}</h4>
            <p style={{ marginTop: 6, fontSize: '0.9rem' }}>Fill in the details above to add your first project.</p>
          </div>
        ) : (
          <div className="grid">
            {filteredProjects.map(p => (
              <div key={p._id} className="project-card">
                <div>
                  <div className="project-header">
                    <span className="project-title">{p.title}</span>
                    <span className="badge badge-progress">{p.status || 'active'}</span>
                  </div>
                  <p className="project-description">{p.description || 'No description provided.'}</p>
                  <div className="meta-row">
                    <span>Manager: {p.owner?.name || 'Unknown'}</span>
                    <span>{p.members?.length || 0} member{p.members?.length === 1 ? '' : 's'}</span>
                  </div>
                  {canDeleteProject(p) && users.filter(u => u.role === 'member').length > 0 && (
                    <div className="member-picker member-picker-compact">
                      {users.filter(u => u.role === 'member').map(member => {
                        const projectMembers = (p.members || []).map(item => item._id || item);
                        return (
                          <label key={member._id} className="member-option">
                            <input type="checkbox" checked={projectMembers.includes(member._id)} onChange={() => updateProjectMembers(p, member._id)} />
                            <span>{member.name}</span>
                            <small>{member.email}</small>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="project-footer">
                  <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Created: {new Date(p.createdAt).toLocaleDateString()}</span>
                  <div className="project-actions">
                    <button className="btn btn-secondary" onClick={() => navigate(`/project/${p._id}/tasks`)} style={{ padding: '10px 32px 10px', fontSize: '0.85rem' }}>View Tasks</button>
                    {canDeleteProject(p) && (
                      <button className="btn btn-danger" onClick={() => deleteProject(p._id)} style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg style={{ width: 16, height: 16, fill: 'currentColor' }} viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
