# 🤖 Bot Dashboard Heliedan - Dashboard

Dashboard web moderne pour monitorer et contrôler un bot de trading automatisé sur MEXC.

## 📊 Fonctionnalités

### 🎯 Monitoring en temps réel
- **Balances** : Suivi USDC et BTC en direct
- **Prix BTC** : Récupération automatique depuis CoinGecko
- **Cycles actifs** : Vue détaillée de tous les cycles en cours
- **Performance** : Graphique des gains cumulés

### 📈 Graphiques avancés
- **Performance globale** : Évolution des gains cycle par cycle avec échelle adaptative
- **Distribution des gains** : Histogramme par tranches avec échelle dynamique
- **Cycles actifs détaillés** : 
  - Jauge séparée pour cycles en Achat vs Vente
  - Tendances sur 7/14/30 jours ou historique complet
  - Visualisation des patterns de trading

### ⚙️ Mode automatique
- Création de cycles à intervalle configurable (10 secondes à 24h)
- Update automatique des ordres toutes les 2 minutes
- Démarrage/arrêt à la volée
- Configuration persistante entre redémarrages

### 🛠️ Configuration Bot
- **Modification des paramètres en direct** : Buy Offset, Sell Offset, Percent
- **Sauvegarde instantanée** dans bot.conf
- **Mise à jour automatique** de l'affichage
- Interface intuitive et sécurisée

### 🎮 Actions disponibles
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
cd Dashboard-Helie
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
Dashboard-Helie/
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

### Configuration Bot
1. Modifiez les valeurs de **Buy Offset**, **Sell Offset** ou **Percent (%)**
2. Cliquez sur **💾 Sauvegarder**
3. Les paramètres sont mis à jour instantanément dans `bot.conf`

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

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/data` | GET | Données complètes du dashboard |
| `/api/auto-status` | GET | État du mode automatique |
| `/api/auto-start` | POST | Démarrer le mode auto |
| `/api/auto-stop` | POST | Arrêter le mode auto |
| `/api/auto-config` | POST | Modifier l'intervalle |
| `/api/get-config` | GET | Récupérer la configuration actuelle |
| `/api/update-config` | POST | Mettre à jour la configuration |
| `/api/performance` | GET | Données de performance |
| `/api/gains-distribution` | GET | Distribution des gains |
| `/api/active-cycles-history-split` | GET | Historique séparé Buy/Sell |
| `/api/new-cycle` | POST | Créer un cycle |
| `/api/update-cycles` | POST | MAJ des cycles |
| `/api/cancel-cycle` | POST | Annuler un cycle |
| `/api/export` | POST | Exporter les données |

## 🎨 Technologies

- **Backend** : Flask (Python)
- **Frontend** : HTML5, CSS3, JavaScript ES6+
- **Graphiques** : Chart.js 4.4.0 avec échelles adaptatives
- **Base de données** : SQLite3
- **API** : MEXC API v3, CoinGecko API

## 📱 Responsive Design

Le dashboard est entièrement responsive et s'adapte aux écrans :
- Desktop (1920px+)
- Laptop (1366px+)
- Tablet (768px+)
- Mobile (320px+)

## ⚠️ Avertissements

- **Trading à vos risques** : Ce dashboard est fourni à titre éducatif. Le trading comporte des risques de perte en capital.
- **Sécurité** : Ne partagez jamais vos clés API
- **Exposition** : N'exposez pas le dashboard sur Internet sans authentification

## 🐛 Debug

Les logs du serveur s'affichent dans le terminal :
```bash
✅ Config chargee: 12 parametres
🚀 Thread auto-cycle demarre
🌐 URL: http://localhost:8081
```

Console navigateur (F12) pour les erreurs frontend.

## 👨‍💻 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📧 Support

Pour toute question ou problème, adressez vous au concepteur Héliédan

---

**⚡ Fait avec passion pour le trading automatisé**
