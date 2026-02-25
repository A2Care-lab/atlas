import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface CorporateAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  initialName?: string;
  title: string;
}

export function CorporateAreaModal({
  isOpen,
  onClose,
  onSave,
  initialName = '',
  title
}: CorporateAreaModalProps) {
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(initialName);
    setError(null);
  }, [initialName, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('O nome da área é obrigatório');
      return;
    }

    if (name.length > 100) {
      setError('O nome da área deve ter no máximo 100 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(name.trim());
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar área');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">{title}</h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="area-name" className="block text-sm font-medium text-gray-400 mb-1">
              Nome da Área
            </label>
            <input
              id="area-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              disabled={loading}
              className="block w-full px-3 py-2 border border-white/10 bg-white/5 rounded-lg text-sm text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-500"
              placeholder="Digite o nome da área corporativa"
              maxLength={100}
              autoFocus
            />
            {error && (
              <p className="mt-1 text-sm text-red-400">{error}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {name.length}/100 caracteres
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-sky-600 border border-transparent rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </div>
              ) : (
                'Salvar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
