# OMNIA CHARITY TRACKING

## 📋 Vue d'ensemble

**OMNIA CHARITY TRACKING** est un projet hackathon au service de l'**Association Omnia**. C'est une application web centrée sur les **opérations de terrain** : suivi des familles bénéficiaires, visites sur le terrain, preuves de passage et mesure d'impact. Elle ne gère **ni dons, ni paiements, ni reçus** — uniquement le suivi humanitaire et la traçabilité des interventions.

### Vision

Offrir à l'Association Omnia un outil de **suivi terrain** qui permet de :
- **Gérer les familles bénéficiaires** et leurs besoins de façon structurée
- **Enregistrer les visites** et l'aide apportée avec preuve de présence (GPS)
- **Planifier et piloter les missions** de terrain
- **Visualiser les besoins** et les interventions sur une carte (heatmap)
- **Signaler les situations urgentes** ou les familles oubliées
- **Produire des récits d'impact** par famille pour communiquer l'impact réel
- **Traiter les données de manière éthique** avec des accès restreints par rôle

## 👥 Utilisateurs cibles

1. **Bénévoles terrain** — Collecte de données sur le terrain, enregistrement des visites, check-in GPS
2. **Coordinateurs terrain** — Planification des missions, attribution des familles, suivi des alertes
3. **Président de l'association (admin)** — Vue d'ensemble, rapports d'impact, gestion des utilisateurs et des accès

## ✨ Fonctionnalités principales

### Gestion des familles bénéficiaires
- Fiche famille (composition, besoins, localisation)
- Historique des visites et de l'aide apportée par famille
- Statut et priorité (urgence, suivi régulier, etc.)
- **Impact Story** : résumé narratif automatique de l'accompagnement par famille

### Visites terrain et suivi de l'aide
- Création et enregistrement des visites (date, bénévole, famille, type d'aide)
- **Check-in GPS** comme preuve de visite sur site
- Suivi des types d'aide distribuée (sans dimension financière / paiement)
- Historique complet par famille et par bénévole

### Cartographie interactive et heatmap
- **Carte interactive** (Leaflet) des familles et des zones d'intervention
- **Heatmap des besoins** pour prioriser les zones
- Visualisation des visites et des missions passées
- Géolocalisation des points de visite (check-in)

### Alertes
- **Alertes urgentes** : familles en situation critique à traiter en priorité
- **Alertes « oubliées »** : familles sans visite depuis X temps
- Notifications pour coordinateurs et admin
- Suivi du traitement des alertes

### Missions terrain
- **Planification de missions** : objectifs, zone, bénévoles, familles ciblées
- Attribution familles ↔ missions
- Suivi de l'avancement (visites réalisées / prévues)
- Bilan de mission (optionnel pour rapports)

### Données éthiques et accès par rôle
- **Contrôle d'accès (RBAC)** : bénévole, coordinateur, admin
- Données sensibles limitées au besoin (principe du moindre accès)
- Traçabilité des actions (qui a vu/modifié quoi, si pertinent)
- Posture « humanitarian-first » sur la protection des données

### Tableau de bord et impact
- **Dashboard** : indicateurs clés (familles suivies, visites, alertes, missions)
- Synthèse par zone, par période, par bénévole
- **Impact Story** par famille : récit automatique pour communication interne ou partenaires
- Pas de module don/paiement : focus 100 % suivi terrain et impact

## 🛠️ Stack technique

### Frontend
- **React 18+** — Interface utilisateur
- **Vite** — Build et dev rapide
- **Tailwind CSS** — Styles et responsive
- **Leaflet** — Cartes interactives et heatmap
- **React Router** — Navigation
- **Axios** — Appels API

### Backend
- **Node.js** — Runtime serveur
- **Express.js** — API REST
- **MongoDB** — Données (familles, visites, missions, alertes, utilisateurs)
- **Mongoose** — Modèles et schémas
- **JWT** — Authentification
- **Bcrypt** — Mots de passe

### Outils
- **ESLint** — Qualité du code
- **Prettier** — Formatage
- **Git** — Versioning

## 📁 Structure du projet

```
omnia-charity-tracking/
│
├── frontend/                    # Application React + Vite
│   ├── public/                  # Fichiers statiques
│   ├── src/
│   │   ├── assets/              # Images, icônes, polices
│   │   ├── components/          # Composants réutilisables
│   │   │   ├── common/          # Button, Input, etc.
│   │   │   ├── layout/          # Header, Footer, Sidebar
│   │   │   ├── maps/            # Cartes Leaflet, heatmap
│   │   │   └── forms/           # Formulaires
│   │   ├── pages/               # Pages de l'application
│   │   │   ├── Dashboard/       # Tableau de bord
│   │   │   ├── Families/        # Gestion des familles bénéficiaires
│   │   │   ├── Visits/          # Visites terrain & aide
│   │   │   ├── Missions/        # Planification missions terrain
│   │   │   ├── Alerts/          # Alertes urgentes / oubliées
│   │   │   ├── Map/             # Carte interactive & heatmap
│   │   │   └── Reports/         # Impact, récits, synthèses
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # Appels API
│   │   ├── store/               # État global
│   │   ├── utils/               # Utilitaires
│   │   ├── styles/              # Styles globaux, Tailwind
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── backend/                     # API Node.js + Express
│   ├── src/
│   │   ├── config/              # DB, JWT, etc.
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── family.controller.js
│   │   │   ├── visit.controller.js
│   │   │   ├── mission.controller.js
│   │   │   ├── alert.controller.js
│   │   │   └── report.controller.js
│   │   ├── models/
│   │   │   ├── User.model.js
│   │   │   ├── Family.model.js
│   │   │   ├── Visit.model.js
│   │   │   ├── Mission.model.js
│   │   │   └── Alert.model.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── family.routes.js
│   │   │   ├── visit.routes.js
│   │   │   ├── mission.routes.js
│   │   │   ├── alert.routes.js
│   │   │   └── report.routes.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── rbac.middleware.js
│   │   │   ├── validation.middleware.js
│   │   │   └── error.middleware.js
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   ├── package.json
│   └── .gitignore
│
├── docs/
│   ├── api/                     # Documentation API
│   └── architecture/            # Architecture & décisions
│
├── .gitignore
└── README.md
```

## 🚀 Installation et démarrage

### Prérequis
- Node.js (v18+)
- MongoDB (local ou Atlas)
- npm ou yarn

### Installation

```bash
git clone <repository-url>
cd omnia-charity-tracking

cd frontend && npm install
cd ../backend && npm install
```

### Configuration

- **Backend** : copier `backend/.env.example` → `backend/.env`  
  - `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `FRONTEND_URL`
- **Frontend** : copier `frontend/.env.example` → `frontend/.env`  
  - `VITE_API_URL`

### Démarrage

```bash
# Backend (dans backend/)
npm run dev

# Frontend (dans frontend/)
npm run dev
```

## 📝 Conventions

- **Nommage** : camelCase (variables/fonctions), PascalCase (composants)
- **Structure** : un composant par fichier, organisation par fonctionnalité
- **Formatage** : Prettier
- **Commentaires** : pour la logique métier non évidente

## 🤝 Contribution

Projet hackathon pour l'Association Omnia. Contributions bienvenues dans le respect du périmètre (suivi terrain et impact, pas de gestion des dons/paiements).

## 📄 Licence

[À définir]

## 👨‍💻 Équipe

[À compléter]

---

*Projet en développement. Documentation mise à jour au fil de l'avancement.*
