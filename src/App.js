import './App.css';
import {BrowserRouter} from 'react-router-dom';
import {Routes, Route} from 'react-router';
import NotesBox from './notesbox.js';
import NavSidebar from './nav';
import GeneralPage from './plots/general.js';
import NetworksObs from './plots/networksObs.js';

function App() {
  return (
    <BrowserRouter>
      <div className="App container-fluid">
        <NavSidebar/>
        <div className="bump-left">
          <Routes>
            <Route path="/" element={<NotesBox/>} />
            <Route path="/general" element={<GeneralPage/>} />
            <Route path="/networksobs" element={<NetworksObs/>} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
