import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthForm = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

const handleGoogleSuccess = async (credentialResponse) => {
  const decoded = jwtDecode(credentialResponse.credential);
  const { email, name, picture, sub } = decoded;

  try {
    const res = await axios.post('http://localhost:5000/api/auth/google', {
      email,
      name,
      picture,
      googleId: sub,
    });

    const { token, friend, messages } = res.data;

    localStorage.setItem('token', token);
    if (friend) {
      sessionStorage.setItem('friend', JSON.stringify(friend));
      sessionStorage.setItem('messages', JSON.stringify(messages));
    }

    navigate('/dashboard');
  } catch (err) {
    console.error('Google login error:', err);
  }
};


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const endpoint = isSignup ? 'signup' : 'login';
      const res = await axios.post(`http://localhost:5000/api/auth/${endpoint}`, form);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      alert('Authentication failed');
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-8 w-96 text-center"
      >
        <h2 className="text-2xl font-semibold mb-6">{isSignup ? 'Signup' : 'Login'} Form</h2>

        {isSignup && (
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full p-2 mb-4 border border-gray-300 rounded"
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          className="w-full p-2 mb-4 border border-gray-300 rounded"
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          className="w-full p-2 mb-4 border border-gray-300 rounded"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded mb-4 transition"
        >
          {isSignup ? 'Signup' : 'Login'}
        </button>

        <p className="text-sm">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span
            onClick={() => setIsSignup(!isSignup)}
            className="text-blue-600 cursor-pointer underline"
          >
            {isSignup ? 'Login here' : 'Signup here'}
          </span>
        </p>

        <div className="mt-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => console.log(`Google ${isSignup ? 'signup' : 'signin'} failed`)}
            text={isSignup ? 'signup_with' : 'signin_with'}
          />
        </div>
      </form>
    </div>
  );
};

export default AuthForm;
