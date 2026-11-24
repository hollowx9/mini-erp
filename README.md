# Mini ERP

Application web de gestion d'entreprise (ERP) développée en **React** et **Node.js / Express**, avec une base de données **MySQL**.
Elle centralise la gestion des stocks, des ventes, des paiements et des ressources humaines, avec des accès différents selon le rôle de l'utilisateur.

> Projet personnel réalisé par **Arwind Manogaran**, élève ingénieur en 5e année à l'ESIEA.

<!-- Ajoute ici 1 ou 2 captures d'écran, par exemple : ![Tableau de bord](docs/dashboard.png) -->

## Fonctionnalités

- **Authentification** : inscription, connexion par JWT, mot de passe oublié avec lien de réinitialisation envoyé par e-mail.
- **Rôles** : `admin` et `user`, avec des routes protégées côté interface et côté API.
- **Tableau de bord** : indicateurs clés (employés, produits, commandes, chiffre d'affaires, produits en stock bas) et graphiques.
- **Stock** : gestion des produits (référence SKU, prix, quantité) avec seuil d'alerte de stock bas.
- **Ventes** : création de commandes multi-produits, avec mise à jour automatique du stock (transactions SQL).
- **Finance** : enregistrement des paiements, suivi du reste à payer, statut des commandes et **génération de factures PDF**.
- **Ressources humaines** : employés, présences, demandes de congé avec validation, soldes de congés, jours fériés, demandes de permission.
- **Notifications** : alertes envoyées aux administrateurs lors des nouvelles demandes.

## Stack technique

| Partie | Technologies |
|---|---|
| Frontend | React 19, Vite, React Router, Axios, Chart.js, jsPDF, React Toastify, Lucide |
| Backend | Node.js, Express 5, JWT, bcrypt, Nodemailer |
| Base de données | MySQL (mysql2, requêtes paramétrées) |

## Structure

```
mini-erp/
├── backend/          API REST Express
│   └── src/
│       ├── config/       connexion MySQL
│       ├── controllers/  logique métier
│       ├── middlewares/  authentification JWT et contrôle des rôles
│       └── routes/       routes de l'API
├── frontend/         Application React (Vite)
│   └── src/
│       ├── components/   composants réutilisables et mise en page
│       ├── context/      contexte d'authentification
│       ├── pages/        pages de l'application
│       ├── routes/       routes protégées par rôle
│       └── services/     appels à l'API
└── database/
    └── schema.sql    création des tables + compte admin de démonstration
```

## Installation

Prérequis : Node.js 20 ou plus et MySQL 8.

```bash
# 1. Base de données
mysql -u root -p < database/schema.sql

# 2. Backend
cd backend
cp .env.example .env      # puis remplis tes propres valeurs
npm install
npm run dev               # API sur http://localhost:5000

# 3. Frontend (dans un autre terminal)
cd frontend
cp .env.example .env
npm install
npm run dev               # application sur http://localhost:5173
```

Compte administrateur de démonstration : `admin@demo.local` / `Admin123!` (à changer après la première connexion).

## Pistes d'amélioration

- Migration progressive vers TypeScript.
- Tests automatisés (Jest / Supertest pour l'API, React Testing Library pour l'interface).
- Découpage des pages les plus longues en composants plus petits.
