export default function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = 'Delete' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-navy-light border border-white/10 p-6 max-w-sm w-full mx-4 animate-fadeInUp">
        <p className="text-white font-body text-sm leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-brand-red text-white font-display font-semibold tracking-widest uppercase text-xs py-4 hover:bg-red-700 transition-all"
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border border-white/20 text-white/60 font-display font-semibold tracking-widest uppercase text-xs py-4 hover:border-white/40 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
