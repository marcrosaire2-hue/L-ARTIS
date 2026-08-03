# Artisans Marketplace

Plateforme SaaS de mise en relation entre artisans et clients — **spécifiquement conçue pour le Bénin** (hiérarchie géographique départements → communes → quartiers, devise XOF/FCFA).

## Architecture (monorepo)

```
artisans-marketplace/
├── server/   # API REST Node.js + Express + MongoDB (MVC)
├── client/   # Site principal React (Vite + Tailwind)   — Phase 6
└── admin/    # Panneau d'administration React           — Phase 7
```

## Stack technique

| Couche | Technologies |
|---|---|
| Backend | Node.js 22, Express 4, Mongoose 8, JWT, bcryptjs, Socket.IO |
| Frontend | React 19, Vite 8, React Router 7, Redux Toolkit (RTK Query), Tailwind CSS 4, React Hook Form, Zod, Framer Motion |
| Base de données | MongoDB |
| Sécurité | Helmet, CORS restreint, express-rate-limit, validation stricte, sanitation |
| Qualité | MVC, SOLID, DRY, gestion centralisée des erreurs, Winston |

## Démarrage rapide (backend)

```bash
cd server
npm install
cp .env.example .env        # adapter les valeurs
npm run dev                 # http://localhost:5000/api/v1
```

Health check : `GET http://localhost:5000/api/v1/health`

Créer un compte administrateur :

```bash
node src/scripts/createAdmin.js <email> <motdepasse> <prénom> <nom> super
```

## Démarrage rapide (admin)

```bash
cd admin
npm install
cp .env.example .env        # VITE_API_URL si l'API n'est pas sur :5000
npm run dev                 # http://localhost:5174
```

Le port **5174 est imposé** : il doit correspondre à `ADMIN_URL` côté serveur,
seule origine acceptée par le CORS (le cookie de refresh voyage avec les
requêtes, donc `credentials: 'include'` + origine whitelistée).

| Page | Rôle |
|---|---|
| `/` | Compteurs et files d'attente de modération |
| `/artisans` | Validation, refus et suspension des fiches |
| `/utilisateurs` | Suspension, réactivation, suppression des comptes |
| `/avis` | Modération des avis (publier / masquer) |
| `/catalogue` | CRUD des catégories et des métiers |

## Conventions API

- Préfixe : `/api/v1`
- Réponse standard : `{ success, statusCode, message, data, meta }`
- Erreurs : `{ success: false, statusCode, message, details? }`
- Auth : `Authorization: Bearer <access_token>` + refresh token en cookie `httpOnly`
