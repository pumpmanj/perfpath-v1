import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import PageHeader from '../components/PageHeader'
import HeartLoader from '../components/HeartLoader'

const ADMIN_ID = '1f7435a2-3ecb-4218-aeb5-569a8e869c08'

const CATEGORIES = [
  'All',
  'Anticoagulation',
  'Priming',
  'Cardioplegia',
  'ECMO',
  'Pediatric',
  'Pharmacology',
  'Emergency',
  'Weaning',
  'General Reference',
]

const CATEGORY_COLORS = {
  'Anticoagulation': '#C0392B',
  'Priming': '#2980B9',
  'Cardioplegia': '#8E44AD',
  'ECMO': '#D35400',
  'Pediatric': '#27AE60',
  'Pharmacology': '#16A085',
  'Emergency': '#C0392B',
  'Weaning': '#2471A3',
  'General Reference': '#566573',
}

const emptyTopicForm = {
  title: '',
  category: '',
  summary: '',
  content: '',
}

export default function ProtocolLibrary() {
  const { user, profile } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const isAdmin = user?.id === ADMIN_ID

  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [showSuggest, setShowSuggest] = useState(false)
  const [form, setForm] = useState(emptyTopicForm)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchTopics() }, [])

  const fetchTopics = async () => {
    setLoading(true)
    let query = supabase
      .from('protocol_topics')
      .select('*')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: true })

    if (!isAdmin) query = query.eq('approved', true)

    const { data } = await query
    if (data) setTopics(data)
    setLoading(false)
  }

  const filteredTopics = useMemo(() => {
    let result = [...topics]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.summary?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      )
    }
    if (filterCategory !== 'All') {
      result = result.filter(t => t.category === filterCategory)
    }
    return result
  }, [topics, search, filterCategory])

  const handleSubmitTopic = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.from('protocol_topics').insert({
      title: form.title,
      category: form.category,
      summary: form.summary,
      content: form.content,
      submitted_by_id: user.id,
      submitted_by_name: profile?.full_name || 'Anonymous',
      approved: isAdmin,
      featured: false,
    })
    if (error) {
      addToast('Submission failed. Try again.', 'error')
    } else {
      addToast(isAdmin ? 'Topic published' : 'Topic suggested — pending review')
      setForm(emptyTopicForm)
      setShowSuggest(false)
      fetchTopics()
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <HeartLoader size={72} text="Loading library..." />
    </div>
  )

  return (
    <div className="animate-fadeInUp">

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <PageHeader title="Protocol Library" currentId="protocols" />
        <button
          onClick={() => setShowSuggest(!showSuggest)}
          className="bg-brand-red text-white font-display font-semibold tracking-widest uppercase text-xs px-5 py-3 hover:bg-red-700 transition-all mt-8 flex-shrink-0"
        >
          {showSuggest ? 'Cancel' : '+ Suggest Topic'}
        </button>
      </div>

      <p className="text-white/40 text-sm font-body mb-4 leading-relaxed">
        Clinical references, protocols, and resources — organized by topic. Tap any card to explore.
      </p>

      {/* Medical disclaimer */}
      <div className="bg-white/5 border border-white/10 px-4 py-3 mb-6 flex items-start gap-3">
        <span className="text-white/30 text-xs mt-0.5 flex-shrink-0">⚠</span>
        <p className="text-white/30 text-xs font-body leading-relaxed">
          Educational reference only. Content in this library is not a substitute for your institution's protocols, clinical training, or professional judgment. Always follow your program's or hospital's established guidelines.
        </p>
      </div>

      {/* Suggest topic form */}
      {showSuggest && (
        <div className="bg-navy-light border border-brand-red/30 p-6 mb-6 animate-fadeInUp">
          <h3 className="text-lg font-display font-semibold tracking-wider uppercase text-white mb-1">
            Suggest a Topic
          </h3>
          <p className="text-white/30 text-xs font-body mb-5">
            {isAdmin ? 'Admin submissions publish immediately.' : 'Suggestions are reviewed before appearing in the library.'}
          </p>
          <form onSubmit={handleSubmitTopic} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-body tracking-widest uppercase text-white/50 mb-2">Topic Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Heparin & ACT Management"
                  required
                  className="w-full bg-navy border border-white/10 text-white placeholder-white/20 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-body tracking-widest uppercase text-white/50 mb-2">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  required
                  className="w-full bg-navy border border-white/10 text-white px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-body tracking-widest uppercase text-white/50 mb-2">One-Line Description</label>
              <input
                type="text"
                value={form.summary}
                onChange={e => setForm({ ...form, summary: e.target.value })}
                placeholder="What does this topic cover?"
                required
                className="w-full bg-navy border border-white/10 text-white placeholder-white/20 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-body tracking-widest uppercase text-white/50 mb-2">
                Content <span className="text-white/20 normal-case tracking-normal">(clinical overview, why it matters, key points)</span>
              </label>
              <textarea
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                placeholder="Provide the clinical context, indications, key considerations, and any important notes..."
                rows={6}
                className="w-full bg-navy border border-white/10 text-white placeholder-white/20 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors resize-none leading-relaxed"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-red text-white font-display font-semibold tracking-widest uppercase py-4 text-sm hover:bg-red-700 transition-all disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : isAdmin ? 'Publish Topic' : 'Submit for Review'}
            </button>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search topics..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-navy-light border border-white/10 text-white placeholder-white/20 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`text-xs font-body tracking-widest uppercase px-3 py-1.5 border transition-all ${
              filterCategory === cat
                ? 'border-brand-red text-brand-red bg-brand-red/10'
                : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white/60'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Admin pending count */}
      {isAdmin && topics.filter(t => !t.approved).length > 0 && (
        <div className="text-brand-red text-xs font-body tracking-widest uppercase mb-3">
          {topics.filter(t => !t.approved).length} pending review
        </div>
      )}

      {/* Topic grid */}
      {filteredTopics.length === 0 ? (
        <div className="border border-white/10 p-16 text-center">
          <div className="text-white/10 text-5xl mb-4">≡</div>
          <div className="text-white font-display font-semibold tracking-wider uppercase text-sm mb-2">
            Library is Being Built
          </div>
          <div className="text-white/40 text-sm font-body leading-relaxed mb-6 max-w-xs mx-auto">
            Be the first to contribute. Suggest a topic and help build the reference library this profession deserves.
          </div>
          <button
            onClick={() => setShowSuggest(true)}
            className="bg-brand-red text-white font-display font-semibold tracking-widest uppercase text-xs px-6 py-3 hover:bg-red-700 transition-all"
          >
            Suggest First Topic
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map(topic => (
            <TopicCard
              key={topic.id}
              topic={topic}
              isAdmin={isAdmin}
              onClick={() => navigate(`/protocols/${topic.id}`)}
              onApprove={async () => {
                await supabase.from('protocol_topics').update({ approved: true }).eq('id', topic.id)
                addToast('Topic approved')
                fetchTopics()
              }}
              onDelete={async () => {
                await supabase.from('protocol_topics').delete().eq('id', topic.id)
                addToast('Topic deleted')
                fetchTopics()
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TopicCard({ topic, isAdmin, onClick, onApprove, onDelete }) {
  const color = CATEGORY_COLORS[topic.category] || '#566573'

  return (
    <div
      className="bg-navy-light border border-white/10 hover:border-white/25 transition-all cursor-pointer group overflow-hidden"
      style={{ borderLeft: `3px solid ${color}` }}
      onClick={onClick}
    >
      <div className="p-5">
        {/* Top */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-body tracking-widest uppercase px-2 py-0.5 border"
              style={{ color, borderColor: `${color}40` }}
            >
              {topic.category}
            </span>
            {topic.featured && (
              <span className="text-xs text-yellow-400/70 font-body">★</span>
            )}
            {isAdmin && !topic.approved && (
              <span className="text-xs text-brand-red font-body tracking-widest uppercase">Pending</span>
            )}
          </div>
          <span className="text-white/20 text-xs group-hover:text-white/50 transition-colors">→</span>
        </div>

        {/* Title */}
        <h3 className="text-white font-display font-semibold tracking-wider uppercase text-sm mb-2 leading-snug group-hover:text-brand-red transition-colors">
          {topic.title}
        </h3>

        {/* Summary */}
        {topic.summary && (
          <p className="text-white/40 text-xs font-body leading-relaxed line-clamp-2">
            {topic.summary}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
          <span className="text-white/20 text-xs font-body">
            Tap to explore →
          </span>
          {isAdmin && !topic.approved && (
            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
              <button
                onClick={onApprove}
                className="text-xs text-green-400 hover:text-green-300 font-body tracking-widest uppercase transition-colors"
              >
                ✓
              </button>
              <button
                onClick={onDelete}
                className="text-xs text-white/20 hover:text-brand-red font-body tracking-widest uppercase transition-colors"
              >
                ✗
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
