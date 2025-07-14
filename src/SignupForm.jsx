import React, { useState } from 'react';
import axios from 'axios';

const SignupForm = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', form);
      localStorage.setItem('token', res.data.token);
      alert('Signup successful!');
    } catch (err) {
      alert('Signup failed!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Email Signup</h2>
      <input placeholder="Name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input placeholder="Email" type="email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input placeholder="Password" type="password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <button type="submit">Signup</button>
    </form>
  );
};

export default SignupForm;
