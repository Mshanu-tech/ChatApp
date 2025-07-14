import { useEffect, useState } from 'react';
import { socket } from '../socket';

const ChatInvitePopup = ({ currentUserID, onConfirmChat }) => {
  const [invite, setInvite] = useState(null);

  useEffect(() => {
    socket.on("receive_invite", (data) => {
      setInvite(data);
    });

    return () => {
      socket.off("receive_invite");
    };
  }, []);

  const confirm = () => {
    socket.emit("invite_response", { to: invite.from, accepted: true });
    setInvite(null);
    onConfirmChat(invite.from, invite.fromName);
  };

  const decline = () => {
    socket.emit("invite_response", { to: invite.from, accepted: false });
    setInvite(null);
  };

  if (!invite) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in">
        <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">Chat Invitation</h2>
        <p className="text-gray-700 text-center mb-6">
          <span className="font-medium text-blue-600">{invite.fromName}</span> ({invite.from}) invited you to chat.
        </p>
        <div className="flex justify-center gap-4">
          <button
            className="bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600 transition"
            onClick={confirm}
          >
            Accept
          </button>
          <button
            className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 transition"
            onClick={decline}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInvitePopup;
