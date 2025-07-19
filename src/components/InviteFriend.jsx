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
      // Emit the invite event
      socket.emit("send_invite", { 
        from: currentUserID, 
        fromName: currentUserName,
        to: inviteID 
      });

      setSuccess(`Invite sent to ${inviteID}`);
      setInviteID('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to send invite. Please try again.");
      console.error("Invite error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendInvite();
    }
  };

  return (
    <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <FiUserPlus className="text-blue-600 text-xl" />
        <h3 className="font-medium text-gray-800">Invite a Friend</h3>
      </div>
      
      <div style={{display:"flex",flexDirection:"column"}} className="flex flex-col sm:flex-row gap-2 mb-2">
        <input
          type="text"
          placeholder="Enter friend's User ID"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 transition
                    text-sm sm:text-base"
          value={inviteID}
          onChange={(e) => {
            setInviteID(e.target.value);
            setError(null);
          }}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <button
          onClick={sendInvite}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 
                    transition flex items-center justify-center gap-2
                    disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <FiSend className="sm:hidden" />
              <span className="hidden sm:inline">Send Invite</span>
            </>
          )}
        </button>
      </div>
      
      {error && (
        <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
      
      {success && (
        <p className="text-green-600 text-xs sm:text-sm mt-1 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </p>
      )}
      
      <p className="text-xs text-gray-500 mt-2">
        Ask your friend for their unique user ID to connect with them.
      </p>
    </div>
  );
};

export default InviteFriend;