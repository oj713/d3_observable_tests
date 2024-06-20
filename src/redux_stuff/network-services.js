import axios from 'axios'; 
const API_URL = process.env.REACT_APP_API_URL // must preface with REACT_APP_ otherwise invisible to create-react-app

// services make the API calls to the server

export const getNetwork = async () => {
    const response = await axios.get(`${API_URL}/network?format=d3_tests`);
    return response.data;
}

export const getMarkov = async(id) => {
    const response = await axios.get(`${API_URL}/network/markov?id=${id}`);
    return response.data;
}

export const propagateEvidence = async (evidence) => {
    const response = await axios.patch(`${API_URL}/network/inference`, evidence)
    return response.data
}