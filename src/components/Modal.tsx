import { X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg overflow-hidden transition-all transform bg-white rounded-lg shadow-xl sm:my-8">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
