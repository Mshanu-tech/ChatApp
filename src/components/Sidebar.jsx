import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { jwtDecode } from 'jwt-decode';
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
  isMobile,
  onClose,
  navigate,
  handleLogout
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [userPicture, setUserPicture] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded?.picture) {
          setUserPicture(decoded.picture);
        }
      } catch (error) {
        console.error('Invalid token', error);
      }
    }
  }, []);

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
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-md shadow-xl rounded-r-3xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-md">
        <h2 className="text-xl font-semibold truncate">Welcome To Chat App</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
            title="Logout"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>

          <div
            className="w-9 h-9 rounded-full overflow-hidden cursor-pointer border-2 border-white hover:scale-105 transition"
            onClick={() => navigate('/profile')}
          >
            {userPicture ? (
              <img src={userPicture} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/20 flex items-center justify-center text-white font-bold uppercase">
                {userName?.[0]}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 py-3 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="relative">
          <FiSearch className="absolute top-2.5 left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search friends..."
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-transparent">
        {filteredFriends.length > 0 ? (
          <ul className="divide-y divide-gray-100 px-2">
            {filteredFriends.map(friend => {
              const isOnline = onlineUsers.some(user => user.userID === friend.userID);
              const lastMsg = lastMessages[friend.userID];

              return (
                <li
                  key={friend.userID}
                  onClick={() => handleFriendClick(friend)}
                  className="p-3 rounded-lg hover:bg-blue-50 cursor-pointer transition group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="relative w-10 h-10">
                        {friend.picture ? (
                          <img
                            src={friend.picture}
                            alt={friend.name}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 text-white flex items-center justify-center font-medium">
                            {friend.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>

                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800 truncate">{friend.name}</span>
                        {lastMsg && (
                          <span className="text-xs text-gray-400">
                            {formatTime(lastMsg.timestamp)}
                          </span>
                        )}
                      </div>
                      {lastMsg && (
                        <p className="text-sm text-gray-600 truncate">
                          {lastMsg.sender === userID ? 'You: ' : ''}
                          {lastMsg.message
                            ? (lastMsg.message.length > 30 ? lastMsg.message.substring(0, 30) + '...' : lastMsg.message)
                            : lastMsg.image
                              ? '📷 Photo'
                              : lastMsg.video
                                ? '🎥 Video'
                                : lastMsg.audio
                                  ? '🎤 Voice message'
                                  : lastMsg.pdf
                                    ? '📄 PDF'
                                    : 'Sent a file'}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center text-gray-500 py-6">
            {searchTerm ? 'No matching friends' : 'No friends found'}
          </div>
        )}
      </div>

      {/* Floating Invite Button */}
      <div className="fixed bottom-0 right-0 mb-[120px] mr-[30px] z-50">
        <button
          onClick={() => setShowInvitePopup(true)}
          className="p-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-xl hover:scale-110 transition-transform duration-200"
          aria-label="Invite friend"
        >
          <FiPlus className="w-6 h-6" />
        </button>
      </div>

      {/* Invite Popup */}
      {showInvitePopup && (
        <InvitePopup
          currentUserID={userID}
          currentUserName={userName}
          picture={userPicture}
          onClose={() => setShowInvitePopup(false)}
        />
      )}
    </div>
  );
};

export default Sidebar;
