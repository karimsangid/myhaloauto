/* ============================================================
   MY HALO AUTO — Live Google Reviews Loader
   ============================================================
   Pulls live reviews and rating from Google Places API (New) and
   updates the reviews section + hero rating + Schema.org JSON-LD.
   Falls back silently to the static HTML if anything goes wrong.

   ── ONE-TIME SETUP (~10 min) ──
   1. Go to https://console.cloud.google.com/ and create a project
      (e.g. "myhaloauto-website")
   2. APIs & Services → Library → enable BOTH:
        • "Maps JavaScript API"
        • "Places API (New)"
   3. APIs & Services → Credentials → Create Credentials → API Key
   4. Click the new key → Application restrictions → "HTTP referrers"
        Add: https://myhaloauto.com/*
        Add: https://www.myhaloauto.com/*
        (Optionally add http://localhost:* for local testing)
   5. API restrictions → "Restrict key" → select Maps JavaScript API
      AND Places API (New)
   6. Save the key, then paste it into REVIEWS_CONFIG.apiKey below
   7. (Strongly recommended) Set up a budget alert at $5/mo at:
      Billing → Budgets & alerts → Create budget

   ── COSTS ──
   Each unique visitor triggers ONE Places Details call (cached for
   6 hours in their browser). Places Details w/ reviews ≈ $0.017 per
   call. Google Cloud's $200/mo free credit covers ~11,000 fresh
   loads/month. For a small local business this should be free.
   ============================================================ */

const REVIEWS_CONFIG = {
  // ⚠️ Paste your Google Cloud API key here:
  apiKey: 'YOUR_GOOGLE_MAPS_API_KEY',

  // Either set placeId directly (faster, no search) OR leave blank
  // and the script will search by name + location bias.
  placeId: '', // e.g. 'ChIJB6PL22hLtokRCPGD46MdlIM'

  // Used only if placeId is blank:
  searchQuery: 'My Halo Auto',
  searchLocation: { lat: 38.8553665, lng: -77.358306 }, // Northern VA

  // How long to cache per visitor before re-fetching from Google.
  // Lower = fresher reviews, higher = lower API cost. 6 hours is a
  // good default.
  cacheTtlMs: 6 * 60 * 60 * 1000,
  cacheKey: 'mha_reviews_v1',
};

(function bootstrap() {
  const k = REVIEWS_CONFIG.apiKey;
  if (!k || k === 'YOUR_GOOGLE_MAPS_API_KEY') {
    console.info('[MHA Reviews] No API key configured — using static fallback.');
    return;
  }
  if (window.google && window.google.maps) {
    window.__initGoogleReviews();
    return;
  }
  const s = document.createElement('script');
  s.src =
    'https://maps.googleapis.com/maps/api/js' +
    '?key=' + encodeURIComponent(k) +
    '&v=weekly' +
    '&libraries=places' +
    '&loading=async' +
    '&callback=__initGoogleReviews';
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
})();

window.__initGoogleReviews = async function () {
  try {
    const cached = readCache();
    if (cached) {
      applyData(cached);
      return;
    }
    const data = await fetchPlaceData();
    if (!data || (!data.rating && !(data.reviews && data.reviews.length))) {
      throw new Error('Empty place data');
    }
    writeCache(data);
    applyData(data);
  } catch (err) {
    console.warn('[MHA Reviews] Live fetch failed, keeping static fallback:', err);
  }
};

async function fetchPlaceData() {
  const { Place } = await google.maps.importLibrary('places');
  let place;

  if (REVIEWS_CONFIG.placeId) {
    place = new Place({ id: REVIEWS_CONFIG.placeId });
    await place.fetchFields({
      fields: ['displayName', 'rating', 'userRatingCount', 'reviews'],
    });
  } else {
    const result = await Place.searchByText({
      textQuery: REVIEWS_CONFIG.searchQuery,
      fields: ['id', 'displayName', 'rating', 'userRatingCount', 'reviews', 'location'],
      locationBias: {
        center: REVIEWS_CONFIG.searchLocation,
        radius: 50000, // 50km bias
      },
      maxResultCount: 1,
    });
    if (!result.places || !result.places.length) throw new Error('No matching place found');
    place = result.places[0];
  }

  return {
    rating: place.rating || null,
    count: place.userRatingCount || 0,
    reviews: (place.reviews || []).map(normalizeReview),
  };
}

function normalizeReview(r) {
  const author = (r.authorAttribution && r.authorAttribution.displayName) || 'Google User';
  return {
    name: author,
    avatar: (author.trim().charAt(0) || 'G').toUpperCase(),
    rating: typeof r.rating === 'number' ? r.rating : 5,
    text: (r.text && r.text.text) || (r.originalText && r.originalText.text) || '',
    relativeTime: r.relativePublishTimeDescription || '',
  };
}

