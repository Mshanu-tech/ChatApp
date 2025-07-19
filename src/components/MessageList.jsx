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
  const groupedMessages = {};

  // Group messages by formatted date
  messages.forEach((msg) => {
    const label = formatDateLabel(msg.timestamp);
    if (!groupedMessages[label]) {
      groupedMessages[label] = [];
    }
    groupedMessages[label].push(msg);
  });

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
            const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const onlyEmoji = msg.message && /^[\p{Emoji}\s]+$/u.test(msg.message);

            return (
              <div
                key={i}
                style={{marginBottom:"3%"}}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                onContextMenu={(e) => handleContextMenu(e, msg)}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg shadow ${isMe ? 'bg-green-200 rounded-br-none' : 'bg-white rounded-bl-none'}`}
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
