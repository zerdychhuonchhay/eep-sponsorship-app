// frontend/src/components/StudentImportPage.jsx

import React, { useState, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
  Container, Typography, Button, Box, Link as MuiLink, Alert, CircularProgress,
  Paper, Grid, FormControl, Select, MenuItem, InputLabel,
  TableContainer, Table, TableHead, TableRow, TableCell, TableBody
} from '@mui/material';
import { API_ENDPOINTS } from '../apiConfig.js';

const REQUIRED_FIELDS = [
  { key: 'student_id', label: 'Student ID', type: 'text' },
  { key: 'first_name', label: 'First Name', type: 'text' },
  { key: 'last_name', label: 'Last Name', type: 'text' },
  { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
  { key: 'gender', label: 'Gender', type: 'text' },
  { key: 'current_grade', label: 'Current Grade', type: 'text' },
  { key: 'eep_enroll_date', label: 'Enroll Date', type: 'date' },
  { key: 'guardian_name', label: 'Guardian Name', type: 'text' },
  { key: 'home_location', label: 'Home Location', type: 'text' },
];

const StudentImportPage = () => {
  const [step, setStep]                  = useState(1);
  const [selectedFile, setSelectedFile]  = useState(null);
  const [sheetNames, setSheetNames]      = useState([]);
  const [selectedSheet, setSelectedSheet]= useState('');
  const [fileHeaders, setFileHeaders]    = useState([]);
  const [previewData, setPreviewData]    = useState([]);
  const [mappings, setMappings]          = useState({});
  const [transformedData, setTransformedData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [error, setError]                = useState(null);
  const [loading, setLoading]            = useState(false);
  
  //const navigate      = useNavigate();
  const fileInputRef  = useRef(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setStep(1);
    setError(null);
    setValidationErrors([]);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const response = await axios.post(API_ENDPOINTS.excelFileAnalyzer, formData);
      setSheetNames(response.data.sheet_names);
      setSelectedSheet(response.data.sheet_names[0] || '');
      setStep(2);
    } catch (err) {
      setError('Failed to analyze the Excel file.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSheetSelect = async () => {
    if (!selectedFile || !selectedSheet) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('sheet_name', selectedSheet);
    try {
      const response = await axios.post(API_ENDPOINTS.studentUploadPreview, formData);
      setFileHeaders(response.data.headers);
      setPreviewData(response.data.preview_data);
      setStep(3);
    } catch (err) {
      setError('Failed to load data from the selected sheet.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (requiredKey, selectedHeader) => {
    setMappings({ ...mappings, [requiredKey]: selectedHeader });
  };

  const handlePreview = () => {
    const transformed = previewData.map(row => {
      const newRow = {};
      REQUIRED_FIELDS.forEach(field => {
        const mappedHeader = mappings[field.key];
        // THIS IS THE FIX: This logic correctly handles unmapped fields
        const value = mappedHeader ? row[mappedHeader] : undefined;
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          newRow[field.key] = value;
        } else {
          newRow[field.key] = field.type === 'date' ? null : '';
        }
      });
      return newRow;
    });
    setTransformedData(transformed);
    setStep(4);
  };
  
  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setValidationErrors([]);
    try {
      await axios.post(API_ENDPOINTS.studentBulkCreate, transformedData);
      alert('Successfully imported students!');
      window.location.href = '/students';
    } catch (err) {
      const errorData = err.response?.data;
      if (err.response?.status === 400 && Array.isArray(errorData)) {
        setError('Please fix the highlighted errors in the table below.');
        setValidationErrors(errorData);
      } else if (errorData && errorData.duplicates) {
        setError(`Import failed. The following student IDs already exist: ${errorData.duplicates.join(', ')}`);
      } else {
        const errorMessage = errorData ? JSON.stringify(errorData) : 'An unknown error occurred.';
        setError(`Failed to save students: ${errorMessage}`);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>Import Students</Typography>
      
      {step === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6">Step 1: Upload Your Master File</Typography>
          <Box sx={{ my: 2, display: 'flex', alignItems: 'center' }}>
            <Button variant="contained" component="label">
              Choose File
              <input ref={fileInputRef} type="file" hidden accept=".xlsx, .xls" onChange={handleFileChange} />
            </Button>
            {selectedFile && <Typography sx={{ ml: 2 }}>{selectedFile.name}</Typography>}
          </Box>
          <Button variant="contained" color="primary" onClick={handleAnalyze} disabled={!selectedFile || loading}>
            {loading ? <CircularProgress size={24} /> : 'Analyze File'}
          </Button>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Paper>
      )}

      {step === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6">Step 2: Select a Sheet</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            We found the following sheets in your file. Please select the one containing the student data you wish to import.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Sheet Name</InputLabel>
            <Select value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)} label="Sheet Name">
              {sheetNames.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
            </Select>
          </FormControl>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={() => setStep(1)} disabled={loading}>Back</Button>
            <Button variant="contained" onClick={handleSheetSelect} disabled={!selectedSheet || loading}>
              {loading ? <CircularProgress size={24} /> : 'Continue to Mapping'}
            </Button>
          </Box>
        </Paper>
      )}

      {step === 3 && (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Step 3: Map Your Columns</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Match the required fields on the left with the corresponding column headers from your file on the right.
            </Typography>
            <Grid container spacing={2} alignItems="center">
              {REQUIRED_FIELDS.map(({ key, label }) => (
                <React.Fragment key={key}>
                  <Grid item xs={6}><Typography>{label}</Typography></Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Column from your file</InputLabel>
                      <Select value={mappings[key] || ''} onChange={(e) => handleMappingChange(key, e.target.value)} label="Column from your file">
                        {fileHeaders.map((header) => (<MenuItem key={header} value={header}>{header}</MenuItem>))}
                      </Select>
                    </FormControl>
                  </Grid>
                </React.Fragment>
              ))}
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={() => setStep(2)} disabled={loading}>Back</Button>
              <Button variant="contained" onClick={handlePreview}>Preview Data</Button>
            </Box>
          </Paper>
      )}

      {step === 4 && (
        <Paper sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ p: 2 }}>Step 4: Preview & Confirm</Typography>
          {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {REQUIRED_FIELDS.map((field) => (<TableCell key={field.key}>{field.label}</TableCell>))}
                </TableRow>
              </TableHead>
              <TableBody>
                {transformedData.map((row, index) => (
                  <TableRow key={index}>
                    {REQUIRED_FIELDS.map(field => {
                      const cellError = validationErrors[index] && validationErrors[index][field.key];
                      return (
                        <TableCell key={field.key} sx={{ border: cellError ? '2px solid red' : undefined }}>
                          {String(row[field.key] ?? '')}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={() => setStep(3)} disabled={loading}>Back to Mapping</Button>
            <Button variant="contained" color="success" onClick={handleSave} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Confirm & Save to Database'}
            </Button>
          </Box>
        </Paper>
      )}

      <Box sx={{ mt: 4 }}>
        <MuiLink component={RouterLink} to="/students">&larr; Back to Student List</MuiLink>
      </Box>
    </Container>
  );
};

export default StudentImportPage;