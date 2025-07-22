import { FiFile } from 'react-icons/fi';

const FileMessage = ({ msg, isExpanded, mediaKey, handleMediaClick, setExpandedMedia }) => {
  const fileURL = msg.file.startsWith('http') ? msg.file : `http://localhost:5000${msg.file}`;

  if (msg.fileType?.startsWith("image/")) {
    return (
      <div
        className={`cursor-pointer ${isExpanded ? 'fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center' : ''}`}
        onClick={() => handleMediaClick(mediaKey.split('-')[1], mediaKey.split('-')[0])}
      >
        <img
          src={fileURL}
          alt={msg.fileName}
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
    );
  }

  if (msg.fileType?.startsWith("video/")) {
    return (
      <div className="relative">
        <video controls className="max-w-xs rounded-md">
          <source src={fileURL} type={msg.fileType} />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  if (
    msg.fileType === "application/pdf" ||
    msg.fileType === "application/msword" ||
    msg.fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return (
      <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
        <div className="flex items-center mb-2">
          <svg className="w-10 h-10 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-900 truncate">{msg.fileName}</p>
            <p className="text-xs text-gray-500">
              {msg.fileType === "application/pdf" ? "PDF Document" : "Word Document"}
            </p>
          </div>
        </div>
        <a
          href={fileURL}
          download={msg.fileName}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 text-sm hover:underline flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download
        </a>
      </div>
    );
  }

  // Generic file
  return (
    <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
      <div className="flex items-center">
        <FiFile className="text-blue-500 w-10 h-10 mr-2" />
        <div>
          <p className="text-sm font-medium text-gray-900 truncate">{msg.fileName}</p>
          <p className="text-xs text-gray-500">{msg.fileType || 'File'}</p>
        </div>
      </div>
      <a
        href={fileURL}
        download={msg.fileName}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 text-sm hover:underline flex items-center mt-2"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Download
      </a>
    </div>
  );
};

export default FileMessage;
