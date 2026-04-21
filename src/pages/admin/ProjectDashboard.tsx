import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { Project } from '../../types';
import { Plus, User, Mail, FolderOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProjectDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState({
    name: '',
    clientName: '',
    clientEmail: '',
  });

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];
      setProjects(projectsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'projects'), {
        ...newProject,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      setNewProject({ name: '', clientName: '', clientEmail: '' });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Check console for details.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-6xl mx-auto">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
        <h2 className="text-xl font-bold text-gray-800">Active Projects</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 transition font-medium shadow-sm"
        >
          <Plus size={18} />
          <span>New Project</span>
        </button>
      </div>

      {/* Create Form Section */}
      {isCreating && (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-blue-100 ring-4 ring-blue-50/50">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Create New Project</h3>
          <form onSubmit={handleCreateProject} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Timely Signs Lifecycle"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Client Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Timely Signs"
                  value={newProject.clientName}
                  onChange={(e) => setNewProject({ ...newProject, clientName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Client Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g., paul@timelysigns.com"
                  value={newProject.clientEmail}
                  onChange={(e) => setNewProject({ ...newProject, clientEmail: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-8 py-2.5 rounded-lg hover:bg-blue-700 transition font-bold shadow-sm"
              >
                Initialize Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 group flex flex-col h-full"
          >
            <div className="flex justify-between items-start mb-5">
              <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                <FolderOpen size={24} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                Active
              </span>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">{project.name}</h3>
              <div className="space-y-2.5 mb-8">
                <div className="flex items-center text-gray-500 text-sm space-x-3">
                  <User size={16} className="shrink-0 text-gray-400" />
                  <span className="truncate">{project.clientName}</span>
                </div>
                <div className="flex items-center text-gray-500 text-sm space-x-3">
                  <Mail size={16} className="shrink-0 text-gray-400" />
                  <span className="truncate">{project.clientEmail}</span>
                </div>
              </div>
            </div>

            <Link
              to={`/admin/projects/${project.id}`}
              className="mt-auto flex items-center justify-between w-full p-3.5 bg-gray-50 rounded-xl text-gray-700 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all duration-200"
            >
              <span>Manage Deliverables</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ))}
        
        {projects.length === 0 && !isCreating && (
          <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <FolderOpen className="mx-auto mb-4 opacity-10" size={64} />
            <p className="text-xl font-bold text-gray-500 mb-2">No projects yet</p>
            <p className="text-sm max-w-xs mx-auto mb-8">Start by creating your first client project to deliver markdown files.</p>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center space-x-2 text-blue-600 font-bold hover:text-blue-700 transition"
            >
              <Plus size={18} />
              <span>Create project now</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDashboard;