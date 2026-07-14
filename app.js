/* ============================================================
   THEUSMARKT – APP.JS  v3.1
   Novidades: tema claro/escuro persistente
   ============================================================ */

// Apply saved theme immediately (before login)
(function() {
  const t = localStorage.getItem('theusmarkt_theme');
  if (t === 'light') {
    document.body.classList.add('light');
    // Swap logos after DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
      ['loginLogo', 'sidebarLogo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.src = 'Logo_MMarkt_Preto.png';
      });
    });
  }
})();

// ─── AUTH ────────────────────────────────────────────────────
const PASSWORD = 'M@110388';

function doLogin() {
  const val = document.getElementById('pwInput').value;
  if (val === PASSWORD) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('app').classList.remove('hidden');
    initApp();
  } else {
    document.getElementById('loginErr').textContent = 'Senha incorreta. Tente novamente.';
    document.getElementById('pwInput').value = '';
    document.getElementById('pwInput').focus();
  }
}
function togglePw() {
  const i = document.getElementById('pwInput');
  i.type = i.type === 'password' ? 'text' : 'password';
}
function logout() {
  document.getElementById('app').classList.add('hidden');
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('pwInput').value = '';
}

// ─── THEME ───────────────────────────────────────────────────
function applyTheme(theme) {
  const isLight = theme === 'light';
  document.body.classList.toggle('light', isLight);

  // Swap logos
  const logoDark  = 'Logo_MMarkt.png';
  const logoLight = 'Logo_MMarkt_Preto.png';
  const logoSrc   = isLight ? logoLight : logoDark;
  ['loginLogo', 'sidebarLogo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.src = logoSrc;
  });

  // Re-render charts for theme-aware colors
  if (document.getElementById('page-dashboard')?.classList.contains('active')) {
    renderCharts(getFilteredCampaigns());
  }
}

function toggleTheme() {
  const isLight = document.body.classList.contains('light');
  const next    = isLight ? 'dark' : 'light';
  localStorage.setItem('theusmarkt_theme', next);
  applyTheme(next);
}

// ─── STATE ───────────────────────────────────────────────────
let state = {
  accounts: [],
  campaigns: [],
  ads: [],
  competitors: [],
  updateLog: [],
  aiAnalyses: {},
  anthropicKey: '',
  charts: {}
};

function loadState() {
  try {
    const s = localStorage.getItem('theusmarkt_v2');
    if (s) state = { ...state, ...JSON.parse(s) };
  } catch(e) {}
}
function saveState() {
  try {
    const toSave = { ...state };
    delete toSave.charts;
    localStorage.setItem('theusmarkt_v2', JSON.stringify(toSave));
  } catch(e) {}
}

// ─── INIT ────────────────────────────────────────────────────
// ── MOBILE SIDEBAR ───────────────────────────────────────────
function handleMenuToggle() {
  if (window.innerWidth <= 768) {
    toggleMobileSidebar();
  } else {
    toggleSidebar();
  }
}

function toggleMobileSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('mobileOverlay');
  if (!sb) return;
  const open = sb.classList.toggle('mobile-open');
  if (ov) ov.classList.toggle('active', open);
  document.body.style.overflow = open ? 'hidden' : '';
}
function closeMobileSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('mobileOverlay');
  if (sb) sb.classList.remove('mobile-open');
  if (ov) ov.classList.remove('active');
  document.body.style.overflow = '';
}
// Fecha sidebar mobile ao navegar entre páginas
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.innerWidth <= 768) closeMobileSidebar();
    });
  });
});


function initApp() {
  loadState();
  // Identidade do proprietário — gerenciado apenas via sistema
  (function(){
    const _o = atob('TU1hcmt0');
    const _r = atob('TWFya2V0aW5nIEVzdHJhdMOpZ2ljbw==');
    const _i = atob('TU0=');
    const el = document.getElementById('sbOwnerCard');
    if (!el) return;
    el.innerHTML = '<div class="sb-owner-card"><div class="sb-owner-avatar">'+_i+'</div><div class="sb-owner-info"><div class="sb-owner-name">'+_o+'</div><div class="sb-owner-role">'+_r+'</div></div></div>';
  })();
  // Aplica tema salvo
  const savedTheme = localStorage.getItem('theusmarkt_theme') || 'dark';
  applyTheme(savedTheme);
  // Remove contas DEMO legadas automaticamente
  state.accounts  = state.accounts.filter(a => !a.isDemo);
  state.campaigns = state.campaigns.filter(c => c.source !== 'demo');
  state.ads       = state.ads.filter(a => !!state.campaigns.find(c => c.id === a.campaignId));
  saveState();
  renderAccountFilter();
  renderDashboard();
  renderCampaigns();
  renderTopAds();
  renderImprovements();
  renderCompetitors();
  renderAccountsList();
  renderSchedule();
  startScheduler();
  updateSyncText();
}

// ─── DEMO DATA ───────────────────────────────────────────────
function seedDemoData() {
  state.accounts = [
    { id: 'demo1', name: 'DEMO – Meta Ads', platform: 'meta', token: 'DEMO', accId: 'act_000000', active: true, isDemo: true },
  ];
  state.campaigns = [
    { id: 'c1', name: 'Conversão – Produto Estrela', accountId: 'demo1', objective: 'conversao', status: 'ativa', budget: 150, spend: 4200, revenue: 18900, clicks: 3840, impressions: 142000, conversions: 126, platform: 'meta', source: 'demo' },
    { id: 'c2', name: 'Remarketing – Carrinho Abandonado', accountId: 'demo1', objective: 'conversao', status: 'ativa', budget: 80, spend: 2100, revenue: 11400, clicks: 1920, impressions: 68000, conversions: 87, platform: 'meta', source: 'demo' },
    { id: 'c3', name: 'Topo de Funil – Awareness', accountId: 'demo1', objective: 'awareness', status: 'ativa', budget: 200, spend: 5600, revenue: 8400, clicks: 12400, impressions: 680000, conversions: 34, platform: 'meta', source: 'demo' },
    { id: 'c6', name: 'Prospecção – Lookalike 1%', accountId: 'demo1', objective: 'conversao', status: 'ativa', budget: 100, spend: 2800, revenue: 6720, clicks: 4200, impressions: 190000, conversions: 42, platform: 'meta', source: 'demo' }
  ];
  state.ads = [];
  state.campaigns.forEach(c => {
    ['Criativo A – Vídeo','Criativo B – Carrossel','Criativo C – Imagem','Criativo D – Stories','Criativo E – Reels'].forEach((nm, i) => {
      const f = 1 - i * 0.15;
      state.ads.push({ id: `${c.id}_ad${i+1}`, campaignId: c.id, name: nm, spend: +(c.spend*f*0.25).toFixed(2), revenue: +(c.revenue*f*0.28).toFixed(2), clicks: Math.floor(c.clicks*f*0.25), impressions: Math.floor(c.impressions*f*0.22), conversions: Math.floor(c.conversions*f*0.28) });
    });
  });
  state.competitors = [];
  state.updateLog = [{ time: new Date(Date.now()-14400000).toISOString(), msg: 'Dados demo carregados – adicione contas reais em Contas & Tokens', type: 'info' }];
  saveState();
}

// ═══════════════════════════════════════════════════════════════
//  META ADS API – INTEGRAÇÃO REAL v2.1
//
//  ERRO COMUM #100 "nonexisting field (campaigns)":
//  Causas: token sem permissão ads_read, ID de conta errado,
//  ou domínio Netlify não registrado no App do Facebook.
//
//  REQUISITOS:
//  1. Token com permissões: ads_read + ads_management + business_management
//  2. ID da conta no formato act_XXXXXXXXXX (com "act_" na frente)
//  3. Domínio registrado: developers.facebook.com → App → Settings → Basic → Site URL
// ═══════════════════════════════════════════════════════════════

const META_API_VERSION = 'v21.0';
const META_BASE = 'https://graph.facebook.com';

const CAMPAIGN_FIELDS = 'id,name,status,objective,daily_budget,lifetime_budget,effective_status,start_time,stop_time';
const INSIGHT_FIELDS  = 'spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,action_values,website_purchase_roas';

// Tipos de conversão aceitos — em ordem de prioridade.
// Cobre purchase (e-commerce), lead (formulários/pixel),
// WhatsApp (messaging_first_reply) e outros objetivos comuns.
const CONVERSION_TYPES = [
  'purchase',
  'offsite_conversion.fb_pixel_purchase',
  'lead',
  'offsite_conversion.fb_pixel_lead',
  'onsite_conversion.messaging_first_reply',
  'onsite_conversion.messaging_conversation_started_7d',
  'contact',
  'complete_registration',
  'offsite_conversion.fb_pixel_complete_registration'
];
const REVENUE_TYPES = [
  'purchase',
  'offsite_conversion.fb_pixel_purchase'
];

// Normaliza o accId: garante que começa com "act_"
function normalizeAccId(raw) {
  if (!raw) return '';
  const clean = raw.trim().replace(/^act_/i, '');
  return `act_${clean}`;
}

async function fetchMetaAPI(path, params = {}) {
  const url = new URL(`${META_BASE}/${META_API_VERSION}/${path}`);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  let res;
  try {
    res = await fetch(url.toString());
  } catch(netErr) {
    throw new Error(`Erro de rede/CORS: ${netErr.message}. Verifique se o domínio está registrado no App Facebook.`);
  }
  const data = await res.json();
  if (data.error) {
    const code = data.error.code;
    const msg  = data.error.message || 'Erro desconhecido';
    // Erros comuns com mensagens amigáveis
    if (code === 100) throw new Error(`#100 Campo inválido – verifique se o ID da conta está no formato act_XXXXXXXXXX e se o token tem a permissão ads_read.`);
    if (code === 190) throw new Error(`#190 Token inválido ou expirado – gere um novo token no Graph API Explorer.`);
    if (code === 200 || code === 294) throw new Error(`#${code} Sem permissão – o token precisa de ads_read, ads_management e business_management.`);
    if (code === 17)  throw new Error(`#17 Limite de requisições atingido – aguarde alguns minutos e tente novamente.`);
    throw new Error(`#${code} ${msg}`);
  }
  return data;
}

async function syncMetaAccount(account) {
  if (account.isDemo) {
    showToast('Conta demo – adicione uma conta real para sincronizar', 'info');
    return 0;
  }

  // Normaliza o ID antes de qualquer requisição
  const accId = normalizeAccId(account.accId);
  if (!accId || accId === 'act_') {
    throw new Error('ID da conta inválido. Use o formato act_XXXXXXXXXX (ex: act_123456789).');
  }
  // Salva o ID normalizado
  account.accId = accId;
  saveState();

  showToast(`Sincronizando ${account.name}...`, 'info');
  const { since, until } = getActiveDateRange();

  // ── PASSO 1: Valida o token antes de prosseguir ──
  try {
    await fetchMetaAPI('me', { access_token: account.token, fields: 'id,name' });
  } catch(e) {
    throw new Error(`Token inválido: ${e.message}`);
  }

  // ── PASSO 2: Busca campanhas da conta ──
  let campData;
  try {
    campData = await fetchMetaAPI(`${accId}/campaigns`, {
      access_token: account.token,
      fields: CAMPAIGN_FIELDS,
      limit: 100
    });
  } catch(e) {
    // Tenta fallback sem o "act_" (algumas contas retornam assim)
    try {
      const rawId = accId.replace('act_', '');
      campData = await fetchMetaAPI(`${rawId}/campaigns`, {
        access_token: account.token,
        fields: CAMPAIGN_FIELDS,
        limit: 100
      });
    } catch(e2) {
      throw new Error(`Não foi possível buscar campanhas: ${e.message}`);
    }
  }

  if (!campData.data?.length) {
    showToast(`Nenhuma campanha encontrada em ${account.name}`, 'info');
    return 0;
  }

  // IDs retornados pela API neste sync — usado depois para detectar encerradas
  const returnedIds = new Set(campData.data.map(c => `meta_${c.id}`));

  let synced = 0;
  for (const camp of campData.data) {
    try {
      // ── PASSO 3: Insights da campanha ──
      // FIX: usa date_preset 'last_30d' para garantir dados reais independente
      // do filtro de data do dashboard. Usar time_range do dashboard causava
      // insights zerados em campanhas de períodos anteriores.
      let ins = {};
      try {
        const insights = await fetchMetaAPI(`${camp.id}/insights`, {
          access_token: account.token,
          fields: INSIGHT_FIELDS,
          date_preset: 'last_30d',
          level: 'campaign'
        });
        ins = insights.data?.[0] || {};
      } catch(e) {
        console.warn(`Insights indisponíveis para ${camp.name}:`, e.message);
        // Continua com zeros — a campanha ainda aparece no painel
      }

      const actions    = ins.actions    || [];
      const actionVals = ins.action_values || [];
      const spend      = parseFloat(ins.spend || 0);
      const clicks     = parseInt(ins.clicks || 0);
      const impressions= parseInt(ins.impressions || 0);

      // Busca conversão pelo primeiro tipo disponível (prioridade definida em CONVERSION_TYPES)
      const convAction = CONVERSION_TYPES.map(t => actions.find(a => a.action_type === t)).find(Boolean);
      const conversions = parseInt(convAction?.value || 0);

      // Receita: apenas para campanhas de purchase
      const revAction = REVENUE_TYPES.map(t => actionVals.find(a => a.action_type === t)).find(Boolean);
      const revenue = parseFloat(revAction?.value || 0);

      const obj = {
        id:          `meta_${camp.id}`,
        metaId:      camp.id,
        name:        camp.name,
        accountId:   account.id,
        objective:   mapMetaObjective(camp.objective),
        status:      ['ACTIVE','active'].includes(camp.effective_status)
                       ? 'ativa'
                       : ['COMPLETED','ARCHIVED','DELETED'].includes(camp.effective_status)
                         ? 'encerrada'
                         : 'pausada',
        budget:      parseInt(camp.daily_budget || camp.lifetime_budget || 0) / 100,
        spend, revenue, clicks, impressions, conversions,
        reach:       parseInt(ins.reach || 0),
        frequency:   parseFloat(ins.frequency || 0),
        ctr:         parseFloat(ins.ctr || 0),
        platform:    'meta',
        source:      'api',
        lastSync:    new Date().toISOString()
      };

      const idx = state.campaigns.findIndex(c => c.id === obj.id);
      if (idx >= 0) state.campaigns[idx] = obj;
      else state.campaigns.push(obj);

      // Anúncios (não bloqueia se falhar)
      syncMetaAds(camp.id, account.token).catch(() => {});

      // Busca demographics (gênero + faixa etária) em paralelo
      fetchMetaDemographics(camp.id, account.token, since, until).then(demo => {
        if (demo) {
          const idx2 = state.campaigns.findIndex(c => c.id === `meta_${camp.id}`);
          if (idx2 >= 0) {
            state.campaigns[idx2].genderBreakdown = demo.genderBreakdown;
            state.campaigns[idx2].ageBreakdown    = demo.ageBreakdown;
            saveState();
          }
        }
      }).catch(() => {});
      synced++;
    } catch(e) {
      console.warn('Erro ao processar campanha', camp.name, e.message);
    }
  }
  // FIX: campanhas locais desta conta que NÃO foram retornadas pela API
  // (encerradas, arquivadas, deletadas no Meta) → marcar como 'encerrada'
  state.campaigns.forEach(c => {
    if (c.accountId === account.id && c.source === 'api' && c.platform === 'meta') {
      if (!returnedIds.has(c.id) && c.status === 'ativa') {
        c.status = 'encerrada';
      }
    }
  });

  return synced;
}

async function syncMetaAds(campaignId, token) {
  try {
    const adsData = await fetchMetaAPI(`${campaignId}/ads`, {
      access_token: token, fields: 'id,name,status', limit: 20
    });
    if (!adsData.data?.length) return;
    state.ads = state.ads.filter(a => !(a.campaignId === `meta_${campaignId}` && a.source === 'api'));
    for (const ad of adsData.data) {
      try {
        const insData = await fetchMetaAPI(`${ad.id}/insights`, {
          access_token: token, fields: INSIGHT_FIELDS,
          date_preset: 'last_30d'
        });
        const ins  = insData.data?.[0] || {};
        const avs  = ins.action_values || [];
        const acts = ins.actions || [];
        const adConvAction = CONVERSION_TYPES.map(t => acts.find(a => a.action_type === t)).find(Boolean);
        const adRevAction  = REVENUE_TYPES.map(t => avs.find(a => a.action_type === t)).find(Boolean);
        state.ads.push({
          id:           `meta_${ad.id}`,
          campaignId:   `meta_${campaignId}`,
          name:         ad.name,
          spend:        parseFloat(ins.spend || 0),
          revenue:      parseFloat(adRevAction?.value || 0),
          clicks:       parseInt(ins.clicks || 0),
          impressions:  parseInt(ins.impressions || 0),
          conversions:  parseInt(adConvAction?.value || 0),
          source:       'api'
        });
      } catch(e) { /* ad sem dados no período */ }
    }
  } catch(e) { /* campanha sem ads */ }
}

function mapMetaObjective(obj) {
  const m = { CONVERSIONS:'conversao', PRODUCT_CATALOG_SALES:'conversao', LINK_CLICKS:'trafego', TRAFFIC:'trafego', REACH:'awareness', BRAND_AWARENESS:'awareness', LEAD_GENERATION:'leads', VIDEO_VIEWS:'awareness' };
  return m[obj] || 'conversao';
}

async function syncAllAccounts() {
  const active = state.accounts.filter(a => a.active && !a.isDemo);
  if (!active.length) { showToast('Adicione uma conta real em Contas & Tokens', 'info'); return; }
  let total = 0;
  for (const acc of active) {
    try {
      if (acc.platform === 'meta')    total += await syncMetaAccount(acc);
    } catch(e) {
      showToast(`Erro em ${acc.name}: ${e.message}`, 'error');
      state.updateLog.unshift({ time: new Date().toISOString(), msg: `Erro ao sincronizar ${acc.name}: ${e.message}`, type: 'error' });
    }
  }
  if (total > 0) {
    state.updateLog.unshift({ time: new Date().toISOString(), msg: `${total} campanha(s) sincronizada(s) via API`, type: 'success' });
    saveState(); updateSyncText();
    renderDashboard(); renderCampaigns(); renderTopAds(); renderImprovements();
    showToast(`✅ ${total} campanha(s) sincronizada(s)!`, 'success');
  }
}

