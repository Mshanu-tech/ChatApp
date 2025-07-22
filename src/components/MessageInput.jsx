import { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { FiPaperclip, FiX, FiImage, FiVideo, FiFile, FiMic, FiSend } from 'react-icons/fi';
import axiosInstance from '../utils/axiosInstance';

const MessageInput = ({
  replyTo,
  setReplyTo,
  showEmojiPicker,
  setShowEmojiPicker,
  message,
  setMessage,
  handleSendMessage,
  isRecording,
  recordingDuration,
  startRecording,
  stopRecording,
  isMobile,
  userID,
  chatWith,
  setMessages,
  setLastMessages,
  socket
}) => {
  const [inputRows, setInputRows] = useState(1);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const [localRecordingDuration, setLocalRecordingDuration] = useState(0);
  const [filePreview, setFilePreview] = useState(null);
  const [fileToSend, setFileToSend] = useState(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Handle click outside to close emoji picker and attachment options
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target) &&
        inputRef.current && !inputRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }

      if (!event.target.closest('.attachment-container') &&
        !event.target.closest('.attachment-button')) {
        setShowAttachmentOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
  if (socket) {
    console.log("✅ Socket connected:", socket.connected);

    socket.on("connect", () => {
      console.log("🟢 Socket reconnected");
    });

    socket.on("disconnect", () => {
      console.warn("🔴 Socket disconnected");
    });
  }
}, [socket]);


  const handleInputChange = (e) => {
    setMessage(e.target.value);
    const rows = Math.min(Math.max(e.target.value.split('\n').length, 4));
    setInputRows(rows);
  };

  const onEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    inputRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

const processAndSendAudio = async (audioBlob, duration) => {
  try {
    const reader = new FileReader();

    const base64Audio = await new Promise((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });

    const audioMsg = {
      sender: userID,
      receiver: chatWith,
      audio: base64Audio,
      timestamp: new Date().toISOString(),
      duration: duration,
      replyTo: replyTo ? {
        message: replyTo?.message || null,
        audio: replyTo?.audio || null,
        duration: replyTo?.duration || 0,
      } : null,
    };

    if (!socket || !socket.connected) {
      console.warn('⚠️ Socket is not connected. Message not sent.');
      return false;
    }

    socket.emit('voice_message', audioMsg);
    setMessages(prev => [...prev, { ...audioMsg, from: userID }]);
    setLastMessages(prev => ({ ...prev, [chatWith]: audioMsg }));

    return true;
  } catch (error) {
    console.error('Error processing audio:', error);
    return false;
  }
};


  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      setLocalRecordingDuration(0);

      recordingIntervalRef.current = setInterval(() => {
        setLocalRecordingDuration(prev => prev + 1);
      }, 1000);

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        clearInterval(recordingIntervalRef.current);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        const audio = new Audio(audioUrl);
        const duration = await new Promise((resolve) => {
          audio.onloadedmetadata = () => {
            resolve(Math.round(audio.duration));
          };
        });

        await processAndSendAudio(audioBlob, duration);
        URL.revokeObjectURL(audioUrl);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(100);
      startRecording();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Microphone access was denied. Please allow microphone permissions.');
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      stopRecording();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  const handleFileInput = (type) => {
    setShowAttachmentOptions(false);
    const input = document.createElement('input');
    input.type = 'file';

    if (type === 'image') {
      input.accept = 'image/*';
    } else if (type === 'video') {
      input.accept = 'video/*';
    } else if (type === 'document') {
      input.accept = '.pdf,.doc,.docx,.txt';
    }

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 25 * 1024 * 1024) {
        alert('File size too large. Maximum 25MB allowed.');
        return;
      }

      const fileType = file.type;
      const fileName = file.name;
      const fileSize = file.size;
      let thumbnail = null;

      if (fileType.startsWith('image/')) {
        thumbnail = await generateThumbnail(file);
        setFilePreview({
          type: 'image',
          url: URL.createObjectURL(file),
          thumbnail,
          fileName,
          fileSize
        });
      }
      else if (fileType.startsWith('video/')) {
        thumbnail = await generateVideoThumbnail(file);
        setFilePreview({
          type: 'video',
          url: URL.createObjectURL(file),
          thumbnail,
          fileName,
          fileSize
        });
      }
      else {
        setFilePreview({
          type: 'document',
          fileName,
          fileSize,
          icon: <FiFile className="text-blue-500 w-10 h-10" />
        });
      }

      setFileToSend(file);
      setShowFilePreview(true);
    };

    input.click();
  };

