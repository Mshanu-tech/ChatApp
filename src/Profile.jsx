import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiHash, FiEdit2, FiUpload, FiArrowLeft } from 'react-icons/fi';
import { uploadFileToCloudinary } from './utils/fileUploadService';
import axiosInstance from './utils/axiosInstance';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', email: '' });
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
    try {
      let profilePhotoUrl = user.picture || null;

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

      if (res.status === 200) {
        const { token, user: updatedUser } = res.data;
        localStorage.setItem('token', token);
        
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
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-pulse text-gray-500">Loading profile...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft className="mr-2" />
            Back
          </button>
          <h1 className="text-xl font-semibold text-gray-800">Profile Settings</h1>
          <div className="w-8"></div> {/* Spacer for alignment */}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          {/* Profile Header */}
          <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 h-32">
            <div className="absolute -bottom-16 left-6">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : user.picture ? (
                    <img src={user.picture} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-4xl font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md cursor-pointer hover:bg-gray-100 transition-colors">
                    <FiUpload className="text-blue-600" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageChange} 
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="pt-20 px-6 pb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="border-b border-gray-300 focus:outline-none focus:border-blue-500 w-full"
                    />
                  ) : (
                    user.name
                  )}
                </h2>
                <p className="text-gray-500">{user.email}</p>
              </div>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  <FiEdit2 className="mr-2" />
                  Edit Profile
                </button>
              ) : null}
            </div>

            {/* Profile Details */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-800">{user.email}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                  <div className="px-4 py-2 bg-gray-50 rounded-lg font-mono text-sm text-gray-600 overflow-x-auto">
                    {user.userID}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70 flex items-center justify-center"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({ name: user.name, email: user.email });
                      setPreviewImage(null);
                    }}
                    className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;