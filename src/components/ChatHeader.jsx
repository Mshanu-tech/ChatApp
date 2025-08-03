import { IoArrowBackSharp } from "react-icons/io5";

const ChatHeader = ({ chatName, chatWith, onMenuClick, isMobile, picture }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between relative">
      {/* Left section */}
      <div className="flex items-center space-x-3">
        {isMobile && (
          <button onClick={onMenuClick} className="text-gray-600 hover:text-gray-800 p-1 rounded-md">
            <IoArrowBackSharp className="w-6 h-6" />
          </button>
        )}

        {/* Profile Picture */}
        {picture && (
          <img
            src={picture}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover border border-gray-300"
          />
        )}

        {/* Chat Info */}
        <div className="flex flex-col">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate max-w-[180px] sm:max-w-[240px]">
            {chatName || 'Select a chat'}
          </h2>
          {chatWith && (
            <span className="text-xs text-gray-500">User ID: {chatWith}</span>
          )}
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
