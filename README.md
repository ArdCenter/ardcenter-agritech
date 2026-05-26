<p align="center">
  <img src="market-place/public/logo-transparent.png" alt="ArdCenter Logo" width="120" />
</p>

<h1 align="center">🌾 ArdCenter - Écosystème Agritech Intelligent</h1>

<p align="center">
  <b>Marketplace Agricole • Conseils d'Experts Agronomes • Diagnostic Phyto-Sanitaire par Intelligence Artificielle</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Docker-Compatible-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
  <img src="https://img.shields.io/badge/React-19_Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Node.js-20_Slim-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/PyTorch-B3_Model-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" alt="PyTorch"/>
</p>

---

## 📖 Sommaire
1. [🌟 À propos d'ArdCenter](#-à-propos-dardcenter)
2. [💡 Pourquoi choisir ArdCenter ?](#-pourquoi-choisir-ardcenter-)
3. [🚀 Fonctionnalités Majeures](#-fonctionnalités-majeures)
4. [📐 Architecture Technique](#-architecture-technique)
5. [🛠️ Installation & Démarrage Rapide](#️-installation--démarrage-rapide)
6. [🔌 Aperçu des API du Projet](#-aperçu-des-api-du-projet)
7. [🔑 Identifiants de Test (Rôles)](#-identifiants-de-test-rôles)
8. [🧪 Spécifications du Modèle de Diagnostic IA](#-spécifications-du-modèle-de-diagnostic-ia)
9. [📁 Structure de l'Espace de Travail](#-structure-de-lespace-de-travail)

---

## 🌟 À propos d'ArdCenter

**ArdCenter** est une solution Agritech de bout en bout qui numérise l'agriculture marocaine. Elle résout les problèmes quotidiens des agriculteurs en combinant :
- Une **Marketplace moderne** pour l'achat d'intrants et la location de matériel lourd.
- Un **réseau d'experts agronomes** disponibles instantanément via un chat sécurisé pour guider les récoltes.
- Un **service de vision par ordinateur intelligent** capable de détecter de manière autonome et instantanée les maladies foliaires des tomates et des oliviers.

---

## 💡 Pourquoi choisir ArdCenter ?

- ⚡ **Rapidité d'action** : Diagnostic IA en moins de 2 secondes avec recommandations immédiates de produits adaptés.
- 🤝 **Proximité humaine** : Mise en relation directe avec de vrais experts par chat, supportant le bilinguisme (Français/Arabe).
- ⚙️ **Prêt pour la production (Dockerized)** : Déploiement instantané de la stack complète grâce à Docker Compose.

---

## 🚀 Fonctionnalités Majeures

### 🛒 Marketplace Agricole & Location
- Achat de graines hybrides, capteurs d'humidité IoT, engrais organiques, fongicides.
- Location d'engins agricoles à la journée (John Deere, excavatrices CAT, moissonneuses-batteuses Claas) avec indication de disponibilité en temps réel.

### 🧑‍🌾 Espace Expert Agronome
- Profils experts complets classés par spécialité (Irrigation, Sols, Maladies des plantes, Arbres fruitiers).
- Canal de messagerie instantanée dédié pour le partage de photos de cultures et rapports d'analyse.
- Système d'abonnement expert et historique des points de consultation.

### 🧠 Module IA de Détection Phyto-Sanitaire
- Upload de clichés de feuilles malades directement depuis un smartphone.
- Prédictions du modèle d'apprentissage profond basées sur **EfficientNet-B3** avec calcul du taux de confiance.
- Recommandation automatisée du produit en stock dans la boutique pour traiter la maladie détectée.

### 🚚 Logistique Livreurs
- Gestion de commandes physiques avec attribution automatique de coursiers ou chauffeurs géolocalisés (moto, camionnette).

---

## 📐 Architecture Technique

Le schéma suivant détaille le flux de données et la communication entre les différents services :

```mermaid
graph TD
    %% Nodes definition
    Browser["📱 <b>Navigateur Web Client</b><br><i>React 19 / Vite</i>"]
    
    subgraph ContainerSystem ["📦 Environnement Docker-Compose"]
        Frontend["🌐 <b>Conteneur Frontend</b><br><i>Nginx Server (Port 80 -> Hôte 5173)</i>"]
        Backend["⚙️ <b>Conteneur Backend</b><br><i>API Node.js/Express (Port 5000)</i>"]
        ML["🧠 <b>Conteneur ML Service</b><br><i>FastAPI API (Port 8000)</i>"]
        
        DB[("💾 <b>SQLite Database</b><br><i>market.sqlite (Volume persistant)</i>")]
        Model[("🤖 <b>Modèle de Deep Learning</b><br><i>Poids EfficientNet-B3 (CPU)</i>")]
    end

    %% Flow/Connections
    Browser ==>|Visite la Webapp| Frontend
    Browser ==>|Appels API JSON| Backend
    Browser ==>|Upload image plante (.jpg/.png)| ML

    Backend <==>|Lecture/Écriture SQL| DB
    ML <==>|Classification d'image| Model

    %% Premium Mermaid Styling
    style ContainerSystem fill:#f4f7f4,stroke:#2e7d32,stroke-width:2px,stroke-dasharray: 5 5;
    style Browser fill:#ffffff,stroke:#37474f,stroke-width:2px;
    style Frontend fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    style Backend fill:#e3f2fd,stroke:#1565c0,stroke-width:2px;
    style ML fill:#efebe9,stroke:#4e342e,stroke-width:2px;
    style DB fill:#e8f8f5,stroke:#117a65,stroke-width:2px;
    style Model fill:#fdf2e9,stroke:#d35400,stroke-width:2px;
```

---

## 🛠️ Installation & Démarrage Rapide

### Option A : Lancement avec Docker 🐳 (Recommandé)

1. **Lancer les services en tâche de fond :**
   ```bash
   docker compose up --build -d
   ```
2. **Accéder aux plateformes locales :**
   - 💻 **Application Web (Frontend) :** [http://localhost:5173](http://localhost:5173)
   - ⚙️ **Serveur Backend (Express) :** [http://localhost:5000/api/health](http://localhost:5000/api/health)
   - 🧠 **Documentation API IA (Swagger Docs) :** [http://localhost:8000/docs](http://localhost:8000/docs)

3. **Arrêter l'environnement :**
   ```bash
   docker compose down
   ```

---

### Option B : Lancement Manuel (Développement local)

<details>
<summary>📂 Cliquer pour déplier le guide d'installation manuelle</summary>

#### Prérequis obligatoires
- **Node.js** (v18 ou supérieur)
- **Python 3.10** avec `pip`

#### 1. Initialiser le Backend API (Node/Express)
```bash
cd backend
npm install
npm start
```
*Le serveur Express démarrera sur le port `5000` et créera/mettra à jour automatiquement votre fichier de base de données SQLite local.*

#### 2. Démarrer le Service d'Intelligence Artificielle (FastAPI)
```bash
cd ml-service
python -m venv venv

# Windows :
venv\Scripts\activate
# macOS / Linux :
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
*Le serveur Uvicorn d'FastAPI s'exécutera sur le port `8000`.*

#### 3. Démarrer le Frontend (Vite/React)
```bash
cd market-place
npm install
npm run dev
```
*L'application sera lancée sur le port `5173`.*

</details>

---

## 🔌 Aperçu des API du Projet

### ⚙️ Backend Express API (Port `5000`)
| Méthode | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Vérification de statut (Health check) |
| `GET` | `/api/products` | Liste les produits disponibles |
| `GET` | `/api/rentals` | Liste les matériels agricoles en location |
| `POST` | `/api/login` | Authentification utilisateur (tous rôles) |
| `GET` | `/api/expert-categories` | Catégories de conseils experts avec compteurs |
| `POST` | `/api/expert-consultations/start` | Démarre une session d'assistance avec un expert |

### 🧠 ML Service API (Port `8000`)
| Méthode | Route | Type d'entrée | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | *Aucun* | Vérification du statut de l'API IA |
| `POST` | `/predict` | Form-Data (`file: Image`) | Soumission d'une image de plante pour classification |

---

## 🔑 Identifiants de Test (Rôles)

Pour tester pleinement les différents circuits (achats, attribution livreurs, conversations experts), voici les comptes pré-configurés :

| Rôle | Email d'accès | Mot de passe | Rôle Fonctionnel |
| :--- | :--- | :--- | :--- |
| 👑 **Administrateur** | `admin@injaz.ma` | `admin` | Gestion des commandes et logistique livreurs. |
| 🩺 **Expert Agronome** | `expert.plantes@ardcenter.com` | `Expert123!` | Réponse aux questions des fermiers, consultation. |
| 🧑‍🌾 **Agriculteur / Client** | `otmane@gmail.com` | `otmane` | Navigation, commande, chat expert et diagnostic IA. |

---

## 🧪 Spécifications du Modèle de Diagnostic IA

L'API de diagnostic utilise un modèle de réseau de neurones convolutifs **EfficientNet-B3** entraîné sur PyTorch. Il gère les classes de prédiction suivantes :

- **Oliviers (Olives)** 🫒 :
  - `Olive_Healthy` : Feuilles saines.
  - `Olive_Peacock_Spot` : Œil de paon (maladie cryptogamique).
  - `Olive_Aculus_Olearius` : Ravageur Aculus Olearius (acarien).
- **Tomates (Tomatoes)** 🍅 :
  - `Tomato_Healthy` : Plants sains.
  - `Tomato_Late_Blight` : Mildiou de la tomate.
  - `Tomato_Spider_Mite` : Tétranyque tisserand (araignée rouge).

*Si le taux de confiance calculé par le modèle est inférieur à **40%**, la plateforme invite l'utilisateur à reprendre une photo plus nette pour garantir la fiabilité du diagnostic.*

---

## 📁 Structure de l'Espace de Travail

```text
Marketplace/
├── backend/               # API Express et Base de données
│   ├── database.js        # Gestion SQLite, tables et migrations
│   ├── server.js          # Points de terminaison d'API
│   ├── market.sqlite      # Base de données locale pré-seedée
│   └── Dockerfile         # Dockerfile Backend
├── market-place/          # Frontend React SPA
│   ├── src/               # Composants React, Contextes et Styles
│   ├── public/            # Logo, icônes, illustrations statiques
│   ├── nginx.conf         # Config Nginx pour le routage d'URL SPA
│   └── Dockerfile         # Dockerfile Frontend
├── ml-service/            # IA & FastAPI
│   ├── main.py            # API et logique d'inférence PyTorch
│   ├── best_model (2).pth # Fichier de poids du modèle entraîné
│   └── Dockerfile         # Dockerfile IA
├── docker-compose.yml     # Orchestration multi-conteneurs
└── README.md              # Documentation du projet (ce fichier)
```

---

<p align="center">
  🌱 <i>ArdCenter - Cultiver l'avenir grâce à la technologie et à l'expertise.</i>
</p>
