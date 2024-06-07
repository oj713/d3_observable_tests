import axios from 'axios';
const API_URL = 'http://localhost:8001'; // throw this into an env file later

// services make the API calls to the server

export const getNetwork = async () => {
    const response = await axios.get(`${API_URL}/network?format=d3_tests`);
    return response.data;
}