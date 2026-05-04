import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchCases } from '../../store/caseSlice';
import { fetchDocuments, uploadDocument, analyzeDocument, chatWithDocument, addChatMessage, clearAnalysis, clearChat } from '../../store/documentSlice';
import { Spinner } from '../../components/Layout';

export default function AIAnalyzer() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { cases } = useSelector((state) => state.cases);
  const { documents, analysis, analyzing, chatMessages, chatting } = useSelector((state) => state.documents);
  const [selectedCase, setSelectedCase] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [uploadText, setUploadText] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => { dispatch(fetchCases()); }, [dispatch]);
  useEffect(() => { if (selectedCase) dispatch(fetchDocuments(selectedCase)); }, [selectedCase, dispatch]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedCase) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caseId', selectedCase);
    formData.append('sharedWith', JSON.stringify([]));
    await dispatch(uploadDocument(formData));
    dispatch(fetchDocuments(selectedCase));
  };

  const handleAnalyze = (doc) => {
    setSelectedDoc(doc);
    dispatch(clearAnalysis());
    dispatch(clearChat());
    dispatch(analyzeDocument({ id: doc._id, text: uploadText || undefined }));
  };

  const handleChat = () => {
    if (!chatInput.trim() || !selectedDoc) return;
    dispatch(addChatMessage({ role: 'user', content: chatInput }));
    dispatch(chatWithDocument({
      id: selectedDoc._id,
      question: chatInput,
      conversationHistory: chatMessages,
      documentText: analysis || '',
    }));
    setChatInput('');
  };

  const parseAnalysis = (text) => {
    if (!text) return [];
    const sections = ['SUMMARY', 'PARTIES', 'KEY DATES', 'OBLIGATIONS', 'RISKY CLAUSES', 'MISSING TERMS'];
    const result = [];
    let current = null;

    text.split('\n').forEach(line => {
      const matchedSection = sections.find(s => line.toUpperCase().startsWith(s + ':') || line.toUpperCase().startsWith('**' + s));
      if (matchedSection) {
        if (current) result.push(current);
        current = { title: matchedSection, content: line.replace(new RegExp(`^\\**${matchedSection}:?\\**\\s*`, 'i'), '') };
      } else if (current) {
        current.content += '\n' + line;
      } else {
        current = { title: 'Analysis', content: line };
      }
    });
    if (current) result.push(current);
    return result;
  };

  const sectionIcons = { SUMMARY: '📋', PARTIES: '👥', 'KEY DATES': '📅', OBLIGATIONS: '📌', 'RISKY CLAUSES': '⚠️', 'MISSING TERMS': '❌' };
  const sectionColors = { 'RISKY CLAUSES': 'border-red-500/50 bg-red-500/5', 'MISSING TERMS': 'border-orange-500/50 bg-orange-500/5' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">🤖 {t('nav.aiAnalyzer')}</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Upload and analyze legal documents with Claude AI</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Document Selection */}
        <div className="space-y-4">
          <div className="glass-card">
            <h3 className="text-sm font-semibold text-white mb-3">Select Case</h3>
            <select value={selectedCase} onChange={e => { setSelectedCase(e.target.value); setSelectedDoc(null); dispatch(clearAnalysis()); dispatch(clearChat()); }} className="input-field">
              <option value="">Choose a case...</option>
              {cases.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>

          {selectedCase && (
            <div className="glass-card">
              <h3 className="text-sm font-semibold text-white mb-3">Documents</h3>
              <label className="block mb-3">
                <span className="btn-secondary text-xs cursor-pointer inline-block">📤 Upload Document</span>
                <input type="file" accept=".pdf,.docx" onChange={handleUpload} className="hidden" />
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {documents.map(doc => (
                  <div
                    key={doc._id}
                    onClick={() => handleAnalyze(doc)}
                    className={`p-3 rounded-lg cursor-pointer transition-all text-sm ${
                      selectedDoc?._id === doc._id ? 'bg-[var(--color-accent)]/20 border border-[var(--color-accent)]' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <p className="text-white font-medium truncate">{doc.fileName}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">{doc.fileType?.toUpperCase()} • v{doc.version}</p>
                    {doc.aiSummary && <span className="text-xs text-green-400">✓ Analyzed</span>}
                  </div>
                ))}
                {documents.length === 0 && <p className="text-[var(--color-text-secondary)] text-xs">No documents in this case</p>}
              </div>

              <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                <p className="text-xs text-[var(--color-text-secondary)] mb-2">Or paste document text:</p>
                <textarea value={uploadText} onChange={e => setUploadText(e.target.value)} className="input-field text-xs" rows={3} placeholder="Paste text here for analysis..." />
              </div>
            </div>
          )}
        </div>

        {/* Right: Analysis & Chat */}
        <div className="col-span-2 space-y-4">
          {/* Analysis Results */}
          {analyzing ? (
            <div className="glass-card text-center py-12">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-[var(--color-accent)] font-medium">{t('ai.analyzing')}</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">This may take a few seconds...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">📊 Analysis Results</h3>
              {parseAnalysis(analysis).map((section, i) => (
                <div key={i} className={`glass-card !p-4 border-l-4 ${sectionColors[section.title] || 'border-[var(--color-accent)]/50'}`}>
                  <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    {sectionIcons[section.title] || '📝'} {section.title}
                  </h4>
                  <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{section.content.trim()}</p>
                </div>
              ))}
            </div>
          ) : selectedDoc ? (
            <div className="glass-card text-center py-12">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-[var(--color-text-secondary)]">Click a document to analyze it with Claude AI</p>
            </div>
          ) : (
            <div className="glass-card text-center py-16">
              <p className="text-6xl mb-4">🤖</p>
              <p className="text-white text-lg font-medium mb-2">AI Document Analyzer</p>
              <p className="text-[var(--color-text-secondary)]">Select a case and document to get started</p>
            </div>
          )}

          {/* Chat with Document */}
          {selectedDoc && analysis && (
            <div className="glass-card">
              <h3 className="text-sm font-semibold text-white mb-3">💬 {t('documents.chat')}</h3>
              <div className="h-64 overflow-y-auto mb-3 space-y-3 p-3 bg-black/20 rounded-xl">
                {chatMessages.length === 0 && (
                  <p className="text-[var(--color-text-secondary)] text-center text-sm py-8">
                    Ask any question about this document...
                  </p>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-surface-light)] text-[var(--color-text-primary)]'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatting && (
                  <div className="flex justify-start">
                    <div className="bg-[var(--color-surface-light)] rounded-xl px-4 py-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce"></span>
                        <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce" style={{animationDelay: '0.1s'}}></span>
                        <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce" style={{animationDelay: '0.2s'}}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleChat()}
                  placeholder={t('ai.askQuestion')}
                  className="input-field flex-1"
                  disabled={chatting}
                />
                <button onClick={handleChat} disabled={chatting || !chatInput.trim()} className="btn-primary">
                  {t('ai.send')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
