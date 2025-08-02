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

    useEffect(() => {
        if (!userID) return;

        const fetchRequests = async () => {
            try {
                const res = await axiosInstance.get(`/api/auth/requests/${userID}`);
                setMyRequests(res.data.received || []);
                setSentRequests(res.data.sent || []);
                console.log(res.data);

            } catch (err) {
                console.error("Failed to fetch requests", err);
            }
        };

        fetchRequests();
    }, [userID]);

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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-indigo-600 hover:text-indigo-800 transition-all duration-200"
                    >
                        <IoArrowBack className="mr-2 text-xl" />
                        <span className="font-medium">Back</span>
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 ml-6">Connection Requests</h1>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('incoming')}
                                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'incoming' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            >
                                Incoming
                                {myRequests.length > 0 && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                        {myRequests.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('sent')}
                                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'sent' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            >
                                Sent
                                {sentRequests.length > 0 && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                        {sentRequests.length}
                                    </span>
                                )}
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'incoming' ? (
                            <div>
                                <h2 className="sr-only">Incoming Requests</h2>
                                {myRequests.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="mx-auto h-24 w-24 text-gray-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <h3 className="mt-2 text-lg font-medium text-gray-900">No incoming requests</h3>
                                        <p className="mt-1 text-gray-500">You don't have any pending connection requests.</p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-gray-200">
                                        {myRequests.map(req => (
                                            <li key={req.userID} className="py-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center min-w-0">
                                                        <div className="flex-shrink-0 h-12 w-12 rounded-full overflow-hidden bg-indigo-100">
                                                            {req.picture ? (
                                                                <img
                                                                    src={req.picture}
                                                                    alt={req.fromName}
                                                                    className="h-12 w-12 object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center text-indigo-600 font-medium">
                                                                    {req.fromName?.charAt(0).toUpperCase() || 'U'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="ml-4 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {`User ID : ${req.userID}` || 'No UserID provided'}
                                                            </p>
                                                            <p className="text-sm text-gray-500 truncate">
                                                                {`Name : ${req.fromName}` || 'No fromName provided'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-4">
                                                        {req.status === 'request' ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleAction(req.userID, 'accept')}
                                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                                >
                                                                    Accept
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAction(req.userID, 'decline')}
                                                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                                >
                                                                    Decline
                                                                </button>
                                                            </>
                                                        ) : (
                                                            getStatusBadge(req.status)
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ) : (
                            <div>
                                <h2 className="sr-only">Sent Requests</h2>
                                {sentRequests.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="mx-auto h-24 w-24 text-gray-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="mt-2 text-lg font-medium text-gray-900">No sent requests</h3>
                                        <p className="mt-1 text-gray-500">You haven't sent any connection requests yet.</p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-gray-200">
                                        {sentRequests.map(req => (
                                            <li key={req.userID} className="py-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center min-w-0">
                                                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                                                            <span className="text-gray-600 font-medium">
                                                                {req.username?.charAt(0).toUpperCase() || 'U'}
                                                            </span>
                                                        </div>
                                                        <div className="ml-4 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {req.username || `User ${req.userID}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        {getStatusBadge(req.status)}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestsPage;