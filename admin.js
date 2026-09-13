/**
 * EvenTiamo — Organizer Admin Console Controller
 * Features:
 * - Role-Based Separate Admin Authentication (Email & Password + Security Settings)
 * - Complete Event CRUD Controls (Add, Edit, Delete, Toggle Status)
 * - Safe Chart.js Instance Lifecycle
 * - Attendee Directory & Verification
 * - Digital Certificate of Participation Generator
 * - CSV Export
 */

const ADMIN_API_URL = "https://script.google.com/macros/s/AKfycbx522tu-XcrE1Nv9aYGlQUhHnip27oYCHPUTiSqpT3-SUCAuiNDfejAxW9W2WsbnKUrDw/exec";

let tableData = [];
let chartInstances = {
  pie: null,
  bar: null
};

// ==========================================
// 1. AUTHENTICATION & SESSIONS
// ==========================================
function checkAuthSession() {
  const isAuth = AuthManager.isAdminLoggedIn();
  const loginBox = document.getElementById("loginBox");
  const dashboard = document.getElementById("dashboard");
  const logoutBtn = document.getElementById("logoutBtn");

  if (isAuth) {
    if (loginBox) loginBox.style.display = "none";
    if (dashboard) dashboard.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "inline-flex";

    // Populate security settings
    const creds = AuthManager.getAdminCredentials();
    const emailField = document.getElementById("newAdminEmail");
    const pinField = document.getElementById("newAdminPin");
    if (emailField) emailField.value = creds.email || "admin@eventiamo.com";
    if (pinField) pinField.value = creds.pin || "9999";

    loadAllData();
    renderEventsCrudTable();
    populateEventFilterDropdown();
  } else {
    if (loginBox) loginBox.style.display = "block";
    if (dashboard) dashboard.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
}

function handleLoginSubmit(e) {
  if (e) e.preventDefault();
  const emailOrId = document.getElementById("adminEmailInput").value.trim();
  const password = document.getElementById("adminPasswordInput").value.trim();
  const errEl = document.getElementById("loginError");

  const result = AuthManager.login(emailOrId, password);

  if (result.success) {
    if (errEl) errEl.style.display = "none";
    checkAuthSession();
    showToast("🔓 Authenticated as Organizer Admin.");
  } else {
    if (errEl) {
      errEl.textContent = `❌ ${result.error}`;
      errEl.style.display = "block";
    }
  }
}

function quickDemoLogin() {
  const creds = AuthManager.getAdminCredentials();
  const emailInput = document.getElementById("adminEmailInput");
  const passInput = document.getElementById("adminPasswordInput");
  if (emailInput) emailInput.value = creds.email || "admin@eventiamo.com";
  if (passInput) passInput.value = creds.password || "Admin@123";
  handleLoginSubmit();
}

function logoutAdmin() {
  AuthManager.logout();
  checkAuthSession();
  showToast("🔒 Signed out of admin console.");
}

function handleUpdateAdminCreds(e) {
  e.preventDefault();
  const email = document.getElementById("newAdminEmail").value;
  const password = document.getElementById("newAdminPassword").value;
  const pin = document.getElementById("newAdminPin").value;
  const msgEl = document.getElementById("securityMsg");

  AuthManager.updateAdminCredentials(email, password, pin);

  if (msgEl) {
    msgEl.className = "form-note success";
    msgEl.textContent = "✅ Admin security credentials updated successfully!";
    msgEl.style.display = "block";
  }
  showToast("🔐 Admin credentials updated.");
}

// ==========================================
// 2. TABBED NAVIGATION
// ==========================================
function switchTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));

  const activeBtn = Array.from(document.querySelectorAll(".tab-btn")).find(b => b.getAttribute("onclick").includes(tabId));
  const activeContent = document.getElementById(`tab-${tabId}`);

  if (activeBtn) activeBtn.classList.add("active");
  if (activeContent) activeContent.classList.add("active");

  if (tabId === "events") renderEventsCrudTable();
  if (tabId === "analytics") {
    renderKPIs(tableData);
    renderCharts(tableData);
    renderEventSummary(tableData);
  }
}



let currentEventStatusFilter = 'all';
let currentPreviewEventId = null;

// ==========================================
// 3. EVENT CRUD & LIFECYCLE CONTROLLER
// ==========================================
// Brochure Upload State Cache
let newEventUploadedBrochureData = null;
let editEventUploadedBrochureData = null;

