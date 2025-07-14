import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', form);
    const { token, friend, messages, userID, name } = res.data;

    localStorage.setItem('token', token);

    // 👇 Optionally store friend and messages in session or context
    sessionStorage.setItem('friend', JSON.stringify(friend));
    sessionStorage.setItem('messages', JSON.stringify(messages));

    alert('Login successful!');
    navigate('/dashboard'); // Dashboard will read these on mount
  } catch (err) {
    console.error(err);
    alert('Login failed!');
  }
};


  return (
    <form onSubmit={handleSubmit}>
      <h2>Email Login</h2>
      <input
        placeholder="Email"
        type="email"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <input
        placeholder="Password"
        type="password"
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
      />
      <button type="submit">Login</button>
    </form>
  );
};

export default LoginForm;
