import React from 'react';
import { Download, Play, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DownloadsPage = ({ videoIds, allVideos, onRemove }: { videoIds: string[], allVideos: any[], onRemove: (id: string) => void }) => {
  const navigate = useNavigate();
  
  const downloads = allVideos.filter(v => videoIds.includes(v.id));

  return (
    <div className="pt-20 md:pt-28 pb-20 min-h-screen max-w-4xl mx-auto px-4 md:px-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <Download className="w-6 h-6 md:w-8 md:h-8 text-brand" /> My Downloads
        </h1>
        <span className="text-sm text-zinc-400 font-medium">{downloads.length} items available offline</span>
      </div>

      {downloads.length > 0 ? (
        <div className="space-y-4">
          {downloads.map(item => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex gap-4 items-center group">
              <div className="relative w-32 md:w-48 aspect-video rounded-lg overflow-hidden shrink-0 cursor-pointer" onClick={() => navigate(`/watch/${item.id}`)}>
                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Play className="w-3 h-3 text-white fill-current ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm md:text-base line-clamp-2 mb-1 cursor-pointer hover:text-brand transition-colors" onClick={() => navigate(`/watch/${item.id}`)}>{item.title}</h3>
                <p className="text-xs text-zinc-500 font-medium">{item.category} • Offline Access</p>
              </div>
              <button onClick={() => onRemove(item.id)} className="p-3 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors shrink-0">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8 text-zinc-600" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Downloads Yet</h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto">Movies and shows you download will appear here so you can watch them offline.</p>
        </div>
      )}
    </div>
  );
};

export default DownloadsPage;
