import './App.css';
import {BrowserRouter} from 'react-router-dom';
import {Routes, Route} from 'react-router';
import NotesBox from './notesbox.js';
import NavSidebar from './nav';
import ScatterplotsPage from './scatterplots';

function App() {
  return (
    <BrowserRouter>
      <div className="App container-fluid">
        <NavSidebar/>
        <div className="bump_left">
          <Routes>
            <Route path="/" element={<NotesBox/>} />
            <Route path="/scatterplots" element={<ScatterplotsPage/>} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
