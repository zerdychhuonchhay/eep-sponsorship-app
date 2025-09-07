// frontend/src/components/Navbar.jsx

import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Button component={RouterLink} to="/" sx={{ color: 'white' }}>
            NGO Sponsorship App
          </Button>
        </Typography>
        
        {/* Add navigation links */}
        <Button component={RouterLink} to="/" color="inherit">
          Dashboard
        </Button>
        <Button component={RouterLink} to="/students" color="inherit">
          Students
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
