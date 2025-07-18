import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

const AudioPlayer = ({ src, duration, isSender, isHovered, onHover }) => {
  const audioRef = useRef();
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / duration) * 100);
    };

    const handleEnded = () => setPlaying(false);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [duration]);

  const togglePlay = () => {
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const toggleMute = () => {
    audioRef.current.muted = !muted;
    setMuted(!muted);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      className={`relative group flex items-center gap-2 p-2 rounded-xl ${
        isSender ? 'bg-green-100' : 'bg-white'
      }`}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <button
        onClick={togglePlay}
        className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition"
      >
        {playing ? (
          <Pause size={16} className="min-w-4" />
        ) : (
          <Play size={16} className="min-w-4" />
        )}
      </button>

      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${isSender ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <span className="text-xs text-gray-600 whitespace-nowrap">
          {formatTime(playing ? currentTime : duration)}
        </span>
      </div>

      <button
        onClick={toggleMute}
        className="p-1 text-gray-500 hover:text-gray-700 transition"
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      {(isHovered || isSender) && (
        <span
          className={`absolute -top-2 -right-2 text-xs px-2 py-1 rounded-full ${
            isSender ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'
          }`}
        >
          {duration}s
        </span>
      )}
    </div>
  );
};

export default AudioPlayer;