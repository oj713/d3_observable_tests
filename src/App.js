import './App.css';
import {BrowserRouter} from 'react-router-dom';
import {Routes, Route} from 'react-router';
import NotesBox from './notesbox.js';

function App() {
  return (
    <BrowserRouter>
      <div className="App container-fluid">
        <div className="jasper sidebar nopad">
          <ul className = "list-group list-group-flush">
            <a href = "/" className = "list-group-item"> Home </a>
            <a href = "/notesbox" className = "list-group-item"> Notes </a>
          </ul>
        </div>
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
