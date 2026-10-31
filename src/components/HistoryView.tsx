import React, { useState } from 'react';
import {
  History,
  Search,
  Trash2,
  Download,
  Filter,
  MessageSquare,
  Image as ImageIcon,
  Film,
  Music,
  Code,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { HistoryItem, NavTab } from '../types';

interface HistoryViewProps {
  history: HistoryItem[];
  onClearHistory: () => void;
  onNavigate: (tab: NavTab) => void;
  theme: 'dark' | 'light';
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onClearHistory,
  onNavigate,
  theme
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const typeIcons: Record<string, React.ElementType> = {
    chat: MessageSquare,
    image: ImageIcon,
    video: Film,
    audio: Music,
    code: Code,
    doc: FileText
  };

  const typeColors: Record<string, string> = {
    chat: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    image: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    video: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    audio: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    code: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    doc: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
  };

  const filteredHistory = history.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const exportHistoryJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ogoo-history-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleOpenItem = (item: HistoryItem) => {
    if (item.type === 'chat') onNavigate('chat');
    else if (item.type === 'image') onNavigate('image');
    else if (item.type === 'video') onNavigate('video');
    else onNavigate('tools');
  };

  return (
    <div id="ogoo-history-view" className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-3xl border border-blue-500/20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-300">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-base md:text-lg text-white">
              Neural Memory & Creation Repository
            </h2>
            <p className="text-xs text-slate-400">
              Universal local cache of chats, generated media, synthetic audio, and code pipelines.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportHistoryJSON}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>
          <button
            type="button"
            onClick={onClearHistory}
            className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-red-500/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Memory</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search prompt, model, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#0b0f19] border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400 font-mono"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {['all', 'chat', 'image', 'video', 'code', 'audio'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-mono uppercase font-semibold border transition-all cursor-pointer ${
                filterType === f
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* History Items Grid / List */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-white/5 text-center space-y-3">
            <History className="w-10 h-10 text-slate-500 mx-auto stroke-1" />
            <h4 className="text-sm font-semibold text-white">No creation records found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Synthesize an image, talk with Quantum Chat, or compose music to automatically populate neural history.
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const Icon = typeIcons[item.type] || FileText;
            const colorClass = typeColors[item.type] || 'text-slate-400 bg-white/5 border-white/5';
            return (
              <div
                key={item.id}
                onClick={() => handleOpenItem(item)}
                className="group p-4 rounded-2xl bg-[#0b0f19]/80 hover:bg-[#0d1322] border border-white/10 hover:border-cyan-500/40 transition-all cursor-pointer shadow-md flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white group-hover:text-cyan-300 transition-colors truncate">
                        {item.title}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 uppercase">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{item.summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{item.timestamp}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-cyan-500/20 text-slate-400 group-hover:text-cyan-300 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
