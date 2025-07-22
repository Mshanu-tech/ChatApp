import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiHash } from 'react-icons/fi';

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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-white to-blue-100 px-4">
      <div className="relative w-full max-w-md p-8 bg-white shadow-xl rounded-2xl border border-gray-200">

        {/* Avatar */}
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-blue-600 text-white flex items-center justify-center text-3xl font-bold rounded-full border-4 border-white shadow-lg">
          {user.name?.charAt(0).toUpperCase()}
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Welcome, {user.name}!
          </h2>
          <p className="text-sm text-gray-500 mt-1">Your profile details are shown below.</p>
        </div>

        {/* Info Section */}
        <div className="mt-6 space-y-5 text-sm sm:text-base">
          {/* Name */}
          <div className="flex items-start gap-3">
            <FiUser className="text-blue-600 mt-[6px] min-w-[20px]" />
            <span className="text-gray-800 font-medium break-words">{user.name}</span>
          </div>

          {/* Email */}
          <div className="flex items-start gap-3">
            <FiMail className="text-blue-600 mt-[6px] min-w-[20px]" />
            <span className="text-gray-800 font-medium break-words">{user.email}</span>
          </div>

          {/* User ID */}
          <div className="flex items-start gap-3">
            <FiHash className="text-blue-600 mt-[6px] min-w-[20px]" />
            <span className="bg-gray-100 text-gray-800 font-mono px-3 py-1 rounded break-all">
              {user.userID}
            </span>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Profile;
