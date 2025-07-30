import { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import {
  FiPaperclip,
  FiX,
  FiImage,
  FiVideo,
  FiFile,
  FiMic,
  FiSend
} from 'react-icons/fi';
import {
  generateThumbnail,
  generateVideoThumbnail
} from '../utils/fileUtils';
import FilePreviewModal from './fileUpload/FilePreviewModal';
import { handleFileUpload } from '../utils/fileUploadService';

// ==============================================
// COMPONENT PROPS
// ==============================================
const MessageInput = ({
  replyTo,
  setReplyTo,
  showEmojiPicker,
  setShowEmojiPicker,
  message,
  setMessage,
  handleSendMessage,
  isRecording,
  startRecording,
  stopRecording,
  isMobile,
  userID,
  chatWith,
  setMessages,
  setLastMessages,
  socket
}) => {
  // ==============================================
  // STATE & REFS
  // ==============================================
  const [inputRows, setInputRows] = useState(1);
  const [localRecordingDuration, setLocalRecordingDuration] = useState(0);
  const [filePreview, setFilePreview] = useState(null);
  const [fileToSend, setFileToSend] = useState(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [uploading, setUploading] = useState(false);

  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);

  // ==============================================
  // EFFECTS
  // ==============================================
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

  // Socket connection monitoring
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

  // ==============================================
  // INPUT HANDLERS
  // ==============================================
  const handleInputChange = (e) => {
    setMessage(e.target.value);
    const rows = Math.min(Math.max(e.target.value.split('\n').length, 4));
    setInputRows(rows);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // ==============================================
  // EMOJI HANDLERS
  // ==============================================
  const onEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    inputRef.current.focus();
  };

  // ==============================================
  // AUDIO RECORDING HANDLERS
  // ==============================================
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

  // ==============================================
  // FILE HANDLERS
  // ==============================================
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

  // Then update the sendFileMessage function:
  const sendFileMessage = async () => {
    if (!fileToSend || !chatWith) return;

    try {
      setUploading(true);

      // Use the file upload service
      const { url, resourceType, fileName, createdAt } = await handleFileUpload(fileToSend);

      // Send metadata to backend
      const payload = {
        sender: userID,
        receiver: chatWith,
        file: url,
        fileType: fileToSend.type,
        fileName,
        resourceType,
        timestamp: createdAt,
        replyTo: replyTo ? {
          message: replyTo.message || null,
          audio: replyTo.audio || null,
          fileType: replyTo.fileType || null,
          _id: replyTo._id || null,
        } : null
      };

      if (socket) {
        socket.emit('file_message', payload, (response) => {
          if (response?.status === 'ok') {
            const savedFileMsg = response.data;

            setMessages(prev => [...prev, { from: userID, ...savedFileMsg }]);
            setLastMessages(prev => ({
              ...prev,
              [chatWith]: {
                sender: userID,
                receiver: chatWith,
                ...savedFileMsg
              }
            }));
          } else {
            console.error('Failed to send file message:', response?.error);
            alert('File message failed to send');
          }
        });
      }

    } catch (error) {
      console.error('Upload error:', error.response?.data || error.message);
      alert(error.response?.data?.error || 'Upload failed');
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

  // ==============================================
  // RENDER
  // ==============================================
  return (
    <div className={`bg-white border-t border-gray-200 p-3 ${isMobile ? 'fixed bottom-0 left-0 right-0' : ''}`}>
      {/* Reply Preview */}
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

      {/* File Preview Modal */}
      {showFilePreview && filePreview && (
        <FilePreviewModal
          filePreview={filePreview}
          onCancel={cancelFileSend}
          onSend={sendFileMessage}
        />
      )}

      {/* Main Input Form */}
      <form onSubmit={handleSendMessage} className="flex items-end space-x-2 relative">
        {/* Emoji Picker Button */}
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

        {/* Emoji Picker */}
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

        {/* Message Input */}
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

        {/* Attachment Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
            className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none attachment-button"
            aria-label="Attach file"
          >
            <FiPaperclip className="w-5 h-5" />
          </button>

          {/* Attachment Options */}
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

        {/* Send/Record Button */}
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

      {/* Uploading Indicator */}
      {uploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-md flex flex-col items-center space-y-2">
            <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <p className="text-sm text-gray-700">Uploading file, please wait...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageInput;