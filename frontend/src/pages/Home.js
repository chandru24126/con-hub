import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api';

const வகைகள் = ['அனைத்தும்', 'சாலை', 'குடிநீர்', 'மின்சாரம்', 'சுகாதாரம்', 'பாதுகாப்பு', 'கல்வி', 'மற்றவை'];

export default function Home() {
  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem('conhub_user') || '{}');
  const [problems, setProblems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('அனைத்தும்');
  const [votedIds, setVotedIds] = useState([]);
  const [myUserId, setMyUserId] = useState('');

  const [form, setForm] = useState({ தலைப்பு: '', விளக்கம்: '', வகை: 'சாலை' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const getMyUserId = () => {
    try {
      const token = localStorage.getItem('conhub_token');
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '=='.slice(0, (4 - base64.length % 4) % 4);
      const payload = JSON.parse(atob(padded));
      return payload.id || null;
    } catch {
      return null;
    }
  };

  const fetchProblems = useCallback(async () => {
    try {
      const { data } = await API.get('/problems');
      setProblems(data);
      setFiltered(data);
      const uid = getMyUserId();
      if (uid) {
        setMyUserId(uid);
        const myVotes = data
          .filter(p => p.வாக்குகள்.some(v => v.toString() === uid))
          .map(p => p._id);
        setVotedIds(myVotes);
      }
    } catch (err) {
      console.error('Fetch error:', err.response?.data || err.message);
      toast.error('பிரச்னைகள் ஏற்றுவதில் தோல்வி');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  useEffect(() => {
    if (activeFilter === 'அனைத்தும்') setFiltered(problems);
    else setFiltered(problems.filter(p => p.வகை === activeFilter));
  }, [activeFilter, problems]);

  const handleVote = async (id) => {
    try {
      const { data } = await API.post(`/problems/${id}/vote`);
      setVotedIds(prev =>
        data.வாக்களித்தீர்கள் ? [...prev, id] : prev.filter(x => x !== id)
      );
      setProblems(prev => prev.map(p =>
        p._id === id ? { ...p, வாக்குகள்: Array(data.வாக்குகள்).fill('') } : p
      ));
      toast.success(data.வாக்களித்தீர்கள் ? '✅ வாக்களித்தீர்கள்!' : 'வாக்கு நீக்கப்பட்டது');
    } catch (err) {
      toast.error(err.response?.data?.செய்தி || 'வாக்களிக்க முடியவில்லை');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('இந்த பிரச்னையை நீக்க விரும்புகிறீர்களா?')) return;
    try {
      await API.delete(`/problems/${id}`);
      toast.success('பிரச்னை நீக்கப்பட்டது!');
      fetchProblems();
    } catch (err) {
      toast.error(err.response?.data?.செய்தி || 'நீக்க முடியவில்லை');
    }
  };

  const handleSubmit = async () => {
    if (!form.தலைப்பு || !form.விளக்கம்) {
      toast.error('தலைப்பு மற்றும் விளக்கம் கட்டாயம்');
      return;
    }
    setSubmitting(true);
    try {
      let imagePath = null;

      if (imageFile) {
        const fd = new FormData();
        fd.append('image', imageFile);
        const uploadRes = await API.post('/problems/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log('Upload response:', uploadRes.data);
        imagePath = uploadRes.data.path;
      }

      console.log('Sending imagePath:', imagePath);

      await API.post('/problems', {
        title: form.தலைப்பு,
        description: form.விளக்கம்,
        category: form.வகை,
        imagePath: imagePath
      });

      toast.success('பிரச்னை வெற்றிகரமாக சேர்க்கப்பட்டது! ✅');
      setShowModal(false);
      setForm({ தலைப்பு: '', விளக்கம்: '', வகை: 'சாலை' });
      setImageFile(null);
      setImagePreview(null);
      fetchProblems();
    } catch (err) {
      console.error('Error:', err.response?.data || err.message);
      toast.error(err.response?.data?.செய்தி || 'சேர்க்க முடியவில்லை');
    }
    setSubmitting(false);
  };

  const logout = () => {
    localStorage.removeItem('conhub_token');
    localStorage.removeItem('conhub_user');
    nav('/login');
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('ta-IN', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  const isMyProblem = (p) => {
    if (!myUserId) return false;
    const pid = p.பயனர்?._id
      ? p.பயனர்._id.toString()
      : p.பயனர்?.toString() || '';
    return pid === myUserId;
  };

  const getImageSrc = (படம்) => {
    if (!படம்) return null;
    if (படம்.startsWith('http')) return படம்;
    return `https://con-hub-api.onrender.com${படம்}`;
  };

  return (
    <>
      <nav className="navbar">
        <div className="container navbar-inner">
          <div className="logo">
  <img src="/logo.png" alt="CON HUB" style={{ height: '45px', objectFit: 'contain' }} />
</div>
          <div className="nav-info">
            <span className="badge">{user.மாவட்டம்} - {user.தொகுதி}</span>
            <button className="btn btn-danger btn-sm" onClick={logout}>வெளியேறு</button>
          </div>
        </div>
      </nav>

      <div className="home-header">
        <div className="container">
          <h2>வணக்கம், <span>{user.பெயர்}</span>! 👋</h2>
          <p>{user.தொகுதி} தொகுதியின் பிரச்னைகள்</p>
          <div className="stats-bar">
            <div className="stat">மொத்த பிரச்னைகள்: <strong>{problems.length}</strong></div>
            <div className="stat">தீர்க்கப்பட்டவை: <strong>{problems.filter(p => p.நிலை === 'தீர்க்கப்பட்டது').length}</strong></div>
            <div className="stat">நிலுவையில்: <strong>{problems.filter(p => p.நிலை === 'நிலுவையில்').length}</strong></div>
          </div>
        </div>
      </div>

      <div className="problems-section">
        <div className="container">
          <div className="section-top">
            <h3>📋 பிரச்னைகள் பட்டியல்</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="filter-bar">
                {வகைகள்.map(v => (
                  <button
                    key={v}
                    className={`filter-chip ${activeFilter === v ? 'active' : ''}`}
                    onClick={() => setActiveFilter(v)}
                  >{v}</button>
                ))}
              </div>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                + புதிய பிரச்னை
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📭</div>
              <h3>பிரச்னைகள் எதுவும் இல்லை</h3>
              <p>உங்கள் தொகுதியில் முதல் பிரச்னையை சேர்க்கவும்</p>
            </div>
          ) : (
            <div className="problems-grid">
              {filtered.map(p => (
                <div key={p._id} className="problem-card">
                  {getImageSrc(p.படம்) ? (
                    <img
                      src={getImageSrc(p.படம்)}
                      alt={p.தலைப்பு}
                      className="problem-image"
                      onError={(e) => { e.target.style.display='none'; }}
                    />
                  ) : (
                    <div className="problem-image-placeholder">📷</div>
                  )}
                  <div className="problem-body">
                    <div className="problem-meta">
                      <span className={`category-tag cat-${p.வகை}`}>{p.வகை}</span>
                      <span className="status-text">
                        <span className={`status-dot status-${p.நிலை}`}></span>
                        {p.நிலை}
                      </span>
                    </div>
                    <h4 className="problem-title">{p.தலைப்பு}</h4>
                    <p className="problem-desc">{p.விளக்கம்}</p>
                    <div className="problem-footer">
                      <button
                        className={`vote-btn ${votedIds.includes(p._id) ? 'voted' : ''}`}
                        onClick={() => handleVote(p._id)}
                      >
                        👍 <span className="vote-count">{p.வாக்குகள்.length}</span> வாக்குகள்
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="problem-date">{formatDate(p.உருவாக்கப்பட்டது)}</span>
                        {isMyProblem(p) && (
                          <button
                            onClick={() => handleDelete(p._id)}
                            style={{
                              background: 'transparent',
                              border: '1px solid #f25f4c',
                              color: '#f25f4c',
                              borderRadius: '6px',
                              padding: '0.2rem 0.6rem',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontFamily: 'inherit'
                            }}
                          >🗑️ நீக்கு</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>📝 புதிய பிரச்னை சேர்க்கவும்</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="form-group">
              <label>தலைப்பு *</label>
              <input
                placeholder="பிரச்னையின் தலைப்பு"
                value={form.தலைப்பு}
                onChange={e => setForm({ ...form, தலைப்பு: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>வகை *</label>
              <select value={form.வகை} onChange={e => setForm({ ...form, வகை: e.target.value })}>
                {['சாலை', 'குடிநீர்', 'மின்சாரம்', 'சுகாதாரம்', 'பாதுகாப்பு', 'கல்வி', 'மற்றவை'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>விளக்கம் *</label>
              <textarea
                rows="4"
                placeholder="பிரச்னையை விரிவாக விளக்கவும்..."
                value={form.விளக்கம்}
                onChange={e => setForm({ ...form, விளக்கம்: e.target.value })}
                style={{
                  width: '100%', padding: '0.8rem', background: 'var(--surface)',
                  border: '1.5px solid var(--border)', borderRadius: '10px',
                  color: 'var(--text)', fontFamily: 'inherit', fontSize: '0.95rem', resize: 'vertical'
                }}
              />
            </div>

            <div className="form-group">
              <label>படம் பதிவேற்றவும் (விருப்பம்)</label>
              <div className="image-upload-area" onClick={() => document.getElementById('img-input').click()}>
                <p>📷 படத்தை இங்கே கிளிக் செய்து தேர்வு செய்யவும்</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.3rem' }}>அதிகபட்சம் 5MB</p>
                <input
                  id="img-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
              </div>
              {imagePreview && (
                <img src={imagePreview} alt="preview" className="image-preview" />
              )}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem' }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'சேர்க்கிறது...' : '✅ பிரச்னை சேர்க்கவும்'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}