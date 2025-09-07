// frontend/src/components/Layout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import { Container } from '@mui/material';

const Layout = () => {
  return (
    <div>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* The Outlet component renders the current page's content */}
        <Outlet />
      </Container>
    </div>
  );
};

export default Layout;