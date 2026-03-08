import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Button, Alert, CircularProgress,
  TextField,
} from '@mui/material';
import {
  Delete, Add, Remove, ShoppingCartCheckout, ShoppingCart,
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../../store';
import { updateQuantity, removeFromCart, clearCart } from '../../store/cartSlice';
import apiClient from '../../api/client';

export default function CustomerCart() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const items = useSelector((state: RootState) => state.cart.items);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setPlacing(true);
    setError(null);
    try {
      await apiClient.post('/api/v1/sales/customer-order', {
        items: items.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
      });
      dispatch(clearCart());
      setSuccess('Order placed successfully! The admin will review and confirm your order.');
      setTimeout(() => navigate('/customer/orders'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Box sx={{ px: 3, py: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Shopping Cart</Typography>
      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
        {items.length} item{items.length !== 1 ? 's' : ''} in your cart
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }}>{success}</Alert>}

      {items.length === 0 && !success ? (
        <Paper elevation={0} sx={{ textAlign: 'center', py: 8, borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <ShoppingCart sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <Typography variant="body1" sx={{ fontWeight: 600, color: '#64748b' }}>Your cart is empty</Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>Browse products to add items to your cart.</Typography>
          <Button variant="contained" onClick={() => navigate('/customer/products')}
            sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>
            Browse Products
          </Button>
        </Paper>
      ) : items.length > 0 && (
        <>
          <Paper elevation={0} sx={{ borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', mb: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#64748b' }}>Product</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#64748b' }}>Price</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#64748b' }}>Quantity</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#64748b' }}>Subtotal</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#64748b' }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.product_id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.name}</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace' }}>{item.sku}</Typography>
                      </TableCell>
                      <TableCell align="right">${item.unit_price.toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <IconButton size="small"
                            onClick={() => dispatch(updateQuantity({ product_id: item.product_id, quantity: item.quantity - 1 }))}
                            disabled={item.quantity <= 1}>
                            <Remove fontSize="small" />
                          </IconButton>
                          <TextField size="small" value={item.quantity}
                            onChange={e => {
                              const v = parseInt(e.target.value);
                              if (!isNaN(v) && v >= 1) dispatch(updateQuantity({ product_id: item.product_id, quantity: v }));
                            }}
                            sx={{ width: 56, '& input': { textAlign: 'center', py: 0.5, fontSize: '0.85rem' } }}
                            inputProps={{ min: 1, max: item.stock_quantity }}
                          />
                          <IconButton size="small"
                            onClick={() => dispatch(updateQuantity({ product_id: item.product_id, quantity: item.quantity + 1 }))}
                            disabled={item.quantity >= item.stock_quantity}>
                            <Add fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>${(item.unit_price * item.quantity).toFixed(2)}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => dispatch(removeFromCart(item.product_id))}
                          sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Order Summary */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', maxWidth: 400, ml: 'auto' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Order Summary</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Subtotal ({items.length} items)</Typography>
              <Typography variant="body2" fontWeight={600}>${subtotal.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Tax</Typography>
              <Typography variant="body2" fontWeight={600}>$0.00</Typography>
            </Box>
            <Box sx={{ borderTop: '1px solid #e2e8f0', pt: 1.5, mt: 1.5, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1" fontWeight={700}>Total</Typography>
              <Typography variant="body1" fontWeight={700} color="primary">${subtotal.toFixed(2)}</Typography>
            </Box>
            <Button
              variant="contained"
              fullWidth
              startIcon={placing ? <CircularProgress size={18} color="inherit" /> : <ShoppingCartCheckout />}
              disabled={placing || items.length === 0}
              onClick={handlePlaceOrder}
              sx={{
                mt: 2.5, py: 1.2, textTransform: 'none', borderRadius: '8px', fontWeight: 700,
                bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, fontSize: '0.95rem',
              }}
            >
              {placing ? 'Placing Order...' : 'Place Order'}
            </Button>
          </Paper>
        </>
      )}
    </Box>
  );
}
