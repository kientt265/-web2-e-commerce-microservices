
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import Login from '../pages/public/Login';
import Signup from '../pages/public/SignUp.tsx';
import Chat from './components/Chat.tsx';
function App() {

  return (
    <Routes>
        <Route path="/Login" element={<Login/>} />
        <Route path="/Signup" element={<Signup/>} />
        <Route path="/Chat" element={<Chat/>} />
    </Routes>
  )
}

export default App
