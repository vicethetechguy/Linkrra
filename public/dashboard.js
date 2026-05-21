/* ============================================================
   LINKRRA DASHBOARD — Frontend Logic v2
   Links, Shop (WhatsApp-style), Design Templates, Earn Dashboard
   ============================================================ */

const API = '';
let TOKEN = localStorage.getItem('linkrra_token');
let USER = null;
let PROFILE = null;
let LINKS = [];
let SHOP_ITEMS = [];
let BLOG_POSTS = [];
let DESIGN = null;
let currentPage = 'links';

// Plan limits for businesses
const PLAN_LIMITS = {
    starter: 3,
    pro: 5,
    business: 10
};

// ============================================================
// Business Dropdown
// ============================================================
function toggleBusinessDropdown() {
    const dropdown = document.getElementById('business-dropdown');
    const chevron = document.getElementById('business-chevron');
    if (dropdown.style.display === 'none') {
        dropdown.style.display = 'block';
        chevron.style.transform = 'rotate(180deg)';
        renderBusinessList();
    } else {
        dropdown.style.display = 'none';
        chevron.style.transform = 'rotate(0deg)';
    }
}


function renderBusinessList() {
    const listEl = document.getElementById('business-list');
    if (!listEl) return;
    
    api('/api/businesses').then(businesses => {
        const activeId = localStorage.getItem('linkrra_active_business');
        
        if (!businesses || businesses.error || !Array.isArray(businesses) || businesses.length === 0) {
            listEl.innerHTML = `<div class="empty-state" style="font-size:0.8rem;padding:1rem;">${businesses?.error || 'Add a business to get started'}</div>`;
            // Reset sidebar name if error
            const sidebarName = document.getElementById('sidebar-username');
            if (sidebarName) sidebarName.textContent = 'No Business';
            return;
        }
        
        let html = `<div class="business-list-title">Your Businesses</div>`;
        businesses.forEach(b => {
            const isActive = String(b.id) === activeId;
            html += `
                <div class="business-item ${isActive ? 'active' : ''}" onclick="switchBusiness(${b.id})">
                    <span class="business-item-name">
                        <span class="business-item-dot"></span>
                        ${esc(b.name)}
                    </span>
                </div>
            `;
        });
        listEl.innerHTML = html;
        
        // Update sidebar name if active business found
        const activeBiz = businesses.find(b => String(b.id) === activeId) || businesses[0];
        if (activeBiz) {
            const sidebarName = document.getElementById('sidebar-username');
            if (sidebarName) sidebarName.textContent = activeBiz.name;
            if (!activeId) localStorage.setItem('linkrra_active_business', String(activeBiz.id));
        }
    }).catch(err => {
        console.error('List Business Error:', err);
        listEl.innerHTML = '<div class="empty-state" style="font-size:0.8rem;padding:1rem;color:var(--error);">Failed to load businesses</div>';
    });
}

async function switchBusiness(id) {
    localStorage.setItem('linkrra_active_business', String(id));
    
    // Show loading state
    showToast(`Switching business...`);
    
    // Refresh all data for the new business
    await refreshAllData();
    
    renderBusinessList();
    renderUserInfo();
    navigateTo(currentPage); // Re-render current page with new data
}


async function refreshAllData() {
    try {
        const [profileRes, designRes, linksRes, shopRes, blogRes] = await Promise.all([
            api('/api/profile'),
            api('/api/design'),
            api('/api/links'),
            api('/api/shop'),
            api('/api/blog')
        ]);
        
        PROFILE = (profileRes && !profileRes.error) ? profileRes : null;
        DESIGN = (designRes && !designRes.error) ? designRes : null;
        LINKS = Array.isArray(linksRes) ? linksRes : [];
        SHOP_ITEMS = Array.isArray(shopRes) ? shopRes : [];
        BLOG_POSTS = Array.isArray(blogRes) ? blogRes : [];
        
        updatePreview();
    } catch (e) {
        console.error('Error refreshing data:', e);
    }
}

async function addBusiness() {
    const input = document.getElementById('new-business-name');
    const msg = document.getElementById('business-limit-msg');
    const name = input.value.trim();
    
    if (!name) {
        msg.textContent = 'Please enter a business name';
        return;
    }
    
    const plan = (USER?.plan || 'free').toLowerCase();
    const limit = PLAN_LIMITS[plan] || 1;
    
    // Fetch current businesses to check limit
    const businesses = await api('/api/businesses');
    
    if (businesses.length >= limit) {
        msg.textContent = `Maximum ${limit} businesses for ${plan} plan`;
        msg.style.color = '#ff6e84';
        return;
    }
    
    const newBiz = await api('/api/businesses', {
        method: 'POST',
        body: JSON.stringify({ name })
    });

    if (newBiz && !newBiz.error) {
        localStorage.setItem('linkrra_active_business', String(newBiz.id));
        input.value = '';
        msg.textContent = `${name} added!`;
        msg.style.color = '#4caf50';
        setTimeout(() => { msg.style.color = ''; msg.textContent = ''; }, 2000);
        
        await refreshAllData();
        renderBusinessList();
        renderUserInfo();
    } else {
        msg.textContent = newBiz.error || 'Failed to add business';
        msg.style.color = '#ff6e84';
    }
}

function initBusinessDropdown() {
    const chevron = document.getElementById('business-chevron');
    const addBtn = document.getElementById('add-business-btn');
    
    if (chevron) chevron.addEventListener('click', toggleBusinessDropdown);
    if (addBtn) addBtn.addEventListener('click', addBusiness);
}

// ============================================================
// API Helper
// ============================================================

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  
  const activeBusinessId = localStorage.getItem('linkrra_active_business');
  if (activeBusinessId) {
    headers['X-Business-Id'] = activeBusinessId;
  }
  
  try {
    const res = await fetch(`${API}${path}`, { ...options, headers });
    if (res.status === 401) {
      localStorage.removeItem('linkrra_token');
      window.location.href = '/login.html';
      return null;
    }
    
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch(e) {
      return { status: res.status, text };
    }
  } catch (err) {
    console.error('API Error:', err);
    return { error: err.message };
  }
}

// ============================================================
// Init
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  if (!TOKEN) { window.location.href = '/login.html'; return; }

  const [meRes, businesses] = await Promise.all([
    api('/api/auth/me'),
    api('/api/businesses')
  ]);
  
  USER = meRes;
  if (!USER || USER.error) {
    // Frontend fallback for dev: read mock plan from URL or localStorage
    let mp = new URL(window.location.href).searchParams.get('mock_plan');
    if (!mp) mp = localStorage.getItem('mock_plan');
    if (mp) {
      mp = mp.toLowerCase();
      USER = { plan: mp };
    } else {
      // default to free if nothing provided
      USER = { plan: 'free' };
    }
  }

  // Ensure an active business is selected
  if (Array.isArray(businesses) && businesses.length > 0) {
    if (!localStorage.getItem('linkrra_active_business')) {
      localStorage.setItem('linkrra_active_business', String(businesses[0].id));
    }
  } else if (USER && !USER.error) {
    // If no business exists (e.g. legacy account), create one
    const newBiz = await api('/api/businesses', {
      method: 'POST',
      body: JSON.stringify({ name: USER.business_name || 'My Business' })
    });
    if (newBiz && !newBiz.error) {
      localStorage.setItem('linkrra_active_business', String(newBiz.id));
    }
  }

  await refreshAllData();

  renderUserInfo();
  setupNavigation();
  initBusinessDropdown();
  updateNotificationBadge();
  navigateTo('links');
  
  // Explicitly update preview with current user plan
  updatePreview();

  // Smooth UI Reveal
  document.body.style.visibility = 'visible';
});

// Listen for token changes (e.g., after upgrade) to refresh user state and preview
window.addEventListener('storage', async (e) => {
  if (e.key === 'linkrra_token') {
    TOKEN = localStorage.getItem('linkrra_token');
    if (TOKEN) {
      USER = await api('/api/auth/me');
      renderUserInfo();
      updatePreview();
    }
  }
});

// Refresh user data when tab becomes visible again
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && TOKEN) {
    USER = await api('/api/auth/me');
    renderUserInfo();
    updatePreview();
  }
});