// ═══════════════════════════════════════════════════════════════
//  GOOGLE ADS API
//
//  COMO CONFIGURAR:
//  1. Acesse: console.cloud.google.com → Criar projeto
//  2. Ative a API: "Google Ads API"
//  3. Crie credenciais OAuth2 (tipo: Aplicativo da Web)
//     URI de redirecionamento: https://mmarkt.netlify.app
//  4. Obtenha o Developer Token em:
//     ads.google.com → Ferramentas → Central da API → Token de desenvolvedor
//  5. Em Contas & Tokens:
//     - Token: cole o OAuth2 Access Token (ou Refresh Token)
//     - ID da Conta: Customer ID no formato 123-456-7890
//
//  CAMPOS NECESSÁRIOS:
//  - Developer Token (header: developer-token)
//  - OAuth2 Access Token (header: Authorization: Bearer ...)
//  - Customer ID (sem hífens: 1234567890)
// ═══════════════════════════════════════════════════════════════



// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════
//  ANÁLISE COM IA – CLAUDE API
// ═══════════════════════════════════════════════════════════════

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-api-key': state.anthropicKey || '',
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'
  };
}

async function callClaude(prompt, maxTokens = 1500) {
  if (!state.anthropicKey) throw new Error('Configure sua API Key da Anthropic em Contas & Tokens → Configurações de IA');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.find(b => b.type === 'text')?.text || '';
}

async function analyzeWithAI(campaignId) {
  const camp = state.campaigns.find(c => c.id === campaignId);
  if (!camp) return;
  const btn = document.getElementById(`ai-btn-${campaignId}`);
  const box = document.getElementById(`ai-box-${campaignId}`);
  if (!btn || !box) return;

  btn.disabled = true;
  btn.innerHTML = '<span class="btn-spinner"></span> Analisando...';
  box.innerHTML = `<div class="ai-loading"><div class="ai-spinner"></div><span>Claude está analisando sua campanha em profundidade...</span></div>`;
  box.classList.remove('hidden');

  const roas     = camp.spend > 0 ? (camp.revenue / camp.spend).toFixed(2) : 0;
  const ctr      = camp.impressions > 0 ? ((camp.clicks / camp.impressions) * 100).toFixed(2) : 0;
  const cpc      = camp.clicks > 0 ? (camp.spend / camp.clicks).toFixed(2) : 0;
  const cpa      = camp.conversions > 0 ? (camp.spend / camp.conversions).toFixed(2) : 0;
  const convRate = camp.clicks > 0 ? ((camp.conversions / camp.clicks) * 100).toFixed(2) : 0;

  const prompt = `Você é um especialista sênior em tráfego pago com mais de 10 anos de experiência em Meta Ads, Google Ads e performance marketing. Fale sempre em português brasileiro.

Analise a campanha abaixo com profundidade e forneça recomendações práticas e acionáveis:

**DADOS DA CAMPANHA:**
- Nome: ${camp.name}
- Plataforma: ${camp.platform === 'meta' ? 'Meta Ads (Facebook/Instagram)' : camp.platform}
- Objetivo: ${camp.objective}
- Status: ${camp.status}
- Orçamento diário: R$ ${camp.budget?.toFixed(2) || '—'}
- Investimento total no período: R$ ${camp.spend.toFixed(2)}
- Receita gerada: R$ ${camp.revenue.toFixed(2)}
- ROAS: ${roas}x
- Cliques: ${camp.clicks.toLocaleString('pt-BR')}
- Impressões: ${camp.impressions.toLocaleString('pt-BR')}
- CTR: ${ctr}%
- CPC médio: R$ ${cpc}
- Conversões: ${camp.conversions}
- Taxa de conversão: ${convRate}%
- CPA: R$ ${cpa}

Responda EXATAMENTE neste formato:

## 🩺 Diagnóstico Geral
[2-3 frases avaliando a saúde da campanha de forma direta]

## ✅ Pontos Positivos
- [ponto 1]
- [ponto 2]
- [ponto 3]

## 🔴 Problemas Identificados
- [problema 1 com dado específico]
- [problema 2 com dado específico]

## 🚀 Plano de Ação – Top 5 Melhorias Prioritárias
1. **[Título]** – [O que fazer exatamente, como implementar, resultado esperado]
2. **[Título]** – [O que fazer exatamente, como implementar, resultado esperado]
3. **[Título]** – [O que fazer exatamente, como implementar, resultado esperado]
4. **[Título]** – [O que fazer exatamente, como implementar, resultado esperado]
5. **[Título]** – [O que fazer exatamente, como implementar, resultado esperado]

## 📈 Projeção em 30 dias
[Se implementar as melhorias acima, qual ROAS, CTR e CPA você projeta? Seja específico com números.]

## 💡 Insight Exclusivo
[Um insight avançado e específico para esta campanha que a maioria dos gestores não percebe]`;

  try {
    const text = await callClaude(prompt, 1600);
    const html = markdownToHTML(text);
    box.innerHTML = `<div class="ai-result">
      <div class="ai-result-header">
        <span>🤖 Análise gerada por Claude (Anthropic)</span>
        <span class="ai-timestamp">${new Date().toLocaleString('pt-BR')}</span>
      </div>
      <div class="ai-content">${html}</div>
      <div style="margin-top:12px;display:flex;gap:8px">
        <button class="btn-sm" onclick="copyAIAnalysis('${campaignId}')">📋 Copiar texto</button>
        <button class="btn-sm" onclick="document.getElementById('ai-box-${campaignId}').classList.add('hidden')">✕ Fechar</button>
      </div>
    </div>`;
    state.aiAnalyses[campaignId] = { text, html, createdAt: new Date().toISOString() };
    saveState();
  } catch(e) {
    box.innerHTML = `<div class="ai-error">
      <strong>❌ Erro:</strong> ${e.message}<br><br>
      <small>Verifique se a chave Anthropic está configurada em <strong>Contas & Tokens → Configurações de IA</strong>.</small>
    </div>`;
  }
  btn.disabled = false;
  btn.innerHTML = '🤖 Reanalisar com IA';
}

async function analyzeAllCampaigns() {
  const btn = document.getElementById('btnAnalyzeAll');
  const box = document.getElementById('aiGlobalBox');
  if (!btn || !box) return;
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-spinner"></span> Analisando portfólio...';
  box.innerHTML = `<div class="ai-loading"><div class="ai-spinner"></div><span>Claude está analisando seu portfólio completo...</span></div>`;
  box.classList.remove('hidden');

  const camps = getFilteredCampaigns();
  const totalSpend = camps.reduce((s,c)=>s+c.spend,0);
  const totalRev   = camps.reduce((s,c)=>s+c.revenue,0);
  const roasMedio  = totalSpend > 0 ? (totalRev/totalSpend).toFixed(2) : 0;

  const summary = camps.map(c => {
    const roas = c.spend > 0 ? (c.revenue/c.spend).toFixed(2) : 0;
    const ctr  = c.impressions > 0 ? ((c.clicks/c.impressions)*100).toFixed(2) : 0;
    return `- **${c.name}** | Gasto: R$${c.spend.toFixed(0)} | Receita: R$${c.revenue.toFixed(0)} | ROAS: ${roas}x | CTR: ${ctr}% | Conv: ${c.conversions} | Status: ${c.status}`;
  }).join('\n');

  const prompt = `Você é um especialista sênior em tráfego pago. Analise o portfólio completo de campanhas e forneça uma visão estratégica em português brasileiro.

**PORTFÓLIO COMPLETO:**
${summary}

**RESUMO FINANCEIRO:**
- Investimento total: R$ ${totalSpend.toFixed(2)}
- Receita total: R$ ${totalRev.toFixed(2)}
- ROAS médio do portfólio: ${roasMedio}x
- Total de campanhas: ${camps.length} (${camps.filter(c=>c.status==='ativa').length} ativas)

## 🗺️ Diagnóstico do Portfólio
[Avaliação estratégica do conjunto em 3-4 frases com dados]

## 🏆 Ranking de Performance
[Ranqueie todas as campanhas do melhor ao pior com justificativa em 1 linha cada]

## ⚡ 3 Ações Urgentes – Fazer Esta Semana
1. [ação concreta com campanha específica]
2. [ação concreta com campanha específica]
3. [ação concreta com campanha específica]

## 💰 Redistribuição de Orçamento Recomendada
[Como mover o budget entre campanhas para maximizar o ROAS total – seja específico com % ou R$]

## 📅 Plano de Escala – Próximos 30 Dias
[Estratégia passo a passo para crescer receita sem perder eficiência]

## 🎯 Meta de ROAS Alcançável
[Qual ROAS médio você projeta em 30 dias se as recomendações forem seguidas, e por quê]`;

  try {
    const text = await callClaude(prompt, 1800);
    box.innerHTML = `<div class="ai-result">
      <div class="ai-result-header">
        <span>🤖 Análise Estratégica do Portfólio – Claude</span>
        <span class="ai-timestamp">${new Date().toLocaleString('pt-BR')}</span>
      </div>
      <div class="ai-content">${markdownToHTML(text)}</div>
      <div style="margin-top:12px">
        <button class="btn-sm" onclick="navigator.clipboard.writeText(${JSON.stringify(text)}).then(()=>showToast('Copiado!','success'))">📋 Copiar</button>
      </div>
    </div>`;
  } catch(e) {
    box.innerHTML = `<div class="ai-error"><strong>❌ Erro:</strong> ${e.message}</div>`;
  }
  btn.disabled = false;
  btn.innerHTML = '🤖 Reanalisar Portfólio';
}

async function analyzeCompetitorAI(i) {
  const c   = state.competitors[i];
  const box = document.getElementById('insightsWrap');
  box.innerHTML = `<div class="ai-loading"><div class="ai-spinner"></div><span>Analisando ${c.name} com IA...</span></div>`;
  const prompt = `Você é especialista em tráfego pago e inteligência competitiva. Analise o concorrente abaixo em português:

Nome: ${c.name}
Site: ${c.url || 'não informado'}
Nicho: ${c.niche || 'não informado'}
Budget estimado: ${c.budget ? 'R$ '+c.budget+'/mês' : 'desconhecido'}

## 🔍 Análise de Estratégia
[Prováveis estratégias de anúncios e segmentação]

## ⚠️ Pontos Fracos Exploráveis
[Onde você pode atacar e se diferenciar]

## 🥊 Como Vencer este Concorrente
[3 táticas concretas para superar no leilão de anúncios]

## 💡 Ângulos de Copy Diferenciados
[3 sugestões de mensagens que ele provavelmente não está usando]`;
  try {
    const text = await callClaude(prompt, 900);
    box.innerHTML = `<div class="insight-card"><h5>🤖 Análise IA – ${c.name}</h5><div class="ai-content" style="margin-top:10px">${markdownToHTML(text)}</div></div>`;
  } catch(e) {
    box.innerHTML = `<div class="ai-error">Erro: ${e.message}</div>`;
  }
}

function copyAIAnalysis(campaignId) {
  const a = state.aiAnalyses[campaignId];
  if (!a) return;
  navigator.clipboard.writeText(a.text).then(() => showToast('Análise copiada!', 'success'));
}

function markdownToHTML(md) {
  return md
    .replace(/^## (.+)$/gm, '<h4 class="ai-h4">$1</h4>')
    .replace(/^### (.+)$/gm, '<h5 class="ai-h5">$1</h5>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^(\d+)\. (.+)$/gm, '<div class="ai-step"><span class="ai-step-num">$1</span><span>$2</span></div>')
    .replace(/^- (.+)$/gm, '<div class="ai-bullet">• $1</div>')
    .replace(/\n{2,}/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

// ─── NAVIGATION ──────────────────────────────────────────────
const pageTitles = {
  dashboard:'Dashboard', campaigns:'Campanhas',
  improvements:'Melhorias', aianalysis:'Análise com IA',
  market:'Pesquisa de Mercado', accounts:'Contas & Tokens', schedule:'Atualizações'
};

function go(page, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const pg = document.getElementById('page-' + page);
  if (!pg) return;
  pg.classList.add('active');
  if (btn) btn.classList.add('active');
  document.getElementById('pageTitle').textContent = pageTitles[page] || page;
  ({ dashboard:renderDashboard, campaigns:renderCampaigns,
     improvements:renderImprovements, aianalysis:renderAIAnalysis,
     market:renderCompetitors, accounts:renderAccountsList, schedule:renderSchedule })[page]?.();
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('collapsed'); }

// ─── FILTERS ─────────────────────────────────────────────────
function getFilters() {
  return { account: document.getElementById('fAccount').value, days: getActiveDays() };
}
function applyFilters()    { renderDashboard(); renderCampaigns(); }
function getFilteredCampaigns() {
  const f = getFilters();
  return state.campaigns.filter(c => f.account === 'all' || c.accountId === f.account);
}
function refreshAll() {
  showToast('Sincronizando...', 'info');
  syncAllAccounts().then(() => {
    state.updateLog.unshift({ time: new Date().toISOString(), msg: 'Atualização manual concluída', type: 'success' });
    saveState(); renderSchedule();
  });
}
function renderAccountFilter() {
  const sel = document.getElementById('fAccount');
  sel.innerHTML = '<option value="all">Todas as Contas</option>';
  state.accounts.forEach(a => { const o = document.createElement('option'); o.value = a.id; o.textContent = a.name; sel.appendChild(o); });
}

// ─── DASHBOARD DATE FILTER ───────────────────────────────────
let dashDateFrom = null;
let dashDateTo   = null;

// Returns number of days in the active date range
function getActiveDays() {
  const from = dashDateFrom || document.getElementById('dashDateFrom')?.value;
  const to   = dashDateTo   || document.getElementById('dashDateTo')?.value;
  if (from && to) {
    const d = Math.round((new Date(to) - new Date(from)) / 86400000);
    return d > 0 ? d : 30;
  }
  // Campaigns page fallback
  const cf = document.getElementById('campDateFrom')?.value;
  const ct = document.getElementById('campDateTo')?.value;
  if (cf && ct) {
    const d = Math.round((new Date(ct) - new Date(cf)) / 86400000);
    return d > 0 ? d : 30;
  }
  return 30;
}

// Returns { since, until } as YYYY-MM-DD strings
function getActiveDateRange() {
  const from = dashDateFrom || document.getElementById('dashDateFrom')?.value;
  const to   = dashDateTo   || document.getElementById('dashDateTo')?.value;
  if (from && to) return { since: from, until: to };
  const now   = new Date();
  const since = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const until = now.toISOString().split('T')[0];
  return { since, until };
}

function applyDashboardDate() {
  const from = document.getElementById('dashDateFrom')?.value;
  const to   = document.getElementById('dashDateTo')?.value;
  if (!from || !to) { showToast('Selecione as duas datas', 'error'); return; }
  dashDateFrom = from;
  dashDateTo   = to;
  const label = document.getElementById('dashDateLabel');
  const f = d => new Date(d+'T00:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
  if (label) label.textContent = `Período: ${f(from)} → ${f(to)}`;
  renderDashboard();
  showToast('Filtro de data aplicado!', 'success');
}

function initDashboardDates() {
  const el1 = document.getElementById('dashDateFrom');
  const el2 = document.getElementById('dashDateTo');
  if (!el1 || !el2) return;
  // Default: 1st day of current month → today
  const now   = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const fmt   = d => d.toISOString().split('T')[0];
  if (!el1.value) { el1.value = fmt(first); dashDateFrom = fmt(first); }
  if (!el2.value) { el2.value = fmt(now);   dashDateTo   = fmt(now);   }
  const label = document.getElementById('dashDateLabel');
  if (label && !label.textContent) {
    const f = d => new Date(d+'T00:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
    label.textContent = `Período: ${f(el1.value)} → ${f(el2.value)}`;
  }
}

function renderDashboard() {
  initDashboardDates();
  const camps = getFilteredCampaigns();
  const ts    = camps.reduce((s,c) => s + c.spend, 0);
  const tr    = camps.reduce((s,c) => s + c.revenue, 0);
  const tc    = camps.reduce((s,c) => s + c.clicks, 0);
  const ti    = camps.reduce((s,c) => s + c.impressions, 0);
  const tconv = camps.reduce((s,c) => s + (c.conversions || 0), 0);
  const treach= camps.reduce((s,c) => s + (c.reach || 0), 0);
  const ar    = ts > 0 ? tr / ts : 0;
  const at    = ti > 0 ? (tc / ti) * 100 : 0;
  const acpc  = tc > 0 ? ts / tc : 0;
  const acpl  = tconv > 0 ? ts / tconv : 0;

  // Row 1: financial
  setKPI('vInvest',  fmt.brl(ts),              'dInvest',  '+12.4%', true);
  setKPI('vRevenue', fmt.brl(tr),              'dRevenue', '+18.7%', true);
  setKPI('vRoas',    ar.toFixed(2) + 'x',      'dRoas',    ar >= 3 ? '▲ Bom' : '▼ Atenção', ar >= 3);
  setKPI('vResults', fmt.num(tconv),            'dResults', '+9.3%',  true);
  setKPI('vCpl',     ts > 0 && tconv > 0 ? fmt.brl(acpl) : '—', 'dCpl', tconv > 0 ? '▼ Eficiente' : '—', true);

  // Row 2: reach & engagement
  setKPI('vClicks',  fmt.num(tc),              'dClicks',  '+8.2%',  true);
  setKPI('vImpr',    fmt.num(ti),              'dImpr',    '+22.1%', true);
  setKPI('vReach',   treach > 0 ? fmt.num(treach) : '—', 'dReach', treach > 0 ? '+15.3%' : '—', true);
  setKPI('vCtr',     at.toFixed(2) + '%',      'dCtr',     '+0.3%',  true);
  setKPI('vCpc',     tc > 0 ? fmt.brl(acpc) : '—', 'dCpc', '—', true);

  renderCharts(camps);
  renderCampaignTable(camps);
}
function setKPI(vId, val, dId, delta, pos) {
  document.getElementById(vId).textContent = val;
  const d = document.getElementById(dId); d.textContent = delta;
  d.className = 'kpi-delta '+(pos?'pos':'neg');
}

// ─── CHARTS ──────────────────────────────────────────────────
function renderCharts(camps) {
  const isLight = document.body.classList.contains('light');
  const gc = isLight ? 'rgba(0,0,0,0.06)'   : 'rgba(255,255,255,0.05)';
  const tc = isLight ? '#6b7280'             : '#8892a4';
  const bg2= isLight ? '#f4f6fb'             : '#161b2a';
  const destroy = k => { if(state.charts[k]){state.charts[k].destroy();delete state.charts[k];} };
  const getCtx  = id => document.getElementById(id)?.getContext('2d');

  // ── 1. Investimento × Receita ──────────────────────────────
  destroy('invRev');
  const days=getActiveDays();
  const labels=[],invD=[],revD=[];
  const bS=camps.reduce((s,c)=>s+c.spend,0)/days;
  const bR=camps.reduce((s,c)=>s+c.revenue,0)/days;
  for(let i=days-1;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    labels.push(d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}));
    const n=0.7+Math.random()*0.6;
    invD.push(+(bS*n).toFixed(2));
    revD.push(+(bR*n*(1+Math.random()*0.3)).toFixed(2));
  }
  const c1=getCtx('cInvRev');
  if(c1) state.charts.invRev=new Chart(c1,{type:'line',data:{labels,datasets:[
    {label:'Investimento',data:invD,borderColor:'#4a9eff',backgroundColor:'rgba(74,158,255,0.08)',tension:0.4,fill:true,pointRadius:0},
    {label:'Receita',data:revD,borderColor:'#3ecf8e',backgroundColor:'rgba(62,207,142,0.08)',tension:0.4,fill:true,pointRadius:0}
  ]},options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},tooltip:{mode:'index',intersect:false,callbacks:{label:c=>' R$ '+c.raw.toFixed(2)}}},
    scales:{x:{grid:{color:gc},ticks:{color:tc,maxTicksLimit:12}},y:{grid:{color:gc},ticks:{color:tc,callback:v=>'R$'+fmt.shortNum(v)}}}}});

  // ── 2. Distribuição por Canal ──────────────────────────────
  destroy('channels');
  const pt={};
  camps.forEach(c=>{pt[c.platform]=(pt[c.platform]||0)+c.spend;});
  const c2=getCtx('cChannels');
  if(c2) state.charts.channels=new Chart(c2,{type:'doughnut',
    data:{labels:Object.keys(pt).map(p=>({meta:'Meta Ads'}[p]||p)),
      datasets:[{data:Object.values(pt),backgroundColor:['#4a9eff','#f0c040','#3ecf8e','#a78bfa'],borderWidth:0,hoverOffset:6}]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:true,position:'bottom',labels:{color:tc,boxWidth:10,padding:10,font:{size:11}}},
        tooltip:{callbacks:{label:c=>' R$ '+c.raw.toFixed(2)}}}}});

  // ── 3. ROAS por Campanha ───────────────────────────────────
  destroy('roas');
  const c3=getCtx('cRoas');
  if(c3) state.charts.roas=new Chart(c3,{type:'bar',
    data:{labels:camps.map(c=>c.name.length>20?c.name.slice(0,18)+'…':c.name),
      datasets:[{data:camps.map(c=>c.spend>0?+(c.revenue/c.spend).toFixed(2):0),
        backgroundColor:camps.map(c=>{const r=c.spend>0?c.revenue/c.spend:0;return r>=4?'rgba(62,207,142,0.75)':r>=2.5?'rgba(240,192,64,0.75)':'rgba(248,113,113,0.75)';}),
        borderRadius:5}]},
    options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' ROAS: '+c.raw+'x'}}},
      scales:{x:{grid:{color:gc},ticks:{color:tc}},y:{grid:{color:'transparent'},ticks:{color:tc,font:{size:10}}}}}});

  // ── 4. CPC ao Longo do Tempo ──────────────────────────────
  destroy('cpc');
  // Use real CPC data if available, otherwise simulate
  const realCpc = camps.reduce((s,c)=>s+(c.clicks>0?c.spend/c.clicks:0),0) / (camps.length||1);
  const cpcBase = realCpc > 0 ? realCpc : 1.2;
  const cpcD = labels.map(()=>+(cpcBase*(0.7+Math.random()*0.6)).toFixed(2));
  const c4=getCtx('cCpc');
  if(c4) state.charts.cpc=new Chart(c4,{type:'line',
    data:{labels,datasets:[{data:cpcD,borderColor:'#a78bfa',backgroundColor:'rgba(167,139,250,0.1)',tension:0.4,fill:true,pointRadius:0}]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' CPC: R$ '+c.raw}}},
      scales:{x:{grid:{color:gc},ticks:{color:tc,maxTicksLimit:8}},y:{grid:{color:gc},ticks:{color:tc,callback:v=>'R$'+v}}}}});

  // ── 5. Gênero dos Leads ────────────────────────────────────
  renderGenderChart(camps, tc, bg2);

  // ── 6. Faixa Etária ───────────────────────────────────────
  destroy('age');
  renderAgeChart(camps, gc, tc);
}

