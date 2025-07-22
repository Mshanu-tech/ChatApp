import { useState } from 'react';
import { socket } from '../socket';
import { FiSend, FiUserPlus } from 'react-icons/fi';

const InviteFriend = ({ currentUserID, currentUserName }) => {
  const [inviteID, setInviteID] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const sendInvite = async () => {
    if (!inviteID.trim()) {
      setError("Please enter a user ID");
      return;
    }

    if (inviteID === currentUserID) {
      setError("You can't invite yourself");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      socket.emit("send_invite", {
        from: currentUserID,
        fromName: currentUserName,
        to: inviteID,
      });

      setSuccess(`Invite sent to ${inviteID}`);
      setInviteID('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to send invite. Please try again.");
      console.error("Invite error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendInvite();
  };

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-md mb-6">
      <div className="flex items-center gap-2 mb-4">
        <FiUserPlus className="text-blue-600 text-xl" />
        <h2 className="text-lg font-semibold text-gray-800">Invite a Friend</h2>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          type="text"
          placeholder="Friend's User ID"
          value={inviteID}
          onChange={(e) => {
            setInviteID(e.target.value);
            setError(null);
          }}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60 transition"
        />
        <button
          onClick={sendInvite}
          disabled={isLoading}
          className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400 transition"
        >
          {isLoading ? (
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <FiSend className="mr-1 sm:mr-2" />
              <span>Send</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </p>
      )}

      <p className="text-xs text-gray-500 mt-2">
        Ask your friend for their user ID to start a conversation.
      </p>
    </div>
  );
};

export default InviteFriend;
