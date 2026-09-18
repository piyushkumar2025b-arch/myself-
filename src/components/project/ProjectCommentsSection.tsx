import React, { useState, useEffect } from 'react';
import { ProjectComment } from '../../types/portfolio';
import { ProjectCommentService } from '../../services/projectCommentService';
import { AuthService } from '../../services/authService';
import { MessageSquare, Send, CheckCircle2, AlertCircle, Loader2, ShieldCheck, User, Trash2 } from 'lucide-react';

interface ProjectCommentsSectionProps {
  projectId: string;
  initialComments?: ProjectComment[];
}

export const ProjectCommentsSection: React.FC<ProjectCommentsSectionProps> = ({
  projectId,
  initialComments = [],
}) => {
  const [comments, setComments] = useState<ProjectComment[]>(initialComments);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    AuthService.getCurrentState().then((s) => setIsAdmin(s.isAuthenticated && s.isAdmin));
    const unsubscribe = AuthService.onAuthStateChange((s) => setIsAdmin(s.isAuthenticated && s.isAdmin));
    return () => unsubscribe();
  }, []);
  
  // Form State
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch comments
  useEffect(() => {
    let isMounted = true;
    const loadComments = async () => {
      setLoading(true);
      try {
        const approved = await ProjectCommentService.getApprovedComments(projectId);
        if (isMounted) {
          setComments(approved);
        }
      } catch (err) {
        console.warn('Error loading comments:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadComments();
    return () => { isMounted = false; };
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const res = await ProjectCommentService.submitComment(
        projectId,
        authorName,
        authorEmail,
        commentText
      );

      if (res.success) {
        setSuccessMessage(res.message || 'Comment submitted for moderation!');
        setAuthorName('');
        setAuthorEmail('');
        setCommentText('');
      } else {
        setErrorMessage(res.error || 'Failed to submit comment. Please check your inputs.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-6 pt-6 border-t border-white/10">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span>Feedback & Comments ({comments.length})</span>
        </h3>
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" />
          <span>Moderated</span>
        </span>
      </div>

      {/* Existing Comments List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center p-6 text-slate-500 text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Loading comments...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="p-5 rounded-xl bg-[#0a0d14] border border-white/5 text-center text-slate-400 text-xs">
            No comments yet. Be the first to share your thoughts or technical feedback!
          </div>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-xl bg-[#0f131f] border border-white/5 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 text-xs font-bold">
                    {c.authorName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-slate-200">{c.authorName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">{formatDate(c.createdAt)}</span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm(`Admin: Permanently delete comment from "${c.authorName}"?`)) {
                          await ProjectCommentService.deleteComment(c.id);
                          setComments((prev) => prev.filter((item) => item.id !== c.id));
                        }
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Admin: Delete comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap pl-8">
                {c.comment}
              </p>
            </div>
          ))
        )}
      </div>

      {/* New Comment Submission Form */}
      <div className="p-5 rounded-2xl bg-[#090c13] border border-white/10 space-y-4">
        <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-emerald-400" />
          <span>Leave a Comment</span>
        </div>

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Your Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={60}
                placeholder="Jane Doe"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#121624] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Your Email <span className="text-red-400">*</span> <span className="text-slate-500 font-normal">(Never published)</span>
              </label>
              <input
                type="email"
                required
                maxLength={100}
                placeholder="jane@example.com"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#121624] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-medium text-slate-400">
                Comment <span className="text-red-400">*</span>
              </label>
              <span className="text-[10px] text-slate-500">{commentText.length}/2000</span>
            </div>
            <textarea
              required
              rows={3}
              maxLength={2000}
              placeholder="Share constructive feedback, questions about architecture, or thoughts on this project..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#121624] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Comments are reviewed prior to public display</span>
            </span>
            <button
              type="submit"
              disabled={submitting || !authorName.trim() || !authorEmail.trim() || !commentText.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{submitting ? 'Submitting...' : 'Post Comment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