// ── GÊNERO: usa dados reais da API Meta se disponível, senão exibe barras estimadas ──
function renderGenderChart(camps, tc, bg2) {
  // Coleta dados reais de gênero das campanhas sincronizadas
  const gData = { male:0, female:0, unknown:0 };
  let hasReal = false;
  camps.forEach(c => {
    if (c.genderBreakdown) {
      hasReal = true;
      gData.male    += c.genderBreakdown.male    || 0;
      gData.female  += c.genderBreakdown.female  || 0;
      gData.unknown += c.genderBreakdown.unknown || 0;
    }
  });

  // Estimativa se sem dados reais
  if (!hasReal) {
    const total = camps.reduce((s,c)=>s+(c.conversions||0),0) || 100;
    gData.female  = Math.round(total * 0.58);
    gData.male    = Math.round(total * 0.38);
    gData.unknown = total - gData.female - gData.male;
  }

  const total = gData.male + gData.female + gData.unknown || 1;
  const pF = Math.round((gData.female  / total) * 100);
  const pM = Math.round((gData.male    / total) * 100);
  const pO = 100 - pF - pM;

  const badge = document.getElementById('genderTotal');
  if (badge) badge.textContent = hasReal ? fmt.num(total) + ' leads' : 'estimado';

  // Container is now a div#cGender.demo-chart-inner
  const container = document.getElementById('cGender');
  if (!container) return;

  container.innerHTML = `
    <div style="padding:4px 0 0">
      ${!hasReal ? '<div class="demo-note">* Estimativa — sincronize para dados reais</div>' : ''}
      <div class="gender-wrap">
        <div class="gender-row">
          <div class="gender-lbl" style="color:#f9a8d4">♀ Fem.</div>
          <div class="gender-track"><div class="gender-fill female" style="width:${pF}%"></div></div>
          <div class="gender-pct">${pF}%</div>
          <div class="gender-count">${fmt.num(gData.female)}</div>
        </div>
        <div class="gender-row">
          <div class="gender-lbl" style="color:#60a5fa">♂ Masc.</div>
          <div class="gender-track"><div class="gender-fill male" style="width:${pM}%"></div></div>
          <div class="gender-pct">${pM}%</div>
          <div class="gender-count">${fmt.num(gData.male)}</div>
        </div>
        ${pO > 0 ? `<div class="gender-row">
          <div class="gender-lbl" style="color:#c4b5fd">⊙ Outro</div>
          <div class="gender-track"><div class="gender-fill other" style="width:${pO}%"></div></div>
          <div class="gender-pct">${pO}%</div>
          <div class="gender-count">${fmt.num(gData.unknown)}</div>
        </div>` : ''}
      </div>
      <div class="gender-sub-title">Top Faixas por Gênero</div>
      <div class="gender-sub-row"><span style="color:#f9a8d4">♀ 25–34</span><span>${Math.round(pF*0.38)}%</span></div>
      <div class="gender-sub-row"><span style="color:#f9a8d4">♀ 35–44</span><span>${Math.round(pF*0.28)}%</span></div>
      <div class="gender-sub-row"><span style="color:#60a5fa">♂ 25–34</span><span>${Math.round(pM*0.40)}%</span></div>
      <div class="gender-sub-row"><span style="color:#60a5fa">♂ 35–44</span><span>${Math.round(pM*0.30)}%</span></div>
    </div>`;
}

// ── FAIXA ETÁRIA ──────────────────────────────────────────────
function renderAgeChart(camps, gc, tc) {
  const destroy = k => { if(state.charts[k]){state.charts[k].destroy();delete state.charts[k];} };
  destroy('age');

  // Coleta dados reais de idade se disponível
  const ageLabels = ['13-17','18-24','25-34','35-44','45-54','55-64','65+'];
  let ageData = [];
  let hasReal = false;

  camps.forEach(c => {
    if (c.ageBreakdown) {
      hasReal = true;
      ageLabels.forEach((lbl, i) => {
        ageData[i] = (ageData[i] || 0) + (c.ageBreakdown[lbl] || 0);
      });
    }
  });

  // Se não tem dados reais: distribuição típica de leads BR
  if (!hasReal || ageData.every(v => !v)) {
    const total = camps.reduce((s,c)=>s+(c.conversions||0),0) || 1000;
    ageData = [
      Math.round(total * 0.02),  // 13-17
      Math.round(total * 0.14),  // 18-24
      Math.round(total * 0.34),  // 25-34  ← pico
      Math.round(total * 0.26),  // 35-44
      Math.round(total * 0.14),  // 45-54
      Math.round(total * 0.07),  // 55-64
      Math.round(total * 0.03),  // 65+
    ];
  }

  const maxAge = Math.max(...ageData) || 1;
  const badge  = document.getElementById('ageTotal');
  const totalAge = ageData.reduce((s,v)=>s+v,0);
  if (badge) badge.textContent = hasReal ? fmt.num(totalAge) + ' leads' : 'estimado';

  const c5 = document.getElementById('cAge')?.getContext('2d');
  if (!c5) return;

  state.charts.age = new Chart(c5, {
    type: 'bar',
    data: {
      labels: ageLabels,
      datasets: [{
        label: 'Leads',
        data: ageData,
        backgroundColor: ageData.map(v => {
          const intensity = v / maxAge;
          return `rgba(167,139,250,${0.3 + intensity * 0.6})`;
        }),
        borderColor: ageData.map(v => {
          const intensity = v / maxAge;
          return `rgba(167,139,250,${0.5 + intensity * 0.5})`;
        }),
        borderWidth: 1,
        borderRadius: 5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const pct = Math.round((ctx.raw / totalAge) * 100);
              return ` ${fmt.num(ctx.raw)} leads (${pct}%)`;
            }
          }
        }
      },
      scales: {
        x: { grid: { color: gc }, ticks: { color: tc, font: { size: 10 } } },
        y: { grid: { color: gc }, ticks: { color: tc, callback: v => fmt.shortNum(v) } }
      }
    }
  });
}

// ── Fetch demographics from Meta API when syncing ─────────────
async function fetchMetaDemographics(campaignId, token, since, until) {
  try {
    // Gender breakdown
    const genderRes = await fetchMetaAPI(`${campaignId}/insights`, {
      access_token: token,
      fields: 'actions,spend',
      time_range: JSON.stringify({ since, until }),
      breakdowns: 'gender',
      level: 'campaign'
    });
    const genderBreakdown = { male:0, female:0, unknown:0 };
    (genderRes.data || []).forEach(row => {
      const conv = parseInt(row.actions?.find(a=>a.action_type==='purchase')?.value || 0);
      if (row.gender === 'male')    genderBreakdown.male    += conv;
      else if (row.gender === 'female') genderBreakdown.female += conv;
      else genderBreakdown.unknown += conv;
    });

    // Age breakdown
    const ageRes = await fetchMetaAPI(`${campaignId}/insights`, {
      access_token: token,
      fields: 'actions',
      time_range: JSON.stringify({ since, until }),
      breakdowns: 'age',
      level: 'campaign'
    });
    const ageBreakdown = {};
    (ageRes.data || []).forEach(row => {
      const conv = parseInt(row.actions?.find(a=>a.action_type==='purchase')?.value || 0);
      if (row.age) ageBreakdown[row.age] = (ageBreakdown[row.age] || 0) + conv;
    });

    return { genderBreakdown, ageBreakdown };
  } catch(e) {
    return null;
  }
}

// ─── CAMPAIGN TABLE ───────────────────────────────────────────
function renderCampaignTable(camps) {
  const tb = document.getElementById('dtBody');
  if (!camps.length) {
    tb.innerHTML = '<tr><td colspan="13" style="text-align:center;padding:40px;color:var(--text2)">Nenhuma campanha encontrada. Adicione uma conta em Contas & Tokens e sincronize.</td></tr>';
    return;
  }

  let html = '';
  camps.forEach(c => {
    const acc   = state.accounts.find(a => a.id === c.accountId);
    const roas  = c.spend > 0 ? (c.revenue / c.spend).toFixed(2) : '—';
    const ctr   = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : '—';
    const cpc   = c.clicks > 0 ? (c.spend / c.clicks).toFixed(2) : '—';
    const cpl   = c.conversions > 0 ? (c.spend / c.conversions).toFixed(2) : '—';
    const rc    = roas !== '—' ? (roas >= 4 ? 'roas-good' : roas >= 2.5 ? 'roas-med' : 'roas-bad') : '';
    const src   = c.source === 'api' ? '<span class="src-api">API</span>' : '';
    const eid   = 'exp-' + c.id;

    // Main campaign row
    html += `<tr class="camp-main-row">
      <td><button class="expand-btn" id="ebtn-${c.id}" onclick="toggleAdsPanel('${c.id}')" title="Ver top anúncios">+</button></td>
      <td><strong>${c.name}</strong>${src}</td>
      <td><span style="font-size:11px;color:var(--text2)">${acc?.name || '—'}</span></td>
      <td><span class="badge ${c.status}">${c.status}</span></td>
      <td>${fmt.brl(c.spend)}</td>
      <td>${fmt.brl(c.revenue)}</td>
      <td class="${rc}">${roas !== '—' ? roas + 'x' : '—'}</td>
      <td><strong>${fmt.num(c.conversions || 0)}</strong></td>
      <td>${fmt.num(c.clicks)}</td>
      <td>${ctr !== '—' ? ctr + '%' : '—'}</td>
      <td>${cpc !== '—' ? 'R$' + cpc : '—'}</td>
      <td>${cpl !== '—' ? 'R$' + cpl : '—'}</td>
      <td style="display:flex;gap:4px;align-items:center">
        <button class="btn-sm" onclick="toggleStatus('${c.id}')" title="Pausar/Ativar">⏸</button>
        <button class="btn-sm ai-inline-btn" onclick="goToAI('${c.id}')" title="Analisar com IA">🤖</button>
      </td>
    </tr>`;

    // Expandable ads row (hidden by default)
    html += `<tr class="ads-expand-row" id="row-${eid}">
      <td colspan="13">
        <div class="ads-expand-inner closed" id="${eid}">
          <div class="ads-expand-content" id="content-${eid}">
            <!-- loaded on expand -->
          </div>
        </div>
      </td>
    </tr>`;
  });

  tb.innerHTML = html;
}

async function toggleAdsPanel(campId) {
  const panel   = document.getElementById('exp-' + campId);
  const btn     = document.getElementById('ebtn-' + campId);
  const content = document.getElementById('content-exp-' + campId);
  if (!panel || !btn || !content) return;
  const isOpen  = panel.classList.contains('open');

  if (isOpen) {
    panel.classList.replace('open', 'closed');
    btn.textContent = '+';
    return;
  }

  panel.classList.replace('closed', 'open');
  btn.textContent = '−';
  content.innerHTML = `<div class="ai-loading"><div class="ai-spinner"></div><span>Carregando anúncios e criativos...</span></div>`;

  // Get ads sorted by results
  const campAds = state.ads
    .filter(a => a.campaignId === campId)
    .sort((a, b) => (b.conversions || 0) - (a.conversions || 0))
    .slice(0, 5);

  // Fetch real thumbnails if Meta account
  const camp = state.campaigns.find(c => c.id === campId);
  const acc  = state.accounts.find(a => a.id === camp?.accountId);
  if (camp?.platform === 'meta' && acc && !acc.isDemo) {
    await enrichAdsWithThumbnails(campAds, acc.token);
  }

  const rankClass = ['r1','r2','r3','r4','r5'];
  let inner = '';
  if (!campAds.length) {
    inner = `<div class="no-ads-msg">Nenhum anúncio disponível — sincronize a conta para carregar os criativos.</div>`;
  } else {
    inner = `<table class="ads-table">
      <thead><tr>
        <th>#</th><th>Criativo</th><th>Nome do Anúncio</th>
        <th>Invest.</th><th>Resultados</th><th>Freq.</th>
        <th>Cliques</th><th>CTR</th><th>CPC</th><th>CPL</th>
      </tr></thead>
      <tbody>
        ${campAds.map((ad, i) => {
          const ctr  = ad.impressions > 0 ? ((ad.clicks/ad.impressions)*100).toFixed(2) : '—';
          const cpc  = ad.clicks > 0 ? (ad.spend/ad.clicks).toFixed(2) : '—';
          const cpl  = (ad.conversions||0) > 0 ? (ad.spend/ad.conversions).toFixed(2) : '—';
          const freq = ad.frequency ? ad.frequency.toFixed(1) : '—';
          const thumb = ad.thumbUrl
            ? `<img src="${ad.thumbUrl}" class="ad-creative-thumb" alt="criativo" onerror="this.outerHTML='<div class=\\'ad-creative-thumb\\'>${['🎬','📸','🖼️','📱','🎞️'][i]||'📢'}</div>'">`
            : `<div class="ad-creative-thumb">${['🎬','📸','🖼️','📱','🎞️'][i]||'📢'}</div>`;
          return `<tr>
            <td><span class="ads-rank-badge ${rankClass[i]}">${i+1}</span></td>
            <td>${thumb}</td>
            <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;color:var(--text)">${ad.name}</td>
            <td>${fmt.brl(ad.spend)}</td>
            <td><strong style="color:var(--green)">${fmt.num(ad.conversions||0)}</strong></td>
            <td>${freq}</td>
            <td>${fmt.num(ad.clicks)}</td>
            <td>${ctr!=='—'?ctr+'%':'—'}</td>
            <td>${cpc!=='—'?'R$'+cpc:'—'}</td>
            <td>${cpl!=='—'?'R$'+cpl:'—'}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
  }

  content.innerHTML =
    `<div class="ads-expand-title">🏆 Top 5 Anúncios — Classificados por Resultados <span style="font-size:11px;color:var(--text3);font-weight:400">(conversões/leads)</span></div>` + inner;

  panel.classList.replace('closed', 'open');
  btn.textContent = '−';
}
function filterCampaignTable(q){document.querySelectorAll('#dtBody tr').forEach(r=>{r.style.display=r.textContent.toLowerCase().includes(q.toLowerCase())?'':' none';});}
function toggleStatus(id){const c=state.campaigns.find(x=>x.id===id);if(!c)return;c.status=c.status==='ativa'?'pausada':'ativa';saveState();renderDashboard();showToast(`Campanha ${c.status}: ${c.name}`,c.status==='ativa'?'success':'info');}
function goToAI(cid){
  const btn=document.querySelector('[data-page="aianalysis"]');
  go('aianalysis',btn);
  setTimeout(()=>{ const el=document.getElementById(`ai-card-${cid}`); if(el) el.scrollIntoView({behavior:'smooth',block:'center'}); },250);
}

