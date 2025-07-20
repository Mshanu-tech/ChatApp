import { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { FiPlus, FiSearch } from 'react-icons/fi';
import InvitePopup from './InvitePopup';

const Sidebar = ({ 
  userName, 
  friends, 
  onlineUsers, 
  lastMessages, 
  userID, 
  setChatWith, 
  setChatName, 
  setMessages,
  onLogout,
  isMobile,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInvitePopup, setShowInvitePopup] = useState(false);

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFriendClick = async (friend) => {
    setChatWith(friend.userID);
    setChatName(friend.name);
    sessionStorage.setItem('friend', JSON.stringify(friend));
    
    try {
      const res = await axiosInstance.get(`/api/auth/messages/${userID}/${friend.userID}`);
      setMessages(res.data);
      sessionStorage.setItem('messages', JSON.stringify(res.data));
      
      if (isMobile && onClose) onClose();
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-bold truncate">Welcome To Chat App</h2>
        {isMobile && (
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Search Bar with Invite Button */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search friends..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowInvitePopup(true)}
              className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
              aria-label="Invite friend"
            >
              <FiPlus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto">
          {filteredFriends.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {filteredFriends.map(friend => {
                const isOnline = onlineUsers.some(user => user.userID === friend.userID);
                const lastMsg = lastMessages[friend.userID];
                
                return (
                  <li 
                    key={friend.userID} 
                    className="p-3 hover:bg-gray-100 active:bg-gray-200 cursor-pointer transition"
                    onClick={() => handleFriendClick(friend)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                        {isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="font-medium truncate">{friend.name}</span>
                          {lastMsg && (
                            <span className="text-xs text-gray-500">
                              {formatTime(lastMsg.timestamp)}
                            </span>
                          )}
                        </div>
                        {lastMsg && (
                          <div className="text-xs text-gray-600 truncate">
                            {lastMsg.sender === userID ? 'You: ' : ''}
                            {lastMsg.message 
                              ? lastMsg.message.length > 30 
                                ? lastMsg.message.substring(0, 30) + '...' 
                                : lastMsg.message
                              : '🎤 Voice message'}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No friends match your search' : 'No friends available'}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <button
          onClick={onLogout}
          className="w-full py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      {/* Invite Popup */}
      {showInvitePopup && (
        <InvitePopup 
          currentUserID={userID} 
          currentUserName={userName} 
          onClose={() => setShowInvitePopup(false)}
        />
      )}
    </div>
  );
};

export default Sidebar;