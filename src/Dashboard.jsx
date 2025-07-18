import { useState, useEffect, useRef } from 'react';
import InviteFriend from './components/InviteFriend';
import ChatInvitePopup from './components/ChatInvitePopup';
import { socket } from './socket';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axiosInstance from './utils/axiosInstance';
import EmojiPicker from 'emoji-picker-react';
import AudioPlayer from './components/AudioPlayer';

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
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

        socket.on('user-online', ({ userID: newUserID, name }) => {
          setOnlineUsers(prev => {
            if (!prev.find(u => u.userID === newUserID)) {
              return [...prev, { userID: newUserID, name }];
            }
            return prev;
          });
        });

        socket.on('user-offline', ({ userID: offlineUserID }) => {
          setOnlineUsers(prev => prev.filter(u => u.userID !== offlineUserID));
        });

        const loadFriends = async () => {
          try {
            const res = await axiosInstance.get(`/api/auth/friends/${decoded.userID}`);
            setFriends(res.data);
          } catch (err) {
            console.error('Failed to load friends:', err);
          }
        };
        loadFriends();

        const loadLastMessages = async () => {
          try {
            const res = await axiosInstance.get(`/api/auth/last-messages/${decoded.userID}`);
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

    socket.off('receive_message').on('receive_message', ({ from, message, audio, timestamp, duration, replyTo }) => {
      const newMsg = { from, message, audio, timestamp, duration, replyTo };
      setMessages(prev => [...prev, newMsg]);
      setLastMessages(prev => ({
        ...prev,
        [from]: { sender: from, receiver: userID, message, audio, timestamp }
      }));
    });

    socket.off('invite_result').on('invite_result', ({ from, fromName, accepted }) => {
      if (accepted) {
        setChatWith(from);
        setChatName(fromName);
      }
    });

    socket.off('voice_message').on('voice_message', ({ from, audio, timestamp, duration, replyTo }) => {
      const newMsg = { from, audio, timestamp, duration, replyTo };
      setMessages(prev => [...prev, newMsg]);
      setLastMessages(prev => ({
        ...prev,
        [from]: { sender: from, receiver: userID, audio, timestamp, duration }
      }));
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

const AudioPlayer = ({ audioSrc, duration, isSender }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / duration) * 100);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [duration]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${isSender ? 'bg-green-100' : 'bg-white'}`} style={{ minWidth: '250px' }}>
      <audio ref={audioRef} src={audioSrc} preload="metadata" />
    
      <button
        onClick={togglePlay}
        className={`p-2 rounded-full ${isSender ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
      >
        {isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${isSender ? 'bg-green-500' : 'bg-blue-500'} transition-all duration-100`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-600">
          <span>{formatTime(isPlaying ? currentTime : 0)}</span>
          <span>{formatTime(duration)}</span>
        </div>
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
      replyTo: replyTo?.message || replyTo?.audio ? {
        message: replyTo?.message || null,
        audio: replyTo?.audio || null,
        duration: replyTo?.duration || 0,
      } : null,
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
      setRecordingDuration(0);
      const chunks = [];

      const startTime = Date.now();
      const timer = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
        setAudioChunks([...chunks]);
      };

      recorder.onstop = async () => {
        clearInterval(timer);
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result;
          const audioMsg = {
            sender: userID,
            receiver: chatWith,
            audio: base64Audio,
            timestamp: new Date().toISOString(),
            duration: recordingDuration,
            replyTo: replyTo?.message || replyTo?.audio ? {
              message: replyTo?.message || null,
              audio: replyTo?.audio || null,
              duration: replyTo?.duration || 0,
            } : null,
          };

          socket.emit('voice_message', audioMsg);
          setMessages(prev => [...prev, { ...audioMsg, from: userID }]);
          setLastMessages(prev => ({ ...prev, [chatWith]: audioMsg }));
          setReplyTo(null);
        };

        // Clean up
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(100); // Collect data every 100ms
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setRecordingDuration(0);
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
              <li key={friend.userID} className="p-3 rounded hover:bg-gray-200 cursor-pointer transition" onClick={async () => {
                setChatWith(friend.userID);
                setChatName(friend.name);
                sessionStorage.setItem('friend', JSON.stringify(friend));
                try {
                  const res = await axiosInstance.get(`/api/auth/messages/${userID}/${friend.userID}`);
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
                    {lastMsg.sender === userID ? 'You: ' : ''}{lastMsg.message ? lastMsg.message : '[Voice message]'}
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
            <button onClick={() => navigate('/profile')} className="text-sm px-3 py-1 rounded border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition">Profile</button>
            <button onClick={handleLogout} className="text-sm px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition">Logout</button>
          </div>
        </div>


        {/* inside Dashboard render */}
        <div id="chat-messages" className="flex-1 p-4 overflow-auto bg-gray-100 space-y-3">
{messages.map((msg, i) => {
  const isMe = msg.sender === userID || msg.from === userID;
  const time = new Date(msg.timestamp);
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString();

  const onlyEmoji = msg.message && /^[\p{Emoji}\s]+$/u.test(msg.message);

  return (
    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div
        onDoubleClick={() => setReplyTo(msg)}
        className={`max-w-[70%] p-3 rounded-lg shadow ${isMe ? 'bg-green-200 rounded-br-none' : 'bg-white rounded-bl-none'}`}
      >
        {msg.replyTo && (
          <div className="bg-gray-200 px-2 py-1 rounded mb-2 border-l-4 border-blue-400">
            {msg.replyTo.message && <em className="text-xs">Reply: "{msg.replyTo.message}"</em>}
            {msg.replyTo.audio && <em className="text-xs">Reply: 🎤 Voice</em>}
          </div>
        )}

        {msg.message && (
          <div className={`${onlyEmoji ? 'text-4xl' : 'text-sm'} whitespace-pre-wrap`}>
            {msg.message}
          </div>
        )}

        {msg.audio && (
          <AudioPlayer 
            audioSrc={msg.audio} 
            duration={msg.duration} 
            isSender={isMe}
          />
        )}

        <div className="text-[10px] text-gray-500 text-right mt-1">
          {dateStr} • {timeStr}
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
                {replyTo.message && <p className="text-sm italic text-gray-700 truncate">"{replyTo.message}"</p>}
                {replyTo.audio && (
                  <p className="text-sm italic text-gray-600 flex items-center gap-1">🎤 Voice ({replyTo.duration}s)</p>
                )}
              </div>
              <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-red-600 text-sm font-bold absolute top-1 right-2">✕</button>
            </div>
          )}

          <form className="flex flex-col gap-2" onSubmit={handleSendMessage}>
            {showEmojiPicker && (
              <div className="absolute bottom-20 left-4 z-50">
                <EmojiPicker
                  onEmojiClick={(emojiData) => {
                    setMessage(prev => prev + emojiData.emoji);
                  }}
                  theme="light"
                  width={300}
                />
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(prev => !prev)}
                className="text-2xl"
                title="Emoji"
              >
                😊
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
                Send
              </button>
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
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
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