// ─── CAMPAIGNS PAGE v3.5 ─────────────────────────────────────

// State for campaigns page filters
let campPlatformFilter = 'meta';
let campCompareMode    = false;
let campCharts         = {};

function setCampPlatform(plat, btn) {
  campPlatformFilter = plat;
  document.querySelectorAll('.plat-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderCampaigns();
}

function applyDateRange() {
  renderCampaigns();
}

function toggleCompare() {
  campCompareMode = !campCompareMode;
  const btn = document.getElementById('btnCompare');
  const banner = document.getElementById('compareBanner');
  if (btn) btn.classList.toggle('active', campCompareMode);
  if (banner) banner.classList.toggle('hidden', !campCompareMode);
  if (campCompareMode) {
    const from = document.getElementById('campDateFrom')?.value;
    const to   = document.getElementById('campDateTo')?.value;
    if (from && to) {
      const d1 = new Date(from), d2 = new Date(to);
      const diff = d2 - d1;
      const prevFrom = new Date(d1 - diff - 86400000).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
      const prevTo   = new Date(d1 - 86400000).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
      const el = document.getElementById('compareLabel');
      if (el) el.textContent = `Comparando com ${prevFrom} → ${prevTo}`;
    }
  }
  renderCampaigns();
}

function getCampFilteredCampaigns() {
  let camps = state.campaigns;
  // Filtro de conta — usa o mesmo seletor do Dashboard (fAccount)
  const accountId = document.getElementById('fAccount')?.value;
  if (accountId && accountId !== 'all') camps = camps.filter(c => c.accountId === accountId);
  // Filtro de plataforma (abas Meta / Google / TikTok)
  if (campPlatformFilter !== 'all') camps = camps.filter(c => c.platform === campPlatformFilter);
  return camps;
}

function renderCampaigns() {
  const sel = document.getElementById('mCampAccount');
  if (sel) sel.innerHTML = state.accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');

  // Init date pickers with sensible defaults
  const dateFrom = document.getElementById('campDateFrom');
  const dateTo   = document.getElementById('campDateTo');
  if (dateFrom && !dateFrom.value) {
    const d = new Date(); d.setDate(d.getDate() - 30);
    dateFrom.value = d.toISOString().split('T')[0];
  }
  if (dateTo && !dateTo.value) {
    dateTo.value = new Date().toISOString().split('T')[0];
  }

  // Visão dedicada por plataforma
  const platView = document.getElementById('campPlatformView');
  const genView  = document.getElementById('campGenericView');
  if (false) {
    if (platView) platView.style.display = '';
    if (genView)  genView.style.display  = 'none';
    renderGoogleView(getCampFilteredCampaigns());
    return;
  } else if (campPlatformFilter === 'meta') {
    if (platView) platView.style.display = '';
    if (genView)  genView.style.display  = 'none';
    renderMetaView(getCampFilteredCampaigns());
    return;
  } else {
    if (platView) platView.style.display = 'none';
    if (genView)  genView.style.display  = '';
    // Oculta tabela de campanhas no modo Perfis e Funil (fica só na Análise Estratégica)
    const tableBox = genView?.querySelector('.table-box');
    if (tableBox) tableBox.style.display = 'none';
  }

  const camps = getCampFilteredCampaigns();

  renderFunnel(camps);
  renderDevices(camps);
  renderImpMetrics(camps);
  renderCampCharts(camps);
  renderCplRoasPlat(camps);
  renderTopLocations(camps);
  renderAudience(camps);
  renderCampInsights(camps);
  renderActiveCampsTable(camps);
}

// ── Funil de Conversão ───────────────────────────────────────
function renderFunnel(camps) {
  const impr  = camps.reduce((s,c)=>s+c.impressions,0);
  const clicks= camps.reduce((s,c)=>s+c.clicks,0);
  const leads = camps.reduce((s,c)=>s+(c.conversions||0),0);
  // Conversões = leads * estimated close rate (ou usar um campo separado)
  const convs = Math.round(leads * 0.60);

  const stages = [
    { label:'Impressões', value:impr,   pct:'100%', color:'#4a9eff', textPct:null },
    { label:'Cliques',    value:clicks, pct: impr>0?((clicks/impr)*100).toFixed(2)+'%':'—', color:'#3ecf8e', textPct: impr>0?((clicks/impr)*100).toFixed(2):null },
    { label:'Leads',      value:leads,  pct: clicks>0?((leads/clicks)*100).toFixed(2)+'%':'—', color:'#f0c040', textPct: clicks>0?((leads/clicks)*100).toFixed(2):null },
    { label:'Conversões', value:convs,  pct: leads>0?((convs/leads)*100).toFixed(2)+'%':'—', color:'#f472b6', textPct: leads>0?((convs/leads)*100).toFixed(2):null }
  ];
  const maxVal = impr || 1;

  const convRate = clicks > 0 ? ((convs/clicks)*100).toFixed(2) : 0;
  const label = document.getElementById('funnelLabel');
  if (label) label.textContent = campPlatformFilter === 'meta' ? 'Análise Estratégica' : 'Perfis e Funil';

  document.getElementById('funnelWrap').innerHTML = `
    ${stages.map((s,i) => {
      const w = Math.max(30, Math.min(100, (s.value/maxVal)*100));
      return `<div class="funnel-stage">
        <div class="funnel-bar-wrap" style="max-width:${100-i*8}%">
          <div class="funnel-bar-fill" style="background:${s.color};width:100%">
            <span style="font-size:11px;font-weight:700">${s.label} &nbsp; ${fmt.num(s.value)}</span>
          </div>
        </div>
        <div class="funnel-pct">${s.pct}</div>
      </div>
      ${i < stages.length-1 ? '<div style="text-align:center;color:var(--text3);font-size:11px;margin:2px 0;padding-left:8px">↓</div>' : ''}`;
    }).join('')}
    <div class="funnel-conv-rate">
      <span>Taxa de Conversão (cliques→conv.)</span>
      <strong>${convRate}%</strong>
    </div>`;
}

// ── Dispositivos ─────────────────────────────────────────────
function renderDevices(camps) {
  const total = camps.reduce((s,c)=>s+c.clicks,0) || 1;
  // Estimativa de dispositivos (dados reais viriam da API)
  const devices = [
    { name:'Mobile',  pct:72, color:'#a78bfa', icon:'📱' },
    { name:'Desktop', pct:21, color:'#4a9eff', icon:'🖥️' },
    { name:'Tablet',  pct:7,  color:'#2dd4bf', icon:'📟' }
  ];
  const isLight = document.body.classList.contains('light');
  const tc = isLight ? '#6b7280' : '#8892a4';

  // Chart
  if (campCharts.devices) { campCharts.devices.destroy(); delete campCharts.devices; }
  const ctx = document.getElementById('cDevices')?.getContext('2d');
  if (ctx) campCharts.devices = new Chart(ctx, {
    type:'doughnut',
    data:{ labels:devices.map(d=>d.name), datasets:[{ data:devices.map(d=>d.pct), backgroundColor:devices.map(d=>d.color), borderWidth:0, hoverOffset:4 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>` ${c.label}: ${c.raw}%`}} } }
  });

  // List
  document.getElementById('deviceList').innerHTML = devices.map(d => {
    const count = Math.round(total * d.pct / 100);
    return `<div class="device-row">
      <div class="device-dot" style="background:${d.color}"></div>
      <div class="device-name">${d.icon} ${d.name}</div>
      <div class="device-pct">${d.pct}%</div>
      <div class="device-count">(${fmt.num(count)} cliques)</div>
    </div>`;
  }).join('');
}

// ── Métricas Importantes ──────────────────────────────────────
function renderImpMetrics(camps) {
  const ts    = camps.reduce((s,c)=>s+c.spend,0);
  const tc    = camps.reduce((s,c)=>s+c.clicks,0);
  const ti    = camps.reduce((s,c)=>s+c.impressions,0);
  const tconv = camps.reduce((s,c)=>s+(c.conversions||0),0);
  const tr    = camps.reduce((s,c)=>s+c.revenue,0);
  const freq  = camps.length > 0 ? (camps.reduce((s,c)=>s+(c.frequency||0),0)/camps.length).toFixed(2) : '—';
  const ctr   = ti > 0 ? ((tc/ti)*100).toFixed(2) : '—';
  const convR = tc > 0 ? ((tconv/tc)*100).toFixed(2) : '—';
  const cpl   = tconv > 0 ? (ts/tconv).toFixed(2) : '—';
  const roas  = ts > 0 ? (tr/ts).toFixed(2) : '—';
  const ret   = tr > 0 ? tr : null;

  const metrics = [
    { lbl:'Frequência (média)', val:freq, delta:'+15,2%', pos:true },
    { lbl:'Taxa de Cliques (CTR)', val: ctr !== '—' ? ctr+'%' : '—', delta:'+7,8%', pos:true },
    { lbl:'Taxa de Conversão', val: convR !== '—' ? convR+'%' : '—', delta:'+18,6%', pos:true },
    { lbl:'Custo por Lead (CPL)', val: cpl !== '—' ? 'R$'+cpl : '—', delta:'-9,8%', pos:false },
    { lbl:'ROAS (médio)', val: roas !== '—' ? roas+'x' : '—', delta:'+27,5%', pos:true },
    { lbl:'Retorno sobre Invest.', val: ret ? fmt.brl(ret) : '—', delta:'+31,3%', pos:true }
  ];

  document.getElementById('impMetrics').innerHTML = metrics.map(m => `
    <div class="imp-met">
      <div class="imp-met-lbl">${m.lbl}</div>
      <div class="imp-met-val">${m.val}</div>
      <div class="imp-met-delta ${m.pos?'pos':'neg'}">${m.pos?'▲':'▼'} ${m.delta} vs período ant.</div>
    </div>`).join('');
}

// ── Evolução Cliques + Leads ──────────────────────────────────
function renderCampCharts(camps) {
  const isLight = document.body.classList.contains('light');
  const gc = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
  const tc = isLight ? '#6b7280' : '#8892a4';
  const days = 30;
  const labels = [];
  for (let i=days-1;i>=0;i--) {
    const d=new Date(); d.setDate(d.getDate()-i);
    labels.push(d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}));
  }
  const bC = camps.reduce((s,c)=>s+c.clicks,0)/days;
  const bL = camps.reduce((s,c)=>s+(c.conversions||0),0)/days;
  const clicksData = labels.map(()=>+(bC*(0.7+Math.random()*0.6)).toFixed(0));
  const leadsData  = labels.map(()=>+(bL*(0.7+Math.random()*0.6)).toFixed(0));

  ['campClicks','campLeads'].forEach(k=>{ if(campCharts[k]){campCharts[k].destroy();delete campCharts[k];} });

  const c1 = document.getElementById('cCampClicks')?.getContext('2d');
  if (c1) campCharts.campClicks = new Chart(c1, { type:'line', data:{ labels, datasets:[{ data:clicksData, borderColor:'#4a9eff', backgroundColor:'rgba(74,158,255,0.08)', tension:0.4, fill:true, pointRadius:0 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{grid:{color:gc},ticks:{color:tc,maxTicksLimit:8}}, y:{grid:{color:gc},ticks:{color:tc,callback:v=>fmt.shortNum(v)}} } } });

  const c2 = document.getElementById('cCampLeads')?.getContext('2d');
  if (c2) campCharts.campLeads = new Chart(c2, { type:'line', data:{ labels, datasets:[{ data:leadsData, borderColor:'#3ecf8e', backgroundColor:'rgba(62,207,142,0.08)', tension:0.4, fill:true, pointRadius:0 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{grid:{color:gc},ticks:{color:tc,maxTicksLimit:8}}, y:{grid:{color:gc},ticks:{color:tc,callback:v=>fmt.shortNum(v)}} } } });
}

// ── CPL + ROAS por Plataforma ─────────────────────────────────
function renderCplRoasPlat(camps) {
  const isLight = document.body.classList.contains('light');
  const gc = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
  const tc = isLight ? '#6b7280' : '#8892a4';
  const platColors = { meta:'#4a9eff' };
  const platNames  = { meta:'Meta' };

  const platGroups = {};
  camps.forEach(c => {
    if (!platGroups[c.platform]) platGroups[c.platform] = { spend:0, conversions:0, revenue:0 };
    platGroups[c.platform].spend       += c.spend;
    platGroups[c.platform].conversions += c.conversions || 0;
    platGroups[c.platform].revenue     += c.revenue || 0;
  });

  const plats  = Object.keys(platGroups);
  const labels = plats.map(p => platNames[p] || p);
  const colors = plats.map(p => platColors[p] || '#8892a4');
  const cplData  = plats.map(p => platGroups[p].conversions > 0 ? +(platGroups[p].spend/platGroups[p].conversions).toFixed(2) : 0);
  const roasData = plats.map(p => platGroups[p].spend > 0 ? +(platGroups[p].revenue/platGroups[p].spend).toFixed(2) : 0);

  ['cplPlat','roasPlat'].forEach(k=>{ if(campCharts[k]){campCharts[k].destroy();delete campCharts[k];} });

  const c3 = document.getElementById('cCplPlat')?.getContext('2d');
  if (c3) campCharts.cplPlat = new Chart(c3, { type:'bar', data:{ labels, datasets:[{ data:cplData, backgroundColor:colors.map(c=>c+'99'), borderColor:colors, borderWidth:1, borderRadius:6 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' CPL: R$'+c.raw}}}, scales:{ x:{grid:{color:gc},ticks:{color:tc}}, y:{grid:{color:gc},ticks:{color:tc,callback:v=>'R$'+v}} } } });

  const c4 = document.getElementById('cRoasPlat')?.getContext('2d');
  if (c4) campCharts.roasPlat = new Chart(c4, { type:'bar', data:{ labels, datasets:[{ data:roasData, backgroundColor:roasData.map(v=>v>=4?'rgba(62,207,142,0.7)':v>=2.5?'rgba(240,192,64,0.7)':'rgba(248,113,113,0.7)'), borderRadius:6 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' ROAS: '+c.raw+'x'}}}, scales:{ x:{grid:{color:gc},ticks:{color:tc}}, y:{grid:{color:gc},ticks:{color:tc,callback:v=>v+'x'}} } } });
}

// ── Top 5 Localizações ────────────────────────────────────────
function renderTopLocations(camps) {
  // Try to use real location data from API if available
  const locMap = {};
  camps.forEach(c => {
    if (c.locationBreakdown) {
      Object.entries(c.locationBreakdown).forEach(([city, val]) => {
        locMap[city] = (locMap[city] || 0) + val;
      });
    }
  });

  let locs;
  if (Object.keys(locMap).length >= 3) {
    // Use real API data
    locs = Object.entries(locMap)
      .sort((a,b) => b[1]-a[1])
      .slice(0,5)
      .map(([name, val]) => ({ name, val }));
    const maxVal = locs[0].val || 1;
    locs = locs.map(l => ({ ...l, pct: Math.round((l.val/maxVal)*100) }));
  } else {
    // Default top cities BR (will be replaced by real data after sync)
    locs = [
      { name:'São Paulo · SP',       pct:34, val:null },
      { name:'Rio de Janeiro · RJ',  pct:18, val:null },
      { name:'Belo Horizonte · MG',  pct:12, val:null },
      { name:'Curitiba · PR',        pct: 9, val:null },
      { name:'Porto Alegre · RS',    pct: 7, val:null }
    ];
  }
  const max = Math.max(...locs.map(l=>l.pct), 1);
  const tconv = camps.reduce((s,c)=>s+(c.conversions||0),0);

  document.getElementById('topLocations').innerHTML = locs.map((l,i) => {
    const count = l.val != null ? fmt.num(l.val) : (tconv > 0 ? fmt.num(Math.round(tconv*(l.pct/100))) : '—');
    return `<div class="loc-row">
      <div class="loc-rank ${i===0?'top1':i===1?'top2':i===2?'top3':''}">${i+1}</div>
      <div class="loc-name">📍 ${l.name}</div>
      <div class="loc-bar-wrap"><div class="loc-bar-fill" style="width:${(l.pct/max)*100}%"></div></div>
      <div class="loc-pct">${l.pct}%</div>
      <div style="width:36px;text-align:right;font-size:10px;color:var(--text3)">${count}</div>
    </div>`;
  }).join('') + `<div style="font-size:10px;color:var(--text3);margin-top:8px;font-style:italic">
    ${Object.keys(locMap).length < 3 ? '* Estimativa — sincronize para dados reais por cidade' : '✅ Dados reais via API'}
  </div>`;
}

// ── Público Atingido ──────────────────────────────────────────
function renderAudience(camps) {
  const tr = camps.reduce((s,c)=>s+(c.reach||0),0);
  const ti = camps.reduce((s,c)=>s+c.impressions,0);
  const tconv = camps.reduce((s,c)=>s+(c.conversions||0),0);
  const ts = camps.reduce((s,c)=>s+c.spend,0);
  const badge = document.getElementById('audienceTotal');
  if (badge) badge.textContent = tr > 0 ? fmt.num(tr)+' alcançados' : 'via estimativa';

  const items = [
    { icon:'👁️', lbl:'Alcance Total', val: tr>0?fmt.num(tr):'—', sub:'pessoas únicas' },
    { icon:'📱', lbl:'Mobile', val:'72,8%', sub:'do público' },
    { icon:'🖥️', lbl:'Desktop', val:'21,3%', sub:'do público' },
    { icon:'👩', lbl:'Público Feminino', val:'58%', sub:'das interações' },
    { icon:'👨', lbl:'Público Masculino', val:'38%', sub:'das interações' },
    { icon:'📅', lbl:'Faixa Pico', val:'25–34', sub:'anos (maior volume)' },
    { icon:'🔄', lbl:'Freq. Média', val: camps.length>0?(camps.reduce((s,c)=>s+(c.frequency||0),0)/camps.length).toFixed(1)+'x':'—', sub:'impressões/pessoa' },
    { icon:'💰', lbl:'CPM Médio', val: ti>0?fmt.brl((ts/ti)*1000):'—', sub:'por mil impressões' }
  ];

  document.getElementById('audienceGrid').innerHTML = items.map(it => `
    <div class="aud-card">
      <div class="aud-icon">${it.icon}</div>
      <div class="aud-label">${it.lbl}</div>
      <div class="aud-val">${it.val}</div>
      <div class="aud-sub">${it.sub}</div>
    </div>`).join('');
}

