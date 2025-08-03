import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IoArrowBack, IoCheckmarkCircle, IoCloseCircle, IoTime } from 'react-icons/io5';
import axiosInstance from './utils/axiosInstance';

const RequestsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userID = location.state?.userID;
  const [myRequests, setMyRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('incoming');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!userID) return;

    const fetchRequests = async () => {
      try {
        const res = await axiosInstance.get(`/api/auth/requests/${userID}`);
        setMyRequests(res.data.received || []);
        setSentRequests(res.data.sent || []);
      } catch (err) {
        console.error("Failed to fetch requests", err);
      }
    };

    fetchRequests();
  }, [userID]);

  const filteredRequests = (activeTab === 'incoming' ? myRequests : sentRequests).filter(req =>
    req.fromName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.userID?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAction = async (senderID, action) => {
    try {
      const res = await axiosInstance.patch('/api/auth/requests/respond', {
        userID,
        senderID,
        action,
      });

      if (res.status === 200) {
        setMyRequests(prev =>
          prev.map(req =>
            req.userID === senderID ? { ...req, status: action } : req
          )
        );
      }
    } catch (err) {
      console.error(`Failed to ${action} request:`, err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accept':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <IoCheckmarkCircle className="mr-1" /> Accepted
          </span>
        );
      case 'decline':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <IoCloseCircle className="mr-1" /> Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <IoTime className="mr-1" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {/* Back + Title */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-indigo-600 hover:text-indigo-800 transition"
            >
              <IoArrowBack className="text-xl mr-2" />
              <span className="font-medium text-sm sm:text-base">Back</span>
            </button>

          </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 text-center sm:text-left">
              Connection Requests
            </h1>
          {/* Search */}
          <input
            type="text"
            placeholder="Search by name or user ID"
            className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex space-x-4 justify-center">
            <button
              onClick={() => setActiveTab('incoming')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                activeTab === 'incoming'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Incoming
              {myRequests.length > 0 && (
                <span className="ml-2 bg-white text-indigo-600 font-bold text-xs px-2 py-0.5 rounded-full">
                  {myRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                activeTab === 'sent'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sent
              {sentRequests.length > 0 && (
                <span className="ml-2 bg-white text-indigo-600 font-bold text-xs px-2 py-0.5 rounded-full">
                  {sentRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Requests */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
              <p className="text-lg font-semibold">No {activeTab} requests</p>
              <p className="text-sm">Nothing to show here right now.</p>
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div
                key={req.userID}
                className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Avatar + Info */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-base sm:text-lg">
                    {req.picture ? (
                      <img src={req.picture} alt="profile" className="object-cover w-full h-full" />
                    ) : (
                      req.fromName?.[0]?.toUpperCase() || req.username?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">
                      {req.fromName || req.username || 'Unnamed User'}
                    </p>
                    <p className="text-xs text-gray-500 break-all">{req.userID}</p>
                  </div>
                </div>

                {/* Status / Actions */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {req.status === 'request' && activeTab === 'incoming' ? (
                    <>
                      <button
                        onClick={() => handleAction(req.userID, 'accept')}
                        className="bg-green-500 hover:bg-green-600 text-white text-xs px-4 py-1.5 rounded-full"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleAction(req.userID, 'decline')}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-4 py-1.5 rounded-full"
                      >
                        Decline
                      </button>
                    </>
                  ) : (
                    getStatusBadge(req.status)
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestsPage;
