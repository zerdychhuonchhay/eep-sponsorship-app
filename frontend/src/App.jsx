// frontend/src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import StudentListPage from './components/StudentListPage.jsx';
// We will create the StudentDetailPage component in the very next step.
// Your app will show an error until this file is created.
import StudentDetailPage from './components/StudentDetailPage.jsx';
import StudentImportPage from './components/StudentImportPage.jsx';
import './App.css';

function App() {
  return (
    <BrowserRouter>
        <CssBaseline />
      <div className="App">
        <div className="container">
          <Routes>
            {/* Route for the main student list */}
            <Route path="/students" element={<StudentListPage />} />

            {/* A dynamic route for a single student's detail page */}
            {/* The ':id' is a URL parameter that will hold the student's ID */}
            <Route path="/students/:id" element={<StudentDetailPage />} />

            {/* Route for the student import page */}
            <Route path="/import" element={<StudentImportPage />} />

            {/* A default route that redirects to the student list */}
            <Route path="/" element={<StudentListPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;