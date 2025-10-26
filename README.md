# 🤖 Bot-Spot Dashboard

Dashboard web pour monitorer et contrôler votre bot de trading bot-spot.

## 📋 Prérequis

- Python 3.8+
- [Bot-Spot](https://github.com/netwarp/bot-spot) installé et configuré
- Clés API MEXC configurées dans `bot.conf`

## 🚀 Installation
```bash
# Dans votre dossier bot-spot existant
cd ~/bot-spot

# Téléchargez les fichiers du dashboard
wget https://github.com/Heliedan/bot-spot-dashboard/archive/main.zip
unzip main.zip
cp -r bot-spot-dashboard-main/* .
rm -rf bot-spot-dashboard-main main.zip
```

**Ou avec git :**
```bash
cd ~/bot-spot
git clone https://github.com/Heliedan/bot-spot-dashboard.git temp
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

Accédez au dashboard : **http://localhost:8081**

## ✨ Fonctionnalités

- 📊 Monitoring en temps réel (balances, prix BTC, cycles actifs)
- 📈 Graphiques de performance
- ⚙️ Mode automatique avec intervalles configurables
- 🛠️ Configuration du bot en direct
- 📥 Export CSV/JSON

## ⚠️ Avertissement

Le trading comporte des risques. Ne partagez jamais vos clés API.

## 📧 Support

Pour toute question : [@Heliedan](https://github.com/Heliedan)
