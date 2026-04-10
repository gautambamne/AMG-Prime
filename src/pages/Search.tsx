import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, X, Play, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchPageProps {
  allContent: any[];
}

const SearchPage: React.FC<SearchPageProps> = ({ allContent }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Extract unique categories from real data
  const categories = useMemo(() => {
    const cats = new Set(allContent.map(item => item.category).filter(Boolean));
    return Array.from(cats);
  }, [allContent]);

  const dateFilters = ["Any Time", "Past 24 Hours", "Past Week", "Past Month", "Past Year"];

  const filteredResults = useMemo(() => {
    return allContent.filter(item => {
      const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = activeCategory ? item.category === activeCategory : true;
      // Date filtering simplified as we might not have standardized date strings for all
      return matchesQuery && matchesCategory;
    });
  }, [allContent, query, activeCategory]);

  return (
    <div className="pt-20 md:pt-28 pb-20 min-h-screen max-w-7xl mx-auto px-4 md:px-12">
      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-zinc-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-12 pr-10 py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all text-lg"
          placeholder="Search for news, documentaries, interviews..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-8 md:mb-12 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
        <div className="flex items-center gap-2 text-zinc-400 font-medium text-sm">
          <Filter className="w-4 h-4" /> Filters:
        </div>
        <div className="flex flex-wrap gap-3 flex-1">
          <select 
            value={activeCategory || ''} 
            onChange={(e) => setActiveCategory(e.target.value || null)}
            className="bg-black border border-zinc-800 text-white text-sm rounded-lg px-3 py-2 focus:border-brand outline-none"
          >
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        {(activeCategory || query) && (
          <button 
            onClick={() => { setActiveCategory(null); setQuery(''); }}
            className="text-xs text-brand hover:underline font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Categories (if no query and no filters) */}
      {!query && !activeCategory && !activeDate && (
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-4">Explore Categories</h2>
          <div className="flex flex-wrap gap-3">
            {categories.slice(0, 10).map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-full text-sm font-medium transition-colors">
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6">
          {query || activeCategory ? `Search Results (${filteredResults.length})` : "Trending Now"}
        </h2>
        {filteredResults.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredResults.map(item => (
              <div key={item.id} onClick={() => navigate(`/watch/${item.id}`)} className="relative aspect-video rounded-lg overflow-hidden bg-zinc-900 group cursor-pointer border border-zinc-800 hover:border-zinc-600 transition-colors">
                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Play className="w-4 h-4 text-white fill-current ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full p-3">
                  <div className="text-brand text-[9px] font-bold uppercase tracking-wider mb-1">{item.category}</div>
                  <h3 className="text-white text-sm font-bold line-clamp-2 leading-tight">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <SearchIcon className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
            <p className="text-zinc-500">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
