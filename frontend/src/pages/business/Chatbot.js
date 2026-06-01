import React, { useState, useEffect, useRef } from 'react';
import Layout from '../../components/layout/Layout';
import { settingsAPI, chatbotAPI } from '../../utils/api';
import { Bot, Send, Plus, Trash2, Save, Code, ExternalLink, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Chatbot() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiForm, setAIForm] = useState({ welcome_message: '', ai_instructions: '', appointment_rules: '', faqs: [] });
  const [newFAQ, setNewFAQ] = useState({ question: '', answer: '' });
  const [showCode, setShowCode] = useState(false);

  // Preview chat state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sessionId] = useState(() => Math.random().toString(36).slice(2));
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    settingsAPI.getSettings().then(res => {
      setSettings(res.data);
      const ai = res.data.ai_settings || {};
      setAIForm({
        welcome_message: ai.welcome_message || '',
        ai_instructions: ai.ai_instructions || '',
        appointment_rules: ai.appointment_rules || '',
        faqs: ai.faqs || []
      });
      // Init welcome message in chat
      if (ai.welcome_message) {
        setMessages([{ role: 'assistant', content: ai.welcome_message }]);
      }
    }).catch(err => console.error('Failed to load chatbot settings', err)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSaveAI = async () => {
    setSaving(true);
    try {
      await settingsAPI.updateAISettings({ ...aiForm, faqs: aiForm.faqs });
      alert('AI settings saved!');
    } catch (err) {
      console.error('Failed to save AI settings', err);
    }
    setSaving(false);
  };

  const handleAddFAQ = () => {
    if (!newFAQ.question.trim() || !newFAQ.answer.trim()) return;
    setAIForm(prev => ({ ...prev, faqs: [...prev.faqs, { ...newFAQ }] }));
    setNewFAQ({ question: '', answer: '' });
  };

  const handleRemoveFAQ = (i) => {
    setAIForm(prev => ({ ...prev, faqs: prev.faqs.filter((_, idx) => idx !== i) }));
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading || !user?.business_id) return;
    const msg = chatInput.trim();
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setChatLoading(true);
    try {
      const res = await chatbotAPI.sendMessage(user.business_id, { message: msg, session_id: sessionId });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (err) {
      console.error('Chatbot send failed', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    }
    setChatLoading(false);
  };

  const widgetCode = `<script
  src="${process.env.REACT_APP_BACKEND_URL || ''}/widget.js"
  data-business-id="${user?.business_id || 'YOUR_BUSINESS_ID'}"
  defer>
</script>`;

  if (loading) return <Layout title="AI Chatbot"><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div></Layout>;

  return (
    <Layout title="AI Chatbot" subtitle="Configure and preview your AI assistant">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-5">
          {/* Welcome Message */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4" style={{fontFamily: 'Outfit, sans-serif'}}>Welcome Message</h3>
            <textarea
              value={aiForm.welcome_message}
              onChange={e => setAIForm({...aiForm, welcome_message: e.target.value})}
              rows={3}
              placeholder="Hi! I'm your AI assistant. How can I help you today?"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
            />
          </div>

          {/* AI Instructions */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4" style={{fontFamily: 'Outfit, sans-serif'}}>AI Instructions</h3>
            <textarea
              value={aiForm.ai_instructions}
              onChange={e => setAIForm({...aiForm, ai_instructions: e.target.value})}
              rows={5}
              placeholder="Describe how the AI should behave, what services to promote, and how to qualify leads..."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
            />
          </div>

          {/* Appointment Rules */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4" style={{fontFamily: 'Outfit, sans-serif'}}>Appointment Rules</h3>
            <textarea
              value={aiForm.appointment_rules}
              onChange={e => setAIForm({...aiForm, appointment_rules: e.target.value})}
              rows={3}
              placeholder="Describe appointment availability, booking process, requirements..."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
            />
          </div>

          {/* FAQs */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4" style={{fontFamily: 'Outfit, sans-serif'}}>FAQs</h3>
            <div className="space-y-3 mb-4">
              {aiForm.faqs.map((faq, i) => (
                <div key={`${faq.question}-${i}`} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-700 mb-0.5">Q: {faq.question}</p>
                      <p className="text-xs text-slate-500">A: {faq.answer}</p>
                    </div>
                    <button onClick={() => handleRemoveFAQ(i)} className="ml-2 p-1 hover:bg-red-50 rounded text-red-400"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <input value={newFAQ.question} onChange={e => setNewFAQ({...newFAQ, question: e.target.value})} placeholder="Question"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 outline-none" />
              <input value={newFAQ.answer} onChange={e => setNewFAQ({...newFAQ, answer: e.target.value})} placeholder="Answer"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 outline-none" />
              <button onClick={handleAddFAQ} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Plus size={12} /> Add FAQ
              </button>
            </div>
          </div>

          <button onClick={handleSaveAI} disabled={saving} data-testid="save-ai-settings"
            className="flex items-center gap-2 w-full justify-center py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
            <Save size={16} />
            {saving ? 'Saving...' : 'Save AI Settings'}
          </button>

          {/* Widget Code */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-slate-900" style={{fontFamily: 'Outfit, sans-serif'}}>Widget Installation</h3>
              <button onClick={() => setShowCode(!showCode)} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <Code size={12} />{showCode ? 'Hide' : 'Show'} Code
              </button>
            </div>
            {showCode && (
              <pre className="bg-slate-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap">{widgetCode}</pre>
            )}
            <p className="text-xs text-slate-500 mt-2">Add this code to your website's HTML to embed the chatbot widget.</p>
          </div>
        </div>

        {/* Chat Preview */}
        <div className="bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden" style={{height: '600px'}}>
          <div className="bg-blue-600 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{settings?.name || 'AI Assistant'}</p>
              <p className="text-xs text-blue-200">Preview Mode</p>
            </div>
            <button onClick={() => setMessages(aiForm.welcome_message ? [{role:'assistant',content:aiForm.welcome_message}] : [])} className="ml-auto text-blue-200 hover:text-white">
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((msg, i) => (
              <div key={`${msg.role}-${i}-${msg.content?.slice(0,8)}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                    <Bot size={12} className="text-white" />
                  </div>
                )}
                <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${
                  msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm shadow-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mr-2 flex-shrink-0">
                  <Bot size={12} className="text-white" />
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
                  <div className="flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-slate-100">
            <div className="flex items-center gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
                placeholder="Type a message to test..."
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50"
              />
              <button onClick={handleSendChat} disabled={chatLoading || !chatInput.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
