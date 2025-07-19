import InviteFriend from './InviteFriend';
import axiosInstance from '../utils/axiosInstance';

const Sidebar = ({ 
  userName, 
  friends, 
  onlineUsers, 
  lastMessages, 
  userID, 
  setChatWith, 
  setChatName, 
  setMessages 
}) => {
  return (
    <aside className="w-full sm:w-1/3 md:w-1/4 bg-gray-100 p-4 border-r overflow-y-auto">
      <h2 className="text-lg font-bold mb-4">Welcome, {userName}</h2>
      <InviteFriend currentUserID={userID} currentUserName={userName} />
      <ul className="space-y-2">
        {friends.map(friend => {
          const isOnline = onlineUsers.some(user => user.userID === friend.userID);
          const lastMsg = lastMessages[friend.userID];
          return (
            <li 
              key={friend.userID} 
              className="p-3 rounded hover:bg-gray-200 cursor-pointer transition" 
              onClick={async () => {
                setChatWith(friend.userID);
                setChatName(friend.name);
                sessionStorage.setItem('friend', JSON.stringify(friend));
                try {
                  const res = await axiosInstance.get(`/api/auth/messages/${userID}/${friend.userID}`);
                  setMessages(res.data);
                  sessionStorage.setItem('messages', JSON.stringify(res.data));
                } catch (err) {
                  console.error('Failed to load conversation:', err);
                }
              }}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{friend.name}</span>
                <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                  {isOnline ? '● Online' : '● Offline'}
                </span>
              </div>
              {lastMsg && (
                <div className="text-xs text-gray-600 truncate">
                  {lastMsg.sender === userID ? 'You: ' : ''}{lastMsg.message ? lastMsg.message : '[Voice message]'}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default Sidebar;