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

export function TermsOfUse() {
  const navigate = useNavigate()

  return (
    <div style={{ background: T.bg, minHeight: '100vh', ...DISPLAY }}>
      {/* Header */}
      <header style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 10 }}>
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
            Termos de Uso
          </h1>
          <p style={{ color: T.muted, fontSize: 14 }}>
            Última atualização: 25 de maio de 2026
          </p>
        </div>

        <Section title="1. Aceitação dos termos">
          <P>
            Ao acessar ou usar a plataforma <strong>Orbinutri</strong> ("Serviço"), você concorda com estes
            Termos de Uso. Se não concordar com alguma parte, não utilize o Serviço.
          </P>
          <P>
            Estes termos se aplicam a todos os usuários da plataforma, incluindo nutricionistas cadastrados
            e seus respectivos pacientes que acessam funcionalidades públicas (como planos alimentares
            e agendamentos).
          </P>
        </Section>

        <Section title="2. Descrição do serviço">
          <P>
            A Orbinutri é uma plataforma SaaS destinada a profissionais de nutrição, oferecendo ferramentas para:
          </P>
          <ul style={{ paddingLeft: 20 }}>
            <Li>Gestão de agenda e consultas.</Li>
            <Li>Criação e compartilhamento de planos alimentares.</Li>
            <Li>Gerenciamento de pacientes e prontuários.</Li>
            <Li>Controle financeiro da clínica ou consultório.</Li>
            <Li>Automações de comunicação via WhatsApp.</Li>
          </ul>
        </Section>

        <Section title="3. Elegibilidade e cadastro">
          <P>
            Para utilizar o Serviço como nutricionista, você deve:
          </P>
          <ul style={{ paddingLeft: 20 }}>
            <Li>Ter capacidade legal para firmar contratos (ser maior de 18 anos ou emancipado).</Li>
            <Li>Ser profissional habilitado ou estudante de nutrição responsável pelas informações inseridas.</Li>
            <Li>Fornecer informações verídicas no cadastro.</Li>
          </ul>
          <P>
            Você é responsável por manter a confidencialidade de sua senha e por todas as atividades
            realizadas na sua conta.
          </P>
        </Section>

        <Section title="4. Uso aceitável">
          <P>Você concorda em não utilizar a plataforma para:</P>
          <ul style={{ paddingLeft: 20 }}>
            <Li>Atividades ilegais ou que violem direitos de terceiros.</Li>
            <Li>Inserir dados falsos ou enganosos sobre pacientes.</Li>
            <Li>Realizar engenharia reversa, scraping ou tentativas de acesso não autorizado.</Li>
            <Li>Compartilhar sua conta com outros profissionais sem autorização expressa.</Li>
            <Li>Enviar comunicações não solicitadas (spam) pelos canais integrados à plataforma.</Li>
          </ul>
        </Section>

        <Section title="5. Responsabilidade sobre dados de pacientes">
          <P>
            O nutricionista é o controlador dos dados inseridos sobre seus pacientes. A Orbinutri atua
            como processadora desses dados, conforme definido na LGPD (Lei nº 13.709/2018).
          </P>
          <P>
            É responsabilidade exclusiva do profissional:
          </P>
          <ul style={{ paddingLeft: 20 }}>
            <Li>Obter o consentimento dos pacientes para coleta e tratamento de dados.</Li>
            <Li>Garantir a precisão e atualização das informações inseridas.</Li>
            <Li>Cumprir as obrigações éticas e legais da profissão de nutricionista.</Li>
          </ul>
        </Section>

        <Section title="6. Pagamentos e assinatura">
          <P>
            O acesso às funcionalidades completas da plataforma requer uma assinatura ativa, cobrada
            mensalmente ou anualmente conforme o plano escolhido. Os pagamentos são processados por
            Stripe (cartão de crédito/boleto) ou AbacatePay (PIX).
          </P>
          <P>
            O cancelamento da assinatura pode ser feito a qualquer momento. O acesso permanece ativo
            até o final do período já pago. Não realizamos reembolsos proporcionais por cancelamentos
            antecipados, salvo em casos previstos pelo Código de Defesa do Consumidor.
          </P>
        </Section>

        <Section title="7. Propriedade intelectual">
          <P>
            Todo o conteúdo, design, código e funcionalidades da plataforma são de propriedade da Orbinutri
            e protegidos por leis de propriedade intelectual. É proibida a reprodução, distribuição ou
            criação de obras derivadas sem autorização prévia e por escrito.
          </P>
          <P>
            Os dados e conteúdos inseridos por você (planos alimentares, informações de pacientes, etc.)
            permanecem de sua propriedade. Ao inserir conteúdo na plataforma, você nos concede uma licença
            limitada para armazená-lo e processá-lo com o único objetivo de prestar o Serviço.
          </P>
        </Section>

        <Section title="8. Disponibilidade e limitação de responsabilidade">
          <P>
            Nos esforçamos para manter a plataforma disponível 24/7, mas não garantimos disponibilidade
            ininterrupta. Realizamos manutenções programadas quando necessário, com aviso prévio sempre
            que possível.
          </P>
          <P>
            A Orbinutri não se responsabiliza por danos indiretos, incidentais ou consequenciais decorrentes
            do uso ou impossibilidade de uso do Serviço. Nossa responsabilidade total está limitada ao valor
            pago nos últimos 3 meses de assinatura.
          </P>
        </Section>

        <Section title="9. Rescisão">
          <P>
            Podemos suspender ou encerrar sua conta em caso de violação destes Termos, atividade fraudulenta
            ou uso que prejudique outros usuários ou a plataforma. Em caso de encerramento por nossa iniciativa
            sem justa causa, você será notificado com 30 dias de antecedência.
          </P>
        </Section>

        <Section title="10. Alterações nos termos">
          <P>
            Podemos modificar estes Termos a qualquer momento. Alterações significativas serão comunicadas
            por e-mail ou por aviso na plataforma com pelo menos 15 dias de antecedência. O uso contínuo
            após a vigência das alterações constitui aceitação dos novos termos.
          </P>
        </Section>

        <Section title="11. Lei aplicável e foro">
          <P>
            Estes Termos são regidos pelas leis brasileiras. Qualquer disputa será resolvida no foro da
            comarca de domicílio do usuário, conforme previsto no Código de Defesa do Consumidor, ou por
            arbitragem, mediante acordo entre as partes.
          </P>
        </Section>

        <Section title="12. Contato">
          <P>
            Para questões relacionadas a estes Termos, entre em contato pelo e-mail:{' '}
            <a href="mailto:contato@orbinutri.com.br" style={{ color: T.brand }}>contato@orbinutri.com.br</a>
          </P>
        </Section>

        {/* Footer link */}
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 32, marginTop: 48, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <a href="/politica-de-privacidade" style={{ color: T.brand, fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>
            Política de Privacidade →
          </a>
          <a href="mailto:contato@orbinutri.com.br" style={{ color: T.muted, fontSize: 14, textDecoration: 'none' }}>
            contato@orbinutri.com.br
          </a>
        </div>
      </main>
    </div>
  )
}
