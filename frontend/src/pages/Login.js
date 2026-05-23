import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api';

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ கைபேசி: '', கடவுச்சொல்: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.கைபேசி || !form.கடவுச்சொல்) {
      toast.error('அனைத்து தகவல்களையும் நிரப்பவும்');
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', form);
      localStorage.setItem('conhub_token', data.token);
      localStorage.setItem('conhub_user', JSON.stringify(data.பயனர்));
      toast.success(`வரவேற்கிறோம், ${data.பயனர்.பெயர்}!`);
      nav('/');
    } catch (err) {
      toast.error(err.response?.data?.செய்தி || 'உள்நுழைவு தோல்வி');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
<div className="auth-logo">
  <img src="/logo.png" alt="CON HUB" style={{ height: '100px', objectFit: 'contain', marginBottom: '0.5rem' }} />
  <p>உங்கள் தொகுதியின் குரல்</p>
</div>

        <div className="form-group">
          <label>கைபேசி எண்</label>
          <input
            type="tel"
            name="கைபேசி"
            placeholder="9876543210"
            value={form.கைபேசி}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>கடவுச்சொல்</label>
          <input
            type="password"
            name="கடவுச்சொல்"
            placeholder="கடவுச்சொல் உள்ளிடவும்"
            value={form.கடவுச்சொல்}
            onChange={handleChange}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <button className="btn btn-primary auth-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? 'உள்நுழைகிறது...' : 'உள்நுழைய'}
        </button>

        <div className="auth-switch">
          புதிய பயனரா? <span onClick={() => nav('/register')}>பதிவு செய்யுங்கள்</span>
        </div>
      </div>
    </div>
  );
}