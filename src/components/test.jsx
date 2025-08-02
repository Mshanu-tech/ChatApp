import { useState, useEffect } from 'react';
import { socket } from '../socket';
import axiosInstance from '../utils/axiosInstance';
import { FiSend, FiUserPlus, FiX } from 'react-icons/fi';

const InvitePopup = ({ currentUserID, currentUserName, onClose, picture }) => {
  const [inviteID, setInviteID] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userRequests, setUserRequests] = useState({ received: [], sent: [] });

  useEffect(() => {
    axiosInstance.get(`/api/auth/requests/${currentUserID}`)
      .then(res => setUserRequests(res.data))
      .catch(console.error);
  }, [currentUserID]);

  useEffect(() => {
    const handler = (data) => {
      const { status, message, confirmResend, to } = data;

      if (status === 'declined' && confirmResend && to) {
        if (window.confirm(message + ' Send again?')) {
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
        setTimeout(() => { setSuccess(null); onClose(); }, 2000);
      } else if (status === 'error') {
        setError(message);
      }
      setIsLoading(false);
    };

    socket.on('invite_feedback', handler);
    return () => { socket.off('invite_feedback', handler); };
  }, [currentUserID, currentUserName, onClose, picture]);

  const sendInvite = () => {
    if (!inviteID.trim()) { setError("Please enter a user ID"); return; }
    if (inviteID === currentUserID) { setError("You can't invite yourself"); return; }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const { sent, received } = userRequests;
    console.log(received);

    const se = sent.find(r => r.userID === inviteID);
    if (se) {
      if (se.status === 'request') { setError('Already sent'); setIsLoading(false); return; }
      if (se.status === 'accept') { setError('Already friends'); setIsLoading(false); return; }
      if (se.status === 'decline') {
        if (window.confirm('User rejected last time. Send again?')) emitInvite();
        else setIsLoading(false);
        return;
      }
    }

    const receivedEntry = received.find(r => r.userID === inviteID);
    if (receivedEntry) {
      if (receivedEntry.status === 'accept') {
        setError("This user is already your friend.");
      } else if (receivedEntry.status === 'decline') {
        setError("You rejected this user's request.");
      } else if (receivedEntry.status === 'request') {
        setError("This user already sent you a request.");
        setPendingAcceptID(inviteID); // for accept button
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Invite a Friend</h3>
          <button onClick={onClose}><FiX size={20} /></button>
        </div>
        <div className="p-4 space-y-3">
          <input
            type="text"
            placeholder="Friend's User ID"
            className="w-full px-4 py-2 border rounded focus:ring"
            value={inviteID}
            onChange={(e) => { setInviteID(e.target.value); setError(null); }}
            onKeyPress={e => e.key === 'Enter' && sendInvite()}
            disabled={isLoading}
            autoFocus
          />
          <button
            disabled={isLoading}
            onClick={sendInvite}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : <><FiSend /> Send Invite</>}
          </button>
          {error && <div className="text-red-600">{error}</div>}
          {success && <div className="text-green-600">{success}</div>}
        </div>
      </div>
    </div>
  );
};

export default InvitePopup;
