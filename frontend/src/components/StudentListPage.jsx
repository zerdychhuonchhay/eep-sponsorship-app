import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import StudentForm from './StudentForm.jsx';
import { API_ENDPOINTS } from '../apiConfig.js';
import {
  Container, Typography, Button, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert
} from '@mui/material';

const StudentListPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await axios.get(API_ENDPOINTS.students);
        // This logic correctly handles both paginated and non-paginated data
        const studentData = response.data.results ? response.data.results : response.data;
        if (Array.isArray(studentData)) {
          setStudents(studentData);
        } else {
          console.error("Error: API did not return an array. Response:", response.data);
          setStudents([]);
        }
      } catch (err) {
        setError('Failed to fetch students.');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleStudentAdded = (newStudent) => {
    setStudents([...students, newStudent]);
    setIsFormVisible(false);
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="xl"> {/* Use a wider container */}
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

      {/* THIS IS THE CHANGE: Add maxHeight to make the container scrollable */}
      <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
        <Table stickyHeader> {/* stickyHeader keeps the column titles visible */}
          <TableHead>
            <TableRow>
              {/* THIS IS THE CHANGE: Add more columns */}
              <TableCell>Student ID</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Date of Birth</TableCell>
              <TableCell>Grade</TableCell>
              <TableCell>Sponsorship Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students && students.length > 0 ? (
              students.map((student) => (
                <TableRow key={student.id} hover>
                  <TableCell>{student.student_id}</TableCell>
                  <TableCell>
                    <RouterLink to={`/students/${student.id}`} state={{ student: student }} style={{ textDecoration: 'none', color: '#1976d2' }}>
                      {student.first_name} {student.last_name}
                    </RouterLink>
                  </TableCell>
                  <TableCell>{student.gender}</TableCell>
                  <TableCell>{student.date_of_birth ? student.date_of_birth.split('T')[0] : ''}</TableCell>
                  <TableCell>{student.current_grade}</TableCell>
                  <TableCell>{student.sponsorship_status}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6}>No students found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default StudentListPage;
