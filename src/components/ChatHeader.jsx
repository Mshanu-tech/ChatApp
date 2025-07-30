import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // If using React Router
import { IoArrowBackSharp } from "react-icons/io5";
import { FiMoreVertical } from "react-icons/fi";

const ChatHeader = ({ chatName, chatWith, handleLogout, onMenuClick, isMobile, userID }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setMenuOpen(!menuOpen);

const handleRequestsClick = () => {
  setMenuOpen(false);
  navigate('/requests', { state: { userID } }); // ✅ passing userID
};

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between relative">
      {/* Left section unchanged */}
      <div className="flex items-center space-x-3">
        {isMobile && (
          <button onClick={onMenuClick} className="text-gray-600 hover:text-gray-800 p-1 rounded-md">
            <IoArrowBackSharp className="w-6 h-6" />
          </button>
        )}
        <div className="flex flex-col">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate max-w-[180px] sm:max-w-[240px]">
            {chatName || 'Select a chat'}
          </h2>
          {chatWith && (
            <span className="text-xs text-gray-500">User ID: {chatWith}</span>
          )}
        </div>
      </div>

      {/* Right section with dropdown */}
      <div className="flex items-center space-x-2 relative">
        <button
          onClick={handleLogout}
          className="text-sm text-red-500 border border-red-500 px-2 py-1 rounded-md hover:bg-red-50"
        >
          Logout
        </button>

        <button onClick={toggleMenu} className="text-gray-500 hover:text-gray-700 p-1 rounded-md">
          <FiMoreVertical className="w-5 h-5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded shadow w-40 z-50">
            <button
              onClick={handleRequestsClick}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Requests
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default ChatHeader;
