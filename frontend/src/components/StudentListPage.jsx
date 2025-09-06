// frontend/src/components/StudentListPage.jsx

import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import StudentForm from './StudentForm.jsx';
import {
  Container, Typography, Button, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert
} from '@mui/material';

const StudentListPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const API_URL = 'https://eep-sponsorship-app-production.up.railway.app/api/students/';

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      // THIS IS THE FIX: Get the student list from the 'results' property
      setStudents(response.data.results);
    } catch (err) {
      setError('Failed to fetch students.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentAdded = (newStudent) => {
    setStudents([...students, newStudent]);
    setIsFormVisible(false);
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Student Roster
      </Typography>

      {isFormVisible ? (
        <Paper elevation={3} style={{ padding: '16px', marginBottom: '16px' }}>
          <StudentForm
            onFormSubmit={handleStudentAdded}
            onCancel={() => setIsFormVisible(false)}
          />
        </Paper>
      ) : (
        <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setIsFormVisible(true)}
              style={{ marginBottom: '16px', marginRight: '8px' }}
            >
              Add New Student
            </Button>
            <Button
              variant="outlined"
              component={RouterLink}
              to="/import"
              style={{ marginBottom: '16px' }}
            >
              Import Students
            </Button>
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student ID</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Sponsorship</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students && students.length > 0 ? (
              students.map((student) => (
                <TableRow key={student.id} hover>
                  <TableCell>{student.student_id}</TableCell>
                  <TableCell>
                    <RouterLink to={`/students/${student.id}`} style={{ textDecoration: 'none', color: '#1976d2' }}>
                      {student.first_name} {student.last_name}
                    </RouterLink>
                  </TableCell>
                  <TableCell>{student.student_status}</TableCell>
                  <TableCell>{student.sponsorship_status}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4}>No students found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default StudentListPage;