// ============================================================
// User Info
// ============================================================
function renderUserInfo() {
  const publicName = PROFILE?.title || USER?.business_name || USER?.email || 'User';
  document.querySelectorAll('.user-name').forEach(el => el.textContent = publicName);
  
  // sidebar-username should reflect the internal Workspace/Business name, not the public facing Title
  const sidebarName = document.getElementById('sidebar-username');
  if (sidebarName) {
    // Priority: 1. Live edit value (USER.business_name) 2. Known public title 3. Fallback
    sidebarName.textContent = USER?.business_name || publicName;
  }
  
  document.querySelectorAll('.mock-name').forEach(el => el.textContent = publicName);
  document.querySelectorAll('.mock-bio').forEach(el => el.textContent = PROFILE?.bio || 'Edit your bio in Design settings');
  
  // Also ensure renderBusinessList is called if sidebar is somehow out of sync
  // but only if we are not in the middle of a live edit
  if (!window._isLiveEditing) {
      renderBusinessList();
  }
  
  const urlText = document.querySelector('.url-text');
  if (urlText) urlText.textContent = `linkrra.com/${(PROFILE?.title || '').toLowerCase().replace(/\s+/g, '')}`;
  
  // Update avatars
  const avatarUrl = PROFILE?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e2328&color=fff&bold=true&size=128`;
  const sidebarAvatar = document.getElementById('sidebar-user-avatar');
  if (sidebarAvatar) sidebarAvatar.src = avatarUrl;
  const topnavAvatar = document.getElementById('topnav-avatar');
  if (topnavAvatar) topnavAvatar.src = avatarUrl;
}

// ============================================================
// Navigation
// ============================================================
function setupNavigation() {
  // Use event delegation on the sidebar for better reliability
  const sidebarNav = document.querySelector('.sidebar-nav');
  if (sidebarNav) {
    sidebarNav.addEventListener('click', (e) => {
      const link = e.target.closest('.nav-link');
      if (link) {
        const page = link.getAttribute('data-page');
        if (page) {
          e.preventDefault();
          navigateTo(page);
        }
      }
    });
  }
  
  // User switcher click to profile page
  const userSwitcher = document.getElementById('user-switcher');
  if (userSwitcher) {
    userSwitcher.addEventListener('click', (e) => {
      // Don't navigate if clicking on the chevron
      if (e.target.closest('.chevron')) return;
      navigateTo('profile');
    });
  }
}

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.nav-link').forEach(link => {
    const linkPage = link.getAttribute('data-page');
    link.classList.toggle('active', linkPage === page);
  });
  const pageTitle = document.querySelector('.page-title');
  const titles = { links:'Links', shop:'Shop', design:'Design', earn:'Earn', card:'Card', blog:'Blog', profile:'Profile', notifications:'Notifications', audience:'Audience', insights:'Insights', invoice:'Invoice', social_planner:'Social Planner', pricing:'Upgrade' };
  if (pageTitle) pageTitle.textContent = titles[page] || page;

  const container = document.getElementById('page-content');
  if (!container) return;

  // Clear container for fresh render
  container.innerHTML = '';

  switch (page) {
    case 'links': renderLinksPage(container); break;
    case 'shop': renderShopPage(container); break;
    case 'design': renderDesignPage(container); break;
    case 'earn': renderEarnPage(container); break;
    case 'card': renderCardPage(container); break;
    case 'blog': renderBlogPage(container); break;
    case 'profile': renderProfilePage(container); break;
    case 'notifications': renderNotificationsPage(container); break;
    case 'pricing': renderPricingPage(container); break;
    case 'audience': renderAudiencePage(container); break;
    case 'insights': renderInsightsPage(container); break;
    case 'invoice': renderInvoicePage(container); break;
    case 'social_planner': renderPlannerPage(container); break;
    case 'preview': renderPreviewPage(container); break;
    default: renderLinksPage(container);
  }
  // Remove pricing mode class when switching pages
  if (page !== 'pricing') {
    document.querySelector('.main-area')?.classList.remove('pricing-mode');
    document.querySelector('.main-header')?.classList.remove('hidden');
  }
  updatePreview();
}

// ============================================================
// 1) LINKS PAGE — Add/Edit/Delete/Toggle links
// ============================================================
function renderLinksPage(c) {
  let selectedLinkImage = null;
  
  c.className = 'page-content';
  c.innerHTML = `
    <div class="links-page">
      <div class="page-intro">
        <p class="page-desc">Add links to your Linkrra page. Your visitors will see these when they visit your profile.</p>
      </div>

      <!-- Add Link Form -->
      <div class="add-link-form" id="add-link-form" style="display:none;">
        <div class="setting-block">
          <h3 class="setting-label">Add New Link</h3>
          <div class="form-stack">
            <div class="field">
              <label>Title</label>
              <input type="text" class="kinetic-input" id="new-link-title" placeholder="e.g. My Website">
            </div>
            <div class="field">
              <label>URL</label>
              <input type="url" class="kinetic-input" id="new-link-url" placeholder="https://example.com">
            </div>
            <div class="field">
              <label>Custom Image (optional)</label>
              <input type="file" id="link-img-input" accept="image/*" style="display:none;">
              <div class="link-img-upload" id="link-img-upload">
                <div class="link-img-preview" id="link-img-preview">
                  <span class="material-symbols-outlined" style="font-size:24px;color:var(--on-surface-variant);">image</span>
                  <span style="color:var(--on-surface-variant);font-size:0.8rem;">Upload image</span>
                </div>
              </div>
            </div>
            <div class="field">
              <label>Icon (if no image)</label>
              <div class="icon-picker">
                ${['link','language','mail','call','storefront','download','play_circle','article','share','tag'].map(ic =>
                  `<label class="icon-option"><input type="radio" name="new-link-icon" value="${ic}" ${ic==='link'?'checked':''}><span class="material-symbols-outlined">${ic}</span></label>`
                ).join('')}
              </div>
            </div>
            <div class="form-actions">
              <button class="btn-kinetic" id="save-new-link">
                <span class="material-symbols-outlined" style="font-size:18px;">add_link</span> Add Link
              </button>
              <button class="btn-glass" id="cancel-new-link">Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <button class="btn-kinetic" id="show-add-link" style="margin-bottom:2rem;">
        <span class="material-symbols-outlined" style="font-size:18px;">add</span> Add New Link
      </button>

      <div class="links-list" id="links-list"></div>
    </div>
  `;

  // Link image upload
  const linkImgInput = document.getElementById('link-img-input');
  const linkImgUpload = document.getElementById('link-img-upload');
  const linkImgPreview = document.getElementById('link-img-preview');

  linkImgUpload.addEventListener('click', () => linkImgInput.click());
  
  linkImgInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      selectedLinkImage = event.target.result;
      linkImgPreview.innerHTML = `<img src="${event.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`;
    };
    reader.readAsDataURL(file);
  });

  const form = document.getElementById('add-link-form');
  const showBtn = document.getElementById('show-add-link');

  showBtn.addEventListener('click', () => {
    form.style.display = 'block';
    showBtn.style.display = 'none';
    selectedLinkImage = null;
    linkImgPreview.innerHTML = `<span class="material-symbols-outlined" style="font-size:24px;color:var(--on-surface-variant);">image</span><span style="color:var(--on-surface-variant);font-size:0.8rem;">Upload image</span>`;
    document.getElementById('new-link-title').value = '';
    document.getElementById('new-link-url').value = '';
    const saveBtn = document.getElementById('save-new-link');
    saveBtn.dataset.editId = '';
    saveBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;">add_link</span> Add Link';
    document.querySelector('#add-link-form .setting-label').textContent = 'Add New Link';
    document.getElementById('new-link-title').focus();
  });

  document.getElementById('cancel-new-link').addEventListener('click', () => {
    form.style.display = 'none';
    showBtn.style.display = '';
    selectedLinkImage = null;
    document.getElementById('save-new-link').dataset.editId = '';
  });

  document.getElementById('save-new-link').addEventListener('click', async (e) => {
    const title = document.getElementById('new-link-title').value.trim();
    const url = document.getElementById('new-link-url').value.trim();
    const icon = document.querySelector('input[name="new-link-icon"]:checked')?.value || 'link';
    if (!title) { showToast('Please enter a title'); return; }

    const editId = e.currentTarget.dataset.editId;
    let link;
    if (editId) {
      link = await api(`/api/links/${editId}`, { 
        method:'PUT', 
        body: JSON.stringify({ title, url, icon, image_url: selectedLinkImage || '' }) 
      });
      if (link && !link.error) {
        const idx = LINKS.findIndex(l => l.id == editId);
        if (idx !== -1) {
            LINKS[idx].title = title;
            LINKS[idx].url = url;
            LINKS[idx].icon = icon;
            if (selectedLinkImage) LINKS[idx].image_url = selectedLinkImage;
        }
      }
    } else {
      link = await api('/api/links', { 
        method:'POST', 
        body: JSON.stringify({ title, url, icon, image_url: selectedLinkImage || '' }) 
      });
      if (link && !link.error) LINKS.push(link);
    }

    if (link && !link.error) {
      form.style.display = 'none';
      showBtn.style.display = '';
      document.getElementById('new-link-title').value = '';
      document.getElementById('new-link-url').value = '';
      e.currentTarget.dataset.editId = '';
      e.currentTarget.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;">add_link</span> Add Link';
      document.querySelector('#add-link-form .setting-label').textContent = 'Add New Link';
      renderLinksList();
      updatePreview();
      showToast(editId ? 'Link updated!' : 'Link added!');
    }
  });

  renderLinksList();
}

function renderLinksList() {
  const list = document.getElementById('links-list');
  if (!list) return;

  if (LINKS.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <span class="material-symbols-outlined" style="font-size:56px;color:var(--primary);margin-bottom:1rem;">link_off</span>
      <h3>No links yet</h3>
      <p style="color:var(--on-surface-variant);">Click "Add New Link" above to add your first link.</p>
    </div>`;
    return;
  }

  list.innerHTML = LINKS.map(link => `
    <div class="link-swipe-container" data-id="${link.id}">
      <div class="link-swipe-actions">
        <button class="link-swipe-action-btn edit-link" data-id="${link.id}"><span class="material-symbols-outlined">edit</span></button>
        <button class="link-swipe-action-btn delete-link" data-id="${link.id}"><span class="material-symbols-outlined">delete</span></button>
      </div>
      <div class="link-swipe-content" data-id="${link.id}">
        <div class="link-drag"><span class="material-symbols-outlined">drag_indicator</span></div>
        <div class="link-icon-badge">
          ${link.image_url 
            ? `<img src="${link.image_url}" alt="${esc(link.title)}" style="width:32px;height:32px;object-fit:cover;border-radius:6px;">` 
            : `<span class="material-symbols-outlined">${esc(link.icon||'link')}</span>`}
        </div>
        <div class="link-body" style="pointer-events: none;">
          <div style="font-weight: 600; font-size: 1rem; color: var(--on-surface); margin-bottom:0.25rem;">${esc(link.title)}</div>
          <div style="font-size: 0.85rem; color: var(--on-surface-variant); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">${esc(link.url)}</div>
        </div>
        <div class="link-actions">
          <label class="toggle-switch">
            <input type="checkbox" ${link.is_active?'checked':''} data-id="${link.id}" class="link-toggle">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  `).join('');

  // Swipe logic
  let startX = 0;
  let currentX = 0;
  list.querySelectorAll('.link-swipe-content').forEach(content => {
    content.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      content.style.transition = 'none';
    }, {passive: true});
    
    content.addEventListener('touchmove', e => {
      currentX = e.touches[0].clientX;
      const diff = currentX - startX;
      if (diff < 0 && diff > -120) {
        content.style.transform = `translateX(${diff}px)`;
      }
    }, {passive: true});
    
    content.addEventListener('touchend', e => {
      content.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      const diff = currentX - startX;
      if (diff < -50) {
        content.style.transform = 'translateX(-100px)';
      } else {
        content.style.transform = 'translateX(0px)';
      }
      startX = 0; currentX = 0;
    });
    
    // Desktop hover support
    content.addEventListener('mouseenter', () => {
      content.style.transform = 'translateX(-100px)';
    });
    content.parentElement.addEventListener('mouseleave', () => {
      content.style.transform = 'translateX(0px)';
    });
  });

  // Edit Link
  list.querySelectorAll('.edit-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const link = LINKS.find(l => l.id == btn.dataset.id);
      if(!link) return;
      document.getElementById('add-link-form').style.display = 'block';
      document.getElementById('show-add-link').style.display = 'none';
      document.getElementById('new-link-title').value = link.title;
      document.getElementById('new-link-url').value = link.url;
      const saveBtn = document.getElementById('save-new-link');
      saveBtn.dataset.editId = link.id;
      saveBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;">save</span> Save Changes';
      document.querySelector('#add-link-form .setting-label').textContent = 'Edit Link';
      
      const linkImgPreview = document.getElementById('link-img-preview');
      if (link.image_url) {
        linkImgPreview.innerHTML = `<img src="${link.image_url}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`;
      } else {
        linkImgPreview.innerHTML = `<span class="material-symbols-outlined" style="font-size:24px;color:var(--on-surface-variant);">image</span><span style="color:var(--on-surface-variant);font-size:0.8rem;">Upload image</span>`;
        const iconRadio = document.querySelector(`input[name="new-link-icon"][value="${link.icon}"]`);
        if(iconRadio) iconRadio.checked = true;
      }
      window.scrollTo(0,0);
    });
  });

  // Toggle
  list.querySelectorAll('.link-toggle').forEach(toggle => {
    toggle.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      const active = e.target.checked ? 1 : 0;
      await api(`/api/links/${id}`, { method:'PUT', body: JSON.stringify({ is_active: active }) });
      const idx = LINKS.findIndex(l => l.id == id);
      if (idx !== -1) LINKS[idx].is_active = active;
      updatePreview();
    });
  });

  // Delete
  list.querySelectorAll('.delete-link').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this link?')) return;
      await api(`/api/links/${btn.dataset.id}`, { method:'DELETE' });
      LINKS = LINKS.filter(l => l.id != btn.dataset.id);
      renderLinksList();
      updatePreview();
      showToast('Link deleted');
    });
  });
}

function renderPreviewPage(c) {
  c.className = 'page-content';
  c.innerHTML = `
    <div class="preview-page" style="height: 100%; display: flex; flex-direction: column;">
      <div class="page-intro" style="margin-bottom: 1rem;">
        <h2 style="font-size: 1.25rem;">Live Preview</h2>
        <p style="color: var(--on-surface-variant); font-size: 0.9rem;">This is how your visitors see your Linkrra page.</p>
      </div>
      <div style="flex: 1; border-radius: 20px; overflow: hidden; border: 4px solid var(--surface-container); box-shadow: 0 10px 30px rgba(0,0,0,0.5); margin-bottom: 120px;">
        <iframe src="/${USER?.username || ''}" style="width: 100%; height: 100%; border: none;"></iframe>
      </div>
    </div>
  `;
}

