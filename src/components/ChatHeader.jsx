import { IoArrowBackSharp } from "react-icons/io5";
import { FiMoreVertical } from "react-icons/fi";

const ChatHeader = ({ chatName, chatWith, handleLogout, onMenuClick, isMobile }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* Left: Back button and chat info */}
      <div className="flex items-center space-x-3">
        {isMobile && (
          <button
            onClick={onMenuClick}
            className="text-gray-600 hover:text-gray-800 p-1 rounded-md focus:outline-none"
            aria-label="Back"
          >
            <IoArrowBackSharp className="w-6 h-6" />
          </button>
        )}

        <div className="flex flex-col">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 leading-tight truncate max-w-[180px] sm:max-w-[240px]">
            {chatName || 'Select a chat'}
          </h2>
          {chatWith && (
            <span className="text-xs text-gray-500">User ID: {chatWith}</span>
          )}
        </div>
      </div>

      {/* Right: Placeholder for future icons or dropdown */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleLogout}
          className="text-sm text-red-500 border border-red-500 px-2 py-1 rounded-md hover:bg-red-50 transition"
        >
          Logout
        </button>

        <button className="text-gray-500 hover:text-gray-700 p-1 rounded-md">
          <FiMoreVertical className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
