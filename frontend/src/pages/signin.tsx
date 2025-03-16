import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import axios from "axios";

import './signin.css';
// interface User {
//   username: string;
//   firstName: string;
// }

export const Signin: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignIn = async () => {
    if (!username || !password) {
      setErrorMessage("Please enter both username and password.");
      return;
    }
    try {

      navigate("/homepage");
    } catch (error: any) {
      console.error("Error during sign-in:", error);
      setErrorMessage(error.response?.data?.message || "An error occurred. Please try again.");
    }
  };

  return (
    <div className="container">
    <div className="card">
      <h1 className="heading">Sign in</h1>
      <p className="subheading">Enter your credentials to access your account</p>

      <div className="input-group">
        <label>Email</label>
        <input
          onChange={(e) => setUsername(e.target.value)}
          placeholder="example@mail.com"
          type="email"
        />
      </div>

      <div className="input-group">
        <label>Password</label>
        <input
          onChange={(e) => setPassword(e.target.value)}
          placeholder="********"
          type="password"
        />
      </div>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <div className="button-container">
        <button onClick={handleSignIn}>Sign In</button>
      </div>

      <p className="bottom-warning">
        Don't have an account? <a href="/signup">Sign Up</a>
      </p>
    </div>
  </div>
  );
};
