import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { apiUrl } from '../api';

export default function CommentsPanel({ taskId, taskTitle, token, onClose }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef(null);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(apiUrl(`/comments/task/${taskId}`), { headers })
      .then(res => setComments(res.data))
      .catch(() => toast.error('Failed to load comments'))
      .finally(() => setLoading(false));
  }, [taskId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await axios.post(apiUrl(`/comments/task/${taskId}`), { text }, { headers });
      setComments(prev => [...prev, res.data]);
      setText('');
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (id) => {
    try {
      await axios.delete(apiUrl(`/comments/${id}`), { headers });
      setComments(prev => prev.filter(c => c._id !== id));
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

  return (
    <div className="comments-overlay" onClick={onClose}>
      <div className="comments-panel" onClick={e => e.stopPropagation()}>
        <div className="comments-header">
          <h3>💬 Comments</h3>
          <p className="comments-task-title">{taskTitle}</p>
          <button className="comments-close" onClick={onClose}>✕</button>
        </div>

        <div className="comments-body">
          {loading ? (
            <div className="comments-loading"><div className="spinner" /></div>
          ) : comments.length === 0 ? (
            <div className="comments-empty">
              <span>💬</span>
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map(c => (
              <div key={c._id} className="comment-item">
                <div className="comment-avatar">{getInitials(c.author?.name)}</div>
                <div className="comment-content">
                  <div className="comment-meta">
                    <span className="comment-author">{c.author?.name}</span>
                    <span className="comment-role">{c.author?.role}</span>
                    <span className="comment-time">{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="comment-text">{c.text}</p>
                </div>
                <button className="comment-delete" onClick={() => deleteComment(c._id)} title="Delete">✕</button>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <form className="comments-form" onSubmit={submit}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(e); }}
          />
          <button type="submit" className="btn btn-primary" disabled={submitting || !text.trim()}>
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      </div>
    </div>
  );
}
