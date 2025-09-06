// frontend/src/components/StudentImportPage.jsx

import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
  Container, Typography, Button, Box, Link as MuiLink, Alert, CircularProgress,
  TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper
} from '@mui/material';

const StudentImportPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = 'https://eep-sponsorship-app-production.up.railway.app/api/students/upload-preview/';

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setPreviewData([]); // Clear previous preview on new file selection
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    setPreviewData([]);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setPreviewData(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'An unexpected error occurred.';
      setError(`Failed to process file: ${errorMessage}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Import Students from Excel
      </Typography>
      
      <Box sx={{ my: 2, display: 'flex', alignItems: 'center' }}>
        <Button variant="contained" component="label">
          Choose File
          <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileChange} />
        </Button>
        {selectedFile && <Typography sx={{ ml: 2 }}>{selectedFile.name}</Typography>}
      </Box>

      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={!selectedFile || loading}
        sx={{ my: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Upload and Preview'}
      </Button>
      
      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

      {previewData.length > 0 && (
        <Paper sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ p: 2 }}>Preview Data</Typography>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {Object.keys(previewData[0]).map((key) => (
                    <TableCell key={key}>{key}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.map((row, index) => (
                  <TableRow key={index}>
                    {Object.values(row).map((value, i) => (
                      <TableCell key={i}>{String(value)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" color="success">
              Confirm & Save to Database
            </Button>
          </Box>
        </Paper>
      )}

      <Box sx={{ mt: 4 }}>
        <MuiLink component={RouterLink} to="/students">
          &larr; Back to Student List
        </MuiLink>
      </Box>
    </Container>
  );
};

export default StudentImportPage;