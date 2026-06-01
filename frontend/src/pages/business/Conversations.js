import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { conversationsAPI } from '../../utils/api';
import { MessageSquare, Search, Trash2, ChevronRight, Clock, User } from 'lucide-react';

export default function Conversations() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await conversationsAPI.getConversations({ search, limit: 30 });
      setConversations(res.data.conversations || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConversations(); }, [search]);

  const handleSelect = async (conv) => {
    const res = await conversationsAPI.getConversation(conv.id);
    setSelected(res.data);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete conversation?')) return;
    await conversationsAPI.deleteConversation(id);
    fetchConversations();
    if (selected?.id === id) setSelected(null);
  };

  return (
    <Layout title="Conversations" subtitle={`${total} conversations`}>
      <div className="flex gap-6 h-[calc(100vh-160px)]">
        {/* List */}
        <div className="w-80 flex-shrink-0 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                <MessageSquare size={24} className="mb-2 opacity-30" />
                <p className="text-sm">No conversations</p>
              </div>
            ) : conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => handleSelect(conv)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-slate-50 hover:bg-slate-50 transition-colors ${selected?.id === conv.id ? 'bg-blue-50' : ''}`}
                data-testid={`conv-${conv.id}`}
              >
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-blue-700">{conv.customer_name?.[0]?.toUpperCase() || 'V'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{conv.customer_name || 'Visitor'}</p>
                  <p className="text-xs text-slate-400 truncate">{conv.customer_phone || 'No phone'}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button onClick={(e) => handleDelete(conv.id, e)} className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600"><Trash2 size={11} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-700">{selected.customer_name?.[0]?.toUpperCase() || 'V'}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{selected.customer_name || 'Visitor'}</p>
                  <p className="text-xs text-slate-400">{selected.customer_phone}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {(selected.messages || []).map((msg, i) => (
                  <div key={`${msg.role}-${msg.timestamp || i}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                        <span className="text-xs font-bold text-white">AI</span>
                      </div>
                    )}
                    <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                    }`}>
                      {msg.content}
                      <p className={`text-xs mt-1 opacity-60`}>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : ''}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center ml-2 flex-shrink-0 mt-1">
                        <User size={12} className="text-slate-500" />
                      </div>
                    )}
                  </div>
                ))}
                {(!selected.messages || selected.messages.length === 0) && (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                    <MessageSquare size={24} className="mb-2 opacity-30" />
                    <p className="text-sm">No messages yet</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <MessageSquare size={40} className="mb-3 opacity-20" />
              <p className="text-sm font-medium">Select a conversation</p>
              <p className="text-xs mt-1">Click on a conversation to view messages</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
