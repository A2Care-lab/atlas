import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import { calculateRiskLevel } from '../utils/riskCalculator';
import { Report, SituationType, AffectedScope, RecurrenceType } from '../types/database';
import { AlertCircle, CheckCircle, Upload, Send } from 'lucide-react';
import { Brand } from '../components/Brand';
import { sendEmail, generateReportCreatedEmail } from '../utils/email';
import MessageModal from '../components/MessageModal';
import { deriveAccessTokenFromLinkToken } from '../utils/accessToken';
import { useAuth } from '../hooks/useAuth';

export function ReportForm() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isValidToken, setIsValidToken] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form data
  const [identify, setIdentify] = useState(false);
  const [informDepartment, setInformDepartment] = useState(false);
  const [department, setDepartment] = useState('');
  const [corporateAreas, setCorporateAreas] = useState<{ id: string; name: string }[]>([]);
  const [mainReason, setMainReason] = useState('');
  const [subReason, setSubReason] = useState('');
  const [situationType, setSituationType] = useState<SituationType>('other');
  const [hasImmediateRisk, setHasImmediateRisk] = useState(false);
  const [involvesLeadership, setInvolvesLeadership] = useState(false);
  const [affectedScope, setAffectedScope] = useState<AffectedScope>('individual');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('first_time');
  const [hasRetaliation, setHasRetaliation] = useState(false);
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const TITLE_MAX = 120;
  const [title, setTitle] = useState('');

  useEffect(() => {
    validateToken();
  }, [token]);

  useEffect(() => {
    if (identify && profile?.full_name) {
      // nothing needed; shown directly from profile
    }
  }, [identify, profile]);

  useEffect(() => {
    const loadAreas = async () => {
      const { data, error } = await supabase
        .from('corporate_areas')
        .select('id,name')
        .eq('status', 'active')
        .order('name', { ascending: true });
      if (!error && data) {
        setCorporateAreas(data as any);
        if (profile?.department) {
          setDepartment(profile.department);
        }
      }
    };

    if (informDepartment) {
      loadAreas();
    }
  }, [informDepartment, profile]);

  const validateToken = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Verificar se o token existe em alguma denúncia
      const { data, error } = await supabase
        .from('reports')
        .select('id')
        .eq('token', token)
        .single();

      if (!error && data) {
        setIsValidToken(true);
      }
    } catch (error) {
      console.error('Token validation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const expected = token ? deriveAccessTokenFromLinkToken(token) : '';
    if (tokenInput === expected) {
      setIsValidToken(true);
    } else {
      setErrorMsg(
        'O token digitado está incorreto ou inexistente. Verifique o token correto gerado pelo sistema ATLAS e digite novamente.'
      );
      setErrorOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Calcular risco
      const riskCalculation = calculateRiskLevel({
        situationType,
        hasImmediateRisk,
        involvesLeadership,
        affectedScope,
        recurrence,
        hasRetaliation,
      });

      // Gerar protocolo
      const protocol = `DEN${Date.now().toString().slice(-8)}`;

      // Criar denúncia
      const reportData = {
        protocol,
        company_id: profile?.company_id || '550e8400-e29b-41d4-a716-446655440001',
        title: title.trim(),
        description,
        is_anonymous: !identify,
        user_id: identify && user?.id ? user.id : null,
        department: informDepartment ? department : null,
        main_reason: mainReason,
        sub_reason: subReason,
        situation_type: situationType,
        has_immediate_risk: hasImmediateRisk,
        involves_leadership: involvesLeadership,
        affected_scope: affectedScope,
        recurrence,
        has_retaliation: hasRetaliation,
        risk_score: riskCalculation.score,
        risk_level: riskCalculation.level,
        risk_justification: riskCalculation.justification,
        status: 'received',
        token: token || uuidv4(),
      };

      const { data: report, error } = await supabase
        .from('reports')
        .insert(reportData)
        .select('id')
        .single();

      if (error) throw error;

      // Upload de anexos
      if (attachments.length > 0 && report) {
        const MAX_SIZE = 10 * 1024 * 1024;
        const sanitizeFileName = (name: string) => {
          const base = name.normalize('NFD').replace(/\p{Diacritic}/gu, '');
          return base.replace(/[^a-zA-Z0-9_.-]/g, '-').replace(/-+/g, '-');
        };
        for (const file of attachments) {
          if (file.size > MAX_SIZE) {
            setErrorMsg(`Arquivo ${file.name} excede 10MB e não foi enviado.`);
            setErrorOpen(true);
            continue;
          }

          const safeName = sanitizeFileName(file.name);
          const fileName = `${report.id}/${Date.now()}-${safeName}`;
          const { data: uploaded, error: uploadError } = await supabase.storage
            .from('reports')
            .upload(fileName, file, { contentType: file.type, upsert: false });

          if (uploadError) {
            setErrorMsg(`Falha ao salvar anexo ${file.name}.`);
            setErrorOpen(true);
            continue;
          }

          await supabase.from('attachments').insert({
            report_id: report.id,
            file_name: safeName,
            file_path: uploaded?.path || fileName,
            file_size: file.size,
            mime_type: file.type,
          });
        }
      }

      // Enviar e-mail de confirmação (Edge Function com fallback para RPC)
      try {
        if (user?.email) {
          try {
            await supabase.functions.invoke('send-denuncia-confirmation', {
              body: { email: user.email, protocolo: protocol, nome: profile?.full_name || '' },
            });
          } catch (err) {
            await sendEmail({
              to: user.email,
              subject: `Confirmação de abertura de denúncia – Protocolo ${protocol}`,
              html: generateReportCreatedEmail(protocol, !identify, profile?.full_name || ''),
            });
          }
        }
      } catch (emailErr) {
        console.error('Falha ao enviar e-mail de confirmação:', emailErr);
      }

      // Redirecionar para página de sucesso
      navigate('/success', { state: { protocol } });
    } catch (error) {
      console.error('Error submitting report:', error);
      setErrorMsg('Erro ao enviar denúncia. Tente novamente.');
      setErrorOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-petroleo-600"></div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center">
              <Brand variant="teal" withText className="h-16 w-auto" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Token de Segurança
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Digite o token de segurança para acessar o formulário de denúncia
            </p>
            <p className="mt-2 text-xs text-petroleo-700">
              Você está navegando em ambiente seguro no sistema ATLAS – Integridade Corporativa
            </p>
          </div>

          <form onSubmit={handleTokenSubmit} className="space-y-6">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700">
                Token de Acesso
              </label>
              <input
                id="token"
                type="text"
                required
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-petroleo-500 focus:border-petroleo-500 focus:z-10 sm:text-sm"
                placeholder="Digite ou cole aqui o token fornecido"
              />
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-petroleo-600 hover:bg-petroleo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petroleo-500"
            >
              Validar Token
            </button>
          </form>
          <MessageModal
            open={errorOpen}
            title="Token inválido"
            message={errorMsg}
            variant="error"
            onClose={() => setErrorOpen(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Formulário de Denúncia
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Preencha o formulário com os detalhes da denúncia
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label htmlFor="report-title" className="block text-sm font-medium text-gray-700">Título da Denúncia</label>
              <input
                id="report-title"
                type="text"
                required
                maxLength={TITLE_MAX}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Resuma a denúncia em poucas palavras"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-petroleo-500 focus:border-petroleo-500 sm:text-sm"
              />
              <div className="mt-1 text-xs text-gray-500">{title.length}/{TITLE_MAX} caracteres</div>
            </div>
            {/* Identificação */}
            <div className="bg-petroleo-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-petroleo-900 mb-3">
                Você deseja se identificar?
              </h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="identify"
                    checked={identify}
                    onChange={() => setIdentify(true)}
                    className="h-4 w-4 text-petroleo-600 focus:ring-petroleo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Sim, quero me identificar</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="identify"
                    checked={!identify}
                    onChange={() => setIdentify(false)}
                    className="h-4 w-4 text-petroleo-600 focus:ring-petroleo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Não, quero permanecer anônimo</span>
                </label>
              </div>
              {identify && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                  <input
                    type="text"
                    value={profile?.full_name || ''}
                    readOnly
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-700 sm:text-sm"
                    placeholder="Nome não informado no perfil"
                  />
                </div>
              )}
            </div>

            {/* Departamento */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Você deseja informar sua área na empresa?
              </h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="informDepartment"
                    checked={informDepartment}
                    onChange={() => setInformDepartment(true)}
                    className="h-4 w-4 text-petroleo-600 focus:ring-petroleo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Sim</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="informDepartment"
                    checked={!informDepartment}
                    onChange={() => setInformDepartment(false)}
                    className="h-4 w-4 text-petroleo-600 focus:ring-petroleo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Não</span>
                </label>
              </div>
              
              {informDepartment && (
                <div className="mt-3">
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                    Departamento
                  </label>
                  <select
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-petroleo-500 focus:border-petroleo-500 sm:text-sm rounded-md"
                  >
                    <option value="">Selecione uma área</option>
                    {corporateAreas.map((area) => (
                      <option key={area.id} value={area.name}>{area.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Tipo de Situação */}
            <div>
              <label htmlFor="situationType" className="block text-sm font-medium text-gray-700">
                Qual tipo de situação você deseja relatar?
              </label>
              <select
                id="situationType"
                required
                value={situationType}
                onChange={(e) => setSituationType(e.target.value as SituationType)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-petroleo-500 focus:border-petroleo-500 sm:text-sm rounded-md"
              >
                <option value="conflict">Conflito interpessoal ou clima</option>
                <option value="misconduct">Conduta inadequada / descumprimento de normas</option>
                <option value="moral_harassment">Assédio moral</option>
                <option value="discrimination">Discriminação</option>
                <option value="sexual_harassment">Assédio sexual</option>
                <option value="threat_violence">Ameaça ou violência</option>
                <option value="fraud">Fraude, corrupção ou irregularidade grave</option>
                <option value="other">Outro</option>
              </select>
            </div>

            {/* Risco Imediato */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Há risco imediato à integridade física ou psicológica de alguém?
              </label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="immediateRisk"
                    checked={hasImmediateRisk}
                    onChange={() => setHasImmediateRisk(true)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Sim</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="immediateRisk"
                    checked={!hasImmediateRisk}
                    onChange={() => setHasImmediateRisk(false)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Não</span>
                </label>
              </div>
            </div>

            {/* Liderança */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                A situação envolve gestor, líder ou alguém com poder hierárquico?
              </label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="leadership"
                    checked={involvesLeadership}
                    onChange={() => setInvolvesLeadership(true)}
                    className="h-4 w-4 text-petroleo-600 focus:ring-petroleo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Sim</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="leadership"
                    checked={!involvesLeadership}
                    onChange={() => setInvolvesLeadership(false)}
                    className="h-4 w-4 text-petroleo-600 focus:ring-petroleo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Não</span>
                </label>
              </div>
            </div>

            {/* Alcance */}
            <div>
              <label htmlFor="affectedScope" className="block text-sm font-medium text-gray-700">
                Quantas pessoas são impactadas por essa situação?
              </label>
              <select
                id="affectedScope"
                required
                value={affectedScope}
                onChange={(e) => setAffectedScope(e.target.value as AffectedScope)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-petroleo-500 focus:border-petroleo-500 sm:text-sm rounded-md"
              >
                <option value="individual">Apenas eu / uma pessoa</option>
                <option value="team">Uma equipe</option>
                <option value="department">Uma área ou departamento</option>
                <option value="company">Mais de uma área / empresa toda</option>
              </select>
            </div>

            {/* Recorrência */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Esse fato já aconteceu outras vezes?
              </label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="recurrence"
                    checked={recurrence === 'first_time'}
                    onChange={() => setRecurrence('first_time')}
                    className="h-4 w-4 text-petroleo-600 focus:ring-petroleo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Não, é a primeira vez</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="recurrence"
                    checked={recurrence === 'occurred_before'}
                    onChange={() => setRecurrence('occurred_before')}
                    className="h-4 w-4 text-petroleo-600 focus:ring-petroleo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Já aconteceu antes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="recurrence"
                    checked={recurrence === 'frequent'}
                    onChange={() => setRecurrence('frequent')}
                    className="h-4 w-4 text-petroleo-600 focus:ring-petroleo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Acontece com frequência</span>
                </label>
              </div>
            </div>

            {/* Retaliação */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Você sofreu ou percebeu retaliação, ameaça ou tentativa de impedir a denúncia?
              </label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="retaliation"
                    checked={hasRetaliation}
                    onChange={() => setHasRetaliation(true)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Sim</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="retaliation"
                    checked={!hasRetaliation}
                    onChange={() => setHasRetaliation(false)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Não</span>
                </label>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descreva o ocorrido com o máximo de detalhes que considerar relevantes
              </label>
              <textarea
                id="description"
                required
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-petroleo-500 focus:border-petroleo-500 sm:text-sm"
                placeholder="O que aconteceu? Quando? Onde? Quem estava envolvido?"
              />
              <p className="mt-1 text-sm text-gray-500">
                Máximo de 2000 caracteres
              </p>
            </div>

            {/* Anexos */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Anexar arquivos (opcional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-petroleo-600 hover:text-petroleo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-petroleo-500"
                    >
                      <span>Clique para fazer upload</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                        onChange={(e) => setAttachments(Array.from(e.target.files || []))}
                      />
                    </label>
                    <p className="pl-1">ou arraste e solte</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX, JPG, PNG, TXT até 10MB
                  </p>
                </div>
              </div>
              
              {attachments.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700">Arquivos selecionados:</p>
                  <ul className="mt-1 text-sm text-gray-600">
                    {attachments.map((file, index) => (
                      <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petroleo-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-petroleo-600 hover:bg-petroleo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petroleo-500 disabled:opacity-50"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Enviando...' : 'Enviar Denúncia'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <MessageModal open={errorOpen} title="Falha ao enviar" message={errorMsg} variant="error" onClose={()=>setErrorOpen(false)} />
    </div>
  );
}
