import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import HeartLoader from '../components/HeartLoader'

const ADMIN_ID = '1f7435a2-3ecb-4218-aeb5-569a8e869c08'

const RESOURCE_TYPES = [
  { id: 'article', label: 'Article', icon: '📄', color: '#2980B9' },
  { id: 'video', label: 'Video', icon: '🎥', color: '#8E44AD' },
  { id: 'book', label: 'Book / Reference', icon: '📚', color: '#D4A017' },
]

const emptyResourceForm = {
  resource_type: '',
  title: '',
  description: '',
  url: '',
  source_name: '',
  author: '',
}

export default function ProtocolTopicDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { addToast } = useToast()
  const isAdmin = user?.id === ADMIN_ID

  const [topic, setTopic] = useState(null)
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [showResourceForm, setShowResourceForm] = useState(false)
  const [form, setForm] = useState(emptyResourceForm)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchData() }, [id])

  const fetchData = async () => {
    setLoading(true)
    const [topicRes, resourcesRes] = await Promise.all([
      supabase.from('protocol_topics').select('*').eq('id', id).single(),
      isAdmin
        ? supabase.from('protocol_resources').select('*').eq('topic_id', id).order('created_at', { ascending: true })
        : supabase.from('protocol_resources').select('*').eq('topic_id', id).eq('approved', true).order('created_at', { ascending: true })
    ])
    if (topicRes.data) setTopic(topicRes.data)
    if (resourcesRes.data) setResources(resourcesRes.data)
    setLoading(false)
  }

  const handleSubmitResource = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.from('protocol_resources').insert({
      topic_id: id,
      resource_type: form.resource_type,
      title: form.title,
      description: form.description,
      url: form.url,
      source_name: form.source_name,
      author: form.author,
      submitted_by_id: user.id,
      submitted_by_name: profile?.full_name || 'Anonymous',
      approved: isAdmin,
    })
    if (error) {
      addToast('Submission failed. Try again.', 'error')
    } else {
      addToast(isAdmin ? 'Resource added' : 'Resource submitted — pending review')
      setForm(emptyResourceForm)
      setShowResourceForm(false)
      fetchData()
    }
    setSubmitting(false)
  }

  const approveResource = async (resourceId) => {
    await supabase.from('protocol_resources').update({ approved: true }).eq('id', resourceId)
    addToast('Resource approved')
    fetchData()
  }

  const deleteResource = async (resourceId) => {
    await supabase.from('protocol_resources').delete().eq('id', resourceId)
    addToast('Resource deleted')
    fetchData()
  }

  const resourcesByType = (type) => resources.filter(r => r.resource_type === type)

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <HeartLoader size={72} text="Loading topic..." />
    </div>
  )

  if (!topic) return (
    <div className="text-center py-20">
      <div className="text-white/30 text-sm font-body">Topic not found.</div>
      <button onClick={() => navigate('/protocols')} className="text-brand-red text-xs font-body tracking-widest uppercase mt-4 hover:text-red-400 transition-colors">
        ← Protocol Library
      </button>
    </div>
  )

  return (
    <div className="animate-fadeInUp max-w-3xl">

      {/* Back */}
      <button
        onClick={() => navigate('/protocols')}
        className="flex items-center gap-2 text-xs text-white/30 hover:text-white font-body tracking-widest uppercase transition-colors mb-6"
      >
        ← Protocol Library
      </button>

      {/* Topic header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-body tracking-widest uppercase text-brand-red border border-brand-red/30 px-2 py-0.5">
            {topic.category}
          </span>
          {topic.featured && <span className="text-yellow-400/70 text-xs">★ Featured</span>}
        </div>
        <h2 className="text-3xl font-display font-semibold tracking-wider uppercase text-white mb-2">
          {topic.title}
        </h2>
        <div className="w-8 h-0.5 bg-brand-red" />
        {topic.summary && (
          <p className="text-white/50 text-sm font-body leading-relaxed mt-3">
            {topic.summary}
          </p>
        )}
      </div>

      {/* Content */}
      {topic.content && (
        <div className="bg-navy-light border border-white/10 p-6 mb-4"
          style={{ borderLeft: '3px solid #C0392B' }}>
          <div className="text-xs font-body tracking-widest uppercase text-white/30 mb-4">Clinical Overview</div>
          <div className="text-white/70 text-sm font-body leading-relaxed whitespace-pre-wrap">
            {topic.content}
          </div>
          {topic.submitted_by_name && (
            <div className="text-white/20 text-xs font-body mt-4 pt-4 border-t border-white/5">
              Contributed by {topic.submitted_by_name}
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-white/5 border border-white/10 px-4 py-3 mb-6 flex items-start gap-3">
        <span className="text-white/30 text-xs mt-0.5 flex-shrink-0">⚠</span>
        <p className="text-white/30 text-xs font-body leading-relaxed">
          Educational reference only. This content is not a substitute for your institution's protocols, clinical training, or professional judgment. Always follow your program's or hospital's established guidelines.
        </p>
      </div>

      {/* Resources section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-display font-semibold tracking-wider uppercase text-white">
              Resources
            </h3>
            <p className="text-white/30 text-xs font-body mt-1">
              Articles, videos, and references to go deeper on this topic.
            </p>
          </div>
          <button
            onClick={() => setShowResourceForm(!showResourceForm)}
            className="bg-brand-red text-white font-display font-semibold tracking-widest uppercase text-xs px-4 py-2.5 hover:bg-red-700 transition-all flex-shrink-0"
          >
            {showResourceForm ? 'Cancel' : '+ Submit Resource'}
          </button>
        </div>

        {/* Submit resource form */}
        {showResourceForm && (
          <div className="bg-navy-light border border-brand-red/30 p-6 mb-6 animate-fadeInUp">
            <h4 className="text-sm font-display font-semibold tracking-wider uppercase text-white mb-4">
              Submit a Resource
            </h4>
            <form onSubmit={handleSubmitResource} className="space-y-4">
              {/* Resource type selector */}
              <div>
                <label className="block text-xs font-body tracking-widest uppercase text-white/50 mb-2">Resource Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {RESOURCE_TYPES.map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setForm({ ...form, resource_type: type.id })}
                      className={`p-3 border text-center transition-all ${
                        form.resource_type === type.id
                          ? 'border-brand-red bg-brand-red/10'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="text-lg mb-1">{type.icon}</div>
                      <div className="text-xs font-body tracking-widest uppercase text-white/60">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {form.resource_type && (
                <>
                  <div>
                    <label className="block text-xs font-body tracking-widest uppercase text-white/50 mb-2">Title</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder="Title of the resource"
                      required
                      className="w-full bg-navy border border-white/10 text-white placeholder-white/20 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-body tracking-widest uppercase text-white/50 mb-2">Brief Description</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Why is this resource useful for this topic?"
                      rows={3}
                      className="w-full bg-navy border border-white/10 text-white placeholder-white/20 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-body tracking-widest uppercase text-white/50 mb-2">
                        {form.resource_type === 'book' ? 'ISBN or Publisher Link' : 'URL'}
                      </label>
                      <input
                        type="text"
                        value={form.url}
                        onChange={e => setForm({ ...form, url: e.target.value })}
                        placeholder={form.resource_type === 'video' ? 'YouTube URL' : 'https://...'}
                        className="w-full bg-navy border border-white/10 text-white placeholder-white/20 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-body tracking-widest uppercase text-white/50 mb-2">
                        {form.resource_type === 'book' ? 'Book Title' : form.resource_type === 'video' ? 'Channel Name' : 'Publication / Journal'}
                      </label>
                      <input
                        type="text"
                        value={form.source_name}
                        onChange={e => setForm({ ...form, source_name: e.target.value })}
                        placeholder={form.resource_type === 'book' ? 'e.g. Gravlee Cardiopulmonary Bypass' : form.resource_type === 'video' ? 'e.g. PerfusionU' : 'e.g. Perfusion Journal'}
                        className="w-full bg-navy border border-white/10 text-white placeholder-white/20 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-body tracking-widest uppercase text-white/50 mb-2">Author</label>
                    <input
                      type="text"
                      value={form.author}
                      onChange={e => setForm({ ...form, author: e.target.value })}
                      placeholder="Author or creator name"
                      className="w-full bg-navy border border-white/10 text-white placeholder-white/20 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !form.title}
                    className="w-full bg-brand-red text-white font-display font-semibold tracking-widest uppercase py-4 text-sm hover:bg-red-700 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : isAdmin ? 'Add Resource' : 'Submit for Review'}
                  </button>
                </>
              )}
            </form>
          </div>
        )}

        {/* Resource sections by type */}
        <div className="space-y-6">
          {RESOURCE_TYPES.map(type => {
            const typeResources = resourcesByType(type.id)
            const pendingCount = isAdmin ? resources.filter(r => r.resource_type === type.id && !r.approved).length : 0

            return (
              <div key={type.id}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-base">{type.icon}</span>
                  <span className="text-xs font-body tracking-widest uppercase text-white/50">
                    {type.label}
                  </span>
                  {typeResources.length > 0 && (
                    <span className="text-xs text-white/20 font-body">({typeResources.length})</span>
                  )}
                  {pendingCount > 0 && (
                    <span className="text-xs text-brand-red font-body">{pendingCount} pending</span>
                  )}
                </div>

                {typeResources.length === 0 ? (
                  <div className="border border-white/5 border-dashed p-5 text-center">
                    <p className="text-white/20 text-xs font-body">
                      No {type.label.toLowerCase()}s yet.{' '}
                      <button
                        onClick={() => { setShowResourceForm(true); setForm({ ...emptyResourceForm, resource_type: type.id }) }}
                        className="text-brand-red hover:text-red-400 transition-colors"
                      >
                        Submit one →
                      </button>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {typeResources.map(resource => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        isAdmin={isAdmin}
                        color={type.color}
                        onApprove={() => approveResource(resource.id)}
                        onDelete={() => deleteResource(resource.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ResourceCard({ resource, isAdmin, color, onApprove, onDelete }) {
  return (
    <div className={`bg-navy-light border p-4 ${!resource.approved ? 'border-brand-red/20' : 'border-white/10'}`}
      style={{ borderLeft: `2px solid ${color}` }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {!resource.approved && isAdmin && (
              <span className="text-xs text-brand-red font-body tracking-widest uppercase">Pending</span>
            )}
          </div>
          <div className="text-white font-body font-medium text-sm mb-1">{resource.title}</div>
          {resource.description && (
            <p className="text-white/40 text-xs font-body leading-relaxed mb-2">{resource.description}</p>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            {resource.source_name && (
              <span className="text-white/25 text-xs font-body">{resource.source_name}</span>
            )}
            {resource.author && (
              <span className="text-white/25 text-xs font-body">by {resource.author}</span>
            )}
            {resource.submitted_by_name && (
              <span className="text-white/20 text-xs font-body">· Submitted by {resource.submitted_by_name}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {resource.url && (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-body tracking-widest uppercase border border-white/10 text-white/40 px-3 py-1.5 hover:border-white/30 hover:text-white transition-all"
              onClick={e => e.stopPropagation()}
            >
              Open →
            </a>
          )}
          {isAdmin && (
            <div className="flex gap-2">
              {!resource.approved && (
                <button onClick={onApprove} className="text-xs text-green-400 hover:text-green-300 font-body transition-colors">✓</button>
              )}
              <button onClick={onDelete} className="text-xs text-white/20 hover:text-brand-red font-body transition-colors">✗</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
