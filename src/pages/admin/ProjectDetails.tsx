import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, collection, addDoc, query, onSnapshot, Timestamp, deleteDoc, orderBy, updateDoc } from 'firebase/firestore';
import { Project, MarkdownDocument } from '../../types';
import { ArrowLeft, FileText, Upload, Trash2, CheckCircle, Clock, Loader2, Settings, ExternalLink, GripVertical } from 'lucide-react';

const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<MarkdownDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [uploadState, setUploadState] = useState<{ total: number; current: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Check if Firebase is using placeholders
  const isConfigured = !import.meta.env.VITE_FIREBASE_PROJECT_ID?.includes('placeholder');

  useEffect(() => {
    if (!projectId) return;

    let metadataLoaded = false;
    let docsLoaded = false;

    const checkLoadingFinished = () => {
      if (metadataLoaded && docsLoaded) {
        setLoading(false);
      }
    };

    const fetchMetadata = async () => {
      try {
        const docRef = doc(db, 'projects', projectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProject({ id: docSnap.id, ...docSnap.data() } as Project);
        }
      } catch (e) {
        console.error("Error fetching project:", e);
      } finally {
        metadataLoaded = true;
        checkLoadingFinished();
      }
    };

    const q = query(collection(db, `projects/${projectId}/documents`), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MarkdownDocument[];
      setDocuments(docsData);
      docsLoaded = true;
      checkLoadingFinished();
    }, (error) => {
      console.error("Snapshot error:", error);
      docsLoaded = true;
      checkLoadingFinished();
    });

    fetchMetadata();

    return () => unsubscribe();
  }, [projectId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !projectId) return;

    const fileList = Array.from(files).filter(f => f.name.endsWith('.md'));
    if (fileList.length === 0) return;

    setUploadState({ total: fileList.length, current: 0, errors: [] });
    
    let completed = 0;
    const errors: string[] = [];

    for (const file of fileList) {
      try {
        const content = await file.text();
        const title = file.name.replace('.md', '').replace(/_/g, ' ');

        await addDoc(collection(db, `projects/${projectId}/documents`), {
          projectId,
          title,
          content,
          status: 'review',
          order: documents.length + completed,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        
        completed++;
      } catch (error: any) {
        console.error(`Error uploading ${file.name}:`, error);
        errors.push(file.name);
      }
      setUploadState(prev => prev ? { ...prev, current: completed, errors } : null);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    
    if (errors.length === 0) {
      setTimeout(() => setUploadState(null), 2000);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!projectId || !confirm('Are you sure you want to delete this deliverable?')) return;
    try {
      await deleteDoc(doc(db, `projects/${projectId}/documents`, docId));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const mockEvent = { target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(mockEvent);
    }
  };

  const handleSort = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;
    
    const _docs = [...documents];
    const draggedItemContent = _docs.splice(dragItem.current, 1)[0];
    _docs.splice(dragOverItem.current, 0, draggedItemContent);
    
    // Optimistic UI update
    setDocuments(_docs);
    
    dragItem.current = null;
    dragOverItem.current = null;

    setIsReordering(true);
    try {
      const batchPromises = _docs.map((docItem, index) => {
        const docRef = doc(db, `projects/${projectId}/documents`, docItem.id);
        return updateDoc(docRef, { order: index });
      });
      await Promise.all(batchPromises);
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to save new order. Please refresh.");
    } finally {
      setIsReordering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-gray-500 font-medium animate-pulse">Loading project details...</p>
      </div>
    );
  }

  if (!project) return <div className="p-8 text-gray-500 text-center">Project not found.</div>;

  const uploadProgress = uploadState ? Math.round((uploadState.current / uploadState.total) * 100) : 0;

  return (
    <div 
      className="space-y-6 md:space-y-8 max-w-6xl mx-auto pb-20"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Configuration Warning */}
      {!isConfigured && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl animate-in fade-in slide-in-from-top duration-500">
          <div className="flex items-center space-x-3 text-amber-800">
            <Settings className="animate-spin-slow shrink-0" size={20} />
            <div>
              <p className="font-bold">Firebase Configuration Required</p>
              <p className="text-sm opacity-90">Please set your VITE_FIREBASE_* variables in <code>client-portal/.env.local</code> to enable database and hosting features.</p>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 px-1">
        <Link to="/admin" className="hover:text-blue-600 flex items-center space-x-1 transition-colors">
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </Link>
      </nav>

      {/* Project Header */}
      <div className="bg-white p-4 md:p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 truncate">{project.name}</h2>
            <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-1 sm:space-y-0 text-gray-500 text-sm">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-700">Client:</span>
                <span className="truncate">{project.clientName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-700">Email:</span>
                <span className="truncate">{project.clientEmail}</span>
              </div>
            </div>
            <div className="mt-4">
              <Link 
                to={`/client/${projectId}`} 
                target="_blank"
                className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-lg transition"
              >
                <ExternalLink size={16} />
                <span>View Client Portal</span>
              </Link>
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!!uploadState || !isConfigured}
              className={`w-full md:w-auto px-6 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition all duration-200 font-medium ${
                uploadState || !isConfigured ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              }`}
            >
              {uploadState ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
              <span>{uploadState ? `Uploading (${uploadState.current}/${uploadState.total})` : 'Upload .md Files'}</span>
            </button>
            
            {uploadState && (
              <div className="w-full space-y-2">
                <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ease-out ${uploadState.errors.length > 0 ? 'bg-red-500' : 'bg-blue-600'}`}
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                {uploadState.errors.length > 0 && (
                  <p className="text-[10px] text-red-500 font-bold text-center">
                    {uploadState.errors.length} files failed to upload.
                  </p>
                )}
              </div>
            )}

            <input
              type="file"
              multiple
              accept=".md"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Deliverables List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-bold text-gray-800">Deliverables</h3>
            {isReordering && (
              <span className="flex items-center text-blue-600 text-xs font-bold animate-pulse">
                <Loader2 size={12} className="animate-spin mr-1" />
                Updating order...
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{documents.length} Items</span>
        </div>
        
        <div className="grid grid-cols-1 gap-3 md:gap-4">
          {documents.map((docItem, index) => (
            <div
              key={docItem.id}
              draggable
              onDragStart={() => (dragItem.current = index)}
              onDragEnter={() => (dragOverItem.current = index)}
              onDragEnd={handleSort}
              onDragOver={(e) => e.preventDefault()}
              className="bg-white p-4 md:p-5 rounded-lg border border-gray-200 flex items-center justify-between hover:border-blue-300 hover:shadow-sm transition group cursor-move"
            >
              <div className="flex items-center space-x-4 min-w-0 flex-1">
                <div className="text-gray-400 group-hover:text-blue-400 transition-colors">
                  <GripVertical size={20} />
                </div>
                <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600 shrink-0">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-800 truncate mb-1">{docItem.title}</h4>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center space-x-1 shrink-0">
                      <Clock size={12} />
                      <span>{docItem.updatedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}</span>
                    </span>
                    <span className={`flex items-center space-x-1 shrink-0 ${docItem.status === 'approved' ? 'text-green-600 font-semibold' : 'text-orange-500'}`}>
                      {docItem.status === 'approved' ? <CheckCircle size={12} /> : <Clock size={12} />}
                      <span className="capitalize">{docItem.status}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1 ml-4">
                <button
                  onClick={() => handleDeleteDocument(docItem.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {documents.length === 0 && (
            <div className="py-16 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
              <FileText className="mx-auto mb-4 opacity-20" size={48} />
              <p className="text-lg font-medium mb-1 text-gray-500">No deliverables yet</p>
              <p className="text-sm">Upload markdown files to share them with the client.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;