import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppBar, Toolbar, Typography, Box, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, Divider, IconButton, useMediaQuery, useTheme,
  Avatar, InputBase, Badge, Breadcrumbs, Link, Popover,
} from '@mui/material';
import {
  Dashboard, Inventory, People, LocalShipping, ShoppingCart,
  Receipt, Payment, Assessment, FileUpload, LogoutOutlined,
  Menu as MenuIcon, Category, History, Search, NotificationsNone,
  NavigateNext, Warning, PendingActions, Circle,
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../store';
import { logout } from '../store/authSlice';
import apiClient from '../api/client';

const DRAWER_WIDTH = 260;

const adminMenuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard' },
  { text: 'Products', icon: <Inventory />, path: '/admin/products' },
  { text: 'Categories', icon: <Category />, path: '/admin/categories' },
  { text: 'Inventory', icon: <Inventory />, path: '/admin/inventory' },
  { text: 'Stock History', icon: <History />, path: '/admin/stock' },
  { text: 'Customers', icon: <People />, path: '/admin/customers' },
  { text: 'Suppliers', icon: <LocalShipping />, path: '/admin/suppliers' },
  { text: 'Sales Orders', icon: <ShoppingCart />, path: '/admin/sales' },
  { text: 'Purchases', icon: <Receipt />, path: '/admin/purchases' },
  { text: 'Payments', icon: <Payment />, path: '/admin/payments' },
  { text: 'Reports', icon: <Assessment />, path: '/admin/reports' },
  { text: 'CSV Import/Export', icon: <FileUpload />, path: '/admin/csv' },
];

function getInitials(name?: string) {
  if (!name) return 'A';
  return name.charAt(0).toUpperCase();
}

export default function AdminLayout() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifAnchor, setNotifAnchor] = useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = useState<{type: string; message: string; color: string}[]>([]);
  const [notifRead, setNotifRead] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/api/v1/reports/dashboard');
      const items: {type: string; message: string; color: string}[] = [];
      if (data.pending?.sales_orders > 0)
        items.push({ type: 'pending', message: `${data.pending.sales_orders} pending sales order(s)`, color: '#d97706' });
      if (data.pending?.purchases > 0)
        items.push({ type: 'pending', message: `${data.pending.purchases} pending purchase(s)`, color: '#d97706' });
      if (data.inventory?.out_of_stock_count > 0)
        items.push({ type: 'alert', message: `${data.inventory.out_of_stock_count} product(s) out of stock`, color: '#ef4444' });
      if (data.inventory?.low_stock_count > 0)
        items.push({ type: 'alert', message: `${data.inventory.low_stock_count} product(s) low on stock`, color: '#f97316' });
      setNotifications(items);
      setNotifRead(false);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const currentPage = adminMenuItems.find(i => i.path === location.pathname)?.text || 'Admin';

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0f1b2d' }}>
      {/* Logo area */}
      <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: '10px', bgcolor: '#3b82f6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Inventory sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.2 }}>ERP-Lite</Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
            Inventory Management
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* Navigation */}
      <List sx={{ flex: 1, px: 1.5, py: 1 }}>
        {adminMenuItems.map((item) => {
          const selected = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              selected={selected}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              sx={{
                borderRadius: '8px',
                mb: 0.3,
                py: 1,
                px: 1.5,
                color: selected ? '#fff' : 'rgba(255,255,255,0.6)',
                bgcolor: selected ? '#3b82f6' : 'transparent',
                '&:hover': { bgcolor: selected ? '#3b82f6' : 'rgba(255,255,255,0.06)' },
                '&.Mui-selected': { bgcolor: '#3b82f6' },
                '&.Mui-selected:hover': { bgcolor: '#2563eb' },
                transition: 'all 0.15s',
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 36, '& .MuiSvgIcon-root': { fontSize: 20 } }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: selected ? 600 : 400 }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* User card */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 34, height: 34, bgcolor: '#3b82f6', fontSize: '0.85rem', fontWeight: 600 }}>
          {getInitials(user?.username)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ color: '#fff', fontWeight: 500, fontSize: '0.82rem' }}>
            {user?.username}
          </Typography>
          <Typography variant="caption" noWrap sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem' }}>
            {user?.role}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleLogout} sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#ef4444' } }}>
          <LogoutOutlined fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' } }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none' },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: '#fff',
            borderBottom: '1px solid #e2e8f0',
            color: '#1e293b',
          }}
        >
          <Toolbar sx={{ gap: 2 }}>
            {isMobile && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
            )}

            {/* Search bar */}
            <Box sx={{
              display: 'flex', alignItems: 'center', bgcolor: '#f1f5f9', borderRadius: '8px',
              px: 1.5, py: 0.5, flex: 1, maxWidth: 420,
            }}>
              <Search sx={{ color: '#94a3b8', fontSize: 20, mr: 1 }} />
              <InputBase placeholder="Search products, orders, customers..." sx={{ flex: 1, fontSize: '0.875rem' }} />
            </Box>

            <Box sx={{ flex: 1 }} />

            {/* Notification bell */}
            <IconButton size="small" sx={{ color: '#64748b' }} onClick={(e) => { setNotifAnchor(e.currentTarget); setNotifRead(true); }}>
              <Badge badgeContent={notifications.length} color="error" variant={!notifRead && notifications.length > 0 ? 'dot' : 'standard'} invisible={notifRead || notifications.length === 0}>
                <NotificationsNone />
              </Badge>
            </IconButton>
            <Popover
              open={Boolean(notifAnchor)}
              anchorEl={notifAnchor}
              onClose={() => setNotifAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{ paper: { sx: { width: 320, borderRadius: '12px', mt: 1, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' } } }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
              </Box>
              {notifications.length === 0 ? (
                <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">All clear — no notifications</Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {notifications.map((n, i) => (
                    <Box key={i} sx={{ px: 2, py: 1.2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #f1f5f9', cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }}
                      onClick={() => { setNotifAnchor(null); navigate(n.type === 'pending' ? '/admin/sales' : '/admin/inventory'); }}>
                      {n.type === 'alert' ? <Warning sx={{ color: n.color, fontSize: 20 }} /> : <PendingActions sx={{ color: n.color, fontSize: 20 }} />}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.82rem' }}>{n.message}</Typography>
                      </Box>
                      <Circle sx={{ fontSize: 8, color: n.color }} />
                    </Box>
                  ))}
                </Box>
              )}
            </Popover>

            {/* User avatar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: '#3b82f6', fontSize: '0.85rem', fontWeight: 600 }}>
                {getInitials(user?.username)}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>{user?.username}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{user?.role}</Typography>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Breadcrumb */}
        <Box sx={{ px: 3, pt: 2 }}>
          <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ fontSize: '0.8rem' }}>
            <Link underline="hover" color="inherit" sx={{ cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => navigate('/admin/dashboard')}>
              Home
            </Link>
            <Typography color="text.primary" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{currentPage}</Typography>
          </Breadcrumbs>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