function filterEventsByStatus(status) {
  currentEventStatusFilter = status;
  document.querySelectorAll('.event-status-tabs .filter-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`btn-status-${status}`);
  if (activeBtn) activeBtn.classList.add('active');
  renderEventsCrudTable();
}

function handleNewEventBrochureUpload(e) {
  const file = e.target.files && e.target.files[0];
  const badge = document.getElementById("newEventBrochureFileBadge");
  if (!file) return;

  if (file.size > 15 * 1024 * 1024) {
    alert("File size exceeds 15MB limit. Please upload a smaller PDF or document.");
    e.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    newEventUploadedBrochureData = evt.target.result;
    if (badge) {
      badge.style.display = "block";
      badge.textContent = `✓ Loaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    }
    const nameInput = document.getElementById("newEventBrochureName");
    if (nameInput && !nameInput.value) {
      nameInput.value = file.name;
    }
    showToast(`📄 Brochure "${file.name}" attached successfully!`);
  };
  reader.readAsDataURL(file);
}

function handleEditEventBrochureUpload(e) {
  const file = e.target.files && e.target.files[0];
  const badge = document.getElementById("editEventBrochureFileBadge");
  const statusBadge = document.getElementById("editEventBrochureStatusBadge");
  if (!file) return;

  if (file.size > 15 * 1024 * 1024) {
    alert("File size exceeds 15MB limit. Please upload a smaller PDF or document.");
    e.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    editEventUploadedBrochureData = evt.target.result;
    if (badge) {
      badge.style.display = "block";
      badge.textContent = `✓ New File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    }
    if (statusBadge) {
      statusBadge.style.background = "rgba(16, 185, 129, 0.2)";
      statusBadge.style.color = "#34d399";
      statusBadge.textContent = "New Custom File Selected";
    }
    const nameInput = document.getElementById("editEventBrochureName");
    if (nameInput) {
      nameInput.value = file.name;
    }
    showToast(`📄 New brochure "${file.name}" ready to save!`);
  };
  reader.readAsDataURL(file);
}

function testDownloadEditBrochure() {
  const eventId = document.getElementById("editEventId").value;
  if (!eventId) return;
  if (editEventUploadedBrochureData) {
    const a = document.createElement("a");
    a.href = editEventUploadedBrochureData;
    a.download = document.getElementById("editEventBrochureName").value || "Event_Brochure.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast("📄 Downloading newly selected brochure file...");
    return;
  }
  EventManager.downloadBrochure(eventId);
}

function clearEditBrochureAttachment() {
  editEventUploadedBrochureData = "";
  const urlInput = document.getElementById("editEventBrochureUrl");
  const fileInput = document.getElementById("editEventBrochureFile");
  const badge = document.getElementById("editEventBrochureFileBadge");
  const statusBadge = document.getElementById("editEventBrochureStatusBadge");

  if (urlInput) urlInput.value = "";
  if (fileInput) fileInput.value = "";
  if (badge) badge.style.display = "none";
  if (statusBadge) {
    statusBadge.style.background = "rgba(255,255,255,0.08)";
    statusBadge.style.color = "#ccc";
    statusBadge.textContent = "Default Branded Template";
  }
  showToast("Custom brochure cleared. Event will use official branded printable brochure.");
}

function renderEventsCrudTable() {
  const tbody = document.getElementById("eventsCrudTableBody");
  if (!tbody) return;

  const allEvents = EventManager.getAll();
  tbody.innerHTML = "";

  // Update Status Filter Badges
  const countAll = allEvents.filter(ev => ev.status !== "Archived").length;
  const countPublished = allEvents.filter(ev => (ev.status === "Open" || !ev.status) && !EventManager.isEventOver(ev)).length;
  const countDraft = allEvents.filter(ev => ev.status === "Draft").length;
  const countScheduled = allEvents.filter(ev => ev.status === "Scheduled").length;
  const countCancelled = allEvents.filter(ev => ev.status === "Cancelled").length;
  const countArchived = allEvents.filter(ev => ev.status === "Archived").length;

  const elAll = document.getElementById("count-all");
  if (elAll) elAll.textContent = countAll;
  const elPub = document.getElementById("count-published");
  if (elPub) elPub.textContent = countPublished;
  const elDraft = document.getElementById("count-draft");
  if (elDraft) elDraft.textContent = countDraft;
  const elSched = document.getElementById("count-scheduled");
  if (elSched) elSched.textContent = countScheduled;
  const elCanc = document.getElementById("count-cancelled");
  if (elCanc) elCanc.textContent = countCancelled;
  const elArch = document.getElementById("count-archived");
  if (elArch) elArch.textContent = countArchived;

  // Filter events based on active tab
  let filteredEvents = allEvents;
  if (currentEventStatusFilter === 'published') {
    filteredEvents = allEvents.filter(ev => (ev.status === "Open" || !ev.status) && !EventManager.isEventOver(ev));
  } else if (currentEventStatusFilter === 'draft') {
    filteredEvents = allEvents.filter(ev => ev.status === "Draft");
  } else if (currentEventStatusFilter === 'scheduled') {
    filteredEvents = allEvents.filter(ev => ev.status === "Scheduled");
  } else if (currentEventStatusFilter === 'cancelled') {
    filteredEvents = allEvents.filter(ev => ev.status === "Cancelled");
  } else if (currentEventStatusFilter === 'archived') {
    filteredEvents = allEvents.filter(ev => ev.status === "Archived");
  } else {
    // 'all' tab shows all events except archived
    filteredEvents = allEvents.filter(ev => ev.status !== "Archived");
  }

  if (!filteredEvents.length) {
    const msg = currentEventStatusFilter === 'all' 
      ? `No campus events registered. Click "➕ Create New Event" to add one.` 
      : `No events currently in "${currentEventStatusFilter}" status.`;
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:28px;color:var(--text-muted);">${msg}</td></tr>`;
    return;
  }

  filteredEvents.forEach(ev => {
    const stats = EventManager.getStats(ev.id);
    const ratingObj = FeedbackManager.calculateEventRating(ev.id);
    const isOver = EventManager.isEventOver(ev);

    // Status Badge Generation
    let statusPill = "";
    if (ev.status === "Archived") {
      statusPill = `<span class="admin-badge-pending" style="background:rgba(147,51,234,0.15);color:#c084fc;border-color:rgba(147,51,234,0.3);">📦 Archived</span>`;
    } else if (ev.status === "Cancelled") {
      statusPill = `<span class="admin-badge-pending" style="background:rgba(239,68,68,0.15);color:#f87171;border-color:rgba(239,68,68,0.3);">🚫 Cancelled</span>`;
    } else if (ev.status === "Scheduled") {
      const schedTime = ev.scheduledPublishDate ? new Date(ev.scheduledPublishDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
      statusPill = `<span class="admin-badge-pending" style="background:rgba(59,130,246,0.15);color:#60a5fa;border-color:rgba(59,130,246,0.3);" title="Goes live: ${ev.scheduledPublishDate || 'Scheduled'}">⏰ Sched${schedTime ? '<br><small>' + schedTime + '</small>' : ''}</span>`;
    } else if (ev.status === "Draft") {
      statusPill = `<span class="admin-badge-pending" style="background:rgba(251,146,60,0.15);color:#fb923c;border-color:rgba(251,146,60,0.3);">📝 Draft</span>`;
    } else if (isOver) {
      statusPill = `<span class="admin-badge-checked" style="background:rgba(56,189,248,0.15);color:#38bdf8;border-color:rgba(56,189,248,0.3);">🏆 Completed</span>`;
    } else if (stats.booked >= ev.capacity) {
      statusPill = `<span class="admin-badge-pending" style="background:rgba(239,68,68,0.15);color:#f87171;border-color:rgba(239,68,68,0.3);">🔴 Sold Out</span>`;
    } else {
      statusPill = `<span class="admin-badge-checked">🟢 Published</span>`;
    }

    const hasCustomBrochure = Boolean(ev.brochureUrl && ev.brochureUrl.length > 0);
    const brochureBtn = hasCustomBrochure
      ? `<button class="action-btn btn-action-cert" onclick="EventManager.downloadBrochure('${ev.id}')" title="Download Custom Brochure: ${ev.brochureName || 'PDF'}">📄 Custom PDF</button>`
      : `<button class="action-btn btn-action-resend" onclick="EventManager.downloadBrochure('${ev.id}')" title="Download Branded Generated Brochure">📄 Branded Doc</button>`;

    const isDraftOrScheduled = ev.status === "Draft" || ev.status === "Scheduled";
    const isArchived = ev.status === "Archived";
    const isCancelled = ev.status === "Cancelled";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <strong style="color:#fff;font-size:0.95rem;">${ev.title}</strong>
        <span style="display:block;font-size:0.75rem;color:var(--text-muted);">${ev.dept || 'Department'}</span>
      </td>
      <td><span class="pill" style="font-size:0.75rem;">${ev.category || 'General'}</span></td>
      <td>${ev.dateFormatted || ev.date}<br><span class="small-muted">${ev.time}</span></td>
      <td>${ev.venue}</td>
      <td>
        <strong>${stats.booked} / ${ev.capacity}</strong>
        <span class="small-muted">(${stats.pct}%)</span>
      </td>
      <td>
        <span class="pill pill-rating" style="font-size:0.75rem;padding:3px 8px;cursor:pointer;" onclick="openFeedbackModal('${ev.id}')" title="Click to view participant feedback">
          ⭐ ${ratingObj.avgFormatted} (${ratingObj.totalReviews})
        </span>
      </td>
      <td>${brochureBtn}</td>
      <td>${statusPill}</td>
      <td style="white-space:nowrap;">
        <button class="action-btn btn-action-preview" onclick="showAdminEventPreview('${ev.id}')" title="Live Responsive Preview">👁️ Preview</button>
        <button class="action-btn btn-action-edit" onclick="openEditEventModal('${ev.id}')" title="Edit Event Details">✏️ Edit</button>
        <button class="action-btn btn-action-clone" onclick="handleDuplicateEvent('${ev.id}')" title="Clone / Duplicate as New Draft">📋 Clone</button>
        ${isDraftOrScheduled 
          ? `<button class="action-btn btn-action-publish" onclick="handleTogglePublish('${ev.id}')" title="Publish Live Now">🚀 Publish</button>`
          : (ev.status === "Open" ? `<button class="action-btn btn-action-draft" onclick="handleTogglePublish('${ev.id}')" title="Set to Draft (Hide from students)">📝 Draft</button>` : '')
        }
        ${isArchived
          ? `<button class="action-btn btn-action-publish" onclick="handleToggleArchive('${ev.id}')" title="Restore Event from Archive">📤 Restore</button>`
          : `<button class="action-btn btn-action-archive" onclick="handleToggleArchive('${ev.id}')" title="Archive Event">📦 Archive</button>`
        }
        ${(!isCancelled && !isOver && !isArchived)
          ? `<button class="action-btn btn-action-cancel" onclick="handleCancelEvent('${ev.id}')" title="Cancel Event">🚫 Cancel</button>`
          : ''
        }
        <button class="action-btn btn-action-cert" onclick="openFeedbackModal('${ev.id}')" title="View Student Reviews">💬 Reviews</button>
        <button class="action-btn btn-action-del" onclick="handleDeleteEvent('${ev.id}')" title="Delete Permanently">🗑️ Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openFeedbackModal(eventId) {
  const event = EventManager.getById(eventId);
  if (!event) return;

  const feedbacks = FeedbackManager.getEventFeedbacks(eventId);
  const ratingObj = FeedbackManager.calculateEventRating(eventId);

  document.getElementById("feedbackModalEventTitle").textContent = `${event.title} — Feedback & Reviews`;
  document.getElementById("feedbackModalRatingSummary").textContent = `Overall Average Score: ⭐ ${ratingObj.avgFormatted} / 5.0 (${ratingObj.totalReviews} student submissions)`;

  const listContainer = document.getElementById("feedbackModalReviewsList");
  if (listContainer) {
    if (!feedbacks.length) {
      listContainer.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:30px;">No participant reviews submitted for this event yet.</div>`;
    } else {
      listContainer.innerHTML = feedbacks.map(f => {
        const starsStr = "★".repeat(f.rating) + "☆".repeat(5 - f.rating);
        return `
          <div class="review-card">
            <div class="review-card-header">
              <div>
                <span class="review-author">${f.name}</span>
                <span style="font-size:0.75rem;color:var(--text-muted);margin-left:8px;">${f.email || ''}</span>
              </div>
              <div class="review-stars">${starsStr}</div>
            </div>
            <p class="review-text">${f.comment}</p>
            <div class="review-date">📅 Submitted on ${f.date || 'Recent'}</div>
          </div>
        `;
      }).join("");
    }
  }

  const modal = document.getElementById("feedbackModal");
  if (modal) modal.classList.add("visible");
}

function closeFeedbackModal() {
  const modal = document.getElementById("feedbackModal");
  if (modal) modal.classList.remove("visible");
}

function populateEventFilterDropdown() {
  const filter = document.getElementById("eventFilter");
  if (!filter) return;

  const events = EventManager.getAll();
  const currentVal = filter.value;
  filter.innerHTML = `<option value="">All Events</option>`;

  events.forEach(ev => {
    const opt = document.createElement("option");
    opt.value = ev.title;
    opt.textContent = ev.title;
    filter.appendChild(opt);
  });

  filter.value = currentVal;
}

// ==========================================
// CREATE EVENT MODAL & TEMPLATE CLONING
// ==========================================
function populateCloneFromTemplatesDropdown() {
  const select = document.getElementById("cloneFromEventSelect");
  if (!select) return;
  const events = EventManager.getAll();
  select.innerHTML = `<option value="">-- Start from Blank Event --</option>`;
  events.forEach(ev => {
    const opt = document.createElement("option");
    opt.value = ev.id;
    opt.textContent = `📋 ${ev.title} (${ev.category || 'General'} • ${ev.venue || 'Venue'})`;
    select.appendChild(opt);
  });
}

function handleSelectCloneTemplate(e) {
  const selectedId = e.target.value;
  if (!selectedId) return;
  const ev = EventManager.getById(selectedId);
  if (!ev) return;

  document.getElementById("newEventTitle").value = `${ev.title} (Clone)`;
  document.getElementById("newEventCategory").value = ev.category || "music";
  document.getElementById("newEventDept").value = ev.dept || "";
  document.getElementById("newEventVenue").value = ev.venue || "";
  document.getElementById("newEventCapacity").value = ev.capacity || 200;
  document.getElementById("newEventImage").value = ev.image || "images/hero.jpg";
  document.getElementById("newEventDesc").value = ev.desc || "";

  if (ev.brochureUrl) {
    document.getElementById("newEventBrochureUrl").value = !ev.brochureUrl.startsWith("data:") ? ev.brochureUrl : "";
    document.getElementById("newEventBrochureName").value = ev.brochureName || `${ev.title}_Brochure.pdf`;
    const badge = document.getElementById("newEventBrochureFileBadge");
    if (badge) {
      badge.style.display = "block";
      badge.textContent = `✓ Template brochure referenced: ${ev.brochureName || 'Document'}`;
    }
  }

  showToast(`📋 Loaded template from "${ev.title}". Choose date & time to complete!`);
}

function handleNewEventStatusChange(e) {
  const val = e.target.value;
  const schedRow = document.getElementById("newEventScheduleRow");
  if (schedRow) {
    schedRow.style.display = val === "Scheduled" ? "block" : "none";
  }
}

function handleEditEventStatusChange(e) {
  const val = e.target.value;
  const schedRow = document.getElementById("editEventScheduleRow");
  const cancelRow = document.getElementById("editEventCancelRow");
  if (schedRow) schedRow.style.display = val === "Scheduled" ? "block" : "none";
  if (cancelRow) cancelRow.style.display = val === "Cancelled" ? "block" : "none";
}

function openCreateEventModal() {
  newEventUploadedBrochureData = null;
  const fileInput = document.getElementById("newEventBrochureFile");
  if (fileInput) fileInput.value = "";
  const badge = document.getElementById("newEventBrochureFileBadge");
  if (badge) badge.style.display = "none";
  const urlInput = document.getElementById("newEventBrochureUrl");
  if (urlInput) urlInput.value = "";
  const nameInput = document.getElementById("newEventBrochureName");
  if (nameInput) nameInput.value = "";

  // Reset Form fields
  const titleInput = document.getElementById("newEventTitle");
  if (titleInput) titleInput.value = "";
  const deptInput = document.getElementById("newEventDept");
  if (deptInput) deptInput.value = "";
  const dateInput = document.getElementById("newEventDate");
  if (dateInput) dateInput.value = "";
  const timeInput = document.getElementById("newEventTime");
  if (timeInput) timeInput.value = "";
  const venueInput = document.getElementById("newEventVenue");
  if (venueInput) venueInput.value = "";
  const descInput = document.getElementById("newEventDesc");
  if (descInput) descInput.value = "";

  const statusSelect = document.getElementById("newEventStatus");
  if (statusSelect) statusSelect.value = "Open";
  const schedRow = document.getElementById("newEventScheduleRow");
  if (schedRow) schedRow.style.display = "none";
  const schedDate = document.getElementById("newEventScheduleDate");
  if (schedDate) schedDate.value = "";

  populateCloneFromTemplatesDropdown();

  const modal = document.getElementById("createEventModal");
  if (modal) modal.classList.add("visible");
}

function closeCreateEventModal() {
  const modal = document.getElementById("createEventModal");
  if (modal) modal.classList.remove("visible");
}

function handleCreateEvent(e) {
  e.preventDefault();
  const title = document.getElementById("newEventTitle").value.trim();
  const category = document.getElementById("newEventCategory").value;
  const dept = document.getElementById("newEventDept").value.trim();
  const date = document.getElementById("newEventDate").value;
  const time = document.getElementById("newEventTime").value.trim();
  const venue = document.getElementById("newEventVenue").value.trim();
  const capacity = document.getElementById("newEventCapacity").value;
  const image = document.getElementById("newEventImage").value.trim();
  const desc = document.getElementById("newEventDesc").value.trim();
  const status = document.getElementById("newEventStatus").value;
  const scheduledPublishDate = document.getElementById("newEventScheduleDate") ? document.getElementById("newEventScheduleDate").value : null;

  const brochureUrl = newEventUploadedBrochureData || (document.getElementById("newEventBrochureUrl") ? document.getElementById("newEventBrochureUrl").value.trim() : "");
  const brochureName = (document.getElementById("newEventBrochureName") ? document.getElementById("newEventBrochureName").value.trim() : "") || `${title.replace(/\s+/g, '_')}_Official_Brochure.pdf`;

  EventManager.create({
    title,
    category,
    categoryLabel: category.toUpperCase(),
    dept,
    date,
    dateFormatted: date,
    time,
    venue,
    capacity: parseInt(capacity, 10) || 100,
    image: image || "images/hero.jpg",
    desc,
    status: status || "Open",
    scheduledPublishDate: status === "Scheduled" ? scheduledPublishDate : null,
    brochureUrl,
    brochureName
  });

  closeCreateEventModal();
  showToast(`🎉 Event "${title}" created successfully (${status})!`);
  
  renderEventsCrudTable();
  populateEventFilterDropdown();
  loadAllData();
  renderDynamicHomepageEvents();
}

// ==========================================
// EDIT EVENT MODAL CONTROLLER
// ==========================================
function openEditEventModal(eventId) {
  const event = EventManager.getById(eventId);
  if (!event) return;

  editEventUploadedBrochureData = null;

  document.getElementById("editEventId").value = event.id;
  document.getElementById("editEventTitle").value = event.title;
  document.getElementById("editEventCategory").value = event.category || "music";
  document.getElementById("editEventDept").value = event.dept || "";
  document.getElementById("editEventDate").value = event.date || "";
  document.getElementById("editEventTime").value = event.time || "";
  document.getElementById("editEventVenue").value = event.venue || "";
  document.getElementById("editEventCapacity").value = event.capacity || 100;
  
  const statusSelect = document.getElementById("editEventStatus");
  if (statusSelect) statusSelect.value = event.status || (EventManager.isEventOver(event) ? "Completed" : "Open");

  const schedRow = document.getElementById("editEventScheduleRow");
  const schedDate = document.getElementById("editEventScheduleDate");
  if (schedRow && schedDate) {
    schedDate.value = event.scheduledPublishDate || "";
    schedRow.style.display = event.status === "Scheduled" ? "block" : "none";
  }

  const cancelRow = document.getElementById("editEventCancelRow");
  const cancelReason = document.getElementById("editEventCancelReason");
  if (cancelRow && cancelReason) {
    cancelReason.value = event.cancellationReason || "";
    cancelRow.style.display = event.status === "Cancelled" ? "block" : "none";
  }

  document.getElementById("editEventDesc").value = event.desc || "";
  document.getElementById("editEventRecap").value = event.recap || "";

  // Brochure Fields & Status
  const fileInput = document.getElementById("editEventBrochureFile");
  if (fileInput) fileInput.value = "";
  const badge = document.getElementById("editEventBrochureFileBadge");
  if (badge) badge.style.display = "none";

  const urlInput = document.getElementById("editEventBrochureUrl");
  if (urlInput) urlInput.value = (event.brochureUrl && !event.brochureUrl.startsWith("data:")) ? event.brochureUrl : "";

  const nameInput = document.getElementById("editEventBrochureName");
  if (nameInput) nameInput.value = event.brochureName || `${event.title.replace(/\s+/g, '_')}_Brochure.pdf`;

  const statusBadge = document.getElementById("editEventBrochureStatusBadge");
  if (statusBadge) {
    if (event.brochureUrl && event.brochureUrl.length > 0) {
      statusBadge.style.background = "rgba(245, 158, 11, 0.2)";
      statusBadge.style.color = "var(--accent-gold)";
      statusBadge.textContent = `Attached: ${event.brochureName || 'Custom File'}`;
    } else {
      statusBadge.style.background = "rgba(255,255,255,0.08)";
      statusBadge.style.color = "#ccc";
      statusBadge.textContent = "Default Branded Template";
    }
  }

  // Format post-event gallery into lines
  const galleryLines = (event.postEventGallery || []).map(g => `${g.src} | ${g.caption || ''}`).join("\n");
  document.getElementById("editEventGallery").value = galleryLines;

  const modal = document.getElementById("editEventModal");
  if (modal) modal.classList.add("visible");
}

function closeEditEventModal() {
  const modal = document.getElementById("editEventModal");
  if (modal) modal.classList.remove("visible");
}

function handleSaveEditedEvent(e) {
  e.preventDefault();
  const id = document.getElementById("editEventId").value;
  const currentEvent = EventManager.getById(id);
  const title = document.getElementById("editEventTitle").value.trim();
  const category = document.getElementById("editEventCategory").value;
  const dept = document.getElementById("editEventDept").value.trim();
  const date = document.getElementById("editEventDate").value;
  const time = document.getElementById("editEventTime").value.trim();
  const venue = document.getElementById("editEventVenue").value.trim();
  const capacity = document.getElementById("editEventCapacity").value;
  const status = document.getElementById("editEventStatus").value;
  const scheduledPublishDate = document.getElementById("editEventScheduleDate") ? document.getElementById("editEventScheduleDate").value : null;
  const cancellationReason = document.getElementById("editEventCancelReason") ? document.getElementById("editEventCancelReason").value.trim() : "";
  const desc = document.getElementById("editEventDesc").value.trim();
  const recap = document.getElementById("editEventRecap").value.trim();
  const galleryRaw = document.getElementById("editEventGallery").value.trim();

  // Brochure resolution
  let brochureUrl = (currentEvent ? currentEvent.brochureUrl : "");
  if (editEventUploadedBrochureData !== null) {
    brochureUrl = editEventUploadedBrochureData;
  } else {
    const urlVal = document.getElementById("editEventBrochureUrl") ? document.getElementById("editEventBrochureUrl").value.trim() : "";
    if (urlVal) brochureUrl = urlVal;
  }

  const brochureName = (document.getElementById("editEventBrochureName") ? document.getElementById("editEventBrochureName").value.trim() : "") || (currentEvent ? currentEvent.brochureName : `${title}_Brochure.pdf`);

  // Parse gallery lines
  const postEventGallery = galleryRaw
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .map(line => {
      const parts = line.split("|").map(p => p.trim());
      return { src: parts[0], caption: parts[1] || `${title} Memory` };
    });

  EventManager.update(id, {
    title,
    category,
    dept,
    date,
    dateFormatted: date,
    time,
    venue,
    capacity: parseInt(capacity, 10),
    status,
    scheduledPublishDate: status === "Scheduled" ? scheduledPublishDate : null,
    cancellationReason: status === "Cancelled" ? (cancellationReason || "Event cancelled by administration.") : null,
    desc,
    recap: recap || `Event ${title} concluded with great success and student participation.`,
    postEventGallery: postEventGallery.length ? postEventGallery : undefined,
    brochureUrl,
    brochureName
  });

  closeEditEventModal();
  showToast(`💾 Event "${title}" updated successfully.`);

  renderEventsCrudTable();
  populateEventFilterDropdown();
  loadAllData();
  renderDynamicHomepageEvents();
}

// ==========================================
// EVENT LIFECYCLE HANDLERS (Duplicate, TogglePublish, Cancel, Archive)
// ==========================================
function handleDuplicateEvent(eventId) {
  const clone = EventManager.duplicate(eventId);
  if (clone) {
    showToast(`📋 Duplicated event as draft: "${clone.title}"`);
    renderEventsCrudTable();
    populateEventFilterDropdown();
    loadAllData();
    renderDynamicHomepageEvents();
  }
}

function handleTogglePublish(eventId) {
  const updated = EventManager.togglePublish(eventId);
  if (updated) {
    showToast(updated.status === "Open" ? `🚀 Event "${updated.title}" is now Published live!` : `📝 Event "${updated.title}" moved to Draft.`);
    renderEventsCrudTable();
    renderDynamicHomepageEvents();
  }
}

function handleToggleArchive(eventId) {
  const ev = EventManager.getById(eventId);
  if (!ev) return;
  if (ev.status === "Archived") {
    EventManager.unarchive(eventId);
    showToast(`📤 Event "${ev.title}" restored from archive.`);
  } else {
    if (confirm(`Archive event "${ev.title}"? It will be archived and hidden from the active event table.`)) {
      EventManager.archive(eventId);
      showToast(`📦 Event "${ev.title}" moved to archive.`);
    }
  }
  renderEventsCrudTable();
  renderDynamicHomepageEvents();
}

function handleCancelEvent(eventId) {
  const ev = EventManager.getById(eventId);
  if (!ev) return;
  const reason = prompt(`Enter cancellation reason for students registered for "${ev.title}":`, ev.cancellationReason || "Unforeseen schedule conflict");
  if (reason !== null) {
    EventManager.cancel(eventId, reason);
    showToast(`🚫 Event "${ev.title}" marked as Cancelled.`);
    renderEventsCrudTable();
    renderDynamicHomepageEvents();
  }
}

function handleDeleteEvent(eventId) {
  const event = EventManager.getById(eventId);
  if (!event) return;

  if (!confirm(`Are you sure you want to permanently delete "${event.title}"? This cannot be undone.`)) {
    return;
  }

  EventManager.delete(eventId);
  showToast(`🗑️ Event "${event.title}" deleted.`);

  renderEventsCrudTable();
  populateEventFilterDropdown();
  loadAllData();
  renderDynamicHomepageEvents();
}

// ==========================================
// EVENT LIVE PREVIEW MODAL CONTROLLER
// ==========================================
function showAdminEventPreview(eventId) {
  const ev = EventManager.getById(eventId);
  if (!ev) return;
  currentPreviewEventId = eventId;

  const titleEl = document.getElementById("previewModalTitle");
  if (titleEl) titleEl.textContent = `Live Preview — ${ev.title}`;

  const statusBadge = document.getElementById("previewModalStatusBadge");
  if (statusBadge) {
    statusBadge.textContent = `Status: ${ev.status || 'Open'} | Venue: ${ev.venue} | Date: ${ev.dateFormatted || ev.date}`;
  }

  const openTabBtn = document.getElementById("previewOpenTabBtn");
  if (openTabBtn) {
    openTabBtn.href = `event.html?id=${encodeURIComponent(eventId)}&preview=true`;
  }

  const iframe = document.getElementById("eventPreviewIframe");
  if (iframe) {
    iframe.src = `event.html?id=${encodeURIComponent(eventId)}&preview=true`;
  }

  const modal = document.getElementById("eventPreviewModal");
  if (modal) modal.classList.add("visible");
}

function closeEventPreviewModal() {
  const modal = document.getElementById("eventPreviewModal");
  if (modal) modal.classList.remove("visible");
  const iframe = document.getElementById("eventPreviewIframe");
  if (iframe) iframe.src = "about:blank";
  currentPreviewEventId = null;
}

function setPreviewDevice(mode) {
  const container = document.getElementById("previewFrameContainer");
  if (!container) return;
  if (mode === "mobile") {
    container.style.width = "390px";
    container.style.margin = "0 auto";
    container.style.border = "4px solid #333";
    container.style.borderRadius = "24px";
  } else {
    container.style.width = "100%";
    container.style.margin = "0";
    container.style.border = "1px solid var(--border-gold)";
    container.style.borderRadius = "8px";
  }
}

function openEditFromPreview() {
  if (currentPreviewEventId) {
    const id = currentPreviewEventId;
    closeEventPreviewModal();
    openEditEventModal(id);
  }
}

// ==========================================
// 4. DATA LOADING & KPI CALCULATION
// ==========================================
async function loadAllData() {
  try {
    let rawLocal = EvenTiamoStore.getAll();
    let remoteData = [];

    try {
      const sheetRaw = await fetch(ADMIN_API_URL + "?admin=sheet");
      remoteData = await sheetRaw.json();
    } catch (e) {}

    const combinedMap = new Map();
    rawLocal.forEach(r => combinedMap.set((r.ticket || r.id).toUpperCase(), r));
    if (Array.isArray(remoteData)) {
      remoteData.forEach(r => combinedMap.set((r.ticket || r.id).toUpperCase(), r));
    }

    tableData = Array.from(combinedMap.values());

    renderKPIs(tableData);
    renderTable(tableData);
    renderCharts(tableData);
    renderEventSummary(tableData);

  } catch (err) {
    console.error("Error loading dashboard data:", err);
  }
}

function renderKPIs(data) {
  const total = data.length;
  const checked = data.filter(r => r.status === "Checked").length;
  const pending = total - checked;
  const rate = total > 0 ? Math.round((checked / total) * 100) : 0;
  const activeEventsCount = EventManager.getAll().length;

  const kpiTotal = document.getElementById("kpiTotal");
  const kpiChecked = document.getElementById("kpiChecked");
  const kpiPending = document.getElementById("kpiPending");
  const kpiRate = document.getElementById("kpiRate");
  const kpiEvents = document.getElementById("kpiEvents");

  if (kpiTotal) kpiTotal.textContent = total;
  if (kpiChecked) kpiChecked.textContent = checked;
  if (kpiPending) kpiPending.textContent = pending;
  if (kpiRate) kpiRate.textContent = `${rate}% Turnout Rate`;
  if (kpiEvents) kpiEvents.textContent = activeEventsCount;
}

function renderEventSummary(data) {
  const container = document.getElementById("eventsSummary");
  if (!container) return;

  const events = EventManager.getAll();
  container.innerHTML = "";

  events.forEach(ev => {
    const stats = EventManager.getStats(ev.id);
    const card = document.createElement("div");
    card.className = "event-stat-card";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <strong style="color:var(--accent-gold);font-size:1.05rem;">${ev.title}</strong>
        <span class="pill" style="font-size:0.75rem;">${stats.booked}/${ev.capacity} Booked</span>
      </div>
      <div class="capacity-bar-wrapper">
        <div class="capacity-info">
          <span>Capacity Filled</span>
          <span>${stats.pct}%</span>
        </div>
        <div class="capacity-bar">
          <div class="capacity-progress" style="width: ${stats.pct}%;"></div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ==========================================
// 5. CHARTS RENDERING (Compact & Balanced Proportions)
// ==========================================
function renderCharts(data) {
  const counts = { Checked: 0, NotChecked: 0 };
  const byEvent = {};

  data.forEach(r => {
    const status = r.status === "Checked" ? "Checked" : "NotChecked";
    counts[status] = (counts[status] || 0) + 1;

    const ev = r.event || "General Event";
    byEvent[ev] = byEvent[ev] || { total: 0, checked: 0 };
    byEvent[ev].total++;
    if (r.status === "Checked") byEvent[ev].checked++;
  });

  const pieCanvas = document.getElementById("pieChart");
  if (pieCanvas) {
    if (chartInstances.pie) chartInstances.pie.destroy();
    const pieCtx = pieCanvas.getContext("2d");
    chartInstances.pie = new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: ['Checked-In', 'Pending'],
        datasets: [{
          data: [counts.Checked, counts.NotChecked],
          backgroundColor: ['#10b981', '#f59e0b'],
          borderColor: '#070709',
          borderWidth: 2,
          hoverOffset: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#cbd5e1',
              boxWidth: 10,
              padding: 10,
              font: { family: 'Plus Jakarta Sans', size: 11 }
            }
          }
        }
      }
    });
  }

  const barCanvas = document.getElementById("barChart");
  if (barCanvas) {
    if (chartInstances.bar) chartInstances.bar.destroy();
    const evNames = Object.keys(byEvent);
    const totalArr = evNames.map(ev => byEvent[ev].total);
    const checkedArr = evNames.map(ev => byEvent[ev].checked);

    const barCtx = barCanvas.getContext("2d");
    chartInstances.bar = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: evNames.map(n => n.length > 15 ? n.substring(0, 14) + '…' : n),
        datasets: [
          {
            label: 'Registered',
            data: totalArr,
            backgroundColor: 'rgba(243, 207, 85, 0.45)',
            borderColor: '#f3cf55',
            borderWidth: 1,
            borderRadius: 4,
            maxBarThickness: 16
          },
          {
            label: 'Checked In',
            data: checkedArr,
            backgroundColor: '#10b981',
            borderRadius: 4,
            maxBarThickness: 16
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { color: '#cbd5e1', font: { family: 'Plus Jakarta Sans', size: 10 } },
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#cbd5e1', font: { family: 'Plus Jakarta Sans', size: 10 }, stepSize: 1 },
            grid: { color: 'rgba(255,255,255,0.05)' }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              color: '#cbd5e1',
              boxWidth: 10,
              padding: 8,
              font: { family: 'Plus Jakarta Sans', size: 10 }
            }
          }
        }
      }
    });
  }
}

