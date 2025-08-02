import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiHash, FiEdit3, FiUpload } from 'react-icons/fi';
import { uploadFileToCloudinary } from './utils/fileUploadService';
import axiosInstance from './utils/axiosInstance';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', email: '' });
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  console.log(user);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      console.log(decoded);

      setUser({
        name: decoded.name,
        email: decoded.email,
        userID: decoded.userID,
        picture: decoded.picture,
      });
      setEditData({ name: decoded.name, email: decoded.email });
    } catch (err) {
      console.error('Invalid token:', err);
      navigate('/');
    }
  }, [navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      let profilePhotoUrl = user.profilePhoto || null;

      if (imageFile) {
        const uploadResult = await uploadFileToCloudinary(imageFile, 'chatapp_profile_photo');
        profilePhotoUrl = uploadResult.url;
      }

      const payload = {
        userID: user.userID,
        name: editData.name,
        email: editData.email,
        profilePhoto: profilePhotoUrl,
      };

      const res = await axiosInstance.patch('/api/auth/update-profile', payload);
      console.log(res.data);

      if (res.status === 200) {
        const { token, user: updatedUser } = res.data;

        // Store new token in localStorage
        localStorage.setItem('token', token);

        // Update local state
        setUser({
          userID: updatedUser.userID,
          name: updatedUser.name,
          email: updatedUser.email,
          picture: updatedUser.picture,
        });

        setEditData({ name: updatedUser.name, email: updatedUser.email });
        setIsEditing(false);
        setPreviewImage(null);
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  };



  if (!user) return <div className="p-4">Loading...</div>;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-white to-blue-100 px-4">
      <div className="relative w-full max-w-md p-8 bg-white shadow-xl rounded-2xl border border-gray-200">

        {/* Avatar */}
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-20 h-20">
          <div className="relative w-full h-full rounded-full border-4 border-white shadow-lg overflow-hidden bg-blue-600 text-white flex items-center justify-center text-3xl font-bold">
            {previewImage ? (
              <img src={previewImage} alt="Preview" className="object-cover w-full h-full" />
            ) : user.picture ? (
              <img src={user.picture} alt="Avatar" className="object-cover w-full h-full" />
            ) : (
              user.name?.charAt(0).toUpperCase()
            )}

          </div>

          {isEditing && (
            <label className="absolute -bottom-3 right-0 bg-white border p-1 rounded-full shadow cursor-pointer">
              <FiUpload className="text-blue-600" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          )}
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
            {isEditing ? 'Edit Profile' : `Welcome, ${user.name}!`}
          </h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="mt-1 text-sm text-blue-600 hover:underline flex items-center justify-center gap-1"
            >
              <FiEdit3 className="inline" />
            </button>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-6 space-y-5 text-sm sm:text-base">
          {/* Name */}
          <div className="flex items-start gap-3">
            <FiUser className="text-blue-600 mt-[6px] min-w-[20px]" />
            {isEditing ? (
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full border rounded px-3 py-1 focus:outline-none focus:ring"
              />
            ) : (
              <span className="text-gray-800 font-medium break-words">{user.name}</span>
            )}
          </div>

          {/* Email */}
          <div className="flex items-start gap-3">
            <FiMail className="text-blue-600 mt-[6px] min-w-[20px]" />
            {isEditing ? (
              <input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                className="w-full border rounded px-3 py-1 focus:outline-none focus:ring"
              />
            ) : (
              <span className="text-gray-800 font-medium break-words">{user.email}</span>
            )}
          </div>

          {/* User ID (not editable) */}
          <div className="flex items-start gap-3">
            <FiHash className="text-blue-600 mt-[6px] min-w-[20px]" />
            <span className="bg-gray-100 text-gray-800 font-mono px-3 py-1 rounded break-all">
              {user.userID}
            </span>
          </div>
        </div>

        {/* Buttons */}
        {isEditing ? (
          <div className="mt-8 flex gap-4">
            <button
              onClick={handleSave}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition"
            >
              Save Changes
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditData({ name: user.name, email: user.email });
                setPreviewImage(null);
              }}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
          >
            Back to Dashboard
          </button>
        )}
      </div>
    </div>
  );
};

export default Profile;
