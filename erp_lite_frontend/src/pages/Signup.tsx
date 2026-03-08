/**
 * Sign up / Registration page – split-panel design
 * Left: dark hero panel  |  Right: white signup form
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  TextField, Button, Box, Typography, Alert, CircularProgress,
  InputAdornment, IconButton, Checkbox, FormControlLabel, Chip, keyframes,
} from '@mui/material';
import {
  VisibilityOutlined, VisibilityOffOutlined, PersonOutline,
  EmailOutlined, LockOutlined, Inventory, Receipt,
  VerifiedOutlined, ArrowForward, ArrowBackOutlined,
} from '@mui/icons-material';
import { AppDispatch } from '../store';
import { loginSuccess, setError } from '../store/authSlice';
import { authAPI } from '../api/auth';

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

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const validateForm = (): boolean => {
    if (!username || username.length < 3) {
      setErrorState('Username must be at least 3 characters');
      return false;
    }
    if (!email || !email.includes('@')) {
      setErrorState('Please enter a valid email');
      return false;
    }
    if (!password || password.length < 8) {
      setErrorState('Password must be at least 8 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setErrorState('Passwords do not match');
      return false;
    }
    if (!agreeTerms) {
      setErrorState('You must agree to the Terms of Service');
      return false;
    }
    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorState(null);
    if (!validateForm()) return;

    setLoading(true);
    try {
      await authAPI.signup({ username, email, password });
      const loginResponse = await authAPI.login({ username, password });
      dispatch(loginSuccess({ user: loginResponse.user, token: loginResponse.access_token }));
      navigate('/customer/dashboard');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Sign up failed. Please try again.';
      setErrorState(errorMsg);
      dispatch(setError(errorMsg));
    } finally {
      setLoading(false);
    }
  };

  /* ── field style helper ───────────────────────────── */
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

      {/* ══════════ LEFT PANEL — dark hero ══════════ */}
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
          background: 'radial-gradient(ellipse at 30% 20%, rgba(59,130,246,0.12) 0%, transparent 60%)',
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
              Next-Gen Enterprise Resource Planning
            </Typography>
          </Box>

          {/* Headline */}
          <Typography variant="h3" sx={{
            fontWeight: 800, lineHeight: 1.15, mb: 2.5,
            fontSize: { md: '2.2rem', lg: '2.6rem' }, letterSpacing: '-0.02em',
            ...anim(0.25),
          }}>
            Streamline your{' '}
            <Box component="span" sx={{ color: C.blue }}>Warehouse</Box>
            {' & '}
            <Box component="span" sx={{ color: C.blue }}>Invoicing</Box>
            {' '}in one place.
          </Typography>

          {/* Subtitle */}
          <Typography sx={{ color: C.light, fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 380, ...anim(0.35) }}>
            Join thousands of businesses managing their inventory
            with precision and futuristic intelligence.
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

      {/* ══════════ RIGHT PANEL — signup form ══════════ */}
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
            Create Account
          </Typography>
          <Typography sx={{ color: C.muted, fontSize: '0.92rem', mb: 1.5, ...anim(0.18) }}>
            Start managing your inventory today.
          </Typography>

          {/* Account type chip */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, ...anim(0.24) }}>
            <Typography variant="body2" sx={{ color: C.light, fontSize: '0.82rem' }}>Account Type:</Typography>
            <Chip
              icon={<PersonOutline sx={{ fontSize: 16 }} />}
              label="Customer"
              size="small"
              sx={{ bgcolor: '#eff6ff', color: C.blue, fontWeight: 700, fontSize: '0.78rem',
                '& .MuiChip-icon': { color: C.blue } }}
            />
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{error}</Alert>}

          <form onSubmit={handleSignup}>
            {/* Full Name / Username */}
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: C.slate, mb: 0.5, ...anim(0.3) }}>Full Name</Typography>
            <TextField
              size="small" fullWidth placeholder="John Doe"
              value={username} onChange={(e) => setUsername(e.target.value)}
              sx={{ ...fieldSx, mb: 2 }}
              InputProps={{ startAdornment: (
                <InputAdornment position="start"><PersonOutline sx={{ fontSize: 18, color: C.light }} /></InputAdornment>
              )}}
            />

            {/* Email */}
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: C.slate, mb: 0.5 }}>Email Address</Typography>
            <TextField
              size="small" fullWidth placeholder="name@company.com" type="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              sx={{ ...fieldSx, mb: 2 }}
              InputProps={{ startAdornment: (
                <InputAdornment position="start"><EmailOutlined sx={{ fontSize: 18, color: C.light }} /></InputAdornment>
              )}}
            />

            {/* Password */}
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: C.slate, mb: 0.5 }}>Create Password</Typography>
            <TextField
              size="small" fullWidth placeholder="••••••••"
              type={showPassword ? 'text' : 'password'}
              value={password} onChange={(e) => setPassword(e.target.value)}
              sx={{ ...fieldSx, mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><LockOutlined sx={{ fontSize: 18, color: C.light }} /></InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword(!showPassword)} disabled={loading}>
                      {showPassword ? <VisibilityOffOutlined sx={{ fontSize: 18 }} /> : <VisibilityOutlined sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Confirm Password */}
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: C.slate, mb: 0.5 }}>Confirm Password</Typography>
            <TextField
              size="small" fullWidth placeholder="••••••••"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              sx={{ ...fieldSx, mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><LockOutlined sx={{ fontSize: 18, color: C.light }} /></InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={loading}>
                      {showConfirmPassword ? <VisibilityOffOutlined sx={{ fontSize: 18 }} /> : <VisibilityOutlined sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Terms checkbox */}
            <FormControlLabel
              control={
                <Checkbox size="small" checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  sx={{ '&.Mui-checked': { color: C.blue } }} />
              }
              label={
                <Typography sx={{ fontSize: '0.78rem', color: C.muted }}>
                  I agree to the{' '}
                  <Box component="span" sx={{ color: C.blue, fontWeight: 600, cursor: 'pointer' }}>Terms of Service</Box>
                  {' and '}
                  <Box component="span" sx={{ color: C.blue, fontWeight: 600, cursor: 'pointer' }}>Privacy Policy</Box>.
                </Typography>
              }
              sx={{ mb: 2.5, ml: -0.5 }}
            />

            {/* Submit */}
            <Button
              type="submit" variant="contained" fullWidth disabled={loading}
              endIcon={!loading && <ArrowForward sx={{ fontSize: 18 }} />}
              sx={{
                bgcolor: C.blue, fontWeight: 700, textTransform: 'none',
                borderRadius: '10px', py: 1.4, fontSize: '0.95rem',
                boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
                '&:hover': { bgcolor: C.blueHov },
                ...anim(0.5),
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Get Started for Free'}
            </Button>

            {/* Sign-in link */}
            <Typography sx={{ textAlign: 'center', mt: 2.5, fontSize: '0.85rem', color: C.muted, ...anim(0.56) }}>
              Already have an account?{' '}
              <Box component="span"
                onClick={() => navigate('/login')}
                sx={{ color: C.navy, fontWeight: 700, cursor: 'pointer', '&:hover': { color: C.blue } }}>
                Sign In
              </Box>
            </Typography>
          </form>
        </Box>

        {/* Footer */}
        <Typography sx={{ mt: 4, fontSize: '0.72rem', color: C.light, letterSpacing: '0.06em', textTransform: 'uppercase', ...anim(0.62) }}>
          © 2026 ERP-Lite Systems — Global Solutions
        </Typography>
      </Box>
    </Box>
  );
}
