// frontend/src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout.jsx';
import DashboardPage from './components/DashboardPage.jsx'; // Import the new page
import StudentListPage from './components/StudentListPage.jsx';
import StudentDetailPage from './components/StudentDetailPage.jsx';
import StudentImportPage from './components/StudentImportPage.jsx';
import NotificationProvider from './components/NotificationProvider.jsx';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <CssBaseline />
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Make the Dashboard the default page */}
            <Route index element={<DashboardPage />} /> 
            <Route path="students" element={<StudentListPage />} />
            <Route path="students/:id" element={<StudentDetailPage />} />
            <Route path="import" element={<StudentImportPage />} />
          </Route>
        </Routes>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;