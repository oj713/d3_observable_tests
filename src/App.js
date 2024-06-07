import './App.css';
// backend
import {Provider} from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import networkReducer from './redux_stuff/network-reducer.js';
// frontend
import {BrowserRouter} from 'react-router-dom';
import {Routes, Route} from 'react-router';
import NotesBox from './notesbox.js';
import NavSidebar from './nav';
import GeneralPage from './pages/general.js';
import NetworksGen from './pages/networksGen.js';
import NodeTests from './pages/nodeTests.js';
import BayesianNet from './pages/bayesian_net.js';
import PropagatedNet from './pages/propagated_net.js';

const store = configureStore({
  reducer: {network: networkReducer}
})

function App() {
  return (
    <Provider store = {store}>
      <BrowserRouter>
        <div className="App container-fluid">
          <NavSidebar/>
          <div className="bump-left">
            <Routes>
              <Route path="/" element={<NotesBox/>} />
              <Route path="/general" element={<GeneralPage/>} />
              <Route path="/networksgen" element={<NetworksGen/>} />
              <Route path="/bayesian-nodes" element={<NodeTests/>} />
              <Route path="/bayesian-net" element={<BayesianNet/>} />
              <Route path="/propagated-net" element={<PropagatedNet/>} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
