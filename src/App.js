import './App.css';
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

function App() {
  return (
      <BrowserRouter>
        <div className="App container-fluid">
          {/* <NavSidebar/> */}
          <div> {/* className="bump-collapsed" */}
            <Routes>
              <Route path="/" element={<PropagatedNet/>} />
              <Route path="/general" element={<GeneralPage/>} />
              <Route path="/networksgen" element={<NetworksGen/>} />
              <Route path="/bayesian-nodes" element={<NodeTests/>} />
              <Route path="/bayesian-net" element={<BayesianNet/>} />
              <Route path="/notes" element={<NotesBox/>} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
  );
}

export default App;
