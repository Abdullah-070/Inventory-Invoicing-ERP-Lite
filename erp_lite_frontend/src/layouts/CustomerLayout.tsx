import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppBar, Toolbar, Typography, Box, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, IconButton, useMediaQuery, useTheme,
  Avatar, Badge, InputBase, Popover,
} from '@mui/material';
import {
  Dashboard, Storefront, ShoppingCart, Receipt, Person, LogoutOutlined,
  Menu as MenuIcon, Notifications, Search, Circle, CheckCircle, HourglassEmpty, LocalShipping,
  ShoppingCartCheckout,
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../store';
import { logout } from '../store/authSlice';
import apiClient from '../api/client';

const DRAWER_WIDTH = 260;

const customerMenuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/customer/dashboard' },
  { text: 'Browse Products', icon: <Storefront />, path: '/customer/products' },
  { text: 'My Cart', icon: <ShoppingCartCheckout />, path: '/customer/cart' },
  { text: 'My Orders', icon: <ShoppingCart />, path: '/customer/orders' },
  { text: 'My Invoices', icon: <Receipt />, path: '/customer/invoices' },
  { text: 'My Profile', icon: <Person />, path: '/customer/profile' },
];

export default function CustomerLayout() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifAnchor, setNotifAnchor] = useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = useState<{message: string; icon: React.ReactNode; color: string}[]>([]);
  const [notifRead, setNotifRead] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/api/v1/sales');
      const orders = Array.isArray(data) ? data : [];
      const items: {message: string; icon: React.ReactNode; color: string}[] = [];
      const confirmed = orders.filter((o: any) => o.status === 'CONFIRMED');
      const paid = orders.filter((o: any) => o.status === 'PAID');
      const draft = orders.filter((o: any) => o.status === 'DRAFT');
      if (paid.length > 0)
        items.push({ message: `${paid.length} order(s) paid & completed`, icon: <CheckCircle sx={{ fontSize: 20 }} />, color: '#16a34a' });
      if (confirmed.length > 0)
        items.push({ message: `${confirmed.length} order(s) confirmed`, icon: <LocalShipping sx={{ fontSize: 20 }} />, color: '#3b82f6' });
      if (draft.length > 0)
        items.push({ message: `${draft.length} order(s) pending`, icon: <HourglassEmpty sx={{ fontSize: 20 }} />, color: '#d97706' });
      setNotifications(items);
      setNotifRead(false);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const currentPage = customerMenuItems.find(i => i.path === location.pathname)?.text || 'Customer';
  const cartCount = useSelector((state: RootState) => state.cart.items.reduce((s, i) => s + i.quantity, 0));

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0f1b2d' }}>
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Storefront sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>ERP-Lite</Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>Customer Portal</Typography>
        </Box>
      </Box>

      <List sx={{ flex: 1, px: 1.5, py: 1 }}>
        {customerMenuItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              sx={{
                borderRadius: '8px', mb: 0.5, py: 1,
                bgcolor: active ? 'rgba(245,158,11,0.15)' : 'transparent',
                '&:hover': { bgcolor: active ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)' },
              }}
            >
              <ListItemIcon sx={{ color: active ? '#f59e0b' : '#94a3b8', minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text}
                primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: active ? 600 : 400, color: active ? '#fff' : '#cbd5e1' }} />
              {item.path === '/customer/cart' && cartCount > 0 && (
                <Badge badgeContent={cartCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: 18, height: 18 } }} />
              )}
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ p: 2, mx: 1.5, mb: 1.5, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 34, height: 34, bgcolor: '#f59e0b', fontSize: '0.8rem', fontWeight: 700 }}>
          {(user?.username?.[0] || 'C').toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.8rem' }} noWrap>{user?.username}</Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>Customer</Typography>
        </Box>
        <IconButton size="small" onClick={handleLogout} sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}>
          <LogoutOutlined sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {isMobile ? (
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' } }}>
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer variant="permanent"
          sx={{ width: DRAWER_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' } }}>
          {drawerContent}
        </Drawer>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="sticky" elevation={0}
          sx={{ bgcolor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
          <Toolbar sx={{ gap: 2 }}>
            {isMobile && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ color: '#475569' }}>
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f1f5f9', borderRadius: '8px', px: 1.5, py: 0.5, flex: 1, maxWidth: 400 }}>
              <Search sx={{ color: '#94a3b8', fontSize: 20, mr: 1 }} />
              <InputBase placeholder="Search..." sx={{ flex: 1, fontSize: '0.875rem' }} />
            </Box>
            <Box sx={{ flex: 1 }} />
            <IconButton size="small" sx={{ color: '#64748b' }} onClick={(e) => { setNotifAnchor(e.currentTarget); setNotifRead(true); }}>
              <Badge badgeContent={notifications.length} color="error" variant={!notifRead && notifications.length > 0 ? 'dot' : 'standard'} invisible={notifRead || notifications.length === 0}>
                <Notifications sx={{ fontSize: 22 }} />
              </Badge>
            </IconButton>
            <Popover
              open={Boolean(notifAnchor)}
              anchorEl={notifAnchor}
              onClose={() => setNotifAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{ paper: { sx: { width: 300, borderRadius: '12px', mt: 1, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' } } }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
              </Box>
              {notifications.length === 0 ? (
                <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No notifications</Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {notifications.map((n, i) => (
                    <Box key={i} sx={{ px: 2, py: 1.2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #f1f5f9', cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }}
                      onClick={() => { setNotifAnchor(null); navigate('/customer/orders'); }}>
                      <Box sx={{ color: n.color }}>{n.icon}</Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.82rem' }}>{n.message}</Typography>
                      </Box>
                      <Circle sx={{ fontSize: 8, color: n.color }} />
                    </Box>
                  ))}
                </Box>
              )}
            </Popover>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#f59e0b', fontSize: '0.8rem' }}>
                {(user?.username?.[0] || 'C').toUpperCase()}
              </Avatar>
              <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
                {user?.username}
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Breadcrumbs */}
        <Box sx={{ px: 3, py: 1, borderBottom: '1px solid #f1f5f9' }}>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            Home / <span style={{ color: '#334155', fontWeight: 600 }}>{currentPage}</span>
          </Typography>
        </Box>

        <Box sx={{ flex: 1, bgcolor: '#f8fafc', overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
