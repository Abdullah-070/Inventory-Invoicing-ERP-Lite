import { useEffect, useState } from 'react';
import {
  Grid, Typography,
  CircularProgress, Alert, Box, Chip, InputBase, Paper, Button, Snackbar,
} from '@mui/material';
import { Search, Inventory, Storefront, AddShoppingCart } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { addToCart } from '../../store/cartSlice';
import apiClient from '../../api/client';

interface Product {
  id: number; sku: string; name: string; description?: string;
  selling_price: number; stock_quantity: number; category_id?: number;
}

const avatarColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function CustomerProducts() {
  const dispatch = useDispatch<AppDispatch>();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState('');

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      products.filter(p =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
      )
    );
  }, [search, products]);

  const fetchProducts = async () => {
    try {
      const res = await apiClient.get('/api/v1/products');
      const active = res.data.filter((p: Product) => p.stock_quantity > 0);
      setProducts(active);
    } catch {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ px: 3, py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Browse Products</Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.3 }}>
            Showing {filtered.length} of {products.length} available products
          </Typography>
        </Box>
        <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f1f5f9', borderRadius: '10px', px: 1.5, py: 0.5, minWidth: 280 }}>
          <Search sx={{ color: '#94a3b8', fontSize: 20, mr: 1 }} />
          <InputBase placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, fontSize: '0.875rem' }} />
        </Paper>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{error}</Alert>}

      <Grid container spacing={2.5}>
        {filtered.map((product, idx) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <Paper elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } }}>
              <Box sx={{ p: 3, bgcolor: '#f8fafc', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ width: 56, height: 56, borderRadius: '12px', bgcolor: `${avatarColors[idx % avatarColors.length]}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Storefront sx={{ fontSize: 28, color: avatarColors[idx % avatarColors.length] }} />
                </Box>
              </Box>
              <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 0.3 }} noWrap>
                  {product.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace', mb: 0.5 }}>
                  {product.sku}
                </Typography>
                {product.description && (
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '0.8rem' }}>
                    {product.description}
                  </Typography>
                )}
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#3b82f6', fontSize: '1.1rem' }}>
                    ${Number(product.selling_price).toFixed(2)}
                  </Typography>
                  <Chip
                    label={product.stock_quantity > 10 ? 'In Stock' : `${product.stock_quantity} left`}
                    size="small"
                    sx={{
                      bgcolor: product.stock_quantity > 10 ? '#ecfdf5' : '#fffbeb',
                      color: product.stock_quantity > 10 ? '#16a34a' : '#d97706',
                      fontWeight: 600, fontSize: '0.7rem', height: 22,
                    }}
                  />
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddShoppingCart sx={{ fontSize: 16 }} />}
                  disabled={cartItems.some(c => c.product_id === product.id && c.quantity >= product.stock_quantity)}
                  onClick={() => {
                    dispatch(addToCart({
                      product_id: product.id,
                      name: product.name,
                      sku: product.sku,
                      unit_price: Number(product.selling_price),
                      quantity: 1,
                      stock_quantity: product.stock_quantity,
                    }));
                    setSnack(`${product.name} added to cart`);
                  }}
                  sx={{
                    mt: 1.5, textTransform: 'none', borderRadius: '8px', fontWeight: 600,
                    bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, fontSize: '0.8rem',
                  }}
                  fullWidth
                >
                  Add to Cart
                </Button>
              </Box>
            </Paper>
          </Grid>
        ))}
        {filtered.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Inventory sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
              <Typography variant="body1" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                {search ? 'No products match your search.' : 'No products available right now.'}
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
      <Snackbar open={!!snack} autoHideDuration={2000} onClose={() => setSnack('')}
        message={snack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
