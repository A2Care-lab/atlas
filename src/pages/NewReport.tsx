import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseUrl } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import { Shield, Copy, Check, QrCode, AlertCircle, Info } from 'lucide-react';
import QRCode from 'react-qr-code';
import MessageModal from '../components/MessageModal';
import { deriveAccessTokenFromLinkToken } from '../utils/accessToken';
import { ReportForm } from './ReportForm';
import { FloatingWhatsAppButton } from '../components/FloatingWhatsAppButton';
import { SupportChatbot } from '../components/SupportChatbot';

export function NewReport() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [crmOpenModal, setCrmOpenModal] = useState(false);
  const [crmLinkCode, setCrmLinkCode] = useState('');
  const [crmAccessToken, setCrmAccessToken] = useState('');
  const [crmErrorOpen, setCrmErrorOpen] = useState(false);
  const [crmErrorMsg, setCrmErrorMsg] = useState('');
  const [crmDiagOpen, setCrmDiagOpen] = useState(false);
  const [crmDiagMsg, setCrmDiagMsg] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoCompanies, setInfoCompanies] = useState<{id:string,name:string}[]>([]);
  const [crmFormOpen, setCrmFormOpen] = useState(false);
  const [crmFormToken, setCrmFormToken] = useState<string>('');
  const [crmFormAccess, setCrmFormAccess] = useState<string>('');
  const [crmFormCompanyName, setCrmFormCompanyName] = useState<string>('');
  const [crmFormProtocol, setCrmFormProtocol] = useState<string>('');

  const generateToken = async () => {
    setIsGenerating(true);
    
    const newToken = uuidv4();
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/#/report/${newToken}`;
    
    const access = deriveAccessTokenFromLinkToken(newToken);
    try {
      await supabase.from('report_tokens_pending').insert({
        link_token: newToken,
        access_token: access,
        user_id: (profile as any)?.id || null,
        email: (profile as any)?.email || null,
        company_id: (profile as any)?.company_id || null,
      });
      setToken(access);
      setReportUrl(url);
    } catch (err) {
      setToken('');
      setReportUrl('');
      setCrmErrorMsg('Falha ao registrar o token no servidor. Tente novamente.');
      setCrmErrorOpen(true);
    }
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
      {/* <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Registrar um Relato</h1>
      </div> */}
      <p className="text-sm text-gray-400 ml-1">Você pode abrir uma nova denúncia de forma sigilosa e protegida.</p>

      <div className="max-w-5xl mx-auto mt-8">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="p-8">
          {profile.role === 'crm_n1' ? (
            <div className="space-y-8">
              <div className="absolute top-4 right-4">
                <button
                  onMouseEnter={async ()=>{
                    try {
                      const ids = new Set<string>();
                      if ((profile as any)?.company_id) ids.add((profile as any).company_id);
                      const { data: extra } = await supabase
                        .from('crm_n1_company_access')
                        .select('company_id')
                        .eq('user_id', (profile as any)?.id || '')
                      ;(extra || []).forEach((r:any)=> ids.add(r.company_id));
                      const listIds = Array.from(ids);
                      if (listIds.length > 0) {
                        const { data: comps } = await supabase
                          .from('companies')
                          .select('id,name')
                          .in('id', listIds as any)
                        setInfoCompanies((comps as any[]) || []);
                      } else {
                        setInfoCompanies([]);
                      }
                      setInfoOpen(true);
                    } catch {
                      setInfoCompanies([]);
                      setInfoOpen(true);
                    }
                  }}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/20 text-sky-400 bg-white/5 hover:bg-white/10 transition-colors"
                  title="Empresas autorizadas"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-sky-500/10 mb-6">
                   <Shield className="h-8 w-8 text-sky-400" />
                </div>
                <h3 className="mt-1 text-2xl font-bold text-white">Nova Denúncia (CRM - N1)</h3>
                <p className="mt-3 text-base text-gray-400 max-w-md mx-auto">Para abrir o formulário, solicite apenas o Token de Acesso do usuário.</p>
                <div className="mt-8">
                  <button
                    onClick={() => setCrmOpenModal(true)}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-lg shadow-sky-900/20 text-white bg-sky-600 hover:bg-sky-500 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500"
                  >
                    Nova Denúncia
                  </button>
                </div>
              </div>
              <MessageModal
                open={infoOpen}
                title="Empresas autorizadas"
                message={
                  <div>
                    {infoCompanies.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {infoCompanies.map(c=>(
                          <li key={c.id} className="text-gray-900">{c.name}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-gray-700">Nenhuma empresa vinculada; verifique suas permissões.</div>
                    )}
                  </div>
                }
                variant="info"
                onClose={()=>setInfoOpen(false)}
              />
              <MessageModal
                open={crmOpenModal}
                title="Validar Token para Abertura"
                message={
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-700">Token de Acesso</label>
                      <input
                        type="text"
                        value={crmAccessToken}
                        onChange={(e)=>setCrmAccessToken(e.target.value)}
                        placeholder="Informe o token fornecido pelo usuário"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
                      />
                    </div>
                  </div>
                }
                variant="info"
                onClose={() => setCrmOpenModal(false)}
                actions={
                  <div className="flex gap-2">
                    <button onClick={()=>setCrmOpenModal(false)} className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Cancelar</button>
                    <button
                      onClick={async ()=>{
                        const raw = crmAccessToken.trim();
                        if (!raw) {
                          setCrmErrorMsg('Informe o Token de Acesso fornecido pelo usuário.');
                          setCrmErrorOpen(true);
                          return;
                        }
                        try {
                          const { error: sanityError } = await supabase
                            .from('report_tokens_pending')
                            .select('id')
                            .limit(1);
                          if (sanityError && /does not exist|not found|relation .* report_tokens_pending/i.test(String(sanityError.message || ''))) {
                            setCrmErrorMsg('Falha de ambiente: base Supabase incorreta ou migrações não aplicadas. Configure VITE_SUPABASE_URL/KEY para o projeto correto.');
                            setCrmErrorOpen(true);
                            return;
                          }
                          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw);
                          let tok = raw.toLowerCase();
                          let row: any = null;
                          let linkTok: string | null = null;
                          if (!isUuid) {
                            const { data: rpcData, error: rpcErr } = await supabase.rpc('crm_validate_token', { p_access: tok });
                            row = Array.isArray(rpcData) ? rpcData[0] : null;
                            if (rpcErr && /function .* crm_validate_token .* not found|does not exist/i.test(String(rpcErr.message || ''))) {
                              // segue para fallback
                            }
                            if (!row?.link_token) {
                              const { data, error } = await supabase
                                .from('report_tokens_pending')
                                .select('link_token, company_id, company_name')
                                .eq('access_token', tok)
                                .order('created_at', { ascending: false })
                                .limit(1);
                              if (error) {
                                setCrmErrorMsg('Erro ao consultar tokens pendentes. Tente novamente.');
                                setCrmErrorOpen(true);
                                return;
                              }
                              row = (data || [])[0] || null;
                            }
                            if (row?.link_token) linkTok = String(row.link_token);
                          } else {
                            linkTok = raw.toLowerCase();
                            const { data, error } = await supabase
                              .from('report_tokens_pending')
                              .select('link_token, access_token, company_id, company_name')
                              .eq('link_token', linkTok)
                              .order('created_at', { ascending: false })
                              .limit(1);
                            if (error) {
                              setCrmErrorMsg('Erro ao consultar tokens pendentes. Tente novamente.');
                              setCrmErrorOpen(true);
                              return;
                              return;
                            }
                            row = (data || [])[0] || null;
                            if (!row?.link_token) {
                              const derived = deriveAccessTokenFromLinkToken(linkTok);
                              tok = derived.toLowerCase();
                              const { data: data2, error: error2 } = await supabase
                                .from('report_tokens_pending')
                                .select('link_token, company_id, company_name')
                                .eq('access_token', tok)
                                .order('created_at', { ascending: false })
                                .limit(1);
                              if (error2) {
                                setCrmErrorMsg('Erro ao consultar tokens pendentes. Tente novamente.');
                                setCrmErrorOpen(true);
                                return;
                              }
                              row = (data2 || [])[0] || null;
                              if (row?.link_token) linkTok = String(row.link_token);
                            } else {
                              tok = String((row as any)?.access_token || deriveAccessTokenFromLinkToken(linkTok)).toLowerCase();
                            }
                          }
                          if (!row?.link_token) {
                            let extraMsg = '';
                            try {
                              const { data: probe } = await supabase
                                .from('report_tokens_pending')
                                .select('link_token, company_id, created_at')
                                .eq('access_token', tok)
                                .order('created_at', { ascending: false })
                                .limit(3);
                              const count = (probe || []).length;
                              if (count === 0) {
                                extraMsg = `\nDiagnóstico: nenhum registro desse token no projeto ${new URL(supabaseUrl).host}.`;
                              } else {
                                const top = (probe || [])[0] as any;
                                extraMsg = `\nDiagnóstico: ${count} registro(s). Último: link=${top?.link_token || '-'} empresa=${top?.company_id || '-'} criado=${top?.created_at || '-'}.`;
                              }
                            } catch {}
                            setCrmErrorMsg('Token não encontrado. Solicite novamente ao usuário ou gere um novo link.' + extraMsg);
                            setCrmErrorOpen(true);
                            return;
                          }
                          const targetCompanyId = (row as any)?.company_id || null;
                          if (!targetCompanyId) {
                            setCrmErrorMsg('Token inválido: empresa do usuário não localizada.');
                            setCrmErrorOpen(true);
                            return;
                          }
                          const allowed = new Set<string>();
                          if ((profile as any)?.company_id) allowed.add((profile as any).company_id);
                          const extras = await supabase
                            .from('crm_n1_company_access')
                            .select('company_id')
                            .eq('user_id', (profile as any)?.id || '')
                          ;(extras.data || []).forEach((r:any)=> allowed.add(r.company_id));
                          if (!allowed.has(targetCompanyId)) {
                            setCrmErrorMsg('Você não possui permissão para abrir denúncias para a empresa desse usuário.');
                            setCrmErrorOpen(true);
                            return;
                          }
                          setCrmOpenModal(false);
                          setCrmFormToken(String(linkTok || (row as any).link_token));
                          setCrmFormAccess(tok);
                          const cname = (row as any)?.company_name || '';
                          if (cname) {
                            setCrmFormCompanyName(String(cname));
                          } else {
                            try {
                              const { data: comp } = await supabase.from('companies').select('name').eq('id', targetCompanyId).maybeSingle();
                              setCrmFormCompanyName(((comp as any)?.name) || '');
                            } catch { setCrmFormCompanyName(''); }
                          }
                          setCrmFormOpen(true);
                        } catch {
                          setCrmErrorMsg('Falha ao validar o token. Tente novamente.');
                          setCrmErrorOpen(true);
                        }
                      }}
                      className="px-3 py-2 rounded bg-petroleo-600 text-white hover:bg-petroleo-700"
                    >
                      Confirmar
                    </button>
                  </div>
                }
              />
              <MessageModal open={crmErrorOpen} title="Validação falhou" message={crmErrorMsg} variant="error" onClose={()=>setCrmErrorOpen(false)} />
              <MessageModal open={crmDiagOpen} title="Diagnóstico" message={crmDiagMsg} variant="info" onClose={()=>setCrmDiagOpen(false)} />
              <MessageModal
                open={crmFormOpen}
                title={`Abrir Denúncia ${crmFormCompanyName ? '— ' + crmFormCompanyName : ''}`}
                message={
                  <div className="max-h-[70vh] overflow-y-auto">
                    {crmFormProtocol ? (
                      <div className="p-4">
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-700">
                            <Check className="h-6 w-6" />
                          </div>
                          <h3 className="mt-3 text-lg font-semibold text-gray-900">Denúncia enviada com sucesso</h3>
                          <p className="mt-2 text-sm text-gray-600">Número do protocolo</p>
                          <div className="mt-2 text-2xl font-bold tracking-wider text-petroleo-700">{crmFormProtocol}</div>
                          <p className="mt-3 text-xs text-gray-500">Este modal permanece aberto para você copiar o protocolo. Use o botão Fechar para retornar.</p>
                          <p className="mt-2 text-sm text-gray-700">Informe ao usuário que ele receberá um e-mail com o protocolo da denúncia aberta.</p>
                        </div>
                      </div>
                    ) : (
                      <ReportForm tokenOverride={crmFormToken} accessOverride={crmFormAccess} onSubmitted={(p)=>setCrmFormProtocol(p)} />
                    )}
                  </div>
                }
                variant="info"
                onClose={()=>{ setCrmFormOpen(false); setCrmFormProtocol(''); }}
                size="xl"
                actions={
                  <button
                    onClick={()=>{ setCrmFormOpen(false); setCrmFormProtocol(''); }}
                    className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    Fechar
                  </button>
                }
              />
            </div>
          ) : !token ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-2xl bg-emerald-500/10 mb-6 group-hover:bg-emerald-500/20 transition-colors">
                <Shield className="h-10 w-10 text-emerald-400" />
              </div>
              <h3 className="mt-4 text-2xl font-bold text-white">
                Gerar Link Seguro
              </h3>
              <p className="mt-3 text-base text-gray-400 max-w-lg mx-auto">
                Clique no botão abaixo para gerar um link único e seguro para sua denúncia.
                Este link conterá um token de acesso que garante a segurança do processo.
              </p>
              <div className="mt-8">
                <button
                  onClick={generateToken}
                  disabled={isGenerating}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-lg shadow-emerald-900/20 text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 disabled:opacity-50 transition-all"
                >
                  {isGenerating ? 'Gerando...' : 'Gerar Link de Denúncia'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Alert informativo */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-200">
                        Importante: Mantenha este link seguro
                      </h3>
                      <div className="mt-1 text-sm text-amber-200/80">
                        <p>Este link e token são únicos. Você pode:</p>
                        <ul className="list-disc list-inside mt-1 space-y-0.5">
                          <li>Copiar o link para acessar depois</li>
                          <li>Salvar o token em local seguro</li>
                          <li>Clicar em "Abrir Formulário" para prosseguir</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Link da denúncia */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Link da Denúncia
                  </label>
                  <div className="flex rounded-lg shadow-sm">
                    <input
                      type="text"
                      value={reportUrl}
                      readOnly
                      className="flex-1 min-w-0 block w-full px-4 py-2.5 rounded-none rounded-l-lg border border-white/10 bg-black/20 text-white text-sm focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="inline-flex items-center px-4 py-2.5 border border-l-0 border-white/10 rounded-r-lg bg-white/5 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                    >
                      {copied ? <Check className="h-5 w-5 text-emerald-400" /> : <Copy className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Token */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Token de Acesso
                  </label>
                  <div className="flex rounded-lg shadow-sm">
                    <input
                      type="text"
                      value={token}
                      readOnly
                      className="flex-1 min-w-0 block w-full px-4 py-2.5 rounded-none rounded-l-lg border border-white/10 bg-black/20 text-white text-sm font-mono focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={copyToken}
                      className="inline-flex items-center px-4 py-2.5 border border-l-0 border-white/10 rounded-r-lg bg-white/5 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                    >
                      {copied ? <Check className="h-5 w-5 text-emerald-400" /> : <Copy className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">
                    Necessário para acessar a denúncia posteriormente.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleOpenForm}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-lg shadow-emerald-900/20 text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 transition-all"
                  >
                    Abrir Formulário
                  </button>
                  <button
                    onClick={() => navigate('/my-reports')}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-white/10 text-sm font-medium rounded-xl shadow-sm text-gray-300 bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 transition-all"
                  >
                    Minhas Denúncias
                  </button>
                </div>
              </div>

              {/* QR Code Column */}
              <div className="lg:col-span-1 flex flex-col justify-center">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center text-center h-full justify-center">
                  <div className="p-3 bg-white rounded-xl shadow-lg mb-4">
                    <QRCode value={reportUrl} size={160} bgColor="#ffffff" fgColor="#000000" />
                  </div>
                  <p className="text-sm font-medium text-gray-300">Escaneie o QR Code</p>
                  <p className="text-xs text-gray-500 mt-1">Acesse pelo celular</p>
                </div>
              </div>

              {/* Modal de redirecionamento */}
              <MessageModal
                open={showRedirectModal}
                title="Você será direcionado para outra página"
                message="Para garantir o sigilo e o anonimato, o formulário de denúncia será aberto em uma nova aba fora do sistema."
                variant="info"
                onClose={() => setShowRedirectModal(false)}
                actions={
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRedirectModal(false)}
                      className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmRedirect}
                      className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      OK
                    </button>
                  </div>
                }
              />
            </div>
          )}
        </div>
        </div>
      </div>
      <FloatingWhatsAppButton companyId={profile?.company_id} />
      <SupportChatbot />
    </div>
  );
}