// ============================================================
// 2) SHOP PAGE — WhatsApp Business-style catalog
// ============================================================
function renderShopPage(c) {
  let selectedProductImage = null;
  
  c.className = 'page-content';
  c.innerHTML = `
    <div class="shop-page">
      <div class="page-intro">
        <p class="page-desc">Create your product catalog. Customers can browse and order directly from your Linkrra page.</p>
      </div>

      <!-- Add Product Modal -->
      <div class="add-product-form" id="add-product-form" style="display:none;">
        <div class="setting-block">
          <h3 class="setting-label">New Product</h3>
          <div class="form-stack">
            <div class="product-img-upload" id="product-img-upload">
              <input type="file" id="product-img-input" accept="image/*" style="display:none;">
              <div class="product-img-preview" id="product-img-preview">
                <span class="material-symbols-outlined" style="font-size:40px;color:var(--on-surface-variant);">add_photo_alternate</span>
                <span style="color:var(--on-surface-variant);font-size:0.85rem;">Click to upload image</span>
              </div>
            </div>
            <div class="field">
              <label>Product Name</label>
              <input type="text" class="kinetic-input" id="new-product-name" placeholder="e.g. Premium Fade">
            </div>
            <div class="field-row">
              <div class="field" style="flex:1;">
                <label>Price (₦)</label>
                <input type="number" class="kinetic-input" id="new-product-price" placeholder="5000">
              </div>
              <div class="field" style="flex:2;">
                <label>Description</label>
                <input type="text" class="kinetic-input" id="new-product-desc" placeholder="Brief description">
              </div>
            </div>
            <div class="form-actions">
              <button class="btn-kinetic" id="save-new-product">
                <span class="material-symbols-outlined" style="font-size:18px;">add_shopping_cart</span> Add Product
              </button>
              <button class="btn-glass" id="cancel-new-product">Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <button class="btn-kinetic" id="show-add-product" style="margin-bottom:2rem;">
        <span class="material-symbols-outlined" style="font-size:18px;">add</span> Add Product
      </button>

      <div class="wa-catalog" id="wa-catalog"></div>
    </div>
  `;

  // Product image upload
  const imgInput = document.getElementById('product-img-input');
  const imgPreview = document.getElementById('product-img-preview');
  const imgUpload = document.getElementById('product-img-upload');

  imgUpload.addEventListener('click', () => imgInput.click());
  
  imgInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      selectedProductImage = event.target.result;
      imgPreview.innerHTML = `<img src="${event.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`;
    };
    reader.readAsDataURL(file);
  });

  const form = document.getElementById('add-product-form');
  const showBtn = document.getElementById('show-add-product');

  showBtn.addEventListener('click', () => { 
    form.style.display='block'; 
    showBtn.style.display='none';
    selectedProductImage = null;
    imgPreview.innerHTML = `<span class="material-symbols-outlined" style="font-size:40px;color:var(--on-surface-variant);">add_photo_alternate</span><span style="color:var(--on-surface-variant);font-size:0.85rem;">Click to upload image</span>`;
  });
  document.getElementById('cancel-new-product').addEventListener('click', () => { 
    form.style.display='none'; 
    showBtn.style.display='';
    selectedProductImage = null;
  });

  document.getElementById('save-new-product').addEventListener('click', async () => {
    const name = document.getElementById('new-product-name').value.trim();
    const price = parseFloat(document.getElementById('new-product-price').value) || 0;
    const description = document.getElementById('new-product-desc').value.trim();
    if (!name) { showToast('Enter a product name'); return; }

    try {
      const item = await api('/api/shop', { 
        method:'POST', 
        body: JSON.stringify({ name, price, description, image_url: selectedProductImage || '' }) 
      });
      console.log('Product response:', item);
      if (item && !item.error) {
        SHOP_ITEMS.push(item);
        form.style.display='none'; showBtn.style.display='';
        document.getElementById('new-product-name').value='';
        document.getElementById('new-product-price').value='';
        document.getElementById('new-product-desc').value='';
        selectedProductImage = null;
        renderCatalog();
        showToast('Product added!');
      } else {
        showToast(item?.error || 'Failed to add product');
      }
    } catch (err) {
      console.error('Error adding product:', err);
      showToast('Error adding product');
    }
  });

  renderCatalog();
}

function renderCatalog() {
  const grid = document.getElementById('wa-catalog');
  if (!grid) return;

  if (SHOP_ITEMS.length === 0) {
    grid.innerHTML = `<div class="empty-state">
      <span class="material-symbols-outlined" style="font-size:56px;color:var(--secondary);margin-bottom:1rem;">storefront</span>
      <h3>Your catalog is empty</h3>
      <p style="color:var(--on-surface-variant);">Add products to showcase them to your customers.</p>
    </div>`;
    return;
  }

  grid.innerHTML = SHOP_ITEMS.map(item => `
    <div class="wa-product-card" data-id="${item.id}">
      <div class="wa-product-img">
        ${item.image_url 
          ? `<img src="${item.image_url}" alt="${esc(item.name)}" style="width:100%;height:100%;object-fit:cover;">` 
          : `<span class="material-symbols-outlined" style="font-size:36px;color:var(--on-surface-variant);">image</span>`}
      </div>
      <div class="wa-product-info">
        <div class="wa-product-name">${esc(item.name)}</div>
        <div class="wa-product-desc">${esc(item.description || 'No description')}</div>
        <div class="wa-product-bottom">
          <div class="wa-product-price">₦${Number(item.price).toLocaleString()}</div>
          <div class="wa-product-actions">
            <label class="toggle-switch sm">
              <input type="checkbox" ${item.is_active?'checked':''} class="product-toggle" data-id="${item.id}">
              <span class="toggle-slider"></span>
            </label>
            <button class="icon-btn-sm delete-product" data-id="${item.id}">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.product-toggle').forEach(t => {
    t.addEventListener('change', async e => {
      await api(`/api/shop/${e.target.dataset.id}`, { method:'PUT', body: JSON.stringify({ is_active: e.target.checked?1:0 }) });
    });
  });

  grid.querySelectorAll('.delete-product').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this product?')) return;
      await api(`/api/shop/${btn.dataset.id}`, { method:'DELETE' });
      SHOP_ITEMS = SHOP_ITEMS.filter(i => i.id != btn.dataset.id);
      renderCatalog();
      showToast('Product deleted');
    });
  });
}

// ============================================================
// 3) DESIGN PAGE — Free & Premium Templates
// ============================================================
// ============================================================
// 3) DESIGN PAGE — Advanced Kinetic Editor
// ============================================================
const TEMPLATES = [
  { 
    id:'minimal-light', name:'Minimal Light', free:true, 
    bg:'#f4f4f4', primary:'#1a1a1a', accent:'#666', style:'outline',
    config: { bg_type: 'color', bg_color: '#f4f4f4', btn_style: 'outline', btn_radius: 8, btn_bg: 'transparent', btn_text: '#1a1a1a', font: 'Manrope', theme: 'light' }
  },
  { 
    id:'midnight', name:'Midnight Pulse', free:true, 
    bg:'#0b0f11', primary:'#bc9eff', accent:'#f98c49', style:'glass',
    config: { bg_type: 'color', bg_color: '#0b0f11', btn_style: 'glass', btn_radius: 12, btn_bg: 'rgba(255,255,255,0.05)', btn_text: '#ffffff', font: 'Space Grotesk', theme: 'dark' }
  },
  { 
    id:'ocean', name:'Ocean Drift', free:false, 
    bg:'#0a1628', primary:'#64b5f6', accent:'#4dd0e1', style:'glass',
    config: { bg_type: 'gradient', bg_gradient: 'linear-gradient(135deg, #0a1628 0%, #003366 100%)', btn_style: 'glass', btn_radius: 16, btn_bg: 'rgba(100,181,246,0.1)', btn_text: '#ffffff', font: 'Manrope', theme: 'dark' }
  },
  { 
    id:'neon', name:'Neon Tokyo', free:false, 
    bg:'#0d0015', primary:'#e040fb', accent:'#00e676', style:'glass',
    config: { bg_type: 'color', bg_color: '#0d0015', btn_style: 'glass', btn_radius: 8, btn_bg: 'rgba(224, 64, 251, 0.1)', btn_text: '#ffffff', font: 'Space Grotesk', theme: 'dark', animation: 'slide-up' }
  },
  { 
    id:'carbon', name:'Carbon Fiber', free:false, 
    bg:'#111111', primary:'#ffb300', accent:'#fff', style:'filled',
    config: { bg_type: 'color', bg_color: '#111111', btn_style: 'filled', btn_radius: 4, btn_bg: '#1a1a1a', btn_text: '#ffb300', font: 'Space Grotesk', theme: 'dark' }
  },
  { 
    id:'blush', name:'Rose Blush', free:false, 
    bg:'#fff0f5', primary:'#d81b60', accent:'#f06292', style:'filled',
    config: { bg_type: 'color', bg_color: '#fff0f5', btn_style: 'filled', btn_radius: 20, btn_bg: '#fce4ec', btn_text: '#d81b60', font: 'Manrope', theme: 'light' }
  }
];

function renderDesignPage(c) {
  c.className = 'page-content design-mode';
  
  // Parse existing settings or use defaults
  let s = {};
  try {
    s = typeof DESIGN?.settings_json === 'string' ? JSON.parse(DESIGN.settings_json || '{}') : (DESIGN?.settings_json || {});
  } catch(e) { s = {}; }

  // Default Values
  const defaults = {
    bg_type: 'color', bg_color: DESIGN?.color_bg || '#0b0f11', bg_gradient: 'linear-gradient(135deg, #0b0f11 0%, #1a1a1a 100%)',
    bg_blur: 0, bg_overlay_opacity: 0,
    avatar_shape: 'circle', avatar_size: 80, avatar_border_width: 2, avatar_border_color: '#ffffff',
    btn_style: DESIGN?.button_style || 'filled', btn_radius: 12, btn_bg: DESIGN?.color_primary || '#bc9eff', btn_text: '#ffffff',
    btn_hover_effect: 'scale', btn_alignment: 'center',
    font: DESIGN?.font || 'Space Grotesk', font_size: 16, text_color: '#ffffff',
    social_style: 'filled', social_size: 24, social_use_brand: true,
    animation: 'fade-in', branding_hide: false
  };

  const config = { ...defaults, ...s };
  
  c.innerHTML = `
    <div class="advanced-editor">
      <div class="editor-sidebar">
        <div class="editor-tabs">
          <button class="editor-tab active" data-tab="themes">
            <span class="material-symbols-outlined">palette</span> Themes
          </button>
          <button class="editor-tab" data-tab="background">
            <span class="material-symbols-outlined">wallpaper</span> Background
          </button>
          <button class="editor-tab" data-tab="profile">
            <span class="material-symbols-outlined">account_circle</span> Profile
          </button>
          <button class="editor-tab" data-tab="links">
            <span class="material-symbols-outlined">link</span> Buttons
          </button>
          <button class="editor-tab" data-tab="social">
            <span class="material-symbols-outlined">share</span> Social
          </button>
          <button class="editor-tab" data-tab="advanced">
            <span class="material-symbols-outlined">settings</span> Advanced
          </button>
        </div>
      </div>

      <div class="editor-main">
        <div class="tab-content active" id="tab-themes">
           <h3 class="setting-label">Preset Themes</h3>
           <div class="templates-grid small">
              ${TEMPLATES.map(t => `
                <div class="template-card-mini ${DESIGN?.color_primary === t.primary ? 'active' : ''}" onclick="applyTheme('${t.id}')" style="position:relative;">
                   <div class="tm-preview" style="background:${t.bg}">
                      <div class="tm-dot" style="background:${t.primary}"></div>
                      ${!t.free ? '<div style="position:absolute; top:4px; right:4px; background:var(--primary); color:#000; font-size:0.55rem; font-weight:800; padding:2px 4px; border-radius:4px;">PRO</div>' : ''}
                   </div>
                   <span>${t.name}</span>
                </div>
              `).join('')}
           </div>
        </div>

        <div class="tab-content" id="tab-background">
           <div class="setting-block">
              <label>Background Type</label>
              <select class="kinetic-input" id="bg_type">
                 <option value="color" ${config.bg_type === 'color' ? 'selected' : ''}>Solid Color</option>
                 <option value="gradient" ${config.bg_type === 'gradient' ? 'selected' : ''}>Gradient</option>
                 <option value="image" ${config.bg_type === 'image' ? 'selected' : ''}>Image</option>
              </select>
           </div>
           
           <!-- Solid Color Picker -->
           <div class="setting-block" id="bg_color_wrap" style="${config.bg_type === 'color' ? 'display:block' : 'display:none'}">
              <label>Background Color</label>
              <div class="color-picker-wrap">
                 <input type="color" id="bg_color" value="${config.bg_color}">
                 <input type="text" class="kinetic-input" id="bg_color_text" value="${config.bg_color}" readonly>
              </div>
           </div>

           <!-- Gradient Input -->
           <div class="setting-block" id="bg_gradient_wrap" style="${config.bg_type === 'gradient' ? 'display:block' : 'display:none'}">
              <label>Gradient CSS</label>
              <input type="text" class="kinetic-input" id="bg_gradient" value="${config.bg_gradient}" placeholder="linear-gradient(...)">
           </div>

           <!-- Image Upload -->
           <div class="setting-block" id="bg_image_wrap" style="${config.bg_type === 'image' ? 'display:block' : 'display:none'}">
              <label>Background Image</label>
              <input type="file" id="bg_image_input" accept="image/*" style="display:none;">
              <button class="btn-glass" onclick="document.getElementById('bg_image_input').click()" style="width:100%; justify-content:center; gap:0.5rem;">
                <span class="material-symbols-outlined">upload</span> Upload From Device
              </button>
              <div id="bg_image_preview" style="margin-top:1rem; height:80px; border-radius:12px; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; overflow:hidden; border:1px dashed var(--ghost-border);">
                ${config.bg_image ? `<img src="${config.bg_image}" style="width:100%; height:100%; object-fit:cover;">` : '<span style="opacity:0.5; font-size:0.8rem;">No image selected</span>'}
              </div>
           </div>

           <div class="setting-block">
              <label>Blur Intensity</label>
              <input type="range" id="bg_blur" min="0" max="25" value="${config.bg_blur}">
           </div>
        </div>

        <div class="tab-content" id="tab-profile">
           <div class="setting-block">
              <label>Avatar Shape</label>
              <div class="option-row" style="display:flex; gap:0.5rem;">
                 <button class="option-btn ${config.avatar_shape === 'circle' ? 'active' : ''}" data-key="avatar_shape" data-val="circle">Circle</button>
                 <button class="option-btn ${config.avatar_shape === 'rounded' ? 'active' : ''}" data-key="avatar_shape" data-val="rounded">Rounded</button>
              </div>
           </div>
           <div class="setting-block">
              <label>Avatar Size</label>
              <input type="range" id="avatar_size" min="40" max="160" value="${config.avatar_size || 80}">
           </div>
           <div class="setting-block">
              <label>Profile Font</label>
              <select class="kinetic-input" id="font">
                 <option value="Space Grotesk" ${config.font === 'Space Grotesk' ? 'selected' : ''}>Space Grotesk</option>
                 <option value="Manrope" ${config.font === 'Manrope' ? 'selected' : ''}>Manrope</option>
                 <option value="Inter" ${config.font === 'Inter' ? 'selected' : ''}>Inter</option>
              </select>
           </div>
        </div>

        <div class="tab-content" id="tab-links">
           <div class="setting-block">
              <label>Button Style</label>
              <select class="kinetic-input" id="btn_style">
                 <option value="filled" ${config.btn_style === 'filled' ? 'selected' : ''}>Filled</option>
                 <option value="outline" ${config.btn_style === 'outline' ? 'selected' : ''}>Outline</option>
                 <option value="glass" ${config.btn_style === 'glass' ? 'selected' : ''}>Glassmorphism</option>
              </select>
           </div>
           <div class="setting-block">
              <label>Corner Rounding</label>
              <input type="range" id="btn_radius" min="0" max="30" value="${config.btn_radius}">
           </div>
           <div class="setting-block">
              <label>Alignment</label>
              <div class="option-row" style="display:flex; gap:0.5rem;">
                 <button class="option-btn ${config.btn_alignment === 'left' ? 'active' : ''}" data-key="btn_alignment" data-val="left">Left</button>
                 <button class="option-btn ${config.btn_alignment === 'center' ? 'active' : ''}" data-key="btn_alignment" data-val="center">Center</button>
              </div>
           </div>
        </div>

        <div class="tab-content" id="tab-social">
           <div class="setting-block">
              <label>Icon Style</label>
              <select class="kinetic-input" id="social_style">
                 <option value="filled" ${config.social_style === 'filled' ? 'selected' : ''}>Filled Circle</option>
                 <option value="outline" ${config.social_style === 'outline' ? 'selected' : ''}>Simple Outline</option>
                 <option value="minimal" ${config.social_style === 'minimal' ? 'selected' : ''}>Minimalist</option>
              </select>
           </div>
           <div class="setting-block">
              <label>Icon Size</label>
              <input type="range" id="social_size" min="16" max="48" value="${config.social_size || 24}">
           </div>
        </div>

        <div class="tab-content" id="tab-advanced">
            <div class="setting-block">
              <label>Page Entrance Animation</label>
              <select class="kinetic-input" id="animation">
                 <option value="none" ${config.animation === 'none' ? 'selected' : ''}>None</option>
                 <option value="fade-in" ${config.animation === 'fade-in' ? 'selected' : ''}>Fade In</option>
                 <option value="slide-up" ${config.animation === 'slide-up' ? 'selected' : ''}>Slide Up</option>
              </select>
           </div>
           <div class="setting-block">
              <label class="toggle-label">
                 <input type="checkbox" id="branding_hide" ${config.branding_hide ? 'checked' : ''}>
                 <span>Hide Linkrra Branding</span>
                 ${USER?.plan === 'free' ? '<span class="pro-badge-inline" style="margin-left:auto;">PRO</span>' : ''}
              </label>
           </div>
        </div>
      </div>
      
      <div class="editor-footer" style="padding-bottom: 120px;">
         <button class="btn-glass" id="reset-design">Reset to Default</button>
         <button class="btn-kinetic" id="save-design">Save Changes</button>
      </div>
    </div>
  `;

  // Initialize tabs
  document.querySelectorAll('.editor-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.editor-tab, .tab-content').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(`tab-${btn.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });

  // Dynamic Background Fields Toggle
  const bgTypeSelect = document.getElementById('bg_type');
  bgTypeSelect.addEventListener('change', () => {
    const val = bgTypeSelect.value;
    document.getElementById('bg_color_wrap').style.display = val === 'color' ? 'block' : 'none';
    document.getElementById('bg_gradient_wrap').style.display = val === 'gradient' ? 'block' : 'none';
    document.getElementById('bg_image_wrap').style.display = val === 'image' ? 'block' : 'none';
    updateLivePreview('bg_type', val);
  });

  // Image Upload Listener
  const bgImageInput = document.getElementById('bg_image_input');
  bgImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      document.getElementById('bg_image_preview').innerHTML = `<img src="${dataUrl}" style="width:100%; height:100%; object-fit:cover;">`;
      config.bg_image = dataUrl; // Update local config
      updateLivePreview('bg_image', dataUrl);
    };
    reader.readAsDataURL(file);
  });

  // Option Buttons (Buttons/Profile)
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const val = btn.dataset.val;
      btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateLivePreview(key, val);
    });
  });

  // Listeners for Immediate Life Preview on all inputs
  const liveInputs = ['bg_color', 'bg_gradient', 'bg_blur', 'avatar_size', 'font', 'btn_style', 'btn_radius', 'social_size', 'animation', 'branding_hide'];
  liveInputs.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    // 'input' event is best for sliders and text to be "immediate"
    el.addEventListener('input', () => {
       const val = el.type === 'checkbox' ? el.checked : el.value;
       if (id === 'bg_color') document.getElementById('bg_color_text').value = val;
       updateLivePreview(id, val);
    });
  });

  // Save changes
  document.getElementById('save-design').addEventListener('click', async () => {
     const finalConfig = { ...config };
     
     // Pull all current values
     const allKeys = [...liveInputs, 'bg_type'];
     allKeys.forEach(k => {
        const el = document.getElementById(k);
        if (el) {
          finalConfig[k] = el.type === 'checkbox' ? el.checked : (el.type === 'range' ? parseInt(el.value) : el.value);
        }
     });

     try {
       DESIGN = await api('/api/design', {
          method: 'PUT',
          body: JSON.stringify({
             color_primary: DESIGN?.color_primary || '#bc9eff', // Keep primary color
             color_bg: finalConfig.bg_color,
             button_style: finalConfig.btn_style,
             settings_json: JSON.stringify(finalConfig)
          })
       });
       showToast('Design saved! Live on your profile.');
       window._editorLive = {}; // Clear overrides after save
       updatePreview();
     } catch (err) {
       showToast('Error saving design');
     }
  });
}

