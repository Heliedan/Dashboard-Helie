# 🤖 Dashboard Heliedan

Dashboard web pour monitorer et contrôler votre bot de trading.

## 📋 Prérequis

- Python 3.8+
- Bot-Spot installé et configuré
- Clés API MEXC configurées dans `bot.conf`

## 🚀 Installation
```bash
# Dans votre dossier bot-spot existant
cd ~/bot-spot

# Téléchargez les fichiers du dashboard
wget https://github.com/Heliedan/Dashboard-Helie/archive/v2.zip
unzip v2.zip
cp -r Dashboard-Helie-v2/* .
rm -rf Dashboard-Helie-v2 v2.zip
```

**Ou avec git :**
```bash
cd ~/bot-spot
git clone -b v2 https://github.com/Heliedan/Dashboard-Helie.git temp
cp -r temp/* .
rm -rf temp
```

## 📦 Dépendances
```bash
pip install flask requests
```

## ▶️ Utilisation
```bash
python3 dashboard.py
```

**Accès local :** http://localhost:8081  
**Accès réseau :** http://VOTRE_IP:8081 (remplacez VOTRE_IP par l'IP de votre Raspberry Pi)

💡 *Pour trouver votre IP : `hostname -I`*

## ✨ Fonctionnalités

### 🏠 Vue d'ensemble
- 📊 Monitoring en temps réel (balances USDC/BTC, prix, cycles)
- 💰 Gain total réalisé et gain potentiel des ordres actifs
- ⚙️ Mode automatique avec intervalles configurables
- 🛠️ Configuration des offsets en direct

### 📊 Analytics
- 📈 Statistiques détaillées (taux de réussite, gain moyen, volatilité)
- 🏆 Top 10 meilleurs trades et Bottom 10 moins rentables

### 🔄 Cycles
- 📋 Vue complète de tous vos cycles (actifs et terminés)
- 📥 Export CSV/JSON

### 📈 Marché
- 💹 Prix BTC en temps réel avec graphique (24h, 7j, 3M)
- 📊 Indicateurs de marché (volume, market cap, liquidité)
- 🎯 Fear & Greed Index avec jauge visuelle
- 📉 Dominance BTC/ETH et distance ATH
- 💡 Recommandations d'achat/vente automatiques

### 📝 Gestion des Ordres
- ✏️ Modification manuelle des prix de vente
- 🔄 Synchronisation automatique avec MEXC
- 👁️ Aperçu du gain en temps réel

### 🎯 Profils de Trading
- 📝 Profils pré-configurés pour différentes conditions de marché
- ➕ Création de profils personnalisés
- ⚡ Application rapide des configurations

## 🎨 Interface

- Design moderne et responsive
- Mode sombre optimisé
- Graphiques interactifs
- Actualisation automatique toutes les 3 minutes

## 📧 Support

Pour toute question : [@Heliedan](https://github.com/Heliedan)