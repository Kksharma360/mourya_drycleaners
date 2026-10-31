import os
from generate_seo_pages import LOCATIONS

def update_areas_served():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    areas_served_path = os.path.join(base_dir, "areas-served.html")
    
    with open(areas_served_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Group LOCATIONS by cluster
    clusters = {}
    for loc in LOCATIONS:
        c = loc["cluster"]
        if c not in clusters:
            clusters[c] = []
        clusters[c].append(loc)

    # Build directory HTML
    dir_html = """
        <!-- Comprehensive Programmatic Sector Landing Pages Silo -->
        <div style="background: #ffffff; border: 2px solid #bfdbfe; border-radius: 20px; padding: 32px 28px; margin: 40px 0; box-shadow: 0 10px 30px rgba(8,119,255,0.06);">
          <div style="text-align: center; max-width: 800px; margin: 0 auto 30px;">
            <span style="background: #eff6ff; color: #0877ff; font-weight: 800; font-size: 12.5px; padding: 6px 16px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px;">Full Gurgaon Coverage</span>
            <h2 style="font-size: clamp(22px, 3.5vw, 32px); color: #082f63; font-weight: 900; margin: 12px 0 8px;">Explore All Gurugram Sector &amp; Micro-Locality Pages</h2>
            <p style="color: #64748b; font-size: 15px; margin: 0;">Dedicated local guides with transparent price cards, eco-friendly solvent standards, and direct doorstep pickup for every sector in Gurugram.</p>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
"""

    for cluster_name, loc_list in clusters.items():
        links_markup = "\n".join([
            f'              <a href="locations/dry-cleaners-{l["slug"]}-gurgaon.html" style="background:#f8fafc; color:#0b3d78; font-size:13px; font-weight:700; padding:6px 12px; border-radius:8px; border:1px solid #e2e8f0; text-decoration:none; transition:all 0.15s ease;" onmouseover="this.style.background=\'#0877ff\';this.style.color=\'#fff\';" onmouseout="this.style.background=\'#f8fafc\';this.style.color=\'#0b3d78\';">{l["name"]}</a>'
            for l in loc_list
        ])

        dir_html += f"""            <div style="background:#f0f7ff; border-radius:16px; padding:20px 18px; border:1px solid #dbeafe;">
              <h3 style="font-size:16px; font-weight:800; color:#082f63; margin:0 0 14px; display:flex; align-items:center; gap:8px;">
                <span>📍</span> {cluster_name} ({len(loc_list)} Sectors)
              </h3>
              <div style="display:flex; flex-wrap:wrap; gap:8px;">
{links_markup}
              </div>
            </div>
"""

    dir_html += """          </div>
        </div>
"""

    # Replace existing block if already present
    start_tag = '<!-- Comprehensive Programmatic Sector Landing Pages Silo -->'
    end_marker = '<div style="background: linear-gradient(135deg, #f0f7ff 0%, #e0effe 100%);'
    if start_tag in content and end_marker in content:
        parts_before = content.split(start_tag)[0]
        parts_after = content.split(end_marker)[1]
        content = parts_before + dir_html + "\n        " + end_marker + parts_after
        with open(areas_served_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Successfully updated existing Programmatic Sector Directory in areas-served.html!")
    else:
        target_anchor = '<!-- High-Priority Neighbourhood Guides -->'
        if target_anchor in content:
            content = content.replace(target_anchor, dir_html + "\n        " + target_anchor)
            with open(areas_served_path, "w", encoding="utf-8") as f:
                f.write(content)
            print("Successfully injected Programmatic Sector Directory into areas-served.html!")

if __name__ == "__main__":
    update_areas_served()


