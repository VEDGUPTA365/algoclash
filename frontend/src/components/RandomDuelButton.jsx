import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import socket from '../socket.js';
import { Dices, Loader2 } from 'lucide-react';

export default function RandomDuelButton() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isQueueing, setIsQueueing] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    socket.connect();
    
    socket.on('random_match_found', ({ roomCode }) => {
      setIsQueueing(false);
      navigate(`/duel/${roomCode}`);
    });

    socket.on('random_match_failed', ({ message }) => {
      setIsQueueing(false);
      alert(message || 'Matchmaking failed');
    });

    return () => {
      socket.off('random_match_found');
      socket.off('random_match_failed');
    };
  }, [user, navigate]);

  const toggleQueue = () => {
    if (isQueueing) {
      socket.emit('leave_random_queue', { userId: user.id });
      setIsQueueing(false);
    } else {
      socket.emit('join_random_queue', { userId: user.id, username: user.username });
      setIsQueueing(true);
    }
  };

  if (!user) return null;

  return (
    <button
      onClick={toggleQueue}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg"
      style={{
        backgroundColor: isQueueing ? '#1e1b4b' : '#6366f1',
        color: isQueueing ? '#818cf8' : 'white',
        border: isQueueing ? '1px solid #3730a3' : 'none',
      }}
    >
      {isQueueing ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          Finding Opponent...
        </>
      ) : (
        <>
          <Dices size={18} />
          Random Duel
        </>
      )}
    </button>
  );
}
