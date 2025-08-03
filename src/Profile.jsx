import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { FiEdit2, FiUpload, FiArrowLeft } from 'react-icons/fi';
import axiosInstance from './utils/axiosInstance';
import { uploadFileToCloudinary } from './utils/fileUploadService';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', email: '' });
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/');
    try {
      const decoded = jwtDecode(token);
      setUser(decoded);
      setEditData({ name: decoded.name, email: decoded.email });
    } catch {
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
    setIsLoading(true);
    try {
      let profileUrl = user.picture;
      if (imageFile) {
        const uploadRes = await uploadFileToCloudinary(imageFile, 'chatapp_profile_photo');
        profileUrl = uploadRes.url;
      }
      const res = await axiosInstance.patch('/api/auth/update-profile', {
        userID: user.userID,
        name: editData.name,
        email: editData.email,
        profilePhoto: profileUrl,
      });
      if (res.status === 200) {
        const { token, user: updatedUser } = res.data;
        localStorage.setItem('token', token);
        setUser(updatedUser);
        setEditData({ name: updatedUser.name, email: updatedUser.email });
        setPreviewImage(null);
        setImageFile(null);
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div className="text-center mt-20 text-gray-500">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f2f5] to-[#dce0e6] p-6">
      <div className="w-full max-w-2xl p-8 rounded-3xl shadow-xl bg-[#ecf0f3] relative neumorphic">

        {/* Back Button */}
        <button
          className="absolute top-6 left-6 text-gray-500 hover:text-gray-800 transition"
          onClick={() => navigate('/dashboard')}
        >
          <FiArrowLeft size={22} />
        </button>

        {/* Avatar */}
        <div className="flex justify-center mb-8 relative">
          <div className="w-36 h-36 rounded-full overflow-hidden relative shadow-inner shadow-gray-400 bg-[#dee2e6]">
            <img
              src={previewImage || user.picture || `https://ui-avatars.com/api/?name=${user.name}`}
              alt="profile"
              className="w-full h-full object-cover"
            />
            {isEditing && (
              <label className="absolute inset-0 bg-white bg-opacity-30 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-opacity-40 transition rounded-full">
                <FiUpload size={24} className="text-gray-800" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-6">
          <div>
            <label className="text-gray-500 text-sm">Name</label>
            {isEditing ? (
              <input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="mt-1 w-full px-4 py-2 rounded-xl bg-[#f5f7fa] shadow-inner focus:outline-none"
              />
            ) : (
              <p className="mt-1 px-4 py-2 rounded-xl bg-white shadow-inner">{user.name}</p>
            )}
          </div>

          <div>
            <label className="text-gray-500 text-sm">Email</label>
            {isEditing ? (
              <input
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                className="mt-1 w-full px-4 py-2 rounded-xl bg-[#f5f7fa] shadow-inner focus:outline-none"
              />
            ) : (
              <p
                className="mt-1 px-4 py-2 rounded-xl bg-white shadow-inner 
             text-ellipsis whitespace-nowrap overflow-hidden
             max-w-full sm:max-w-md md:max-w-full"
                title={user.email}
              >
                {user.email}
              </p>
            )}
          </div>

          <div>
            <label className="text-gray-500 text-sm">User ID</label>
            <p className="mt-1 px-4 py-2 rounded-xl bg-white shadow-inner text-sm text-gray-600 font-mono break-all">
              {user.userID}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex justify-center gap-4">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md transition"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditData({ name: user.name, email: user.email });
                  setPreviewImage(null);
                  setImageFile(null);
                }}
                className="px-5 py-2 rounded-xl bg-gray-300 text-gray-700 hover:bg-gray-400 shadow-md transition"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white shadow hover:shadow-lg transition text-gray-700"
            >
              <FiEdit2 />
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
