import { createSlice } from "@reduxjs/toolkit";

/*
A reducer is a function that takes the current state and an action, and returns a new state.
*/

const template_network = {}

const networkSlice = createSlice(
    {
        name: 'network',
        initialState: template_network,
        reducers: {}
    }
)

export default networkSlice.reducer;