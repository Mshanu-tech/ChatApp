import { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { FiPaperclip, FiX, FiImage, FiVideo, FiFile } from 'react-icons/fi';

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
  // Handle click outside to close emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
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
      
      // Convert blob to base64
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

      // Check if socket exists before emitting
      if (!socket) {
        throw new Error('Socket connection not available');
      }

      // Emit the voice message
      socket.emit('voice_message', audioMsg);
      
      // Update local state
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

      // Start recording duration timer
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
        
        // Get duration from audio element
        const audio = new Audio(audioUrl);
        const duration = await new Promise((resolve) => {
          audio.onloadedmetadata = () => {
            resolve(Math.round(audio.duration));
          };
        });
        
        // Process and send audio
        await processAndSendAudio(audioBlob, duration);
        
        // Clean up
        URL.revokeObjectURL(audioUrl);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(100); // Collect data every 100ms
      startRecording(); // Update parent state
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
      stopRecording(); // Update parent state
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      alert('File size too large. Maximum 25MB allowed.');
      return;
    }

    const fileType = file.type;
    const fileName = file.name;
    const fileSize = file.size;
    let thumbnail = null;

    // Generate preview based on file type
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
    else if (fileType === 'application/pdf') {
      setFilePreview({
        type: 'pdf',
        fileName,
        fileSize,
        icon: <FiFile className="text-red-500 w-10 h-10" />
      });
    } 
    else {
      // Unsupported file type
      alert('Unsupported file type. Please upload images, videos, or PDFs.');
      return;
    }

    setFileToSend(file);
    setShowFilePreview(true);
  };

    const sendFileMessage = async () => {
    if (!fileToSend || !chatWith) return;

    const fileType = fileToSend.type;
    const fileName = fileToSend.name;
    const fileSize = fileToSend.size;
    let thumbnail = null;

    // Generate thumbnails
    if (fileType.startsWith('image/')) {
      thumbnail = await generateThumbnail(fileToSend);
    } else if (fileType.startsWith('video/')) {
      thumbnail = await generateVideoThumbnail(fileToSend);
    }

    const reader = new FileReader();
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => ({
        ...prev,
        [Date.now()]: Math.min(100, (prev[Date.now()] || 0) + 10)
      }));
    }, 300);

    reader.onloadend = () => {
      clearInterval(progressInterval);
      const base64File = reader.result;
      
      const fileMsg = {
        sender: userID,
        receiver: chatWith,
        timestamp: new Date().toISOString(),
        file: base64File,
        fileType,
        fileName,
        fileSize,
        thumbnail,
        replyTo: replyTo ? {
          message: replyTo?.message || null,
          audio: replyTo?.audio || null,
          duration: replyTo?.duration || 0,
        } : null,
      };

      if (socket) {
        socket.emit('file_message', fileMsg);
        setMessages(prev => [...prev, { ...fileMsg, from: userID }]);
        setLastMessages(prev => ({ ...prev, [chatWith]: fileMsg }));
      }

      // Reset file state
      setFilePreview(null);
      setFileToSend(null);
      setShowFilePreview(false);
      fileInputRef.current.value = '';
    };

    reader.readAsDataURL(fileToSend);
  };
  const cancelFileSend = () => {
    setFilePreview(null);
    setFileToSend(null);
    setShowFilePreview(false);
    fileInputRef.current.value = '';
  };

// Helper function to generate image thumbnail
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

// Helper function to generate video thumbnail
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


  return (
    <div style={{position:"relative"}} className={`bg-white border-t border-gray-200 p-3 ${isMobile ? 'fixed bottom-0 left-0 right-0' : ''}`}>
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
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
                    
                    {filePreview.type === 'pdf' && (
                      <div className="flex flex-col items-center justify-center p-6">
                        <FiFile className="text-red-500 w-16 h-16 mb-4" />
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

      <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
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
      <button
        type="button"
        onClick={() => fileInputRef.current.click()}
        className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
        aria-label="Attach file"
      >
        <FiPaperclip className="w-5 h-5" />
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,video/*,application/pdf"
        className="hidden"
        multiple={false}
      />

        {message.trim() ? (
          <button
            type="submit"
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none"
            aria-label="Send message"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`p-2 rounded-full focus:outline-none ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'text-blue-500 hover:bg-blue-100'
            }`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? (
              <div className="flex items-center">
                <span className="text-xs mr-1">{localRecordingDuration}s</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
        )}
      </form>
    </div>
  );
};

export default MessageInput;