// ── Insights & Recomendações ──────────────────────────────────
function renderCampInsights(camps) {
  const ts = camps.reduce((s,c)=>s+c.spend,0);
  const tr = camps.reduce((s,c)=>s+c.revenue,0);
  const roas = ts > 0 ? tr/ts : 0;
  const tc = camps.reduce((s,c)=>s+c.clicks,0);
  const ti = camps.reduce((s,c)=>s+c.impressions,0);
  const ctr = ti > 0 ? (tc/ti)*100 : 0;
  const tconv = camps.reduce((s,c)=>s+(c.conversions||0),0);
  const cpl = tconv > 0 ? ts/tconv : 0;

  const insights = [];

  if (roas >= 4) insights.push({ type:'tip', icon:'🚀', title:'ROAS excelente — hora de escalar', desc:`ROAS médio de ${roas.toFixed(2)}x está acima do benchmark. Aumente o orçamento das campanhas com melhor performance em 20-30%.` });
  else if (roas < 2) insights.push({ type:'warn', icon:'⚠️', title:'ROAS abaixo do ideal', desc:`ROAS de ${roas.toFixed(2)}x precisa de atenção. Revise criativos e audiências das campanhas com menor desempenho.` });

  if (ctr < 1) insights.push({ type:'warn', icon:'🎨', title:'CTR baixo — revise os criativos', desc:`CTR de ${ctr.toFixed(2)}% está abaixo da média. Teste novos hooks, thumbnails e primeiros 3 segundos dos vídeos.` });
  else insights.push({ type:'tip', icon:'✅', title:'CTR saudável', desc:`CTR de ${ctr.toFixed(2)}% está dentro do esperado. Continue testando variações para encontrar os melhores ângulos.` });

  if (cpl > 100) insights.push({ type:'warn', icon:'💸', title:'CPL elevado', desc:`Custo por lead de ${fmt.brl(cpl)} está acima do benchmark. Revise a segmentação de público e as landing pages.` });
  else if (cpl > 0) insights.push({ type:'tip', icon:'💡', title:'CPL dentro do esperado', desc:`CPL de ${fmt.brl(cpl)} está controlado. Foque em aumentar o volume mantendo essa eficiência.` });

  const metaCamps = camps.filter(c=>c.platform==='meta');
  const freqAlta = metaCamps.filter(c=>(c.frequency||0)>3);
  if (freqAlta.length > 0) insights.push({ type:'info', icon:'🔄', title:`${freqAlta.length} campanha(s) com frequência alta`, desc:`Campanhas com frequência acima de 3x podem estar saturando o público. Considere ampliar a audiência ou renovar criativos.` });

  insights.push({ type:'idea', icon:'💡', title:'Oportunidade: teste A/B de criativos', desc:'Campanhas com alto investimento se beneficiam de testes A/B sistemáticos. Compare vídeo vs imagem estática e UGC vs branded.' });

  if (!insights.length) insights.push({ type:'tip', icon:'🌟', title:'Portfólio bem equilibrado', desc:'Todos os indicadores estão dentro dos parâmetros. Continue monitorando e realize otimizações incrementais.' });

  document.getElementById('campInsights').innerHTML = insights.slice(0,5).map(i => `
    <div class="camp-insight ${i.type}">
      <div class="ci-icon">${i.icon}</div>
      <div><div class="ci-title">${i.title}</div><div class="ci-desc">${i.desc}</div></div>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════════════
//  VISÃO DEDICADA — GOOGLE ADS
// ═══════════════════════════════════════════════════════════════






// ═══════════════════════════════════════════════════════════════
//  VISÃO DEDICADA — META ADS
// ═══════════════════════════════════════════════════════════════
function renderMetaView(camps) {
  const el = document.getElementById('campPlatformView');
  if (!el) return;

  const isLight = document.body.classList.contains('light');
  const gc = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
  const tc = isLight ? '#6b7280' : '#8892a4';

  const ts    = camps.reduce((s,c) => s + c.spend, 0);
  const tk    = camps.reduce((s,c) => s + c.clicks, 0);
  const ti    = camps.reduce((s,c) => s + c.impressions, 0);
  const tconv = camps.reduce((s,c) => s + (c.conversions||0), 0);
  const trev  = camps.reduce((s,c) => s + (c.revenue||0), 0);
  const treach= camps.reduce((s,c) => s + (c.reach||0), 0);
  const roas  = ts > 0 ? trev / ts : 0;
  const ctr   = ti > 0 ? (tk/ti)*100 : 0;
  const cpc   = tk > 0 ? ts/tk : 0;
  const cpa   = tconv > 0 ? ts/tconv : 0;
  const freq  = camps.length > 0 ? camps.reduce((s,c)=>s+(c.frequency||0),0)/camps.length : 0;
  const ativas= camps.filter(c=>c.status==='ativa').length;

  const kpis = [
    { icon:'💰', label:'Investimento',  val: fmt.brl(ts),             sub:'total no período' },
    { icon:'📣', label:'Alcance',       val: treach>0?fmt.num(treach):'—', sub:'pessoas únicas' },
    { icon:'🖱️', label:'Cliques',       val: fmt.num(tk),             sub:'cliques no link' },
    { icon:'📊', label:'CTR',           val: ctr.toFixed(2)+'%',      sub:'taxa de cliques' },
    { icon:'💵', label:'CPC',           val: fmt.brl(cpc),            sub:'custo por clique' },
    { icon:'🎯', label:'Resultados',    val: fmt.num(tconv),          sub:'leads/compras' },
    { icon:'📈', label:'ROAS',          val: roas.toFixed(2)+'x',     sub:'retorno s/ investimento' },
    { icon:'💸', label:'CPA',           val: cpa>0?fmt.brl(cpa):'—', sub:'custo / resultado' },
    { icon:'🔄', label:'Frequência',    val: freq.toFixed(1)+'x',     sub:'impactos/pessoa' },
    { icon:'🟢', label:'Ativas',        val: ativas.toString(),       sub:`de ${camps.length} campanhas` }
  ];

  ['gv_mtype','gv_mroas','gv_mctr','gv_mfreq'].forEach(k => {
    if (campCharts[k]) { campCharts[k].destroy(); delete campCharts[k]; }
  });

  el.innerHTML = `
    <div class="plat-view-header">
      <div class="plat-view-title">
        <img src="https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg" style="height:18px;vertical-align:middle;margin-right:8px" alt="Meta">
        <span>Meta Ads — Visão Completa</span>
      </div>
    </div>

    <div class="plat-kpi-grid">
      ${kpis.map(k => `
        <div class="plat-kpi-card">
          <div class="plat-kpi-icon">${k.icon}</div>
          <div class="plat-kpi-val">${k.val}</div>
          <div class="plat-kpi-label">${k.label}</div>
          <div class="plat-kpi-sub">${k.sub}</div>
        </div>`).join('')}
    </div>

    <div class="plat-charts-grid">
      <div class="chart-box">
        <div class="cbox-head"><h4>Gasto por Objetivo</h4></div>
        <div style="height:220px"><canvas id="cMvType"></canvas></div>
      </div>
      <div class="chart-box">
        <div class="cbox-head"><h4>ROAS por Campanha</h4></div>
        <div style="height:220px"><canvas id="cMvRoas"></canvas></div>
      </div>
      <div class="chart-box">
        <div class="cbox-head"><h4>CTR por Campanha</h4></div>
        <div style="height:220px"><canvas id="cMvCtr"></canvas></div>
      </div>
      <div class="chart-box">
        <div class="cbox-head"><h4>Frequência por Campanha</h4></div>
        <div style="height:220px"><canvas id="cMvFreq"></canvas></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 340px;gap:16px;margin-top:16px">
      <div class="table-box">
        <div class="tbox-head">
          <div><h4>Performance por Campanha</h4><span class="tbox-sub">${camps.length} campanhas</span></div>
        </div>
        <div class="table-scroll">
          <table class="dt">
            <thead><tr>
              <th>Campanha</th><th>Status</th><th>Invest.</th><th>Result.</th>
              <th>CTR</th><th>CPC</th><th>CPA</th><th>ROAS</th><th>Freq.</th><th>Score</th>
            </tr></thead>
            <tbody>
              ${camps.map(c => {
                const cr = (c.ctr||0).toFixed(2);
                const cpc2 = c.clicks>0 ? fmt.brl(c.spend/c.clicks) : '—';
                const cpa2 = c.conversions>0 ? fmt.brl(c.spend/c.conversions) : '—';
                const r = c.spend>0 ? (c.revenue/c.spend).toFixed(2) : '—';
                const rc = r!=='—'?(parseFloat(r)>=4?'roas-good':parseFloat(r)>=2.5?'roas-med':'roas-bad'):'';
                const score = calcScore(c.spend>0?c.revenue/c.spend:0, c.impressions>0?(c.clicks/c.impressions)*100:0, c);
                const sc = score>=70?'good':score>=45?'med':'bad';
                return `<tr>
                  <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${c.name}">${c.name}</td>
                  <td><span class="badge ${c.status}">${c.status}</span></td>
                  <td>${fmt.brl(c.spend)}</td>
                  <td><strong>${fmt.num(c.conversions||0)}</strong></td>
                  <td style="color:${parseFloat(cr)>=3?'var(--green)':parseFloat(cr)>=1.5?'var(--accent)':'var(--red)'}">${cr}%</td>
                  <td>${cpc2}</td>
                  <td>${cpa2}</td>
                  <td class="${rc}">${r!=='—'?r+'x':'—'}</td>
                  <td>${(c.frequency||0).toFixed(1)}</td>
                  <td><span class="score-chip ${sc}">${score}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="camp-card-box">
        <div class="cbox-head"><h4>💡 Visão Estratégica Meta</h4></div>
        <div style="padding:4px 0">${renderMetaStrategy(camps, ts, tconv, roas, ctr, freq)}</div>
      </div>
    </div>

    <div class="table-box" style="margin-top:16px" id="metaActiveCampsWrap">
      <div class="tbox-head">
        <div>
          <h4>Campanhas Ativas</h4>
          <span class="tbox-sub" id="campCount">${camps.length} campanhas</span>
        </div>
        <input type="search" placeholder="Buscar campanha..." id="campSearch" oninput="filterActiveCamps(this.value)">
      </div>
      <div class="table-scroll">
        <table class="dt" id="activeCampsTable">
          <thead><tr>
            <th style="width:28px"></th>
            <th>Campanha</th>
            <th>Status</th>
            <th>Objetivo</th>
            <th>Investimento</th>
            <th>Resultados</th>
            <th>Cliques</th>
            <th>CTR</th>
            <th>CPC</th>
            <th>Leads</th>
            <th>CPL</th>
            <th>Frequência</th>
            <th>ROAS</th>
          </tr></thead>
          <tbody id="activeCampsBody"></tbody>
        </table>
      </div>
      <div class="table-footer" id="campTableFooter"></div>
    </div>`;

  // Renderiza a tabela de campanhas ativas dentro da aba Meta
  requestAnimationFrame(() => {
    renderActiveCampsTable(camps);
  });

  requestAnimationFrame(() => {
    // 1. Donut — Gasto por Objetivo
    const objMap = {};
    camps.forEach(c => { const o = c.objective||'outros'; objMap[o] = (objMap[o]||0)+c.spend; });
    const objLabels = Object.keys(objMap).map(o=>({conversao:'Conversão',trafego:'Tráfego',leads:'Leads',awareness:'Alcance'}[o]||o));
    const c1 = document.getElementById('cMvType')?.getContext('2d');
    if (c1) campCharts.gv_mtype = new Chart(c1, { type:'doughnut', data:{ labels:objLabels, datasets:[{ data:Object.values(objMap), backgroundColor:['#4a9eff','#f0c040','#3ecf8e','#a78bfa','#f472b6'], borderWidth:0, hoverOffset:6 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:true,position:'bottom',labels:{color:tc,boxWidth:10,padding:8,font:{size:10}}}, tooltip:{callbacks:{label:c=>` R$ ${c.raw.toFixed(2)}`}} } } });

    // 2. Barras — ROAS
    const top8r = [...camps].sort((a,b)=>(b.spend>0?b.revenue/b.spend:0)-(a.spend>0?a.revenue/a.spend:0)).slice(0,8);
    const c2 = document.getElementById('cMvRoas')?.getContext('2d');
    if (c2) campCharts.gv_mroas = new Chart(c2, { type:'bar', data:{ labels:top8r.map(c=>c.name.length>20?c.name.slice(0,18)+'…':c.name), datasets:[{ data:top8r.map(c=>c.spend>0?+(c.revenue/c.spend).toFixed(2):0), backgroundColor:top8r.map(c=>{const r=c.spend>0?c.revenue/c.spend:0;return r>=4?'rgba(62,207,142,0.75)':r>=2.5?'rgba(240,192,64,0.75)':'rgba(248,113,113,0.75)';}), borderRadius:5 }] }, options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ROAS: ${c.raw}x`}}}, scales:{x:{grid:{color:gc},ticks:{color:tc}},y:{grid:{color:'transparent'},ticks:{color:tc,font:{size:9}}}} } });

    // 3. CTR
    const top8c = [...camps].sort((a,b)=>(b.ctr||0)-(a.ctr||0)).slice(0,8);
    const c3 = document.getElementById('cMvCtr')?.getContext('2d');
    if (c3) campCharts.gv_mctr = new Chart(c3, { type:'bar', data:{ labels:top8c.map(c=>c.name.length>20?c.name.slice(0,18)+'…':c.name), datasets:[{ data:top8c.map(c=>+(c.ctr||0).toFixed(2)), backgroundColor:top8c.map(c=>(c.ctr||0)>=3?'rgba(62,207,142,0.75)':(c.ctr||0)>=1.5?'rgba(240,192,64,0.75)':'rgba(248,113,113,0.75)'), borderRadius:5 }] }, options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` CTR: ${c.raw}%`}}}, scales:{x:{grid:{color:gc},ticks:{color:tc,callback:v=>v+'%'}},y:{grid:{color:'transparent'},ticks:{color:tc,font:{size:9}}}} } });

    // 4. Frequência
    const freqCamps = [...camps].filter(c=>c.frequency>0).sort((a,b)=>b.frequency-a.frequency).slice(0,8);
    const c4 = document.getElementById('cMvFreq')?.getContext('2d');
    if (c4) campCharts.gv_mfreq = new Chart(c4, { type:'bar', data:{ labels:freqCamps.map(c=>c.name.length>20?c.name.slice(0,18)+'…':c.name), datasets:[{ data:freqCamps.map(c=>+(c.frequency||0).toFixed(1)), backgroundColor:freqCamps.map(c=>(c.frequency||0)>4?'rgba(248,113,113,0.75)':(c.frequency||0)>2.5?'rgba(240,192,64,0.75)':'rgba(74,158,255,0.75)'), borderRadius:5 }] }, options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` Freq: ${c.raw}x`}}}, scales:{x:{grid:{color:gc},ticks:{color:tc}},y:{grid:{color:'transparent'},ticks:{color:tc,font:{size:9}}}} } });
  });
}

function renderMetaStrategy(camps, ts, tconv, roas, ctr, freq) {
  const insights = [];
  if (roas >= 4) insights.push({ type:'tip', icon:'🚀', title:`ROAS ${roas.toFixed(2)}x — escale agora`, desc:'Performance acima do benchmark. Aumente o budget das campanhas top em 20-30% por vez e monitore o CPM para não saturar o público.' });
  else if (roas < 1.5 && ts > 0) insights.push({ type:'critical', icon:'🔴', title:'ROAS abaixo do break-even', desc:'Revise criativos, públicos e landing pages. Pause campanhas com ROAS < 1x e redirecione budget para as melhores.' });
  if (ctr < 1) insights.push({ type:'warn', icon:'🎨', title:'CTR baixo — problema nos criativos', desc:`CTR de ${ctr.toFixed(2)}% indica que os anúncios não estão gerando interesse. Teste hooks diferentes nos primeiros 3 segundos (vídeos) ou na imagem principal.` });
  if (freq > 4) insights.push({ type:'warn', icon:'🔄', title:'Frequência alta — risco de saturação', desc:`Frequência média de ${freq.toFixed(1)}x. Acima de 3-4x o público começa a ignorar. Renove criativos ou expanda a audiência.` });
  const freqAlta = camps.filter(c=>(c.frequency||0)>4);
  if (freqAlta.length) insights.push({ type:'info', icon:'📋', title:`${freqAlta.length} campanha(s) saturando`, desc:`${freqAlta.map(c=>c.name).join(', ')}. Pause, mude os criativos e reative.` });
  insights.push({ type:'idea', icon:'💡', title:'Lookalike 1% dos convertidos', desc:'Crie um público lookalike 1% baseado nos seus convertidos dos últimos 180 dias para prospecting de alta qualidade.' });
  return insights.slice(0,5).map(i => `
    <div class="camp-insight ${i.type}" style="margin-bottom:10px">
      <div class="ci-icon">${i.icon}</div>
      <div><div class="ci-title">${i.title}</div><div class="ci-desc">${i.desc}</div></div>
    </div>`).join('');
}

// ── Active Campaigns Table ────────────────────────────────────
function renderActiveCampsTable(camps) {
  const tbody  = document.getElementById('activeCampsBody');
  const footer = document.getElementById('campTableFooter');
  const count  = document.getElementById('campCount');
  if (count) count.textContent = `${camps.length} campanha${camps.length!==1?'s':''}`;

  const platIcon = {
    meta:    `<div class="plat-icon-cell meta">📘</div>`,

  };
  const objMap = { conversao:'Conversões', trafego:'Tráfego', leads:'Leads', awareness:'Alcance' };

  if (!camps.length) {
    tbody.innerHTML = `<tr><td colspan="14" style="text-align:center;padding:40px;color:var(--text2)">Nenhuma campanha. Adicione uma conta e sincronize.</td></tr>`;
    return;
  }

  let html = '';
  camps.forEach(c => {
    const roas  = c.spend>0 ? (c.revenue/c.spend).toFixed(2) : '—';
    const ctr   = c.impressions>0 ? ((c.clicks/c.impressions)*100).toFixed(2) : '—';
    const cpc   = c.clicks>0 ? (c.spend/c.clicks).toFixed(2) : '—';
    const cpl   = (c.conversions||0)>0 ? (c.spend/c.conversions).toFixed(2) : '—';
    const freq  = c.frequency ? c.frequency.toFixed(1) : '—';
    const rc    = roas!=='—'?(parseFloat(roas)>=4?'roas-good':parseFloat(roas)>=2.5?'roas-med':'roas-bad'):'';
    const eid   = 'cexp-'+c.id;

    html += `<tr class="camp-main-row">
      <td><button class="expand-btn" id="cebtn-${c.id}" onclick="toggleCampAds('${c.id}')" title="Ver anúncios">+</button></td>
      <td>${platIcon[c.platform]||'📊'}</td>
      <td><strong style="font-size:12px">${c.name}</strong>${c.source==='api'?'<span class="src-api" style="margin-left:5px">API</span>':''}</td>
      <td><span class="badge ${c.status}">${c.status}</span></td>
      <td><span class="obj-badge ${c.objective}">${objMap[c.objective]||c.objective}</span></td>
      <td>${fmt.brl(c.spend)}</td>
      <td><strong>${fmt.num(c.conversions||0)}</strong></td>
      <td>${fmt.num(c.clicks)}</td>
      <td>${ctr!=='—'?ctr+'%':'—'}</td>
      <td>${cpc!=='—'?'R$'+cpc:'—'}</td>
      <td>${fmt.num(c.conversions||0)}</td>
      <td>${cpl!=='—'?'R$'+cpl:'—'}</td>
      <td>${freq}</td>
      <td class="${rc}">${roas!=='—'?roas+'x':'—'}</td>
    </tr>
    <tr class="camp-ads-row" id="crow-${eid}">
      <td colspan="14">
        <div class="camp-ads-inner closed" id="${eid}">
          <div class="camp-ads-content" id="cc-${eid}"></div>
        </div>
      </td>
    </tr>`;
  });
  tbody.innerHTML = html;
  if (footer) footer.textContent = `Mostrando 1 a ${camps.length} de ${camps.length} campanhas`;
}

function filterActiveCamps(q) {
  document.querySelectorAll('#activeCampsBody tr.camp-main-row').forEach(r => {
    const show = r.textContent.toLowerCase().includes(q.toLowerCase());
    r.style.display = show ? '' : 'none';
    // Also hide/show the expand row below
    const next = r.nextElementSibling;
    if (next && next.classList.contains('camp-ads-row')) next.style.display = show ? '' : 'none';
  });
}

// ── Campaign Ads Expand (with Meta thumbnail support) ─────────
async function toggleCampAds(campId) {
  const panel = document.getElementById('cexp-' + campId);
  const btn   = document.getElementById('cebtn-' + campId);
  const cc    = document.getElementById('cc-cexp-' + campId);
  if (!panel || !btn || !cc) return;

  const isOpen = panel.classList.contains('open');
  if (isOpen) { panel.classList.replace('open','closed'); btn.textContent='+'; return; }

  panel.classList.replace('closed','open');
  btn.textContent = '−';
  cc.innerHTML = `<div class="ai-loading"><div class="ai-spinner"></div><span>Carregando criativos...</span></div>`;

  const camp    = state.campaigns.find(c => c.id === campId);
  const campAds = state.ads
    .filter(a => a.campaignId === campId)
    .sort((a,b) => (b.conversions||0) - (a.conversions||0))
    .slice(0, 15);

  // Busca thumbnails reais via Meta API
  const acc = state.accounts.find(a => a.id === camp?.accountId);
  if (camp?.platform === 'meta' && acc && !acc.isDemo) {
    await enrichAdsWithThumbnails(campAds, acc.token);
  }

  const rankLabel  = ['#1','#2','#3','#4','#5'];
  const rankClass  = ['rank-gold','rank-silver','rank-bronze','rank-4','rank-5'];
  const statusBadge = s => s === 'ACTIVE' || !s
    ? `<span class="ad-status-badge active">● Ativo</span>`
    : `<span class="ad-status-badge paused">⏸ Pausado</span>`;

  const emojis = ['🎬','📸','🖼️','📱','🎞️','📢','🎯','✨','🔥','💡','⚡','🌟','🎪','🎨','🎭'];

  cc.innerHTML = `
    <div class="ad-cards-header">
      <div class="ad-cards-title">
        🏆 #1–${campAds.length} melhores criativos
        <span class="ad-cards-subtitle">— classificados por Resultados</span>
      </div>
      <div class="ad-cards-source">Dados: ${camp?.platform === 'meta' ? 'Meta Ads Manager' : (camp?.platform || 'API')}</div>
    </div>`;

  if (!campAds.length) {
    cc.innerHTML += `<div class="no-ads-msg">Nenhum anúncio disponível — sincronize a conta para carregar criativos.</div>`;
    return;
  }

  cc.innerHTML += `<div class="ad-cards-grid">
    ${campAds.map((ad, i) => {
      const ctr      = ad.impressions > 0 ? ((ad.clicks/ad.impressions)*100).toFixed(2) : null;
      const cpc      = ad.clicks > 0 ? (ad.spend/ad.clicks).toFixed(2) : null;
      const cpl      = (ad.conversions||0) > 0 ? (ad.spend/ad.conversions).toFixed(2) : null;
      const freq     = ad.frequency ? ad.frequency.toFixed(1) : null;
      const impr     = ad.impressions ? fmt.num(ad.impressions) : '—';
      const results  = fmt.num(ad.conversions||0);
      const cplLabel = cpl ? fmt.brl(parseFloat(cpl)) : '—';

      const thumb = ad.thumbUrl
        ? `<img src="${ad.thumbUrl}" class="ad-card-thumb" alt="criativo"
             loading="lazy"
             onerror="this.parentElement.innerHTML='<div class=\\'ad-card-thumb-placeholder\\'>${emojis[i%emojis.length]}</div>'">`
        : `<div class="ad-card-thumb-placeholder">${emojis[i%emojis.length]}</div>`;

      const rankBadge = i < 5
        ? `<div class="ad-card-rank ${rankClass[i]}">${rankLabel[i]}</div>`
        : `<div class="ad-card-rank rank-other">#${i+1}</div>`;

      return `
      <div class="ad-card ${i < 3 ? 'ad-card-top' : ''}">
        <div class="ad-card-img-wrap">
          ${thumb}
          ${rankBadge}
          ${statusBadge(ad.status)}
        </div>
        <div class="ad-card-body">
          <div class="ad-card-name">${ad.name || 'Anúncio ' + (i+1)}</div>
          <div class="ad-card-sub">${camp?.name || ''}</div>

          <div class="ad-card-metrics">
            <div class="ad-card-met">
              <div class="ad-card-met-val green">${results}</div>
              <div class="ad-card-met-lbl">RESULTADOS</div>
            </div>
            <div class="ad-card-met">
              <div class="ad-card-met-val blue">${ctr ? ctr+'%' : '—'}</div>
              <div class="ad-card-met-lbl">CTR</div>
            </div>
          </div>

          <div class="ad-card-metrics ad-card-metrics-2">
            <div class="ad-card-met">
              <div class="ad-card-met-val">${fmt.brl(ad.spend)}</div>
              <div class="ad-card-met-lbl">GASTO</div>
            </div>
            <div class="ad-card-met">
              <div class="ad-card-met-val">${cpc ? 'R$'+cpc : '—'}</div>
              <div class="ad-card-met-lbl">CPC</div>
            </div>
          </div>

          <div class="ad-card-footer">
            <span class="ad-card-imp">${impr} imp. ${freq ? '· freq '+freq : ''}</span>
            <span class="ad-card-cpl ${cpl && parseFloat(cpl) < 50 ? 'cpl-good' : ''}">${cplLabel}/res.</span>
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

// ── Fetch real Meta thumbnails ────────────────────────────────
async function enrichAdsWithThumbnails(ads, token) {
  const enrichJobs = ads.map(async ad => {
    if (ad.thumbUrl || !ad.id?.startsWith('meta_')) return;
    try {
      const adId = ad.id.replace('meta_','');
      const data = await fetchMetaAPI(`${adId}`, {
        access_token: token,
        fields: 'creative{thumbnail_url,image_url,video_id}'
      });
      const creative = data.creative;
      if (creative?.thumbnail_url) ad.thumbUrl = creative.thumbnail_url;
      else if (creative?.image_url)   ad.thumbUrl = creative.image_url;
    } catch(e) { /* thumbnail optional */ }
  });
  await Promise.allSettled(enrichJobs);
  saveState();
}

function deleteCampaign(id){if(!confirm('Excluir?'))return;state.campaigns=state.campaigns.filter(c=>c.id!==id);saveState();renderCampaigns();renderDashboard();showToast('Removida','info');}
function saveCampaign(){
  const name=document.getElementById('mCampName').value.trim();
  const accountId=document.getElementById('mCampAccount').value;
  const objective=document.getElementById('mCampObj').value;
  const budget=parseFloat(document.getElementById('mCampBudget').value)||0;
  const status=document.getElementById('mCampStatus').value;
  if(!name){showToast('Informe o nome','error');return;}
  const acc=state.accounts.find(a=>a.id===accountId);
  state.campaigns.push({id:'c'+Date.now(),name,accountId,objective,status,budget,spend:0,revenue:0,clicks:0,impressions:0,conversions:0,platform:acc?.platform||'meta',source:'manual'});
  saveState();closeModal('modalAddCampaign');renderCampaigns();renderDashboard();showToast('Campanha adicionada!','success');
}

// ─── TOP ADS ─────────────────────────────────────────────────
function renderTopAds(){
  const wrap=document.getElementById('topadsWrap');
  const camps=getFilteredCampaigns();
  if(!camps.length){wrap.innerHTML=`<div class="empty-state"><span class="empty-icon">🏆</span><p>Sem campanhas.</p></div>`;return;}
  wrap.innerHTML=camps.map(c=>{
    const campAds=state.ads.filter(a=>a.campaignId===c.id).sort((a,b)=>(b.revenue/b.spend||0)-(a.revenue/a.spend||0)).slice(0,5);
    if(!campAds.length) return '';
    const rows=campAds.map((ad,i)=>{
      const roas=ad.spend>0?(ad.revenue/ad.spend).toFixed(2):'—';
      const ctr=ad.impressions>0?((ad.clicks/ad.impressions)*100).toFixed(2):'—';
      const cpc=ad.clicks>0?(ad.spend/ad.clicks).toFixed(2):'—';
      return `<div class="ad-row">
        <div class="ad-rank rank-${i+1}">${i+1}</div>
        <div><div class="ad-name">${ad.name}</div><div class="ad-meta">${c.name}</div></div>
        <div><div class="ad-metric ${roas!=='—'?(roas>=4?'roas-good':roas>=2.5?'roas-med':'roas-bad'):''}">${roas!=='—'?roas+'x':'—'}</div><div class="ad-metric-lbl">ROAS</div></div>
        <div><div class="ad-metric">${ctr!=='—'?ctr+'%':'—'}</div><div class="ad-metric-lbl">CTR</div></div>
        <div><div class="ad-metric">${fmt.brl(ad.spend)}</div><div class="ad-metric-lbl">Gasto</div></div>
        <div><div class="ad-metric">${fmt.brl(ad.revenue)}</div><div class="ad-metric-lbl">Receita</div></div>
        <div><div class="ad-metric">${cpc!=='—'?'R$'+cpc:'—'}</div><div class="ad-metric-lbl">CPC</div></div>
      </div>`;
    }).join('');
    return `<div class="topads-section"><div class="topads-section-head"><h4>🏆 ${c.name}</h4><span class="badge ${c.status}">${c.status}</span></div><div class="topads-list">${rows}</div></div>`;
  }).join('');
}

// ─── IMPROVEMENTS ────────────────────────────────────────────
function renderImprovements(){
  const camps=getFilteredCampaigns();
  const grid=document.getElementById('imprGrid');
  if(!camps.length){grid.innerHTML=`<div class="empty-state"><span class="empty-icon">🚀</span><p>Sem campanhas.</p></div>`;return;}
  grid.innerHTML=camps.map(c=>{
    const roas=c.revenue/c.spend,ctr=(c.clicks/c.impressions)*100;
    const cpc=c.spend/c.clicks,cpa=c.conversions>0?c.spend/c.conversions:0;
    const score=calcScore(roas,ctr,c);
    const sc=score>=70?'good':score>=45?'med':'bad';
    const tips=generateTips(c,roas,ctr,cpc,cpa);
    return `<div class="impr-card">
      <div class="impr-card-head">
        <div><h4>${c.name}</h4><div style="font-size:12px;color:var(--text2);margin-top:4px">ROAS: ${roas.toFixed(2)}x · CTR: ${ctr.toFixed(2)}% · CPA: ${cpa>0?'R$'+cpa.toFixed(2):'—'}</div></div>
        <div class="score-ring"><div class="score-val ${sc}">${score}</div><div class="score-lbl">Score</div></div>
      </div>
      <div class="impr-items">${tips.map(t=>`<div class="impr-item ${t.type}"><div class="impr-item-icon">${t.icon}</div><div><div class="impr-item-title">${t.title}</div><div class="impr-item-desc">${t.desc}</div></div></div>`).join('')}</div>
      <div style="margin-top:14px"><button class="btn-primary" style="padding:7px 14px;font-size:12px" onclick="goToAI('${c.id}')">🤖 Análise Profunda com IA</button></div>
    </div>`;
  }).join('');
}
function calcScore(roas,ctr,c){let s=0;if(roas>=5)s+=35;else if(roas>=3)s+=25;else if(roas>=2)s+=15;else s+=5;if(ctr>=3)s+=25;else if(ctr>=1.5)s+=18;else if(ctr>=0.8)s+=10;else s+=3;if(c.status==='ativa')s+=10;if(c.conversions>50)s+=20;else if(c.conversions>20)s+=14;else s+=6;return Math.min(s,100);}
function generateTips(c,roas,ctr,cpc,cpa){
  const t=[];
  if(roas<2)t.push({type:'critical',icon:'🔴',title:'ROAS Crítico',desc:`${roas.toFixed(2)}x está abaixo do mínimo. Pause e reestruture criativos e público-alvo.`});
  else if(roas<3.5)t.push({type:'warning',icon:'🟡',title:'ROAS Pode Melhorar',desc:`${roas.toFixed(2)}x tem espaço. Teste novos ângulos de copy e formatos (UGC, vídeo curto).`});
  else t.push({type:'opportunity',icon:'✅',title:'ROAS Excelente',desc:`${roas.toFixed(2)}x. Escale o orçamento 20-30% para maximizar o momento.`});
  if(ctr<0.8)t.push({type:'critical',icon:'🎨',title:'CTR Muito Baixo',desc:`${ctr.toFixed(2)}% – criativos não atraem. Teste novos hooks e miniaturas.`});
  else if(ctr<1.5)t.push({type:'warning',icon:'📝',title:'Melhorar Criativos',desc:`CTR ${ctr.toFixed(2)}% abaixo da média. Headlines mais diretas e imagem com pessoa real.`});
  if(cpc>3)t.push({type:'warning',icon:'💸',title:'CPC Elevado',desc:`R$${cpc.toFixed(2)} – refine a segmentação e revise estratégia de lance.`});
  if(c.objective==='conversao'&&ctr>2&&roas<3)t.push({type:'warning',icon:'🔗',title:'Verifique a Landing Page',desc:`Bom CTR mas ROAS baixo – gargalo provavelmente na conversão da LP.`});
  if(c.spend>3000&&roas>=4)t.push({type:'opportunity',icon:'📈',title:'Escala Disponível',desc:`Alta performance + volume. Incremente 20% ao dia no budget com segurança.`});
  if(t.length===0)t.push({type:'opportunity',icon:'🌟',title:'Bem Otimizada',desc:`Indicadores dentro dos parâmetros. Teste variações incrementais.`});
  return t.slice(0,5);
}

// ─── AI ANALYSIS PAGE ─────────────────────────────────────────
function renderAIAnalysis(){
  const camps=getFilteredCampaigns();
  const page=document.getElementById('page-aianalysis');
  if(!page) return;
  const hasKey=state.anthropicKey&&state.anthropicKey.length>10;

  page.innerHTML=`
  <div class="ai-page-header">
    <div>
      <h3>🤖 Análise Inteligente com IA</h3>
      <p>Claude analisa suas campanhas e gera recomendações estratégicas personalizadas em tempo real</p>
    </div>
    <button class="btn-primary" id="btnAnalyzeAll" onclick="analyzeAllCampaigns()">🤖 Analisar Portfólio Completo</button>
  </div>

  ${!hasKey?`<div class="ai-key-warning">
    <span>⚠️</span>
    <div><strong>API Key da Anthropic não configurada.</strong><br>
    Vá em <strong>Contas & Tokens → Configurações de IA</strong>, cole sua chave de <a href="https://console.anthropic.com" target="_blank" style="color:var(--blue)">console.anthropic.com</a> e salve.</div>
  </div>`:`<div class="ai-key-ok"><span>✅</span> API Anthropic configurada – pronta para uso.</div>`}

  <div id="aiGlobalBox" class="ai-global-box hidden"></div>

  <div class="ai-camps-list">
    ${camps.length===0?`<div class="empty-state"><span class="empty-icon">🤖</span><p>Sem campanhas para analisar.</p></div>`:
      camps.map(c=>{
        const roas=c.spend>0?(c.revenue/c.spend).toFixed(2):0;
        const ctr=c.impressions>0?((c.clicks/c.impressions)*100).toFixed(2):0;
        const cached=state.aiAnalyses[c.id];
        return `<div class="ai-camp-card" id="ai-card-${c.id}">
          <div class="ai-camp-head">
            <div class="ai-camp-info">
              <span class="ai-camp-name">${c.name}</span>
              <span class="badge ${c.status}">${c.status}</span>
            </div>
            <div class="ai-camp-metrics">
              <span>ROAS <strong>${roas}x</strong></span>
              <span>CTR <strong>${ctr}%</strong></span>
              <span>Gasto <strong>${fmt.brl(c.spend)}</strong></span>
              <span>Receita <strong>${fmt.brl(c.revenue)}</strong></span>
            </div>
            <button class="btn-ai-analyze" id="ai-btn-${c.id}" onclick="analyzeWithAI('${c.id}')">
              🤖 ${cached?'Reanalisar com IA':'Analisar com IA'}
            </button>
          </div>
          <div class="ai-box ${cached?'':'hidden'}" id="ai-box-${c.id}">
            ${cached?`<div class="ai-result">
              <div class="ai-result-header">
                <span>🤖 Última análise – ${new Date(cached.createdAt).toLocaleString('pt-BR')}</span>
                <button class="btn-sm" onclick="copyAIAnalysis('${c.id}')">📋 Copiar</button>
              </div>
              <div class="ai-content">${cached.html||markdownToHTML(cached.text)}</div>
            </div>`:''}
          </div>
        </div>`;
      }).join('')}
  </div>`;
}

// ─── MARKET RESEARCH ─────────────────────────────────────────
function renderCompetitors(){
  const grid=document.getElementById('compGrid');
  if(!state.competitors.length){grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1"><span class="empty-icon">🔍</span><p>Adicione concorrentes para mapear o mercado.</p></div>`;renderInsights([]);return;}
  grid.innerHTML=state.competitors.map((c,i)=>`
    <div class="comp-card">
      <div class="comp-head"><div><div class="comp-name">${c.name}</div><div class="comp-url">${c.url||'—'}</div></div><button class="btn-del" onclick="removeCompetitor(${i})">✕</button></div>
      <span class="comp-niche">${c.niche||'Geral'}</span>
      <div class="comp-insights">• Budget est.: ${c.budget?'R$'+fmt.num(parseInt(c.budget))+'/mês':'Desconhecido'}<br>• Presença estimada: Meta Ads + Google Ads<br>• Estratégia: ${c.niche?.toLowerCase().includes('ecommerce')?'Shopping + Remarketing':'Conversão Direta'}</div>
      <div class="comp-actions">
        <button class="btn-sm" onclick="analyzeCompetitorAI(${i})">🤖 Analisar com IA</button>
        <button class="btn-sm" onclick="window.open('https://'+${JSON.stringify(c.url||'')}.replace('https://',''),'_blank')">🌐 Visitar</button>
      </div>
    </div>`).join('');
  renderInsights(state.competitors);
}
function renderInsights(competitors){
  const wrap=document.getElementById('insightsWrap');
  if(!competitors.length){wrap.innerHTML='<p style="color:var(--text2);font-size:13px">Adicione concorrentes para gerar insights.</p>';return;}
  const list=[
    {title:'📊 Análise de Mercado',desc:`${competitors.length} concorrente(s) mapeado(s). Foque em diferenciais de copy e criativos únicos.`},
    {title:'🎯 Oportunidade',desc:'Campanhas de awareness com educação do cliente antes da compra geram leads mais qualificados.'},
    {title:'💡 Tática Recomendada',desc:'UGC e depoimentos reais aumentam CVR em 15-30% vs. criativo de marca.'},
    {title:'🔥 Tendência',desc:'Reels/Shorts com hook nos primeiros 2s têm o menor CPM eficiente do mercado.'}
  ];
  wrap.innerHTML=list.map(i=>`<div class="insight-card"><h5>${i.title}</h5><p>${i.desc}</p></div>`).join('');
}
function addCompetitor(){
  const name=document.getElementById('cName').value.trim();
  const url=document.getElementById('cUrl').value.trim();
  const niche=document.getElementById('cNiche').value.trim();
  const budget=document.getElementById('cBudget').value.trim();
  if(!name){showToast('Informe o nome','error');return;}
  state.competitors.push({name,url,niche,budget});
  saveState();
  ['cName','cUrl','cNiche','cBudget'].forEach(id=>document.getElementById(id).value='');
  renderCompetitors();
  showToast('Concorrente adicionado!','success');
}
function removeCompetitor(i){state.competitors.splice(i,1);saveState();renderCompetitors();showToast('Removido','info');}

// ─── ACCOUNTS PAGE ────────────────────────────────────────────
function renderAccountsList(){
  const list=document.getElementById('accList');
  const icons={meta:'📘'};
  const names={meta:'Meta Ads'};
  const realAccounts=state.accounts.filter(a=>!a.isDemo);

  let html=`
  <div class="acc-info-box">
    <h4>⚠️ Como configurar o Meta Ads corretamente</h4>
    <div class="acc-steps">
      <div class="acc-step"><span class="step-num">1</span><div><strong>Crie um App no Facebook Developers</strong><br>Acesse <a href="https://developers.facebook.com" target="_blank" style="color:var(--blue)">developers.facebook.com</a> → Meus Apps → Criar App → Tipo: <em>Negócios</em></div></div>
      <div class="acc-step"><span class="step-num">2</span><div><strong>Registre seu domínio Netlify</strong><br>App Settings → Basic → Site URL → cole exatamente: <code>https://mmarkt.netlify.app</code><br><span style="color:var(--red);font-size:11px">⚠ Sem isso o browser bloqueia por CORS e aparece erro #100</span></div></div>
      <div class="acc-step"><span class="step-num">3</span><div><strong>Gere o Token com as 3 permissões corretas</strong><br>Graph API Explorer → Gerar Token → marque: <code>ads_read</code> · <code>ads_management</code> · <code>business_management</code><br><span style="color:var(--text3);font-size:11px">Token de usuário expira em ~1h. Para produção use System User Token (não expira).</span></div></div>
      <div class="acc-step"><span class="step-num">4</span><div><strong>Copie o ID da Conta</strong><br>Gerenciador de Anúncios → URL ou Configurações da Conta → formato: <code>act_XXXXXXXXXX</code><br><span style="color:var(--text3);font-size:11px">O sistema adiciona "act_" automaticamente se você colar só os números.</span></div></div>
      <div class="acc-step"><span class="step-num">5</span><div><strong>Adicione e clique em Sincronizar</strong><br>Se houver erro, ele aparece abaixo do card com a causa exata e instruções de correção.</div></div>
    </div>
    <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border)">
      <strong style="font-size:12px;color:var(--text2)">🔎 Diagnóstico rápido – teste seu token antes de salvar:</strong>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        <input type="text" id="diagToken" placeholder="Cole o token aqui para testar..." style="flex:1;min-width:200px;padding:8px 12px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;font-family:monospace;outline:none">
        <button class="btn-diagnose" onclick="diagnoseToken()">🔍 Testar Token</button>
      </div>
      <div id="diagResult" style="margin-top:10px;font-size:12px;display:none;padding:10px 14px;border-radius:8px;line-height:1.7"></div>
    </div>
  </div>

  <div class="ai-key-section">
    <h4>🤖 API Key da Anthropic (para Análise com IA)</h4>
    <p style="color:var(--text2);font-size:13px;margin-bottom:12px">Necessária para usar a página "Análise com IA". Obtenha em <a href="https://console.anthropic.com" target="_blank" style="color:var(--blue)">console.anthropic.com</a> → API Keys → Create Key</p>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <input type="password" id="anthropicKeyInput" placeholder="sk-ant-api03-..." value="${state.anthropicKey||''}" style="flex:1;min-width:200px;padding:10px 14px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:monospace;font-size:13px;outline:none">
      <button class="btn-primary" onclick="saveAnthropicKey()">Salvar Chave</button>
    </div>
    <div style="margin-top:8px;font-size:12px;color:${state.anthropicKey?'var(--green)':'var(--text2)'}">
      ${state.anthropicKey?'✅ Chave configurada – Análise IA disponível':'⚠️ Sem chave – Análise IA indisponível'}
    </div>
  </div>`;

  if(!realAccounts.length){
    html+=`<div class="empty-state" style="margin-top:20px"><span class="empty-icon">🔑</span><p>Nenhuma conta real. Clique em "+ Adicionar Conta".</p></div>`;
  } else {
    html+=realAccounts.map((a)=>{
      const i=state.accounts.indexOf(a);
      return `<div class="acc-card" id="acc-card-${a.id}">
        <div class="acc-platform-icon">${icons[a.platform]||'📊'}</div>
        <div class="acc-info">
          <div class="acc-name">${a.name}</div>
          <div class="acc-meta">${names[a.platform]||a.platform} · ID: <code style="font-size:11px;color:var(--teal)">${a.accId||'—'}</code></div>
          <div class="acc-token">Token: ${a.token.slice(0,16)}•••</div>

          ${a.lastSync
            ? `<div style="font-size:11px;color:var(--green);margin-top:3px">✅ Sync: ${new Date(a.lastSync).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</div>`
            : `<div style="font-size:11px;color:var(--text3);margin-top:3px">⏳ Nunca sincronizado — clique em Sincronizar</div>`}
        </div>
        <div class="acc-status">
          <span class="${a.active?'badge-on':'badge-off'}">${a.active?'Ativo':'Inativo'}</span>
          <button class="btn-primary" style="padding:6px 12px;font-size:12px" onclick="syncAccountNow('${a.id}')">↻ Sincronizar</button>
          <button class="btn-sm" onclick="openEditAccount('${a.id}')" title="Editar conta">✎ Editar</button>
          <button class="btn-del" onclick="deleteAccount(${i})">🗑</button>
        </div>
      </div>`;
    }).join('');
  }
  list.innerHTML=html;
}

// Testa o token antes de salvar, chama /me e /me/adaccounts
async function diagnoseToken() {
  const token = document.getElementById('diagToken').value.trim();
  const box   = document.getElementById('diagResult');
  if (!token) { showToast('Cole o token no campo primeiro', 'error'); return; }
  box.style.display = 'block';
  box.style.background = 'var(--bg3)';
  box.style.color = 'var(--text2)';
  box.innerHTML = '⏳ Testando token...';

  try {
    // Teste 1: valida token
    const me = await fetchMetaAPI('me', { access_token: token, fields: 'id,name' });
    let html = `✅ <strong>Token válido!</strong> Conectado como: <strong>${me.name}</strong> (ID: ${me.id})<br><br>`;

    // Teste 2: lista contas de anúncios disponíveis
    try {
      const accs = await fetchMetaAPI('me/adaccounts', {
        access_token: token,
        fields: 'id,name,account_status,currency',
        limit: 20
      });
      if (accs.data?.length) {
        html += `📋 <strong>Contas de anúncios encontradas (${accs.data.length}):</strong><br>`;
        accs.data.forEach(a => {
          const status = a.account_status === 1 ? '🟢 Ativa' : a.account_status === 2 ? '🔴 Desativada' : '🟡 Status '+a.account_status;
          html += `• <code>${a.id}</code> – ${a.name} – ${status} – ${a.currency}<br>`;
        });
        html += `<br><span style="color:var(--green)">👆 Copie o ID (act_XXXX) da conta que deseja sincronizar e cole no campo "ID da Conta" ao adicionar.</span>`;
      } else {
        html += `⚠️ Nenhuma conta de anúncio encontrada para este usuário. Verifique se o token tem a permissão <code>ads_read</code>.`;
      }
    } catch(e2) {
      html += `⚠️ Não foi possível listar contas: ${e2.message}<br>Verifique as permissões <code>ads_read</code> e <code>business_management</code>.`;
    }

    box.style.background = 'rgba(62,207,142,0.08)';
    box.style.color = 'var(--text)';
    box.style.border = '1px solid rgba(62,207,142,0.2)';
    box.style.borderRadius = '8px';
    box.innerHTML = html;
  } catch(e) {
    box.style.background = 'rgba(248,113,113,0.08)';
    box.style.color = 'var(--red)';
    box.style.border = '1px solid rgba(248,113,113,0.2)';
    box.style.borderRadius = '8px';
    box.innerHTML = `❌ <strong>Token inválido:</strong> ${e.message}<br><br>Gere um novo token em <a href="https://developers.facebook.com/tools/explorer" target="_blank" style="color:var(--blue)">Graph API Explorer</a>.`;
  }
}

function saveAnthropicKey(){
  const key=document.getElementById('anthropicKeyInput').value.trim();
  state.anthropicKey=key;
  saveState();
  renderAccountsList();
  showToast(key?'Chave API salva com sucesso!':'Chave removida',key?'success':'info');
}

// ═══════════════════════════════════════════════════════════════
//  GOOGLE ADS VIA GOOGLE SHEETS (sem API)
// ═══════════════════════════════════════════════════════════════




async function syncAccountNow(id){
  const acc = state.accounts.find(a => a.id === id);
  if (!acc) return;

  const btn = document.querySelector(`button[onclick="syncAccountNow('${id}')"]`);
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Sincronizando...'; }

  try {
    let n = 0;
    if (acc.platform === 'meta')   n = await syncMetaAccount(acc);
    else { showToast(`Plataforma "${acc.platform}" ainda não suportada`, 'info'); return; }

    acc.lastSync = new Date().toISOString();
    saveState();
    renderAccountsList();

    if (n > 0) {
      state.updateLog.unshift({ time: new Date().toISOString(), msg: `${n} campanha(s) sincronizada(s) de ${acc.name}`, type: 'success' });
      saveState();
      renderDashboard(); renderCampaigns(); renderTopAds(); renderImprovements();
      showToast(`✅ ${n} campanha(s) sincronizada(s)!`, 'success');
    } else {
      showToast('Nenhuma campanha encontrada no período selecionado', 'info');
      if (btn) { btn.disabled = false; btn.textContent = '↻ Sincronizar'; }
    }
  } catch(e) {
    const errMsg = e.message || 'Erro desconhecido';
    state.updateLog.unshift({ time: new Date().toISOString(), msg: `Erro em ${acc.name}: ${errMsg}`, type: 'error' });
    saveState();
    renderAccountsList();
    showMetaError(id, errMsg);
    showToast(`Erro: ${errMsg}`, 'error');
  }
}

function showMetaError(accId, msg) {
  // Detecta a plataforma da conta para exibir instruções corretas
  const acc = state.accounts.find(a => a.id === accId);
  const platform = acc?.platform || 'meta';
  showSyncError(accId, msg, platform);
}

function showSyncError(accId, msg, platform) {
  const existing = document.getElementById(`err-${accId}`);
  if (existing) existing.remove();

  // Dicas específicas por plataforma
  const tips = {
    meta: `
      • O ID da conta está no formato <code>act_XXXXXXXXXX</code>?<br>
      • O token tem as permissões <code>ads_read</code>, <code>ads_management</code>, <code>business_management</code>?<br>
      • O token não está expirado? Gere um novo no <a href="https://developers.facebook.com/tools/explorer" target="_blank">Graph API Explorer</a><br>
      • Seu domínio <strong>mmarkt.netlify.app</strong> está registrado no App Facebook (Settings → Basic → Site URL)?`
  };

  const platIcons = { meta: '📘' };

  const box = document.createElement('div');
  box.id = `err-${accId}`;
  box.className = 'meta-error-box';
  box.innerHTML = `
    <div class="meta-error-title" style="color:${platColors[platform]||'var(--red)'}">
      ${platIcons[platform]||'❌'} Erro na Sincronização — ${platNames[platform]||platform}
    </div>
    <div class="meta-error-msg">${msg}</div>
    <div class="meta-error-tips">
      <strong>Verifique:</strong><br>
      ${tips[platform] || '• Verifique o token e ID da conta e tente novamente.'}
    </div>
    <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn-sm" onclick="document.getElementById('err-${accId}').remove()">Fechar</button>
    </div>`;

  const accList = document.getElementById('accList');
  if (accList) {
    // Insere logo após o card da conta específica
    const card = document.getElementById(`acc-card-${accId}`);
    if (card) card.insertAdjacentElement('afterend', box);
    else accList.appendChild(box);
  }
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Abre modal de edição de conta (útil para adicionar Developer Token depois)
function openEditAccount(accId) {
  const acc = state.accounts.find(a => a.id === accId);
  if (!acc) return;
  document.getElementById('mPlatform').value = acc.platform;
  document.getElementById('mName').value     = acc.name;
  document.getElementById('mToken').value    = acc.token;
  document.getElementById('mAccId').value    = acc.accId;
  onPlatformChange();
  // Sobrescreve o saveAccount para update em vez de insert
  window._editingAccId = accId;
  openModal('modalAddAccount');
  document.querySelector('#modalAddAccount .modal-hd h3').textContent = 'Editar Conta';
  document.querySelector('#modalAddAccount .btn-primary.full').textContent = 'Salvar Alterações';
  document.querySelector('#modalAddAccount .btn-primary.full').onclick = () => updateAccount(accId);
}

// Salva as alterações de uma conta existente
function updateAccount(accId) {
  const idx = state.accounts.findIndex(a => a.id === accId);
  if (idx < 0) return;
  const name     = document.getElementById('mName').value.trim();
  const token    = document.getElementById('mToken').value.trim();
  const accIdVal = document.getElementById('mAccId').value.trim();
  const platform = document.getElementById('mPlatform').value;
  const devToken = document.getElementById('mDevToken')?.value.trim() || '';
  if (!name || !token) { showToast('Preencha nome e token', 'error'); return; }
  state.accounts[idx] = {
    ...state.accounts[idx],
    name, token, platform,
    accId: accIdVal,

  };
  saveState();
  closeModal('modalAddAccount');
  // Reset modal to add mode
  document.querySelector('#modalAddAccount .modal-hd h3').textContent = 'Adicionar Conta de Anúncio';
  document.querySelector('#modalAddAccount .btn-primary.full').textContent = 'Salvar Conta';
  document.querySelector('#modalAddAccount .btn-primary.full').onclick = saveAccount;
  window._editingAccId = null;
  renderAccountsList(); renderAccountFilter();
  // Remove error box if present
  document.getElementById(`err-${accId}`)?.remove();
  showToast('Conta atualizada! Clique em Sincronizar para testar.', 'success');
}

function saveAccount(){
  const name     = document.getElementById('mName').value.trim();
  const token    = document.getElementById('mToken').value.trim();
  const accId    = document.getElementById('mAccId').value.trim();
  const platform = document.getElementById('mPlatform').value;
  const devToken = document.getElementById('mDevToken')?.value.trim() || '';
  if(!name||!token){showToast('Preencha nome e token','error');return;}
  const acc = {id:'acc'+Date.now(),name,platform,token,accId,active:true,isDemo:false};
  if (platform === 'google' && devToken) acc.developerToken = devToken;
  state.accounts.push(acc);
  saveState();closeModal('modalAddAccount');renderAccountsList();renderAccountFilter();
  ['mName','mToken','mAccId','mDevToken'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  showToast('Conta adicionada! Clique em "Sincronizar" para buscar campanhas.','success');
}
function deleteAccount(i){if(!confirm('Remover conta?'))return;state.accounts.splice(i,1);saveState();renderAccountsList();renderAccountFilter();showToast('Conta removida','info');}

// ─── SCHEDULE ────────────────────────────────────────────────
function renderSchedule(){
  const now=new Date();
  const make=(h)=>{ const d=new Date(now); d.setHours(h,0,0,0); if(now>=d) d.setDate(d.getDate()+1); return d; };
  const f2=d=>d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  const nM=make(8),nN=make(12),nE=make(18);
  const el=(id,txt)=>{ const e=document.getElementById(id); if(e) e.textContent=txt; };
  el('nextMorn','Próxima: '+f2(nM));
  el('nextNoon','Próxima: '+f2(nN));
  el('nextEvening','Próxima: '+f2(nE));
  const log=document.getElementById('updateLog');
  if(!state.updateLog.length){log.innerHTML='<p style="color:var(--text2);font-size:13px">Nenhuma atualização registrada.</p>';return;}
  log.innerHTML=state.updateLog.slice(0,20).map(l=>`<div class="log-item">
    <span class="log-ic">${l.type==='success'?'✅':l.type==='info'?'ℹ️':'❌'}</span>
    <span class="log-time">${new Date(l.time).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</span>
    <span>${l.msg}</span>
  </div>`).join('');
}

function startScheduler(){checkScheduledUpdates();setInterval(checkScheduledUpdates,60000);}
function checkScheduledUpdates(){
  const now=new Date(),h=now.getHours(),m=now.getMinutes();
  const k8=`sched_${now.toDateString()}_8`,k12=`sched_${now.toDateString()}_12`,k18=`sched_${now.toDateString()}_18`;
  if(h===8 &&m===0&&!localStorage.getItem(k8)){localStorage.setItem(k8,'1');triggerScheduledUpdate('Atualização matinal (08:00)');}
  if(h===12&&m===0&&!localStorage.getItem(k12)){localStorage.setItem(k12,'1');triggerScheduledUpdate('Atualização meio-dia (12:00)');}
  if(h===18&&m===0&&!localStorage.getItem(k18)){localStorage.setItem(k18,'1');triggerScheduledUpdate('Atualização da tarde (18:00)');}
}
function triggerScheduledUpdate(msg){
  syncAllAccounts().then(()=>{
    state.updateLog.unshift({time:new Date().toISOString(),msg:msg+' executada',type:'success'});
    saveState();updateSyncText();renderSchedule();showToast(msg+' concluída!','success');
  });
}
function updateSyncText(){
  const last=state.updateLog[0];
  if(!last) return;
  document.getElementById('syncText').textContent='Sync: '+new Date(last.time).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
}

// ─── MODALS ───────────────────────────────────────────────────
function openModal(id){document.getElementById(id)?.classList.remove('hidden');}
function closeModal(id){document.getElementById(id)?.classList.add('hidden');}

function onPlatformChange() {
  const hint = document.getElementById('platformHint');
  if (hint) hint.innerHTML = '<b>Meta Ads:</b> Token de Acesso via <a href="https://developers.facebook.com" target="_blank">Meta for Developers</a> → Ferramentas → Explorador de API. ID da conta começa com <code>act_</code>.';
}

// ─── TOAST ───────────────────────────────────────────────────
function showToast(msg,type='info'){
  const wrap=document.getElementById('toastWrap');
  const t=document.createElement('div');
  t.className=`toast ${type}`;t.textContent=msg;
  wrap.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(20px)';t.style.transition='0.3s';setTimeout(()=>t.remove(),300);},3500);
}

// ─── FORMATTERS ──────────────────────────────────────────────
const fmt={
  brl:v=>(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),
  num:v=>(v||0).toLocaleString('pt-BR'),
  shortNum:v=>v>=1000000?(v/1000000).toFixed(1)+'M':v>=1000?(v/1000).toFixed(1)+'K':String(v)
};

// ─── PDF EXPORT — CAMPANHAS ──────────────────────────────────
async function exportCampPDF() {
  if (!window.jspdf || !window.html2canvas) {
    showToast('Aguarde — bibliotecas de PDF carregando...', 'info');
    return;
  }
  showToast('Gerando PDF da página Campanhas...', 'info');

  const hideEls = document.querySelectorAll('.expand-btn,.ads-expand-inner,.btn-pdf,.btn-apply-date,.btn-compare,.date-range-picker,.plat-tabs');
  hideEls.forEach(el => { el.dataset.pdfHide='1'; el.style.visibility='hidden'; });

  try {
    const { jsPDF } = window.jspdf;
    const isLight = document.body.classList.contains('light');
    const W = 210, H = 297;
    const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });

    const bg   = isLight ? [240,242,247] : [10,13,20];
    const bg2  = isLight ? [255,255,255] : [16,20,31];
    const tcol = isLight ? [30,30,30]    : [230,235,245];
    const acc  = [240,192,64];

    // Cabeçalho
    doc.setFillColor(...bg2); doc.rect(0,0,W,22,'F');
    doc.setFillColor(...acc); doc.rect(0,22,W,1,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...acc);
    doc.text('MMarkt v5.0', 14, 13);
    const tabLabel = campPlatformFilter === 'meta' ? 'Análise Estratégica — Meta Ads' : 'Perfis e Funil';
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...tcol);
    doc.text(tabLabel, 14, 19);
    doc.text(new Date().toLocaleDateString('pt-BR'), W-14, 13, {align:'right'});

    let yPos = 28;

    // Captura o conteúdo visível da aba atual
    const targetEl = campPlatformFilter === 'meta'
      ? document.getElementById('campPlatformView')
      : document.getElementById('campGenericView');

    if (targetEl) {
      const canvas = await html2canvas(targetEl, {
        scale: 1.8,
        useCORS: true,
        backgroundColor: isLight ? '#f0f2f7' : '#0a0d14',
        logging: false
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const imgW = W - 28;
      const imgH = (canvas.height * imgW) / canvas.width;
      const pagesNeeded = Math.ceil(imgH / (H - yPos - 12));

      for (let p = 0; p < pagesNeeded; p++) {
        if (p > 0) { doc.addPage(); yPos = 14; }
        const sliceH = H - yPos - 12;
        const srcY  = p * (canvas.height / pagesNeeded);
        const srcH  = canvas.height / pagesNeeded;

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width  = canvas.width;
        sliceCanvas.height = srcH;
        sliceCanvas.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
        const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.85);
        doc.addImage(sliceData, 'JPEG', 14, yPos, imgW, Math.min(sliceH, (srcH * imgW) / canvas.width));
      }
    }

    // Footer em todas as páginas
    const total = doc.internal.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      doc.setPage(p);
      doc.setFillColor(...bg2); doc.rect(0,H-8,W,8,'F');
      doc.setFont('helvetica','normal'); doc.setFontSize(6); doc.setTextColor(100,110,130);
      doc.text('MMarkt v5.0 · Matheus Muniz Marketing Estratégico · mmarkt.netlify.app', W/2, H-3, {align:'center'});
      doc.text(`Pág. ${p}/${total}`, W-8, H-3, {align:'right'});
    }

    const fname = campPlatformFilter === 'meta' ? 'MMarkt_Analise_Estrategica' : 'MMarkt_Perfis_Funil';
    doc.save(`${fname}_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}.pdf`);
    showToast('✅ PDF exportado!', 'success');
  } catch(e) {
    console.error('PDF Campanhas error:', e);
    showToast('Erro ao gerar PDF: '+e.message, 'error');
  } finally {
    hideEls.forEach(el => { el.style.visibility=''; delete el.dataset.pdfHide; });
  }
}


// ─── PDF EXPORT — DASHBOARD ─────────────────────────────────
async function exportPDF() {
  const isDashboard = document.getElementById('page-dashboard').classList.contains('active');
  if (!isDashboard) { showToast('Navegue para o Dashboard antes de exportar o PDF', 'info'); return; }
  showToast('Gerando PDF completo com gráficos...', 'info');

  const hideEls = document.querySelectorAll('.expand-btn,.ads-expand-inner,.btn-pdf,.btn-pdf-sm,.btn-refresh');
  hideEls.forEach(el => { el.dataset.pdfHide='1'; el.style.visibility='hidden'; });

  try {
    const { jsPDF } = window.jspdf;
    const camps  = getFilteredCampaigns();
    const ts     = camps.reduce((s,c)=>s+c.spend,0);
    const tr     = camps.reduce((s,c)=>s+c.revenue,0);
    const tc     = camps.reduce((s,c)=>s+c.clicks,0);
    const ti     = camps.reduce((s,c)=>s+c.impressions,0);
    const tconv  = camps.reduce((s,c)=>s+(c.conversions||0),0);
    const treach = camps.reduce((s,c)=>s+(c.reach||0),0);
    const ar     = ts>0?tr/ts:0;
    const at     = ti>0?(tc/ti)*100:0;
    const acpc   = tc>0?ts/tc:0;
    const acpl   = tconv>0?ts/tconv:0;
    const isLight= document.body.classList.contains('light');
    const bg     = isLight?[240,242,247]:[10,13,20];
    const bg2    = isLight?[255,255,255]:[16,20,31];
    const tc2    = isLight?[26,31,46]:[232,234,240];
    const tc3    = isLight?[100,110,125]:[136,146,164];
    const fromVal= document.getElementById('dashDateFrom')?.value||'';
    const toVal  = document.getElementById('dashDateTo')?.value||'';
    const fmtD   = d=>d?new Date(d+'T00:00:00').toLocaleDateString('pt-BR'):'—';
    const period = fromVal&&toVal?`${fmtD(fromVal)} → ${fmtD(toVal)}`:(getActiveDays())+' dias';
    const nowStr = new Date().toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});

    const doc = new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    const W=doc.internal.pageSize.getWidth(), H=doc.internal.pageSize.getHeight();

    const newPage=()=>{
      doc.addPage();
      doc.setFillColor(...bg); doc.rect(0,0,W,H,'F');
    };

    // Page 1 background
    doc.setFillColor(...bg); doc.rect(0,0,W,H,'F');
    // Header bar
    doc.setFillColor(...bg2); doc.rect(0,0,W,20,'F');
    // Logo
    try {
      const logoSrc=isLight?'Logo_MMarkt_Preto.png':'Logo_MMarkt.png';
      const img=new Image(); img.src=logoSrc;
      await new Promise(r=>{img.onload=r;img.onerror=r;setTimeout(r,1500);});
      if(img.naturalWidth>0){
        // Mantém proporção original da logo
        const maxW=38, maxH=14;
        const ratio=img.naturalWidth/img.naturalHeight;
        let lw=maxW, lh=maxW/ratio;
        if(lh>maxH){lh=maxH;lw=maxH*ratio;}
        const ly=2+(maxH-lh)/2;
        doc.addImage(img,'PNG',8,ly,lw,lh,'','FAST');
      }
      else throw 0;
    } catch(e){
      doc.setFont('helvetica','bold');doc.setFontSize(12);
      doc.setTextColor(240,192,64);doc.text('MMarkt',10,13);
    }
    doc.setFont('helvetica','normal');doc.setFontSize(7);
    doc.setTextColor(...tc3);
    doc.text(`Gerado: ${nowStr}  |  Período: ${period}`,W-8,12,{align:'right'});
    // Divider
    doc.setFillColor(240,192,64);doc.rect(0,20,W,0.4,'F');

    let y=28;
    // Title
    doc.setFont('helvetica','bold');doc.setFontSize(13);doc.setTextColor(...tc2);
    doc.text('Relatório de Performance',10,y);y+=5;
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(...tc3);
    doc.text('Matheus Muniz Marketing Estratégico · MMarkt v5.0',10,y);y+=8;

    // KPIs helper
    const kpiW=(W-20)/5;
    const drawKpi=(x,yy,w,lbl,val,color)=>{
      doc.setFillColor(...bg2);doc.roundedRect(x,yy,w-2,15,2,2,'F');
      doc.setFont('helvetica','normal');doc.setFontSize(6);doc.setTextColor(...tc3);
      doc.text(lbl.toUpperCase(),x+(w-2)/2,yy+5,{align:'center'});
      doc.setFont('helvetica','bold');doc.setFontSize(9);
      doc.setTextColor(...(color||tc2));
      doc.text(String(val),x+(w-2)/2,yy+12,{align:'center'});
    };
    // Section label helper
    const secLabel=(lbl,yy)=>{
      doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(...tc3);
      doc.text(lbl,10,yy);return yy+5;
    };

    y=secLabel('PERFORMANCE FINANCEIRA',y);
    drawKpi(10,       y,kpiW,'Investimento', fmt.brl(ts),null);
    drawKpi(10+kpiW,  y,kpiW,'Receita',      fmt.brl(tr),[62,207,142]);
    drawKpi(10+kpiW*2,y,kpiW,'ROAS Médio',   ar.toFixed(2)+'x',ar>=3?[62,207,142]:[248,113,113]);
    drawKpi(10+kpiW*3,y,kpiW,'Resultados',   fmt.num(tconv),null);
    drawKpi(10+kpiW*4,y,kpiW,'CPL',          tconv>0?fmt.brl(acpl):'—',null);
    y+=19;

    y=secLabel('ALCANCE & ENGAJAMENTO',y);
    drawKpi(10,       y,kpiW,'Cliques',    fmt.num(tc),null);
    drawKpi(10+kpiW,  y,kpiW,'Impressões', fmt.num(ti),null);
    drawKpi(10+kpiW*2,y,kpiW,'Alcance',    treach>0?fmt.num(treach):'—',null);
    drawKpi(10+kpiW*3,y,kpiW,'CTR Médio',  at.toFixed(2)+'%',null);
    drawKpi(10+kpiW*4,y,kpiW,'CPC Médio',  tc>0?fmt.brl(acpc):'—',null);
    y+=22;

    // Charts via html2canvas
    if(window.html2canvas){
      y=secLabel('GRÁFICOS DE PERFORMANCE',y);
      const boxes=[...document.querySelectorAll('.charts-row-a .chart-box,.charts-row-b .chart-box')].slice(0,6);
      const cW=(W-20)/3, cH=44;
      for(let i=0;i<boxes.length;i++){
        const col=i%3, row2=Math.floor(i/3);
        const cx=10+col*cW, cy=y+row2*(cH+3);
        if(cy+cH>H-15){newPage();y=15;}
        try{
          const cv=await html2canvas(boxes[i],{scale:1.5,backgroundColor:isLight?'#ffffff':'#10141f',logging:false,useCORS:true,allowTaint:true});
          doc.setFillColor(...bg2);doc.roundedRect(cx,cy,cW-2,cH,2,2,'F');
          doc.addImage(cv.toDataURL('image/jpeg',0.82),'JPEG',cx+1,cy+1,cW-4,cH-2,'','FAST');
        }catch(e){
          doc.setFillColor(...bg2);doc.roundedRect(cx,cy,cW-2,cH,2,2,'F');
          doc.setFontSize(7);doc.setTextColor(...tc3);
          doc.text('Gráfico indisponível',cx+(cW-2)/2,cy+cH/2,{align:'center'});
        }
      }
      y+=(Math.ceil(boxes.length/3))*(cH+3)+5;
    }

    // Campaigns table
    if(y>H-40){newPage();y=15;}
    y=secLabel('RESUMO DE CAMPANHAS',y);
    const cols=['Campanha','Plat.','Status','Invest.','Receita','ROAS','Result.','Cliques','CTR','CPC','CPL'];
    const cw=[44,14,14,20,20,12,14,14,12,16,16];
    doc.setFillColor(...bg2);doc.rect(10,y,W-20,7,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(6);doc.setTextColor(...tc3);
    let cx=12;cols.forEach((c,i)=>{doc.text(c,cx,y+4.5);cx+=cw[i];});
    y+=8;
    doc.setFont('helvetica','normal');doc.setFontSize(7);
    camps.forEach((c,ri)=>{
      if(y>H-10){newPage();y=15;}
      if(ri%2===0){doc.setFillColor(...(isLight?[248,250,255]:[16,20,31]));doc.rect(10,y-3,W-20,8,'F');}
      const roas=c.spend>0?(c.revenue/c.spend).toFixed(2)+'x':'—';
      const ctr=c.impressions>0?((c.clicks/c.impressions)*100).toFixed(2)+'%':'—';
      const cpc=c.clicks>0?fmt.brl(c.spend/c.clicks):'—';
      const cpl=(c.conversions||0)>0?fmt.brl(c.spend/c.conversions):'—';
      const pn={meta:'Meta',google:'Google',tiktok:'TikTok',linkedin:'LinkedIn'}[c.platform]||c.platform;
      const row=[c.name.length>26?c.name.slice(0,24)+'…':c.name,pn,c.status,fmt.brl(c.spend),fmt.brl(c.revenue),roas,fmt.num(c.conversions||0),fmt.num(c.clicks),ctr,cpc,cpl];
      cx=12;
      row.forEach((v,i)=>{
        if(i===5&&v!=='—'){const rv=parseFloat(v);doc.setTextColor(rv>=4?62:rv>=2.5?200:248,rv>=4?207:rv>=2.5?160:80,rv>=4?142:rv>=2.5?0:80);}
        else doc.setTextColor(...(isLight?[26,31,46]:[200,204,215]));
        doc.text(String(v),cx,y+2);cx+=cw[i];
      });
      y+=8;
    });

    // Footer on all pages
    const total=doc.internal.getNumberOfPages();
    for(let p=1;p<=total;p++){
      doc.setPage(p);
      doc.setFillColor(...bg2);doc.rect(0,H-8,W,8,'F');
      doc.setFont('helvetica','normal');doc.setFontSize(6);doc.setTextColor(...tc3);
      doc.text('MMarkt v5.0 · Matheus Muniz Marketing Estratégico · mmarkt.netlify.app',W/2,H-3,{align:'center'});
      doc.text(`Pág. ${p}/${total}`,W-8,H-3,{align:'right'});
    }

    doc.save(`MMarkt_Dashboard_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}.pdf`);
    showToast('✅ PDF exportado com gráficos!','success');

  } catch(e){
    console.error('PDF error:',e);
    showToast('Erro ao gerar PDF: '+e.message,'error');
  } finally {
    hideEls.forEach(el=>{el.style.visibility='';delete el.dataset.pdfHide;});
  }
}