function updateLivePreview(key, val) {
  if (!window._editorLive) window._editorLive = {};
  window._editorLive[key] = val;
  updatePreview();
}

// Reset logic
window.resetDesign = function() {
  if (confirm('Reset design to factory defaults?')) {
    window._editorLive = {};
    renderDesignPage(document.querySelector('.page-content'));
    updatePreview();
  }
};

window.applyTheme = async function(themeId) {
  const t = TEMPLATES.find(x => x.id === themeId);
  if (!t) return;
  if (!t.free && USER?.plan === 'free') {
     showToast('Upgrade to PRO to use this theme');
     navigateTo('pricing');
     return;
  }
  
  DESIGN = await api('/api/design', {
     method: 'PUT',
     body: JSON.stringify({
        color_primary: t.primary,
        color_bg: t.bg,
        button_style: t.style,
        settings_json: JSON.stringify(t.config)
     })
  });
  
  renderDesignPage(document.querySelector('.page-content'));
  updatePreview();
  showToast(`Theme "${t.name}" applied!`);
};

function updateConfig(key, val) {
   updateLivePreview(key, val);
   // Re-render to show active button state
   const tab = document.querySelector('.editor-tab.active')?.dataset.tab;
   renderDesignPage(document.querySelector('.page-content'));
   if (tab) {
      document.querySelectorAll('.editor-tab, .tab-content').forEach(el => el.classList.remove('active'));
      document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');
   }
}

// ============================================================
// 4) EARN PAGE — Financial Dashboard
// ============================================================
function renderEarnPage(c) {
  c.className = 'page-content';

  // Mock financial data
  const totalReceived = 142500;
  const pending = 18200;
  const withdrawn = 124300;
  const available = totalReceived - withdrawn;

  c.innerHTML = `
    <div class="earn-page">
      <div class="page-intro">
        <p class="page-desc">Track your earnings and manage withdrawals from your Linkrra payments.</p>
      </div>

      <!-- Balance Overview -->
      <div class="balance-hero">
        <div class="balance-label">Available Balance</div>
        <div class="balance-amount">₦ ${available.toLocaleString()}.00</div>
        <div class="balance-actions">
          <button class="btn-kinetic" onclick="showToast('Withdrawal feature coming soon!')">
            <span class="material-symbols-outlined" style="font-size:18px;">account_balance</span> Withdraw
          </button>
          <button class="btn-glass" onclick="showToast('Transaction history coming soon!')">
            <span class="material-symbols-outlined" style="font-size:18px;">receipt_long</span> History
          </button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="earn-stats">
        <div class="earn-stat-card">
          <div class="earn-stat-icon" style="color:var(--primary);"><span class="material-symbols-outlined">arrow_downward</span></div>
          <div class="earn-stat-details">
            <div class="earn-stat-value">₦ ${totalReceived.toLocaleString()}</div>
            <div class="earn-stat-label">Total Received</div>
          </div>
        </div>
        <div class="earn-stat-card">
          <div class="earn-stat-icon" style="color:var(--secondary);"><span class="material-symbols-outlined">arrow_upward</span></div>
          <div class="earn-stat-details">
            <div class="earn-stat-value">₦ ${withdrawn.toLocaleString()}</div>
            <div class="earn-stat-label">Withdrawn</div>
          </div>
        </div>
        <div class="earn-stat-card">
          <div class="earn-stat-icon" style="color:var(--tertiary);"><span class="material-symbols-outlined">schedule</span></div>
          <div class="earn-stat-details">
            <div class="earn-stat-value">₦ ${pending.toLocaleString()}</div>
            <div class="earn-stat-label">Pending</div>
          </div>
        </div>
        <div class="earn-stat-card">
          <div class="earn-stat-icon" style="color:#81c784;"><span class="material-symbols-outlined">workspace_premium</span></div>
          <div class="earn-stat-details">
            <div class="earn-stat-value">1,425</div>
            <div class="earn-stat-label">Reward Points</div>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <h3 class="section-title" style="margin-top:3rem;">Recent Transactions</h3>
      <div class="txn-list">
        ${generateMockTransactions()}
      </div>
    </div>
  `;
}

function generateMockTransactions() {
  const txns = [
    { type:'in', name:'Amaka Obi', amount:8500, time:'2 hours ago', method:'NFC Tap' },
    { type:'in', name:'Tunde Bakare', amount:15000, time:'5 hours ago', method:'QR Code' },
    { type:'out', name:'Withdrawal to GTBank', amount:50000, time:'Yesterday', method:'Bank Transfer' },
    { type:'in', name:'Chidera Nwosu', amount:3200, time:'Yesterday', method:'Payment Link' },
    { type:'in', name:'Folake Adeyemi', amount:22000, time:'2 days ago', method:'NFC Tap' },
    { type:'in', name:'Ibrahim Musa', amount:6800, time:'3 days ago', method:'QR Code' },
    { type:'out', name:'Withdrawal to Access Bank', amount:74300, time:'5 days ago', method:'Bank Transfer' },
    { type:'in', name:'Grace Eze', amount:11000, time:'1 week ago', method:'Payment Link' },
  ];

  return txns.map(t => `
    <div class="txn-item">
      <div class="txn-icon ${t.type}">
        <span class="material-symbols-outlined">${t.type==='in'?'south_west':'north_east'}</span>
      </div>
      <div class="txn-details">
        <div class="txn-name">${t.name}</div>
        <div class="txn-meta">${t.method} · ${t.time}</div>
      </div>
      <div class="txn-amount ${t.type}">
        ${t.type==='in'?'+':'−'}₦${t.amount.toLocaleString()}
      </div>
    </div>
  `).join('');
}