const sendFileMessage = async () => {
  
  if (!fileToSend || !chatWith) return;

  try {
    const formData = new FormData();
    formData.append('file', fileToSend);
    formData.append('sender', userID);
    formData.append('receiver', chatWith);
    formData.append('timestamp', new Date().toISOString());

    if (replyTo) {
      formData.append('replyTo', JSON.stringify({
        message: replyTo?.message || null,
        audio: replyTo?.audio || null,
        duration: replyTo?.duration || 0,
      }));
    }

    setUploading(true);

    const response = await axiosInstance.post('/api/auth/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.status !== 200) throw new Error('Upload failed');

    const fileMsg = response.data;

    if (socket) {
      // Emit the file message through Socket.IO      
      socket.emit('file_message', {
        sender: userID,
        receiver: chatWith,
        file: fileMsg.file,
        fileType: fileMsg.fileType,
        fileName: fileMsg.fileName,
        timestamp: fileMsg.timestamp,
        replyTo: fileMsg.replyTo
      });
      
      // Update local state
      setMessages(prev => [...prev, { 
        from: userID,
        file: fileMsg.file,
        fileType: fileMsg.fileType,
        fileName: fileMsg.fileName,
        timestamp: fileMsg.timestamp,
        replyTo: fileMsg.replyTo
      }]);
      
      setLastMessages(prev => ({ 
        ...prev, 
        [chatWith]: { 
          sender: userID, 
          receiver: chatWith,
          file: fileMsg.file,
          fileType: fileMsg.fileType,
          fileName: fileMsg.fileName,
          timestamp: fileMsg.timestamp
        } 
      }));
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    alert('File upload failed. Please try again.');
  } finally {
    setUploading(false);
    setFilePreview(null);
    setFileToSend(null);
    setShowFilePreview(false);
  }
};
  const cancelFileSend = () => {
    setFilePreview(null);
    setFileToSend(null);
    setShowFilePreview(false);
  };

  const generateThumbnail = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const maxSize = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const generateVideoThumbnail = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.src = URL.createObjectURL(file);
      video.addEventListener('loadedmetadata', () => {
        video.currentTime = Math.min(1, video.duration);
      });

      video.addEventListener('seeked', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
        URL.revokeObjectURL(video.src);
      });
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]);
  };

  return (
    <div className={`bg-white border-t border-gray-200 p-3 ${isMobile ? 'fixed bottom-0 left-0 right-0' : ''}`}>
      {replyTo && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-2 mb-2 rounded-r flex justify-between items-start">
          <div className="text-sm text-gray-700 truncate max-w-[80%]">
            <p className="font-medium">Replying to {replyTo.from === userID ? 'yourself' : ''}</p>
            <p className="truncate">{replyTo.message || (replyTo.audio ? 'Audio message' : '')}</p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Cancel reply"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {showFilePreview && filePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium">Send File</h3>
              <button onClick={cancelFileSend} className="text-gray-500 hover:text-gray-700">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {filePreview.type === 'image' && (
                <img
                  src={filePreview.url}
                  alt="Preview"
                  className="max-w-full max-h-64 mx-auto rounded-md"
                />
              )}

              {filePreview.type === 'video' && (
                <video
                  controls
                  className="max-w-full max-h-64 mx-auto rounded-md"
                  src={filePreview.url}
                />
              )}

              {(filePreview.type === 'document' || filePreview.type === 'pdf') && (
                <div className="flex flex-col items-center justify-center p-6">
                  <FiFile className="text-blue-500 w-16 h-16 mb-4" />
                  <p className="text-lg font-medium text-center">{filePreview.fileName}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatFileSize(filePreview.fileSize)}
                  </p>
                </div>
              )}

              <div className="mt-4 flex justify-between">
                <button
                  onClick={cancelFileSend}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={sendFileMessage}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-end space-x-2 relative">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="Toggle emoji picker"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className={`absolute ${isMobile ? 'bottom-16 left-2 right-2' : 'bottom-16 left-2'}`}
          >
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              width={isMobile ? '100%' : 350}
              height={350}
              searchDisabled={isMobile}
            />
          </div>
        )}

        <div className="flex-1 bg-gray-100 rounded-full flex items-center">
          <input
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={inputRows}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 px-4 max-h-32"
            style={{ minHeight: '44px' }}
          />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
            className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none attachment-button"
            aria-label="Attach file"
          >
            <FiPaperclip className="w-5 h-5" />
          </button>

          {showAttachmentOptions && (
            <div className="absolute bottom-12 right-0 bg-white shadow-lg rounded-lg p-2 w-48 z-10 attachment-container">
              <button
                type="button"
                onClick={() => handleFileInput('image')}
                className="flex items-center w-full px-3 py-2 text-left hover:bg-gray-100 rounded"
              >
                <FiImage className="mr-2 text-blue-500" />
                <span>Photo</span>
              </button>
              <button
                type="button"
                onClick={() => handleFileInput('video')}
                className="flex items-center w-full px-3 py-2 text-left hover:bg-gray-100 rounded"
              >
                <FiVideo className="mr-2 text-red-500" />
                <span>Video</span>
              </button>
              <button
                type="button"
                onClick={() => handleFileInput('document')}
                className="flex items-center w-full px-3 py-2 text-left hover:bg-gray-100 rounded"
              >
                <FiFile className="mr-2 text-green-500" />
                <span>Document</span>
              </button>
            </div>
          )}
        </div>

        {message.trim() ? (
          <button
            type="submit"
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none"
            aria-label="Send message"
          >
            <FiSend className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`p-2 rounded-full focus:outline-none ${isRecording
                ? 'bg-red-500 text-white animate-pulse'
                : 'text-blue-500 hover:bg-blue-100'
              }`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? (
              <div className="flex items-center">
                <span className="text-xs mr-1">{localRecordingDuration}s</span>
                <FiMic className="w-5 h-5" />
              </div>
            ) : (
              <FiMic className="w-5 h-5" />
            )}
          </button>
        )}
      </form>
    </div>
  );
};

export default MessageInput;