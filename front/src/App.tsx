
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import Login from '../pages/public/Login';
import Signup from '../pages/public/SignUp.tsx';

function App() {


  return (
    <Routes>
        <Route path="/Login" element={<Login/>} />
        <Route path="/Signup" element={<Signup/>} />
    </Routes>
  )
}

export default App