// ============================================================
// CARD PAGE — Minimal & Premium NFC Card Designs
// ============================================================
const NFC_CARDS = [
  {
    id: 'matte-white', name: 'Matte White',
    bg: '#f4f4f4', textColor: '#1a1a1a', isPremium: false
  },
  {
    id: 'matte-black', name: 'Matte Black',
    bg: '#18191a', textColor: '#f4f4f4', isPremium: true
  },
  {
    id: 'brushed-metal', name: 'Brushed Metal',
    bg: 'linear-gradient(135deg, #b0bec5 0%, #90a4ae 50%, #78909c 100%)', textColor: '#ffffff', isPremium: true
  },
  {
    id: 'carbon-elite', name: 'Carbon Elite',
    bg: 'linear-gradient(145deg, #111 0%, #222 50%, #0d0d0d 100%)', textColor: '#ffb300', isPremium: true
  },
  {
    id: 'midnight-blue', name: 'Midnight Navy',
    bg: '#0a1628', textColor: '#64b5f6', isPremium: true
  },
  {
    id: 'rose-gold', name: 'Rose Gold',
    bg: 'linear-gradient(135deg, #e0bfb8 0%, #c89d91 100%)', textColor: '#333333', isPremium: true
  }
];

function renderCardPage(c) {
  c.className = 'page-content';
  c.innerHTML = `
    <div class="card-page">
      <div class="page-intro">
        <p class="page-desc">Design your NFC business card. Tap it on any NFC-enabled device to share your Linkrra page instantly.</p>
      </div>

      <!-- Card Preview Section with Flip Animation -->
      <div class="nfc-card-preview-area">
        <div class="card-flip-container" id="card-flip-container">
          <div class="card-flip-inner">
            <!-- FRONT -->
            <div class="card-face card-front" id="card-front">
              ${createCardFrontHTML(NFC_CARDS[0])}
            </div>
            <!-- BACK -->
            <div class="card-face card-back" id="card-back">
              ${createCardBackHTML(NFC_CARDS[0])}
            </div>
          </div>
        </div>
        
        <div class="card-info-bar">
          <div class="card-name-display" id="card-name-display">${NFC_CARDS[0].name}</div>
          <button class="btn-kinetic" id="order-card-btn">
            <span class="material-symbols-outlined" style="font-size:18px;">shopping_cart</span>
            Order This Card
          </button>
        </div>
        
        <p class="flip-hint">
          <span class="material-symbols-outlined" style="font-size:16px;">touch_app</span>
          Hover or tap to see back
        </p>
      </div>

      <!-- Card Designs Grid -->
      <h3 class="section-title" style="margin-top:3rem;">
        <span class="material-symbols-outlined" style="font-size:20px;color:var(--primary);">style</span>
        Choose Your Style
      </h3>
      <div class="card-designs-grid" id="card-designs-grid"></div>

      <!-- NFC Info -->
      <div class="nfc-info-card">
        <div class="nfc-info-icon">
          <span class="material-symbols-outlined">contactless</span>
        </div>
        <div class="nfc-info-content">
          <h4>How Your Card Works</h4>
          <p>Your Linkrra NFC card contains a chip that stores your unique page link. When tapped against any NFC-enabled smartphone or device, it instantly opens your Linkrra page — no app download needed.</p>
        </div>
      </div>

      <!-- Coming Soon Features -->
      <div class="card-features-preview">
        <h3 class="section-title" style="margin-top:2rem;">
          <span class="material-symbols-outlined" style="font-size:20px;color:var(--secondary);">bolt</span>
          Coming Soon
        </h3>
        <div class="feature-grid">
          <div class="feature-card">
            <span class="material-symbols-outlined">payments</span>
            <h5>Tap to Pay</h5>
            <p>Accept payments directly from your card at any NFC payment terminal</p>
          </div>
          <div class="feature-card">
            <span class="material-symbols-outlined">wifi</span>
            <h5>Share WiFi</h5>
            <p>Let customers tap to connect to your business WiFi instantly</p>
          </div>
          <div class="feature-card">
            <span class="material-symbols-outlined">qr_code</span>
            <h5>QR on Demand</h5>
            <p>Generate dynamic QR codes linked to your card anytime</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Flip animation on hover/tap
  const flipContainer = document.getElementById('card-flip-container');
  let isFlipped = false;
  
  flipContainer.addEventListener('mouseenter', () => flipContainer.classList.add('flipped'));
  flipContainer.addEventListener('mouseleave', () => flipContainer.classList.remove('flipped'));
  flipContainer.addEventListener('click', () => {
    isFlipped = !isFlipped;
    flipContainer.classList.toggle('flipped', isFlipped);
  });

  // Render card designs grid
  const grid = document.getElementById('card-designs-grid');
  NFC_CARDS.forEach((card, index) => {
    const cardEl = document.createElement('div');
    cardEl.className = `nfc-card-option ${index === 0 ? 'selected' : ''}`;
    cardEl.setAttribute('data-id', card.id);
    cardEl.innerHTML = `
      <div class="nfc-card-mini" style="background: ${card.bg}; position:relative;">
        ${card.isPremium ? '<div style="position:absolute; top:4px; right:4px; background:var(--primary); color:#000; font-size:0.5rem; font-weight:800; padding:2px 4px; border-radius:4px;">PRO</div>' : ''}
      </div>
      <div class="nfc-card-option-name">${card.name}</div>
    `;
    
    cardEl.addEventListener('click', () => {
      if (card.isPremium && USER?.plan === 'free') {
        showToast('Upgrade to PRO to access premium card materials!');
        navigateTo('pricing');
        return;
      }
      document.querySelectorAll('.nfc-card-option').forEach(el => el.classList.remove('selected'));
      cardEl.classList.add('selected');
      document.getElementById('card-front').innerHTML = createCardFrontHTML(card);
      document.getElementById('card-back').innerHTML = createCardBackHTML(card);
      document.getElementById('card-name-display').textContent = card.name;
    });
    
    grid.appendChild(cardEl);
  });

  document.getElementById('order-card-btn').addEventListener('click', () => {
    showToast('Card ordering coming soon! We\'ll notify you when available.');
  });
}

function createCardFrontHTML(card) {
  return `
    <div style="width:100%; height:100%; display:flex; padding:2.5rem; box-sizing:border-box; background:${card.bg}; color:${card.textColor}; font-family:'Space Grotesk', sans-serif; align-items:center; justify-content:space-between; position:relative; overflow:hidden;">
      <!-- Subtle texture over black/dark cards -->
      <div style="position:absolute; inset:0; opacity:0.1; background-image: radial-gradient(circle at 1px 1px, ${card.textColor} 1px, transparent 0); background-size: 10px 10px; pointer-events:none;"></div>
      
      <div style="display:flex; flex-direction:column; align-items:flex-start; height:100%; justify-content:center; gap:1rem; position:relative; z-index:2; flex:1;">
        <!-- Clean minimal QR stand-in -->
        <div style="width:50px; height:50px; padding:4px; border:2px solid ${card.textColor}; border-radius:4px; opacity:0.8; display:flex; align-items:center; justify-content:center;">
           <span class="material-symbols-outlined" style="font-size:32px;">qr_code_2</span>
        </div>
        <div style="font-size:0.65rem; font-weight:700; letter-spacing:2px; opacity:0.7;">LINKRRA.COM</div>
      </div>

      <!-- Divider -->
      <div style="width:1px; height:60%; background:${card.textColor}; opacity:0.3; margin:0 2rem; position:relative; z-index:2;"></div>

      <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-end; flex:2; height:100%; position:relative; z-index:2; text-align:right;">
        <h2 style="font-size:1.1rem; font-weight:500; letter-spacing:4px; margin:0; text-transform:uppercase;">${USER?.name || PROFILE?.title || USER?.business_name || 'WORKSPACE'}</h2>
        
        <div style="margin-top:auto; display:flex; align-items:center; gap:0.5rem;">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.9;">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M12 8v4l3 3"/>
           </svg> <!-- Abstract shield/NFC -->
           <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="opacity:0.9;">
              <path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
              <path d="M6 12m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" fill="none" stroke="currentColor" stroke-width="1.5"/>
              <path d="M18 12m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" fill="none" stroke="currentColor" stroke-width="1.5"/>
           </svg>
        </div>
      </div>
    </div>
  `;
}

function createCardBackHTML(card) {
  return `
    <div style="width:100%; height:100%; display:flex; flex-direction:column; padding:2.5rem; box-sizing:border-box; background:${card.bg}; color:${card.textColor}; font-family:'Space Grotesk', sans-serif; justify-content:space-between; position:relative; overflow:hidden;">
      <div style="position:absolute; inset:0; opacity:0.1; background-image: radial-gradient(circle at 1px 1px, ${card.textColor} 1px, transparent 0); background-size: 10px 10px; pointer-events:none;"></div>
      
      <div style="position:relative; z-index:2;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style="opacity:0.8;">
              <path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
              <path d="M6 12m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" fill="none" stroke="currentColor" stroke-width="1.5"/>
              <path d="M18 12m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" fill="none" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </div>

      <div style="text-align:center; position:relative; z-index:2;">
         <h1 style="font-size:2.4rem; font-weight:300; letter-spacing:6px; margin:0;">
           ${(PROFILE?.title || USER?.business_name || 'WORKSPACE').substring(0, 8)}<span style="font-weight:700;">*</span>
         </h1>
         <div style="font-size:0.5rem; font-weight:600; letter-spacing:4px; margin-top:0.4rem; opacity:0.6;">V I P   P R O D U C T S</div>
      </div>

      <div style="text-align:center; position:relative; z-index:2; margin-top:1rem;">
         <div style="font-size:0.8rem; font-weight:500; letter-spacing:2px; text-transform:uppercase;">${USER?.name || 'JANE DOE'}</div>
         <div style="font-size:0.5rem; font-weight:600; letter-spacing:2px; margin-top:0.25rem; opacity:0.5;">GENERAL MANAGER</div>
         <div style="font-size:0.5rem; font-weight:600; letter-spacing:3px; margin-top:0.75rem; opacity:0.7;">WWW.LINKRRA.COM</div>
      </div>
    </div>
  `;
}

// ============================================================
// PROFILE PAGE
// ============================================================
async function renderProfilePage(c) {
  c.className = 'page-content';
  
  c.innerHTML = `
    <div class="profile-page">
      <div class="page-intro" style="margin-bottom: 2rem;">
        <h2 style="font-family:'Space Grotesk'; font-size:2rem; margin-bottom:0.5rem;">Profile Settings</h2>
        <p class="page-desc">Customize how your business appears across Linkrra.</p>
      </div>

      <div class="profile-redesign-container" style="max-width: 800px;">
        <!-- Visual Asset Editor -->
        <div class="asset-editor-card kinetic-glass" style="padding: 1rem; border-radius: 24px; margin-bottom: 2rem;">
          <div class="banner-upload-box" id="banner-box" style="width:100%; height:160px; border-radius:16px; background:var(--surface-3); overflow:hidden; position:relative; cursor:pointer; border:2px dashed rgba(188,158,255,0.3);">
            <img id="banner-preview" src="${PROFILE?.banner_url || ''}" style="width:100%; height:100%; object-fit:cover; ${!PROFILE?.banner_url ? 'display:none' : ''}">
            <div class="camera-badge" style="position:absolute; bottom:1rem; right:1rem; background:rgba(20,24,28,0.8); backdrop-filter:blur(10px); color:white; padding:0.5rem 1rem; border-radius:100px; display:flex; gap:0.5rem; align-items:center; font-size:0.85rem; border:1px solid rgba(255,255,255,0.1); box-shadow:0 4px 10px rgba(0,0,0,0.3);">
              <span class="material-symbols-outlined" style="font-size:18px;">add_a_photo</span>
              <span style="font-weight:600;">Edit Cover</span>
            </div>
            ${!PROFILE?.banner_url ? `<div class="empty-banner-state" style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; opacity:0.6; color:var(--primary);"><span class="material-symbols-outlined" style="font-size:32px; margin-bottom:0.5rem;">image</span><span style="font-size:0.9rem;">Upload Banner Image</span></div>` : ''}
          </div>
          
          <div style="display:flex; justify-content:space-between; align-items:flex-end; padding:0 1.5rem; margin-top:-50px; position:relative; z-index:10;">
            <div style="position:relative;">
              <div class="avatar-upload-box" id="avatar-box" style="width:110px; height:110px; border-radius:50%; background:var(--surface-3); border:4px solid var(--surface); overflow:hidden; position:relative; cursor:pointer; box-shadow: 0 10px 30px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center;">
                <img id="avatar-preview" src="${PROFILE?.avatar_url || ''}" style="width:100%; height:100%; object-fit:cover; ${!PROFILE?.avatar_url ? 'display:none' : ''}">
                ${!PROFILE?.avatar_url ? `<div style="display:flex; flex-direction:column; align-items:center; opacity:0.8; color:var(--primary);"><span class="material-symbols-outlined" style="font-size:32px;">person</span><span style="font-size:0.6rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-top:0.25rem;">Upload</span></div>` : ''}
              </div>
              <div class="camera-badge" style="position:absolute; bottom:4px; right:0; width:34px; height:34px; background:var(--primary); color:#000; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid var(--surface); box-shadow:0 4px 12px rgba(0,0,0,0.4); pointer-events:none; z-index:20;">
                <span class="material-symbols-outlined" style="font-size:18px;">camera_alt</span>
              </div>
            </div>
          </div>
          <input type="file" id="avatar-input" accept="image/*" style="display:none;">
          <input type="file" id="banner-input" accept="image/*" style="display:none;">
        </div>

        <!-- Form Details -->
        <div class="profile-details-card kinetic-glass" style="padding: 2rem; border-radius: 24px; margin-bottom: 2rem;">
          <h3 class="setting-label" style="margin-bottom:1.5rem;">Business Details</h3>
          <div class="form-stack">
            <div class="field">
              <label>Internal Workspace Name <span style="opacity:0.6; font-weight:400; font-size:0.8rem;">(Used for sidebar tracking)</span></label>
              <input type="text" class="kinetic-input" id="profile-workspace-name" value="${esc(USER?.business_name || '')}" placeholder="Your business name">
            </div>
            <div class="field">
              <label>Linkrra Display Title <span style="opacity:0.6; font-weight:400; font-size:0.8rem;">(Shows on your public page)</span></label>
              <input type="text" class="kinetic-input" id="profile-title" value="${esc(PROFILE?.title || '')}" placeholder="e.g. Acme Studio">
            </div>
            <div class="field">
              <label>Bio / Short Description</label>
              <textarea class="kinetic-input" id="profile-bio" style="min-height:100px;" placeholder="What do you do?">${esc(PROFILE?.bio || '')}</textarea>
            </div>
          </div>
        </div>

        <!-- Referral Section -->
        <div class="referral-section kinetic-glass" style="padding:1.5rem; background:linear-gradient(135deg, rgba(188,158,255,0.05) 0%, transparent 100%); border-radius:24px; border-color:rgba(188,158,255,0.2);">
          <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
            <div class="ref-icon" style="background:rgba(188,158,255,0.1); width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; color:var(--primary);">
              <span class="material-symbols-outlined">loyalty</span>
            </div>
            <div>
              <h4 style="margin-bottom:0.25rem;">Spread the word</h4>
              <p style="font-size:0.85rem; opacity:0.7;">Earn Basic subscription by inviting friends.</p>
            </div>
          </div>
          <div class="referral-box" style="background:var(--surface); padding:0.75rem 1rem; border-radius:12px; display:flex; align-items:center; justify-content:space-between; border:1px solid var(--glass-border);">
             <code id="ref-link" style="color:var(--primary); font-weight:600; font-size:0.85rem;">linkrra.com/ref/${USER?.id || 'user'}</code>
             <button class="btn-glass btn-sm" onclick="copyRef()">Copy</button>
          </div>
        </div>

        <div class="profile-actions" style="margin-top:2rem; display:flex; justify-content:flex-end; padding-bottom:120px;">
          <button class="btn-kinetic" id="save-profile" style="padding: 1rem 3rem; font-size: 1.05rem;">Save Profile Changes</button>
        </div>
      </div>
    </div>
  `;

  // Asset Upload Logic
  const setupUpload = (boxId, inputId, previewId, key) => {
    const box = document.getElementById(boxId);
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    box.addEventListener('click', () => input.click());
    box.addEventListener('mouseenter', () => box.querySelector('.upload-overlay').style.opacity = '1');
    box.addEventListener('mouseleave', () => box.querySelector('.upload-overlay').style.opacity = '0');
    
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        preview.src = ev.target.result;
        preview.style.display = 'block';
        if (box.querySelector('.empty-banner-state')) {
          box.querySelector('.empty-banner-state').style.display = 'none';
        }
        
        // Optimistically update global profile & live preview immediately on photo select
        if (!PROFILE) PROFILE = {};
        PROFILE[key] = ev.target.result;
        renderUserInfo();
        updatePreview();
      };
      reader.readAsDataURL(file);
    });
  };

  setupUpload('avatar-box', 'avatar-input', 'avatar-preview', 'avatar_url');
  setupUpload('banner-box', 'banner-input', 'banner-preview', 'banner_url');

  // Real-time Sidebar & Preview Binding for Business Details
  const titleInput = document.getElementById('profile-title');
  const bioInput = document.getElementById('profile-bio');
  const workspaceInput = document.getElementById('profile-workspace-name');
  
  const handleLiveEdit = () => {
    window._isLiveEditing = true;
    const tempTitle = titleInput.value.trim();
    const tempBio = bioInput.value.trim();
    const tempWorkspace = workspaceInput.value.trim();
    
    // Temporarily mutate objects to force preview and sidebar re-render natively
    if (!PROFILE) PROFILE = {};
    if (!USER) USER = {};
    
    USER.business_name = tempWorkspace;
    PROFILE.title = tempTitle;
    PROFILE.bio = tempBio;
    
    renderUserInfo();
    updatePreview();
    
    // Also explicitly update the active business name in the dropdown list visually if it's there
    const activeBizId = localStorage.getItem('linkrra_active_business');
    const bizItem = document.querySelector(`.business-item[data-id="${activeBizId}"]`);
    if (bizItem) {
      const nameEl = bizItem.querySelector('.business-item-name');
      if (nameEl) nameEl.innerHTML = `<span class="business-item-dot"></span> ${tempWorkspace || 'Unnamed Business'}`;
    }
    
    // Reset live editing flag after a short delay to allow background syncs to resume
    clearTimeout(window._liveEditTimeout);
    window._liveEditTimeout = setTimeout(() => { window._isLiveEditing = false; }, 2000);
  };

  titleInput.addEventListener('input', handleLiveEdit);
  bioInput.addEventListener('input', handleLiveEdit);
  workspaceInput.addEventListener('input', handleLiveEdit);

  document.getElementById('save-profile').addEventListener('click', async () => {
    const btn = document.getElementById('save-profile');
    btn.textContent = 'Saving...';
    btn.disabled = true;

    const title = titleInput.value.trim();
    const bio = bioInput.value.trim();
    const workspaceName = workspaceInput.value.trim();
    
    const activeBizId = localStorage.getItem('linkrra_active_business');
    
    // Fire both updates in parallel (Workspace Name & Public Profile)
    const [resProfile, resBiz] = await Promise.all([
      api('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ 
          title, 
          bio, 
          avatar_url: PROFILE?.avatar_url || '', 
          banner_url: PROFILE?.banner_url || '' 
        })
      }),
      api(`/api/businesses/${activeBizId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: workspaceName })
      })
    ]);

    btn.textContent = 'Save Profile Changes';
    btn.disabled = false;

    if (resProfile && !resProfile.error) {
      PROFILE = resProfile;
      USER.business_name = workspaceName;
      showToast('Profile and business name updated!');
      renderUserInfo();
      updatePreview();
      // Refetch full user to stay completely synced
      api('/api/auth/me').then(u => { if(!u.error) USER = u; });
      api('/api/businesses').then(b => { if(Array.isArray(b)) {
        renderBusinessList(b); // re-render business list with updated name
      }});
    } else {
      showToast('Failed to save profile');
    }
  });
}

