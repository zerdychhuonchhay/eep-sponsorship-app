// frontend/src/components/StudentForm.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../apiConfig.js';

// Import Material-UI Form Components
import {
  TextField,
  Button,
  Box,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from '@mui/material';

const StudentForm = ({ onFormSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'Male',
    current_grade: '',
    eep_enroll_date: '',
    guardian_name: '',
    home_location: '',
  });
  const [error, setError] = useState(null);

  const isEditMode = initialData !== null;

  useEffect(() => {
    if (isEditMode && initialData) {
      // Ensure date fields are in yyyy-mm-dd format for the input
      const formattedData = {
        ...initialData,
        date_of_birth: initialData.date_of_birth ? initialData.date_of_birth.split('T')[0] : '',
        eep_enroll_date: initialData.eep_enroll_date ? initialData.eep_enroll_date.split('T')[0] : '',
      };
      setFormData(formattedData);
    }
  }, [initialData, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      let response;
      if (isEditMode) {
        response = await axios.put(`${API_ENDPOINTS.students}${initialData.id}/`, formData);
      } else {
        response = await axios.post(API_ENDPOINTS.students, formData);
      }
      onFormSubmit(response.data);
    } catch (err) {
      const errorMessage = err.response?.data ? JSON.stringify(err.response.data) : 'Please check the form data.';
      setError(`Failed to save student. ${errorMessage}`);
      console.error(err);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <Typography component="h3" variant="h6">
        {isEditMode ? 'Edit Student' : 'Add New Student'}
      </Typography>
      <TextField margin="normal" required fullWidth id="student_id" label="Student ID" name="student_id" value={formData.student_id} onChange={handleChange} />
      <TextField margin="normal" required fullWidth id="first_name" label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} />
      <TextField margin="normal" required fullWidth id="last_name" label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} />
      <TextField margin="normal" fullWidth name="date_of_birth" label="Date of Birth" type="date" value={formData.date_of_birth} onChange={handleChange} InputLabelProps={{ shrink: true }} />
      <FormControl fullWidth margin="normal">
        <InputLabel id="gender-label">Gender</InputLabel>
        <Select labelId="gender-label" id="gender" name="gender" value={formData.gender} label="Gender" onChange={handleChange}>
          <MenuItem value="Male">Male</MenuItem>
          <MenuItem value="Female">Female</MenuItem>
        </Select>
      </FormControl>
      <TextField margin="normal" fullWidth id="current_grade" label="Current Grade" name="current_grade" value={formData.current_grade} onChange={handleChange} />
      <TextField margin="normal" fullWidth name="eep_enroll_date" label="Program Enroll Date" type="date" value={formData.eep_enroll_date} onChange={handleChange} InputLabelProps={{ shrink: true }} />
      <TextField margin="normal" fullWidth id="guardian_name" label="Guardian Name" name="guardian_name" value={formData.guardian_name} onChange={handleChange} />
      <TextField margin="normal" fullWidth id="home_location" label="Home Location" name="home_location" value={formData.home_location} onChange={handleChange} />
      
      {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}

      <Box sx={{ mt: 3, mb: 2 }}>
        <Button type="submit" variant="contained" sx={{ mr: 1 }}>
          Save Changes
        </Button>
        <Button type="button" variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export default StudentForm;