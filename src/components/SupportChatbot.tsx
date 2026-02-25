import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot } from 'lucide-react';

import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatOption {
  id: string;
  label: string;
  action: () => void;
}

export function SupportChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useAuth();
  const [aiAllowed, setAiAllowed] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      text: 'Olá! 👋\n\nSou o assistente virtual com IA deste canal e estou aqui para ajudar com orientações e registrar sua solicitação de forma simples e segura.\n\nSempre que necessário, sua demanda pode ser acompanhada por uma pessoa da equipe responsável.\n\nPode me contar como posso ajudar?', 
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [options, setOptions] = useState<ChatOption[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial options
    setOptions([
      { id: 'register', label: 'Registrar denúncia', action: () => handleOptionClick('Registrar denúncia') },
      { id: 'confidentiality', label: '🔒 Confidencialidade e processo', action: () => handleOptionClick('🔒 Confidencialidade e processo') },
      { id: 'themes', label: '📚 Entender os temas', action: () => handleOptionClick('📚 Entender os temas') },
      { id: 'about', label: 'ℹ️ Sobre o canal de denúncias', action: () => handleOptionClick('ℹ️ Sobre o canal de denúncias') },
      { id: 'chat', label: '💬 Falar com o assistente', action: () => handleOptionClick('💬 Falar com o assistente') },
    ]);
  }, []);

  useEffect(() => {
    const checkAiLimit = async () => {
      try {
        const companyId = (profile as any)?.company_id || null;
        if (!companyId) {
          setAiAllowed(false);
          return;
        }
        const { data, error } = await supabase
          .from('assinaturas_ai_consumo')
          .select('ai_limite')
          .eq('company_id', companyId)
          .maybeSingle();
        if (error) {
          setAiAllowed(false);
          return;
        }
        const lim = Number(data?.ai_limite ?? 0);
        setAiAllowed(lim > 0);
      } catch {
        setAiAllowed(false);
      }
    };
    checkAiLimit();
  }, [profile?.company_id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, options]);

  const handleOptionClick = (label: string) => {
    const newMessage: Message = { 
      id: Date.now(), 
      text: label, 
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Process option logic here
    setTimeout(() => {
      let responseText = '';
      if (label === 'Registrar denúncia') {
        responseText = 'Para registrar uma denúncia, você pode clicar no botão "Gerar Link de Denúncia" na tela principal. Deseja que eu te explique o passo a passo?';
        setOptions([
            { id: 'yes_explain', label: 'Sim, me explique', action: () => handleOptionClick('Sim, me explique') },
            { id: 'no_thanks', label: 'Não, obrigado', action: () => handleOptionClick('Não, obrigado') },
        ]);
      } else if (label === '🔒 Confidencialidade e processo') {
        responseText = 'Nossa plataforma garante total sigilo. Você pode optar pelo anonimato e todas as informações são criptografadas. Quer saber mais detalhes sobre a segurança?';
        setOptions([
            { id: 'more_security', label: 'Mais sobre segurança', action: () => handleOptionClick('Mais sobre segurança') },
            { id: 'back_menu', label: 'Voltar ao menu', action: () => handleOptionClick('Voltar ao menu') },
        ]);
      } else if (label === '📚 Entender os temas') {
        responseText = 'Podemos falar sobre diversos temas como Assédio, Fraude, Conflito de Interesses, entre outros. Qual tema você gostaria de entender melhor?';
        setOptions([
            { id: 'theme_moral_harassment', label: 'Assédio moral', action: () => handleOptionClick('Assédio moral') },
            { id: 'theme_sexual_harassment', label: 'Assédio sexual', action: () => handleOptionClick('Assédio sexual') },
            { id: 'theme_discrimination', label: 'Discriminação', action: () => handleOptionClick('Discriminação') },
            { id: 'theme_misconduct', label: 'Conduta inadequada', action: () => handleOptionClick('Conduta inadequada') },
            { id: 'when_to_report', label: 'Quando denunciar', action: () => handleOptionClick('Quando denunciar') },
            { id: 'back_menu', label: 'Voltar ao menu', action: () => handleOptionClick('Voltar ao menu') },
        ]);
      } else if (label === 'ℹ️ Sobre o canal de denúncias') {
        responseText = 'Este canal é uma ferramenta segura e independente para reportar condutas que violem nosso Código de Ética ou a legislação vigente. Garantimos o anonimato e a não retaliação. Abaixo você encontra algumas das dúvidas mais frequentes:';
        setOptions([
            { id: 'faq_anonymous', label: 'Minha denúncia é realmente anônima?', action: () => handleOptionClick('Minha denúncia é realmente anônima?') },
            { id: 'faq_confidential', label: 'Minhas informações são confidenciais?', action: () => handleOptionClick('Minhas informações são confidenciais?') },
            { id: 'faq_after', label: 'O que acontece depois que envio a denúncia?', action: () => handleOptionClick('O que acontece depois que envio a denúncia?') },
            { id: 'faq_protocol', label: 'Vou receber um protocolo ou código?', action: () => handleOptionClick('Vou receber um protocolo ou código?') },
            { id: 'faq_time', label: 'Quanto tempo leva para a denúncia ser analisada?', action: () => handleOptionClick('Quanto tempo leva para a denúncia ser analisada?') },
            { id: 'faq_complement', label: 'Posso complementar a denúncia depois?', action: () => handleOptionClick('Posso complementar a denúncia depois?') },
            { id: 'faq_others', label: 'Posso denunciar algo que aconteceu com outra pessoa?', action: () => handleOptionClick('Posso denunciar algo que aconteceu com outra pessoa?') },
            { id: 'faq_retaliation', label: 'Existe proteção contra retaliação?', action: () => handleOptionClick('Existe proteção contra retaliação?') },
            { id: 'back_menu', label: 'Voltar ao menu', action: () => handleOptionClick('Voltar ao menu') },
        ]);
      } else if (label === '💬 Falar com o assistente') {
        responseText = 'Claro! Pode digitar sua dúvida abaixo que irei te ajudar.';
        setOptions([]);
      } else if (label === 'Voltar ao menu' || label === 'Não, obrigado') {
        responseText = 'Como posso te ajudar agora?';
        setOptions([
            { id: 'register', label: 'Registrar denúncia', action: () => handleOptionClick('Registrar denúncia') },
            { id: 'confidentiality', label: '🔒 Confidencialidade e processo', action: () => handleOptionClick('🔒 Confidencialidade e processo') },
            { id: 'themes', label: '📚 Entender os temas', action: () => handleOptionClick('📚 Entender os temas') },
            { id: 'about', label: 'ℹ️ Sobre o canal de denúncias', action: () => handleOptionClick('ℹ️ Sobre o canal de denúncias') },
            { id: 'chat', label: '💬 Falar com o assistente', action: () => handleOptionClick('💬 Falar com o assistente') },
        ]);
      } else {
        // Default response for sub-options not explicitly handled or generic text
        if (label === 'Sim, me explique') {
            responseText = '1. Clique em "Gerar Link de Denúncia".\n2. Copie o Token de Acesso.\n3. Preencha o formulário com os detalhes.\n4. Anexe evidências se houver.\n5. Envie a denúncia.';
        } else if (label === 'Mais sobre segurança') {
            responseText = 'Utilizamos criptografia de ponta a ponta. Nenhum dado de IP é registrado e você não precisa se identificar se não quiser.';
        } else if (label === 'Assédio moral') {
            responseText = 'Assédio moral envolve condutas abusivas, repetitivas e prolongadas que expõem o colaborador a situações humilhantes e constrangedoras no ambiente de trabalho.';
        } else if (label === 'Assédio sexual') {
            responseText = 'Assédio sexual caracteriza-se por condutas de natureza sexual não solicitadas, que criam um ambiente hostil ou que são usadas como condição para o emprego.';
        } else if (label === 'Discriminação') {
            responseText = 'Discriminação é qualquer distinção, exclusão ou restrição baseada em raça, cor, sexo, religião, opinião política, ascendência nacional ou origem social.';
        } else if (label === 'Conduta inadequada') {
            responseText = 'Conduta inadequada refere-se a comportamentos que violam o código de ética da empresa, normas internas ou leis vigentes.';
        } else if (label === 'Quando denunciar') {
            responseText = 'Você deve denunciar sempre que presenciar ou tiver conhecimento de atos que violem o código de ética, leis ou regulamentos internos.';
        } else if (label === 'Minha denúncia é realmente anônima?') {
            responseText = 'Sim. Você pode registrar sua denúncia de forma totalmente anônima, caso prefira.\n\nO sistema não exige identificação e foi desenvolvido para preservar a confidencialidade das informações.\n\nSe optar por se identificar, seus dados serão tratados com sigilo e utilizados apenas para a condução da apuração.';
        } else if (label === 'Minhas informações são confidenciais?') {
            responseText = 'Sim. Todas as informações registradas neste canal são tratadas com confidencialidade e acessadas apenas por pessoas autorizadas responsáveis pela análise e tratamento da demanda.\n\nO objetivo é garantir segurança, respeito e privacidade durante todo o processo.';
        } else if (label === 'O que acontece depois que envio a denúncia?') {
            responseText = 'Após o envio, a denúncia é recebida e passa por uma análise inicial para avaliação e encaminhamento adequado.\n\nCaso necessário, podem ser realizadas etapas de apuração para entender melhor a situação relatada.\n\nTodo o processo segue critérios de confidencialidade e imparcialidade.';
        } else if (label === 'Vou receber um protocolo ou código?') {
            responseText = 'Sim. Ao registrar a denúncia, você receberá um número de protocolo (ou código de acompanhamento).\n\nCom ele, será possível consultar o andamento da manifestação sempre que desejar.';
        } else if (label === 'Quanto tempo leva para a denúncia ser analisada?') {
            responseText = 'O prazo pode variar de acordo com a complexidade da situação relatada.\n\nEm geral, o canal realiza uma análise inicial em curto prazo e o acompanhamento pode ser consultado pelo protocolo sempre que necessário.';
        } else if (label === 'Posso complementar a denúncia depois?') {
            responseText = 'Sim. Caso tenha novas informações ou evidências, você pode complementar a denúncia utilizando seu protocolo de acompanhamento.';
        } else if (label === 'Posso denunciar algo que aconteceu com outra pessoa?') {
            responseText = 'Sim. Este canal também pode ser utilizado para relatar situações presenciadas ou que envolvam terceiros, sempre com o objetivo de contribuir para um ambiente seguro e respeitoso.';
        } else if (label === 'Existe proteção contra retaliação?') {
            responseText = 'A empresa não tolera qualquer forma de retaliação contra pessoas que utilizem o canal de boa-fé.\n\nO objetivo do canal é promover um ambiente ético, seguro e respeitoso para todos.';
        } else {
            responseText = 'Entendido. Algo mais?';
        }
        
        // After sub-interaction, offer back to menu
        setOptions([
            { id: 'back_menu', label: 'Voltar ao menu', action: () => handleOptionClick('Voltar ao menu') },
            { id: 'chat', label: '💬 Falar com o assistente', action: () => handleOptionClick('💬 Falar com o assistente') },
        ]);
      }
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: responseText,
        sender: 'bot',
        timestamp: new Date()
      }]);
    }, 800);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = { 
      id: Date.now(), 
      text: inputText, 
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Call Gemini Edge Function via direct fetch to bypass potential supabase-js issues
    try {
        // Show typing indicator or loading state if desired (optional)
        
        // Construct the URL manually to ensure it's correct
        const functionUrl = `${supabaseUrl}/functions/v1/gemini-v2`;
        
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify({ 
                message: userMessage.text,
                history: messages.slice(-10).map(m => ({
                    role: m.sender === 'user' ? 'user' : 'model',
                    parts: m.text
                })),
                companyId: (profile as any)?.company_id || null
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Gemini function error:', response.status, errorData);
            throw new Error(`Falha na comunicação: ${response.status}`);
        }

        const data = await response.json();
        const botResponse = data?.text || (data?.error === 'ai_limit_reached' ? 'Seu limite mensal de IA foi atingido. Procure o gestor do sistema.' : data?.error === 'ai_unavailable' ? 'O uso de IA está desabilitado para sua assinatura.' : 'Desculpe, não consegui gerar uma resposta. Tente novamente.');

        setMessages(prev => [...prev, {
            id: Date.now() + 1,
            text: botResponse,
            sender: 'bot',
            timestamp: new Date()
        }]);

    } catch (err) {
        console.error('Error calling Gemini:', err);
        setMessages(prev => [...prev, {
            id: Date.now() + 1,
            text: 'Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente mais tarde ou use as opções do menu.',
            sender: 'bot',
            timestamp: new Date()
        }]);
    }
  };

  if (aiAllowed === false) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-28 z-50 p-4 bg-petroleo-600 hover:bg-petroleo-500 text-white rounded-full shadow-lg shadow-petroleo-900/50 transition-all duration-300 hover:scale-110 flex items-center justify-center group ${isOpen ? 'hidden' : ''}`}
        title="Ajuda Inteligente"
      >
        <Bot className="w-8 h-8" />
        <span className="absolute right-full mr-3 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Suporte IA
        </span>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[90vw] sm:w-[450px] bg-gray-900 rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-fade-in-up h-[750px] max-h-[90vh]">
          {/* Header */}
          <div className="bg-petroleo-700 p-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-full">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">Assistente de Integridade IA</h3>
                <p className="text-gray-300 text-xs flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/95 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-petroleo-600 text-white rounded-br-none'
                      : 'bg-gray-800 text-gray-200 border border-white/10 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <p className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Options */}
            {options.length > 0 && (
              <div className="flex flex-col space-y-2 mt-2">
                {options.map((option) => (
                  <button
                    key={option.id}
                    onClick={option.action}
                    className="w-full text-left p-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-white/10 text-white text-sm transition-colors flex items-center justify-between group"
                  >
                    <span>{option.label}</span>
                    <Bot className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-petroleo-400" />
                  </button>
                ))}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-gray-900 border-t border-white/10">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Digite sua dúvida..."
                className="flex-1 p-2.5 bg-gray-800 border border-white/10 rounded-lg focus:outline-none focus:border-petroleo-500 focus:ring-1 focus:ring-petroleo-500 text-sm text-white placeholder-gray-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className="p-2.5 bg-petroleo-600 text-white rounded-lg hover:bg-petroleo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-petroleo-900/20"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center mt-2">
               <span className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
                 Powered by Gemini AI <Bot className="w-3 h-3" />
               </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
