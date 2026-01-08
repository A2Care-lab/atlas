import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import { Shield, Copy, Check, QrCode, AlertCircle } from 'lucide-react';
import QRCode from 'react-qr-code';
import MessageModal from '../components/MessageModal';
import { deriveAccessTokenFromLinkToken } from '../utils/accessToken';

export function NewReport() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRedirectModal, setShowRedirectModal] = useState(false);

  const generateToken = async () => {
    setIsGenerating(true);
    
    const newToken = uuidv4();
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/#/report/${newToken}`;
    
    setToken(deriveAccessTokenFromLinkToken(newToken));
    setReportUrl(url);
    setIsGenerating(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(reportUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy token: ', err);
    }
  };

  const handleOpenForm = () => {
    setShowRedirectModal(true);
  };

  const confirmRedirect = () => {
    setShowRedirectModal(false);
    window.open(reportUrl, '_blank');
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Registrar um Relato</h1>
      </div>
      <p className="text-sm text-gray-500">Você pode abrir uma nova denúncia de forma sigilosa e protegida.</p>

      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          {!token ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-petroleo-100">
                <Shield className="h-6 w-6 text-petroleo-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Gerar Link Seguro
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Clique no botão abaixo para gerar um link único e seguro para sua denúncia.
                Este link conterá um token de acesso que garante a segurança do processo.
              </p>
              <div className="mt-6">
                <button
                  onClick={generateToken}
                  disabled={isGenerating}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-petroleo-600 hover:bg-petroleo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petroleo-500 disabled:opacity-50"
                >
                  {isGenerating ? 'Gerando...' : 'Gerar Link de Denúncia'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Alert informativo */}
              <div className="bg-petroleo-50 border border-petroleo-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-petroleo-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-petroleo-800">
                      Importante: Mantenha este link seguro
                    </h3>
                    <div className="mt-2 text-sm text-petroleo-700">
                      <p>
                        Este link e token são únicos para sua denúncia. Você pode:
                      </p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Copiar o endereço do link abaixo para abrir esse link em outra aba ou dispositivo</li>
                        <li>Salvar o link em local seguro para preencher mais tarde</li>
                        <li>Clicar no botão Abrir Formulário e você será direcionado para uma página externa para preencher o formulário com confidencialidade e segurança</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Link da denúncia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link da Denúncia
                </label>
                <div className="flex rounded-md shadow-sm">
                  <input
                    type="text"
                    value={reportUrl}
                    readOnly
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 bg-gray-50 text-gray-900 text-sm"
                  />
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Token */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token de Acesso
                </label>
                <div className="flex rounded-md shadow-sm">
                  <input
                    type="text"
                    value={token}
                    readOnly
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 bg-gray-50 text-gray-900 text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={copyToken}
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Você precisará deste token para acessar o formulário de denúncia
                </p>
              </div>

              {/* QR Code */}
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Ou escaneie o QR Code:</p>
                <div className="inline-flex items-center justify-center p-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                  <QRCode value={reportUrl} size={128} bgColor="#f9fafb" fgColor="#111827" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleOpenForm}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Abrir Formulário
                </button>
                <button
                  onClick={() => navigate('/my-reports')}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petroleo-500"
                >
                  Voltar para Minhas Denúncias
                </button>
              </div>

              {/* Modal de redirecionamento */}
              <MessageModal
                open={showRedirectModal}
                title="Você será direcionado para outra página"
                message="Para garantir o sigilo e o anonimato, o formulário de denúncia será aberto em uma nova aba fora do sistema."
                variant="info"
                onClose={confirmRedirect}
                actions={<button onClick={() => setShowRedirectModal(false)} className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Cancelar</button>}
              />
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
