import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { MessageSquare, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { ExpandableText } from '../components/ExpandableText';

type Announcement = {
  id: string;
  title?: string;
  content?: string;
  date?: any;
  priority?: string;
  imageUrl?: string;
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAnnouncements, setTotalAnnouncements] = useState(0);
  const announcementsPerPage = 10;

  useEffect(() => {
    console.log('AnnouncementsPage: Component mounted');
    setInitialized(true);
    setLoading(true);
    setError(null);
    
    async function fetchAnnouncements() {
      try {
        const q = query(collection(db, 'announcements'), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        
        if (!snapshot || snapshot.empty) {
          console.log('No announcements found');
          setAnnouncements([]);
          setTotalAnnouncements(0);
          setLoading(false);
          return;
        }
        
        const announcementsData = snapshot.docs.map(doc => {
          const data = doc.data();
          if (!data) {
            console.warn('Empty announcement data for doc:', doc.id);
            return { 
              id: doc.id, 
              title: 'Untitled Announcement', 
              content: '',
              date: new Date().toISOString(),
              priority: 'normal'
            };
          }
          
          return {
            id: doc.id, 
            ...data,
            date: data.date?.toDate?.() || data.date || new Date()
          } as Announcement;
        });
        
        console.log('Processed announcements:', announcementsData);
        setAnnouncements(announcementsData);
        setTotalAnnouncements(announcementsData.length);
        setLoading(false);
        setError(null);
        
      } catch (err) {
        console.error('Error fetching announcements:', err);
        setError('Failed to load announcements');
        setLoading(false);
      }
    }
    
    fetchAnnouncements();
  }, []);

  // Calculate pagination
  const indexOfLastAnnouncement = currentPage * announcementsPerPage;
  const indexOfFirstAnnouncement = indexOfLastAnnouncement - announcementsPerPage;
  const currentAnnouncements = announcements.slice(indexOfFirstAnnouncement, indexOfLastAnnouncement);
  const totalPages = Math.ceil(totalAnnouncements / announcementsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Prevent rendering until component is properly initialized
  if (!initialized) {
    return (
      <div className="py-12 bg-slate-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
            <p className="text-gray-500 mt-2">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight sm:text-4xl">Announcements</h1>
          <p className="mt-2 text-lg text-slate-500">Stay updated with the latest news and important notices.</p>
          {totalAnnouncements > 0 && (
            <p className="mt-1 text-sm text-slate-400">
              Showing {indexOfFirstAnnouncement + 1}-{Math.min(indexOfLastAnnouncement, totalAnnouncements)} of {totalAnnouncements} announcements
            </p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto mb-4"></div>
            <p>Loading announcements...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-red-200">
            <p className="text-lg text-red-600">{error}</p>
          </div>
        ) : !announcements || announcements.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No announcements at the moment.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {currentAnnouncements.map((announcement) => {
                if (!announcement || !announcement.id) {
                  console.warn('Invalid announcement data:', announcement);
                  return null;
                }
                return (
                  <div
                    key={announcement.id}
                    className={cn(
                      "bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow",
                      announcement.priority === 'high' ? "border-amber-600" : "border-slate-200"
                    )}
                  >
                    {announcement.priority === 'high' && (
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 mb-3">
                        Important
                      </span>
                    )}
                    
                    {announcement.title && (
                      <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2">{announcement.title}</h3>
                    )}
                    
                    {announcement.date && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                        <Calendar className="w-3 h-3" />
                        <time dateTime={announcement.date}>
                          {format(new Date(announcement.date), 'MMM d, yyyy')}
                        </time>
                      </div>
                    )}

                    {announcement.imageUrl && (
                      <div className="mb-4 rounded-lg overflow-hidden bg-slate-100 aspect-video relative">
                        <img 
                          src={announcement.imageUrl} 
                          alt={announcement.title || 'Announcement'} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {announcement.content && (
                      <ExpandableText
                        text={announcement.content}
                        maxLength={200}
                        className="text-slate-600 text-sm"
                      />
                    )}
                  </div>
                );
              }).filter(Boolean)}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        onClick={() => paginate(pageNumber)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === pageNumber
                            ? 'bg-blue-900 text-white'
                            : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
