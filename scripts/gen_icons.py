#!/usr/bin/env python3
"""
Phase 5: generate inline-SVG components for all lucide-react icons used in the
Restoku frontend, then rewrite imports from 'lucide-react' to the local
Components/icons module. No runtime dep on lucide after this runs.

Run: python scripts/gen_icons.py
"""
import os, re, json, glob

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
LUCIDE_ICONS = os.path.join(ROOT, "node_modules", "lucide-react", "dist", "esm", "icons")
ICONS_TSX = os.path.join(ROOT, "resources", "js", "Components", "icons.tsx")

# Icons already hand-authored in icons.tsx (name -> exported as <Name>Icon)
EXISTING = {
    "BowlIcon","PlusIcon","SearchIcon","PencilIcon","TrashIcon","UploadIcon","XIcon",
    "ClockIcon","CheckCheckIcon","VolumeIcon","VolumeMuteIcon","ChefHatIcon","UtensilsIcon",
    "FlameIcon","ShieldAlertIcon","StoreIcon","PackageIcon","BoxesIcon","BriefcaseIcon",
    "BarChartIcon","SettingsIcon","SmartphoneIcon","ChevronDownIcon","ChevronRightIcon",
    "LockIcon","ArrowLeftIcon","MenuIcon","BellIcon","LogOutIcon","PanelLeftIcon",
    "TrendingUpIcon","UsersIcon",
}

def kebab(name):
    # camelCase -> kebab (lucide filename)
    s = re.sub(r'(?<!^)(?=[A-Z])', '-', name).lower()
    return s

def to_icon_name(name):
    # Xxx -> XxxIcon
    return name + "Icon"

def load_icon_node(name):
    """Read __iconNode from lucide dist for `name`."""
    path = os.path.join(LUCIDE_ICONS, kebab(name) + ".js")
    if not os.path.exists(path):
        # try alias map (some icons renamed)
        return None
    with open(path, encoding="utf-8") as f:
        src = f.read()
    m = re.search(r"const __iconNode = (\[.*?\]);", src, re.S)
    if not m:
        return None
    try:
        node = json.loads(m.group(1))
    except Exception:
        return None
    return node

def node_to_jsx(node):
    parts = []
    for tag, attrs, _key in node:
        a = " ".join(f'{k}="{v}"' for k, v in attrs.items())
        parts.append(f"<{tag} {a} />")
    return "\n".join("            " + p for p in parts)

# Collect all icon names used
used = set()
file_imports = {}
for tsx in glob.glob(os.path.join(ROOT, "resources", "js", "**", "*.tsx"), recursive=True):
    with open(tsx, encoding="utf-8") as f:
        src = f.read()
    for m in re.finditer(r"import \{([^}]+)\} from ['\"]lucide-react['\"]", src):
        names = [n.strip() for n in m.group(1).split(",") if n.strip()]
        used.update(names)
        file_imports.setdefault(tsx, set()).update(names)

# Generate missing icons
missing = sorted(n for n in used if to_icon_name(n) not in EXISTING)
generated = []
for name in missing:
    node = load_icon_node(name)
    if node is None:
        print("WARN: cannot load lucide icon", name)
        continue
    fn = to_icon_name(name)
    jsx = node_to_jsx(node)
    comp = f"""
export function {fn}(p: P) {{
    return (
        <svg {{...base(p)}}>
{jsx}
        </svg>
    );
}}"""
    generated.append(comp)

# Append to icons.tsx
if generated:
    with open(ICONS_TSX, encoding="utf-8") as f:
        cur = f.read()
    with open(ICONS_TSX, "a", encoding="utf-8") as f:
        f.write("\n// --- AUTO-GENERATED from lucide-react (Phase 5) ---\n")
        f.write("\n".join(generated))
    print(f"Generated {len(generated)} icons -> {os.path.relpath(ICONS_TSX, ROOT)}")
else:
    print("No new icons needed.")

# Rewrite imports per file
def rel_import(from_file):
    # depth relative to resources/js
    rel = os.path.relpath(ICONS_TSX, os.path.dirname(from_file))
    rel = rel.replace("\\", "/")
    if not rel.startswith("."):
        rel = "./" + rel
    rel = rel[:-len(".tsx")]  # drop ext
    return rel

count = 0
for tsx, names in file_imports.items():
    with open(tsx, encoding="utf-8") as f:
        src = f.read()
    new_src = src
    for m in re.finditer(r"import \{([^}]+)\} from ['\"]lucide-react['\"];?", src):
        orig_block = m.group(0)
        names_in = [n.strip() for n in m.group(1).split(",") if n.strip()]
        # rename each to XxxIcon
        renamed = [n + "Icon" for n in names_in]
        new_block = "import { " + ", ".join(renamed) + " } from '" + rel_import(tsx) + "';"
        new_src = new_src.replace(orig_block, new_block, 1)
    # Also rename usages <IconName .../> and IconName as component references
    for n in names:
        new_src = re.sub(r"\b" + re.escape(n) + r"\b", n + "Icon", new_src)
    # but protect the import line we just wrote (already has Icon suffix) - fine since regex adds Icon only once
    if new_src != src:
        with open(tsx, "w", encoding="utf-8") as f:
            f.write(new_src)
        count += 1
        print("Rewrote", os.path.relpath(tsx, ROOT))

print(f"Rewrote {count} files.")
