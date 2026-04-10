import React from 'react';
import { Bookmark, Play, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BookmarksPage = ({ videoIds, allVideos, onRemove }: { videoIds: string[], allVideos: any[], onRemove: (id: string) => void }) => {
  const navigate = useNavigate();
  
  const bookmarks = allVideos.filter(v => videoIds.includes(v.id));

  return (
    <div className="pt-20 md:pt-28 pb-20 min-h-screen max-w-7xl mx-auto px-4 md:px-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <Bookmark className="w-6 h-6 md:w-8 md:h-8 text-brand" /> My List
        </h1>
        <span className="text-sm text-zinc-400 font-medium">{bookmarks.length} items</span>
      </div>

      {bookmarks.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {bookmarks.map(item => (
            <div key={item.id} className="relative aspect-video rounded-lg overflow-hidden bg-zinc-900 group border border-zinc-800 hover:border-zinc-600 transition-colors">
              <img 
                src={item.thumbnail} 
                alt={item.title} 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer" 
                onClick={() => navigate(`/watch/${item.id}`)} 
                referrerPolicy="no-referrer" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
              
              <div className="absolute top-2 right-2 flex gap-2">
                <button 
                  onClick={() => onRemove(item.id)}
                  className="w-8 h-8 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm text-white hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Play className="w-4 h-4 text-white fill-current ml-1" />
                </div>
              </div>
              
              <div className="absolute bottom-0 left-0 w-full p-3 pointer-events-none">
                <span className="text-[9px] font-bold text-brand uppercase tracking-wider mb-1 block">{item.category}</span>
                <h3 className="text-white text-sm font-bold line-clamp-2 leading-tight">{item.title}</h3>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-8 h-8 text-zinc-600" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Your List is Empty</h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto">Add shows and movies to your list to easily find them later.</p>
        </div>
      )}
    </div>
  );
};

export default BookmarksPage;
