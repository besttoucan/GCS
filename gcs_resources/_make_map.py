#!/usr/bin/env python3
# Generates a tile-grid choropleth of the U.S. ("statebins" style) showing
# community-bank density. No external data/paths needed — each state is a
# labeled rounded square placed in an approximate geographic grid.

# state: (col 1-11 west->east, row 1-8 north->south, density bucket 1-5)
STATES = {
    "AK": (1, 1, 1), "ME": (11, 1, 1),
    "WA": (1, 2, 2), "ID": (2, 2, 2), "MT": (3, 2, 3), "ND": (4, 2, 4),
    "MN": (5, 2, 5), "WI": (6, 2, 4), "MI": (8, 2, 3), "NY": (9, 2, 3),
    "VT": (10, 2, 1), "NH": (11, 2, 1),
    "OR": (1, 3, 2), "NV": (2, 3, 1), "WY": (3, 3, 2), "SD": (4, 3, 4),
    "IA": (5, 3, 5), "IL": (6, 3, 5), "IN": (7, 3, 4), "OH": (8, 3, 4),
    "PA": (9, 3, 4), "NJ": (10, 3, 2), "MA": (11, 3, 2),
    "CA": (1, 4, 2), "UT": (2, 4, 1), "CO": (3, 4, 3), "NE": (4, 4, 5),
    "MO": (5, 4, 5), "KY": (6, 4, 4), "WV": (7, 4, 2), "VA": (8, 4, 3),
    "MD": (9, 4, 2), "DE": (10, 4, 1), "CT": (11, 4, 1),
    "HI": (1, 5, 1), "AZ": (2, 5, 2), "NM": (3, 5, 2), "KS": (4, 5, 5),
    "AR": (5, 5, 4), "TN": (6, 5, 4), "NC": (7, 5, 4), "SC": (8, 5, 3),
    "DC": (9, 5, 1), "RI": (11, 5, 1),
    "OK": (4, 6, 5), "LA": (5, 6, 3), "MS": (6, 6, 4), "AL": (7, 6, 4),
    "GA": (8, 6, 4),
    "TX": (4, 7, 5), "FL": (8, 7, 3),
}

# blue sequential ramp (light -> dark), brand-aligned
RAMP = {1: "#d9e6f7", 2: "#aac6ec", 3: "#6e9ed9", 4: "#3d6cbb", 5: "#214a91"}

W, H = 1000, 625
TILE, GAP = 52, 7
CELL = TILE + GAP
COLS, ROWS = 11, 8
grid_w = COLS * CELL - GAP
grid_h = ROWS * CELL - GAP
ox = (W - grid_w) / 2
oy = 96

def esc(v):
    return str(round(v, 2))

parts = []
parts.append(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
    f'font-family="Helvetica, Arial, sans-serif" role="img" '
    f'aria-label="Map of community-bank density across the United States">'
)
# background
parts.append(f'<rect width="{W}" height="{H}" fill="#f6f8fc"/>')
# title
parts.append(
    f'<text x="{W/2}" y="52" text-anchor="middle" fill="#131A40" '
    f'font-size="27" font-weight="700" letter-spacing="0.5">'
    f'Community banks across the United States</text>'
)
parts.append(
    f'<text x="{W/2}" y="78" text-anchor="middle" fill="#8c93a3" '
    f'font-size="14.5" letter-spacing="2.4">SERVING LOCAL COMMUNITIES IN ALL 50 STATES</text>'
)

# tiles
for code, (c, r, v) in STATES.items():
    x = ox + (c - 1) * CELL
    y = oy + (r - 1) * CELL
    fill = RAMP[v]
    txt = "#ffffff" if v >= 3 else "#22305a"
    parts.append(
        f'<rect x="{esc(x)}" y="{esc(y)}" width="{TILE}" height="{TILE}" '
        f'rx="6" fill="{fill}"/>'
    )
    parts.append(
        f'<text x="{esc(x + TILE/2)}" y="{esc(y + TILE/2 + 6)}" '
        f'text-anchor="middle" fill="{txt}" font-size="17" font-weight="600">{code}</text>'
    )

# legend
ly = H - 34
lx = W / 2 - 150
parts.append(
    f'<text x="{esc(lx - 14)}" y="{esc(ly + 14)}" text-anchor="end" '
    f'fill="#4a5366" font-size="14">Fewer</text>'
)
for i, v in enumerate([1, 2, 3, 4, 5]):
    sx = lx + i * 28
    parts.append(
        f'<rect x="{esc(sx)}" y="{esc(ly)}" width="22" height="22" rx="4" fill="{RAMP[v]}"/>'
    )
parts.append(
    f'<text x="{esc(lx + 5*28 + 6)}" y="{esc(ly + 14)}" '
    f'fill="#4a5366" font-size="14">More</text>'
)
# orange accent rule under title
parts.append(f'<rect x="{W/2-28}" y="90" width="56" height="3" rx="1.5" fill="#F47A1F"/>')

parts.append("</svg>")

with open("assets/community-banks-map.svg", "w", encoding="utf-8") as f:
    f.write("\n".join(parts))
print("wrote assets/community-banks-map.svg")
