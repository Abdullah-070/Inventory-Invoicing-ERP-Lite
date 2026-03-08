/**
 * Login page – split-panel design
 * Left: white login form  |  Right: dark hero panel
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box, TextField, Button, Typography, Alert, CircularProgress,
  InputAdornment, IconButton, Checkbox, FormControlLabel, keyframes,
} from '@mui/material';
import {
  VisibilityOutlined, VisibilityOffOutlined, Inventory, ArrowBackOutlined,
  VerifiedOutlined, Receipt,
} from '@mui/icons-material';
import { AppDispatch } from '../store';
import { loginSuccess, setError } from '../store/authSlice';
import apiClient from '../api/client';

/* ── Palette ─────────────────────────────────────────── */
const C = {
  navy: '#0f1b2d',
  navyLight: '#162236',
  blue: '#3b82f6',
  blueHov: '#2563eb',
  slate: '#334155',
  muted: '#64748b',
  light: '#94a3b8',
  bg: '#f8fafc',
  card: '#ffffff',
  border: '#e2e8f0',
};

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const anim = (delay: number) => ({
  opacity: 0,
  animation: `${fadeInUp} 0.6s ease-out ${delay}s forwards`,
});

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoadingState] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingState(true);
    setErrorState(null);

    try {
      const response = await apiClient.post('/api/v1/auth/login', { username, password });
      const { access_token, user } = response.data;
      dispatch(loginSuccess({ user, token: access_token }));
      if (user.role === 'ADMIN' || user.role === 'STAFF') {
        navigate('/admin/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Login failed. Please try again.';
      setErrorState(errorMsg);
      dispatch(setError(errorMsg));
    } finally {
      setLoadingState(false);
    }
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px', bgcolor: C.card,
      '& fieldset': { borderColor: C.border },
      '&:hover fieldset': { borderColor: C.light },
      '&.Mui-focused fieldset': { borderColor: C.blue },
    },
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>

      {/* ══════════ LEFT PANEL — login form ══════════ */}
      <Box sx={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        bgcolor: C.bg, px: { xs: 2, sm: 4 }, py: 4,
      }}>
        <Box sx={{ width: '100%', maxWidth: 420 }}>

          {/* Back button */}
          <Button
            startIcon={<ArrowBackOutlined sx={{ fontSize: 18 }} />}
            onClick={() => navigate('/')}
            sx={{
              mb: 2.5, color: C.muted, fontWeight: 600, textTransform: 'none',
              fontSize: '0.85rem', px: 0, '&:hover': { color: C.blue, bgcolor: 'transparent' },
              ...anim(0.05),
            }}
          >
            Back to Home
          </Button>

          {/* Title area */}
          <Typography variant="h4" sx={{ fontWeight: 800, color: C.navy, mb: 0.5, fontSize: '1.8rem', ...anim(0.12) }}>
            Welcome Back
          </Typography>
          <Typography sx={{ color: C.muted, fontSize: '0.92rem', mb: 3, ...anim(0.18) }}>
            Enter your credentials to access the dashboard
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{error}</Alert>}

          <form onSubmit={handleLogin}>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: C.slate, mb: 0.5, ...anim(0.24) }}>
              Username
            </Typography>
            <TextField
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth required disabled={loading}
              placeholder="Enter your username"
              size="small"
              sx={{ ...fieldSx, mb: 2, ...anim(0.24) }}
            />

            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: C.slate, mb: 0.5, ...anim(0.3) }}>
              Password
            </Typography>
            <TextField
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth required disabled={loading}
              placeholder="Enter your password"
              size="small"
              sx={{ ...fieldSx, mb: 1, ...anim(0.3) }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                      {showPassword ? <VisibilityOffOutlined fontSize="small" /> : <VisibilityOutlined fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <FormControlLabel
              control={<Checkbox size="small" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                sx={{ '&.Mui-checked': { color: C.blue } }} />}
              label={<Typography variant="body2" sx={{ color: C.muted }}>Remember this device</Typography>}
              sx={{ mb: 2.5, ...anim(0.36) }}
            />

            <Button
              type="submit" variant="contained" fullWidth disabled={loading}
              sx={{
                py: 1.4, borderRadius: '10px', textTransform: 'none', fontWeight: 700,
                fontSize: '0.95rem', bgcolor: C.blue,
                boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
                '&:hover': { bgcolor: C.blueHov },
                ...anim(0.42),
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In to Dashboard'}
            </Button>
          </form>

          <Typography sx={{ textAlign: 'center', mt: 2.5, fontSize: '0.85rem', color: C.muted, ...anim(0.48) }}>
            Don't have an account?{' '}
            <Box component="span"
              onClick={() => navigate('/signup')}
              sx={{ color: C.navy, fontWeight: 700, cursor: 'pointer', '&:hover': { color: C.blue } }}>
              Sign Up
            </Box>
          </Typography>

          {/* Demo hint */}
          <Typography sx={{ textAlign: 'center', mt: 1.5, fontSize: '0.78rem', color: C.light, ...anim(0.54) }}>
            Demo: admin / admin123
          </Typography>
        </Box>

        {/* Footer */}
        <Typography sx={{ mt: 4, fontSize: '0.72rem', color: C.light, letterSpacing: '0.06em', textTransform: 'uppercase', ...anim(0.6) }}>
          © 2026 ERP-Lite Systems — Global Solutions
        </Typography>
      </Box>

      {/* ══════════ RIGHT PANEL — dark hero ══════════ */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column', justifyContent: 'space-between',
        width: '48%', bgcolor: C.navy, color: '#fff',
        px: { md: 5, lg: 7 }, py: 5,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle gradient overlay */}
        <Box sx={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.12) 0%, transparent 60%)',
        }} />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.8,
            bgcolor: 'rgba(59,130,246,0.15)', borderRadius: '20px', px: 2, py: 0.6, mb: 4,
            ...anim(0.1),
          }}>
            <VerifiedOutlined sx={{ fontSize: 16, color: C.blue }} />
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#93c5fd' }}>
              Trusted by 500+ Businesses
            </Typography>
          </Box>

          {/* Headline */}
          <Typography variant="h3" sx={{
            fontWeight: 800, lineHeight: 1.15, mb: 2.5,
            fontSize: { md: '2.2rem', lg: '2.6rem' }, letterSpacing: '-0.02em',
            ...anim(0.25),
          }}>
            Your complete{' '}
            <Box component="span" sx={{ color: C.blue }}>Inventory</Box>
            {' & '}
            <Box component="span" sx={{ color: C.blue }}>Invoicing</Box>
            {' '}solution.
          </Typography>

          {/* Subtitle */}
          <Typography sx={{ color: C.light, fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 380, ...anim(0.35) }}>
            Track stock levels, generate invoices, and manage your
            entire supply chain from a single dashboard.
          </Typography>

          {/* Feature cards */}
          <Box sx={{ display: 'flex', gap: 2, mt: 4, ...anim(0.45) }}>
            {[
              { icon: <Inventory sx={{ fontSize: 20 }} />, label: 'Smart Inventory' },
              { icon: <Receipt sx={{ fontSize: 20 }} />, label: 'Auto Invoicing' },
            ].map((f) => (
              <Box key={f.label} sx={{
                bgcolor: C.navyLight, border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px', px: 2.5, py: 2, minWidth: 150,
              }}>
                <Box sx={{ color: C.blue, mb: 1 }}>{f.icon}</Box>
                <Typography sx={{ fontSize: '0.88rem', fontWeight: 700 }}>{f.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Bottom logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, position: 'relative', zIndex: 1, ...anim(0.55) }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: '8px', bgcolor: C.blue,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Inventory sx={{ color: '#fff', fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }}>ERP-Lite</Typography>
        </Box>
      </Box>
    </Box>
  );
}
