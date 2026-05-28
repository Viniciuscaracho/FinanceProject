# frozen_string_literal: true
# Templates de documentos clínicos para nutricionistas
# Baseados nas Resoluções CFN nº 594/2017 e 600/2018

NUTRI_TEMPLATES = [
  {
    name: 'Prescrição Dietética',
    description: 'Documento exclusivo do nutricionista com prescrição da dieta, VET e distribuição de macronutrientes (CFN / Lei 8.234/91)',
    professional_type: 'nutricionista',
    enable_sessions: false,
    content: <<~HTML
      <div style="max-width:800px;margin:0 auto;padding:48px 40px;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;line-height:1.6">
        <!-- Cabeçalho -->
        <div style="border-bottom:3px solid #10b981;padding-bottom:20px;margin-bottom:32px;display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <h1 style="font-size:26px;font-weight:800;color:#065f46;margin:0;text-transform:uppercase;letter-spacing:1px">Prescrição Dietética</h1>
            <p style="font-size:13px;color:#6b7280;margin:6px 0 0">[MINHA_EMPRESA]</p>
            <p style="font-size:12px;color:#9ca3af;margin:2px 0">CRN: [REGISTRO_PROFISSIONAL]</p>
          </div>
          <div style="text-align:right;font-size:12px;color:#6b7280">
            <p style="margin:0"><strong>Data:</strong> [DATA_ATUAL]</p>
          </div>
        </div>

        <!-- Identificação -->
        <div style="background:#f0fdf4;border-left:4px solid #10b981;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px">
          <h3 style="font-size:14px;font-weight:700;color:#065f46;margin:0 0 10px;text-transform:uppercase;letter-spacing:.5px">Dados do Paciente</h3>
          <table style="width:100%;font-size:13px;border-collapse:collapse">
            <tr>
              <td style="padding:3px 0;width:50%"><strong>Nome:</strong> [NOME_CLIENTE]</td>
              <td style="padding:3px 0"><strong>Data de nasc.:</strong> ___/___/______</td>
            </tr>
            <tr>
              <td style="padding:3px 0"><strong>Peso atual:</strong> ______ kg</td>
              <td style="padding:3px 0"><strong>Estatura:</strong> ______ m</td>
            </tr>
            <tr>
              <td style="padding:3px 0"><strong>IMC:</strong> ______ kg/m²</td>
              <td style="padding:3px 0"><strong>Objetivo:</strong> ________________________________</td>
            </tr>
          </table>
        </div>

        <!-- Prescrição calórica -->
        <h2 style="font-size:16px;font-weight:700;color:#065f46;border-bottom:1px solid #d1fae5;padding-bottom:8px;margin:24px 0 16px">1. Valor Energético Total (VET)</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px">
          <thead>
            <tr style="background:#ecfdf5">
              <th style="padding:8px 12px;text-align:left;border:1px solid #d1fae5;font-weight:700">Macronutriente</th>
              <th style="padding:8px 12px;text-align:center;border:1px solid #d1fae5;font-weight:700">% do VET</th>
              <th style="padding:8px 12px;text-align:center;border:1px solid #d1fae5;font-weight:700">Gramas/dia</th>
              <th style="padding:8px 12px;text-align:center;border:1px solid #d1fae5;font-weight:700">Kcal/dia</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:8px 12px;border:1px solid #d1fae5">Carboidratos</td>
              <td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center">_____%</td>
              <td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center">_____ g</td>
              <td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center">_____ kcal</td>
            </tr>
            <tr style="background:#f9fafb">
              <td style="padding:8px 12px;border:1px solid #d1fae5">Proteínas</td>
              <td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center">_____%</td>
              <td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center">_____ g</td>
              <td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center">_____ kcal</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;border:1px solid #d1fae5">Lipídios</td>
              <td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center">_____%</td>
              <td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center">_____ g</td>
              <td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center">_____ kcal</td>
            </tr>
            <tr style="background:#ecfdf5;font-weight:700">
              <td style="padding:8px 12px;border:1px solid #d1fae5">TOTAL</td>
              <td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center">100%</td>
              <td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center">_____ g</td>
              <td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center">_____ kcal</td>
            </tr>
          </tbody>
        </table>

        <!-- Distribuição por refeição -->
        <h2 style="font-size:16px;font-weight:700;color:#065f46;border-bottom:1px solid #d1fae5;padding-bottom:8px;margin:24px 0 16px">2. Distribuição das Refeições</h2>
        <div style="font-size:13px;margin-bottom:24px">[CONTEUDO_DOCUMENTO]</div>

        <!-- Restrições e orientações -->
        <h2 style="font-size:16px;font-weight:700;color:#065f46;border-bottom:1px solid #d1fae5;padding-bottom:8px;margin:24px 0 16px">3. Alimentos e Conduta</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:13px;margin-bottom:32px">
          <div style="border:1px solid #d1fae5;border-radius:8px;padding:14px">
            <p style="font-weight:700;color:#065f46;margin:0 0 8px">✓ Priorizar</p>
            <p style="color:#374151;margin:0;min-height:60px"></p>
          </div>
          <div style="border:1px solid #fecaca;border-radius:8px;padding:14px">
            <p style="font-weight:700;color:#991b1b;margin:0 0 8px">✗ Evitar / Restringir</p>
            <p style="color:#374151;margin:0;min-height:60px"></p>
          </div>
        </div>

        <!-- Observações -->
        <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:40px;font-size:13px">
          <p style="font-weight:700;color:#92400e;margin:0 0 6px">Observações:</p>
          <p style="margin:0;color:#374151">[ORIENTACOES]</p>
        </div>

        <!-- Assinatura -->
        <div style="margin-top:48px;display:flex;justify-content:space-between;font-size:12px;color:#6b7280">
          <div>
            <div style="border-top:1px solid #374151;padding-top:8px;width:220px;text-align:center">
              <p style="margin:0;font-weight:600;color:#1a1a2e">[NOME_PROFISSIONAL]</p>
              <p style="margin:2px 0">Nutricionista · CRN [REGISTRO_PROFISSIONAL]</p>
              <p style="margin:2px 0">Data: [DATA_ATUAL]</p>
            </div>
          </div>
          <div>
            <div style="border-top:1px solid #374151;padding-top:8px;width:220px;text-align:center">
              <p style="margin:0">Assinatura do paciente</p>
            </div>
          </div>
        </div>

        <p style="font-size:10px;color:#9ca3af;margin-top:32px;text-align:center">
          Documento emitido em conformidade com a Resolução CFN nº 594/2017 · [DATA_ATUAL]
        </p>
      </div>
    HTML
  },

  {
    name: 'Diagnóstico Nutricional',
    description: 'Avaliação antropométrica, bioquímica, clínica e dietética com diagnóstico nutricional conforme Res. CFN 594/2017',
    professional_type: 'nutricionista',
    enable_sessions: false,
    content: <<~HTML
      <div style="max-width:800px;margin:0 auto;padding:48px 40px;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;line-height:1.6">
        <div style="border-bottom:3px solid #10b981;padding-bottom:20px;margin-bottom:32px">
          <h1 style="font-size:26px;font-weight:800;color:#065f46;margin:0;text-transform:uppercase">Diagnóstico Nutricional</h1>
          <p style="font-size:13px;color:#6b7280;margin:6px 0 0">[MINHA_EMPRESA] · CRN: [REGISTRO_PROFISSIONAL]</p>
          <p style="font-size:12px;color:#9ca3af;margin:2px 0">Data da avaliação: [DATA_ATUAL]</p>
        </div>

        <div style="background:#f0fdf4;border-left:4px solid #10b981;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:28px">
          <p style="margin:0;font-size:13px"><strong>Paciente:</strong> [NOME_CLIENTE]</p>
        </div>

        <!-- Antropometria -->
        <h2 style="font-size:15px;font-weight:700;color:#065f46;margin:0 0 12px">1. Avaliação Antropométrica</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px">
          <tr style="background:#ecfdf5">
            <th style="padding:8px 10px;border:1px solid #d1fae5;text-align:left">Indicador</th>
            <th style="padding:8px 10px;border:1px solid #d1fae5;text-align:center">Resultado</th>
            <th style="padding:8px 10px;border:1px solid #d1fae5;text-align:center">Referência</th>
            <th style="padding:8px 10px;border:1px solid #d1fae5;text-align:center">Classificação</th>
          </tr>
          <tr><td style="padding:7px 10px;border:1px solid #d1fae5">Peso (kg)</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center">—</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td></tr>
          <tr style="background:#f9fafb"><td style="padding:7px 10px;border:1px solid #d1fae5">Estatura (m)</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center">—</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td></tr>
          <tr><td style="padding:7px 10px;border:1px solid #d1fae5">IMC (kg/m²)</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center">18,5–24,9</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td></tr>
          <tr style="background:#f9fafb"><td style="padding:7px 10px;border:1px solid #d1fae5">Circ. abdominal (cm)</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center">&lt;80 F / &lt;94 M</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td></tr>
          <tr><td style="padding:7px 10px;border:1px solid #d1fae5">% Gordura corporal</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center">20–30% F / 10–22% M</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td></tr>
          <tr style="background:#f9fafb"><td style="padding:7px 10px;border:1px solid #d1fae5">Massa muscular (kg)</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center">—</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td></tr>
        </table>

        <!-- Bioquímica -->
        <h2 style="font-size:15px;font-weight:700;color:#065f46;margin:0 0 12px">2. Avaliação Bioquímica</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px">
          <tr style="background:#ecfdf5">
            <th style="padding:8px 10px;border:1px solid #d1fae5;text-align:left">Exame</th>
            <th style="padding:8px 10px;border:1px solid #d1fae5;text-align:center">Resultado</th>
            <th style="padding:8px 10px;border:1px solid #d1fae5;text-align:center">Referência</th>
            <th style="padding:8px 10px;border:1px solid #d1fae5;text-align:center">Avaliação</th>
          </tr>
          <tr><td style="padding:7px 10px;border:1px solid #d1fae5">Glicemia de jejum (mg/dL)</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center">70–99</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td></tr>
          <tr style="background:#f9fafb"><td style="padding:7px 10px;border:1px solid #d1fae5">Hemoglobina (g/dL)</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center">12–16 F / 13,5–17,5 M</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td></tr>
          <tr><td style="padding:7px 10px;border:1px solid #d1fae5">Colesterol total (mg/dL)</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center">&lt;190</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td></tr>
          <tr style="background:#f9fafb"><td style="padding:7px 10px;border:1px solid #d1fae5">Triglicerídeos (mg/dL)</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center">&lt;150</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td></tr>
          <tr><td style="padding:7px 10px;border:1px solid #d1fae5">Vitamina D (ng/mL)</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center">≥30</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td></tr>
          <tr style="background:#f9fafb"><td style="padding:7px 10px;border:1px solid #d1fae5">Ferritina (ng/mL)</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center">12–150 F / 12–300 M</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td></tr>
        </table>

        <!-- Diagnóstico -->
        <h2 style="font-size:15px;font-weight:700;color:#065f46;margin:0 0 12px">3. Diagnóstico Nutricional</h2>
        <div style="border:1px solid #d1fae5;border-radius:8px;padding:16px 20px;font-size:13px;margin-bottom:24px;min-height:80px">[CONTEUDO_DOCUMENTO]</div>

        <!-- Conduta -->
        <h2 style="font-size:15px;font-weight:700;color:#065f46;margin:0 0 12px">4. Conduta Nutricional</h2>
        <div style="border:1px solid #d1fae5;border-radius:8px;padding:16px 20px;font-size:13px;margin-bottom:40px;min-height:60px">[ORIENTACOES]</div>

        <!-- Assinatura -->
        <div style="border-top:1px solid #374151;padding-top:16px;text-align:center;font-size:12px;color:#374151">
          <p style="margin:0;font-weight:600">[NOME_PROFISSIONAL]</p>
          <p style="margin:2px 0">Nutricionista · CRN [REGISTRO_PROFISSIONAL]</p>
          <p style="margin:2px 0">Data: [DATA_ATUAL]</p>
        </div>
      </div>
    HTML
  },

  {
    name: 'Evolução Nutricional',
    description: 'Registro de acompanhamento — progresso antropométrico, adesão ao plano, condutas atualizadas',
    professional_type: 'nutricionista',
    enable_sessions: true,
    content: <<~HTML
      <div style="max-width:800px;margin:0 auto;padding:48px 40px;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;line-height:1.6">
        <div style="border-bottom:3px solid #10b981;padding-bottom:16px;margin-bottom:28px">
          <h1 style="font-size:22px;font-weight:800;color:#065f46;margin:0;text-transform:uppercase">Evolução Nutricional</h1>
          <p style="font-size:12px;color:#9ca3af;margin:6px 0 0">[MINHA_EMPRESA] · CRN: [REGISTRO_PROFISSIONAL]</p>
        </div>

        <div style="background:#f0fdf4;border-left:4px solid #10b981;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:24px;font-size:13px">
          <p style="margin:0"><strong>Paciente:</strong> [NOME_CLIENTE] &nbsp;|&nbsp; <strong>Consulta nº:</strong> [NUMERO_SESSAO] &nbsp;|&nbsp; <strong>Data:</strong> [DATA_ATUAL]</p>
        </div>

        <!-- Progresso -->
        <h2 style="font-size:15px;font-weight:700;color:#065f46;margin:0 0 12px">Evolução Antropométrica</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px">
          <tr style="background:#ecfdf5">
            <th style="padding:8px 10px;border:1px solid #d1fae5;text-align:left">Indicador</th>
            <th style="padding:8px 10px;border:1px solid #d1fae5;text-align:center">Consulta anterior</th>
            <th style="padding:8px 10px;border:1px solid #d1fae5;text-align:center">Hoje</th>
            <th style="padding:8px 10px;border:1px solid #d1fae5;text-align:center">Variação</th>
          </tr>
          <tr><td style="padding:7px 10px;border:1px solid #d1fae5">Peso (kg)</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td></tr>
          <tr style="background:#f9fafb"><td style="padding:7px 10px;border:1px solid #d1fae5">Circ. abdominal (cm)</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td></tr>
          <tr><td style="padding:7px 10px;border:1px solid #d1fae5">% Gordura corporal</td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:7px 10px;border:1px solid #d1fae5;text-align:center"></td></tr>
        </table>

        <h2 style="font-size:15px;font-weight:700;color:#065f46;margin:0 0 10px">Relato do Paciente / Adesão ao Plano</h2>
        <div style="border:1px solid #d1fae5;border-radius:8px;padding:14px;font-size:13px;margin-bottom:20px;min-height:60px">[CONTEUDO_DOCUMENTO]</div>

        <h2 style="font-size:15px;font-weight:700;color:#065f46;margin:0 0 10px">Conduta e Ajustes Realizados</h2>
        <div style="border:1px solid #d1fae5;border-radius:8px;padding:14px;font-size:13px;margin-bottom:20px;min-height:60px">[PROGRESSO_CLIENTE]</div>

        <h2 style="font-size:15px;font-weight:700;color:#065f46;margin:0 0 10px">Orientações para o Próximo Período</h2>
        <div style="border:1px solid #d1fae5;border-radius:8px;padding:14px;font-size:13px;margin-bottom:40px;min-height:50px">[ORIENTACOES]</div>

        <div style="text-align:center;font-size:12px;color:#374151;border-top:1px solid #e5e7eb;padding-top:14px">
          <p style="margin:0;font-weight:600">[NOME_PROFISSIONAL]</p>
          <p style="margin:2px 0">Nutricionista · CRN [REGISTRO_PROFISSIONAL] · [DATA_ATUAL]</p>
        </div>
      </div>
    HTML
  },

  {
    name: 'Orientação Alimentar',
    description: 'Guia prático de escolhas alimentares, substituições e hábitos — pode ser compartilhado com o paciente',
    professional_type: 'nutricionista',
    enable_sessions: false,
    content: <<~HTML
      <div style="max-width:800px;margin:0 auto;padding:48px 40px;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;line-height:1.7">
        <div style="border-bottom:3px solid #10b981;padding-bottom:16px;margin-bottom:28px">
          <h1 style="font-size:24px;font-weight:800;color:#065f46;margin:0;text-transform:uppercase">Orientação Alimentar</h1>
          <p style="font-size:13px;color:#6b7280;margin:6px 0 0">[MINHA_EMPRESA] · [NOME_PROFISSIONAL] · CRN: [REGISTRO_PROFISSIONAL]</p>
        </div>

        <div style="background:#f0fdf4;padding:14px 18px;border-radius:8px;margin-bottom:24px;font-size:13px">
          <strong>Paciente:</strong> [NOME_CLIENTE] &nbsp;·&nbsp; <strong>Data:</strong> [DATA_ATUAL]
        </div>

        <p style="font-size:14px;color:#374151;margin-bottom:28px">[CONTEUDO_DOCUMENTO]</p>

        <!-- Grupos alimentares -->
        <h2 style="font-size:15px;font-weight:700;color:#065f46;margin:0 0 14px">Guia de Substituições</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:28px">
          <tr style="background:#ecfdf5">
            <th style="padding:8px 12px;border:1px solid #d1fae5;text-align:left">Alimento</th>
            <th style="padding:8px 12px;border:1px solid #d1fae5;text-align:left">Substituição equivalente</th>
            <th style="padding:8px 12px;border:1px solid #d1fae5;text-align:center">Porção</th>
          </tr>
          <tr><td style="padding:7px 12px;border:1px solid #d1fae5"></td><td style="padding:7px 12px;border:1px solid #d1fae5"></td><td style="padding:7px 12px;border:1px solid #d1fae5;text-align:center"></td></tr>
          <tr style="background:#f9fafb"><td style="padding:7px 12px;border:1px solid #d1fae5"></td><td style="padding:7px 12px;border:1px solid #d1fae5"></td><td style="padding:7px 12px;border:1px solid #d1fae5;text-align:center"></td></tr>
          <tr><td style="padding:7px 12px;border:1px solid #d1fae5"></td><td style="padding:7px 12px;border:1px solid #d1fae5"></td><td style="padding:7px 12px;border:1px solid #d1fae5;text-align:center"></td></tr>
        </table>

        <h2 style="font-size:15px;font-weight:700;color:#065f46;margin:0 0 12px">Dicas e Orientações</h2>
        <div style="font-size:13px;margin-bottom:32px">[ORIENTACOES]</div>

        <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:0 8px 8px 0;font-size:12px;color:#92400e;margin-bottom:32px">
          <strong>Lembrete:</strong> Este documento é um guia personalizado. Em caso de sintomas adversos, entre em contato imediatamente.
        </div>

        <div style="text-align:center;font-size:12px;color:#374151;border-top:1px solid #e5e7eb;padding-top:14px">
          <p style="margin:0;font-weight:600">[NOME_PROFISSIONAL] · CRN [REGISTRO_PROFISSIONAL]</p>
          <p style="margin:2px 0">Emitido em [DATA_ATUAL]</p>
        </div>
      </div>
    HTML
  },

  {
    name: 'Laudo Nutricional',
    description: 'Relatório formal para fins médico-legais, encaminhamentos ou perícias — requer assinatura e CRN (Res. CFN 594/2017)',
    professional_type: 'nutricionista',
    enable_sessions: false,
    content: <<~HTML
      <div style="max-width:800px;margin:0 auto;padding:48px 40px;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;line-height:1.7">
        <div style="border-bottom:3px solid #065f46;padding-bottom:16px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:flex-end">
          <div>
            <h1 style="font-size:22px;font-weight:800;color:#065f46;margin:0;text-transform:uppercase;letter-spacing:1px">Laudo Nutricional</h1>
            <p style="font-size:12px;color:#6b7280;margin:6px 0 0">[MINHA_EMPRESA]</p>
          </div>
          <div style="text-align:right;font-size:12px;color:#6b7280">
            <p style="margin:0">Nº do laudo: ____________</p>
            <p style="margin:2px 0">Data: [DATA_ATUAL]</p>
          </div>
        </div>

        <!-- Identificação -->
        <div style="border:1px solid #d1fae5;border-radius:8px;padding:16px 20px;margin-bottom:24px;font-size:13px">
          <h3 style="font-size:13px;font-weight:700;color:#065f46;margin:0 0 10px;text-transform:uppercase">I — Identificação</h3>
          <p style="margin:3px 0"><strong>Paciente:</strong> [NOME_CLIENTE]</p>
          <p style="margin:3px 0"><strong>Data de nascimento:</strong> ___/___/______</p>
          <p style="margin:3px 0"><strong>Finalidade do laudo:</strong> ____________________________________________</p>
        </div>

        <!-- Metodologia -->
        <h3 style="font-size:14px;font-weight:700;color:#065f46;margin:0 0 10px;text-transform:uppercase">II — Métodos Utilizados</h3>
        <div style="font-size:13px;margin-bottom:20px;min-height:50px;border:1px solid #e5e7eb;border-radius:8px;padding:12px"></div>

        <!-- Resultados -->
        <h3 style="font-size:14px;font-weight:700;color:#065f46;margin:0 0 10px;text-transform:uppercase">III — Resultados e Avaliação</h3>
        <div style="font-size:13px;margin-bottom:20px;min-height:80px;border:1px solid #e5e7eb;border-radius:8px;padding:12px">[CONTEUDO_DOCUMENTO]</div>

        <!-- Diagnóstico -->
        <h3 style="font-size:14px;font-weight:700;color:#065f46;margin:0 0 10px;text-transform:uppercase">IV — Diagnóstico Nutricional</h3>
        <div style="background:#f0fdf4;border-radius:8px;padding:14px 18px;font-size:13px;margin-bottom:20px;min-height:60px">[PROGRESSO_CLIENTE]</div>

        <!-- Recomendações -->
        <h3 style="font-size:14px;font-weight:700;color:#065f46;margin:0 0 10px;text-transform:uppercase">V — Recomendações</h3>
        <div style="font-size:13px;margin-bottom:40px;min-height:60px;border:1px solid #e5e7eb;border-radius:8px;padding:12px">[ORIENTACOES]</div>

        <!-- Assinatura formal -->
        <div style="margin-top:40px;display:flex;justify-content:flex-end">
          <div style="text-align:center">
            <div style="width:280px;border-top:1px solid #374151;padding-top:10px;font-size:12px;color:#374151">
              <p style="margin:0;font-weight:700;font-size:13px">[NOME_PROFISSIONAL]</p>
              <p style="margin:2px 0">Nutricionista</p>
              <p style="margin:2px 0">CRN [REGISTRO_PROFISSIONAL]</p>
              <p style="margin:2px 0">[DATA_ATUAL]</p>
            </div>
          </div>
        </div>

        <p style="font-size:10px;color:#9ca3af;margin-top:40px;text-align:center">
          Documento emitido em conformidade com a Resolução CFN nº 594/2017
        </p>
      </div>
    HTML
  },

  {
    name: 'Atestado de Consulta',
    description: 'Atestado oficial confirmando a realização de consulta nutricional — para fins administrativos e justificativa de ausência',
    professional_type: 'nutricionista',
    enable_sessions: false,
    content: <<~HTML
      <div style="max-width:700px;margin:0 auto;padding:60px 48px;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;line-height:1.8;text-align:justify">
        <div style="text-align:center;border-bottom:3px solid #10b981;padding-bottom:20px;margin-bottom:40px">
          <h1 style="font-size:22px;font-weight:800;color:#065f46;margin:0;text-transform:uppercase;letter-spacing:2px">Atestado de Consulta</h1>
          <p style="font-size:13px;color:#6b7280;margin:8px 0 0">[MINHA_EMPRESA]</p>
        </div>

        <p style="font-size:15px;margin-bottom:28px">
          Atesto para os devidos fins que o(a) paciente <strong>[NOME_CLIENTE]</strong> compareceu à consulta de <strong>Nutrição Clínica</strong> realizada nesta data, com duração de aproximadamente ______ hora(s), no período das ______ às ______ horas.
        </p>

        <div style="background:#f0fdf4;border-radius:8px;padding:18px 24px;margin-bottom:32px;font-size:14px">
          <p style="margin:4px 0"><strong>Data da consulta:</strong> [DATA_ATUAL]</p>
          <p style="margin:4px 0"><strong>Local:</strong> _______________________________________________</p>
          <p style="margin:4px 0"><strong>CID (se aplicável):</strong> _______________</p>
        </div>

        <p style="font-size:14px;color:#374151;margin-bottom:40px">
          O(A) paciente encontra-se em acompanhamento nutricional. Este atestado é válido para fins de justificativa de ausência no trabalho/escola ou apresentação a plano de saúde, conforme necessidade.
        </p>

        <div style="text-align:center;margin-top:60px">
          <div style="display:inline-block;border-top:1px solid #374151;padding-top:12px;min-width:280px;font-size:13px;color:#374151">
            <p style="margin:0;font-weight:700;font-size:14px">[NOME_PROFISSIONAL]</p>
            <p style="margin:2px 0">Nutricionista · CRN [REGISTRO_PROFISSIONAL]</p>
            <p style="margin:2px 0">[DATA_ATUAL]</p>
          </div>
        </div>
      </div>
    HTML
  },

  {
    name: 'Recordatório Alimentar 24 Horas',
    description: 'Registro detalhado da ingestão alimentar nas últimas 24 horas — principal ferramenta de avaliação do consumo alimentar habitual',
    professional_type: 'nutricionista',
    enable_sessions: false,
    content: <<~HTML
      <div style="max-width:800px;margin:0 auto;padding:48px 40px;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;line-height:1.6">
        <div style="border-bottom:3px solid #10b981;padding-bottom:16px;margin-bottom:28px">
          <h1 style="font-size:22px;font-weight:800;color:#065f46;margin:0;text-transform:uppercase">Recordatório Alimentar 24h</h1>
          <p style="font-size:12px;color:#9ca3af;margin:6px 0 0">[MINHA_EMPRESA] · [NOME_PROFISSIONAL] · CRN: [REGISTRO_PROFISSIONAL]</p>
        </div>

        <div style="background:#f0fdf4;padding:14px 18px;border-radius:8px;margin-bottom:24px;font-size:13px;display:flex;gap:32px">
          <span><strong>Paciente:</strong> [NOME_CLIENTE]</span>
          <span><strong>Data de referência:</strong> ___/___/______</span>
          <span><strong>Dia da semana:</strong> ____________</span>
        </div>

        <!-- Tabela de refeições -->
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:28px">
          <thead>
            <tr style="background:#065f46;color:#fff">
              <th style="padding:10px 12px;text-align:left;border:1px solid #065f46">Refeição / Horário</th>
              <th style="padding:10px 12px;text-align:left;border:1px solid #065f46">Preparação / Alimento</th>
              <th style="padding:10px 12px;text-align:center;border:1px solid #065f46">Quantidade</th>
              <th style="padding:10px 12px;text-align:center;border:1px solid #065f46">Medida caseira</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background:#ecfdf5">
              <td style="padding:8px 12px;border:1px solid #d1fae5;font-weight:700;color:#065f46" rowspan="3">Café da manhã<br><span style="font-weight:400;color:#6b7280">__:__h</span></td>
              <td style="padding:8px 12px;border:1px solid #d1fae5"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td>
            </tr>
            <tr style="background:#f0fdf4"><td style="padding:8px 12px;border:1px solid #d1fae5"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td></tr>
            <tr style="background:#ecfdf5"><td style="padding:8px 12px;border:1px solid #d1fae5"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td></tr>

            <tr><td style="padding:8px 12px;border:1px solid #d1fae5;font-weight:700;color:#065f46" rowspan="2">Lanche da manhã<br><span style="font-weight:400;color:#6b7280">__:__h</span></td>
              <td style="padding:8px 12px;border:1px solid #d1fae5"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td>
            </tr>
            <tr><td style="padding:8px 12px;border:1px solid #d1fae5"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td></tr>

            <tr style="background:#ecfdf5"><td style="padding:8px 12px;border:1px solid #d1fae5;font-weight:700;color:#065f46" rowspan="4">Almoço<br><span style="font-weight:400;color:#6b7280">__:__h</span></td>
              <td style="padding:8px 12px;border:1px solid #d1fae5"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td>
            </tr>
            <tr style="background:#f0fdf4"><td style="padding:8px 12px;border:1px solid #d1fae5"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td></tr>
            <tr style="background:#ecfdf5"><td style="padding:8px 12px;border:1px solid #d1fae5"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td></tr>
            <tr style="background:#f0fdf4"><td style="padding:8px 12px;border:1px solid #d1fae5"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td></tr>

            <tr><td style="padding:8px 12px;border:1px solid #d1fae5;font-weight:700;color:#065f46" rowspan="2">Lanche da tarde<br><span style="font-weight:400;color:#6b7280">__:__h</span></td>
              <td style="padding:8px 12px;border:1px solid #d1fae5"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td>
            </tr>
            <tr><td style="padding:8px 12px;border:1px solid #d1fae5"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td></tr>

            <tr style="background:#ecfdf5"><td style="padding:8px 12px;border:1px solid #d1fae5;font-weight:700;color:#065f46" rowspan="3">Jantar<br><span style="font-weight:400;color:#6b7280">__:__h</span></td>
              <td style="padding:8px 12px;border:1px solid #d1fae5"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td>
            </tr>
            <tr style="background:#f0fdf4"><td style="padding:8px 12px;border:1px solid #d1fae5"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td></tr>
            <tr style="background:#ecfdf5"><td style="padding:8px 12px;border:1px solid #d1fae5"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td></tr>

            <tr><td style="padding:8px 12px;border:1px solid #d1fae5;font-weight:700;color:#065f46">Ceia<br><span style="font-weight:400;color:#6b7280">__:__h</span></td>
              <td style="padding:8px 12px;border:1px solid #d1fae5"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td><td style="padding:8px 12px;border:1px solid #d1fae5;text-align:center"></td>
            </tr>
          </tbody>
        </table>

        <!-- Ingestão hídrica -->
        <h2 style="font-size:14px;font-weight:700;color:#065f46;margin:0 0 10px">Ingestão Hídrica e Observações</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:24px;font-size:13px">
          <div style="border:1px solid #d1fae5;border-radius:8px;padding:12px">
            <p style="margin:0 0 6px;font-weight:700;color:#065f46">Líquidos (total do dia)</p>
            <p style="margin:0">Água: ______ ml &nbsp;|&nbsp; Outros: _________________</p>
          </div>
          <div style="border:1px solid #d1fae5;border-radius:8px;padding:12px">
            <p style="margin:0 0 6px;font-weight:700;color:#065f46">Observações</p>
            <p style="margin:0">[CONTEUDO_DOCUMENTO]</p>
          </div>
        </div>

        <div style="text-align:center;font-size:12px;color:#374151;border-top:1px solid #e5e7eb;padding-top:14px">
          <p style="margin:0;font-weight:600">[NOME_PROFISSIONAL] · CRN [REGISTRO_PROFISSIONAL] · [DATA_ATUAL]</p>
        </div>
      </div>
    HTML
  }
].freeze

puts "Criando #{NUTRI_TEMPLATES.size} templates de documentos para nutricionistas..."

Account.find_each do |account|
  ActsAsTenant.with_tenant(account) do
    NUTRI_TEMPLATES.each do |tpl|
      existing = ProfessionalDocumentTemplate
        .where(account_id: account.id, name: tpl[:name])
        .first

      if existing
        puts "  [skip] #{account.id} — '#{tpl[:name]}' já existe"
      else
        ProfessionalDocumentTemplate.create!(
          account_id:        account.id,
          name:              tpl[:name],
          description:       tpl[:description],
          professional_type: tpl[:professional_type],
          enable_sessions:   tpl[:enable_sessions],
          default:           true,
          content:           tpl[:content].strip
        )
        puts "  [ok]   #{account.id} — '#{tpl[:name]}'"
      end
    end
  end
end

puts "✅ Templates de documentos nutricionistas criados com sucesso."
