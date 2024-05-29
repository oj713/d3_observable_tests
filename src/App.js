import './App.css';
import {BrowserRouter} from 'react-router-dom';
import {Routes, Route} from 'react-router';
import NotesBox from './notesbox.js';
import NavSidebar from './nav';
import GeneralPage from './plots/general.js';
import NetworksGen from './plots/networksGen.js';
import NodeTests from './plots/nodeTests.js';
import BayesianNet from './plots/bayesian_net.js';

function App() {
  return (
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
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
