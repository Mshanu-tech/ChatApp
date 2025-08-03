import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { socket } from './socket';
import axiosInstance from './utils/axiosInstance';
import Sidebar from './components/Sidebar';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import Profile from './Profile';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userID, setUserID] = useState(null);
  const [userName, setUserName] = useState(null);
  const [chatWith, setChatWith] = useState(null);
  const [chatName, setChatName] = useState(null);
  const [chatPicture, setChatPicture] = useState(null);
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
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showSidebar, setShowSidebar] = useState(window.innerWidth < 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // Check if mobile view
  console.log("replyTo", replyTo);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowSidebar(false); // Always show sidebar on larger screens
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
          setChatPicture(friend.picture)
          setMessages(savedMessages || []);
        }
      } catch (err) {
        console.error('Token decode failed:', err);
      }
    }

    socket.off('receive_message').on('receive_message', ({ from, message, audio, timestamp, duration, replyTo, _id }) => {
      const newMsg = { from, message, audio, timestamp, duration, replyTo, _id };
      setMessages(prev => [...prev, newMsg]);
      setLastMessages(prev => ({
        ...prev,
        [from]: { sender: from, receiver: userID, message, audio, timestamp, _id }
      }));
    });

    socket.off('invite_result').on('invite_result', ({ from, fromName, accepted }) => {
      if (accepted) {
        setChatWith(from);
        setChatName(fromName);
        if (isMobile) setShowSidebar(false); // Hide sidebar on mobile when chat starts
      }
    });

    socket.off('voice_message').on('voice_message', ({ from, audio, timestamp, duration, replyTo, _id }) => {
      const newMsg = { from, audio, timestamp, duration, replyTo, _id };

      setMessages(prev => [...prev, newMsg]);

      setLastMessages(prev => ({
        ...prev,
        [from]: {
          sender: from,
          receiver: userID,
          audio,
          timestamp,
          duration,
          _id
        }
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
  }, [userID, isMobile]);

  // Add this useEffect hook to your Dashboard component
  useEffect(() => {
    if (socket) {
      // Handle incoming file messages
      socket.on('receive_file_message', (fileMsg) => {
        setMessages(prev => [
          ...prev,
          {
            _id: fileMsg._id,
            from: fileMsg.sender,
            to: fileMsg.receiver,
            file: fileMsg.file,
            fileType: fileMsg.fileType,
            fileName: fileMsg.fileName,
            timestamp: fileMsg.timestamp,
            replyTo: fileMsg.replyTo
          }
        ]);

        setLastMessages(prev => ({
          ...prev,
          [fileMsg.sender]: {
            _id: fileMsg._id,
            sender: fileMsg.sender,
            receiver: fileMsg.receiver,
            file: fileMsg.file,
            fileType: fileMsg.fileType,
            fileName: fileMsg.fileName,
            timestamp: fileMsg.timestamp,
            replyTo: fileMsg.replyTo || null
          }
        }));
      });

      // Handle online users list
      socket.on('online-users', (onlineList) => {
        setOnlineUsers(onlineList);
      });

      return () => {
        socket.off('receive_file_message');
        socket.off('online-users');
      };
    }
  }, [socket, userID]);


  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !chatWith) return;

    const newMsg = {
      sender: userID,
      receiver: chatWith,
      message,
      timestamp: new Date().toISOString(),
      replyTo: replyTo ? {
        message: replyTo.message || null,
        audio: replyTo.audio || null,
        fileType: replyTo.fileType || null,
        _id: replyTo._id || null,
      } : null
    };

    socket.emit('send_message', newMsg, (res) => {
      if (res.status === 'ok') {
        const savedMsg = res.data;
        console.log("savedMsg", savedMsg);

        setMessages((prev) => [...prev, savedMsg]); // ✅ Use actual saved message from DB
        setLastMessages((prev) => ({ ...prev, [chatWith]: savedMsg }));
      } else {
        console.error('Failed to send message:', res.error);
      }
    });

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
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        clearInterval(timer);

        const endTime = Date.now();
        const actualDuration = Math.floor((endTime - startTime) / 1000);
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);

        reader.onloadend = () => {
          const base64Audio = reader.result;

          const audioMsg = {
            sender: userID,
            receiver: chatWith,
            audio: base64Audio,
            timestamp: new Date().toISOString(),
            duration: actualDuration,
            text: 'how are you',    // ✅ Text you want to send
            replyTo: replyTo?.message || replyTo?.audio
              ? {
                message: replyTo?.message || null,
                audio: replyTo?.audio || null,
                duration: replyTo?.duration || 0,
              }
              : null,
          };

          // Emit with callback to confirm status
          socket.emit('voice_message', audioMsg, (response) => {
            if (response?.status === 'ok') {
              const savedMsg = response.data;
              console.log(savedMsg);

              setMessages(prev => [...prev, { ...savedMsg, from: userID }]);
              setLastMessages(prev => ({ ...prev, [chatWith]: savedMsg }));
            } else {
              console.error('Failed to send voice message:', response?.error);
            }
          });

          setReplyTo(null);
        };

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setMediaRecorder(null);
      };

      recorder.start(100); // Collect audio in small chunks
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setIsRecording(false);
      setRecordingDuration(0);
      setMediaRecorder(null);
    }
  };


  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  const handleContextMenu = (e, message) => {
    e.preventDefault();
    setSelectedMessage(message);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleReply = (message, emoji = null) => {
    console.log(message);
    setReplyTo({
      ...message,
      emoji
    });
    setContextMenu(null);
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  <Profile />

  return (
    <div className="flex h-screen  font-sans bg-gray-100 overflow-hidden">
      {/* Overlay for mobile when sidebar is open */}
      {isMobile && showSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
  ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-full' : 'relative'}
  ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
  ${!isMobile ? 'translate-x-0' : ''}
  w-[375px] bg-white shadow-lg transition-transform duration-300 ease-in-out
  flex flex-col h-full 
`}>
        <Sidebar
          userName={userName}
          friends={friends}
          onlineUsers={onlineUsers}
          lastMessages={lastMessages}
          userID={userID}
          setChatWith={(id, name) => {
            setChatWith(id);
            setChatName(name);
            if (isMobile) setShowSidebar(false);
          }}
          setChatName={setChatName}
          setMessages={setMessages}
          isMobile={isMobile}
          navigate={navigate}
          handleLogout={handleLogout}
          onClose={() => setShowSidebar(false)}
        />
      </div>


      {/* Main content area */}
      <main className={`flex-1 flex flex-col ${isMobile && chatWith ? 'ml-0' : ''}`}>
        {/* Mobile header with menu button */}
        <ChatHeader
          chatName={chatName}
          chatWith={chatWith}
          userName={userName}
          navigate={navigate}
          userID={userID}
          handleLogout={handleLogout}
          onMenuClick={toggleSidebar}
          isMobile={isMobile}
          picture={chatPicture}
        />

        {/* Chat area (only shown when chat is selected on mobile) */}
        {(!isMobile || chatWith) && (
          <>
            <MessageList
              messages={messages}
              userID={userID}
              setReplyTo={setReplyTo}
              handleContextMenu={handleContextMenu}
              setContextMenu={setContextMenu}
              isMobile={isMobile}
            />
            <MessageInput
              replyTo={replyTo}
              userID={userID}
              chatWith={chatWith}
              setReplyTo={setReplyTo}
              showEmojiPicker={showEmojiPicker}
              setShowEmojiPicker={setShowEmojiPicker}
              message={message}
              setMessage={setMessage}
              handleSendMessage={handleSendMessage}
              isRecording={isRecording}
              recordingDuration={recordingDuration}
              startRecording={startRecording}
              stopRecording={stopRecording}
              isMobile={isMobile}
              socket={socket}
              setMessages={setMessages}
              setLastMessages={setLastMessages}
            />
          </>
        )}
      </main>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed bg-white shadow-lg rounded-md p-2 z-50"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleReply(selectedMessage)}
            className="flex items-center w-full px-3 py-1 hover:bg-gray-100 rounded"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Reply
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;