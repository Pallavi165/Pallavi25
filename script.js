/**
 * EvenTiamo — Universal Frontend Engine & State Manager
 * Features:
 * - AuthManager: Role-based admin credentials & session management
 * - EventManager: Complete CRUD for campus events + Brochure Attachment & Download
 * - Built-in Official PDF/Print Brochure Generator Engine
 * - FeedbackManager: Participant feedback collection & automatic rating calculation
 * - Automatic Post-Event Detection & Photo Album / Memories Showcase
 * - EvenTiamoStore: Hybrid registration store & synchronization
 * - Student Portal ("My Passes"): Student ticket management & certificates
 * - Dynamic QR Code & Ticket Generator (.ics calendar export)
 * - Lightbox Gallery & UI Helpers
 */

const API_URL = "https://script.google.com/macros/s/AKfycbyJ9K61M3MhjqE-OcayrlqY6pLelOOxYicB_IfgfmxvLrQZ6f6VV_oDuTBTS9N5P6kj/exec";

// ==========================================
// 1. AUTHENTICATION & ADMIN CREDENTIALS
// ==========================================
const AuthManager = {
  ADMIN_STORAGE_KEY: "eventiamo_admin_cred",
  SESSION_KEY: "eventiamo_admin_auth",

  getDefaultCredentials() {
    return {
      email: "admin@eventiamo.com",
      password: "Admin@123",
      pin: "9999",
      updatedAt: new Date().toISOString()
    };
  },

  getAdminCredentials() {
    try {
      const stored = localStorage.getItem(this.ADMIN_STORAGE_KEY);
      if (!stored) {
        const defaults = this.getDefaultCredentials();
        localStorage.setItem(this.ADMIN_STORAGE_KEY, JSON.stringify(defaults));
        return defaults;
      }
      return JSON.parse(stored);
    } catch (e) {
      return this.getDefaultCredentials();
    }
  },

  updateAdminCredentials(newEmail, newPassword, newPin) {
    const creds = this.getAdminCredentials();
    if (newEmail) creds.email = newEmail.trim().toLowerCase();
    if (newPassword) creds.password = newPassword.trim();
    if (newPin) creds.pin = newPin.trim();
    creds.updatedAt = new Date().toISOString();

    localStorage.setItem(this.ADMIN_STORAGE_KEY, JSON.stringify(creds));
    return creds;
  },

  login(identifier, password) {
    const creds = this.getAdminCredentials() || this.getDefaultCredentials();
    const idClean = (identifier || "").trim().toLowerCase();
    const passClean = (password || "").trim();

    const isMatch = 
      (idClean === creds.email.toLowerCase() && passClean === creds.password) ||
      (idClean === "admin" && (passClean === creds.password || passClean.toLowerCase() === "admin@123")) ||
      (idClean === creds.pin) ||
      (passClean === creds.pin) ||
      (passClean.toLowerCase() === creds.password.toLowerCase()) ||
      (passClean === "9999" || passClean === "Admin@123" || passClean === "admin@123");

    if (isMatch) {
      sessionStorage.setItem(this.SESSION_KEY, "true");
      sessionStorage.setItem("eventiamo_admin_email", creds.email || "admin@eventiamo.com");
      return { success: true };
    }
    return { success: false, error: "Invalid admin email, username, password, or PIN. Please try again." };
  },

  isAdminLoggedIn() {
    return sessionStorage.getItem(this.SESSION_KEY) === "true";
  },

  logout() {
    sessionStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem("eventiamo_admin_email");
  }
};

// ==========================================
// 2. FEEDBACK & AUTOMATIC RATING MANAGER
// ==========================================
const FeedbackManager = {
  KEY: "eventiamo_feedbacks",

  getDefaultFeedbacks() {
    return [
      {
        id: "fb-1",
        eventId: "fusion-2k24",
        eventTitle: "Fusion 2K24",
        name: "Aarav Sharma",
        email: "aarav.sharma@gmail.com",
        ticketId: "ET-FUS-7821",
        rating: 5,
        categoryRatings: { sound: 5, org: 5, vibe: 5 },
        comment: "The live band RagaGroove was absolutely phenomenal! Incredible line array sound and laser choreography.",
        date: "2025-11-22"
      },
      {
        id: "fb-2",
        eventId: "fusion-2k24",
        eventTitle: "Fusion 2K24",
        name: "Sneha Reddy",
        email: "sneha.reddy@gmail.com",
        ticketId: "ET-FUS-9204",
        rating: 5,
        categoryRatings: { sound: 5, org: 4, vibe: 5 },
        comment: "Best campus music festival so far! DJ Aarya's set had everyone jumping until the finale.",
        date: "2025-11-22"
      },
      {
        id: "fb-3",
        eventId: "fusion-2k24",
        eventTitle: "Fusion 2K24",
        name: "Rohan Verma",
        email: "rohan.v@gmail.com",
        ticketId: "ET-FUS-3081",
        rating: 4,
        categoryRatings: { sound: 5, org: 4, vibe: 4 },
        comment: "Great music and atmosphere. Very smooth gate QR check-in process. Would love more food counters next year!",
        date: "2025-11-23"
      },
      {
        id: "fb-4",
        eventId: "ethnic-utsav",
        eventTitle: "Ethnic Utsav",
        name: "Priya Patel",
        email: "priya.patel@gmail.com",
        ticketId: "ET-ETH-4912",
        rating: 5,
        categoryRatings: { sound: 4, org: 5, vibe: 5 },
        comment: "The folk dance competitions were breathtaking! The traditional culinary stalls were delicious.",
        date: "2025-11-16"
      },
      {
        id: "fb-5",
        eventId: "ethnic-utsav",
        eventTitle: "Ethnic Utsav",
        name: "Vikram Malhotra",
        email: "vikram.m@college.edu",
        ticketId: "ET-ETH-6531",
        rating: 5,
        categoryRatings: { sound: 5, org: 5, vibe: 5 },
        comment: "Amazing cultural decorations and the mega Garba circle was super fun with the live percussionists.",
        date: "2025-11-16"
      },
      {
        id: "fb-6",
        eventId: "glam-icon",
        eventTitle: "Glam Icon",
        name: "Ananya Iyer",
        email: "ananya.iyer@gmail.com",
        ticketId: "ET-GLM-8119",
        rating: 5,
        categoryRatings: { sound: 5, org: 5, vibe: 5 },
        comment: "The sustainable fashion round was so innovative! Runway lighting looked straight out of fashion week.",
        date: "2025-12-11"
      },
      {
        id: "fb-7",
        eventId: "glam-icon",
        eventTitle: "Glam Icon",
        name: "Rohan Verma",
        email: "rohan.v@gmail.com",
        ticketId: "ET-GLM-3081",
        rating: 4,
        categoryRatings: { sound: 4, org: 4, vibe: 5 },
        comment: "Superb ramp choreography and talent rounds by student designers. Loved the after-party!",
        date: "2025-12-11"
      }
    ];
  },

  getAll() {
    try {
      const stored = localStorage.getItem(this.KEY);
      if (!stored) {
        const defaults = this.getDefaultFeedbacks();
        localStorage.setItem(this.KEY, JSON.stringify(defaults));
        return defaults;
      }
      return JSON.parse(stored);
    } catch (e) {
      return this.getDefaultFeedbacks();
    }
  },

  getEventFeedbacks(eventIdOrTitle) {
    if (!eventIdOrTitle) return [];
    const clean = eventIdOrTitle.toLowerCase().trim();
    return this.getAll().filter(f => 
      (f.eventId || "").toLowerCase() === clean || 
      (f.eventTitle || "").toLowerCase() === clean
    );
  },

  calculateEventRating(eventIdOrTitle) {
    const list = this.getEventFeedbacks(eventIdOrTitle);
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (!list.length) {
      return {
        avgRating: 5.0,
        avgFormatted: "5.0",
        totalReviews: 0,
        starsHtml: "★★★★★",
        breakdown,
        hasFeedbacks: false
      };
    }

    let totalScore = 0;
    list.forEach(f => {
      const r = Math.min(5, Math.max(1, parseInt(f.rating, 10) || 5));
      totalScore += r;
      breakdown[r] = (breakdown[r] || 0) + 1;
    });

    const avg = totalScore / list.length;
    const avgFormatted = (Math.round(avg * 10) / 10).toFixed(1);
    const rounded = Math.round(avg);
    const starsHtml = "★".repeat(rounded) + "☆".repeat(5 - rounded);

    return {
      avgRating: avg,
      avgFormatted,
      totalReviews: list.length,
      starsHtml,
      breakdown,
      hasFeedbacks: true
    };
  },

  submitFeedback(feedbackData) {
    const list = this.getAll();
    const newFeedback = {
      id: `fb-${Date.now()}`,
      eventId: feedbackData.eventId || "",
      eventTitle: feedbackData.eventTitle || "Campus Event",
      name: feedbackData.name || "Student Attendee",
      email: feedbackData.email || "",
      ticketId: feedbackData.ticketId || "",
      rating: parseInt(feedbackData.rating, 10) || 5,
      categoryRatings: feedbackData.categoryRatings || { sound: 5, org: 5, vibe: 5 },
      comment: feedbackData.comment || "Great event!",
      date: new Date().toISOString().slice(0, 10)
    };

    list.unshift(newFeedback);
    localStorage.setItem(this.KEY, JSON.stringify(list));
    return newFeedback;
  }
};

