import { AlertTriangle, CheckCircle, X } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'info',
  confirmText = '确定',
  cancelText = '取消',
  isLoading = false
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    info: {
      bg: 'bg-primary-500/20',
      border: 'border-primary-500/30',
      icon: 'text-primary-400',
      button: 'bg-primary-500 hover:bg-primary-600 text-white'
    },
    warning: {
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/30',
      icon: 'text-yellow-400',
      button: 'bg-yellow-500 hover:bg-yellow-600 text-black'
    },
    danger: {
      bg: 'bg-red-500/20',
      border: 'border-red-500/30',
      icon: 'text-red-400',
      button: 'bg-red-500 hover:bg-red-600 text-white'
    }
  };

  const style = typeStyles[type] || typeStyles.info;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className={`flex items-center gap-3 p-4 ${style.bg} ${style.border} border-b`}>
          {type === 'warning' ? (
            <AlertTriangle size={24} className={style.icon} />
          ) : type === 'danger' ? (
            <AlertTriangle size={24} className={style.icon} />
          ) : (
            <CheckCircle size={24} className={style.icon} />
          )}
          <h3 className="text-lg font-bold text-white flex-1">{title}</h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="text-slate-300 whitespace-pre-line">{message}</div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-slate-700">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${style.button}`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                处理中...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
