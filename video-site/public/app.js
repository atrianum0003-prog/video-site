let allVideos = [];
let activeCat = 'All';
let query = '';

const grid = document.getElementById('videoGrid');
const playerModal = document.getElementById('playerModal');
const playerContainer = document.getElementById('playerContainer');
const playerTitle = document.getElementById('playerTitle');
const playerMeta = document.getElementById('playerMeta');
const playerDesc = document.getElementById('playerDesc');
const searchInput = document.getElementById('searchInput');

document.getElementById('year').textContent = new Date().getFullYear();

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
function initials(name = '?') {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0,2).toUpperCase();
}

function render() {
  const filtered = allVideos.filter(v => {
    const matchCat = activeCat === 'All' || v.category === activeCat;
    const q = query.toLowerCase();
    const matchQ = !q || (v.title || '').toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty"><p>No videos yet. Come back soon!</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map(v => `
    <article class="video-card" data-id="${v._id}">
      <div class="thumb">
        ${v.thumbnailUrl ? `<img src="${escapeHtml(v.thumbnailUrl)}" alt="" loading="lazy">` : ''}
        <div class="play-icon">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </div>
        ${v.duration ? `<span class="duration">${escapeHtml(v.duration)}</span>` : ''}
      </div>
      <div class="meta">
        <div class="avatar">${initials('Admin')}</div>
        <div style="min-width:0;">
          <div class="title">${escapeHtml(v.title)}</div>
          <div class="sub">${v.views || 0} views</div>
        </div>
      </div>
    </article>
  `).join('');
}

async function openPlayer(id) {
  const res = await fetch(`/api/videos/${id}`);
  if (!res.ok) return;
  const v = await res.json();

  playerContainer.innerHTML = `<video src="${escapeHtml(v.videoUrl)}" controls autoplay playsinline></video>`;
  playerTitle.textContent = v.title;
  playerMeta.textContent = `${v.category} • ${v.views} views`;
  playerDesc.textContent = v.description || '';

  playerModal.classList.add('open');
  document.body.style.overflow = 'hidden';

  const local = allVideos.find(x => x._id === id);
  if (local) local.views = (local.views || 0) + 1;
}

function closePlayer() {
  playerModal.classList.remove('open');
  playerContainer.innerHTML = '';
  document.body.style.overflow = '';
}

grid.addEventListener('click', e => {
  const card = e.target.closest('.video-card');
  if (card) openPlayer(card.dataset.id);
});
document.getElementById('closePlayer').onclick = closePlayer;
playerModal.addEventListener('click', e => { if (e.target === playerModal) closePlayer(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePlayer(); });

searchInput.addEventListener('input', e => { query = e.target.value.trim(); render(); });

document.getElementById('categories').addEventListener('click', e => {
  const btn = e.target.closest('.cat');
  if (!btn) return;
  document.querySelectorAll('.cat').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  activeCat = btn.dataset.cat;
  render();
});

async function loadVideos() {
  try {
    const res = await fetch('/api/videos');
    allVideos = await res.json();
    render();
  } catch {
    grid.innerHTML = `<div class="empty"><p>Failed to load videos.</p></div>`;
  }
}
loadVideos();