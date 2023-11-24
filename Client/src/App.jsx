import "./App.css";
import SelectChannel from "./Components/Select/S_Channel";
import Chat from "./Components/Chat/ChatPage";
import Login from "./Components/Auth/Login/Login";
import Register from "./Components/Auth/Register/Register";
import PrivateRoute from "./Components/Auth/PrivateRoute";

//Import React router dom
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/select-channel" element={<PrivateRoute><SelectChannel /></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}


export default App
