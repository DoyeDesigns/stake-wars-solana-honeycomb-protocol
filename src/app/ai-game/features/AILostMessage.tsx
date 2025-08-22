import React from 'react';
import { Button } from '@/components/ui/button';

interface AILostMessageProps {
  onBackToLobby: () => void;
}

const AILostMessage: React.FC<AILostMessageProps> = ({ onBackToLobby }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#3F3F3F] rounded-[20px] p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl">💀</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Defeat!</h2>
          <p className="text-gray-300 mb-4">
            The AI opponent was too strong this time. Better luck next time!
          </p>
          <div className="bg-red-600 text-white py-2 px-4 rounded-lg mb-6">
            <span className="font-bold">No XP earned</span>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Button
            onClick={onBackToLobby}
            variant="outline"
            className="border-[#6B6969] text-white hover:bg-[#6B6969] font-bold py-3 px-6 rounded-lg"
          >
            Back to Lobby
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AILostMessage;

