import os
import json
from generate_seo_pages import LOCATIONS

def build_search_data():
    items = []
    for loc in LOCATIONS:
        items.append({
            "name": loc["name"],
            "slug": loc["slug"],
            "url": f"locations/dry-cleaners-{loc['slug']}-gurgaon.html",
            "cluster": loc["cluster"],
            "landmarks": loc["landmarks"],
            "pincode": loc["pincode"],
            "desc": loc["desc"]
        })
    return items

def update_areas_html():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    areas_path = os.path.join(base_dir, "areas-served.html")

    with open(areas_path, "r", encoding="utf-8") as f:
        content = f.read()

    locations_json = json.dumps(build_search_data())

    # CSS for the search and recommendations
    search_css = """
    /* Search Box & Recommendations Styling */
    .sector-search-wrap {
      position: relative;
      max-width: 680px;
      margin: 0 auto 35px;
      z-index: 100;
    }
    .sector-search-input {
      width: 100%;
      padding: 16px 45px 16px 50px;
      border-radius: 999px;
      border: 2px solid #bfdbfe;
      font-size: 15.5px;
      outline: none;
      box-shadow: 0 8px 25px rgba(8, 47, 99, 0.08);
      transition: all 0.2s ease;
      font-family: inherit;
      background: #ffffff;
      color: #082f63;
    }
    .sector-search-input:focus {
      border-color: #0877ff;
      box-shadow: 0 10px 32px rgba(8, 119, 255, 0.18);
    }
    .sector-search-icon {
      position: absolute;
      left: 18px;
      top: 50%;
      transform: translateY(-50%);
      color: #0877ff;
      font-size: 19px;
      pointer-events: none;
    }
    .search-clear-btn {
      position: absolute;
      right: 18px;
      top: 50%;
      transform: translateY(-50%);
      background: #f1f5f9;
      border: none;
      border-radius: 50%;
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .search-clear-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .search-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      right: 0;
      background: #ffffff;
      border-radius: 18px;
      box-shadow: 0 20px 50px rgba(8, 47, 99, 0.18);
      border: 1.5px solid #bfdbfe;
      max-height: 440px;
      overflow-y: auto;
      z-index: 1000;
      text-align: left;
    }
    .rec-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      background: #f0f7ff;
      border-bottom: 1px solid #dbeafe;
      font-size: 12.5px;
      font-weight: 800;
      color: #0369a1;
      position: sticky;
      top: 0;
      z-index: 2;
    }
    .rec-hint {
      font-size: 11.5px;
      color: #64748b;
      font-weight: 500;
    }
    .rec-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 13px 20px;
      border-bottom: 1px solid #f1f5f9;
      text-decoration: none;
      color: inherit;
      transition: background 0.15s ease;
      gap: 12px;
    }
    .rec-item:hover, .rec-item.selected {
      background: #eff6ff;
    }
    .rec-item-main {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1;
      min-width: 0;
    }
    .rec-item-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .rec-item-title {
      font-size: 15px;
      font-weight: 800;
      color: #082f63;
    }
    .rec-item-title mark {
      background: #fef08a;
      color: #854d0e;
      padding: 0 2px;
      border-radius: 3px;
    }
    .rec-cluster-badge {
      font-size: 11px;
      font-weight: 700;
      color: #0369a1;
      background: #e0f2fe;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .rec-fast-badge {
      font-size: 11px;
      font-weight: 800;
      color: #059669;
      background: #ecfdf5;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid #a7f3d0;
    }
    .rec-item-desc {
      font-size: 12.5px;
      color: #64748b;
      line-height: 1.4;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .rec-item-desc mark {
      background: #fef08a;
      color: #854d0e;
      padding: 0 2px;
      border-radius: 3px;
    }
    .rec-item-action {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12.5px;
      font-weight: 800;
      color: #0877ff;
      white-space: nowrap;
      background: #f8fafc;
      padding: 6px 14px;
      border-radius: 8px;
      border: 1px solid #dbeafe;
      flex-shrink: 0;
    }
    .rec-item:hover .rec-item-action {
      background: #0877ff;
      color: #ffffff;
      border-color: #0877ff;
    }
    .rec-no-results {
      padding: 26px 20px;
      text-align: center;
    }
    .rec-no-results h4 {
      margin: 0 0 6px;
      color: #082f63;
      font-size: 16px;
      font-weight: 800;
    }
    .rec-no-results p {
      margin: 0 0 16px;
      color: #64748b;
      font-size: 13.5px;
      line-height: 1.5;
    }
    .rec-wa-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #25d366;
      color: #ffffff;
      font-weight: 800;
      font-size: 13.5px;
      padding: 9px 20px;
      border-radius: 999px;
      text-decoration: none;
      box-shadow: 0 4px 14px rgba(37,211,102,0.3);
    }
    .rec-wa-btn:hover {
      background: #1eb956;
    }
    """

    # Check if search_css already present, if not add to head
    if "/* Search Box & Recommendations Styling */" not in content:
        content = content.replace("</style>", search_css + "\n  </style>")

    # Replace Search Input HTML
    search_html = """        <!-- Live Filter Bar with Recommendations Dropdown -->
        <div class="sector-search-wrap">
          <span class="sector-search-icon">🔍</span>
          <input type="text" id="sectorFilterInput" class="sector-search-input" placeholder="Search any sector, village, colony or landmark (e.g. Basai, Sector 56, DLF, Ashok Vihar, Sheetla Colony)..." autocomplete="off" />
          <button type="button" id="searchClearBtn" class="search-clear-btn" style="display: none;" title="Clear search">✕</button>

          <!-- Floating Recommendations Dropdown -->
          <div id="searchDropdown" class="search-dropdown" style="display: none;">
            <div class="rec-header">
              <span id="recCountLabel">Matching Gurugram Localities</span>
              <span class="rec-hint">24h Express Turnaround Available</span>
            </div>
            <div id="recResultsList"></div>
            <div id="recNoResults" class="rec-no-results" style="display: none;"></div>
          </div>
        </div>"""

    # Find sector-search-wrap in content and replace it
    start_wrap = '<div class="sector-search-wrap">'
    if start_wrap in content:
        # replace from start_wrap to the next closing </div> of sector-search-wrap
        before = content.split(start_wrap)[0]
        # find where the old wrap ends (the first </div> after start_wrap)
        rest = content.split(start_wrap)[1]
        after = rest[rest.find('</div>') + 6:]
        content = before + search_html + after

    # Now replace the bottom script with the full smart recommendation engine
    script_engine = f"""  <!-- Sector & Village Smart Search & Recommendations Engine -->
  <script>
    (function() {{
      const LOCATIONS = {locations_json};
      const filterInput = document.getElementById('sectorFilterInput');
      const clearBtn = document.getElementById('searchClearBtn');
      const dropdown = document.getElementById('searchDropdown');
      const resultsList = document.getElementById('recResultsList');
      const noResults = document.getElementById('recNoResults');
      const countLabel = document.getElementById('recCountLabel');
      const zoneCards = document.querySelectorAll('.zone-card');

      function escapeRegExp(string) {{
        return string.replace(/[.*+?^${{}}()|[\\]\\\\]/g, '\\\\$&');
      }}

      function highlightText(text, query) {{
        if (!query) return text;
        const regex = new RegExp('(' + escapeRegExp(query) + ')', 'gi');
        return text.replace(regex, '<mark>$1</mark>');
      }}

      function renderRecommendations(query) {{
        const q = query.trim().toLowerCase();
        if (!q) {{
          dropdown.style.display = 'none';
          clearBtn.style.display = 'none';
          // Reset zone cards
          zoneCards.forEach(c => c.style.display = 'flex');
          return;
        }}

        clearBtn.style.display = 'flex';

        // Filter locations matching name, slug, cluster, landmarks or desc
        const matches = [];
        const seen = new Set();

        // 1. Direct name matches (highest priority)
        LOCATIONS.forEach(loc => {{
          const nameLower = loc.name.toLowerCase();
          const landmarksLower = loc.landmarks.toLowerCase();
          const clusterLower = loc.cluster.toLowerCase();
          const descLower = loc.desc.toLowerCase();

          let score = 0;
          if (nameLower.startsWith(q)) {{
            score = 100;
          }} else if (nameLower.includes(q)) {{
            score = 80;
          }} else if (landmarksLower.includes(q)) {{
            score = 60;
          }} else if (clusterLower.includes(q)) {{
            score = 40;
          }} else if (descLower.includes(q)) {{
            score = 20;
          }}

          // Special case for numbers: e.g. "56" matches "Sector 56"
          const numberMatch = q.match(/\\d+/);
          if (numberMatch && nameLower.includes(numberMatch[0])) {{
            score = Math.max(score, 90);
          }}

          if (score > 0 && !seen.has(loc.slug)) {{
            seen.add(loc.slug);
            matches.push({{ loc, score }});
          }}
        }});

        // Sort by relevance score
        matches.sort((a, b) => b.score - a.score);

        if (matches.length > 0) {{
          countLabel.textContent = `${{matches.length}} Locations Found in Gurugram`;
          resultsList.innerHTML = '';
          noResults.style.display = 'none';

          const topMatches = matches.slice(0, 15);
          topMatches.forEach(({{ loc }}) => {{
            const item = document.createElement('a');
            item.className = 'rec-item';
            item.href = loc.url;

            const nameHighlighted = highlightText(loc.name, q);
            const landmarksHighlighted = highlightText(loc.landmarks, q);

            item.innerHTML = `
              <div class="rec-item-main">
                <div class="rec-item-title-row">
                  <span class="rec-item-title">📍 ${{nameHighlighted}}</span>
                  <span class="rec-cluster-badge">${{loc.cluster}}</span>
                  <span class="rec-fast-badge">⚡ 24h Delivery</span>
                </div>
                <div class="rec-item-desc">
                  <strong>Landmarks &amp; Condos:</strong> ${{landmarksHighlighted}}
                </div>
              </div>
              <span class="rec-item-action">View Price Card →</span>
            `;
            resultsList.appendChild(item);
          }});

          dropdown.style.display = 'block';
        }} else {{
          countLabel.textContent = '100% Doorstep Coverage';
          resultsList.innerHTML = '';
          noResults.style.display = 'block';
          noResults.innerHTML = `
            <h4>📍 Doorstep Pickup Available in "${{query}}"!</h4>
            <p>Mourya Dry Cleaners serves every sector, condominium, and micro-colony in Gurugram. Free doorstep pickup &amp; 24-hour delivery is active for your area.</p>
            <a href="https://wa.me/919217410047?text=Hi%20Mourya%20Dry%20Cleaners,%20I%20want%20to%20book%20a%20pickup%20at%20${{encodeURIComponent(query)}},%20Gurgaon" target="_blank" class="rec-wa-btn">
              💬 Book Pickup at "${{query}}" on WhatsApp
            </a>
          `;
          dropdown.style.display = 'block';
        }}

        // Also filter the on-page zone cards below
        zoneCards.forEach(card => {{
          const sectors = (card.getAttribute('data-sectors') || '').toLowerCase();
          const cardText = card.innerText.toLowerCase();
          if (sectors.includes(q) || cardText.includes(q)) {{
            card.style.display = 'flex';
          }} else {{
            card.style.display = 'none';
          }}
        }});
      }}

      if (filterInput) {{
        filterInput.addEventListener('input', function(e) {{
          renderRecommendations(e.target.value);
        }});

        filterInput.addEventListener('focus', function() {{
          if (this.value.trim()) {{
            renderRecommendations(this.value);
          }}
        }});

        // Enter key navigates to top match if open
        filterInput.addEventListener('keydown', function(e) {{
          if (e.key === 'Enter') {{
            const firstItem = resultsList.querySelector('.rec-item');
            if (firstItem) {{
              e.preventDefault();
              window.location.href = firstItem.href;
            }}
          }} else if (e.key === 'Escape') {{
            dropdown.style.display = 'none';
          }}
        }});
      }}

      if (clearBtn) {{
        clearBtn.addEventListener('click', function() {{
          filterInput.value = '';
          filterInput.focus();
          renderRecommendations('');
        }});
      }}

      // Close dropdown when clicking outside
      document.addEventListener('click', function(e) {{
        const searchWrap = document.querySelector('.sector-search-wrap');
        if (searchWrap && !searchWrap.contains(e.target)) {{
          dropdown.style.display = 'none';
        }}
      }});

      // Village quick filter chips
      const villageChips = document.querySelectorAll('.v-badge');
      villageChips.forEach(chip => {{
        chip.addEventListener('click', function() {{
          const query = this.getAttribute('data-filter') || this.innerText;
          if (filterInput) {{
            filterInput.value = query;
            filterInput.focus();
            renderRecommendations(query);
          }}
        }});
      }});
    }})();
  </script>
  <script src="script.js"></script>
</body>
</html>
"""

    # Replace the old filter script at bottom
    script_start = '<!-- Sector &amp; Village Instant Filter Script -->'
    if script_start in content:
        content = content.split(script_start)[0] + script_engine
    else:
        # If script_start is not found, replace whatever script tag is before </body>
        last_body = content.rfind('</body>')
        content = content[:last_body] + script_engine

    with open(areas_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully upgraded areas-served.html with live smart recommendation engine!")

if __name__ == "__main__":
    update_areas_html()
