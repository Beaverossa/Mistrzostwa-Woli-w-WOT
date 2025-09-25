import os
import subprocess

INPUT_DIR = "pngs"
OUTPUT_DIR = "svgs"

if not os.path.exists(INPUT_DIR):
    os.makedirs(INPUT_DIR)
    print(f"📂 Utworzono folder '{INPUT_DIR}'. Wrzuć tam swoje PNG i uruchom skrypt ponownie.")
    exit()

os.makedirs(OUTPUT_DIR, exist_ok=True)

for file in os.listdir(INPUT_DIR):
    if file.lower().endswith(".png"):
        in_path = os.path.join(INPUT_DIR, file)
        out_path = os.path.join(OUTPUT_DIR, file.replace(".png", ".svg"))

        subprocess.run(["potrace", in_path, "-s", "-o", out_path])

print("✅ Konwersja PNG → SVG zakończona!")
