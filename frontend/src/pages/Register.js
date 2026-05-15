import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api';

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ பெயர்: '', கைபேசி: '', கடவுச்சொல்: '', மாவட்டம்: '', தொகுதி: '' });
  const [districts, setDistricts] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get('/auth/districts').then(res => setDistricts(res.data));
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'மாவட்டம்') {
      setForm(prev => ({ ...prev, மாவட்டம்: value, தொகுதி: '' }));
      API.get(`/auth/constituencies/${encodeURIComponent(value)}`).then(res => setConstituencies(res.data));
    }
  };

  const handleSubmit = async () => {
    const { பெயர், கைபேசி, கடவுச்சொல், மாவட்டம், தொகுதி } = form;
    if (!பெயர் || !கைபேசி || !கடவுச்சொல் || !மாவட்டம் || !தொகுதி) {
      toast.error('அனைத்து தகவல்களையும் நிரப்பவும்');
      return;
    }
    if (கைபேசி.length !== 10) {
      toast.error('சரியான கைபேசி எண் உள்ளிடவும்');
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post('/auth/register', form);
      localStorage.setItem('conhub_token', data.token);
      localStorage.setItem('conhub_user', JSON.stringify(data.பயனர்));
      toast.success('பதிவு வெற்றிகரமாக முடிந்தது!');
      nav('/');
    } catch (err) {
      toast.error(err.response?.data?.செய்தி || 'பதிவு தோல்வி');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>🏛️ CON HUB</h1>
          <p>புதிய கணக்கு உருவாக்கவும்</p>
        </div>

        <div className="form-group">
          <label>முழு பெயர்</label>
          <input name="பெயர்" placeholder="உங்கள் பெயர்" value={form.பெயர்} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>கைபேசி எண்</label>
          <input name="கைபேசி" type="tel" placeholder="10 இலக்க கைபேசி எண்" value={form.கைபேசி} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>கடவுச்சொல்</label>
          <input name="கடவுச்சொல்" type="password" placeholder="கடவுச்சொல் அமைக்கவும்" value={form.கடவுச்சொல்} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>மாவட்டம் தேர்வு செய்யவும்</label>
          <select name="மாவட்டம்" value={form.மாவட்டம்} onChange={handleChange}>
            <option value="">-- மாவட்டம் --</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>தொகுதி தேர்வு செய்யவும்</label>
          <select name="தொகுதி" value={form.தொகுதி} onChange={handleChange} disabled={!form.மாவட்டம்}>
            <option value="">-- தொகுதி --</option>
            {constituencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <button className="btn btn-primary auth-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? 'பதிவு செய்கிறது...' : 'பதிவு செய்ய'}
        </button>

        <div className="auth-switch">
          ஏற்கனவே கணக்கு உள்ளதா? <span onClick={() => nav('/login')}>உள்நுழைய</span>
        </div>
      </div>
    </div>
  );
}