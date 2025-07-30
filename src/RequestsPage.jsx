import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IoArrowBackSharp } from 'react-icons/io5';
import axiosInstance from './utils/axiosInstance'; // adjust path if needed

const RequestsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const userID = location.state?.userID; // ✅ access passed userID
    const [myRequests, setMyRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    console.log(userID);

    useEffect(() => {
        if (!userID) return;

        const fetchRequests = async () => {
            try {
                const res = await axiosInstance.get(`/api/auth/requests/${userID}`);
                console.log(res);
                
                setMyRequests(res.data.received || []);
                setSentRequests(res.data.sent || []);
            } catch (err) {
                console.error("Failed to fetch requests", err);
            }
        };

        fetchRequests();
    }, [userID]);

    // Accept or decline request
    const handleAction = async (senderID, action) => {
        try {
            const res = await axiosInstance.patch('/api/auth/requests/respond', {
                userID: userID,
                senderID,
                action, // "accept" or "decline"
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

    return (
        <div className="p-4 max-w-3xl mx-auto">
            <button onClick={() => navigate(-1)} className="mb-4 flex items-center text-blue-600 hover:underline">
                <IoArrowBackSharp className="mr-1" /> Back
            </button>

            <h2 className="text-xl font-bold mb-4">My Requests</h2>
            <div className="space-y-3 mb-8">
                {myRequests.map(req => (
                    <div key={req.userID} className="border p-3 rounded flex justify-between items-center">
                        <div>
                            <p className="font-medium">From: {req.userID}</p>
                            <p className="text-sm text-gray-500">Status: {req.status}</p>
                        </div>
                        {req.status === 'request' && (
                            <div className="space-x-2">
                                <button
                                    onClick={() => handleAction(req.userID, 'accept')}
                                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                >
                                    Accept
                                </button>
                                <button
                                    onClick={() => handleAction(req.userID, 'decline')}
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                    Decline
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <h2 className="text-xl font-bold mb-4">Sent Requests</h2>
            <div className="space-y-3">
                {sentRequests.map(req => (
                    <div key={req.userID} className="border p-3 rounded flex justify-between items-center">
                        <div>
                            <p className="font-medium">To: {req.userID}</p>
                            <p className="text-sm text-gray-500">Status: {req.status}</p>
                        </div>
                        {req.status === 'request' && (
                            <span className="text-yellow-600 font-medium">Awaiting response</span>
                        )}
                        {req.status === 'accept' && (
                            <span className="text-green-600 font-medium">Accepted</span>
                        )}
                        {req.status === 'decline' && (
                            <span className="text-red-600 font-medium">Declined</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RequestsPage;
