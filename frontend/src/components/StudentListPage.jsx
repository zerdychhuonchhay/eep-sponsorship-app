// frontend/src/components/StudentListPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentListPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // IMPORTANT: Replace this with your actual live Railway App URL
  const API_URL = 'https://eep-sponsorship-app-production.up.railway.app/api/students/';

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get(API_URL);
        setStudents(response.data);
      } catch (err) {
        setError('Failed to fetch students. Please make sure the API is running.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []); // The empty array ensures this effect runs only once on mount

  if (loading) {
    return <div>Loading students...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container">
      <h1>Student Roster</h1>
      <table>
        <thead>
          <tr>
            <th>Student ID</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Status</th>
            <th>Sponsorship</th>
          </tr>
        </thead>
        <tbody>
          {students.length > 0 ? (
            students.map((student) => (
              <tr key={student.id}>
                <td>{student.student_id}</td>
                <td>{student.first_name}</td>
                <td>{student.last_name}</td>
                <td>{student.student_status}</td>
                <td>{student.sponsorship_status}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No students found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StudentListPage;