import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { User, Phone, Circle, X, Edit, Power, Activity, PhoneIncoming, PhoneOutgoing, CheckSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminAgents() {
  const { token } = useAppStore();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [agentActivity, setAgentActivity] = useState<{calls: any[], tasks: any[]}>({ calls: [], tasks: [] });
  
  // Forms
  const [formData, setFormData] = useState({ name: '', email: '', password: '', extension: '', assignedNumber: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

  const fetchAgents = () => {
    fetch('/api/admin/agents', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setAgents(data);
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchAgents();
  }, [token]);

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    // Client-side validation
    if (formData.password.length < 8) {
      setAddError('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setIsAddModalOpen(false);
        setAddError('');
        setFormData({ name: '', email: '', password: '', extension: '', assignedNumber: '' });
        fetchAgents();
      } else {
        // Show the error returned by the API (e.g. duplicate email)
        setAddError(data?.error || 'Failed to create agent. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setAddError('Network error. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/agents/${selectedAgent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          extension: formData.extension,
          assignedNumber: formData.assignedNumber
        })
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchAgents();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (agentId: string) => {
    try {
      const res = await fetch(`/api/admin/agents/${agentId}/toggle-status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAgents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewProfile = async (agent: any) => {
    setSelectedAgent(agent);
    setIsProfileDrawerOpen(true);
    try {
      const res = await fetch(`/api/admin/agents/${agent.id}/activity`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAgentActivity(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (agent: any) => {
    setSelectedAgent(agent);
    setFormData({
      name: agent.user.name,
      email: agent.user.email,
      password: '',
      extension: agent.extension || '',
      assignedNumber: agent.assignedNumber || ''
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Agents</h2>
        <button 
          onClick={() => {
            setFormData({ name: '', email: '', password: '', extension: '', assignedNumber: '' });
            setAddError('');
            setIsAddModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
        >
          Add Agent
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading agents...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <div key={agent.id} className={`bg-white shadow rounded-lg border border-gray-100 overflow-hidden ${!agent.user.isActive ? 'opacity-60' : ''}`}>
              <div className="p-6 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleViewProfile(agent)}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        {agent.user.name}
                        {!agent.user.isActive && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Disabled</span>}
                      </h3>
                      <p className="text-sm text-gray-500">{agent.user.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Circle className={`w-3 h-3 fill-current ${agent.status === 'ONLINE' ? 'text-green-500' : 'text-gray-400'}`} />
                      {agent.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Extension</span>
                    <span className="font-medium text-gray-900">{agent.extension || 'None'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Direct Number</span>
                    <span className="font-medium text-gray-900">{agent.assignedNumber || 'None'}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); openEditModal(agent); }}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center gap-1"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleToggleStatus(agent.id); }}
                  className={`text-sm font-medium flex items-center gap-1 ${agent.user.isActive ? 'text-red-600 hover:text-red-500' : 'text-green-600 hover:text-green-500'}`}
                >
                  <Power className="w-4 h-4" /> {agent.user.isActive ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Agent Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[500px] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Add New Agent</h3>
              <button onClick={() => { setIsAddModalOpen(false); setAddError(''); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddAgent} className="p-6 space-y-4">
              {addError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {addError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password * <span className="text-gray-400 font-normal">(min 8 characters)</span></label>
                <input required type="password" minLength={8} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Min. 8 characters" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Extension</label>
                  <input type="text" value={formData.extension} onChange={e => setFormData({...formData, extension: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Direct Number</label>
                  <input type="text" value={formData.assignedNumber} onChange={e => setFormData({...formData, assignedNumber: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? 'Adding...' : 'Add Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Agent Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[500px] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Edit Agent</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditAgent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Extension</label>
                  <input type="text" value={formData.extension} onChange={e => setFormData({...formData, extension: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Direct Number</label>
                  <input type="text" value={formData.assignedNumber} onChange={e => setFormData({...formData, assignedNumber: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile & Activity Drawer */}
      {isProfileDrawerOpen && selectedAgent && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 transform transition-transform duration-300">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                {selectedAgent.user.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedAgent.user.name}</h3>
                <p className="text-sm text-gray-500">{selectedAgent.user.email}</p>
              </div>
            </div>
            <button onClick={() => setIsProfileDrawerOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Recent Calls */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" /> Recent Calls
              </h4>
              <div className="space-y-3">
                {agentActivity.calls.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent calls.</p>
                ) : (
                  agentActivity.calls.map(call => (
                    <div key={call.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-full mt-0.5 ${call.direction === 'INBOUND' ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'}`}>
                          {call.direction === 'INBOUND' ? <PhoneIncoming className="w-3 h-3" /> : <PhoneOutgoing className="w-3 h-3" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{call.client?.name || call.phoneNumber}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{format(new Date(call.startedAt), 'MMM d, h:mm a')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${call.status === 'ENDED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {call.status}
                        </span>
                        {call.duration && <p className="text-xs text-gray-500 mt-1">{Math.floor(call.duration / 60)}m {call.duration % 60}s</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Tasks */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-gray-400" /> Upcoming Tasks
              </h4>
              <div className="space-y-3">
                {agentActivity.tasks.length === 0 ? (
                  <p className="text-sm text-gray-500">No upcoming tasks.</p>
                ) : (
                  agentActivity.tasks.map(task => (
                    <div key={task.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex justify-between items-start">
                        <p className={`text-sm font-medium ${task.status === 'COMPLETED' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{task.title}</p>
                        <span className="text-xs text-blue-600 font-medium">{task.client?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" /> {format(new Date(task.dueAt), 'MMM d, h:mm a')}
                        <span className="px-1.5 py-0.5 bg-gray-200 rounded uppercase text-[10px] tracking-wider">{task.taskType}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
