import sys
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "best_model (2).pth")
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Appareil utilisé :", DEVICE)

print("Chargement du modèle...")
model = models.efficientnet_b3(weights=None)
num_ftrs = model.classifier[1].in_features
model.classifier[1] = nn.Linear(num_ftrs, 6)

try:
    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    model = model.to(DEVICE)
    model.eval()
    print("Modèle chargé avec succès :", MODEL_PATH)
except Exception as e:
    print("Erreur lors du chargement du modèle:", e)
    sys.exit(1)

class_names = [
    "Olive_Aculus_Olearius",
    "Olive_Healthy",
    "Olive_Peacock_Spot",
    "Tomato_Healthy",
    "Tomato_Late_Blight",
    "Tomato_Spider_Mite"
]

transform = transforms.Compose([
    transforms.Resize(320),
    transforms.CenterCrop(300),
    transforms.ToTensor(),
    transforms.Normalize(
        [0.485, 0.456, 0.406],
        [0.229, 0.224, 0.225]
    )
])

def predict(image_path):
    try:
        image = Image.open(image_path).convert("RGB")
        image = transform(image).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            outputs = model(image)
            _, pred = torch.max(outputs, 1)

        return class_names[pred.item()]
    except Exception as e:
        return f"Erreur avec l'image : {e}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python Use.py <chemin_vers_image>")
        sys.exit(1)
        
    image_to_test = sys.argv[1]
    print("Image :", image_to_test)
    result = predict(image_to_test)
    print("Classe prédite :", result)