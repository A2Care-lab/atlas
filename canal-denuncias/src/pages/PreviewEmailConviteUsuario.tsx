import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

function useQuery() {
  const { search, hash } = useLocation()
  const qStr = search || (hash.includes('?') ? hash.substring(hash.indexOf('?')) : '')
  return useMemo(() => new URLSearchParams(qStr), [qStr])
}

export default function PreviewEmailConviteUsuario() {
  const q = useQuery()
  const nome = q.get('nome') || 'Cenerli Alexandre'
  const base = (typeof window !== 'undefined' ? window.location.origin : ((import.meta as any)?.env?.DEV ? 'http://localhost:5173' : 'http://localhost:4173'))
  const cleanBase = String(base || '').replace(/\/+$/, '')
  const url = q.get('url') || `${cleanBase}/#/invite?type=invite`
  const empresa = q.get('empresa') || 'A2Care'
  const subject = 'Convite para acesso ao sistema'

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
  <style>
    body { margin:0; padding:0; background:#f5f6f8; }
    table { border-collapse:collapse; }
    img { border:0; line-height:100%; outline:none; text-decoration:none; }
    .wrapper { width:100%; background:#f5f6f8; padding:24px 0; }
    .container { width:100%; max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(16,24,40,.06); }
    .header { padding:24px 28px; background:#006D77; color:#ffffff; }
    .brand { font:600 14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; letter-spacing:.02em; opacity:.9; }
    .subject { margin-top:6px; font:700 18px/1.3 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; }
    .content { padding:28px; color:#1f2937; font:400 16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; }
    h1 { margin:0 0 14px 0; font:700 22px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; color:#0f172a; }
    p { margin:0 0 12px 0; }
    .btn { display:inline-block; background:#006D77; color:#ffffff; padding:10px 16px; border-radius:8px; text-decoration:none; font:600 14px/1 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; }
    .divider { height:1px; background:#e5e7eb; margin:16px 0; }
    .footer { padding:18px 28px; color:#6b7280; font:400 13px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; background:#fafafa; }
    @media (max-width:480px){ .header, .content, .footer { padding:20px; } h1 { font-size:20px; } }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="brand">ATLAS - Integridade Corporativa</div>
        <div class="subject">${subject}</div>
      </div>
      <div class="content">
        <h1>Ativação de Conta no ATLAS</h1>
        <p>Olá, ${nome}.</p>
        <p>Você foi convidado(a) pela ${empresa} a se cadastrar e acessar o sistema ATLAS – Integridade Corporativa.</p>
        <p style="margin-top:12px; color:#0f172a; font-weight:600;">Importante:</p>
        <p style="margin-top:4px; color:#475569;">Realize o cadastro usando <strong>o mesmo e-mail</strong> que recebeu este convite e <strong>o mesmo nome</strong> informado no seu pré-cadastro.</p>
        <p style="margin-top:6px; color:#334155;">Para evitar inconsistências, utilize exatamente o nome exibido na saudação acima: <strong>${nome}</strong>.</p>
        <p style="margin-top:6px; color:#475569;">Você poderá ajustar esses dados <strong>após concluir</strong> o cadastro.</p>
        <p style="margin-top:8px; color:#1f2937;">Clique no botão abaixo para iniciar seu cadastro.</p>
        <p><a class="btn" href="${url}" target="_blank" rel="noopener">Criar conta</a></p>
        <p style="margin-top:12px; color:#475569; font-size:14px;">Se você não reconhece este convite, ignore este e-mail.</p>
        <p style="margin-top:16px; font-weight:600;">Atenciosamente, equipe ATLAS - Integrigade Corporativa.</p>
        <div class="divider"></div>
      </div>
      <div class="footer">Este e-mail foi enviado automaticamente pelo Canal de Denúncias.
        <div style="margin-top:6px; text-align:center">
          <a href="https://atlas.a2care.com.br" style="color:#334155; text-decoration:none">atlas.a2care.com.br</a>
          <span style="margin:0 6px; color:#94a3b8">|</span>
          <a href="https://a2care.com.br" style="color:#334155; text-decoration:none">a2care.com.br</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto bg-white border rounded shadow">
        <div className="px-4 py-3 border-b">
          <div className="text-sm text-gray-600">Preview do template de convite de usuário</div>
          <div className="text-xs text-gray-500">Parâmetros: nome, url, empresa</div>
        </div>
        <div className="p-0">
          <iframe title="email-preview-invite" style={{ width:'100%', height:'80vh', border:0 }} srcDoc={html} />
        </div>
      </div>
    </div>
  )
}
