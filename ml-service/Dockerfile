FROM python:3.10-slim

WORKDIR /app

# Mise à jour de pip
RUN pip install --upgrade pip

# Installer les dépendances
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copier le reste de l'application
COPY . .

# Exposer le port (Railway injectera la variable d'environnement PORT)
EXPOSE 8000

# Commande pour démarrer l'application FastAPI
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
