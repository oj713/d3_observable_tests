import axios from 'axios'; 
const API_URL = process.env.REACT_APP_API_URL // must preface with REACT_APP_ otherwise invisible to create-react-app

// services make the API calls to the server

export const getNetwork = async () => {
    console.log("API_URL", API_URL)
    const response = await axios.get(`${API_URL}/network?format=d3_tests`);
    return response.data;
}