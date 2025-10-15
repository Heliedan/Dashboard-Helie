import sqlite3
import requests
import os
import hmac
import hashlib
import time
import subprocess
import json
import threading
from flask import Flask, render_template, jsonify, request, send_file
from datetime import datetime, timedelta

app = Flask(__name__, static_folder='static', static_url_path='/static')

DB_PATH = "db/bot.db"
CONFIG = {}
BTC_PRICE_CACHE = {"price": 0, "timestamp": 0}
CACHE_DURATION = 60

AUTO_CONFIG_FILE = "auto_config.json"
AUTO_STATE = {
    "enabled": False,
    "interval_minutes": 30,
    "last_cycle_time": None,
    "next_cycle_time": None
}

def load_config():
    global CONFIG
    if not os.path.exists("bot.conf"):
        print("⚠️  Fichier bot.conf introuvable")
        return
    with open("bot.conf", "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, value = line.split("=", 1)
                CONFIG[key] = value.strip('"')
    print(f"✅ Config chargee: {len(CONFIG)} parametres")

def load_auto_config():
    global AUTO_STATE
    try:
        if os.path.exists(AUTO_CONFIG_FILE):
            with open(AUTO_CONFIG_FILE, "r") as f:
                saved_config = json.load(f)
                AUTO_STATE.update(saved_config)
                print(f"✅ Config auto chargee: enabled={AUTO_STATE['enabled']}, interval={AUTO_STATE['interval_minutes']}min")
    except Exception as e:
        print(f"⚠️  Erreur chargement config auto: {e}")

def init_database():
    print("✅ Init DB: rien à faire")

def reset_autoincrement():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT MAX(id) FROM cycles")
        max_id = cursor.fetchone()[0]
        if max_id is None:
            max_id = 0
        cursor.execute("UPDATE sqlite_sequence SET seq = ? WHERE name = 'cycles'", (max_id,))
        conn.commit()
        conn.close()
        print(f"✅ Compteur auto-increment réinitialisé: prochain ID = {max_id + 1}")
        return True
    except Exception as e:
        print(f"❌ Erreur reset autoincrement: {e}")
        return False

def save_auto_config():
    try:
        with open(AUTO_CONFIG_FILE, "w") as f:
            json.dump(AUTO_STATE, f, indent=2)
    except Exception as e:
        print(f"❌ Erreur sauvegarde config auto: {e}")

def create_cycle_auto():
    try:
        print(f"\n{'='*60}")
        print(f"🤖 CREATION AUTO D'UN CYCLE - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*60}")
        result = subprocess.run(['go', 'run', '.', '-n'], cwd=os.getcwd(), capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            print("✅ Cycle cree automatiquement avec succes!")
            print(result.stdout)
            return True
        else:
            print(f"❌ Erreur creation cycle auto: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Exception creation cycle auto: {e}")
        return False

def update_cycles_auto():
    try:
        result = subprocess.run(['go', 'run', '.', '-u'], cwd=os.getcwd(), capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            print("✅ Cycles mis à jour automatiquement")
            return True
        else:
            print(f"⚠️  Erreur update cycles: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Exception update cycles: {e}")
        return False

def auto_cycle_worker():
    print("🚀 Thread auto-cycle demarre (update toutes les 2 minutes)")
    while True:
        try:
            time.sleep(120)
            print(f"\n🔄 Mise à jour automatique des cycles - {datetime.now().strftime('%H:%M:%S')}")
            update_cycles_auto()
            if AUTO_STATE["enabled"]:
                now = datetime.now()
                if AUTO_STATE["next_cycle_time"] is not None:
                    next_cycle = datetime.fromisoformat(AUTO_STATE["next_cycle_time"])
                    if now >= next_cycle:
                        print(f"⏰ Temps écoulé, création d'un cycle automatique")
                        if create_cycle_auto():
                            AUTO_STATE["last_cycle_time"] = now.isoformat()
                            AUTO_STATE["next_cycle_time"] = (now + timedelta(minutes=AUTO_STATE["interval_minutes"])).isoformat()
                            save_auto_config()
        except Exception as e:
            print(f"❌ Erreur dans auto_cycle_worker: {e}")

def get_cycles_from_db():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM cycles ORDER BY id DESC")
        cycles = [dict(row) for row in cursor.fetchall()]
        cursor.execute("SELECT * FROM cycles WHERE status = 'completed'")
        completed = [dict(row) for row in cursor.fetchall()]
        cursor.execute("SELECT COUNT(*) as total FROM cycles")
        total_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) as completed FROM cycles WHERE status = 'completed'")
        completed_count = cursor.fetchone()[0]
        conn.close()
        print(f"✅ DB: {len(cycles)} cycles charges, {completed_count} completes")
        return {"cycles": cycles, "completed": completed, "total_count": total_count, "completed_count": completed_count}
    except Exception as e:
        print(f"❌ Erreur DB: {e}")
        return {"cycles": [], "completed": [], "total_count": 0, "completed_count": 0}

def calculate_stats(completed_cycles):
    total_buy = 0
    total_sell = 0
    for cycle in completed_cycles:
        buy_amount = cycle.get("buyPrice", 0) * cycle.get("quantity", 0)
        sell_amount = cycle.get("sellPrice", 0) * cycle.get("quantity", 0)
        total_buy += buy_amount
        total_sell += sell_amount
    gain_abs = total_sell - total_buy
    gain_percent = (gain_abs / total_buy * 100) if total_buy > 0 else 0
    return {"total_buy": round(total_buy, 2), "total_sell": round(total_sell, 2), "gain_abs": round(gain_abs, 2), "gain_percent": round(gain_percent, 2)}

def get_btc_price_coingecko():
    global BTC_PRICE_CACHE
    current_time = time.time()
    if BTC_PRICE_CACHE["price"] > 0 and (current_time - BTC_PRICE_CACHE["timestamp"]) < CACHE_DURATION:
        return BTC_PRICE_CACHE["price"]
    try:
        url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
        response = requests.get(url, timeout=5)
        data = response.json()
        price = round(data["bitcoin"]["usd"], 2)
        BTC_PRICE_CACHE["price"] = price
        BTC_PRICE_CACHE["timestamp"] = current_time
        return price
    except Exception as e:
        print(f"❌ Erreur CoinGecko: {e}")
        return BTC_PRICE_CACHE["price"] if BTC_PRICE_CACHE["price"] > 0 else 0

def create_mexc_signature(query_string, secret_key):
    return hmac.new(secret_key.encode('utf-8'), query_string.encode('utf-8'), hashlib.sha256).hexdigest()

def get_mexc_balances():
    try:
        api_key = CONFIG.get("MEXC_API_KEY", "")
        secret_key = CONFIG.get("MEXC_SECRET_KEY", "")
        if not api_key or not secret_key:
            return {"usdc": 0, "btc": 0}
        timestamp = int(time.time() * 1000)
        query_string = f"timestamp={timestamp}"
        signature = create_mexc_signature(query_string, secret_key)
        url = f"https://api.mexc.com/api/v3/account?{query_string}&signature={signature}"
        headers = {"X-MEXC-APIKEY": api_key}
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return {"usdc": 0, "btc": 0}
        data = response.json()
        balances = data.get("balances", [])
        usdc_balance = 0
        btc_balance = 0
        for balance in balances:
            asset = balance.get("asset", "")
            free = float(balance.get("free", "0"))
            locked = float(balance.get("locked", "0"))
            total = free + locked
            if asset == "USDC":
                usdc_balance = total
            elif asset == "BTC":
                btc_balance = total
        return {"usdc": round(usdc_balance, 2), "btc": round(btc_balance, 8)}
    except Exception as e:
        print(f"❌ Erreur MEXC: {e}")
        return {"usdc": 0, "btc": 0}

def get_latest_export_files():
    try:
        export_dir = "exports"
        if not os.path.exists(export_dir):
            return None, None
        files = os.listdir(export_dir)
        csv_files = sorted([f for f in files if f.endswith('.csv')], reverse=True)
        json_files = sorted([f for f in files if f.endswith('.json')], reverse=True)
        csv_file = csv_files[0] if csv_files else None
        json_file = json_files[0] if json_files else None
        return csv_file, json_file
    except Exception as e:
        print(f"Erreur get_latest_export_files: {e}")
        return None, None

@app.route('/')
def index():
    return render_template('dashboard.html')

@app.route('/api/auto-status')
def get_auto_status():
    now = datetime.now()
    status = {"enabled": AUTO_STATE["enabled"], "interval_minutes": AUTO_STATE["interval_minutes"], "last_cycle_time": AUTO_STATE["last_cycle_time"], "next_cycle_time": AUTO_STATE["next_cycle_time"], "minutes_remaining": None}
    if AUTO_STATE["enabled"] and AUTO_STATE["next_cycle_time"]:
        next_cycle = datetime.fromisoformat(AUTO_STATE["next_cycle_time"])
        remaining = (next_cycle - now).total_seconds() / 60
        status["minutes_remaining"] = max(0, round(remaining, 1))
    return jsonify(status)

@app.route('/api/auto-start', methods=['POST'])
def start_auto():
    try:
        data = request.json or {}
        interval = data.get('interval_minutes', 30)
        if interval < 0.167:
            return jsonify({"success": False, "error": "Intervalle minimum: 10 secondes (0.167 min)"})
        if interval > 1440:
            return jsonify({"success": False, "error": "Intervalle maximum: 1440 minutes (24h)"})
        now = datetime.now()
        AUTO_STATE["enabled"] = True
        AUTO_STATE["interval_minutes"] = interval
        AUTO_STATE["last_cycle_time"] = now.isoformat()
        AUTO_STATE["next_cycle_time"] = (now + timedelta(minutes=interval)).isoformat()
        save_auto_config()
        print(f"✅ Mode auto DEMARRE: intervalle {interval} minutes")
        return jsonify({"success": True, "message": f"Mode auto activé ({interval} min)"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/auto-stop', methods=['POST'])
def stop_auto():
    try:
        AUTO_STATE["enabled"] = False
        save_auto_config()
        print("✅ Mode auto ARRETE")
        return jsonify({"success": True, "message": "Mode auto désactivé"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/auto-config', methods=['POST'])
def update_auto_config():
    try:
        data = request.json or {}
        interval = data.get('interval_minutes')
        if interval is None:
            return jsonify({"success": False, "error": "interval_minutes requis"})
        if interval < 0.167:
            return jsonify({"success": False, "error": "Intervalle minimum: 10 secondes (0.167 min)"})
        if interval > 1440:
            return jsonify({"success": False, "error": "Intervalle maximum: 1440 minutes (24h)"})
        AUTO_STATE["interval_minutes"] = interval
        if AUTO_STATE["enabled"] and AUTO_STATE["last_cycle_time"]:
            last_cycle = datetime.fromisoformat(AUTO_STATE["last_cycle_time"])
            AUTO_STATE["next_cycle_time"] = (last_cycle + timedelta(minutes=interval)).isoformat()
        save_auto_config()
        print(f"✅ Config auto mise a jour: intervalle {interval} minutes")
        return jsonify({"success": True, "message": f"Intervalle mis à jour ({interval} min)"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/performance')
def get_performance():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT id, buyPrice, sellPrice, quantity FROM cycles WHERE status = 'completed' ORDER BY id ASC")
        completed_cycles = [dict(row) for row in cursor.fetchall()]
        conn.close()
        cumulative_gain = 0
        performance_data = []
        for cycle in completed_cycles:
            gain = (cycle["sellPrice"] * cycle["quantity"]) - (cycle["buyPrice"] * cycle["quantity"])
            cumulative_gain += gain
            performance_data.append({"cycle_id": cycle["id"], "gain": round(gain, 2), "cumulative_gain": round(cumulative_gain, 2)})
        return jsonify(performance_data)
    except Exception as e:
        print(f"❌ Erreur performance: {e}")
        return jsonify([])

@app.route('/api/gains-distribution')
def get_gains_distribution():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT buyPrice, sellPrice, quantity FROM cycles WHERE status = 'completed'")
        completed_cycles = [dict(row) for row in cursor.fetchall()]
        conn.close()
        gains = []
        for cycle in completed_cycles:
            gain = (cycle["sellPrice"] * cycle["quantity"]) - (cycle["buyPrice"] * cycle["quantity"])
            gains.append(gain)
        if not gains:
            return jsonify({"ranges": [], "counts": []})
        min_gain = min(gains)
        max_gain = max(gains)
        range_size = (max_gain - min_gain) / 8 if max_gain > min_gain else 1
        ranges = []
        counts = []
        for i in range(8):
            range_start = min_gain + (i * range_size)
            range_end = min_gain + ((i + 1) * range_size)
            count = sum(1 for g in gains if range_start <= g < range_end or (i == 7 and g == range_end))
            ranges.append(f"${range_start:.2f} - ${range_end:.2f}")
            counts.append(count)
        return jsonify({"ranges": ranges, "counts": counts})
    except Exception as e:
        print(f"❌ Erreur gains distribution: {e}")
        return jsonify({"ranges": [], "counts": []})

@app.route('/api/active-cycles-timeline')
def get_active_cycles_timeline():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT id, status FROM cycles ORDER BY id ASC")
        all_cycles = [dict(row) for row in cursor.fetchall()]
        conn.close()
        if not all_cycles:
            return jsonify({"cycle_ids": [], "active_counts": []})
        cycle_ids = []
        active_counts = []
        for i, cycle in enumerate(all_cycles):
            cycle_ids.append(cycle["id"])
            active_count = sum(1 for c in all_cycles[:i+1] if c["status"] != "completed")
            active_counts.append(active_count)
        if len(cycle_ids) > 50:
            step = len(cycle_ids) // 50
            cycle_ids = cycle_ids[::step]
            active_counts = active_counts[::step]
        return jsonify({"cycle_ids": cycle_ids, "active_counts": active_counts})
    except Exception as e:
        print(f"❌ Erreur active cycles timeline: {e}")
        return jsonify({"cycle_ids": [], "active_counts": []})

@app.route('/api/active-cycles-history')
def get_active_cycles_history():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT id, status FROM cycles ORDER BY id ASC")
        all_cycles = [dict(row) for row in cursor.fetchall()]
        conn.close()
        if not all_cycles:
            return jsonify({"dates": [], "counts": [], "full_dates": []})
        base_date = datetime.now() - timedelta(days=len(all_cycles))
        dates = []
        counts = []
        full_dates = []
        for i, cycle in enumerate(all_cycles):
            cycle_date = base_date + timedelta(days=i)
            active_count = sum(1 for c in all_cycles[:i+1] if c["status"] != "completed")
            dates.append(cycle_date.strftime('%d %b'))
            counts.append(active_count)
            full_dates.append(cycle_date.strftime('%Y-%m-%d'))
        return jsonify({"dates": dates, "counts": counts, "full_dates": full_dates})
    except Exception as e:
        print(f"❌ Erreur active cycles history: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"dates": [], "counts": [], "full_dates": []})
@app.route('/api/active-cycles-history-split')
def get_active_cycles_history_split():
    """Retourne l'historique séparé des cycles en achat vs vente"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT id, status FROM cycles ORDER BY id ASC")
        all_cycles = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        if not all_cycles:
            return jsonify({"dates": [], "buy_counts": [], "sell_counts": [], "full_dates": []})
        
        base_date = datetime.now() - timedelta(days=len(all_cycles))
        
        dates = []
        buy_counts = []
        sell_counts = []
        full_dates = []
        
        for i, cycle in enumerate(all_cycles):
            cycle_date = base_date + timedelta(days=i)
            
            # Compter les cycles en phase d'achat (statut contient 'buy')
            buy_count = sum(1 for c in all_cycles[:i+1] 
                          if c["status"] != "completed" 
                          and ('buy' in c["status"].lower() or c["status"] == 'order_buy_placed' or c["status"] == 'order_buy_filled'))
            
            # Compter les cycles en phase de vente (statut contient 'sell')
            sell_count = sum(1 for c in all_cycles[:i+1] 
                           if c["status"] != "completed" 
                           and ('sell' in c["status"].lower() or c["status"] == 'order_sell_placed'))
            
            dates.append(cycle_date.strftime('%d %b'))
            buy_counts.append(buy_count)
            sell_counts.append(sell_count)
            full_dates.append(cycle_date.strftime('%Y-%m-%d'))
        
        return jsonify({
            "dates": dates,
            "buy_counts": buy_counts,
            "sell_counts": sell_counts,
            "full_dates": full_dates
        })
        
    except Exception as e:
        print(f"❌ Erreur active cycles history split: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"dates": [], "buy_counts": [], "sell_counts": [], "full_dates": []})

@app.route('/api/data')
def get_data():
    print(f"\n{'='*60}")
    print(f"⏳  Requete /api/data a {datetime.now().strftime('%H:%M:%S')}")
    print(f"{'='*60}")
    db_data = get_cycles_from_db()
    stats = calculate_stats(db_data["completed"])
    btc_price = get_btc_price_coingecko()
    mexc_balances = get_mexc_balances()
    print(f"✅ Donnees preparees")
    print(f"{'='*60}\n")
    response = jsonify({"cycles": db_data["cycles"], "stats": {**stats, "total_cycles": db_data["total_count"], "completed_cycles": db_data["completed_count"]}, "balances": {"usdc": mexc_balances["usdc"], "btc": mexc_balances["btc"], "btc_price": btc_price}, "config": {"buy_offset": CONFIG.get("BUY_OFFSET", "-400"), "sell_offset": CONFIG.get("SELL_OFFSET", "500"), "percent": CONFIG.get("PERCENT", "3")}, "last_update": datetime.now().strftime("%H:%M:%S")})
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/api/new-cycle', methods=['POST'])
def new_cycle():
    try:
        result = subprocess.run(['go', 'run', '.', '-n'], cwd=os.getcwd(), capture_output=True, text=True, timeout=30)
        return jsonify({"success": result.returncode == 0, "output": result.stdout, "error": result.stderr})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/update-cycles', methods=['POST'])
def update_cycles():
    try:
        result = subprocess.run(['go', 'run', '.', '-u'], cwd=os.getcwd(), capture_output=True, text=True, timeout=30)
        return jsonify({"success": result.returncode == 0, "output": result.stdout, "error": result.stderr})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/cancel-cycle', methods=['POST'])
def cancel_cycle():
    try:
        cycle_id = request.json.get('cycle_id')
        if not cycle_id:
            return jsonify({"success": False, "error": "ID du cycle manquant"})
        print(f"🗑️  Annulation du cycle #{cycle_id}...")
        result = subprocess.run(['go', 'run', '.', '-c', str(cycle_id)], cwd=os.getcwd(), capture_output=True, text=True, timeout=30)
        reset_autoincrement()
        return jsonify({"success": result.returncode == 0, "output": result.stdout, "error": result.stderr})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/export', methods=['POST'])
def export_data():
    try:
        result = subprocess.run(['go', 'run', '.', '-e'], cwd=os.getcwd(), capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            return jsonify({"success": False, "error": result.stderr})
        csv_file, json_file = get_latest_export_files()
        return jsonify({"success": True, "output": result.stdout, "csv_file": csv_file, "json_file": json_file, "files": {"csv": csv_file is not None, "json": json_file is not None}})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/download/<filetype>')
def download_file(filetype):
    try:
        if filetype not in ['csv', 'json']:
            return "Type non autorisé", 403
        csv_file, json_file = get_latest_export_files()
        if filetype == 'csv' and csv_file:
            filepath = os.path.join('exports', csv_file)
            return send_file(filepath, as_attachment=True, download_name=csv_file)
        elif filetype == 'json' and json_file:
            filepath = os.path.join('exports', json_file)
            return send_file(filepath, as_attachment=True, download_name=json_file)
        else:
            return "Fichier introuvable", 404
    except Exception as e:
        return f"Erreur: {str(e)}", 500

if __name__ == '__main__':
    load_config()
    load_auto_config()
    init_database()
    auto_thread = threading.Thread(target=auto_cycle_worker, daemon=True)
    auto_thread.start()
    print("\n" + "="*60)
    print("🚀 DASHBOARD BOT TRADING MEXC")
    print("="*60)
    print(f"🌐 URL: http://localhost:8081")
    print(f"🔄 Auto-refresh: 3 minutes")
    print(f"🔄 Update cycles: toutes les 2 minutes")
    print(f"🤖 Mode auto: {'ACTIF' if AUTO_STATE['enabled'] else 'INACTIF'}")
    if AUTO_STATE['enabled']:
        print(f"⏱️  Intervalle: {AUTO_STATE['interval_minutes']} minutes")
    print(f"💰 Prix BTC: CoinGecko")
    print(f"💼 Balances: MEXC")
    print(f"📊 DB: {os.path.abspath(DB_PATH)}")
    print("="*60 + "\n")
    import logging
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)
    app.run(host='0.0.0.0', port=8081, debug=False)
