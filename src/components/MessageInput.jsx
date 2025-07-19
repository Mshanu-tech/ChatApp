import EmojiPicker from 'emoji-picker-react';

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
  stopRecording
}) => {
  return (
    <div className="p-4 border-t bg-white">
{replyTo && (
  <div className="flex items-start gap-2 bg-gray-100 border-l-4 border-blue-500 rounded p-2 mb-2 relative">
    <div className="flex-1">
      <p className="text-xs text-blue-700 font-semibold">Replying to</p>
      <div className="flex items-center">
        {replyTo.emoji && (
          <span className="text-xl mr-1">{replyTo.emoji}</span>
        )}
        {replyTo.message && (
          <p className="text-sm italic text-gray-700 truncate">
            "{replyTo.message}"
          </p>
        )}
        {replyTo.audio && (
          <p className="text-sm italic text-gray-600 flex items-center gap-1">
            🎤 Voice ({replyTo.duration}s)
          </p>
        )}
      </div>
    </div>
    <button 
      onClick={() => setReplyTo(null)} 
      className="text-gray-400 hover:text-red-600 text-sm font-bold absolute top-1 right-2"
    >
      ✕
    </button>
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
  );
};

export default MessageInput;