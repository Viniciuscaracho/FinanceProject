import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const T = {
  bg: '#F7FAF8',
  dark: '#0D1710',
  brand: '#1B6E3A',
  text: '#111111',
  muted: '#6B6B6B',
  border: '#DDE8E1',
  light: '#EBF3EE',
}

const DISPLAY = { fontFamily: "'Space Grotesk', system-ui, sans-serif" }

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ ...DISPLAY, fontSize: 20, fontWeight: 600, color: T.dark, marginBottom: 12 }}>
        {title}
      </h2>
      <div style={{ color: T.text, lineHeight: 1.8, fontSize: 15 }}>
        {children}
      </div>
    </section>
  )
}

function P({ children }) {
  return <p style={{ marginBottom: 12 }}>{children}</p>
}

function Li({ children }) {
  return (
    <li style={{ marginBottom: 8, paddingLeft: 8 }}>
      {children}
    </li>
  )
}

export function PrivacyPolicy() {
  const navigate = useNavigate()

  return (
    <div style={{ background: T.bg, minHeight: '100vh', ...DISPLAY }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: `1px solid ${T.border}`, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 10 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: T.brand, fontWeight: 500, fontSize: 14 }}
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
        <div style={{ width: 1, height: 20, background: T.border }} />
        <span style={{ fontSize: 14, color: T.muted }}>orbinutri.com.br</span>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'inline-block', background: T.light, color: T.brand, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, marginBottom: 16, letterSpacing: 1, textTransform: 'uppercase' }}>
            Legal
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: T.dark, marginBottom: 12, lineHeight: 1.2 }}>
            Política de Privacidade
          </h1>
          <p style={{ color: T.muted, fontSize: 14 }}>
            Última atualização: 27 de maio de 2026
          </p>
        </div>

        <Section title="1. Quem somos">
          <P>
            A <strong>Orbinutri</strong> é uma plataforma de gestão para nutricionistas, desenvolvida e operada por Vinicius Caracho,
            com sede no Brasil. Nosso objetivo é simplificar a rotina clínica dos profissionais de nutrição e melhorar
            a experiência dos seus pacientes.
          </P>
          <P>
            Para dúvidas sobre esta política, entre em contato pelo e-mail:{' '}
            <a href="mailto:contato@orbinutri.com.br" style={{ color: T.brand }}>contato@orbinutri.com.br</a>
          </P>
        </Section>

        <Section title="2. Dados que coletamos">
          <P>Coletamos apenas os dados necessários para o funcionamento da plataforma:</P>
          <ul style={{ paddingLeft: 20 }}>
            <Li><strong>Dados de conta:</strong> nome, e-mail e foto de perfil (fornecidos via login com Google ou cadastro manual).</Li>
            <Li><strong>Dados de uso:</strong> informações sobre como você usa a plataforma (páginas acessadas, funcionalidades utilizadas), para fins de melhoria do produto.</Li>
            <Li><strong>Dados de pacientes:</strong> informações inseridas pelo nutricionista, como nome, dados de contato e informações nutricionais. Esses dados pertencem ao profissional e são tratados por nós apenas como processador.</Li>
            <Li><strong>Dados de pagamento:</strong> processados integralmente por Stripe ou AbacatePay. Não armazenamos dados de cartão de crédito.</Li>
          </ul>
        </Section>

        <Section title="3. Como usamos seus dados">
          <ul style={{ paddingLeft: 20 }}>
            <Li>Autenticar seu acesso à plataforma.</Li>
            <Li>Fornecer e manter os serviços contratados.</Li>
            <Li>Processar pagamentos e emitir cobranças.</Li>
            <Li>Enviar comunicações relacionadas ao serviço (atualizações, avisos de segurança).</Li>
            <Li>Melhorar a plataforma com base em dados agregados e anônimos de uso.</Li>
          </ul>
          <P>Não vendemos, alugamos nem compartilhamos seus dados com terceiros para fins de marketing.</P>
        </Section>

        <Section title="4. Integrações com Google">
          <P>
            A Orbinutri integra-se com serviços do Google para oferecer funcionalidades adicionais. O uso
            que fazemos das informações recebidas das APIs do Google está em conformidade com a{' '}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" style={{ color: T.brand }}>
              Política de Dados do Usuário dos Serviços de API do Google
            </a>
            , incluindo os requisitos de Uso Limitado.
          </P>

          <P><strong>4.1 Login com Google</strong></P>
          <P>
            Quando você utiliza o login com Google, recebemos nome, endereço de e-mail e foto de perfil.
            Usamos essas informações exclusivamente para criar e autenticar sua conta na Orbinutri.
          </P>

          <P><strong>4.2 Importação de Contatos Google</strong></P>
          <P>
            Com sua autorização explícita, a Orbinutri pode acessar sua lista de contatos do Google
            (nomes, e-mails e telefones) por meio do escopo{' '}
            <code style={{ background: T.light, padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>contacts.readonly</code>.
            Esse acesso é usado exclusivamente para importar contatos diretamente para sua agenda na plataforma,
            evitando cadastro manual. Os dados importados são armazenados na sua conta Orbinutri e não são
            compartilhados com terceiros. Você pode revogar esse acesso a qualquer momento em{' '}
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" style={{ color: T.brand }}>
              myaccount.google.com/permissions
            </a>.
          </P>

          <P><strong>4.3 Google Calendar</strong></P>
          <P>
            Com sua autorização explícita, a Orbinutri pode criar, editar e excluir eventos no seu Google
            Calendar por meio do escopo{' '}
            <code style={{ background: T.light, padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>calendar</code>.
            Esse acesso é usado exclusivamente para sincronizar suas consultas agendadas na plataforma com
            seu calendário pessoal e gerar links do Google Meet para consultas online. Não lemos eventos
            existentes no seu calendário que não foram criados pela Orbinutri. Você pode revogar esse
            acesso a qualquer momento em{' '}
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" style={{ color: T.brand }}>
              myaccount.google.com/permissions
            </a>.
          </P>

          <P>
            Os dados obtidos via APIs do Google não são usados para veicular anúncios, não são vendidos
            a terceiros e são acessados apenas na medida necessária para as funcionalidades descritas acima.
          </P>
        </Section>

        <Section title="5. Compartilhamento de dados">
          <P>Seus dados podem ser compartilhados apenas com:</P>
          <ul style={{ paddingLeft: 20 }}>
            <Li><strong>Stripe / AbacatePay:</strong> para processar pagamentos.</Li>
            <Li><strong>Google:</strong> para autenticação via OAuth.</Li>
            <Li><strong>Infraestrutura de hospedagem:</strong> servidores onde a plataforma opera (dados armazenados no Brasil ou na UE).</Li>
            <Li><strong>Autoridades competentes:</strong> quando exigido por lei ou ordem judicial.</Li>
          </ul>
        </Section>

        <Section title="6. Armazenamento e segurança">
          <P>
            Seus dados são armazenados em servidores seguros com criptografia em trânsito (HTTPS/TLS) e
            em repouso. Implementamos medidas técnicas e organizacionais para proteger suas informações
            contra acesso não autorizado, perda ou destruição.
          </P>
          <P>
            Mantemos seus dados pelo tempo necessário para a prestação dos serviços ou conforme exigido
            por obrigações legais. Após o encerramento da conta, dados pessoais são excluídos em até 90 dias.
          </P>
        </Section>

        <Section title="7. Seus direitos (LGPD)">
          <P>Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</P>
          <ul style={{ paddingLeft: 20 }}>
            <Li>Confirmar a existência de tratamento dos seus dados.</Li>
            <Li>Acessar os dados que temos sobre você.</Li>
            <Li>Corrigir dados incompletos, inexatos ou desatualizados.</Li>
            <Li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.</Li>
            <Li>Solicitar a portabilidade dos seus dados.</Li>
            <Li>Revogar o consentimento a qualquer momento.</Li>
          </ul>
          <P>
            Para exercer qualquer desses direitos, envie um e-mail para{' '}
            <a href="mailto:contato@orbinutri.com.br" style={{ color: T.brand }}>contato@orbinutri.com.br</a>.
          </P>
        </Section>

        <Section title="8. Cookies">
          <P>
            Utilizamos cookies essenciais para manter sua sessão ativa e preferências de uso.
            Não utilizamos cookies de rastreamento de terceiros ou publicidade comportamental.
          </P>
        </Section>

        <Section title="9. Alterações nesta política">
          <P>
            Podemos atualizar esta Política de Privacidade periodicamente. Quando realizarmos alterações
            significativas, notificaremos você por e-mail ou por aviso dentro da plataforma. O uso
            contínuo da plataforma após as alterações implica aceitação da nova versão.
          </P>
        </Section>

        <Section title="10. Contato">
          <P>
            Em caso de dúvidas, solicitações ou reclamações relacionadas à privacidade dos seus dados,
            entre em contato pelo e-mail:{' '}
            <a href="mailto:contato@orbinutri.com.br" style={{ color: T.brand }}>contato@orbinutri.com.br</a>
          </P>
        </Section>

        {/* Footer link */}
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 32, marginTop: 48, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <a href="/termos-de-uso" style={{ color: T.brand, fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>
            Termos de Uso →
          </a>
          <a href="mailto:contato@orbinutri.com.br" style={{ color: T.muted, fontSize: 14, textDecoration: 'none' }}>
            contato@orbinutri.com.br
          </a>
        </div>
      </main>
    </div>
  )
}
