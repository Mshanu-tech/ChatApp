import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { FiPlus, FiSearch, FiMoreVertical, FiUser, FiLogOut, FiUserPlus, FiMessageSquare } from 'react-icons/fi';
import { jwtDecode } from 'jwt-decode';
import InvitePopup from './InvitePopup';
import { useNavigate } from 'react-router-dom';

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
  handleLogout
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [userPicture, setUserPicture] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleRequestsClick = () => {
    setMenuOpen(false);
    navigate('/requests', { state: { userID } });
  };

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
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <FiMessageSquare className="text-white w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Chat App</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowInvitePopup(true)}
            className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <FiPlus className="w-5 h-5" />
          </button>
          
          <div className="relative">
            <button 
              onClick={toggleMenu} 
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FiMoreVertical className="w-5 h-5 text-gray-600" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FiUser className="mr-3 w-4 h-4" />
                  Profile
                </button>
                
                <button
                  onClick={handleRequestsClick}
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FiUserPlus className="mr-3 w-4 h-4" />
                  Friend Requests
                </button>
                
                <div className="border-t border-gray-200"></div>
                
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-gray-100"
                >
                  <FiLogOut className="mr-3 w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 py-4 bg-white">
        <div className="relative">
          <FiSearch className="absolute top-3 left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-4">
        {filteredFriends.length > 0 ? (
          <ul className="space-y-1 px-3">
            {filteredFriends.map(friend => {
              const isOnline = onlineUsers.some(user => user.userID === friend.userID);
              const lastMsg = lastMessages[friend.userID];
              const isUnread = lastMsg?.sender !== userID && lastMsg?.read === false;

              return (
                <li
                  key={friend.userID}
                  onClick={() => handleFriendClick(friend)}
                  className={`p-3 rounded-xl cursor-pointer transition ${isUnread ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="relative w-12 h-12">
                        {friend.picture ? (
                          <img
                            src={friend.picture}
                            alt={friend.name}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center font-medium text-lg">
                            {friend.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                          {friend.name}
                        </span>
                        {lastMsg && (
                          <span className={`text-xs ${isUnread ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                            {formatTime(lastMsg.timestamp)}
                          </span>
                        )}
                      </div>
                      
                      {lastMsg && (
                        <div className="flex justify-between items-center mt-1">
                          <p className={`text-sm truncate ${isUnread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                            {lastMsg.sender === userID ? 'You: ' : ''}
                            {lastMsg.message
                              ? (lastMsg.message.length > 25 ? lastMsg.message.substring(0, 25) + '...' : lastMsg.message)
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
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 ml-2"></span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FiUserPlus className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">
              {searchTerm ? 'No matches found' : 'No conversations'}
            </h3>
            <p className="text-gray-500 text-sm max-w-xs">
              {searchTerm 
                ? 'Try a different search term' 
                : 'Start a new conversation by adding friends'}
            </p>
            <button
              onClick={() => setShowInvitePopup(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Invite Friends
            </button>
          </div>
        )}
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