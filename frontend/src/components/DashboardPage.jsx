// frontend/src/components/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../apiConfig.js';
import {
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Box
} from '@mui/material';

// A reusable component for our statistic cards
const StatCard = ({ title, value }) => (
  <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
    <Typography variant="h6" color="textSecondary">
      {title}
    </Typography>
    <Typography variant="h4" component="p">
      {value}
    </Typography>
  </Paper>
);

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(API_ENDPOINTS.dashboardStats);
        setStats(response.data);
      } catch (err) {
        setError('Failed to load dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard Overview
      </Typography>
      {stats && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Students" value={stats.total_students} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Active Students" value={stats.active_students} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Sponsored" value={stats.sponsored_students} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Unsponsored" value={stats.unsponsored_students} />
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default DashboardPage;