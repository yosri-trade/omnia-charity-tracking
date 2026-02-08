# 🌟 OMNIA Charity Tracking

> **#MaraTechEsprit2026**

Application web de suivi terrain au service de l'**Association Omnia**. Outil de gestion des familles bénéficiaires, des visites humanitaires et de la traçabilité des interventions.

---

## 📖 Description du projet

**OMNIA Charity Tracking** est une solution web complète conçue pour accompagner les associations humanitaires dans leurs opérations de terrain. L'application permet de gérer les familles bénéficiaires, d'enregistrer les visites avec preuve GPS, de planifier les missions et de visualiser les besoins sur une carte interactive.

L'application ne gère **ni dons, ni paiements, ni reçus** — elle se concentre exclusivement sur le **suivi humanitaire** et la **traçabilité des interventions**.

---

## 🏛️ L'Association Omnia

L'**Association Omnia** est l'organisme bénéficiaire de cette solution. Elle œuvre sur le terrain pour accompagner les familles en difficulté. Cette application lui permet de :

- Structurer et centraliser les données des familles suivies
- Garantir la traçabilité des visites et de l'aide apportée
- Prioriser les interventions grâce aux alertes et à la cartographie
- Produire des récits d'impact pour communiquer avec les partenaires

---

## 👥 Équipe

| Membre | Rôle |
|--------|------|
| **Zaineb Ben Dhaw** | Développement |
| **Yosri Hamdouni** | Développement |

---

## ✨ Fonctionnalités principales

### 👨‍👩‍👧‍👦 Gestion des familles bénéficiaires
- Fiche famille (nom, adresse, téléphone, statut, composition)
- Localisation GPS avec carte interactive
- Historique des visites par famille
- Statut et priorité (ACTIVE, URGENT)
- **Impact Story** : résumé narratif automatique de l'accompagnement

### 📋 Visites terrain et suivi de l'aide
- Création et enregistrement des visites (date, bénévole, famille, type d'aide)
- **Check-in GPS** comme preuve de présence sur site
- Photo preuve recommandée
- Notes avec support dictée vocale (Speech-to-Text)
- Historique complet par famille et par bénévole

### 🗺️ Cartographie interactive
- Carte Leaflet des familles et zones d'intervention
- **Heatmap des besoins** pour prioriser les zones
- Géolocalisation des points de visite
- Visualisation des familles géolocalisées

### 🔔 Alertes
- **Alertes urgentes** : familles en situation critique
- **Alertes « oubliées »** : familles sans visite depuis 30 jours
- Planification de visites depuis les alertes

### 📦 Gestion des stocks
- Inventaire des articles (alimentaire, médical, vêtements, etc.)
- Seuils d'alerte en cas de pénurie
- Suivi des stocks et dons

### 🎯 Missions terrain
- Missions ouvertes et missions assignées
- Suivi de l'avancement (visites réalisées / prévues)
- Check-in GPS pour validation de présence

### 🔐 Contrôle d'accès (RBAC)
- **Bénévole** : missions, visites, check-in
- **Coordinateur** : familles, alertes, carte, stocks, missions
- **Administrateur** : tout + gestion des utilisateurs

### ♿ Accessibilité et personnalisation
- Mode sombre / mode clair
- Taille de police (Standard, Grand, Très Grand)
- Épaisseur du texte (Normal, Moyen, Gras)
- Interface multilingue (Français, Anglais, Arabe)
- Support RTL pour l'arabe
- Adaptabilité mobile (cartes, menu hamburger, safe area)

---

## 🛠️ Technologies utilisées

### Frontend
| Technologie | Rôle |
|-------------|------|
| **React 18** | Interface utilisateur |
| **Vite** | Build et développement |
| **Tailwind CSS v4** | Styles et responsive |
| **React Router** | Navigation |
| **Leaflet** | Cartes interactives et heatmap |
| **Recharts** | Graphiques du dashboard |
| **i18next** | Internationalisation (fr, en, ar) |
| **jsPDF** | Génération de rapports PDF |
| **Axios** | Appels API |

### Backend
| Technologie | Rôle |
|-------------|------|
| **Node.js** | Runtime serveur |
| **Express.js** | API REST |
| **MongoDB** | Base de données |
| **Mongoose** | Modèles et schémas |
| **JWT** | Authentification |
| **Bcrypt** | Mots de passe |
| **CORS** | Cross-Origin |

### Outils
- **ESLint** — Qualité du code  
- **Prettier** — Formatage  
- **Git** — Versioning  

---

## 🚀 Installation

### Prérequis
- **Node.js** v18 ou supérieur
- **MongoDB** (local ou [MongoDB Atlas](https://www.mongodb.com/atlas))
- **npm** ou **yarn**

### 1. Cloner le dépôt
```bash
git clone <url-du-repository>
cd omnia-charity-tracking
```

### 2. Installer les dépendances
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configuration des variables d'environnement

**Backend** — Copier `backend/.env.example` vers `backend/.env` :
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/omnia-charity
JWT_SECRET=votre-cle-secrete-jwt-minimum-64-caracteres
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

**Frontend** — Copier `frontend/.env.example` vers `frontend/.env` :
```
VITE_API_URL=http://localhost:5000/api
VITE_APP_ENV=development
```

### 4. Créer un administrateur (optionnel)
```bash
cd backend
npm run create-admin
# Décommenter et remplir ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME dans .env
```

---

## 📱 Utilisation

### Démarrer l'application en développement

**Terminal 1 — Backend :**
```bash
cd backend
npm run dev
```
Le serveur API démarre sur `http://localhost:5000`

**Terminal 2 — Frontend :**
```bash
cd frontend
npm run dev
```
L'application est accessible sur `http://localhost:5173`

### Build de production
```bash
# Frontend
cd frontend
npm run build

# Le backend se lance avec :
cd backend
npm start
```

---

## 📁 Structure du projet

```
omnia-charity-tracking/
├── backend/                 # API Node.js + Express
│   ├── src/
│   │   ├── config/          # Configuration (DB)
│   │   ├── controllers/     # Logique métier
│   │   ├── middleware/      # Auth, RBAC, erreurs
│   │   ├── models/          # User, Family, Visit, Item
│   │   ├── routes/          # Routes API
│   │   ├── app.js
│   │   └── server.js
│   └── scripts/
│       └── create-admin.js
│
├── frontend/                # Application React + Vite
│   ├── src/
│   │   ├── components/      # AppNavbar, Sidebar, modales, cartes
│   │   ├── context/         # Auth, Theme, FontSize, FontWeight
│   │   ├── hooks/           # useLanguageDirection
│   │   ├── locales/         # fr.json, en.json, ar.json
│   │   ├── pages/           # Dashboard, Alerts, Map, etc.
│   │   ├── services/        # Appels API
│   │   └── utils/           # geo, imageCompression, etc.
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── tests/
│   └── api.http
└── README.md
```

---

## 🌐 Hébergement recommandé

| Service | Usage |
|---------|-------|
| **Vercel** | Frontend |
| **Render** | Backend API |
| **MongoDB Atlas** | Base de données |

---

## 📄 Licence

[À définir]

---

## 🤝 Contribution

Projet réalisé dans le cadre du hackathon **#MaraTechEsprit2026**. Contributions bienvenues dans le respect du périmètre (suivi terrain et impact humanitaire).

---

<p align="center">
  <strong>#MaraTechEsprit2026</strong>
</p>