// ==========================================
// 6. ATTENDEES DIRECTORY & ACTIONS
// ==========================================
function renderTable(data) {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">No attendee records found matching your filters.</td></tr>`;
    return;
  }

  data.forEach(r => {
    const isChecked = r.status === "Checked";
    const statusBadge = isChecked 
      ? `<span class="admin-badge-checked">✓ Checked In</span>` 
      : `<span class="admin-badge-pending">⏳ Pending</span>`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-family:monospace;font-weight:700;color:var(--accent-gold);">${r.ticket || r.id}</td>
      <td><strong>${r.name}</strong></td>
      <td>${r.email}</td>
      <td>${r.dept || r.studentId || "—"}</td>
      <td>${r.event}</td>
      <td>${statusBadge}</td>
      <td>
        <button class="action-btn btn-action-resend" onclick="downloadAttendeeSoftCopy('${r.ticket || r.id}')" title="Download Attendee Ticket Soft Copy">📥 Soft Copy</button>
        <button class="action-btn btn-action-resend" onclick="emailAttendeePass('${r.ticket || r.id}')" title="Send Email Pass to Student">📧 Email</button>
        <button class="action-btn btn-action-cert" onclick="openCertModal('${r.ticket || r.id}')" title="Generate Participation Certificate">📜 Cert</button>
        ${!isChecked 
          ? `<button class="action-btn btn-action-checkin" onclick="forceCheckin('${r.ticket || r.id}')">✓ Check-In</button>`
          : `<button class="action-btn btn-action-undo" onclick="undoCheckin('${r.ticket || r.id}')">↩ Undo</button>`
        }
        <button class="action-btn btn-action-edit" onclick="viewTicketPass('${r.ticket || r.id}')" title="View QR Ticket Pass">🎟️ QR</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function downloadAttendeeSoftCopy(ticketId) {
  const reg = tableData.find(r => (r.ticket || r.id).toUpperCase() === ticketId.toUpperCase())
    || EvenTiamoStore.getAll().find(r => (r.ticket || r.id).toUpperCase() === ticketId.toUpperCase());
  if (reg && typeof downloadTicketSoftCopy === "function") {
    downloadTicketSoftCopy(reg);
  } else {
    alert("Attendee pass record not found.");
  }
}

function emailAttendeePass(ticketId) {
  const reg = tableData.find(r => (r.ticket || r.id).toUpperCase() === ticketId.toUpperCase())
    || EvenTiamoStore.getAll().find(r => (r.ticket || r.id).toUpperCase() === ticketId.toUpperCase());
  if (reg && typeof emailSoftCopyPass === "function") {
    emailSoftCopyPass(reg);
  } else {
    alert("Attendee pass record not found.");
  }
}

function applyFilters() {
  const search = (document.getElementById("searchInput").value || "").toLowerCase().trim();
  const evFilter = document.getElementById("eventFilter").value;
  const statusFilter = document.getElementById("statusFilter").value;

  const filtered = tableData.filter(r => {
    const matchSearch =
      (r.name || "").toLowerCase().includes(search) ||
      (r.email || "").toLowerCase().includes(search) ||
      (r.ticket || r.id || "").toLowerCase().includes(search) ||
      (r.dept || "").toLowerCase().includes(search);

    const matchEvent = evFilter === "" || (r.event || "").includes(evFilter);
    const matchStatus = statusFilter === "" || r.status === statusFilter;

    return matchSearch && matchEvent && matchStatus;
  });

  renderTable(filtered);
  renderCharts(filtered);
}

function resetFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("eventFilter").value = "";
  document.getElementById("statusFilter").value = "";
  renderTable(tableData);
  renderCharts(tableData);
}

function forceCheckin(ticket) {
  EvenTiamoStore.updateStatus(ticket, "Checked");
  showToast(`✅ Attendee ${ticket} marked as Checked-In.`);
  loadAllData();
  fetch(ADMIN_API_URL + `?admin=force&ticket=${encodeURIComponent(ticket)}`).catch(() => {});
}

function undoCheckin(ticket) {
  EvenTiamoStore.updateStatus(ticket, "Not Checked");
  showToast(`↩ Check-in status undone for ${ticket}.`);
  loadAllData();
  fetch(ADMIN_API_URL + `?admin=undo&ticket=${encodeURIComponent(ticket)}`).catch(() => {});
}

function viewTicketPass(ticket) {
  const reg = tableData.find(r => (r.ticket || r.id).toUpperCase() === ticket.toUpperCase());
  if (reg) showTicketModal(reg);
}

function openCertModal(ticket) {
  const reg = tableData.find(r => (r.ticket || r.id).toUpperCase() === ticket.toUpperCase());
  if (!reg) return;

  const modal = document.getElementById("certModal");
  document.getElementById("certStudentName").textContent = reg.name;
  document.getElementById("certEventName").textContent = reg.event;
  document.getElementById("certTicketId").textContent = reg.ticket || reg.id;
  document.getElementById("certDate").textContent = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  if (modal) modal.classList.add("visible");
}

function closeCertModal() {
  const modal = document.getElementById("certModal");
  if (modal) modal.classList.remove("visible");
}

// ==========================================
// 7. CSV EXPORT & EVENT SORTING ENGINE
// ==========================================
function downloadCSV() {
  openCsvExportModal();
}

function openCsvExportModal() {
  const modal = document.getElementById("csvExportModal");
  if (!modal) return executeCsvExport();

  // Populate Event dropdown for specific event export
  const select = document.getElementById("csvExportEventSelect");
  if (select) {
    const events = EventManager.getAll();
    select.innerHTML = "";
    events.forEach(ev => {
      const opt = document.createElement("option");
      opt.value = ev.title;
      opt.textContent = `🎪 ${ev.title} (${ev.category || 'General'})`;
      select.appendChild(opt);
    });
  }

  handleCsvScopeChange();
  updateCsvExportPreview();
  modal.classList.add("visible");
}

function closeCsvExportModal() {
  const modal = document.getElementById("csvExportModal");
  if (modal) modal.classList.remove("visible");
}

function handleCsvScopeChange() {
  const scope = document.getElementById("csvExportScope") ? document.getElementById("csvExportScope").value : "all";
  const specificRow = document.getElementById("csvSpecificEventRow");
  if (specificRow) {
    specificRow.style.display = scope === "specific" ? "block" : "none";
  }
  updateCsvExportPreview();
}

function getFilteredCsvRecords() {
  const scope = document.getElementById("csvExportScope") ? document.getElementById("csvExportScope").value : "all";
  const selectedEvent = document.getElementById("csvExportEventSelect") ? document.getElementById("csvExportEventSelect").value : "";

  let records = [...tableData];
  if (!records.length) {
    records = EvenTiamoStore.getAll();
  }

  if (scope === "specific" && selectedEvent) {
    records = records.filter(r => (r.event || "").trim().toLowerCase() === selectedEvent.trim().toLowerCase());
  } else if (scope === "filtered") {
    const search = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();
    const evFilter = document.getElementById("eventFilter")?.value || "";
    const statusFilter = document.getElementById("statusFilter")?.value || "";
    records = records.filter(r => {
      const matchSearch =
        (r.name || "").toLowerCase().includes(search) ||
        (r.email || "").toLowerCase().includes(search) ||
        (r.ticket || r.id || "").toLowerCase().includes(search) ||
        (r.dept || "").toLowerCase().includes(search);
      const matchEvent = evFilter === "" || (r.event || "").includes(evFilter);
      const matchStatus = statusFilter === "" || r.status === statusFilter;
      return matchSearch && matchEvent && matchStatus;
    });
  }

  return records;
}

function updateCsvExportPreview() {
  const countEl = document.getElementById("csvExportCountPreview");
  if (!countEl) return;

  const records = getFilteredCsvRecords();
  const sortBy = document.getElementById("csvExportSortBy") ? document.getElementById("csvExportSortBy").value : "event_asc";
  const sortLabelMap = {
    "event_asc": "🎪 Event Name (A → Z) [Grouped by Event]",
    "event_desc": "🎪 Event Name (Z → A)",
    "name_asc": "👤 Student Name (A → Z)",
    "ticket_asc": "🎟️ Ticket ID",
    "status_checked_first": "✅ Check-In Status (Verified First)",
    "status_pending_first": "⏳ Check-In Status (Pending First)"
  };

  const checkedCount = records.filter(r => r.status === "Checked").length;
  countEl.innerHTML = `<strong>${records.length}</strong> attendee passes ready to export (<strong>${checkedCount}</strong> Checked-In, <strong>${records.length - checkedCount}</strong> Pending), sorted by <em>${sortLabelMap[sortBy] || 'Event Name'}</em>.`;
}

function executeCsvExport() {
  let records = getFilteredCsvRecords();
  if (!records.length) {
    alert("No attendee data available to export matching the selected filters.");
    return;
  }

  const scope = document.getElementById("csvExportScope") ? document.getElementById("csvExportScope").value : "all";
  const sortBy = document.getElementById("csvExportSortBy") ? document.getElementById("csvExportSortBy").value : "event_asc";
  const selectedEvent = document.getElementById("csvExportEventSelect") ? document.getElementById("csvExportEventSelect").value : "";
  const includeStats = document.getElementById("csvIncludeStats") ? document.getElementById("csvIncludeStats").checked : true;

  // Sorting Logic
  records.sort((a, b) => {
    const eventA = (a.event || "").toLowerCase();
    const eventB = (b.event || "").toLowerCase();
    const nameA = (a.name || "").toLowerCase();
    const nameB = (b.name || "").toLowerCase();
    const ticketA = (a.ticket || a.id || "").toLowerCase();
    const ticketB = (b.ticket || b.id || "").toLowerCase();

    if (sortBy === "event_asc") {
      if (eventA !== eventB) return eventA.localeCompare(eventB);
      return nameA.localeCompare(nameB);
    } else if (sortBy === "event_desc") {
      if (eventA !== eventB) return eventB.localeCompare(eventA);
      return nameA.localeCompare(nameB);
    } else if (sortBy === "name_asc") {
      return nameA.localeCompare(nameB);
    } else if (sortBy === "ticket_asc") {
      return ticketA.localeCompare(ticketB);
    } else if (sortBy === "status_checked_first") {
      if (a.status === "Checked" && b.status !== "Checked") return -1;
      if (a.status !== "Checked" && b.status === "Checked") return 1;
      return eventA.localeCompare(eventB);
    } else if (sortBy === "status_pending_first") {
      if (a.status !== "Checked" && b.status === "Checked") return -1;
      if (a.status === "Checked" && b.status !== "Checked") return 1;
      return eventA.localeCompare(eventB);
    }
    return eventA.localeCompare(eventB);
  });

  // Build CSV Format
  const headers = ["Ticket ID", "Student Name", "Email", "Department / ID", "Phone", "Event", "Check-In Status", "Registration Time"];
  const csvRows = [];

  if (includeStats) {
    const total = records.length;
    const checked = records.filter(r => r.status === "Checked").length;
    const pending = total - checked;
    csvRows.push([`"EvenTiamo Campus Event Directory — Attendee Master List"`]);
    csvRows.push([`"Generated: ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' })}"`]);
    csvRows.push([`"Total Attendees: ${total} | Checked In: ${checked} | Pending: ${pending} | Sorted by: ${sortBy.replace(/_/g, ' ').toUpperCase()}"`]);
    csvRows.push([]); // blank separator
  }

  csvRows.push(headers);

  records.forEach(r => {
    csvRows.push([
      r.ticket || r.id,
      r.name,
      r.email,
      r.dept || r.studentId || "General",
      r.phone || "—",
      r.event,
      r.status,
      r.time || "—"
    ]);
  });

  const csvString = csvRows.map(row => 
    row.map(v => `"${(v || "").toString().replace(/"/g, '""')}"`).join(",")
  ).join("\n");

  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const fileNameSuffix = scope === "specific" && selectedEvent 
    ? `${selectedEvent.replace(/[^a-zA-Z0-9_-]/g, '_')}_Attendees` 
    : `Attendees_Sorted_By_Event`;
  a.download = `EvenTiamo_${fileNameSuffix}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  closeCsvExportModal();
  showToast(`📥 Exported ${records.length} attendees sorted according to event!`);
}

// ==========================================
// 7. INITIALIZE
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  checkAuthSession();
});
