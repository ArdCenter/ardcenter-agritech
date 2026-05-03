import os
import io
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Plant Disease ML API")

# Configuration CORS pour permettre à votre webapp d'y accéder
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En production, vous pouvez restreindre à l'URL de votre frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Forcer l'utilisation du CPU pour éviter les soucis de compatibilité CUDA sur les serveurs
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "best_model (2).pth")
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Initialisation et chargement du modèle
print("Initialisation du modèle...")
model = models.efficientnet_b3(weights=None)
num_ftrs = model.classifier[1].in_features
model.classifier[1] = nn.Linear(num_ftrs, 6)

try:
    # Important : map_location=DEVICE pour charger un modèle potentiellement entraîné sur GPU vers le CPU
    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    model = model.to(DEVICE)
    model.eval()
    print("Modèle chargé avec succès !")
except Exception as e:
    print(f"Erreur lors du chargement du modèle : {e}")

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

def predict_image(image_bytes):
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image = transform(image).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            outputs = model(image)
            # Calculer les probabilités avec softmax
            probabilities = torch.nn.functional.softmax(outputs, dim=1)[0]
            conf, pred = torch.max(probabilities, 0)
            
            # Afficher les scores dans la console pour debug
            print("-" * 30)
            print(f"Prédiction en cours...")
            for i, class_name in enumerate(class_names):
                print(f"{class_name}: {probabilities[i].item():.4f}")
            print(f"Gagnant: {class_names[pred.item()]} ({conf.item():.2%})")
            print("-" * 30)

        return class_names[pred.item()], conf.item()
    except Exception as e:
        print(f"Erreur prediction: {e}")
        raise Exception(f"Erreur de traitement de l'image : {str(e)}")

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image.")
    
    try:
        contents = await file.read()
        prediction, confidence = predict_image(contents)
        return {
            "filename": file.filename, 
            "prediction": prediction,
            "confidence": confidence,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "L'API de prédiction des maladies des plantes fonctionne correctement. Envoyez une requête POST sur /predict."}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