function readCache() {
  try {
    const raw = localStorage.getItem(REVIEWS_CONFIG.cacheKey);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !obj.expires || obj.expires < Date.now()) return null;
    return obj.data;
  } catch (e) {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(
      REVIEWS_CONFIG.cacheKey,
      JSON.stringify({ data, expires: Date.now() + REVIEWS_CONFIG.cacheTtlMs })
    );
  } catch (e) {
    /* ignore quota errors */
  }
}

function applyData(data) {
  if (data.rating != null) updateRating(data.rating);
  if (data.count) updateCount(data.count);
  if (data.reviews && data.reviews.length) {
    updateBars(data.reviews);
    updateCards(data.reviews);
    if (typeof window.__initReviewsSlider === 'function') {
      window.__initReviewsSlider();
    }
  }
  updateSchema(data);
}

function updateRating(rating) {
  const score = document.querySelector('.score-number');
  if (score) score.textContent = Number(rating).toFixed(1);

  const stars = document.querySelector('.score-stars');
  if (stars) stars.innerHTML = renderStarIcons(rating);

  const hero = document.getElementById('heroRating');
  if (hero) {
    hero.innerHTML =
      '<i class="fas fa-star" style="color:var(--primary);font-size:0.8em"></i> ' +
      Number(rating).toFixed(1);
  }
}

function updateCount(count) {
  const totalEl = document.querySelector('.score-total');
  if (totalEl) totalEl.textContent = count;
}

function updateBars(reviews) {
  // Note: Google Places API only returns the 5 most recent reviews,
  // so this distribution is computed from that subset, not the full
  // historical breakdown. For a 100% 5-star business this is accurate.
  const buckets = [0, 0, 0, 0, 0]; // index 0..4 = 1..5 stars
  reviews.forEach(r => {
    const i = Math.round(r.rating) - 1;
    if (i >= 0 && i < 5) buckets[i]++;
  });
  const total = buckets.reduce((a, b) => a + b, 0) || 1;
  const rows = document.querySelectorAll('.reviews-bars .bar-row');
  if (rows.length !== 5) return;
  // Rows are top→bottom: 5,4,3,2,1
  [5, 4, 3, 2, 1].forEach((star, idx) => {
    const pct = Math.round((buckets[star - 1] / total) * 100);
    const fill = rows[idx].querySelector('.bar-fill');
    const spans = rows[idx].querySelectorAll('span');
    if (fill) fill.style.width = pct + '%';
    if (spans[1]) spans[1].textContent = pct + '%';
  });
}

function updateCards(reviews) {
  const track = document.getElementById('reviewsTrack');
  if (!track) return;
  track.innerHTML = reviews
    .map(
      r => `
    <div class="review-card">
      <div class="review-header">
        <div class="review-stars">${renderStarIcons(r.rating)}</div>
        <span class="review-date">${escapeHtml(r.relativeTime)}</span>
      </div>
      <p class="review-text">"${escapeHtml(r.text)}"</p>
      <div class="review-service"><i class="fab fa-google"></i> Verified Google Review</div>
      <div class="review-author">
        <div class="review-avatar">${escapeHtml(r.avatar)}</div>
        <div>
          <strong>${escapeHtml(r.name)}</strong>
          <span>via Google</span>
        </div>
      </div>
    </div>
  `
    )
    .join('');
}

function updateSchema(data) {
  // Replace the AutoRepair schema's aggregateRating + reviews in place
  // so any JS-aware crawler picks up live data.
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  scripts.forEach(s => {
    try {
      const obj = JSON.parse(s.textContent);
      if (obj['@type'] !== 'AutoRepair') return;
      if (data.rating != null && data.count) {
        obj.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: Number(data.rating).toFixed(1),
          reviewCount: String(data.count),
        };
      }
      if (data.reviews && data.reviews.length) {
        obj.review = data.reviews.map(r => ({
          '@type': 'Review',
          author: { '@type': 'Person', name: r.name },
          reviewRating: { '@type': 'Rating', ratingValue: String(r.rating) },
          reviewBody: r.text,
        }));
      }
      s.textContent = JSON.stringify(obj);
    } catch (e) {
      /* ignore parse errors */
    }
  });
}

function renderStarIcons(rating) {
  const r = Number(rating) || 0;
  const full = Math.floor(r);
  const frac = r - full;
  const hasHalf = frac >= 0.25 && frac < 0.75;
  const adjustedFull = full + (frac >= 0.75 ? 1 : 0);
  const empty = 5 - adjustedFull - (hasHalf ? 1 : 0);
  return (
    '<i class="fas fa-star"></i>'.repeat(adjustedFull) +
    (hasHalf ? '<i class="fas fa-star-half-alt"></i>' : '') +
    '<i class="far fa-star"></i>'.repeat(Math.max(0, empty))
  );
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}
