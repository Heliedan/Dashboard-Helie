# 🤖 Dashboard Interactif

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-2.0+-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 📊 Fonctionnalités

### 🎯 Monitoring en temps réel
- **Balances** : Suivi USDC et BTC en direct
- **Prix BTC** : Récupération automatique depuis CoinGecko
- **Cycles actifs** : Vue détaillée de tous les cycles en cours
- **Performance** : Graphique des gains cumulés

### 📈 Graphiques avancés
- **Performance globale** : Évolution des gains cycle par cycle
- **Distribution des gains** : Histogramme par tranches
- **Cycles actifs détaillés** : 
  - Jauge séparée pour cycles en Achat vs Vente
  - Tendances sur 7/14/30 jours ou historique complet
  - Visualisation des patterns de trading

### ⚙️ Mode automatique
- Création de cycles à intervalle configurable (10 secondes à 24h)
- Update automatique des ordres toutes les 2 minutes
- Démarrage/arrêt à la volée
- Configuration persistante entre redémarrages

### 🛠️ Actions disponibles
- Création manuelle de nouveaux cycles
- Actualisation et mise à jour des ordres MEXC
- Annulation de cycles spécifiques
- Export CSV + JSON des données

## 🚀 Installation

### Prérequis
- Python 3.8+
- Un bot de trading compatible (avec base de données SQLite)
- Compte MEXC avec API activée

### 1. Cloner le repository
```bash
git clone https://github.com/Heliedan/Dashboard-Helie.git
cd bot-trading-mexc
```

### 2. Installer les dépendances
```bash
pip install flask requests
```

### 3. Configuration requise

Le dashboard nécessite :
- Une base de données SQLite (`db/bot.db`) créée par votre bot de trading
- Un fichier de configuration `bot.conf` avec vos clés API MEXC :
```bash
MEXC_API_KEY="votre_api_key"
MEXC_SECRET_KEY="votre_secret_key"
BUY_OFFSET= A DEFINIR
SELL_OFFSET= A DEFINIR
PERCENT= A DEFINIR
```

### 4. Lancer le dashboard
```bash
python3 dashboard.py
```

Accédez au dashboard : **http://localhost:8081**

## 📁 Structure
```
bot-trading-mexc/
├── dashboard.py           # Serveur Flask
├── templates/
│   └── dashboard.html     # Interface web
└── static/
    └── js/
        ├── main.js        # Logique principale
        ├── charts.js      # Gestion des graphiques
        ├── actions.js     # Actions utilisateur
        └── init.js        # Initialisation
```

## 🎮 Utilisation

### Linux / Mac
```bash
python3 dashboard.py
```

### Windows
```bash
python dashboard.py
```


### Mode automatique
1. Définir l'intervalle souhaité (en minutes)
2. Activer le toggle "Mode Automatique"
3. Le bot créera automatiquement des cycles

### Actions manuelles
- **🔄 Actualiser & Update** : Met à jour les ordres MEXC
- **➕ Nouveau Cycle** : Crée un nouveau cycle
- **❌ Cancel Cycle** : Annule un cycle par ID
- **📥 Exporter** : Télécharge CSV et JSON

## 🔧 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/data` | Données complètes |
| `/api/auto-status` | État du mode auto |
| `/api/auto-start` | Démarrer le mode auto |
| `/api/auto-stop` | Arrêter le mode auto |
| `/api/new-cycle` | Créer un cycle |
| `/api/update-cycles` | MAJ des cycles |
| `/api/cancel-cycle` | Annuler un cycle |
| `/api/export` | Exporter les données |

## 🎨 Technologies

- **Backend** : Flask (Python)
- **Frontend** : HTML5, CSS3, JavaScript ES6+
- **Graphiques** : Chart.js 4.4.0
- **Base de données** : SQLite3
- **API** : MEXC API v3, CoinGecko API

## ⚠️ Avertissements

- **Trading à vos risques** : Ce dashboard est fourni à titre éducatif
- **Sécurité** : Ne partagez jamais vos clés API
- **N'exposez pas** le dashboard sur Internet sans authentification

## 📝 License

MIT License

---

**⚡ Fait avec passion pour le trading automatisé**

Developeur et concepteur du Dashboard Héliédan.
