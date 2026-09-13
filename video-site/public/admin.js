const TOKEN_KEY = 'admin_token';

const loginView = document.getElementById('loginView');
const adminView = document.getElementById('adminView');

function getToken() { return localStorage.getItem(TOKEN_KEY); }

document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const password = document.getElementById('password').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem(TOKEN_KEY, data.token);
    showAdmin();
  } catch (err) {
    errEl.textContent = err.message;
  }
});

function showLogin() { loginView.hidden = false; adminView.hidden = true; }
function showAdmin() { loginView.hidden = true; adminView.hidden = false; loadAdminVideos(); }

document.getElementById('uploadForm').addEventListener('submit', async e => {
  e.preventDefault();
  const errEl = document.getElementById('uploadError');
  const okEl = document.getElementById('uploadSuccess');
  const btn = document.getElementById('uploadBtn');
  const progressBar = document.getElementById('progressBar');
  errEl.textContent = ''; okEl.textContent = '';

  const formData = new FormData();
  formData.append('title', document.getElementById('title').value);
  formData.append('description', document.getElementById('description').value);
  formData.append('category', document.getElementById('category').value);
  formData.append('duration', document.getElementById('duration').value);
  formData.append('video', document.getElementById('video').files[0]);
  const thumbFile = document.getElementById('thumbnail').files[0];
  if (thumbFile) formData.append('thumbnail', thumbFile);

  btn.disabled = true;
  btn.textContent = 'Uploading...';
  progressBar.hidden = false;

  try {
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/videos');
      xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);

      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          progressBar.firstElementChild.style.width = pct + '%';
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
        else {
          let msg = 'Upload failed';
          try { msg = JSON.parse(xhr.responseText).error || msg; } catch {}
          reject(new Error(msg));
        }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(formData);
    });

    okEl.textContent = '✅ Video uploaded successfully!';
    document.getElementById('uploadForm').reset();
    progressBar.hidden = true;
    progressBar.firstElementChild.style.width = '0%';
    loadAdminVideos();
  } catch (err) {
    errEl.textContent = err.message;
    if (err.message.includes('Invalid') || err.message.includes('401')) {
      localStorage.removeItem(TOKEN_KEY);
      showLogin();
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Upload Video';
  }
});

async function loadAdminVideos() {
  const container = document.getElementById('adminVideoList');
  try {
    const res = await fetch('/api/videos');
    const videos = await res.json();

    if (!videos.length) {
      container.innerHTML = '<p style="color:#aaa">No videos uploaded yet.</p>';
      return;
    }

    container.innerHTML = videos.map(v => `
      <div class="admin-item">
        ${v.thumbnailUrl ? `<img src="${v.thumbnailUrl}" alt="">` : '<div style="width:100px;aspect-ratio:16/9;background:#000;border-radius:6px;"></div>'}
        <div class="info">
          <h3>${escapeHtml(v.title)}</h3>
          <p>${escapeHtml(v.category)} • ${v.views || 0} views • ${new Date(v.createdAt).toLocaleDateString()}</p>
        </div>
        <button class="btn btn-danger" onclick="deleteVideo('${v._id}')">Delete</button>
      </div>
    `).join('');
  } catch {
    container.innerHTML = '<p style="color:#f66">Failed to load videos.</p>';
  }
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

async function deleteVideo(id) {
  if (!confirm('Delete this video permanently?')) return;
  const res = await fetch(`/api/videos/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` },
  });
  if (res.ok) loadAdminVideos();
  else alert('Delete failed');
}

if (getToken()) showAdmin();
else showLogin();