/**
 * Dashboard page component
 */
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ShoppingCart,
  Inventory,
  TrendingUp,
} from '@mui/icons-material';
import { RootState } from '../store';
import apiClient from '../api/client';

interface DashboardData {
  today: { orders: number; revenue: number };
  month: { orders: number; revenue: number };
  inventory: { total_products: number; low_stock_count: number; out_of_stock_count: number };
  pending: { sales_orders: number; purchases: number };
}

function StatCard(props: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {props.title}
            </Typography>
            <Typography variant="h5">{props.value.toLocaleString()}</Typography>
          </Box>
          <Box sx={{ color: props.color, fontSize: 40 }}>{props.icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await apiClient.get('/api/v1/reports/dashboard');
        setData(response.data);
      } catch (err: any) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome, {user?.username}!
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Orders"
            value={data?.today.orders || 0}
            icon={<ShoppingCart />}
            color="#2196F3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Month Revenue"
            value={Math.round(data?.month.revenue || 0)}
            icon={<TrendingUp />}
            color="#4CAF50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={data?.inventory.total_products || 0}
            icon={<Inventory />}
            color="#FF9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Orders"
            value={data?.pending.sales_orders || 0}
            icon={<ShoppingCart />}
            color="#F44336"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Inventory Status</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography>Low Stock Items: {data?.inventory.low_stock_count}</Typography>
                <Typography>Out of Stock: {data?.inventory.out_of_stock_count}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Pending Actions</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography>Sales Orders: {data?.pending.sales_orders}</Typography>
                <Typography>Purchases: {data?.pending.purchases}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
