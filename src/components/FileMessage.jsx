import { FiFile, FiDownload, FiExternalLink, FiX } from 'react-icons/fi';

const FileMessage = ({ msg, isExpanded, mediaKey, handleMediaClick, setExpandedMedia }) => {
  const fileURL = msg.file.startsWith('http') ? msg.file : `http://localhost:5000${msg.file}`;
  const maxWidthClass = 'max-w-[400px]'; // Consistent max width for all media types

  const renderCloseButton = () => (
    <button
      className="absolute top-4 right-4 text-white p-2 rounded-full bg-gray-800 hover:bg-gray-700 z-50"
      onClick={(e) => {
        e.stopPropagation();
        setExpandedMedia(null);
      }}
    >
      <FiX className="w-5 h-5" />
    </button>
  );

  if (msg.fileType?.startsWith("image/")) {
    return (
      <div
        className={`cursor-pointer ${isExpanded ? 'fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center' : ''}`}
        onClick={() => handleMediaClick(mediaKey.split('-')[1], mediaKey.split('-')[0])}
      >
        <img
          src={fileURL}
          alt={msg.fileName}
          className={`rounded-md ${isExpanded ? 'max-h-[90vh] max-w-[90vw] object-contain' : `${maxWidthClass} max-h-64 object-cover w-full`}`}
        />
        {isExpanded && renderCloseButton()}
      </div>
    );
  }

  if (msg.fileType?.startsWith("video/")) {
    return (
      <div className={`relative ${maxWidthClass}`}>
        <video controls className="w-full rounded-md">
          <source src={fileURL} type={msg.fileType} />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  if (msg.fileType?.startsWith("audio/")) {
    return (
      <div className={`bg-gray-100 rounded-lg p-4 ${maxWidthClass}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-blue-100 p-3 rounded-full">
            <FiFile className="text-blue-500 w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{msg.fileName}</p>
            <p className="text-xs text-gray-500">Audio File</p>
          </div>
        </div>
        <audio controls className="w-full">
          <source src={fileURL} type={msg.fileType} />
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  if (msg.fileType === "application/pdf") {
    if (isExpanded) {
      return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className={`relative bg-white rounded-lg overflow-hidden ${maxWidthClass} h-[80vh]`}>
            <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(fileURL)}&embedded=true`}
              className="w-full h-full border-none"
              title={msg.fileName}
            />
            {renderCloseButton()}
          </div>
        </div>
      );
    }

    return (
      <div className={`bg-gray-100 rounded-lg overflow-hidden shadow-sm ${maxWidthClass}`}>
        <div 
          className="p-4 cursor-pointer hover:bg-gray-200 transition-colors"
          onClick={() => handleMediaClick(mediaKey.split('-')[1], mediaKey.split('-')[0])}
        >
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-3 rounded-full">
              <FiFile className="text-red-500 w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{msg.fileName}</p>
              <p className="text-xs text-gray-500">PDF Document</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-3 bg-white flex justify-between">
          <button
            onClick={() => handleMediaClick(mediaKey.split('-')[1], mediaKey.split('-')[0])}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Preview
          </button>
          <a
            href={fileURL}
            download={msg.fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-700 hover:text-gray-900 flex items-center gap-1"
          >
            <FiDownload className="w-4 h-4" />
            <span>Download</span>
          </a>
        </div>
      </div>
    );
  }

  // Generic file
  return (
    <div className={`bg-gray-100 rounded-lg p-4 ${maxWidthClass}`}>
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-3 rounded-full">
          <FiFile className="text-blue-500 w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{msg.fileName}</p>
          <p className="text-xs text-gray-500">{msg.fileType || 'File'}</p>
        </div>
      </div>
      <a
        href={fileURL}
        download={msg.fileName}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 text-sm hover:underline flex items-center gap-1 mt-3"
      >
        <FiDownload className="w-4 h-4" />
        <span>Download</span>
      </a>
    </div>
  );
};

export default FileMessage;