// components/FilePreviewModal.js
import { FiX, FiFile } from 'react-icons/fi';
import { formatFileSize } from '../../utils/fileUtils';

const FilePreviewModal = ({ 
  filePreview, 
  onCancel, 
  onSend 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-medium">Send File</h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
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
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={onSend}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;