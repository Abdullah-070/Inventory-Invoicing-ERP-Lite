/**
 * Splash / Landing screen – inspired by modern SaaS hero pages
 * Matches the ERP-Lite dark-sidebar (#0f1b2d) + blue accent (#3b82f6) color scheme
 */
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Button, Typography, keyframes } from '@mui/material';
import {
  LoginOutlined, GroupAddOutlined, Inventory, TrendingUp,
  People, DarkModeOutlined, Store, Business, LocalShipping,
  AccountBalance, Storefront,
} from '@mui/icons-material';
import { RootState } from '../store';

/* ── Keyframe animations ────────────────────────────── */
const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-14px); }
`;

const easeInOut = keyframes`
  0%   { opacity: 0; }
  20%  { opacity: 1; }
  80%  { opacity: 1; }
  100% { opacity: 0; }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── Palette (re-uses app-wide tokens) ──────────────── */
const C = {
  navy:    '#0f1b2d',
  blue:    '#3b82f6',
  blueHov: '#2563eb',
  slate:   '#334155',
  muted:   '#64748b',
  light:   '#94a3b8',
  bg:      '#f8fafc',
  card:    '#ffffff',
  border:  '#e2e8f0',
  green:   '#10b981',
  amber:   '#f59e0b',
};

/* ── Trusted companies ───────────────────────────────── */
const trustedCompanies = [
  { name: 'RetailMax', icon: Store, color: '#3b82f6' },
  { name: 'ShipFast Co.', icon: LocalShipping, color: '#10b981' },
  { name: 'UrbanMart', icon: Storefront, color: '#8b5cf6' },
  { name: 'TradeLink', icon: Business, color: '#f59e0b' },
  { name: 'FinCorp', icon: AccountBalance, color: '#ec4899' },
];