window.copyRef = () => {
  const link = document.getElementById('ref-link').textContent;
  navigator.clipboard.writeText(link);
  showToast('Referral link copied!');
};

// ===================================
// BLOG PAGE
// ===================================
function renderBlogPage(c) {
  c.className = 'page-content';
  let selectedBlogImage = null;

  c.innerHTML = `
    <div class="blog-page">
      <div class="page-intro">
        <p class="page-desc">Share updates, stories, or news with your customers directly on your Linkrra page.</p>
      </div>

      <div class="add-blog-form" id="add-blog-form" style="display:none; margin-bottom:2.5rem;">
        <div class="setting-block">
          <h3 class="setting-label">New Blog Post</h3>
          <div class="form-stack">
             <div class="field">
               <label>Title</label>
               <input type="text" class="kinetic-input" id="blog-title" placeholder="Post Title">
             </div>
             <div class="field">
               <label>Content</label>
               <textarea class="kinetic-input" id="blog-content" style="min-height:150px;" placeholder="Write something amazing..."></textarea>
             </div>
             <div class="field">
               <label>Cover Image (optional)</label>
               <input type="file" id="blog-img-input" accept="image/*" style="display:none;">
               <div class="blog-img-upload" id="blog-img-upload" style="height:120px; border:1px dashed var(--border); border-radius:12px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
                 <div id="blog-img-preview" style="text-align:center;">
                   <span class="material-symbols-outlined">image</span>
                   <p style="font-size:0.8rem; opacity:0.6;">Select Cover Image</p>
                 </div>
               </div>
             </div>
             <div class="form-actions">
               <button class="btn-kinetic" id="save-blog">Publish Post</button>
               <button class="btn-glass" id="cancel-blog">Cancel</button>
             </div>
          </div>
        </div>
      </div>

      <button class="btn-kinetic" id="show-add-blog" style="margin-bottom:2rem;">
        <span class="material-symbols-outlined">add</span> Create Post
      </button>

      <div class="blog-list" id="blog-list-container"></div>
    </div>
  `;

  const container = document.getElementById('blog-list-container');
  const form = document.getElementById('add-blog-form');
  const showBtn = document.getElementById('show-add-blog');
  const imgInput = document.getElementById('blog-img-input');
  const imgUpload = document.getElementById('blog-img-upload');
  const imgPreview = document.getElementById('blog-img-preview');

  const renderPosts = () => {
    if (BLOG_POSTS.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>No blog posts yet.</p></div>`;
      return;
    }
    container.innerHTML = BLOG_POSTS.map(post => `
      <div class="blog-card glass" style="margin-bottom:1.5rem; padding:1.5rem; border-radius:20px;">
        ${post.image_url ? `<img src="${post.image_url}" style="width:100%; height:160px; object-fit:cover; border-radius:12px; margin-bottom:1rem;">` : ''}
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <h4 style="margin-bottom:0.5rem;">${esc(post.title)}</h4>
          <button class="icon-btn-sm delete-blog" data-id="${post.id}"><span class="material-symbols-outlined">delete</span></button>
        </div>
        <p style="font-size:0.9rem; opacity:0.7; line-height:1.6;">${esc(post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content)}</p>
        <div style="font-size:0.75rem; opacity:0.4; margin-top:1rem;">${new Date(post.created_at).toLocaleDateString()}</div>
      </div>
    `).join('');

    container.querySelectorAll('.delete-blog').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this post?')) return;
        await api(`/api/blog/${btn.dataset.id}`, { method: 'DELETE' });
        BLOG_POSTS = BLOG_POSTS.filter(p => p.id != btn.dataset.id);
        renderPosts();
        updatePreview();
      });
    });
  };

  showBtn.addEventListener('click', () => { form.style.display = 'block'; showBtn.style.display = 'none'; });
  document.getElementById('cancel-blog').addEventListener('click', () => { form.style.display = 'none'; showBtn.style.display = 'block'; });

  imgUpload.addEventListener('click', () => imgInput.click());
  imgInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      selectedBlogImage = ev.target.result;
      imgPreview.innerHTML = `<img src="${ev.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:11px;">`;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('save-blog').addEventListener('click', async () => {
    const title = document.getElementById('blog-title').value.trim();
    const content = document.getElementById('blog-content').value.trim();
    if (!title || !content) { showToast('Please enter title and content'); return; }

    const post = await api('/api/blog', {
      method: 'POST',
      body: JSON.stringify({ title, content, image_url: selectedBlogImage || '' })
    });

    if (post && !post.error) {
      BLOG_POSTS.unshift(post);
      form.style.display = 'none';
      showBtn.style.display = 'block';
      renderPosts();
      updatePreview();
      showToast('Post published!');
    }
  });

  renderPosts();
}

// ============================================================
// NOTIFICATIONS PAGE
// ============================================================
function renderNotificationsPage(c) {
  c.className = 'page-content';
  c.innerHTML = `
    <div class="notifications-page">
      <div class="page-intro">
        <p class="page-desc">Stay updated on your business activity and platform news.</p>
      </div>
      
      <div class="notif-list glass" style="border-radius:24px; overflow:hidden;">
        <div class="notif-item" style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; gap:1.25rem; align-items:center;">
          <div style="background:var(--primary); color:#000; width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center;">
            <span class="material-symbols-outlined">waving_hand</span>
          </div>
          <div style="flex:1;">
            <div style="font-weight:600; margin-bottom:0.25rem;">Welcome to Linkrra!</div>
            <p style="font-size:0.85rem; opacity:0.6;">Start by adding your first business and links to your profile.</p>
          </div>
          <div style="font-size:0.75rem; opacity:0.4;">Just now</div>
        </div>
        
        <div class="notif-item" style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; gap:1.25rem; align-items:center; opacity:0.7;">
          <div style="background:var(--secondary); color:#000; width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center;">
            <span class="material-symbols-outlined">update</span>
          </div>
          <div style="flex:1;">
            <div style="font-weight:600; margin-bottom:0.25rem;">New Features: Design Editor</div>
            <p style="font-size:0.85rem; opacity:0.6;">We've updated the design editor with more customization options.</p>
          </div>
          <div style="font-size:0.75rem; opacity:0.4;">2 days ago</div>
        </div>
      </div>
    </div>
  `;
  localStorage.setItem('linkrra_notif_count', '0');
  updateNotificationBadge();
}

function updateNotificationBadge() {
  const badge = document.getElementById('notif-badge');
  const count = localStorage.getItem('linkrra_notif_count') || '1';
  if (badge) {
    badge.textContent = count;
    badge.style.display = count === '0' ? 'none' : 'flex';
  }
}

// ============================================================
// AUDIENCE PAGE
// ============================================================
function renderAudiencePage(c) {
  c.className = 'page-content';
  c.innerHTML = `
    <div class="audience-page">
      <div class="page-intro">
        <p class="page-desc">Understand who is visiting your business and how they connect.</p>
      </div>

      <div class="audience-stats-grid" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:1.5rem; margin-bottom:2.5rem;">
        <div class="stat-card glass" style="padding:1.5rem; border-radius:24px; text-align:center;">
          <h2 style="font-size:2rem; margin-bottom:0.5rem;">0</h2>
          <p style="font-size:0.85rem; opacity:0.5; text-transform:uppercase; letter-spacing:1px;">Unique Visitors</p>
        </div>
        <div class="stat-card glass" style="padding:1.5rem; border-radius:24px; text-align:center;">
          <h2 style="font-size:2rem; margin-bottom:0.5rem;">0</h2>
          <p style="font-size:0.85rem; opacity:0.5; text-transform:uppercase; letter-spacing:1px;">New Leads</p>
        </div>
        <div class="stat-card glass" style="padding:1.5rem; border-radius:24px; text-align:center;">
          <h2 style="font-size:2rem; margin-bottom:0.5rem;">0%</h2>
          <p style="font-size:0.85rem; opacity:0.5; text-transform:uppercase; letter-spacing:1px;">Engagement Rate</p>
        </div>
      </div>

      <div class="leads-list glass" style="padding:2rem; border-radius:32px; text-align:center; opacity:0.5; border:1px dashed var(--border);">
        <span class="material-symbols-outlined" style="font-size:48px; margin-bottom:1rem;">groups</span>
        <p>Visitor data will appear here as you grow.</p>
      </div>
    </div>
  `;
}

// ============================================================
// INSIGHTS PAGE
// ============================================================
function renderInsightsPage(c) {
  c.className = 'page-content';
  c.innerHTML = `
    <div class="insights-page">
      <div class="page-intro">
        <p class="page-desc">Real-time data on your profile performance and link clicks.</p>
      </div>

      <div class="chart-box glass" style="padding:2.5rem; border-radius:32px; margin-bottom:2rem; min-height:300px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
        <div class="chart-mockup" style="display:flex; align-items:flex-end; gap:0.5rem; height:100px; margin-bottom:2rem;">
          ${[40,60,30,90,50,70,40].map(h => `<div style="width:12px; height:${h}%; background:var(--primary); border-radius:4px; opacity:0.6;"></div>`).join('')}
        </div>
        <p style="opacity:0.6;">Traffic insights collecting data...</p>
      </div>

      <div class="link-stats">
        <h3 class="setting-label">Link Performance</h3>
        <div class="glass" style="border-radius:24px; padding:1.5rem; text-align:center; opacity:0.5;">
          No click data available for the last 7 days.
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// PRICING PAGE
// ============================================================
function renderPricingPage(c) {
  c.className = 'page-content pricing-mode';
  document.querySelector('.main-area')?.classList.add('pricing-mode');
  document.querySelector('.main-header')?.classList.add('hidden');

  const currentPlan = (USER?.plan || 'free').toLowerCase();

  c.innerHTML = `
    <div class="pricing-page">
      <div class="pricing-header" style="text-align:center; margin-bottom:4rem;">
        <h1 style="font-family:'Space Grotesk'; font-size:3.5rem; margin-bottom:1rem;">Level up your business.</h1>
        <p style="opacity:0.6; font-size:1.1rem;">Choose the plan that fits your ambition. Switch anytime.</p>
      </div>

      <div class="plans-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:1.5rem; max-width:1100px; margin:0 auto;">
        <!-- STARTER -->
        <div class="plan-card glass ${currentPlan === 'free' ? 'active' : ''}" style="padding:2rem; border-radius:24px; position:relative; overflow:hidden; display:flex; flex-direction:column;">
          ${currentPlan === 'free' ? '<div style="position:absolute; top:0; right:0; background:var(--border); padding:0.4rem 1rem; border-bottom-left-radius:12px; font-size:0.7rem; font-weight:700;">CURRENT</div>' : ''}
          <div class="plan-name" style="font-size:0.75rem; text-transform:uppercase; letter-spacing:2px; margin-bottom:1rem; opacity:0.6;">Starter</div>
          <div class="plan-price" style="font-size:2rem; font-family:'Space Grotesk'; margin-bottom:1.5rem; display:flex; align-items:baseline; gap:0.25rem; white-space:nowrap;">Free <span style="font-size:0.9rem; opacity:0.4;">/ Life</span></div>
          <ul class="plan-features" style="list-style:none; padding:0; margin-bottom:2.5rem; flex:1; display:flex; flex-direction:column; gap:0.75rem; font-size:0.85rem;">
            <li><span class="material-symbols-outlined" style="font-size:16px; color:var(--primary); margin-right:8px;">check_circle</span> 1 Business Profile</li>
            <li><span class="material-symbols-outlined" style="font-size:16px; color:var(--primary); margin-right:8px;">check_circle</span> Standard Templates</li>
            <li style="opacity:0.4;"><span class="material-symbols-outlined" style="font-size:16px; margin-right:8px;">cancel</span> Shop Access</li>
          </ul>
          <button class="btn-glass btn-sm" style="width:100%;" disabled>Active</button>
        </div>

        <!-- BASIC -->
        <div class="plan-card glass ${currentPlan === 'basic' ? 'active' : ''}" style="padding:2rem; border-radius:24px; position:relative; display:flex; flex-direction:column;">
          <div class="plan-name" style="font-size:0.75rem; text-transform:uppercase; letter-spacing:2px; margin-bottom:1rem; opacity:0.6;">Basic</div>
          <div class="plan-price" style="font-size:2rem; font-family:'Space Grotesk'; margin-bottom:1.5rem; display:flex; align-items:baseline; gap:0.25rem; white-space:nowrap;">4,000 <span style="font-size:0.85rem; opacity:0.4;">cNGN / Mo</span></div>
          <ul class="plan-features" style="list-style:none; padding:0; margin-bottom:2.5rem; flex:1; display:flex; flex-direction:column; gap:0.75rem; font-size:0.85rem;">
            <li><span class="material-symbols-outlined" style="font-size:16px; color:var(--primary); margin-right:8px;">check_circle</span> 3 Space Profiles</li>
            <li><span class="material-symbols-outlined" style="font-size:16px; color:var(--primary); margin-right:8px;">check_circle</span> Instant Invoicing</li>
            <li><span class="material-symbols-outlined" style="font-size:16px; color:var(--primary); margin-right:8px;">check_circle</span> Mini Shop</li>
          </ul>
          <button class="btn-glass btn-sm" style="width:100%;" onclick="selectPlan('basic', 4000)">Upgrade to Basic</button>
        </div>

        <!-- PRO -->
        <div class="plan-card glass ${currentPlan === 'pro' ? 'active' : ''}" style="padding:2rem; border-radius:24px; position:relative; border:2px solid var(--primary); display:flex; flex-direction:column;">
          <div style="position:absolute; top:-10px; left:50%; transform:translateX(-50%); background:var(--primary); color:#000; padding:2px 12px; border-radius:20px; font-size:0.65rem; font-weight:800;">POPULAR</div>
          <div class="plan-name" style="font-size:0.75rem; text-transform:uppercase; letter-spacing:2px; margin-bottom:1rem; opacity:0.6;">Pro</div>
          <div class="plan-price" style="font-size:2rem; font-family:'Space Grotesk'; margin-bottom:1.5rem; display:flex; align-items:baseline; gap:0.25rem; white-space:nowrap;">10,000 <span style="font-size:0.85rem; opacity:0.4;">cNGN / Mo</span></div>
          <ul class="plan-features" style="list-style:none; padding:0; margin-bottom:2.5rem; flex:1; display:flex; flex-direction:column; gap:0.75rem; font-size:0.85rem;">
            <li><span class="material-symbols-outlined" style="font-size:16px; color:var(--primary); margin-right:8px;">check_circle</span> 5 Space Profiles</li>
            <li><span class="material-symbols-outlined" style="font-size:16px; color:var(--primary); margin-right:8px;">check_circle</span> Full Invoicing Suite</li>
            <li><span class="material-symbols-outlined" style="font-size:16px; color:var(--primary); margin-right:8px;">check_circle</span> Global Shop</li>
            <li><span class="material-symbols-outlined" style="font-size:16px; color:var(--primary); margin-right:8px;">check_circle</span> NFC Card Access</li>
          </ul>
          <button class="btn-kinetic btn-sm" style="width:100%;" onclick="selectPlan('pro', 10000)">Upgrade to PRO</button>
        </div>

        <!-- BUSINESS -->
        <div class="plan-card glass ${currentPlan === 'business' ? 'active' : ''}" style="padding:2rem; border-radius:24px; position:relative; display:flex; flex-direction:column;">
          <div class="plan-name" style="font-size:0.75rem; text-transform:uppercase; letter-spacing:2px; margin-bottom:1rem; opacity:0.6;">Business</div>
          <div class="plan-price" style="font-size:2rem; font-family:'Space Grotesk'; margin-bottom:1.5rem; display:flex; align-items:baseline; gap:0.25rem; white-space:nowrap;">20,000 <span style="font-size:0.85rem; opacity:0.4;">cNGN / Mo</span></div>
          <ul class="plan-features" style="list-style:none; padding:0; margin-bottom:2.5rem; flex:1; display:flex; flex-direction:column; gap:0.75rem; font-size:0.85rem;">
            <li><span class="material-symbols-outlined" style="font-size:16px; color:var(--primary); margin-right:8px;">check_circle</span> 10 Space Profiles</li>
            <li><span class="material-symbols-outlined" style="font-size:16px; color:var(--primary); margin-right:8px;">check_circle</span> Priority Invoicing</li>
            <li><span class="material-symbols-outlined" style="font-size:16px; color:var(--primary); margin-right:8px;">check_circle</span> Multi-Shop Hub</li>
            <li><span class="material-symbols-outlined" style="font-size:16px; color:var(--primary); margin-right:8px;">check_circle</span> NFC Card Access</li>
          </ul>
          <button class="btn-glass btn-sm" style="width:100%;" onclick="selectPlan('business', 20000)">Get Business</button>
        </div>
      </div>

      <div style="text-align:center; margin-top:4rem;">
        <button class="btn-glass" onclick="navigateTo('links')">Back to Dashboard</button>
      </div>
    </div>
  `;
}

// ============================================================
// SOCIAL PLANNER
// ============================================================
async function renderPlannerPage(c) {
  c.className = 'page-content';
  const isPremium = USER?.plan === 'pro' || USER?.plan === 'business';
  
  c.innerHTML = `
    <div class="planner-page">
      <div class="section-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;">
        <p class="page-desc">Schedule and manage your social media content.</p>
        <button class="btn-kinetic" id="new-post-btn" ${!isPremium ? 'disabled' : ''}>
          <span class="material-symbols-outlined">add</span> Schedule Post
        </button>
      </div>

      ${!isPremium ? `
        <div class="pro-upgrade-banner" style="background:var(--surface-2);padding:1.5rem;border-radius:16px;border:1px solid var(--primary);margin-bottom:2rem;display:flex;align-items:center;gap:1.5rem;">
          <div class="pro-icon" style="background:var(--primary);color:var(--bg);width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;">
             <span class="material-symbols-outlined">bolt</span>
          </div>
          <div style="flex:1;">
             <h4 style="margin-bottom:0.25rem;">Unlock the Social Planner</h4>
             <p style="font-size:0.85rem;opacity:0.7;">Upgrade to PRO to schedule posts across Instagram, Twitter, and more.</p>
          </div>
          <button class="btn-primary btn-sm" onclick="navigateTo('pricing')">Upgrade Now</button>
        </div>
      ` : ''}

      <div class="posts-list" id="planner-posts-list">
        <div class="loading-state" style="text-align:center;padding:3rem;">
           <span class="material-symbols-outlined rotating" style="font-size:40px;color:var(--primary);">sync</span>
           <p>Loading your schedule...</p>
        </div>
      </div>
    </div>
  `;

  try {
    const list = document.getElementById('planner-posts-list');
    const posts = await api('/api/social/posts');

    if (!posts || posts.length === 0) {
      list.innerHTML = `
        <div class="empty-state" style="padding:4rem 2rem;text-align:center;opacity:0.5;">
          <span class="material-symbols-outlined" style="font-size:60px;">calendar_month</span>
          <h3>No posts scheduled</h3>
          <p>Your calendar is looking a bit empty.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = `
      <div class="posts-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(300px, 1fr));gap:1.5rem;">
        ${posts.map(p => `
          <div class="social-post-card" style="background:var(--surface-2);border-radius:16px;overflow:hidden;border:1px solid var(--border);">
            <div class="post-header" style="padding:1rem;display:flex;justify-content:space-between;border-bottom:1px solid var(--border);">
               <span class="platform-tag" style="text-transform:capitalize;font-size:0.75rem;font-weight:700;">${p.platform}</span>
               <span class="status-tag ${p.status}" style="font-size:0.75rem;opacity:0.7;">${p.status}</span>
            </div>
            <div class="post-body" style="padding:1rem;">
               <p style="font-size:0.9rem;line-height:1.5;margin-bottom:1rem;">${esc(p.content)}</p>
               <div style="font-size:0.75rem;opacity:0.5;display:flex;align-items:center;gap:0.5rem;">
                  <span class="material-symbols-outlined" style="font-size:14px;">schedule</span>
                  ${p.scheduled_for ? new Date(p.scheduled_for).toLocaleString() : 'Not scheduled'}
               </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

  } catch (err) {
     console.error('Failed to load social posts:', err);
  }
}

function renderInvoicePage(c) {
  const plan = (USER?.plan || 'free').toLowerCase();

  // Access check: Only starter (Basic), pro, and business accounts are allowed
  if (['starter', 'pro', 'business'].includes(plan)) {
    window.location.href = '/invoice.html';
    return;
  }

  c.className = 'page-content';
  c.innerHTML = `
    <div class="invoice-placeholder-page" style="text-align:center; padding:4rem 2rem;">
      <div class="kinetic-glass" style="max-width:500px; margin:0 auto; padding:3rem; border-radius:32px; border:1px solid var(--border);">
        <span class="material-symbols-outlined" style="font-size:64px; color:var(--primary); margin-bottom:1.5rem;">lock</span>
        <h2 style="font-family:'Space Grotesk'; margin-bottom:1rem;">Premium Feature</h2>
        <p style="opacity:0.7; line-height:1.6; margin-bottom:2rem;">The Invoicing module is only available to Basic, PRO, and Business accounts. Upgrade your plan to create, send, and track professional invoices.</p>
        <button class="btn-kinetic" style="width:100%;" onclick="navigateTo('pricing')">Upgrade Plan</button>
      </div>
    </div>
  `;
}

// ============================================================
// LIVE PREVIEW
// ============================================================
function updatePreview() {
  const mockName = document.querySelector('.mock-name');
  const mockBio = document.querySelector('.mock-bio');
  const mockLinks = document.querySelector('.mock-links');
  const mockShopSection = document.querySelector('.mock-shop-section');
  const mockShopGrid = document.querySelector('.mock-shop-grid');
  const mockBlogSection = document.querySelector('.mock-blog-section');
  const mockBlogGrid = document.querySelector('.mock-blog-grid');
  const mockAvatar = document.querySelector('.mock-avatar');
  const mockBanner = document.querySelector('.mock-banner');
  const mockPage = document.querySelector('.mock-page');
  const deviceScreen = document.querySelector('.device-screen');
  
  // Parse Settings
  let s = {};
  try {
    const settingsRaw = DESIGN?.settings_json;
    s = typeof settingsRaw === 'string' ? JSON.parse(settingsRaw || '{}') : (settingsRaw || {});
  } catch(e) { s = {}; }

  // Clear existing preview content to prevent "ghosting" from previous business
  if (mockLinks) mockLinks.innerHTML = '';
  if (mockShopGrid) mockShopGrid.innerHTML = '';
  if (mockBlogGrid) mockBlogGrid.innerHTML = '';

  // Apply Live Overrides from Editor (crucial for "immediate" feel)
  const config = { ...s, ...(window._editorLive || {}) };

  // Apply Background Logic
  if (mockPage && deviceScreen) {
    let finalBg = config.bg_color || DESIGN?.color_bg || '#0b0f11';
    
    if (config.bg_type === 'gradient') {
      finalBg = config.bg_gradient || 'linear-gradient(135deg, #0b0f11 0%, #1a1a1a 100%)';
    } else if (config.bg_type === 'image' && config.bg_image) {
      finalBg = `url(${config.bg_image})`;
    }

    [mockPage, deviceScreen].forEach(el => {
      el.style.background = finalBg;
      if (config.bg_type === 'image') {
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
      } else {
        el.style.backgroundSize = 'auto';
      }
      el.style.backdropFilter = `blur(${config.bg_blur || 0}px)`;
    });
  }

  // Apply Typography
  if (mockPage) {
    mockPage.style.fontFamily = `'${config.font || 'Space Grotesk'}', sans-serif`;
    mockPage.style.color = config.text_color || '#ffffff';
  }

  // Apply Avatar Styles
  if (mockAvatar) {
    const avatarName = PROFILE?.title || USER?.business_name || 'U';
    mockAvatar.src = PROFILE?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=1e2328&color=fff&bold=true&size=200`;
    mockAvatar.style.borderRadius = config.avatar_shape === 'circle' ? '50%' : '16px';
    const size = config.avatar_size || 80;
    mockAvatar.style.width = `${size}px`;
    mockAvatar.style.height = `${size}px`;
  }

  // Update banner
  if (mockBanner) {
    if (PROFILE?.banner_url) {
      mockBanner.style.backgroundImage = `url(${PROFILE.banner_url})`;
      mockBanner.style.backgroundSize = 'cover';
      mockBanner.style.backgroundPosition = 'center';
    } else {
      mockBanner.style.backgroundImage = 'none';
      mockBanner.style.background = 'linear-gradient(135deg, #1e2328 0%, #0b0f11 100%)';
    }
  }
  
  if (mockName) mockName.textContent = PROFILE?.title || USER?.business_name || 'Username';
  if (mockBio) mockBio.textContent = PROFILE?.bio || '';
  
  // Update links preview with advanced styling
  if (mockLinks) {
    const active = LINKS.filter(l => l.is_active);
    if (active.length > 0) {
      mockLinks.innerHTML = active.map(l => {
        const btnRadius = config.btn_radius !== undefined ? config.btn_radius : 12;
        const btnStyle = config.btn_style || 'filled';
        const alignment = config.btn_alignment || 'center';
        const primaryColor = DESIGN?.color_primary || 'var(--primary)';

        let inlineStyle = `border-radius:${btnRadius}px; justify-content:${alignment};`;
        if (btnStyle === 'filled') {
           inlineStyle += `background:${primaryColor}; color:#000; border:none;`;
        } else if (btnStyle === 'outline') {
           inlineStyle += `background:transparent; border:2px solid ${primaryColor}; color:var(--on-surface);`;
        } else if (btnStyle === 'glass') {
           inlineStyle += `background:rgba(255,255,255,0.08); backdrop-filter:blur(10px); color:var(--on-surface); border:1px solid rgba(255,255,255,0.1);`;
        }

        if (l.image_url) {
          return `<div class="mock-card ${btnStyle}" style="${inlineStyle} padding:0.5rem; gap:1rem; display:flex; align-items:center;">
            <img src="${l.image_url}" alt="${esc(l.title)}" style="width:36px; height:36px; border-radius:6px; object-fit:cover;">
            <span style="font-weight:600;">${esc(l.title)}</span>
          </div>`;
        }
        return `<div class="mock-card ${btnStyle}" style="${inlineStyle} display:flex; align-items:center; gap:0.75rem; padding:0.85rem 1rem;">
          <span class="material-symbols-outlined" style="font-size:20px;">${l.icon||'link'}</span>
          <span style="font-weight:600;">${esc(l.title)}</span>
        </div>`;
      }).join('');
    } else {
      mockLinks.innerHTML = `<div class="mock-card glass" style="text-align:center;color:var(--on-surface-variant);font-size:0.85rem;">No active links</div>`;
    }
  }
  
  // Update shop preview
  if (mockShopSection && mockShopGrid) {
    const activeShopItems = SHOP_ITEMS.filter(i => i.is_active);
    if (activeShopItems.length > 0) {
      mockShopSection.style.display = 'block';
      mockShopGrid.innerHTML = activeShopItems.slice(0, 4).map(item => `
        <div class="mock-product-card" style="border-radius: ${config.btn_radius || 12}px">
          ${item.image_url 
            ? `<img src="${item.image_url}" alt="${esc(item.name)}" class="mock-product-img">` 
            : `<div class="mock-product-placeholder"><span class="material-symbols-outlined" style="font-size:24px;color:var(--on-surface-variant);">image</span></div>`}
          <div class="mock-product-name">${esc(item.name)}</div>
          <div class="mock-product-price">₦${Number(item.price).toLocaleString()}</div>
        </div>
      `).join('');
    } else {
      mockShopSection.style.display = 'none';
    }
  }
  
  // Update branding visibility
  const mockFooter = document.getElementById('mock-footer');
  if (mockFooter) {
    const canHide = USER?.plan === 'pro' || USER?.plan === 'business';
    const hideNow = canHide && config.branding_hide;
    mockFooter.classList.toggle('hidden', !!hideNow);
  }
  
  // Update verified badge color based on plan
  const mockVerified = document.querySelector('.mock-verified');
  const plan = (USER?.plan || 'free').toLowerCase();
  
  if (mockVerified) {
    if (plan === 'pro') {
      mockVerified.style.display = 'flex';
      mockVerified.style.background = '#1da1f2'; 
    } else if (plan === 'business') {
      mockVerified.style.display = 'flex';
      mockVerified.style.background = '#f5d300';
    } else {
      mockVerified.style.display = 'none';
    }
  }
}

// ============================================================
// TOAST & UTILS
// ============================================================
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) { toast = document.createElement('div'); toast.id='toast'; document.body.appendChild(toast); }
  toast.textContent = msg;
  toast.className = 'toast show';
  setTimeout(() => toast.className = 'toast', 2500);
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Alias for navigation
function navigateToPage(page) {
  navigateTo(page);
}

// Global Log Out function
window.logout = function() {
  localStorage.removeItem('linkrra_token');
  localStorage.removeItem('linkrra_active_business');
  window.location.href = '/login.html';
};
