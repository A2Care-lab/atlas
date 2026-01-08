import { useState, useEffect } from 'react';
import { Save, ScrollText } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useRef } from 'react';
import Quill from 'quill';
const Parchment: any = Quill.import('parchment');

const LineHeight = new Parchment.Attributor.Style('lineheight', 'line-height', { scope: Parchment.Scope.BLOCK, whitelist: ['1', '1.15', '1.5', '2', '2.5'] });
const ParagraphSpacing = new Parchment.Attributor.Style('paragraphspacing', 'margin-bottom', { scope: Parchment.Scope.BLOCK, whitelist: ['0', '0.5em', '1em', '1.5em', '2em'] });
Quill.register(LineHeight, true);
Quill.register(ParagraphSpacing, true);
import SettingsHeader from '../components/SettingsHeader';
import SettingsTabs from '../components/SettingsTabs';
import { usePoliticaNaoRetaliacao } from '../hooks/usePoliticaNaoRetaliacao';
import CompareModal from '../components/CompareModal';
import { HtmlModal } from '../components/HtmlModal';
import InputModal from '../components/InputModal';

export default function PoliticaNaoRetaliacaoPage2() {
  const { politica, savePolitica, versions, restoreVersion, refetch } = usePoliticaNaoRetaliacao();
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [justification, setJustification] = useState('');
  const [viewVersionId, setViewVersionId] = useState<string | null>(null);
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const quillRef = useRef<any>(null);
  const [filterText, setFilterText] = useState('');
  const [filterAuthor, setFilterAuthor] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);

  useEffect(() => {
    if (politica?.content) setContent(politica.content);
  }, [politica]);

  const handlePaste = async () => {
    try {
      if ('read' in navigator.clipboard) {
        const items = await (navigator.clipboard as any).read();
        for (const item of items) {
          const htmlType = item.types.find((t: string) => t === 'text/html');
          const textType = item.types.find((t: string) => t === 'text/plain');
          if (htmlType) {
            const blob = await item.getType('text/html');
            const html = await blob.text();
            const editor = quillRef.current?.getEditor();
            const range = editor?.getSelection(true) || { index: editor?.getLength() || 0 };
            editor?.clipboard.dangerouslyPasteHTML(range.index, html);
            return;
          } else if (textType) {
            const blob = await item.getType('text/plain');
            const text = await blob.text();
            setContent((prev) => prev + text);
            return;
          }
        }
      }
      const text = await navigator.clipboard.readText();
      setContent((prev) => prev + text);
    } catch {}
  };

  const handleSave = async () => {
    setIsSaving(true);
    await savePolitica(content, justification);
    setIsSaving(false);
    setJustification('');
    await refetch();
  };

  const filtered = versions.filter(v => {
    const q = filterText.toLowerCase();
    const matchText = filterText ? (v.justification?.toLowerCase().includes(q) || v.content.toLowerCase().includes(q)) : true;
    const qa = filterAuthor.toLowerCase();
    const matchAuthor = filterAuthor ? ((v.author_email ?? '').toLowerCase().includes(qa) || (v.author_name ?? '').toLowerCase().includes(qa)) : true;
    const date = new Date(v.updated_at).getTime();
    const matchStart = filterStart ? date >= new Date(filterStart).getTime() : true;
    const matchEnd = filterEnd ? date <= new Date(filterEnd).getTime() : true;
    return matchText && matchAuthor && matchStart && matchEnd;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageStart = (page - 1) * pageSize;
  const pageItems = filtered.slice(pageStart, pageStart + pageSize);

  return (
    <div className="space-y-6">
      <SettingsHeader />
      <SettingsTabs />
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
          <ScrollText className="mr-2 h-5 w-5" />
          Gestão da Política de Não Retaliação
        </h2>
        <p className="text-gray-600">
          Crie, edite e mantenha a política de não retaliação aplicada às empresas vinculadas ao sistema.
        </p>

        <div className="mt-6 space-y-4">
          <div className="flex space-x-2 mb-2">
            <button
              onClick={handlePaste}
              className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Colar
            </button>
          </div>
          <div className="bg-white border border-gray-300 rounded-md">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={setContent}
              placeholder="Digite ou cole o conteúdo da política de não retaliação aqui..."
              modules={{
                toolbar: [
                  [{ font: [] }],
                  [{ size: ['small', false, 'large', 'huge'] }],
                  [{ lineheight: ['1', '1.15', '1.5', '2', '2.5'] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ color: [] }, { background: [] }],
                  [{ header: 1 }, { header: 2 }],
                  [{ paragraphspacing: ['0', '0.5em', '1em', '1.5em', '2em'] }],
                  [{ align: [] }],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  [{ indent: '-1' }, { indent: '+1' }],
                  ['blockquote', 'code-block'],
                  ['link'],
                  ['clean']
                ]
              }}
              formats={[
                'header','font','size','lineheight','paragraphspacing','bold','italic','underline','strike','color','background','list','bullet','indent','align','blockquote','code-block','link'
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Justificativa da alteração</label>
            <textarea
              rows={4}
              className="shadow-sm focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Descreva o motivo da alteração realizada"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving || !content.trim() || !justification.trim()}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isSaving || !content.trim() || !justification.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500'
              }`}
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar Política
            </button>
          </div>

          <div className="pt-8">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Histórico de versões</h3>
            <div className="bg-white p-4 rounded border border-gray-200 mb-3">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Busca por texto/justificativa</label>
                  <input value={filterText} onChange={(e)=>setFilterText(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded" placeholder="Digite para filtrar" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Autor</label>
                  <input value={filterAuthor} onChange={(e)=>setFilterAuthor(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded" placeholder="E-mail ou Nome" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Início</label>
                  <input type="date" value={filterStart} onChange={(e)=>setFilterStart(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fim</label>
                  <input type="date" value={filterEnd} onChange={(e)=>setFilterEnd(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded" />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Versão</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Atualizado em</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Autor</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Justificativa</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Selecionar</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pageItems.map(v => {
                    const isCurrent = politica?.id === v.id;
                    return (
                    <tr key={v.id} className={isCurrent ? 'bg-teal-50' : ''}>
                      <td className="px-3 py-2">{v.version_code}{isCurrent && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">Atual</span>}</td>
                      <td className="px-3 py-2">{new Date(v.updated_at).toLocaleString('pt-BR')}</td>
                      <td className="px-3 py-2">{v.author_name || v.author_email || v.updated_by || '—'}</td>
                      <td className="px-3 py-2 max-w-md truncate" title={v.justification}>{v.justification}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-1">
                            <input type="radio" name="compareA" checked={compareA === v.id} onChange={() => setCompareA(v.id)} />
                            <span className="text-xs text-gray-600">A</span>
                          </label>
                          <label className="inline-flex items-center gap-1">
                            <input type="radio" name="compareB" checked={compareB === v.id} onChange={() => setCompareB(v.id)} />
                            <span className="text-xs text-gray-600">B</span>
                          </label>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => setViewVersionId(v.id)} className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:bg-gray-50">Visualizar</button>
                          <button onClick={() => { setContent(v.content); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:bg-gray-50">Editar</button>
                          <button
                            onClick={() => setShowCompare(true)}
                            disabled={!compareA || !compareB}
                            className={`px-2 py-1 text-xs rounded ${(!compareA || !compareB) ? 'bg-gray-200 text-gray-500' : 'border border-gray-300 bg-white hover:bg-gray-50'}`}
                          >Comparar</button>
                          {!isCurrent && (
                            <button
                              onClick={() => { setRestoreId(v.id); setRestoreOpen(true); }}
                              className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:bg-gray-50"
                            >Restaurar Como Atual</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="text-xs text-gray-600">Página {page} de {Math.max(1, Math.ceil(filtered.length / pageSize))} • {filtered.length} versão(ões)</div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-700">Itens por página</label>
                <select value={pageSize} onChange={(e)=>{ setPage(1); setPageSize(Number(e.target.value)); }} className="px-2 py-1 border border-gray-300 rounded text-xs">
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
                <button onClick={()=> setPage(Math.max(1, page-1))} className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:bg-gray-50">Anterior</button>
                <button onClick={()=> setPage(Math.min(Math.max(1, Math.ceil(filtered.length / pageSize)), page+1))} className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:bg-gray-50">Próxima</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <HtmlModal
        open={!!viewVersionId}
        title={`Versão ${versions.find(v => v.id === viewVersionId)?.version_code ?? ''}`}
        html={(versions.find(v => v.id === viewVersionId)?.content ?? '')}
        footer={`Justificativa: ${(versions.find(v => v.id === viewVersionId)?.justification ?? '').trim()}`}
        onClose={() => setViewVersionId(null)}
      />

      <CompareModal
        open={showCompare && !!compareA && !!compareB}
        leftTitle={`Versão ${versions.find(v => v.id === compareA)?.version_code ?? ''}`}
        rightTitle={`Versão ${versions.find(v => v.id === compareB)?.version_code ?? ''}`}
        leftUpdatedAt={`${new Date(versions.find(v => v.id === compareA)?.updated_at ?? Date.now()).toLocaleString('pt-BR')}`}
        rightUpdatedAt={`${new Date(versions.find(v => v.id === compareB)?.updated_at ?? Date.now()).toLocaleString('pt-BR')}`}
        leftHtml={(versions.find(v => v.id === compareA)?.content ?? '')}
        rightHtml={(versions.find(v => v.id === compareB)?.content ?? '')}
        onClose={() => setShowCompare(false)}
      />

      <InputModal
        open={restoreOpen}
        title="Restaurar Como Atual"
        label="Justificativa"
        placeholder="Descreva o motivo da restauração"
        confirmText="Restaurar"
        cancelText="Cancelar"
        onConfirm={async (motivo) => {
          if (!restoreId) return;
          await restoreVersion(restoreId, motivo);
          setRestoreOpen(false);
          setRestoreId(null);
          await refetch();
        }}
        onClose={() => { setRestoreOpen(false); setRestoreId(null); }}
      />
    </div>
  );
}
