import { useState } from 'react';
import { socket } from '../socket';

const InviteFriend = ({ currentUserID }) => {
  const [inviteID, setInviteID] = useState('');

  const sendInvite = () => {
    if (!inviteID || inviteID === currentUserID) {
      alert("Invalid ID");
      return;
    }
    socket.emit("send_invite", { from: currentUserID, to: inviteID });
    setInviteID(''); // clear input
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Enter friend’s User ID"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          value={inviteID}
          onChange={(e) => setInviteID(e.target.value)}
        />
        <button
          onClick={sendInvite}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Invite
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-1">Invite a friend using their unique user ID.</p>
    </div>
  );
};

export default InviteFriend;
