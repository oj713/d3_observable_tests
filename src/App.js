import './App.css';
import {BrowserRouter} from 'react-router-dom';
import {Routes, Route} from 'react-router';
import NotesBox from './notesbox.js';
import NavSidebar from './nav/nav_sidebar.js';

function App() {
  return (
    <BrowserRouter>
      <div className="App container-fluid">
        <NavSidebar/>
        <div className="bump_left">
          <Routes>
            <Route path="/" element={<h1>Home</h1>} />
            <Route path="/notesbox" element={<NotesBox/>} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
