import { useState } from 'react';
import AudioPlayer from './AudioPlayer';

const formatDateLabel = (timestamp) => {
  const msgDate = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday =
    msgDate.getDate() === today.getDate() &&
    msgDate.getMonth() === today.getMonth() &&
    msgDate.getFullYear() === today.getFullYear();

  const isYesterday =
    msgDate.getDate() === yesterday.getDate() &&
    msgDate.getMonth() === yesterday.getMonth() &&
    msgDate.getFullYear() === yesterday.getFullYear();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  return msgDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const MessageList = ({ messages, userID, setReplyTo, handleContextMenu, setContextMenu }) => {
  const [expandedMedia, setExpandedMedia] = useState(null);
  const groupedMessages = {};

  // Group messages by formatted date
  messages.forEach((msg) => {
    const label = formatDateLabel(msg.timestamp);
    if (!groupedMessages[label]) {
      groupedMessages[label] = [];
    }
    groupedMessages[label].push(msg);
  });

  const handleMediaClick = (msgIndex, dateLabel) => {
    setExpandedMedia(`${dateLabel}-${msgIndex}`);
  };

  return (
    <div
      id="chat-messages"
      className="flex-1 p-4 overflow-auto bg-gray-100 space-y-3"
      onClick={() => setContextMenu(null)}
    >
      {Object.entries(groupedMessages).map(([dateLabel, group]) => (
        <div key={dateLabel}>
          <div className="text-center my-2 text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded-full w-fit mx-auto">
            {dateLabel}
          </div>
          {group.map((msg, i) => {
            const isMe = msg.sender === userID || msg.from === userID;
            const time = new Date(msg.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            const onlyEmoji = msg.message && /^[\p{Emoji}\s]+$/u.test(msg.message);
            const mediaKey = `${dateLabel}-${i}`;
            const isExpanded = expandedMedia === mediaKey;

            return (
              <div
                key={i}
                style={{ marginBottom: "3%" }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                onContextMenu={(e) => handleContextMenu(e, msg)}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-lg shadow ${isMe ? 'bg-green-200 rounded-br-none' : 'bg-white rounded-bl-none'}`}
                >
                  {msg.replyTo && (
                    <div className="bg-gray-200 px-2 py-1 rounded mb-2 border-l-4 border-blue-400">
                      <div className="flex items-center">
                        {msg.replyTo.emoji && (
                          <span className="text-xl mr-1">{msg.replyTo.emoji}</span>
                        )}
                        {msg.replyTo.message && (
                          <em className="text-xs">Reply: "{msg.replyTo.message}"</em>
                        )}
                        {msg.replyTo.audio && (
                          <em className="text-xs">Reply: 🎤 Voice</em>
                        )}
                      </div>
                    </div>
                  )}

                  {msg.message && (
                    <div className={`${onlyEmoji ? 'text-4xl' : 'text-sm'} whitespace-pre-wrap`}>
                      {msg.message}
                    </div>
                  )}

                  {msg.audio && (
                    <AudioPlayer audioSrc={msg.audio} duration={msg.duration} isSender={isMe} />
                  )}

                  {/* Enhanced Media Display */}
                  {msg.file && (
                    <div className="mt-2">
                      {msg.fileType?.startsWith("image/") && (
                        <div 
                          className={`cursor-pointer ${isExpanded ? 'fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center' : ''}`}
                          onClick={() => handleMediaClick(i, dateLabel)}
                        >
                          <img 
                            src={msg.file} 
                            alt="Sent image" 
                            className={`rounded-md ${isExpanded ? 'max-h-[90vh] max-w-[90vw] object-contain' : 'max-w-xs max-h-64'}`}
                          />
                          {isExpanded && (
                            <button
                              className="absolute top-4 right-4 text-white p-2 rounded-full bg-gray-800 hover:bg-gray-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedMedia(null);
                              }}
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      )}

                      {msg.fileType?.startsWith("video/") && (
                        <div className="relative">
                          <video 
                            controls 
                            className="max-w-xs rounded-md"
                            poster={msg.thumbnail || ''}
                          >
                            <source src={msg.file} type={msg.fileType} />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )}

                      {msg.fileType === "application/pdf" && (
                        <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                          <div className="flex items-center mb-2">
                            <svg className="w-10 h-10 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-gray-900 truncate">{msg.fileName}</p>
                              <p className="text-xs text-gray-500">PDF Document</p>
                            </div>
                          </div>
                          <a
                            href={msg.file}
                            download={msg.fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-sm hover:underline flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-[10px] text-gray-500 text-right mt-1">{time}</div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default MessageList;