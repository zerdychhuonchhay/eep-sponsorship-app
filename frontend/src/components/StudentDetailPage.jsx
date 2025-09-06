// frontend/src/components/StudentDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentForm from './StudentForm.jsx';

// Import Material-UI Components
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Link as MuiLink
} from '@mui/material';

const StudentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const API_URL = 'https://eep-sponsorship-app-production.up.railway.app/api/students/';

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await axios.get(`${API_URL}${id}/`);
        setStudent(response.data);
      } catch (err) {
        setError('Failed to fetch student details.');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

  const handleUpdateSuccess = (updatedStudent) => {
    setStudent(updatedStudent);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this student record?')) {
      try {
        await axios.delete(`${API_URL}${id}/`);
        navigate('/students');
      } catch (err) {
        setError('Failed to delete student.');
        console.error('Delete error:', err);
      }
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!student) return <Alert severity="info">Student not found.</Alert>;

  return (
    <Container maxWidth="md">
      {isEditing ? (
        <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
          <StudentForm
            initialData={student}
            onFormSubmit={handleUpdateSuccess}
            onCancel={() => setIsEditing(false)}
          />
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {student.first_name} {student.last_name}
          </Typography>
          <Typography variant="body1"><strong>Student ID:</strong> {student.student_id}</Typography>
          <Typography variant="body1"><strong>Status:</strong> {student.student_status}</Typography>
          <Typography variant="body1"><strong>Sponsorship:</strong> {student.sponsorship_status}</Typography>
          <Typography variant="body1"><strong>Date of Birth:</strong> {student.date_of_birth}</Typography>
          <Typography variant="body1"><strong>Grade:</strong> {student.current_grade}</Typography>
          <Typography variant="body1"><strong>Guardian:</strong> {student.guardian_name}</Typography>

          <Box sx={{ mt: 3 }}>
            <Button variant="contained" onClick={() => setIsEditing(true)} sx={{ mr: 1 }}>
              Edit Student
            </Button>
            <Button variant="outlined" color="error" onClick={handleDelete}>
              Delete Student
            </Button>
          </Box>
        </Paper>
      )}
      <Box sx={{ mt: 2 }}>
        <MuiLink component={RouterLink} to="/students">
          &larr; Back to Student List
        </MuiLink>
      </Box>
    </Container>
  );
};

export default StudentDetailPage;