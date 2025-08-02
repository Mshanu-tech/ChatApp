import { useState, useEffect } from 'react';
import { socket } from '../socket';
import axiosInstance from '../utils/axiosInstance';
import { FiSend, FiX, FiUserCheck, FiUserX } from 'react-icons/fi';

const InvitePopup = ({ currentUserID, currentUserName, onClose, picture }) => {
  const [inviteID, setInviteID] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userRequests, setUserRequests] = useState({ received: [], sent: [] });
  const [showAccept, setShowAccept] = useState(false);
  const [pendingAcceptID, setPendingAcceptID] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await axiosInstance.get(`/api/auth/requests/${currentUserID}`);
        setUserRequests(res.data);
      } catch (err) {
        console.error("Failed to fetch friend requests:", err);
      }
    };
    fetchRequests();
  }, [currentUserID]);

  useEffect(() => {
    const handler = (data) => {
      const { status, message, confirmResend, to } = data;

      if (status === 'declined' && confirmResend && to) {
        if (window.confirm(`${message} Send again?`)) {
          socket.emit('confirm_resend_invite', {
            from: currentUserID,
            fromName: currentUserName,
            to,
            picture
          });
        } else {
          setIsLoading(false);
        }
      } else if (status === 'friend' || status === 'pending' || status === 'incoming') {
        setError(message);
      } else if (status === 'success') {
        setSuccess(message);
        setInviteID('');
        setTimeout(() => { 
          setSuccess(null); 
          onClose(); 
        }, 2000);
      } else if (status === 'error') {
        setError(message);
      }
      setIsLoading(false);
    };

    socket.on('invite_feedback', handler);
    return () => socket.off('invite_feedback', handler);
  }, [currentUserID, currentUserName, onClose, picture]);

  const handleAcceptRequest = async () => {
    try {
      setIsLoading(true);
      await axiosInstance.post('/api/auth/accept-request', {
        requesterID: pendingAcceptID,
        recipientID: currentUserID
      });
      setSuccess('Friend request accepted!');
      setShowAccept(false);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError('Failed to accept request');
    } finally {
      setIsLoading(false);
    }
  };

  const sendInvite = () => {
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

    const { sent, received } = userRequests;

    const sentRequest = sent.find(r => r.userID === inviteID);
    if (sentRequest) {
      if (sentRequest.status === 'request') {
        setError('Invite already sent');
        setIsLoading(false);
        return;
      }
      if (sentRequest.status === 'accept') {
        setError('Already friends');
        setIsLoading(false);
        return;
      }
      if (sentRequest.status === 'decline') {
        if (window.confirm('This user declined your previous invite. Send again?')) {
          emitInvite();
        } else {
          setIsLoading(false);
        }
        return;
      }
    }

    const receivedRequest = received.find(r => r.userID === inviteID);
    if (receivedRequest) {
      if (receivedRequest.status === 'accept') {
        setError("You're already friends with this user");
      } else if (receivedRequest.status === 'decline') {
        setError("You previously declined this user's request");
      } else if (receivedRequest.status === 'request') {
        setError("This user already sent you a request");
        setPendingAcceptID(inviteID);
        setShowAccept(true);
      }
      setIsLoading(false);
      return;
    }

    emitInvite();
  };

  const emitInvite = () => {
    socket.emit('send_invite', {
      from: currentUserID,
      fromName: currentUserName,
      to: inviteID,
      picture
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-xl font-semibold text-gray-800">Invite Friend</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            disabled={isLoading}
          >
            <FiX className="text-gray-500 w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Enter User ID
            </label>
            <input
              type="text"
              placeholder="e.g. user123"
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={inviteID}
              onChange={(e) => {
                setInviteID(e.target.value);
                setError(null);
                setShowAccept(false);
              }}
              onKeyPress={(e) => e.key === 'Enter' && sendInvite()}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {showAccept && (
            <div className="flex gap-3">
              <button
                onClick={handleAcceptRequest}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <FiUserCheck /> Accept Request
              </button>
              <button
                onClick={() => setShowAccept(false)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-800 py-2.5 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                <FiUserX /> Decline
              </button>
            </div>
          )}

          {!showAccept && (
            <button
              onClick={sendInvite}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <FiSend /> Send Invite
                </>
              )}
            </button>
          )}

          {(error || success) && (
            <div className={`p-3 rounded-lg ${error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              <p className="text-sm">{error || success}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvitePopup;