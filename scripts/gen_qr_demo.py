#!/usr/bin/env python3
"""Generate + self-verify QR Code meja untuk outlet Pawon Salam - Bandung.
URL = https://<tunnel>/m/pawon-salam-bandung?t=<meja>
Decode ulang (cv2.QRCodeDetector) untuk bukti scan = URL benar.
"""
import os, sys
import urllib.request
from qrcode import QRCode
from qrcode.constants import ERROR_CORRECT_M
from PIL import Image
import cv2

BASE = "https://mod-suggests-bite-moses.trycloudflare.com"
SLUG = "pawon-salam-bandung"
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "qr_demo_bandung")
os.makedirs(OUT_DIR, exist_ok=True)

TABLES = ["A1", "A2", "B1"]
detector = cv2.QRCodeDetector()

def make(url, path):
    qr = QRCode(version=3, error_correction=ERROR_CORRECT_M, box_size=10, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    qr.make_image(fill_color="black", back_color="white").save(path)

def scan(path):
    img = cv2.imread(path)
    data, pts, _ = detector.detectAndDecode(img)
    return data.strip() if data else ""

print(f"Base: {BASE}\n")
ok = True
for t in TABLES:
    url = f"{BASE}/m/{SLUG}?t={t}"
    p = os.path.abspath(os.path.join(OUT_DIR, f"qr_bandung_{t}.png"))
    make(url, p)
    decoded = scan(p)
    match = decoded == url
    ok = ok and match
    print(f"  [{t}] file={os.path.basename(p)}")
    print(f"       url   = {url}")
    print(f"       decode= {decoded or '(NONE)'}")
    print(f"       MATCH = {'YES' if match else 'NO'}")
    print()

# Live HTTP check
test_url = f"{BASE}/m/{SLUG}?t={TABLES[0]}"
try:
    with urllib.request.urlopen(test_url, timeout=10) as r:
        code = r.getcode()
    print(f"Live HTTP {test_url} -> {code} {'OK' if code==200 else 'FAIL'}")
    ok = ok and (code == 200)
except Exception as e:
    print(f"Live HTTP FAILED: {e}")
    ok = False

print("\n=== RESULT:", "ALL PASS" if ok else "FAIL", "===")
sys.exit(0 if ok else 1)
