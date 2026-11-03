import { readCloud, saveCloud, supabaseReady } from './supabase.js';

const STORE = 'permuta-v1';
const emptyState = { partnerships: [], events: [] };
let state = loadState();
let toastTimeout;

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORE)) || structuredClone(emptyState); }
  catch { return structuredClone(emptyState); }
}
function persist() { localStorage.setItem(STORE, JSON.stringify(state)); }
function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
function formatDate(value, options = { day: 'numeric', month: 'short' }) { if (!value) return '—'; return new Intl.DateTimeFormat('pt-BR', options).format(new Date(`${value.slice(0,10)}T12:00:00`)); }
function partner(id) { return state.partnerships.find(p => p.id === id); }
function eventDates(event) { return [event.contactDate && { date: event.contactDate, text: `Entrar em contato · ${event.name}` }, event.materialsDate && { date: event.materialsDate, text: `Enviar materiais · ${event.name}` }].filter(Boolean); }
function nextActionDate(event) { return eventDates(event).map(x => x.date).sort()[0] || event.date; }
function showToast(message) { const el = document.getElementById('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => el.classList.remove('show'), 2800); }
function updateDashboard() {
  const now = new Date(); now.setHours(0,0,0,0);
  const monthLimit = new Date(now); monthLimit.setDate(monthLimit.getDate() + 30);
  const active = state.partnerships.filter(p => p.status !== 'Inativa');
  const soon = state.events.filter(e => { const d = new Date(`${e.date}T12:00:00`); return d >= now && d <= monthLimit; }).sort((a,b) => a.date.localeCompare(b.date));
  const actions = state.events.flatMap(e => eventDates(e).map(action => ({ ...action, event: e }))).filter(a => new Date(`${a.date}T12:00:00`) >= now).sort((a,b) => a.date.localeCompare(b.date));
  document.getElementById('activeTotal').textContent = active.length;
  document.getElementById('eventTotal').textContent = soon.length;
  document.getElementById('actionTotal').textContent = actions.length;
  document.getElementById('reviewTotal').textContent = state.partnerships.filter(p => p.status === 'Em avaliação').length;
  document.getElementById('navCount').textContent = state.partnerships.length;
  document.getElementById('upcomingEvents').innerHTML = soon.length ? soon.slice(0,3).map(e => `<div class="event-row"><div class="date-tile"><strong>${formatDate(e.date,{day:'numeric'})}</strong><span>${formatDate(e.date,{month:'short'}).replace('.','')}</span></div><div class="event-info"><strong>${escapeHtml(e.name)}</strong><p>${escapeHtml(partner(e.partnership_id)?.name || 'Parceria')} · ${escapeHtml(e.task || 'Evento na agenda')}</p></div><span class="event-tag">Evento</span></div>`).join('') : '<div class="empty-inline"><span class="empty-symbol">▦</span><div><strong>Nenhum evento próximo</strong>Cadastre um evento para planejar os próximos passos.</div></div>';
  document.getElementById('actionList').innerHTML = actions.length ? actions.slice(0,3).map(a => `<div class="action-row"><span class="action-check"></span><div><strong>${escapeHtml(a.text.split(' · ')[0])}</strong><small>${escapeHtml(a.event.name)}</small></div><span class="action-date">${formatDate(a.date)}</span></div>`).join('') : '<div class="empty-inline"><div><strong>Tudo em dia</strong>As próximas ações aparecerão aqui.</div></div>';
  document.getElementById('recentList').innerHTML = state.partnerships.length ? [...state.partnerships].slice(-3).reverse().map(p => `<div class="recent-row"><span class="partner-mark">${escapeHtml(p.name.slice(0,1).toUpperCase())}</span><div><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.type)}</small></div><span class="status-pill ${p.status === 'Em avaliação' ? 'status-review' : ''}">${escapeHtml(p.status)}</span></div>`).join('') : '<div class="empty-inline">Cadastre sua primeira parceria.</div>';
}
function updatePartnerTable() {
  const query = document.getElementById('searchInput').value.trim().toLocaleLowerCase('pt-BR');
  const type = document.getElementById('typeFilter').value;
  const visible = state.partnerships.filter(p => (type === 'todos' || p.type === type) && `${p.name} ${p.benefit} ${p.offer}`.toLocaleLowerCase('pt-BR').includes(query));
  document.getElementById('partnerRows').innerHTML = visible.map(p => {
    const event = state.events.filter(e => e.partnership_id === p.id && e.date >= new Date().toISOString().slice(0,10)).sort((a,b) => a.date.localeCompare(b.date))[0];
    const assess = p.status === 'Em avaliação' ? 'Em avaliação' : (p.notes ? 'Com observações' : 'Ainda sem avaliação');
    return `<tr><td><div class="table-partner"><span class="partner-mark">${escapeHtml(p.name.slice(0,1).toUpperCase())}</span>${escapeHtml(p.name)}</div></td><td><span class="type-badge ${p.type === 'Torre' ? 'type-torre' : ''}">${escapeHtml(p.type)}</span></td><td>${escapeHtml(p.benefit || '—')}</td><td><span class="assessment">${assess}</span></td><td>${event ? `${formatDate(event.date)} · ${escapeHtml(event.name)}` : '—'}</td><td>${p.url ? `<a class="table-link" href="${escapeHtml(p.url)}" target="_blank" rel="noreferrer">Abrir ↗</a>` : ''}</td></tr>`;
  }).join('');
  document.getElementById('emptyPartners').classList.toggle('hidden', visible.length > 0);
  document.getElementById('partnerRows').parentElement.classList.toggle('hidden', visible.length === 0);
}
function updateAgenda() {
  const items = [...state.events].sort((a,b) => a.date.localeCompare(b.date));
  document.getElementById('agendaList').innerHTML = items.length ? items.map(e => `<article class="agenda-card"><div class="date-tile"><strong>${formatDate(e.date,{day:'numeric'})}</strong><span>${formatDate(e.date,{month:'short'}).replace('.','')}</span></div><div><h3>${escapeHtml(e.name)}</h3><p>${escapeHtml(partner(e.partnership_id)?.name || 'Parceria')} · ${escapeHtml(e.task || 'Sem ação descrita')}</p><p class="agenda-tasks">${eventDates(e).map(x => `${escapeHtml(x.text.split(' · ')[0])}: ${formatDate(x.date)}`).join(' · ') || 'Nenhuma ação programada'}</p></div><span class="event-tag">Evento</span></article>`).join('') : '<div class="empty-inline">Sua agenda está vazia. Adicione um evento para começar.</div>';
}
function render() { updateDashboard(); updatePartnerTable(); updateAgenda(); }
function openPartnership() { document.getElementById('partnershipForm').reset(); document.getElementById('partnershipDialog').showModal(); }
function openEvent() {
  if (!state.partnerships.length) { showToast('Cadastre uma parceria antes de adicionar um evento.'); return; }
  document.getElementById('eventPartner').innerHTML = state.partnerships.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join('');
  document.getElementById('eventForm').reset(); document.getElementById('eventDialog').showModal();
}
function navigate(view) {
  document.querySelectorAll('.content').forEach(el => el.classList.add('hidden'));
  document.getElementById(`view-${view}`).classList.remove('hidden');
  document.querySelectorAll('.nav-link').forEach(el => el.classList.toggle('active', el.dataset.view === view));
  const titles = { inicio: 'Visão geral', parcerias: 'Parcerias', agenda: 'Agenda' };
  document.getElementById('crumbCurrent').textContent = titles[view];
  document.getElementById('sidebar').classList.remove('open');
}

document.querySelectorAll('[data-view]').forEach(link => link.addEventListener('click', event => { event.preventDefault(); const view = link.dataset.view; history.replaceState(null, '', `#${view}`); navigate(view); }));
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.close).close()));
document.getElementById('newPartnership').addEventListener('click', openPartnership);
document.getElementById('newPartnership2').addEventListener('click', openPartnership);
document.getElementById('emptyNew').addEventListener('click', openPartnership);
document.getElementById('newEvent').addEventListener('click', openEvent);
document.getElementById('menuButton').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
document.getElementById('searchInput').addEventListener('input', updatePartnerTable);
document.getElementById('typeFilter').addEventListener('change', updatePartnerTable);
document.getElementById('partnershipForm').addEventListener('submit', async event => {
  event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget));
  const row = { id: crypto.randomUUID(), ...data, created_at: new Date().toISOString() };
  try { await saveCloud('parcerias', { ...row, id: undefined }); } catch (error) { showToast(error.message); return; }
  state.partnerships.push(row); persist(); render(); document.getElementById('partnershipDialog').close(); showToast('Parceria salva.');
});
document.getElementById('eventForm').addEventListener('submit', async event => {
  event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget));
  const row = { id: crypto.randomUUID(), name: data.name, date: data.date, partnership_id: data.partnership, contactDate: data.contactDate, materialsDate: data.materialsDate, task: data.task };
  try { await saveCloud('eventos', { name: row.name, data: row.date, partnership_id: row.partnership_id, data_contato: row.contactDate || null, data_materiais: row.materialsDate || null, tarefa: row.task || null }); } catch (error) { showToast(error.message); return; }
  state.events.push(row); persist(); render(); document.getElementById('eventDialog').close(); showToast('Evento adicionado à agenda.');
});

document.getElementById('todayLabel').textContent = new Intl.DateTimeFormat('pt-BR', { weekday:'short', day:'numeric', month:'short' }).format(new Date());
const date = new Date(); document.querySelector('.welcome-row .eyebrow').textContent = new Intl.DateTimeFormat('pt-BR', { weekday:'long', day:'numeric', month:'long' }).format(date).toLocaleUpperCase('pt-BR');
render();
if (location.hash === '#agenda' || location.hash === '#parcerias') navigate(location.hash.slice(1));
if (supabaseReady) readCloud().then(data => { if (data) { state = { partnerships: data.partnerships.map(p => ({...p, status:p.status || 'Ativa'})), events: data.events.map(e => ({ id:e.id, name:e.name, date:e.data, partnership_id:e.partnership_id, contactDate:e.data_contato, materialsDate:e.data_materiais, task:e.tarefa })) }; persist(); render(); } });
