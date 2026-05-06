import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { format } from 'date-fns';
import { ExpandableText } from '../components/ExpandableText';

type Post = {
  id: string;
  title?: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: string;
  createdAt?: any;
};

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const postsPerPage = 10;

  useEffect(() => {
    console.log('PostsPage: Component mounted');
    setInitialized(true);
    setLoading(true);
    setError(null);
    
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Firestore snapshot received:', snapshot);
      
      try {
        if (!snapshot) {
          console.error('No snapshot object received');
          setPosts([]);
          setTotalPosts(0);
          setLoading(false);
          setError('Failed to load posts: No data received');
          return;
        }
        
        if (!snapshot.docs || snapshot.docs.length === 0) {
          console.log('No posts found in database');
          setPosts([]);
          setTotalPosts(0);
          setLoading(false);
          setError(null);
          return;
        }
        
        const postsData = snapshot.docs.map(doc => {
          const data = doc.data();
          if (!data) {
            console.warn('Empty document data for doc:', doc.id);
            return { 
              id: doc.id, 
              title: 'Untitled', 
              createdAt: new Date().toISOString(),
              mediaType: 'text'
            };
          }
          
          const postData = {
            id: doc.id, 
            ...data,
            createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date()
          } as Post;
          
          console.log('Processed post:', postData);
          return postData;
        });
        
        console.log('Final posts array:', postsData);
        setPosts(postsData);
        setTotalPosts(postsData.length);
        setLoading(false);
        setError(null);
        
      } catch (err) {
        console.error('Error processing posts:', err);
        setError('Failed to load posts');
        setLoading(false);
      }
    }, (error) => {
      console.error('Firestore subscription error:', error);
      setError('Failed to connect to database');
      setLoading(false);
    });

    return () => {
      console.log('PostsPage: Cleaning up subscription');
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Calculate pagination
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(totalPosts / postsPerPage);

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
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight sm:text-4xl">Latest Posts</h1>
          <p className="mt-2 text-lg text-slate-500">Updates, media, and announcements.</p>
          {totalPosts > 0 && (
            <p className="mt-1 text-sm text-slate-400">
              Showing {indexOfFirstPost + 1}-{Math.min(indexOfLastPost, totalPosts)} of {totalPosts} posts
            </p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto mb-4"></div>
            <p>Loading posts...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-red-200">
            <p className="text-lg text-red-600">{error}</p>
          </div>
        ) : !posts || posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-500 text-lg">No posts available yet.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {currentPosts.map(post => {
                if (!post || !post.id) {
                  console.warn('Invalid post data:', post);
                  return null;
                }
                return (
                  <div key={post.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    {post.title && (
                      <h2 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2">{post.title}</h2>
                    )}
                    {post.createdAt && (
                      <p className="text-xs text-slate-500 mb-3">
                        {format(new Date(post.createdAt), 'MMM d, yyyy')}
                      </p>
                    )}
                    
                    {post.mediaUrl && (
                      <div className="mb-3 rounded-lg overflow-hidden bg-slate-100">
                        <div className="aspect-video bg-slate-100" style={{ minHeight: '120px' }}>
                          {post.mediaType === 'image' && (
                            <img 
                              src={post.mediaUrl} 
                              alt={post.title || 'Post'} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('Image failed to load:', post.mediaUrl);
                              }}
                            />
                          )}
                          {post.mediaType === 'video' && (
                            <video controls className="w-full h-full object-cover">
                              <source src={post.mediaUrl} />
                            </video>
                          )}
                          {post.mediaType === 'audio' && (
                            <div className="w-full h-full flex items-center justify-center">
                              <audio controls className="w-full max-w-xs">
                                <source src={post.mediaUrl} />
                              </audio>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {post.description && (
                      <ExpandableText
                        text={post.description}
                        maxLength={180}
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
