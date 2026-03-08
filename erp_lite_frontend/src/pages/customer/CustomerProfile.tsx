import { useEffect, useState } from 'react';
import {
  Typography, Paper, Box, TextField, Button, Alert,
  CircularProgress, Avatar, Chip,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import apiClient from '../../api/client';

export default function CustomerProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', full_name: '' });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/api/v1/auth/me');
      setUser(res.data);
      setForm({ email: res.data.email || '', full_name: res.data.full_name || '' });
    } catch {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        setForm({ email: u.email || '', full_name: u.full_name || '' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.put('/api/v1/auth/me', form);
      setSuccess('Profile updated successfully');
      const updated = { ...user, ...form };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ px: 3, py: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>My Profile</Typography>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Paper elevation={0} sx={{ borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {/* Header banner */}
        <Box sx={{ height: 80, bgcolor: 'linear-gradient(135deg, #0f1b2d 0%, #1e3a5f 100%)', background: 'linear-gradient(135deg, #0f1b2d 0%, #1e3a5f 100%)' }} />
        <Box sx={{ px: 3, pb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mt: -4, mb: 3 }}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: '#f59e0b', fontSize: 28, fontWeight: 700, border: '4px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              {(user?.username?.[0] || 'U').toUpperCase()}
            </Avatar>
            <Box sx={{ pb: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{user?.username}</Typography>
              <Chip label={user?.role || 'CUSTOMER'} size="small"
                sx={{ bgcolor: '#eff6ff', color: '#3b82f6', fontWeight: 600, fontSize: '0.7rem', height: 22, mt: 0.3 }} />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Username" value={user?.username || ''} fullWidth disabled size="small"
              helperText="Username cannot be changed"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
            <TextField
              label="Email" type="email" value={form.email} size="small"
              onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
            <TextField
              label="Full Name" value={form.full_name} size="small"
              onChange={(e) => setForm({ ...form, full_name: e.target.value })} fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
            <TextField
              label="Account Type" value="Customer" fullWidth disabled size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
            <TextField
              label="Member Since" size="small"
              value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
              fullWidth disabled
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Box>

          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
            onClick={handleSave}
            disabled={saving}
            fullWidth
            sx={{ mt: 3, textTransform: 'none', borderRadius: '8px', bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, fontWeight: 600 }}
          >
            Save Changes
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
