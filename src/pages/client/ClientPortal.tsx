import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, collection, query, onSnapshot, orderBy, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { Project, MarkdownDocument } from '../../types';
import ReactMarkdown from 'react-markdown';
import { 
  FileText, ChevronRight, Printer, Download, Edit3, Loader2, ArrowLeft, 
  Save, X, Eye, GripVertical, CheckCircle, Info, HelpCircle 
} from 'lucide-react';

const ClientPortal: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<MarkdownDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<MarkdownDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const hasInitialSelect = useRef(false);
  
  // Dynamic Title
  useEffect(() => {
    if (project) {
      document.title = `JLC - Client Portal - ${project.clientName}`;
    } else {
      document.title = 'JLC - Client Portal';
    }
    
    return () => {
      document.title = 'JLC - Client Portal';
    };
  }, [project]);

  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Drag and Drop State
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    let metadataLoaded = false;
    let docsLoaded = false;

    const checkLoadingFinished = () => {
      if (metadataLoaded && docsLoaded) setLoading(false);
    };

    const fetchMetadata = async () => {
      try {
        const docRef = doc(db, 'projects', projectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProject({ id: docSnap.id, ...docSnap.data() } as Project);
        }
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
      
      if (docsData.length > 0) {
        // Fix: Only auto-select on the very first data load
        if (!hasInitialSelect.current) {
          setSelectedDoc(docsData[0]);
          setEditedContent(docsData[0].content);
          hasInitialSelect.current = true;
        } else if (selectedDoc && !isEditing) {
          // Update currently selected if changed remotely, but don't force a re-select
          const updatedSelected = docsData.find(d => d.id === selectedDoc.id);
          if (updatedSelected) {
            setSelectedDoc(updatedSelected);
            setEditedContent(updatedSelected.content);
          }
        }
      }
      docsLoaded = true;
      checkLoadingFinished();
    });

    fetchMetadata();
    return () => unsubscribe();
  }, [projectId, selectedDoc?.id, isEditing]);

  const handleDocSelect = (doc: MarkdownDocument) => {
    if (isEditing && editedContent !== selectedDoc?.content) {
      if (!confirm('You have unsaved changes. Discard them?')) return;
    }
    setSelectedDoc(doc);
    setEditedContent(doc.content);
    setIsEditing(false);
  };

  const handleSort = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;
    
    const _docs = [...documents];
    const draggedItemContent = _docs.splice(dragItem.current, 1)[0];
    _docs.splice(dragOverItem.current, 0, draggedItemContent);
    
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
    } finally {
      setIsReordering(false);
    }
  };

  const handleDownload = () => {
    if (!selectedDoc) return;
    const blob = new Blob([selectedDoc.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDoc.title.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async (statusOverride?: 'draft' | 'review' | 'approved') => {
    if (!selectedDoc || !projectId || isSaving) return;
    
    setIsSaving(true);
    try {
      const docRef = doc(db, `projects/${projectId}/documents`, selectedDoc.id);
      const versionsRef = collection(db, 'projects', projectId, 'documents', selectedDoc.id, 'versions');

      await addDoc(versionsRef, {
        content: selectedDoc.content,
        createdAt: Timestamp.now(),
        createdBy: 'client'
      });

      await updateDoc(docRef, {
        content: editedContent,
        status: statusOverride || selectedDoc.status,
        updatedAt: Timestamp.now()
      });

      setIsEditing(false);
    } catch (error: any) {
      console.error("Error saving document:", error);
      alert(`Failed to save changes: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-gray-500 font-medium">Loading your deliverables...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Project Not Found</h2>
        <p className="text-gray-600 mb-6">We couldn't find the requested project. Please check the URL or contact your project manager.</p>
        <Link to="/admin" className="text-blue-600 font-medium hover:underline flex items-center space-x-1">
          <ArrowLeft size={16} />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-white overflow-hidden print:block print:h-auto print:overflow-visible">
      {/* Sidebar - Hidden on Print */}
      <aside className={`w-full lg:w-80 bg-gray-50 border-r border-gray-200 flex flex-col shrink-0 print:hidden ${
        (isEditing || !!selectedDoc) ? 'hidden lg:flex' : 'flex'
      }`}>
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">JLC</h1>
            {isReordering && <Loader2 size={14} className="animate-spin text-blue-600" />}
          </div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Client Portal</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {documents.map((doc, index) => (
            <div
              key={doc.id}
              draggable
              onDragStart={() => (dragItem.current = index)}
              onDragEnter={() => (dragOverItem.current = index)}
              onDragEnd={handleSort}
              onDragOver={(e) => e.preventDefault()}
              className="group flex items-center space-x-2"
            >
              <div className="opacity-0 group-hover:opacity-100 cursor-move text-gray-400 hover:text-blue-500 transition-opacity">
                <GripVertical size={16} />
              </div>
              
              <button
                onClick={() => handleDocSelect(doc)}
                className={`flex-1 flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 ${
                  selectedDoc?.id === doc.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <FileText size={18} className={selectedDoc?.id === doc.id ? 'text-blue-100' : 'text-gray-400'} />
                  <span className="font-bold text-sm truncate">{doc.title}</span>
                </div>
                {doc.status === 'approved' ? (
                  <CheckCircle size={14} className={selectedDoc?.id === doc.id ? 'text-blue-200' : 'text-green-500'} />
                ) : (
                  <ChevronRight size={16} className={selectedDoc?.id === doc.id ? 'text-blue-200' : 'text-gray-300'} />
                )}
              </button>
            </div>
          ))}
          
          <button 
            onClick={() => setShowInstructions(true)}
            className="w-full mt-8 flex items-center justify-center space-x-2 p-3 border border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-blue-600 hover:border-blue-300 transition"
          >
            <HelpCircle size={16} />
            <span className="text-sm font-medium">How to use this portal</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200 bg-gray-100/50">
          <Link to="/admin" className="mb-4 flex items-center space-x-2 text-xs text-gray-400 hover:text-blue-600 transition">
            <ArrowLeft size={12} />
            <span>Admin Dashboard</span>
          </Link>
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
              JLC
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">Johnny LeHane Consulting</p>
              <p className="text-xs text-gray-500 truncate">{project.clientEmail}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-w-0 bg-white overflow-hidden print:block print:overflow-visible ${
        !!selectedDoc ? 'flex' : 'hidden lg:flex'
      }`}>
        {selectedDoc ? (
          <>
            {/* Toolbar - Hidden on Print */}
            <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between shrink-0 print:hidden overflow-x-auto gap-4">
              <div className="flex items-center space-x-3 shrink-0">
                {!isEditing && (
                  <button 
                    onClick={() => setSelectedDoc(null)}
                    className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-blue-600 transition"
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                  <span className={`w-fit text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${
                    selectedDoc.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {selectedDoc.status}
                  </span>
                  <h2 className="text-base md:text-lg font-bold text-gray-900 truncate max-w-[140px] sm:max-w-md">{selectedDoc.title}</h2>
                </div>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
                {!isEditing ? (
                  <>
                    <button
                      onClick={handlePrint}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                      title="Print to PDF"
                    >
                      <Printer size={20} />
                    </button>
                    <button
                      onClick={handleDownload}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                      title="Download Markdown"
                    >
                      <Download size={20} />
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 bg-gray-900 text-white px-3 sm:px-4 py-2 rounded-xl hover:bg-gray-800 transition shadow-sm font-bold text-sm"
                    >
                      <Edit3 size={16} />
                      <span className="hidden sm:inline">Edit & Answer</span>
                      <span className="sm:hidden">Edit</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        if (editedContent === selectedDoc.content || confirm('Discard unsaved changes?')) {
                          setIsEditing(false);
                          setEditedContent(selectedDoc.content);
                        }
                      }}
                      className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                      title="Cancel"
                    >
                      <X size={20} />
                    </button>
                    <button
                      onClick={() => handleSave('approved')}
                      disabled={isSaving}
                      className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition font-bold text-sm"
                    >
                      <CheckCircle size={18} />
                      <span>Final Approve</span>
                    </button>
                    <button
                      onClick={() => handleSave()}
                      disabled={isSaving || editedContent === selectedDoc.content}
                      className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl transition shadow-sm font-bold text-sm ${
                        isSaving || editedContent === selectedDoc.content
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                      <span className="hidden sm:inline">Save Draft</span>
                      <span className="sm:hidden">Save</span>
                    </button>
                  </>
                )}
              </div>
            </header>

            {/* Content Area */}
            <article className="flex-1 overflow-hidden flex flex-col lg:flex-row print:block print:overflow-visible relative">
              {/* Instructions Overlay */}
              {showInstructions && !isEditing && (
                <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 print:hidden">
                  <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
                    <div className="bg-blue-600 p-5 md:p-6 text-white flex items-center justify-between shrink-0">
                      <div className="flex items-center space-x-3">
                        <Info size={24} />
                        <h3 className="text-lg md:text-xl font-bold">Welcome to your Portal</h3>
                      </div>
                      <button onClick={() => setShowInstructions(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                        <X size={20} />
                      </button>
                    </div>
                    <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 text-sm">
                        <div className="space-y-2 md:space-y-3">
                          <div className="font-bold text-gray-900 flex items-center space-x-2">
                            <Edit3 size={16} className="text-blue-600" />
                            <span>Edit in Place</span>
                          </div>
                          <p className="text-gray-600 leading-relaxed">
                            Answer questions and refine scope directly in the browser. Click <b>"Edit & Answer"</b> to start. Your changes are saved as drafts.
                          </p>
                        </div>
                        <div className="space-y-2 md:space-y-3">
                          <div className="font-bold text-gray-900 flex items-center space-x-2">
                            <Download size={16} className="text-blue-600" />
                            <span>Download & Print</span>
                          </div>
                          <p className="text-gray-600 leading-relaxed">
                            Need to work offline? Download the raw files or print a clean PDF layout for manual markup.
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-800 text-xs flex space-x-3">
                        <CheckCircle size={16} className="shrink-0" />
                        <p>
                          <b>Final Sign-off:</b> Once a document is exactly how you want it, use the <b>Final Approve</b> button to lock it in.
                        </p>
                      </div>

                      <button 
                        onClick={() => setShowInstructions(false)}
                        className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition shadow-lg mt-2"
                      >
                        Start Reviewing
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isEditing ? (
                <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
                  <div className="flex-1 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col bg-gray-50/50">
                    <div className="px-4 py-2 border-b border-gray-200 bg-white flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1">
                        <Edit3 size={12} />
                        <span>Markdown Editor</span>
                      </span>
                    </div>
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="flex-1 p-4 md:p-6 font-mono text-sm bg-transparent outline-none resize-none text-gray-800 leading-relaxed"
                      placeholder="Enter markdown content here..."
                      spellCheck="false"
                    />
                  </div>
                  <div className="flex-1 flex flex-col overflow-hidden bg-white">
                    <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1">
                        <Eye size={12} />
                        <span>Live Preview</span>
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 prose prose-blue prose-sm max-w-none prose-headings:font-extrabold prose-headings:tracking-tight prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900">
                      <ReactMarkdown>{editedContent}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16 print:p-0 print:overflow-visible">
                  <div className="prose prose-blue prose-lg max-w-none prose-headings:font-extrabold prose-headings:tracking-tight prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 print:prose-sm">
                    <ReactMarkdown>{selectedDoc.content}</ReactMarkdown>
                  </div>
                </div>
              )}
            </article>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <FileText size={64} className="opacity-10 mb-4" />
            <p className="text-xl font-bold text-gray-500">Select a deliverable to view</p>
            <p className="text-sm max-w-xs mx-auto">Choose a document from the list on the left to review its content.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientPortal;