import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUser({
        name: decoded.name,
        email: decoded.email,
        userID: decoded.userID,
      });
    } catch (err) {
      console.error('Invalid token:', err);
      navigate('/');
    }
  }, [navigate]);

  if (!user) return <div className="p-4">Loading...</div>;

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white shadow-lg p-8 rounded-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">User Profile</h1>
        <div className="mb-4">
          <p className="text-gray-600">Name:</p>
          <p className="text-lg font-medium">{user.name}</p>
        </div>
        <div className="mb-4">
          <p className="text-gray-600">Email:</p>
          <p className="text-lg font-medium">{user.email}</p>
        </div>
        <div className="mb-4">
          <p className="text-gray-600">User ID:</p>
          <p className="text-lg font-medium">{user.userID}</p>
        </div>
        <button
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Profile;
