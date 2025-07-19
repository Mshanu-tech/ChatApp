const ChatHeader = ({ chatName, chatWith, userName, navigate, handleLogout }) => {
  return (
    <div className="p-4 border-b bg-white flex items-center justify-between shadow-md">
      <h2 className="text-lg font-semibold text-gray-800">
        {chatName ? `${chatName} (${chatWith})` : 'Select a chat'}
      </h2>
      <div className="flex items-center space-x-4">
        <div className="w-9 h-9 bg-blue-600 text-white flex items-center justify-center rounded-full font-bold text-sm uppercase">
          {userName?.[0]}
        </div>
        <button 
          onClick={() => navigate('/profile')} 
          className="text-sm px-3 py-1 rounded border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition"
        >
          Profile
        </button>
        <button 
          onClick={handleLogout} 
          className="text-sm px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;