import axios from 'axios';
import { getAuthHeader } from './authService';

const API_URL = 'http://localhost:8000/api'; // Adjust according to your backend URL

export const getLessonFeedback = async (data) => {
  try {
    const response = await axios.post(
      `${API_URL}/lesson-feedback/`, 
      data, 
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting lesson feedback:', error);
    throw error;
  }
};