export default function Splash() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);

  // If already logged in, redirect
  if (isAuthenticated && user) {
    const dest = user.role === 'ADMIN' || user.role === 'STAFF' ? '/admin/dashboard' : '/customer/dashboard';
    navigate(dest, { replace: true });
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: C.bg }}>

      {/* ── Top nav ──────────────────────────────────── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: { xs: 2, md: 5 }, py: 2, bgcolor: C.card,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: C.blue,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Inventory sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: C.navy, letterSpacing: '-0.02em' }}>
            ERP-Lite
          </Typography>
        </Box>
        <Box sx={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
          <DarkModeOutlined sx={{ fontSize: 18 }} />
        </Box>
      </Box>

      {/* ── Hero section ─────────────────────────────── */}
      <Box sx={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', position: 'relative', overflow: 'hidden',
        px: 2, py: { xs: 6, md: 8 },
      }}>

        {/* Decorative bg frame */}
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '92%', md: 620 }, height: { xs: 480, md: 560 },
          border: `1.5px solid ${C.border}`, borderRadius: '20px',
          bgcolor: C.card, boxShadow: '0 8px 40px rgba(15,27,45,0.06)',
          zIndex: 0,
        }} />

        {/* ── Floating card: Monthly Growth (bouncing) ── */}
        <Box sx={{
          position: 'absolute',
          top: { xs: '6%', md: '10%' }, right: { xs: '4%', md: '14%' },
          animation: `${bounce} 3s ease-in-out infinite`,
          zIndex: 2,
        }}>
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.2,
            bgcolor: C.card, borderRadius: '14px', px: 2, py: 1.5,
            boxShadow: '0 4px 20px rgba(15,27,45,0.10)',
          }}>
            <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: '#ecfdf5',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp sx={{ color: C.green, fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: C.light, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Inventory Accuracy
              </Typography>
              <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: C.navy }}>
                99.4%
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* ── Floating card: Members (fade in/out) ────── */}
        <Box sx={{
          position: 'absolute',
          bottom: { xs: '8%', md: '14%' }, left: { xs: '3%', md: '12%' },
          animation: `${easeInOut} 4s ease-in-out infinite`,
          zIndex: 2,
        }}>
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.2,
            bgcolor: C.card, borderRadius: '14px', px: 2, py: 1.3,
            boxShadow: '0 4px 20px rgba(15,27,45,0.10)',
          }}>
            {/* Overlapping avatars */}
            <Box sx={{ display: 'flex', ml: 0.5 }}>
              {[C.blue, C.navy, C.blue].map((c, i) => (
                <Box key={i} sx={{
                  width: 28, height: 28, borderRadius: '50%', bgcolor: c,
                  border: `2px solid ${C.card}`, ml: i ? -1 : 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <People sx={{ color: '#fff', fontSize: 14 }} />
                </Box>
              ))}
            </Box>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: C.navy }}>
              500+ businesses onboard
            </Typography>
          </Box>
        </Box>

        {/* ── Hero content ───────────────────────────── */}
        <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 560 }}>
          {/* Version badge */}
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.8,
            bgcolor: '#eff6ff', borderRadius: '20px', px: 2, py: 0.6, mb: 3,
            animation: `${fadeInUp} 0.6s ease-out`,
          }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: C.green }} />
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: C.blue, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Offline-First Inventory System
            </Typography>
          </Box>

          {/* Headline */}
          <Typography variant="h2" sx={{
            fontWeight: 800, color: C.navy, lineHeight: 1.12,
            fontSize: { xs: '2rem', sm: '2.6rem', md: '3.2rem' },
            letterSpacing: '-0.03em', mb: 2,
            animation: `${fadeInUp} 0.7s ease-out`,
          }}>
            Manage inventory{' '}
            <br />
            & invoicing{' '}
            <Box component="span" sx={{ color: C.blue, fontStyle: 'italic' }}>
              Effortlessly.
            </Box>
          </Typography>

          {/* Subtitle */}
          <Typography sx={{
            color: C.muted, fontSize: { xs: '0.95rem', md: '1.05rem' },
            lineHeight: 1.6, mb: 4, maxWidth: 460, mx: 'auto',
            animation: `${fadeInUp} 0.8s ease-out`,
          }}>
            Track stock, generate invoices, manage purchases and
            payments — all offline. Built for small businesses that
            need reliability without the internet.
          </Typography>

          {/* CTA buttons */}
          <Box sx={{
            display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap',
            animation: `${fadeInUp} 0.9s ease-out`,
          }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<GroupAddOutlined />}
              onClick={() => navigate('/signup')}
              sx={{
                bgcolor: C.navy, color: '#fff', fontWeight: 700,
                textTransform: 'none', borderRadius: '10px',
                px: 3.5, py: 1.3, fontSize: '0.95rem',
                boxShadow: '0 4px 14px rgba(15,27,45,0.25)',
                '&:hover': { bgcolor: '#1a2d47' },
              }}
            >
              Create Account
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<LoginOutlined />}
              onClick={() => navigate('/login')}
              sx={{
                borderColor: C.border, color: C.slate, fontWeight: 700,
                textTransform: 'none', borderRadius: '10px',
                px: 3.5, py: 1.3, fontSize: '0.95rem',
                '&:hover': { borderColor: C.blue, color: C.blue, bgcolor: '#eff6ff' },
              }}
            >
              Sign In
            </Button>
          </Box>

          {/* Demo hint */}
          <Typography sx={{
            mt: 3, fontSize: '0.78rem', color: C.light,
            animation: `${fadeInUp} 1s ease-out`,
          }}>
            Demo credentials — <strong style={{ color: C.slate }}>admin</strong> / <strong style={{ color: C.slate }}>admin123</strong>
          </Typography>
        </Box>
      </Box>

      {/* ── Trusted by section ───────────────────────── */}
      <Box sx={{ textAlign: 'center', pb: 2, pt: 1 }}>
        <Typography sx={{
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: C.light, mb: 2,
        }}>
          Trusted by Growing Businesses
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 2.5, md: 4 }, mb: 3, flexWrap: 'wrap', px: 2 }}>
          {trustedCompanies.map((co) => (
            <Box key={co.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, opacity: 0.6, transition: 'opacity 0.2s', '&:hover': { opacity: 1 } }}>
              <co.icon sx={{ fontSize: 20, color: co.color }} />
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: C.slate, letterSpacing: '-0.01em' }}>
                {co.name}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Footer ───────────────────────────────────── */}
      <Box sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        px: { xs: 2, md: 5 }, py: 2, borderTop: `1px solid ${C.border}`, bgcolor: C.card,
        flexWrap: 'wrap', gap: 1,
      }}>
        <Typography sx={{ fontSize: '0.78rem', color: C.light }}>
          © 2026 ERP-Lite. All rights reserved.
        </Typography>
        <Box sx={{ display: 'flex', gap: 3 }}>
          {['Privacy Policy', 'Terms of Service', 'Help Center'].map((t) => (
            <Typography key={t} sx={{
              fontSize: '0.78rem', color: C.muted, cursor: 'pointer',
              '&:hover': { color: C.blue },
            }}>
              {t}
            </Typography>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
