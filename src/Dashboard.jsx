import React, { useState, useEffect, useRef } from 'react';
import InviteFriend from './components/InviteFriend';
import ChatInvitePopup from './components/ChatInvitePopup';
import { socket } from './socket';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userID, setUserID] = useState(null);
  const [userName, setUserName] = useState(null);
  const [chatWith, setChatWith] = useState(null);
  const [chatName, setChatName] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [replyTo, setReplyTo] = useState(null);

  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  // Add this to your existing state
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isHoveringAudio, setIsHoveringAudio] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserID(decoded.userID);
        setUserName(decoded.name);

        socket.auth = { userID: decoded.userID };
        socket.io.opts.query = { userID: decoded.userID, name: decoded.name };
        socket.connect();

        // Add to online list
        socket.on('user-online', ({ userID: newUserID, name }) => {
          setOnlineUsers(prev => {
            if (!prev.find(u => u.userID === newUserID)) {
              return [...prev, { userID: newUserID, name }];
            }
            return prev;
          });
        });

        // Remove from online list
        socket.on('user-offline', ({ userID: offlineUserID }) => {
          setOnlineUsers(prev => prev.filter(u => u.userID !== offlineUserID));
        });

        const loadFriends = async () => {
          try {
            const res = await axios.get(`https://chatappbackend-eg0b.onrender.com/api/auth/friends/${decoded.userID}`);
            setFriends(res.data);
          } catch (err) {
            console.error('Failed to load friends:', err);
          }
        };

        // Then call inside useEffect:
        loadFriends();

        const loadLastMessages = async () => {
          try {
            const res = await axios.get(`https://chatappbackend-eg0b.onrender.com/api/auth/last-messages/${decoded.userID}`);
            const mapped = {};
            res.data.forEach(msg => {
              const friendID = msg.sender === decoded.userID ? msg.receiver : msg.sender;
              mapped[friendID] = msg;
            });
            setLastMessages(mapped);
          } catch (err) {
            console.error('Failed to load last messages:', err);
          }
        };

        loadLastMessages();


        // 👇 Load friend and message data from sessionStorage
        const friend = JSON.parse(sessionStorage.getItem('friend'));
        const savedMessages = JSON.parse(sessionStorage.getItem('messages'));

        if (friend) {
          setChatWith(friend.userID);
          setChatName(friend.name);
          setMessages(savedMessages || []);
        }
      } catch (err) {
        console.error('Token decode failed:', err);
      }
    }

    socket.off('receive_message').on('receive_message', ({ from, message, timestamp }) => {
      setMessages(prev => [...prev, { from, message, timestamp }]);

      // Update sidebar preview
      setLastMessages(prev => ({
        ...prev,
        [from]: { sender: from, receiver: userID, message, timestamp }
      }));
    });


    socket.off('invite_result').on('invite_result', ({ from, fromName, accepted }) => {
      if (accepted) {
        setChatWith(from);
        setChatName(fromName);
      }
    });

    return () => {
      socket.off('receive_message');
      socket.off('invite_result');
      socket.off('online-users').on('online-users', (onlineList) => {
        setOnlineUsers(onlineList);
      });
      socket.disconnect();
    };
  }, [userID]);


  const AudioPlayer = ({ audioSrc, duration, isSender, isHovered, onHover }) => {
    return (
      <div
        className={`relative group ${isSender ? 'justify-end' : 'justify-start'}`}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
      >
        <div className={`flex items-center gap-2 p-2 rounded-xl ${isSender ? 'bg-green-100' : 'bg-white'}`}>
          <audio controls className="w-full max-w-[180px]">
            <source src={audioSrc} type="audio/webm" />
          </audio>

          {/* Duration badge - shows on hover or always for sender */}
          {(isHovered || isSender) && (
            <span className={`text-xs px-2 py-1 rounded-full ${isSender ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
              {duration}s
            </span>
          )}
        </div>

        {/* Visual waveform indicator (simplified) */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${isSender ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(100, (duration / 60) * 100)}%` }}
          />
        </div>
      </div>
    );
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !chatWith) return;
    const newMsg = {
      sender: userID,
      receiver: chatWith,
      message,
      timestamp: new Date().toISOString(),
      replyTo: replyTo ? replyTo.message : null,
    };
    socket.emit('send_message', newMsg);
    setLastMessages(prev => ({ ...prev, [chatWith]: newMsg }));
    setMessages(prev => [...prev, newMsg]);
    setMessage('');
    setReplyTo(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('friend');
    sessionStorage.removeItem('messages');
    socket.disconnect();
    navigate('/');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingDuration(0); // Reset duration when starting new recording
      const chunks = [];

      // Start timer
      const startTime = Date.now();
      const timer = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = () => {
        clearInterval(timer); // Clear the timer when recording stops
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result;
          socket.emit('voice_message', {
            from: userID,
            to: chatWith,
            audio: base64Audio,
            timestamp: new Date().toISOString(),
            duration: recordingDuration,
          });
          setMessages(prev => [...prev, {
            sender: userID,
            receiver: chatWith,
            audio: base64Audio,
            timestamp: new Date().toISOString(),
            duration: recordingDuration,
          }]);
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start();
      setAudioChunks(chunks);
    } catch (err) {
      console.error('Microphone access denied', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setRecordingDuration(0); // Reset duration
    }
  };

  return (
    <div className="flex h-screen font-sans">
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
                    const res = await axios.get(`https://chatappbackend-eg0b.onrender.com/api/auth/messages/${userID}/${friend.userID}`);
                    setMessages(res.data);
                    sessionStorage.setItem('messages', JSON.stringify(res.data));
                  } catch (err) {
                    console.error('Failed to load conversation:', err);
                  }
                }}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{friend.name}</span>
                  <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                    {isOnline ? '● Online' : '● Offline'}
                  </span>
                </div>
                {lastMsg && (
                  <div className="text-xs text-gray-600 truncate">
                    {lastMsg.sender === userID ? 'You: ' : ''}{lastMsg.message}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </aside>

      <main className="flex-1 flex flex-col">
        <div className="p-4 border-b bg-white flex items-center justify-between shadow-md">
          <h2 className="text-lg font-semibold text-gray-800">
            {chatName ? `${chatName} (${chatWith})` : 'Select a chat'}
          </h2>
          <div className="flex items-center space-x-4">
            <div className="w-9 h-9 bg-blue-600 text-white flex items-center justify-center rounded-full font-bold text-sm uppercase">
              {userName?.[0]}
            </div>
            <button onClick={() => navigate('/profile')} className="text-sm px-3 py-1 rounded border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition">
              Profile
            </button>
            <button onClick={handleLogout} className="text-sm px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition">
              Logout
            </button>
          </div>
        </div>

        <div id="chat-messages" className="flex-1 p-4 overflow-y-auto bg-gray-200 space-y-2">
          {messages.map((msg, index) => {
            const isSender = msg.sender === userID;
            const messageTime = new Date(msg.timestamp);
            const formattedTime = messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const formattedDate = messageTime.toLocaleDateString();
            return (
              <div key={index} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                <div className={`relative max-w-[75%] px-4 py-2 rounded-xl shadow-sm text-sm break-words ${isSender ? 'bg-green-100 rounded-br-none' : 'bg-white rounded-bl-none'}`}>
                  {msg.message && <div>{msg.message}</div>}

                  {msg.audio && (
                    <AudioPlayer
                      audioSrc={msg.audio}
                      duration={msg.duration || 0}
                      isSender={msg.sender === userID}
                      isHovered={isHoveringAudio === index}
                      onHover={(hoverState) => setIsHoveringAudio(hoverState ? index : null)}
                    />
                  )}
                  <div className="text-[10px] text-gray-500 mt-1 text-right">
                    {formattedDate} • {formattedTime}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t bg-white">
          {replyTo && (
            <div className="flex items-start gap-2 bg-gray-100 border-l-4 border-blue-500 rounded p-2 mb-2 relative">
              <div className="flex-1">
                <p className="text-xs text-blue-700 font-semibold">Replying to</p>
                <p className="text-sm italic text-gray-700 truncate">"{replyTo.message}"</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-red-600 text-sm font-bold absolute top-1 right-2">✕</button>
            </div>
          )}

          <form className="flex items-center gap-3" onSubmit={handleSendMessage}>
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
              Send
            </button>
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-purple-500 text-white hover:bg-purple-600 transition-all"
                >
                  <span className="w-4 h-4 bg-white rounded-full animate-pulse"></span>
                  Record
                </button>
              ) : (
                <div className="flex items-center gap-3 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="text-sm font-medium text-red-600">Recording</span>
                  </div>
                  <span className="text-xs font-mono bg-white px-2 py-0.5 rounded-full text-red-600 border border-red-200">
                    {recordingDuration}s
                  </span>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="text-red-600 hover:text-white hover:bg-red-500 w-6 h-6 flex items-center justify-center rounded-full transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </main>

      <ChatInvitePopup currentUserID={userID} onConfirmChat={(id, name) => {
        setChatWith(id);
        setChatName(name);
      }} />
    </div>
  );
};

export default Dashboard;