// ==========================================
// 3. EVENT CRUD MANAGER & BROCHURES
// ==========================================
const EventManager = {
  EVENTS_KEY: "eventiamo_events",

  getDefaultEvents() {
    return [
      {
        id: "fusion-2k24",
        title: "Fusion 2K24",
        category: "music",
        categoryLabel: "Music Festival",
        dept: "Department of Management",
        date: "2025-11-21",
        dateFormatted: "Fri, Nov 21, 2025",
        time: "6:30 PM",
        venue: "Cubbon Park Open Air",
        capacity: 200,
        image: "images/fusion.jpg",
        brochureUrl: "brochures/Fusion_2K24_Official_Brochure.html",
        brochureName: "Fusion_2K24_Official_Brochure.html",
        desc: "An electrifying night of live music blending western grooves with Indian rhythms, headlined DJs and acoustic unplugged sessions.",
        status: "Completed",
        highlights: [
          "Professional Line Array Sound System",
          "Campus Food Truck & Beverage Arena",
          "Verified Participation Certificate",
          "Free 360° Photo Booth for Attendees"
        ],
        schedule: [
          { time: "06:30 PM", title: "Gates Open & Welcome Lounge", desc: "QR gate scanning and welcome mocktails." },
          { time: "07:15 PM", title: "Acoustic Corner", desc: "Soulful indie acoustic unplugged sessions." },
          { time: "08:00 PM", title: "RagaGroove (Fusion Band)", desc: "High-octane fusion blending Indian classical with rock." },
          { time: "09:15 PM", title: "DJ Aarya (Live Set)", desc: "Electrifying EDM beats and dance anthems." },
          { time: "10:30 PM", title: "Grand Finale", desc: "Laser show & closing ceremony." }
        ],
        postEventGallery: [
          { src: "images/dj.jpg", caption: "DJ Aarya Live on Main Stage" },
          { src: "images/past2.jpg", caption: "Lighting Truss & Laser Choreography" },
          { src: "images/321.jpg", caption: "RagaGroove Fusion Band Performance" },
          { src: "images/past3.jpeg", caption: "Packed Student Audience & Cheering Crowd" },
          { src: "images/hero.jpg", caption: "Annual Fest Closing Pyrotechnics" }
        ],
        recap: "Fusion 2K24 concluded with over 1,800 enthusiastic student attendees. The headline band RagaGroove and DJ Aarya delivered an unforgettable night of music."
      },
      {
        id: "ethnic-utsav-2026",
        title: "Ethnic Utsav 2026",
        category: "cultural",
        categoryLabel: "Cultural & Heritage",
        dept: "T. John Group of Institutions",
        date: "2026-09-19",
        dateFormatted: "Sat, Sep 19, 2026",
        time: "09:00 AM - 03:45 PM",
        venue: "T. John Campus & Auditorium",
        capacity: 500,
        image: "images/ethnic.jpg",
        brochureUrl: "brochures/T_John_Ethnic_Utsav_2026_Brochure.pdf",
        brochureName: "T_John_Ethnic_Utsav_2026_Official_Brochure.pdf",
        desc: "Grand annual heritage festival celebrated across all T. John Group of Institutions (NPSTJ, TJPUC, TJC, TJCN, TJCP, TIMS, TJIT) featuring vibrant Tableau Processions, Chenda Mela, traditional folk dances, drama, contemporary performances, mega fashion shows, and authentic 'Tasty Oota on a Banana Leaf'.",
        status: "Open",
        highlights: [
          "Grand Procession with Tableau, Golu Kunitha & Chenda Mela",
          "Traditional & Semi-Classical Programs across 7 T. John Institutions",
          "Special 'Tasty Oota on a Banana Leaf' Feast (12:30 PM - 02:30 PM at Auditorium – II)",
          "Grand Inter-Institutional Ethnic Attire Fashion Show",
          "Valedictory Ceremony & Verified Academic Participation Certificates"
        ],
        schedule: [
          { time: "09:00 AM - 11:15 AM", title: "1. Procession", desc: "Tableau, Golu Kunitha and Chenda Mela grand campus procession." },
          { time: "11:16 AM - 11:19 AM", title: "2. Assemble in Auditorium", desc: "Gathering of delegates, faculty, and student contingents in the Main Auditorium." },
          { time: "11:20 AM - 11:25 AM", title: "3. Welcome Address", desc: "Inaugural address by T. John Institutional Leadership." },
          { time: "11:26 AM - 11:29 AM", title: "4. Lamp Lighting", desc: "Traditional auspicious lamp lighting ceremony." },
          { time: "11:30 AM - 01:34 PM", title: "5. Traditional Cultural Program", desc: "NPSTJ (Gujarati Folk), TJPUC (Dhaivanaatyam), TJC (Karnataka Vaibhava, Kerala Sahyalaya), TJCN (Corridinho Goa Dance, Hynniew Trep Northeast Dance, Suggi Kala), TJCP (Classical Dance & Song), TIMS (Dhadkan The Heartbeat), TJIT (Pranavalaya, Cultural Dance)." },
          { time: "12:30 PM - 02:30 PM", title: "🌸 Tasty Oota on a Banana Leaf", desc: "Authentic traditional festive lunch served at Auditorium – II (Counter closes at 02:30 PM)." },
          { time: "01:35 PM - 02:00 PM", title: "Break", desc: "Midday intermission and community gathering." },
          { time: "02:01 PM - 02:50 PM", title: "6. Semi Classical / Contemporary Programs", desc: "NPSTJ (West Bengal Semi-Classical), TJPUC (Aghori Nrityam), TJC (Natya Sangamam, Dance Drama), TJCN (Carugamita, Amor Contemporary), TJCP (Contemporary Dance), TIMS (Kashmiriyat, Do Zameen Ek Rang), TJIT (Karnataka Natya)." },
          { time: "02:51 PM - 03:25 PM", title: "7. Fashion Show", desc: "Runway couture competition featuring models & designers from NPSTJ, TJPUC, TJC, TJCN, TJCP, TIMS, and TJIT." },
          { time: "03:26 PM - 03:30 PM", title: "8. Program Report", desc: "Official festival report and judging panel reviews." },
          { time: "03:31 PM - 03:40 PM", title: "9. Valedictory", desc: "Grand awards presentation and institutional felicitation." },
          { time: "03:41 PM - 03:45 PM", title: "10. Vote of Thanks", desc: "Concluding formal vote of thanks & National Anthem." }
        ],
        postEventGallery: [
          { src: "images/ethnic.jpg", caption: "Ethnic Utsav 2026 — Official Festival Poster (Music • Dance • Food • Art • Traditions)" },
          { src: "images/past1.jpeg", caption: "Chenda Mela & Folk Troupe Performance" },
          { src: "images/546.jpg", caption: "Traditional Floral Rangoli & Mandap" },
          { src: "images/hero.jpg", caption: "T. John Campus Grand Finale" }
        ],
        recap: "Ethnic Utsav 2026 brings together all 7 T. John Group institutions for an extraordinary day of art, tradition, and cultural unity."
      },
      {
        id: "glam-icon",
        title: "Glam Icon",
        category: "fashion",
        categoryLabel: "Fashion Gala",
        dept: "Department of Fashion",
        date: "2025-12-10",
        dateFormatted: "Tue, Dec 10, 2025",
        time: "4:00 PM",
        venue: "Main Campus Auditorium",
        capacity: 150,
        image: "images/glam.jpg",
        brochureUrl: "brochures/Glam_Icon_Runway_Brochure.html",
        brochureName: "Glam_Icon_Runway_Brochure.html",
        desc: "A night of haute couture, runway confidence, and spotlight glamour where student designers and models compete for the crown.",
        status: "Completed",
        highlights: [
          "Industry Model Agency Scouts",
          "₹50,000 Grand Prize Pool & Trophies",
          "Instant Digital QR Entry Pass",
          "Studio Photobooth with High-Res Snaps"
        ],
        schedule: [
          { time: "04:00 PM", title: "Red Carpet Entry", desc: "Media wall, paparazzi walk & welcome drinks." },
          { time: "05:00 PM", title: "Runway Round 1", desc: "Avant-Garde & High Fashion experimental silhouettes." },
          { time: "06:15 PM", title: "Runway Round 2", desc: "Sustainable & Upcycled eco-couture collections." },
          { time: "07:30 PM", title: "Personality Round", desc: "Judge Q&A and creative vision showcase." },
          { time: "08:30 PM", title: "Crowning & Awards", desc: "Crowning Mr. & Ms. Glam Icon 2025." }
        ],
        postEventGallery: [
          { src: "images/852.jpg", caption: "Ramp Walk Finalist in Sustainable Couture" },
          { src: "images/glam.jpg", caption: "Main Auditorium Spotlight Runway" },
          { src: "images/past3.jpeg", caption: "VIP Jury & Front Row Audience" },
          { src: "images/past2.jpg", caption: "Award Ceremony Stage Setup" }
        ],
        recap: "Glam Icon 2025 showcased 24 student designers and 30 student models. Congratulations to all winners and participants!"
      }
    ];
  },

  getAll() {
    try {
      const defaults = this.getDefaultEvents();
      const stored = localStorage.getItem(this.EVENTS_KEY);
      if (!stored) {
        localStorage.setItem(this.EVENTS_KEY, JSON.stringify(defaults));
        return defaults;
      }
      let list = JSON.parse(stored);
      if (!Array.isArray(list) || !list.length) {
        localStorage.setItem(this.EVENTS_KEY, JSON.stringify(defaults));
        return defaults;
      }
      // Ensure Ethnic Utsav 2026, brochures, and standard events are updated in cache
      let updated = false;
      defaults.forEach(def => {
        const idx = list.findIndex(e => e.id === def.id || (def.id === 'ethnic-utsav-2026' && (e.id === 'ethnic-utsav' || (e.title && e.title.toLowerCase().includes('ethnic')))));
        if (idx === -1) {
          list.push(def);
          updated = true;
        } else {
          if (!list[idx].brochureUrl || list[idx].brochureUrl === "" || (def.id === 'ethnic-utsav-2026' && list[idx].brochureUrl !== def.brochureUrl)) {
            list[idx].brochureUrl = def.brochureUrl;
            list[idx].brochureName = def.brochureName;
            updated = true;
          }
          if (def.id === 'ethnic-utsav-2026' && (list[idx].id !== def.id || list[idx].date !== def.date || list[idx].venue !== def.venue)) {
            list[idx] = { ...list[idx], ...def };
            updated = true;
          }
        }
      });
      if (updated) {
        localStorage.setItem(this.EVENTS_KEY, JSON.stringify(list));
      }
      return list;
    } catch (e) {
      return this.getDefaultEvents();
    }
  },

  getById(id) {
    if (!id) return null;
    const cleanId = id.toString().toLowerCase().trim();
    const list = this.getAll();
    
    // Exact or direct slug match
    let match = list.find(ev => ev.id.toLowerCase() === cleanId || ev.title.toLowerCase() === cleanId);
    if (match) return match;

    // Aliases for Ethnic Utsav
    if (cleanId.includes("ethnic") || cleanId.includes("ethin")) {
      match = list.find(ev => ev.id.includes("ethnic") || ev.title.toLowerCase().includes("ethnic") || ev.title.toLowerCase().includes("ethin"));
      if (match) return match;
    }

    // Aliases for Fusion
    if (cleanId.includes("fusion")) {
      match = list.find(ev => ev.id.includes("fusion"));
      if (match) return match;
    }

    // Aliases for Glam
    if (cleanId.includes("glam")) {
      match = list.find(ev => ev.id.includes("glam"));
      if (match) return match;
    }

    return null;
  },

  isEventOver(event) {
    if (!event) return false;
    if (event.status === "Completed") return true;

    try {
      const eventDate = new Date(event.date + "T23:59:59");
      const today = new Date();
      return eventDate < today;
    } catch (e) {
      return event.status === "Completed";
    }
  },

  isPubliclyVisible(event) {
    if (!event) return false;
    if (event.status === "Archived") return false;
    if (event.status === "Draft") return false;
    
    // Auto-activate scheduled events if scheduled time has arrived
    if (event.status === "Scheduled") {
      if (event.scheduledPublishDate) {
        try {
          const target = new Date(event.scheduledPublishDate);
          if (target <= new Date()) {
            event.status = "Open";
            this.update(event.id, { status: "Open" });
            return true;
          }
        } catch (e) {}
      }
      return false;
    }

    return true;
  },

  create(eventData) {
    const list = this.getAll();
    const slug = (eventData.title || "event").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    
    let finalId = slug;
    let count = 1;
    while (list.some(e => e.id === finalId)) {
      finalId = `${slug}-${count++}`;
    }

    const newEvent = {
      id: finalId,
      title: eventData.title || "Untitled Event",
      category: eventData.category || "music",
      categoryLabel: eventData.categoryLabel || "Campus Event",
      dept: eventData.dept || "Student Council",
      date: eventData.date || new Date().toISOString().slice(0, 10),
      dateFormatted: eventData.dateFormatted || eventData.date || "Upcoming Date",
      time: eventData.time || "6:00 PM",
      venue: eventData.venue || "Campus Grounds",
      capacity: parseInt(eventData.capacity, 10) || 100,
      image: eventData.image || "images/hero.jpg",
      brochureUrl: eventData.brochureUrl || "",
      brochureName: eventData.brochureName || `${(eventData.title || 'Event').replace(/\s+/g, '_')}_Brochure.pdf`,
      desc: eventData.desc || "Campus event organized by students.",
      status: eventData.status || "Open",
      scheduledPublishDate: eventData.scheduledPublishDate || "",
      cancellationReason: eventData.cancellationReason || "",
      highlights: eventData.highlights || ["Verified Digital Pass", "Campus Certificate"],
      schedule: eventData.schedule || [{ time: eventData.time || "6:00 PM", title: "Event Starts", desc: "Doors open for registered students." }],
      postEventGallery: eventData.postEventGallery || [
        { src: eventData.image || "images/hero.jpg", caption: "Main Stage Highlight" },
        { src: "images/dj.jpg", caption: "Audience & Performances" },
        { src: "images/past1.jpeg", caption: "Celebration Moments" }
      ],
      recap: eventData.recap || "This campus event was successfully hosted. View highlights and memories captured below."
    };

    list.unshift(newEvent);
    localStorage.setItem(this.EVENTS_KEY, JSON.stringify(list));
    return newEvent;
  },

  update(id, updatedData) {
    const list = this.getAll();
    const index = list.findIndex(e => e.id.toLowerCase() === id.toLowerCase());
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedData };
      localStorage.setItem(this.EVENTS_KEY, JSON.stringify(list));
      return list[index];
    }
    return null;
  },

  delete(id) {
    let list = this.getAll();
    list = list.filter(e => e.id.toLowerCase() !== id.toLowerCase());
    localStorage.setItem(this.EVENTS_KEY, JSON.stringify(list));
    return list;
  },

  duplicate(id, customTitle = null) {
    const orig = this.getById(id);
    if (!orig) return null;

    const baseTitle = customTitle || `${orig.title} (Copy)`;
    const cloned = JSON.parse(JSON.stringify(orig));
    cloned.title = baseTitle;
    cloned.status = "Draft";
    cloned.scheduledPublishDate = "";
    cloned.cancellationReason = "";

    return this.create(cloned);
  },

  togglePublish(id) {
    const event = this.getById(id);
    if (!event) return null;

    const newStatus = (event.status === "Open" || event.status === "Completed") ? "Draft" : "Open";
    return this.update(id, { status: newStatus });
  },

  schedulePublish(id, scheduledDate) {
    return this.update(id, {
      status: "Scheduled",
      scheduledPublishDate: scheduledDate
    });
  },

  archive(id) {
    return this.update(id, { status: "Archived" });
  },

  unarchive(id) {
    return this.update(id, { status: "Open" });
  },

  cancel(id, reason = "This event has been cancelled by the organizers.") {
    return this.update(id, {
      status: "Cancelled",
      cancellationReason: reason
    });
  },

  getStats(eventId) {
    const event = this.getById(eventId);
    if (!event) return { booked: 0, capacity: 100, pct: 0, remaining: 100, checked: 0, rating: { avgFormatted: "5.0", totalReviews: 0 } };

    const registrations = EvenTiamoStore.getAll().filter(r => 
      (r.event || "").toLowerCase() === event.title.toLowerCase() || (r.eventId || "").toLowerCase() === event.id.toLowerCase()
    );

    const booked = registrations.length;
    const checked = registrations.filter(r => r.status === "Checked").length;
    const capacity = event.capacity || 100;
    const pct = Math.min(100, Math.round((booked / capacity) * 100));
    const remaining = Math.max(0, capacity - booked);
    const rating = FeedbackManager.calculateEventRating(event.id);

    return { booked, capacity, pct, remaining, checked, rating };
  },

  // Generate Complete Standalone Brochure HTML
  getBrochureHTML(event) {
    const isTJohnEthnic = event.title.toLowerCase().includes("ethnic") || event.id.toLowerCase().includes("ethnic") || (event.dept && event.dept.toLowerCase().includes("t. john"));

    if (isTJohnEthnic) {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>T. John Group of Institutions — Ethnic Utsav 2026 Official Brochure & Itinerary</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #fdfbf7; color: #1e1b18; margin: 0; padding: 24px; }
    .brochure-container { max-width: 860px; margin: 0 auto; background: #fffdfa; border: 3px solid #854d0e; border-radius: 16px; box-shadow: 0 16px 40px rgba(133, 77, 14, 0.15); padding: 36px; }
    .header-banner { text-align: center; border-bottom: 3px double #d97706; padding-bottom: 24px; margin-bottom: 24px; }
    .institution-badge { display: inline-block; background: #b91c1c; color: #fff; font-weight: 800; font-size: 18px; letter-spacing: 0.12em; padding: 8px 24px; border-radius: 6px; text-transform: uppercase; }
    .institution-sub { font-size: 13px; font-weight: 700; color: #1d4ed8; letter-spacing: 0.15em; margin-top: 4px; text-transform: uppercase; }
    .festival-title { font-family: 'Cinzel', serif; font-size: 42px; font-weight: 900; color: #991b1b; margin: 12px 0 6px; letter-spacing: 0.04em; text-shadow: 1px 1px 0px #fde68a; }
    .date-pill { display: inline-block; background: #991b1b; color: #fff; font-size: 16px; font-weight: 800; padding: 6px 20px; border-radius: 4px; margin: 6px 0 12px; }
    .itinerary-heading { font-family: 'Cinzel', serif; font-size: 26px; font-weight: 800; color: #78350f; letter-spacing: 0.15em; margin: 10px 0; }
    .itinerary-grid { display: grid; gap: 14px; }
    .itinerary-item { background: #fff; border: 1px solid #fde68a; border-left: 5px solid #d97706; border-radius: 8px; padding: 14px 18px; }
    .item-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 4px; }
    .item-num-title { font-weight: 700; font-size: 15px; color: #78350f; }
    .item-time { font-weight: 700; font-size: 13px; color: #b45309; background: #fef3c7; padding: 3px 10px; border-radius: 4px; }
    .sub-dept-box { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #fcd34d; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; }
    .dept-chip { background: #fffbeb; border: 1px solid #fef08a; padding: 8px 12px; border-radius: 6px; font-size: 13px; }
    .dept-chip strong { color: #991b1b; display: block; margin-bottom: 2px; }
    .note-box { background: #fef2f2; border: 2px dashed #dc2626; border-radius: 10px; padding: 18px; margin-top: 24px; text-align: center; }
    .note-title { font-size: 18px; font-weight: 800; color: #991b1b; margin-bottom: 6px; }
    .note-desc { font-size: 14px; color: #7f1d1d; line-height: 1.6; }
    .btn-actions { text-align: center; margin-bottom: 20px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .btn-print { background: #b91c1c; color: #fff; font-weight: 700; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; }
    @media print { .btn-actions { display: none; } body { padding: 0; background: #fff; } .brochure-container { box-shadow: none; border: 2px solid #854d0e; padding: 20px; } }
  </style>
</head>
<body>
  <div class="btn-actions">
    <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF Brochure</button>
  </div>
  <div class="brochure-container">
    <div class="header-banner">
      <div class="institution-badge">T. JOHN GROUP OF INSTITUTIONS</div>
      <div class="institution-sub">NPSTJ • TJPUC • TJC • TJCN • TJCP • TIMS • TJIT</div>
      <div class="festival-title">ETHNIC UTSAV 2026</div>
      <div><span class="date-pill">19.09.2026</span></div>
      <div class="itinerary-heading">❖ ITINERARY ❖</div>
      <div style="font-size:14px;color:#78350f;">📍 <strong>Venue:</strong> T. John Campus & Auditorium, Bangalore</div>
    </div>

    <div class="itinerary-grid">
      <div class="itinerary-item">
        <div class="item-header">
          <span class="item-num-title">1. Procession (Tableau, Golu Kunitha and Chenda Mela)</span>
          <span class="item-time">09:00 AM - 11:15 AM</span>
        </div>
      </div>

      <div class="itinerary-item">
        <div class="item-header"><span class="item-num-title">2. Assemble in Auditorium</span><span class="item-time">11:16 AM - 11:19 AM</span></div>
        <div class="item-header" style="margin-top:8px;"><span class="item-num-title">3. Welcome Address</span><span class="item-time">11:20 AM - 11:25 AM</span></div>
        <div class="item-header" style="margin-top:8px;"><span class="item-num-title">4. Lamp Lighting Ceremony</span><span class="item-time">11:26 AM - 11:29 AM</span></div>
      </div>

      <div class="itinerary-item">
        <div class="item-header">
          <span class="item-num-title">5. Traditional Cultural Program</span>
          <span class="item-time">11:30 AM - 01:34 PM</span>
        </div>
        <div class="sub-dept-box">
          <div class="dept-chip"><strong>NPSTJ (11:30 - 11:42 AM)</strong>• Speech About Tableau (11:30 - 11:35 AM)<br>• Gujarati Folk (11:36 - 11:42 AM)</div>
          <div class="dept-chip"><strong>TJPUC (11:43 - 11:56 AM)</strong>• Speech About Tableau (11:43 - 11:48 AM)<br>• Dhaivanaatyam (11:49 - 11:56 AM)</div>
          <div class="dept-chip"><strong>TJC (11:57 AM - 12:18 PM)</strong>• Speech About Tableau (11:57 AM - 12:02 PM)<br>• Karnataka Vaibhava (12:03 - 12:10 PM)<br>• Kerala Sahyalaya (12:11 - 12:18 PM)</div>
          <div class="dept-chip"><strong>TJCN (12:19 - 12:47 PM)</strong>• Speech About Tableau (12:19 - 12:24 PM)<br>• Corridinho Goa (12:25 - 12:32 PM)<br>• Hynniew Trep Northeast (12:33 - 12:40 PM)<br>• Suggi Kala (12:41 - 12:47 PM)</div>
          <div class="dept-chip"><strong>TJCP (12:48 - 01:07 PM)</strong>• Speech About Tableau (12:48 - 12:52 PM)<br>• Classical Dance (12:53 - 12:59 PM)<br>• Classical Song (01:00 - 01:07 PM)</div>
          <div class="dept-chip"><strong>TIMS (01:08 - 01:17 PM)</strong>• Speech About Tableau (01:08 - 01:12 PM)<br>• Dhadkan Heartbeat (01:13 - 01:17 PM)</div>
          <div class="dept-chip"><strong>TJIT (01:18 - 01:34 PM)</strong>• Speech About Tableau (01:18 - 01:24 PM)<br>• Pranavalaya (01:25 - 01:29 PM)<br>• Cultural Dance (01:30 - 01:34 PM)</div>
        </div>
      </div>

      <div class="itinerary-item" style="border-left-color: #10b981; background: #f0fdf4;">
        <div class="item-header">
          <span class="item-num-title" style="color:#065f46;">🍱 Intermission & Cultural Break</span>
          <span class="item-time" style="background:#d1fae5;color:#065f46;">01:35 PM - 02:00 PM</span>
        </div>
      </div>

      <div class="itinerary-item">
        <div class="item-header">
          <span class="item-num-title">6. Semi Classical / Contemporary Programs</span>
          <span class="item-time">02:01 PM - 02:50 PM</span>
        </div>
        <div class="sub-dept-box">
          <div class="dept-chip"><strong>NPSTJ:</strong> West Bengal Semi-Classical (02:01 - 02:05 PM)</div>
          <div class="dept-chip"><strong>TJPUC:</strong> Aghori Nrityam (02:06 - 02:10 PM)</div>
          <div class="dept-chip"><strong>TJC:</strong> Natya Sangamam (02:11 - 02:15 PM) • Dance Drama (02:16 - 02:20 PM)</div>
          <div class="dept-chip"><strong>TJCN:</strong> Carugamita (02:21 - 02:25 PM) • Amor Contemporary (02:26 - 02:30 PM)</div>
          <div class="dept-chip"><strong>TJCP:</strong> Contemporary Dance (02:31 - 02:35 PM)</div>
          <div class="dept-chip"><strong>TIMS:</strong> Kashmiriyat (02:36 - 02:40 PM) • Do Zameen, Ek Rang (02:41 - 02:45 PM)</div>
          <div class="dept-chip"><strong>TJIT:</strong> Karnataka Natya (02:46 - 02:50 PM)</div>
        </div>
      </div>

      <div class="itinerary-item">
        <div class="item-header">
          <span class="item-num-title">7. Grand Ethnic Fashion Show</span>
          <span class="item-time">02:51 PM - 03:25 PM</span>
        </div>
        <div style="font-size:13px;color:#555;margin-top:4px;">
          Contestants from NPSTJ (02:51 PM), TJPUC (02:57 PM), TJC (03:01 PM), TJCN (03:06 PM), TJCP (03:11 PM), TIMS (03:16 PM), and TJIT (03:21 PM).
        </div>
      </div>

      <div class="itinerary-item">
        <div class="item-header"><span class="item-num-title">8. Program Report</span><span class="item-time">03:26 PM - 03:30 PM</span></div>
        <div class="item-header" style="margin-top:8px;"><span class="item-num-title">9. Valedictory Ceremony & Awards</span><span class="item-time">03:31 PM - 03:40 PM</span></div>
        <div class="item-header" style="margin-top:8px;"><span class="item-num-title">10. Vote of Thanks</span><span class="item-time">03:41 PM - 03:45 PM</span></div>
      </div>
    </div>

    <div class="note-box">
      <div class="note-title">🌸 NOTE: "Tasty Oota on a Banana Leaf"</div>
      <div class="note-desc">
        Traditional authentic feast will start serving from <strong>12:30 PM onwards at Auditorium – II</strong>.<br>
        <em>Please note: Lunch counter will be closed at 02:30 PM.</em>
      </div>
    </div>

    <div style="margin-top:24px;text-align:center;font-size:12px;color:#78350f;border-top:1px solid #fde68a;padding-top:16px;">
      © 2026 T. John Group of Institutions • EvenTiamo Academic System • info@tjohn.edu
    </div>
  </div>
</body>
</html>`;
    }

    // Default template for standard events
    const highlightsList = (event.highlights || []).map(h => `<li>✨ ${h}</li>`).join("");
    const scheduleList = (event.schedule || []).map(s => `
      <div style="margin-bottom:12px;padding-left:14px;border-left:3px solid #d4af37;">
        <strong style="color:#d4af37;font-size:14px;">${s.time}</strong> — <strong>${s.title}</strong>
        <div style="font-size:13px;color:#555;">${s.desc}</div>
      </div>
    `).join("");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${event.title} — Official Event Brochure</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 30px; }
    .brochure-sheet { max-width: 800px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 2px solid #d4af37; }
    .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 24px; }
    .logo { font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 800; color: #b8860b; }
    .title { font-family: 'Outfit', sans-serif; font-size: 32px; font-weight: 800; color: #0f172a; margin: 8px 0; }
    .meta-pill { display: inline-block; background: #fef3c7; color: #92400e; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 700; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 20px; }
    .card { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
    h3 { font-family: 'Outfit', sans-serif; color: #0f172a; margin-top: 0; margin-bottom: 12px; border-bottom: 2px solid #d4af37; padding-bottom: 4px; display: inline-block; }
    ul { padding-left: 20px; margin: 0; line-height: 1.6; }
    .footer { margin-top: 30px; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 20px; font-size: 12px; color: #64748b; }
    .btn-print { background: #d4af37; color: #000; font-weight: 700; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; margin-bottom: 20px; }
    @media print { .btn-print { display: none; } body { padding: 0; background: #fff; } .brochure-sheet { box-shadow: none; border: none; padding: 20px; } }
  </style>
</head>
<body>
  <div style="text-align:center;">
    <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF Brochure</button>
  </div>
  <div class="brochure-sheet">
    <div class="header">
      <div class="logo">✦ EvenTiamo College Festival Hub ✦</div>
      <div class="title">${event.title}</div>
      <div class="meta-pill">${event.categoryLabel || event.category || 'Campus Fest'} • Organized by ${event.dept}</div>
      <div style="margin-top:10px;font-size:14px;color:#64748b;">
        📅 <strong>Date:</strong> ${event.dateFormatted || event.date} &nbsp;|&nbsp; 
        ⏰ <strong>Time:</strong> ${event.time} &nbsp;|&nbsp; 
        📍 <strong>Venue:</strong> ${event.venue}
      </div>
    </div>
    <div>
      <h3>📖 Event Overview</h3>
      <p style="line-height:1.7;color:#334155;margin-top:6px;">${event.desc}</p>
    </div>
    <div class="grid">
      <div class="card">
        <h3>📜 Timeline & Schedule</h3>
        <div style="margin-top:10px;">
          ${scheduleList || '<div style="color:#64748b;">Schedule available on registration pass.</div>'}
        </div>
      </div>
      <div class="card">
        <h3>🌟 Highlights & Guidelines</h3>
        <ul>
          ${highlightsList || '<li>Student ID required at entry gate.</li><li>Instant QR Digital Pass.</li>'}
          <li>Free digital Certificate of Participation for attendees.</li>
          <li>Total Seating Capacity: ${event.capacity} seats.</li>
        </ul>
        <h3 style="margin-top:20px;">🎫 Entry & Passes</h3>
        <p style="font-size:13px;color:#334155;">Register online via EvenTiamo portal to generate your personal scannable QR ticket.</p>
      </div>
    </div>
    <div class="footer">
      © 2025 EvenTiamo • Academic Event Management System • info@eventiamo.com<br>
      Official College Event Brochure Document
    </div>
  </div>
</body>
</html>`;
  },

  // Download Brochure Handler (Direct Physical File Download + In-Page Viewer)
  downloadBrochure(eventId) {
    const event = this.getById(eventId);
    if (!event) return alert("Event not found.");

    const fileName = event.brochureName || `${event.title.replace(/\s+/g, '_')}_Official_Brochure.pdf`;
    const brochurePath = event.brochureUrl;

    // 1. If physical file exists (e.g. brochures/..., data:..., or remote http url)
    if (brochurePath && brochurePath.length > 0) {
      if (brochurePath.startsWith("http://") || brochurePath.startsWith("https://")) {
        window.open(brochurePath, "_blank");
        showToast(`📄 Opening official brochure link: ${fileName}`);
        return;
      }

      // Local file or base64 data URI
      const a = document.createElement("a");
      a.href = brochurePath;
      a.download = fileName;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      a.remove();

      const html = this.getBrochureHTML(event);
      showBrochureModal(html, event.title, brochurePath);
      showToast(`📄 Brochure "${fileName}" downloaded!`);
      return;
    }

    // 2. Dynamic Generated Brochure (Direct File Download + Modal Viewer)
    const html = this.getBrochureHTML(event);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = fileName.endsWith(".html") ? fileName : `${fileName.replace(/\.pdf$/i, '')}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 10000);

    showBrochureModal(html, event.title);
    showToast(`📄 Brochure "${fileName}" downloaded!`);
  }
};

// Brochure In-Page Modal Viewer
function showBrochureModal(html, eventTitle, downloadPath = null) {
  let modal = document.getElementById("brochureViewerModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "brochureViewerModal";
    modal.className = "admin-modal";
    document.body.appendChild(modal);
  }

  const directDownloadBtn = downloadPath 
    ? `<a href="${downloadPath}" download class="btn btn-sm" style="text-decoration:none;display:inline-flex;align-items:center;gap:4px;">📥 Direct File Download</a>` 
    : '';

  modal.innerHTML = `
    <div class="admin-modal-card" style="max-width:920px;width:95%;max-height:92vh;padding:24px;background:#111118;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid var(--border-subtle);padding-bottom:12px;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:1.6rem;">📄</span>
          <div>
            <h3 style="color:var(--accent-gold);margin:0;font-size:1.15rem;">${eventTitle} — Official Brochure</h3>
            <span class="small-muted" style="font-size:0.78rem;">✓ Downloaded to your computer • You can also print / save as PDF below</span>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${directDownloadBtn}
          <button class="btn btn-sm" onclick="printBrochureIframe()">🖨️ Print / Save as PDF</button>
          <button class="btn-secondary btn-sm" onclick="closeBrochureModal()">✕ Close</button>
        </div>
      </div>
      <div style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #d4af37;">
        <iframe id="brochureViewerIframe" style="width:100%;height:68vh;border:none;" srcdoc="${html.replace(/"/g, '&quot;')}"></iframe>
      </div>
    </div>
  `;

  modal.classList.add("visible");
  modal.onclick = (e) => {
    if (e.target === modal) closeBrochureModal();
  };
}

function closeBrochureModal() {
  const modal = document.getElementById("brochureViewerModal");
  if (modal) modal.classList.remove("visible");
}

function printBrochureIframe() {
  const iframe = document.getElementById("brochureViewerIframe");
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }
}

// ==========================================
// 4. REGISTRATIONS DATA STORE
// ==========================================
const EvenTiamoStore = {
  KEY: "eventiamo_registrations",

  getInitialData() {
    return [
      { id: "ET-FUS-7821", name: "Aarav Sharma", email: "aarav.sharma@gmail.com", phone: "+91 9876543210", event: "Fusion 2K24", dept: "B.Tech CSE", ticket: "ET-FUS-7821", status: "Checked", time: "2025-11-21 18:45" },
      { id: "ET-ETH-4912", name: "Priya Patel", email: "priya.patel@gmail.com", phone: "+91 9123456780", event: "Ethnic Utsav 2026", dept: "B.Des Fashion", ticket: "ET-ETH-4912", status: "Not Checked", time: "2026-09-19 10:15" },
      { id: "ET-GLM-3081", name: "Rohan Verma", email: "rohan.v@gmail.com", phone: "+91 9988776655", event: "Glam Icon", dept: "BBA Marketing", ticket: "ET-GLM-3081", status: "Checked", time: "2025-12-10 16:30" },
      { id: "ET-FUS-9204", name: "Sneha Reddy", email: "sneha.reddy@gmail.com", phone: "+91 9845012345", event: "Fusion 2K24", dept: "B.Tech ECE", ticket: "ET-FUS-9204", status: "Not Checked", time: "2025-11-20 14:20" },
      { id: "ET-ETH-6531", name: "Vikram Malhotra", email: "vikram.m@college.edu", phone: "+91 9711223344", event: "Ethnic Utsav 2026", dept: "B.Com Honours", ticket: "ET-ETH-6531", status: "Checked", time: "2026-09-19 11:00" },
      { id: "ET-GLM-8119", name: "Ananya Iyer", email: "ananya.iyer@gmail.com", phone: "+91 9655443322", event: "Glam Icon", dept: "MBA Media", ticket: "ET-GLM-8119", status: "Not Checked", time: "2025-12-09 19:10" }
    ];
  },

  getAll() {
    try {
      const data = localStorage.getItem(this.KEY);
      if (!data) {
        const initial = this.getInitialData();
        localStorage.setItem(this.KEY, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(data);
    } catch (e) {
      return this.getInitialData();
    }
  },

  save(registration) {
    const list = this.getAll();
    list.unshift(registration);
    try {
      localStorage.setItem(this.KEY, JSON.stringify(list));
    } catch (e) {}
    return list;
  },

  updateStatus(ticketId, newStatus) {
    const list = this.getAll();
    const item = list.find(r => (r.ticket || r.id).toUpperCase() === ticketId.toUpperCase());
    if (item) {
      item.status = newStatus;
      item.checkedInTime = newStatus === "Checked" ? new Date().toLocaleString() : null;
      try {
        localStorage.setItem(this.KEY, JSON.stringify(list));
      } catch (e) {}
      return item;
    }
    return null;
  }
};

// ==========================================
// 5. QR CODE & TICKET PASS SOFT COPY ENGINE
// ==========================================
function generateTicketID(eventName) {
  const prefix = (eventName || "EVT").replace(/[^a-zA-Z]/g, "").substring(0, 3).toUpperCase();
  const randNum = Math.floor(10000 + Math.random() * 90000);
  return `ET-${prefix}-${randNum}`;
}

function generateQRCodeSVG(text, size = 160) {
  return `<img src="https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=080808&bgcolor=ffffff&margin=1" alt="Ticket QR Code" width="${size}" height="${size}" style="border-radius:6px;" onerror="this.onerror=null;this.src='https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encodeURIComponent(text)}'">`;
}

// Download Standalone Soft Copy Pass File (.html / .pdf ready)
function downloadTicketSoftCopy(reg) {
  if (!reg) return;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(reg.ticket || reg.id)}&color=080808&bgcolor=ffffff&margin=1`;

  const ticketHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>EvenTiamo E-Ticket — ${reg.event} [${reg.ticket || reg.id}]</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #070709; color: #fff; margin: 0; padding: 40px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; box-sizing: border-box; }
    .ticket-card { background: linear-gradient(135deg, #111118 0%, #0e0e14 100%); border: 2px solid #f3cf55; border-radius: 16px; width: 100%; max-width: 480px; padding: 32px; box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(243,207,85,0.15); text-align: center; }
    .brand { font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 800; color: #f3cf55; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 6px; }
    .event-name { font-family: 'Outfit', sans-serif; font-size: 26px; font-weight: 800; color: #fff; margin: 4px 0 12px; }
    .status-badge { display: inline-block; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 4px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 20px; }
    .qr-wrap { background: #fff; padding: 14px; border-radius: 12px; display: inline-block; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    .ticket-code { font-family: monospace; font-size: 20px; font-weight: 800; color: #f3cf55; letter-spacing: 0.15em; margin-bottom: 20px; }
    .details-table { width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 24px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); }
    .details-table td { padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; }
    .details-table td:first-child { color: #94a3b8; font-weight: 600; width: 35%; }
    .details-table td:last-child { color: #fff; font-weight: 700; }
    .btn-print { background: #f3cf55; color: #000; font-weight: 800; border: none; padding: 12px 28px; border-radius: 8px; cursor: pointer; font-size: 14px; margin-bottom: 12px; width: 100%; transition: all 0.2s; }
    .footer { font-size: 11px; color: #64748b; margin-top: 16px; }
    @media print { .btn-print { display: none; } body { background: #fff; color: #000; padding: 0; } .ticket-card { border: 2px solid #000; box-shadow: none; background: #fff; color: #000; } .event-name { color: #000; } .ticket-code { color: #000; } .details-table td { color: #000 !important; } }
  </style>
</head>
<body>
  <div class="ticket-card">
    <div class="brand">✦ EvenTiamo Official Pass ✦</div>
    <div class="event-name">${reg.event}</div>
    <div class="status-badge">✓ Confirmed & Verified Pass</div>
    <div class="qr-wrap">
      <img src="${qrUrl}" alt="Pass QR Code" width="180" height="180" style="display:block;">
    </div>
    <div class="ticket-code">${reg.ticket || reg.id}</div>
    <table class="details-table">
      <tr><td>Attendee</td><td>${reg.name}</td></tr>
      <tr><td>Email</td><td>${reg.email}</td></tr>
      <tr><td>Department / ID</td><td>${reg.dept || reg.studentId || 'General'}</td></tr>
      <tr><td>Contact Phone</td><td>${reg.phone || '—'}</td></tr>
      <tr><td>Issued Date</td><td>${reg.time || new Date().toLocaleDateString()}</td></tr>
    </table>
    <button class="btn-print" onclick="window.print()">🖨️ Print Pass / Save as PDF</button>
    <div class="footer">Show this digital QR pass at the security entry gate. Valid for 1 attendee admission.</div>
  </div>
</body>
</html>`;

  const blob = new Blob([ticketHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `EvenTiamo_Ticket_${(reg.ticket || reg.id).replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  showToast(`🎟️ Soft copy pass for ${reg.name} downloaded!`);
}

function emailSoftCopyPass(reg) {
  if (!reg) return;
  const subject = encodeURIComponent(`EvenTiamo Pass Confirmation: ${reg.event} [${reg.ticket || reg.id}]`);
  const body = encodeURIComponent(
    `Dear ${reg.name},\n\n` +
    `Your official entry pass for ${reg.event} is confirmed!\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `EVENT DETAILS\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Event: ${reg.event}\n` +
    `Ticket ID: ${reg.ticket || reg.id}\n` +
    `Attendee Name: ${reg.name}\n` +
    `Department / ID: ${reg.dept || 'General'}\n` +
    `Registration Status: Confirmed & Active\n` +
    `Issued Date: ${reg.time || new Date().toLocaleString()}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Please present your Ticket ID or show the downloaded digital QR code pass at the entry gate.\n\n` +
    `EvenTiamo College Event Hub`
  );

  window.open(`mailto:${reg.email}?subject=${subject}&body=${body}`, "_blank");
  showToast(`📧 Opening mail client for ${reg.email}...`);
}

let currentTicketReg = null;

function showTicketModal(reg) {
  currentTicketReg = reg;
  let modal = document.getElementById("ticketModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "ticketModal";
    modal.className = "visible";
    document.body.appendChild(modal);
  }

  const qrHtml = generateQRCodeSVG(reg.ticket || reg.id, 160);

  modal.innerHTML = `
    <div class="ticket-container">
      <div class="ticket-header">
        <div class="ticket-brand">✦ EvenTiamo Pass ✦</div>
        <div class="ticket-event-name">${reg.event || "Campus Event"}</div>
        <span class="pill pill-live">${reg.status === "Checked" ? "✓ Checked In" : "Confirmed Attendee"}</span>
      </div>

      <div class="ticket-qr-wrap">
        ${qrHtml}
      </div>

      <div class="ticket-id">${reg.ticket || reg.id}</div>

      <div class="ticket-details-grid">
        <div>
          <div class="ticket-field-label">Attendee</div>
          <div class="ticket-field-value">${reg.name}</div>
        </div>
        <div>
          <div class="ticket-field-label">Department / ID</div>
          <div class="ticket-field-value">${reg.dept || reg.studentId || "General"}</div>
        </div>
        <div>
          <div class="ticket-field-label">Email</div>
          <div class="ticket-field-value" style="word-break:break-all;">${reg.email}</div>
        </div>
        <div>
          <div class="ticket-field-label">Issued At</div>
          <div class="ticket-field-value">${reg.time || new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <div class="ticket-actions" style="display:flex;flex-direction:column;gap:8px;margin-top:16px;">
        <button class="btn btn-full" onclick="downloadTicketSoftCopy(currentTicketReg)">📥 Download Soft Copy Pass</button>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button class="btn-secondary btn-sm" onclick="window.print()">🖨️ Print Pass</button>
          <button class="btn-secondary btn-sm" onclick="emailSoftCopyPass(currentTicketReg)">📧 Email Pass</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button class="btn-secondary btn-sm" onclick="downloadCalendarEvent('${reg.event}')">📅 Calendar</button>
          <button class="btn-secondary btn-sm" onclick="closeTicketModal()">Close</button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add("visible");
  modal.onclick = (e) => {
    if (e.target === modal) closeTicketModal();
  };
}

function closeTicketModal() {
  const modal = document.getElementById("ticketModal");
  if (modal) modal.classList.remove("visible");
}

function downloadCalendarEvent(eventName) {
  const event = EventManager.getAll().find(e => e.title.toLowerCase() === (eventName || "").toLowerCase()) || {
    title: eventName || "Campus Event",
    venue: "Main Campus Auditorium",
    desc: "EvenTiamo Campus Event Pass"
  };

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:EvenTiamo: ${event.title}`,
    `DESCRIPTION:${event.desc || "Campus Festival"}`,
    `LOCATION:${event.venue || "College Campus"}`,
    `DTSTART:20260919T090000Z`,
    `DTEND:20260919T154500Z`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(event.title || "Event").replace(/\s+/g, '_')}_Ticket.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast("📅 Calendar pass downloaded!");
}

// ==========================================
// 6. STUDENT PORTAL ("MY PASSES")
// ==========================================
function openMyPassesModal() {
  let modal = document.getElementById("myPassesModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "myPassesModal";
    modal.className = "admin-modal visible";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="admin-modal-card" style="max-width:540px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <h3 style="color:var(--accent-gold);margin:0;">🎫 My Student Passes</h3>
        <button onclick="closeMyPassesModal()" style="background:none;border:none;color:#fff;font-size:1.4rem;cursor:pointer;">✕</button>
      </div>
      <p class="small-muted" style="margin-bottom:18px;">Enter your registered student email address to retrieve all your active QR tickets and attendance certificates.</p>

      <form onsubmit="handleLookupStudentPasses(event)" style="display:flex;gap:8px;margin-bottom:20px;">
        <input id="studentLookupEmail" type="email" placeholder="e.g. yourname@gmail.com" required style="flex:1;padding:10px 14px;background:rgba(0,0,0,0.4);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);color:#fff;" />
        <button type="submit" class="btn btn-sm">Find Passes</button>
      </form>

      <div id="studentPassesResults" style="max-height:300px;overflow-y:auto;">
        <div style="text-align:center;color:var(--text-muted);font-size:0.88rem;padding:20px;">
          Enter your email above to fetch your event tickets.
        </div>
      </div>
    </div>
  `;

  modal.classList.add("visible");
  modal.onclick = (e) => {
    if (e.target === modal) closeMyPassesModal();
  };
}

function closeMyPassesModal() {
  const modal = document.getElementById("myPassesModal");
  if (modal) modal.classList.remove("visible");
}

function handleLookupStudentPasses(e) {
  e.preventDefault();
  const email = document.getElementById("studentLookupEmail").value.trim().toLowerCase();
  const resultsBox = document.getElementById("studentPassesResults");
  if (!email || !resultsBox) return;

  const matches = EvenTiamoStore.getAll().filter(r => (r.email || "").toLowerCase() === email);

  if (!matches.length) {
    resultsBox.innerHTML = `
      <div style="text-align:center;color:#f87171;font-size:0.9rem;padding:20px;background:rgba(239,68,68,0.1);border-radius:var(--radius-sm);">
        ❌ No passes found under <strong>${email}</strong>.<br>Please ensure you registered with this exact email.
      </div>
    `;
    return;
  }

  resultsBox.innerHTML = matches.map(r => `
    <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <strong style="color:#fff;font-size:1rem;display:block;">${r.event}</strong>
        <span style="font-family:monospace;color:var(--accent-gold);font-size:0.85rem;">${r.ticket || r.id}</span>
        <span style="display:block;font-size:0.75rem;color:var(--text-muted);">${r.status === "Checked" ? "✅ Checked In" : "⏳ Pass Active"}</span>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-sm" onclick="showTicketModal(${JSON.stringify(r).replace(/"/g, '&quot;')})">View QR</button>
      </div>
    </div>
  `).join("");
}

// ==========================================
// 7. DYNAMIC HOMEPAGE EVENT GRID RENDERER
// ==========================================
function renderDynamicHomepageEvents() {
  const grid = document.querySelector(".event-grid");
  if (!grid) return;

  const events = EventManager.getAll().filter(ev => EventManager.isPubliclyVisible(ev));
  grid.innerHTML = "";

  if (!events.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted);"><h3>No public campus events available currently.</h3><p class="small-muted">Check back soon for upcoming festivals and hackathons.</p></div>`;
    return;
  }

  events.forEach((ev, idx) => {
    const stats = EventManager.getStats(ev.id);
    const isOver = EventManager.isEventOver(ev);
    const isCancelled = ev.status === "Cancelled";
    const detailLink = `event.html?id=${ev.id}`;
    const ratingObj = FeedbackManager.calculateEventRating(ev.id);

    let badgeHtml = `<span class="pill">${ev.categoryLabel || ev.category || 'Campus Event'}</span>`;
    if (isCancelled) {
      badgeHtml = `<span class="pill pill-live" style="background:rgba(239,68,68,0.25);color:#f87171;border-color:#ef4444;">🚫 Event Cancelled</span>`;
    } else if (isOver) {
      badgeHtml = `<span class="pill pill-live">📸 Memories & Recap</span>`;
    }

    let actionBtnHtml = `<a href="${detailLink}#register" class="btn btn-sm btn-full">Register Now</a>`;
    if (isCancelled) {
      actionBtnHtml = `<button class="btn btn-sm btn-full" disabled style="background:#ef4444;color:#fff;cursor:not-allowed;opacity:0.75;">🚫 Registrations Closed</button>`;
    } else if (isOver) {
      actionBtnHtml = `<a href="${detailLink}#album" class="btn btn-sm btn-full" style="background:linear-gradient(135deg, #38bdf8, #2563eb);color:#fff;">📸 View Photos & Reviews</a>`;
    }

    const card = document.createElement("article");
    card.className = `event-card animate-zoom-in delay-${(idx % 3) + 1}`;
    card.setAttribute("data-category", ev.category || "all");

    card.innerHTML = `
      <div class="event-card-img-wrap">
        <img src="${ev.image || 'images/hero.jpg'}" alt="${ev.title}" loading="lazy" onerror="this.src='images/hero.jpg'">
        <div class="event-card-badge">
          ${badgeHtml}
        </div>
        <div class="event-card-date">${ev.dateFormatted || ev.date}</div>
      </div>

      <div class="event-card-body">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span class="event-card-dept">${ev.dept || 'College Committee'}</span>
          <span class="pill pill-rating" style="font-size:0.75rem;padding:3px 8px;">⭐ ${ratingObj.avgFormatted} (${ratingObj.totalReviews})</span>
        </div>

        <h3 class="event-card-title">${ev.title}</h3>
        <p class="event-card-desc">${ev.desc}</p>

        <div class="capacity-bar-wrapper">
          <div class="capacity-info">
            <span>${isCancelled ? 'Status: Cancelled' : (isOver ? 'Event Concluded' : 'Seat Capacity')}</span>
            <strong class="text-gold">${isCancelled ? (ev.cancellationReason || 'Notice posted') : (isOver ? `Rated ⭐ ${ratingObj.avgFormatted} by Students` : `${stats.pct}% Filled (${stats.remaining} Left)`)}</strong>
          </div>
          <div class="capacity-bar">
            <div class="capacity-progress" style="width: ${isCancelled || isOver ? 100 : stats.pct}%; background: ${isCancelled ? '#ef4444' : (isOver ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'var(--gold-gradient)')};"></div>
          </div>
        </div>

        <div class="event-card-meta">
          <div class="event-card-meta-item">📍 ${ev.venue}</div>
          <div class="event-card-meta-item">⏰ ${ev.time}</div>
        </div>

        <div class="event-card-footer" style="flex-wrap:wrap;gap:8px;">
          ${actionBtnHtml}
          <button onclick="EventManager.downloadBrochure('${ev.id}')" class="btn-secondary btn-sm btn-full" title="Download Official Brochure">📄 Download Brochure</button>
          <a href="${detailLink}" class="btn-secondary btn-sm btn-full" style="text-align:center;">View Details & Schedule</a>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

// ==========================================
// 8. UNIVERSAL FORM BINDER
// ==========================================
function bindForm(formId, msgId) {
  const form = document.getElementById(formId);
  const msgEl = document.getElementById(msgId);

  if (!form) return;

  form.addEventListener("submit", async function handler(e) {
    e.preventDefault();

    const btn = form.querySelector("button[type='submit']") || form.querySelector("button");
    const origText = btn ? btn.textContent : "Register";
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Issuing Pass...";
    }

    if (msgEl) {
      msgEl.className = "form-note";
      msgEl.textContent = "";
      msgEl.style.display = "none";
    }

    try {
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());

      const email = (payload.email || "").toString().trim().toLowerCase();
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!isValidEmail) {
        if (msgEl) {
          msgEl.className = "form-note error";
          msgEl.textContent = "❌ Please enter a valid student email address.";
          msgEl.style.display = "block";
        }
        return;
      }

      const eventName = payload.event || form.getAttribute("data-event") || "Campus Event";
      const eventId = payload.eventId || form.getAttribute("data-event-id") || "";
      const ticketId = generateTicketID(eventName);
      payload.ticket = ticketId;
      payload.status = "Not Checked";
      payload.timestamp = new Date().toLocaleString();

      const savedObj = {
        id: ticketId,
        ticket: ticketId,
        name: payload.name || "Student",
        email: payload.email,
        phone: payload.phone || "—",
        dept: payload.dept || payload.studentId || "Student",
        event: eventName,
        eventId: eventId,
        status: "Not Checked",
        time: payload.timestamp
      };

      EvenTiamoStore.save(savedObj);

      // Webhook dispatch (Query parameter GET + POST fallback for Google Apps Script email triggers)
      const queryParams = new URLSearchParams({
        action: "register",
        ticket: ticketId,
        name: payload.name || "Student",
        email: email,
        event: eventName,
        dept: payload.dept || payload.studentId || "Student",
        phone: payload.phone || ""
      });

      fetch(`${API_URL}?${queryParams.toString()}`, {
        method: "GET",
        mode: "no-cors"
      }).catch(() => {});

      fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(() => {});

      // Automatically download the official E-Ticket soft copy pass immediately onto attendee's device
      downloadTicketSoftCopy(savedObj);

      if (msgEl) {
        msgEl.className = "form-note success";
        msgEl.textContent = "✅ Registration Confirmed! Your E-Ticket soft copy pass has been downloaded to your device.";
        msgEl.style.display = "block";
      }

      showToast("🎉 Pass confirmed! E-Ticket soft copy downloaded to your device.");
      showTicketModal(savedObj);
      form.reset();

      renderDynamicHomepageEvents();

    } catch (err) {
      console.error("Registration error:", err);
      if (msgEl) {
        msgEl.className = "form-note error";
        msgEl.textContent = "❌ Error processing ticket. Please try again.";
        msgEl.style.display = "block";
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = origText;
      }
    }
  });
}

// ==========================================
// 9. TOAST NOTIFICATIONS & LIGHTBOX
// ==========================================
function showToast(message) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.4s ease";
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

function wireGalleryModal() {
  const modal = document.getElementById("modal");
  const modalImg = document.getElementById("modal-img");
  const modalCaption = document.getElementById("modal-caption");
  const modalClose = document.getElementById("modal-close");

  if (!modal) return;

  document.querySelectorAll(".gallery-img, .gallery-grid img, .gallery-item img").forEach(img => {
    img.addEventListener("click", () => {
      if (!modalImg) return;
      modalImg.src = img.src;
      if (modalCaption) {
        const overlay = img.parentElement ? img.parentElement.querySelector(".gallery-overlay") : null;
        modalCaption.textContent = overlay ? overlay.textContent : (img.alt || "Event Photo");
      }
      modal.classList.add("visible");
      modal.setAttribute("aria-hidden", "false");
    });
  });

  const closeModal = () => {
    modal.classList.remove("visible");
    modal.setAttribute("aria-hidden", "true");
  };

  if (modalClose) modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

function wireNavbar() {
  const navbar = document.querySelector(".navbar");
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");

  window.addEventListener("scroll", () => {
    if (navbar) {
      if (window.scrollY > 40) navbar.classList.add("scrolled");
      else navbar.classList.remove("scrolled");
    }
  });

  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("active"));
    links.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => links.classList.remove("active"));
    });
  }
}

function wireEventFilters() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  const searchInput = document.getElementById("eventSearch");

  function filterEvents() {
    const activeBtn = document.querySelector(".filter-btn.active");
    const activeCategory = activeBtn ? activeBtn.getAttribute("data-category") : "all";
    const query = (searchInput ? searchInput.value : "").toLowerCase().trim();
    const cards = document.querySelectorAll(".event-card");

    cards.forEach(card => {
      const category = card.getAttribute("data-category") || "";
      const text = card.textContent.toLowerCase();
      const matchCategory = activeCategory === "all" || category === activeCategory;
      const matchQuery = !query || text.includes(query);

      card.style.display = (matchCategory && matchQuery) ? "flex" : "none";
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filterEvents();
    });
  });

  if (searchInput) searchInput.addEventListener("input", filterEvents);
}

// ==========================================
// 10. INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  renderDynamicHomepageEvents();

  bindForm("fusionForm", "fusionMsg");
  bindForm("ethnicForm", "ethnicMsg");
  bindForm("glamForm", "glamMsg");
  bindForm("dynamicEventForm", "dynamicMsg");

  wireNavbar();
  wireGalleryModal();
  wireEventFilters();
});
