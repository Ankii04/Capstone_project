import { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { apiUrl } from '../api';

const STATUS_COLORS = ['hsl(38,92%,50%)', 'hsl(195,90%,50%)', 'hsl(145,63%,45%)'];
const PRIORITY_COLORS = ['hsl(215,20%,65%)', 'hsl(32,95%,55%)', 'hsl(355,78%,56%)'];

export default function AnalyticsDashboard({ projectId, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    axios.get(apiUrl(`/analytics/${projectId}`), { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div className="analytics-loading"><div className="spinner" /></div>;
  if (!data) return null;

  const statusData = [
    { name: 'Todo', value: data.byStatus.todo },
    { name: 'In Progress', value: data.byStatus['in-progress'] },
    { name: 'Done', value: data.byStatus.done },
  ];

  const priorityData = [
    { name: 'Low', value: data.byPriority.low },
    { name: 'Medium', value: data.byPriority.medium },
    { name: 'High', value: data.byPriority.high },
  ];

  return (
    <div className="analytics-panel">
      <div className="analytics-header">
        <h3 className="analytics-title">📊 Project Analytics</h3>
        <div className="analytics-kpis">
          <div className="kpi-card">
            <span className="kpi-value">{data.total}</span>
            <span className="kpi-label">Total Tasks</span>
          </div>
          <div className="kpi-card kpi-done">
            <span className="kpi-value">{data.completionRate}%</span>
            <span className="kpi-label">Completed</span>
          </div>
          <div className="kpi-card kpi-overdue">
            <span className="kpi-value">{data.overdue}</span>
            <span className="kpi-label">Overdue</span>
          </div>
          <div className="kpi-card kpi-progress">
            <span className="kpi-value">{data.byStatus['in-progress']}</span>
            <span className="kpi-label">In Progress</span>
          </div>
        </div>
      </div>

      <div className="analytics-charts">
        {/* Status Pie Chart */}
        <div className="chart-card">
          <h4>Tasks by Status</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(224,25%,12%)', border: '1px solid hsl(224,20%,20%)', borderRadius: 8, color: '#fff' }} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.8rem' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Bar Chart */}
        <div className="chart-card">
          <h4>Tasks by Priority</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fill: 'hsl(215,20%,65%)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(215,20%,65%)', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'hsl(224,25%,12%)', border: '1px solid hsl(224,20%,20%)', borderRadius: 8, color: '#fff' }} />
              <Bar dataKey="value" radius={[6,6,0,0]}>
                {priorityData.map((_, i) => <Cell key={i} fill={PRIORITY_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Member Workload */}
        {data.memberWorkload.length > 0 && (
          <div className="chart-card chart-card-wide">
            <h4>Team Workload</h4>
            <div className="workload-list">
              {data.memberWorkload.map((m, i) => (
                <div key={i} className="workload-row">
                  <span className="workload-name">{m.name}</span>
                  <div className="workload-bar-track">
                    <div className="workload-bar-done" style={{ width: m.total > 0 ? `${(m.done/m.total)*100}%` : '0%' }} />
                    <div className="workload-bar-progress" style={{ width: m.total > 0 ? `${(m.inProgress/m.total)*100}%` : '0%' }} />
                    <div className="workload-bar-todo" style={{ width: m.total > 0 ? `${(m.todo/m.total)*100}%` : '0%' }} />
                  </div>
                  <span className="workload-count">{m.total} tasks</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {data.recentActivity?.length > 0 && (
        <div className="activity-feed">
          <h4>Recent Activity</h4>
          <ul>
            {data.recentActivity.map((log, i) => (
              <li key={i} className="activity-item">
                <span className="activity-user">{log.user?.name || 'Someone'}</span>
                <span className="activity-action"> {log.action} </span>
                <span className="activity-entity">{log.entityName}</span>
                {log.detail && <span className="activity-detail"> — {log.detail}</span>}
                <span className="activity-time">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
