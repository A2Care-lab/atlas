import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface RecoveryState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

interface ResetState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export function usePasswordRecovery() {
  const [recoveryState, setRecoveryState] = useState<RecoveryState>({
    loading: false,
    error: null,
    success: false,
  });

  const [resetState, setResetState] = useState<ResetState>({
    loading: false,
    error: null,
    success: false,
  });

  const requestPasswordRecovery = async (email: string) => {
    setRecoveryState({ loading: true, error: null, success: false });
    
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Por favor, insira um email válido');
      }

      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        throw new Error('Email não cadastrado');
      }

      // Generate recovery token
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store recovery token
      const { error: tokenError } = await supabase
        .from('password_recovery_tokens')
        .insert({
          user_id: userData.id,
          token,
          expires_at: expiresAt.toISOString(),
          used: false,
        });

      if (tokenError) {
        throw new Error('Erro ao gerar token de recuperação');
      }

      // Send recovery email
      const recoveryUrl = `${window.location.origin}/#/recover/${token}`;
      const html = generateRecoveryEmailHtml(email, recoveryUrl);
      
      const { error: emailError } = await supabase
        .rpc('send_email', {
          p_to: email,
          p_subject: 'Recupere sua senha - ATLAS',
          p_html: html,
          p_text: `Olá! Para recuperar sua senha, acesse: ${recoveryUrl}`,
        });

      if (emailError) {
        throw new Error('Erro ao enviar email de recuperação');
      }

      setRecoveryState({ loading: false, error: null, success: true });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao solicitar recuperação de senha';
      setRecoveryState({ loading: false, error: message, success: false });
      return { success: false, error: message };
    }
  };

  const resetPassword = async (token: string, newPassword: string, confirmPassword: string) => {
    setResetState({ loading: true, error: null, success: false });
    
    try {
      // Validate passwords
      if (newPassword.length < 8) {
        throw new Error('Senha deve ter pelo menos 8 caracteres');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('As senhas não conferem');
      }

      // Validate password strength
      const hasLetters = /[a-zA-Z]/.test(newPassword);
      const hasNumbers = /\d/.test(newPassword);
      
      if (!hasLetters || !hasNumbers) {
        throw new Error('Senha deve conter letras e números');
      }

      // Get token from database
      const { data: tokenData, error: tokenError } = await supabase
        .from('password_recovery_tokens')
        .select('user_id, expires_at, used')
        .eq('token', token)
        .single();

      if (tokenError || !tokenData) {
        throw new Error('Link expirado ou inválido');
      }

      if (tokenData.used) {
        throw new Error('Este link já foi utilizado');
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        throw new Error('Link expirado ou inválido');
      }

      // Update user password
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: newPassword }) // Note: In real implementation, hash the password
        .eq('id', tokenData.user_id);

      if (updateError) {
        throw new Error('Erro ao atualizar senha');
      }

      // Mark token as used
      await supabase
        .from('password_recovery_tokens')
        .update({ used: true })
        .eq('token', token);

      setResetState({ loading: false, error: null, success: true });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao redefinir senha';
      setResetState({ loading: false, error: message, success: false });
      return { success: false, error: message };
    }
  };

  const validateToken = async (token: string) => {
    try {
      const { data, error } = await supabase
        .from('password_recovery_tokens')
        .select('expires_at, used')
        .eq('token', token)
        .single();

      if (error || !data) {
        return { valid: false, message: 'Link expirado ou inválido' };
      }

      if (data.used) {
        return { valid: false, message: 'Este link já foi utilizado' };
      }

      if (new Date(data.expires_at) < new Date()) {
        return { valid: false, message: 'Link expirado ou inválido' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, message: 'Link expirado ou inválido' };
    }
  };

  return {
    recoveryState,
    resetState,
    requestPasswordRecovery,
    resetPassword,
    validateToken,
  };
}

function generateRecoveryEmailHtml(name: string, recoveryUrl: string): string {
  const subject = 'Recupere sua senha - ATLAS';
  
  return `<!doctype html>
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
        <h1>Recuperação de Senha</h1>
        <p>Olá${name ? `, ${name}` : ''}.</p>
        <p>Recebemos uma solicitação para recuperar sua senha. Clique no botão abaixo para criar uma nova senha:</p>
        <p><a class="btn" href="${recoveryUrl}" target="_blank" rel="noopener">Criar nova senha</a></p>
        <p style="margin-top:12px; color:#475569; font-size:14px;">Este link é válido por 24 horas. Se não foi você quem solicitou esta recuperação, ignore este e-mail.</p>
        <p style="margin-top:16px; font-weight:600;">Atenciosamente, equipe ATLAS - Integridade Corporativa.</p>
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
</html>`;
}
