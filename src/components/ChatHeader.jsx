import { IoArrowBackSharp } from "react-icons/io5";
const ChatHeader = ({ chatName, chatWith, userName, navigate, handleLogout, onMenuClick, isMobile }) => {
  return (
    <header className="bg-white shadow-sm py-3 px-4 flex items-center justify-between border-b border-gray-200">
      {/* Left side - Menu button and chat info */}
      <div className="flex w-full items-center">
        {isMobile && (
          <button 
            onClick={onMenuClick}
            className="mr-3 p-1 rounded-md text-gray-500 hover:text-gray-600 focus:outline-none"
            aria-label="Toggle menu"
          >
     <IoArrowBackSharp  color="black"/>

          </button>
        )}
        
        <h2 className="text-lg font-semibold text-gray-800">
          {chatName ? (
            <>
              <span className="truncate max-w-[120px] sm:max-w-[200px] inline-block align-middle">
                {chatName}
              </span>
              {!isMobile && (
                <span className="text-sm text-gray-500 ml-2">({chatWith})</span>
              )}
            </>
          ) : 'Select a chat'}
        </h2>
      </div>

      {/* Right side - User controls */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* User avatar - shown on all screens */}
        <div 
          className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 text-white flex items-center justify-center rounded-full font-bold text-sm uppercase cursor-pointer"
          onClick={() => navigate('/profile')}
          title="Go to profile"
        >
          {userName?.[0]}
        </div>

        {/* Profile button - hidden on mobile to save space */}
        {!isMobile && (
          <button 
            onClick={() => navigate('/profile')} 
            className="text-sm px-3 py-1 rounded border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition"
          >
            Profile
          </button>
        )}

        {/* Logout button - smaller on mobile */}
        <button 
          onClick={handleLogout} 
          className="text-sm px-2 py-1 sm:px-3 rounded bg-red-500 text-white hover:bg-red-600 transition"
          aria-label="Logout"
        >
          {isMobile ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          ) : 'Logout'}
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;