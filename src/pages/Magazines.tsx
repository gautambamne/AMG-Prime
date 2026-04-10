import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { BookOpen, ChevronRight, Download, Eye, X, Loader2 } from 'lucide-react';

const MagazinesPage = () => {
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const [magazines, setMagazines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "magazines"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Group by type if needed, or just present as a list
      // For now, let's group by "type" (Main, Global)
      const grouped = [
        {
          title: "Medgate Today",
          type: "Main",
          description: "The most comprehensive healthcare magazine covering the latest in medical science, hospital management, and healthcare policies.",
          issues: docs.filter((d: any) => d.type === 'Main')
        },
        {
          title: "Medgate Today Global",
          type: "Global",
          description: "International perspectives on healthcare innovations, global health updates, and cross-border medical collaborations.",
          issues: docs.filter((d: any) => d.type === 'Global')
        }
      ];
      setMagazines(grouped);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="pt-32 flex flex-col items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
        <p className="text-zinc-500 font-medium">Loading Library...</p>
      </div>
    );
  }

  return (
    <div className="pt-20 md:pt-28 pb-20 min-h-screen max-w-7xl mx-auto px-4 md:px-12">
      <div className="flex items-center justify-between mb-8 md:mb-12">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-white flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-brand" /> Digital Magazine Library
          </h1>
          <p className="text-zinc-400 text-sm md:text-base max-w-2xl">Access our exclusive collection of healthcare publications. Read online via our interactive flipbook viewer or download for offline reading.</p>
        </div>
      </div>

      <div className="space-y-12 md:space-y-16">
        {magazines.map((mag, idx) => mag.issues.length > 0 && (
          <div key={idx} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 md:p-8">
            <div className="mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{mag.title}</h2>
              <p className="text-zinc-400 text-sm">{mag.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {mag.issues.map((issue: any) => (
                <div key={issue.id} className="flex flex-col sm:flex-row gap-6 bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 transition-colors group">
                  <div className="w-full sm:w-40 aspect-[3/4] rounded-lg overflow-hidden relative shrink-0 shadow-xl">
                    <img src={issue.thumbnail} alt={issue.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                    {issue.isNew && (
                      <div className="absolute top-2 right-2 bg-brand text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg">NEW</div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">{issue.title}</h3>
                    <p className="text-xs text-zinc-400 mb-6">{issue.issueDate || 'Current Issue'}</p>
                    <div className="flex flex-col gap-3 mt-auto">
                      <button onClick={() => setSelectedIssue(issue)} className="w-full bg-brand text-black font-bold py-2.5 rounded hover:bg-brand/90 transition-colors flex items-center justify-center gap-2 text-sm">
                        <Eye className="w-4 h-4" /> Read Now
                      </button>
                      <a href={issue.pdfUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-zinc-800 text-white font-bold py-2.5 rounded hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 text-sm">
                        <Download className="w-4 h-4" /> Download PDF
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {!loading && magazines.every(m => m.issues.length === 0) && (
          <div className="py-20 text-center bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
            <BookOpen className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg">No Magazines Available</h3>
            <p className="text-zinc-500 text-sm">Please check back later for new releases.</p>
          </div>
        )}
      </div>

      {/* Mock PDF Viewer Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col pt-safe">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
            <h3 className="text-white font-bold">{selectedIssue.title}</h3>
            <div className="flex items-center gap-4">
              <a href={selectedIssue.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold">
                <Download className="w-4 h-4" /> Download
              </a>
              <button onClick={() => setSelectedIssue(null)} className="text-zinc-400 hover:text-white transition-colors p-2 bg-zinc-900 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden bg-[#0A0A0A]">
            <div className="relative w-full max-w-4xl h-full bg-zinc-900 border border-zinc-800 shadow-2xl flex items-center justify-center overflow-hidden rounded-xl">
               <iframe 
                src={selectedIssue.pdfUrl.includes('drive.google.com') ? selectedIssue.pdfUrl.replace('/view', '/preview') : selectedIssue.pdfUrl} 
                className="w-full h-full border-none"
                title="Magazine Viewer"
              />
              {!selectedIssue.pdfUrl && (
                <div className="relative z-10 text-center">
                  <BookOpen className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-white mb-2">Magazine Viewer Not Available</h4>
                  <p className="text-zinc-400 text-sm max-w-md mx-auto">This issue does not have a valid PDF or Flipbook link associated with it.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MagazinesPage;
