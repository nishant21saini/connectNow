
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Landing } from './components/Landing';
// import { Room } from './components/Room';
import Homepage from './homepage';
import { Signin } from "./pages/signin";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/Landing" element={<Landing />} />
        <Route path="/signin" element={<Signin />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App
