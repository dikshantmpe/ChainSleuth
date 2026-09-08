from flask import Flask, request, jsonify
from neo4j import GraphDatabase
from neo4j.exceptions import AuthError, ServiceUnavailable
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv
import requests
from fraud_detection import calculate_suspicion_score
from flask_cors import CORS
import logging
import numpy as np

load_dotenv()

# Setup logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

# Enable CORS for Vercel and local development
CORS(app, resources={r"/api/*": {
    "origins": [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://chain-sleuth-nu.vercel.app",
        "https://*.vercel.app"
    ],
    "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

class Neo4jConnection:
    def __init__(self, uri, user, password):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
    
    def close(self):
        self.driver.close()
    
    def verify_connectivity(self):
        """Test the connection on startup"""
        with self.driver.session() as session:
            session.run("RETURN 1").consume()
    
    def query(self, query, parameters=None):
        with self.driver.session() as session:
            return session.run(query, parameters or {}).data()

# Initialize Neo4j connection safely
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER") or os.getenv("NEO4J_USERNAME", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

try:
    neo4j_conn = Neo4jConnection(uri=NEO4J_URI, user=NEO4J_USER, password=NEO4J_PASSWORD)
    neo4j_conn.verify_connectivity()
    logger.info("✅ Neo4j Database connected successfully!")
except AuthError:
    logger.error("❌ NEO4J AUTH FAILED: Check NEO4J_USER and NEO4J_PASSWORD in Render.")
    logger.error(f"   Attempted User: '{NEO4J_USER}'")
except ServiceUnavailable:
    logger.error("❌ NEO4J UNAVAILABLE: Check NEO4J_URI or check if Aura is paused.")
except Exception as e:
    logger.error(f"❌ Neo4j Initialization Error: {e}")

# Helper function to handle DB errors in routes
def handle_db_error(e):
    if isinstance(e, AuthError):
        return jsonify({"error": "Database authentication failed. Check backend credentials."}), 503
    elif isinstance(e, ServiceUnavailable):
        return jsonify({"error": "Database is unavailable or paused."}), 503
    else:
        logger.error(f"Unexpected DB Error: {e}")
        return jsonify({"error": str(e)}), 500

def fetch_ethereum_transactions(wallet_address):
    """Fetch real transactions from Etherscan API V2"""
    ETHERSCAN_API_KEY = os.getenv('ETHERSCAN_API_KEY', '')
    
    if not ETHERSCAN_API_KEY:
        logger.error("❌ ETHERSCAN_API_KEY is missing in Render Environment Variables!")
        return []
    
    # Clean the address just in case the frontend sends spaces
    wallet_address = wallet_address.strip()
    logger.info(f"Attempting to fetch transactions for EXACT address: '{wallet_address}'")
    
    try:
        # Using Etherscan API V2 endpoint with chainid=1 for Ethereum Mainnet
        url = f"https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address={wallet_address}&startblock=0&endblock=99999999&sort=asc&apikey={ETHERSCAN_API_KEY}"
        response = requests.get(url, timeout=15)
        data = response.json()
        
        logger.info(f"Etherscan V2 Response - Status: {data.get('status')}, Message: {data.get('message')}")
        
        if data.get('status') == '1' and isinstance(data.get('result'), list):
            logger.info(f"✅ Fetched {len(data['result'])} transactions from Etherscan V2")
            return data['result']
        else:
            if data.get('result') == "No transactions found":
                logger.warning(f"⚠️ Etherscan says 'No transactions found' for {wallet_address}. Check if the address is complete (42 chars).")
            else:
                logger.error(f"❌ Etherscan API V2 Error: {data.get('message')} | Details: {data.get('result')}")
            return []
            
    except Exception as e:
        logger.error(f"❌ Etherscan V2 request failed: {e}")
        return []
        
def extract_features_from_transactions(transactions):
    """Extract features from transactions for fraud detection"""
    if not transactions or len(transactions) == 0:
        return [0] * 166
    
    try:
        values = []
        recipients = set()
        
        for tx in transactions:
            try:
                value = float(tx.get('value', 0)) / 1e18
                values.append(value)
                to_addr = tx.get('to', '')
                if to_addr:
                    recipients.add(to_addr)
            except:
                continue
        
        tx_count = len(transactions)
        unique_recipients = len(recipients)
        
        if len(values) > 0:
            avg_value = np.mean(values)
            std_value = np.std(values)
            max_value = np.max(values)
            min_value = np.min(values)
        else:
            avg_value = std_value = max_value = min_value = 0
        
        recipient_ratio = unique_recipients / max(tx_count, 1)
        
        features = [0] * 166
        features[0] = tx_count
        features[1] = avg_value
        features[2] = std_value
        features[3] = max_value
        features[4] = min_value
        features[7] = unique_recipients
        features[9] = recipient_ratio
        
        return features
    
    except Exception as e:
        logger.error(f"Feature extraction error: {e}")
        return [0] * 166

def add_wallet_to_db(address, blockchain, transactions):
    """Safely extract data and save the main wallet to Neo4j"""
    timestamps = []
    for tx in transactions:
        try:
            timestamps.append(int(tx.get("timeStamp", 0)))
        except:
            timestamps.append(0)
            
    total_volume = 0.0
    for tx in transactions:
        try:
            total_volume += float(tx.get("value", 0)) / 1e18
        except:
            pass
            
    query = """
    MERGE (w:Wallet {address: $address, blockchain: $blockchain}) 
    SET w.first_seen = $first_seen, w.last_seen = $last_seen, 
        w.transaction_count = $tx_count, w.total_volume = $total_volume 
    RETURN w
    """
    params = {
        "address": address.lower(), 
        "blockchain": blockchain, 
        "first_seen": min(timestamps) if timestamps else 0, 
        "last_seen": max(timestamps) if timestamps else 0, 
        "tx_count": len(transactions), 
        "total_volume": total_volume
    }
    return neo4j_conn.query(query, params)

def add_transactions_to_db(source_address, blockchain, transactions):
    """Batch write all transactions to Neo4j using UNWIND for high speed"""
    tx_data = []
    for tx in transactions:
        to_address = tx.get("to")
        if not to_address: 
            continue
        try:
            tx_data.append({
                "to_addr": to_address.lower(), 
                "amount": float(tx.get("value", 0)) / 1e18, 
                "timestamp": int(tx.get("timeStamp", 0))
            })
        except Exception:
            continue # Skip malformed transactions
            
    if not tx_data:
        return
        
    query = """
    MATCH (from:Wallet {address: $from_addr})
    UNWIND $tx_data AS row
    MERGE (to:Wallet {address: row.to_addr, blockchain: $blockchain})
    MERGE (from)-[r:SENT_TO]->(to)
    SET r.amount = coalesce(r.amount, 0) + row.amount,
        r.last_transaction = CASE WHEN r.last_transaction IS NULL OR row.timestamp > r.last_transaction THEN row.timestamp ELSE r.last_transaction END,
        r.transaction_count = coalesce(r.transaction_count, 0) + 1
    """
    neo4j_conn.query(query, {
        "from_addr": source_address.lower(), 
        "blockchain": blockchain, 
        "tx_data": tx_data
    })

# ===================== HEALTH & AUTHENTICATION =====================

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "backend is running"}), 200

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json or {}
        email = data.get("email", "").lower().strip()
        password = data.get("password", "")
        role = data.get("role", "investigator")
        
        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400
        
        query = "MATCH (u:User {email: $email, password: $password}) RETURN u.email as email, u.name as name, u.role as role"
        result = neo4j_conn.query(query, {"email": email, "password": password})
        
        if not result:
            return jsonify({"error": "Invalid credentials"}), 401
            
        user_data = result[0]
        return jsonify({
            "status": "success",
            "email": user_data["email"],
            "role": user_data.get("role", role),
            "name": user_data.get("name", email.split("@")[0].title()),
            "token": f"token-{email}"
        }), 200
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json or {}
        name = data.get("name", "").strip()
        email = data.get("email", "").lower().strip()
        password = data.get("password", "")
        role = data.get("role", "investigator")
        
        if not all([name, email, password]):
            return jsonify({"error": "All fields required"}), 400
        
        query = "CREATE (u:User {name: $name, email: $email, password: $password, role: $role}) RETURN u.email as email, u.name as name, u.role as role"
        result = neo4j_conn.query(query, {"name": name, "email": email, "password": password, "role": role})
        
        return jsonify({
            "status": "success",
            "email": result[0]["email"],
            "name": result[0]["name"],
            "role": result[0]["role"],
            "token": f"token-{email}"
        }), 201
    except Exception as e:
        logger.error(f"Register error: {e}")
        return jsonify({"error": str(e)}), 500

# ===================== WALLET ANALYSIS & ML =====================

@app.route('/api/wallets/analyze', methods=['POST'])
def analyze_wallet():
    try:
        data = request.json or {}
        address = data.get("address")
        blockchain = data.get("blockchain", "ethereum").lower()
        
        if not address: 
            return jsonify({"error": "No address provided"}), 400
            
        if blockchain == "ethereum" and (not address.startswith('0x') or len(address) != 42):
            return jsonify({"error": "Invalid Ethereum address format"}), 400
        
        # 1. Fetch Live Transactions
        transactions = fetch_ethereum_transactions(address)
        
        if not transactions:
            return jsonify({
                "wallet": address,
                "blockchain": blockchain,
                "riskScore": 0,
                "riskLevel": "LOW",
                "transactionCount": 0,
                "patterns": [],
                "linkedWallets": [],
                "flags": [{"type": "NO_TRANSACTIONS", "message": "No transactions found"}],
                "timestamp": datetime.now().isoformat()
            }), 200
        
        # 2. Run ML Fraud Detection
        features = extract_features_from_transactions(transactions)
        fraud_data = calculate_suspicion_score(address, features)
        
        patterns = []
        flags = []
        
        if "HIGH_RECIPIENT_DIVERSITY" in fraud_data.get("flags", []) or "FUND_SPLITTING" in fraud_data.get("flags", []):
            patterns.append({"name": "Fund Splitting", "risk": "HIGH", "confidence": 0.85})
            flags.append({"type": "FUND_SPLITTING", "message": "Funds distributed across multiple wallets"})
        
        if "HIGH_VOLUME" in fraud_data.get("flags", []):
            patterns.append({"name": "High Volume", "risk": "MEDIUM", "confidence": 0.75})
        
        if "RAPID_PASS_THROUGH" in fraud_data.get("flags", []):
            patterns.append({"name": "Rapid Pass-Through", "risk": "HIGH", "confidence": 0.88})
        
        # 3. Save to Neo4j (Batch save to prevent Render timeouts)
        try:
            add_wallet_to_db(address, blockchain, transactions)
            add_transactions_to_db(address, blockchain, transactions)
        except Exception as db_err:
            logger.warning(f"DB save error (non-critical): {db_err}")
        
        # 4. Extract Linked Wallets for UI
        linked_wallets = []
        recipients = {}
        for tx in transactions:
            to_addr = tx.get("to", "").lower()
            if to_addr and to_addr != address.lower():
                recipients[to_addr] = recipients.get(to_addr, 0) + 1
        
        for addr, count in sorted(recipients.items(), key=lambda x: x[1], reverse=True)[:5]:
            risk = "HIGH" if count > 10 else "MEDIUM" if count > 3 else "LOW"
            linked_wallets.append({
                "address": addr[:6] + "..." + addr[-4:],
                "type": "exchange" if count > 20 else "direct",
                "risk": risk
            })
        
        return jsonify({
            "wallet": address,
            "blockchain": blockchain,
            "riskScore": fraud_data.get("suspicion_score", 0),
            "riskLevel": fraud_data.get("risk_level", "UNKNOWN"),
            "transactionCount": len(transactions),
            "patterns": patterns,
            "linkedWallets": linked_wallets,
            "flags": flags,
            "timestamp": datetime.now().isoformat()
        }), 200
    
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/wallets/<path:address>/connections', methods=['GET'])
def get_wallet_connections(address):
    try:
        query = """
        MATCH (w:Wallet {address: $address})-[r:SENT_TO]->(connected)
        RETURN connected.address as address, r.amount as total_sent, 
               r.transaction_count as num_transactions, r.last_transaction as last_transaction 
        ORDER BY r.amount DESC
        """
        result = neo4j_conn.query(query, {"address": address.lower()})
        return jsonify({"from_address": address, "connected_wallets": result, "total_connections": len(result)}), 200
    except Exception as e:
        return handle_db_error(e)

# ===================== WALLET EXPLORER =====================

@app.route('/api/wallets', methods=['GET'])
def get_all_wallets():
    try:
        wallets = neo4j_conn.query("MATCH (w:Wallet) RETURN w.address as addr, w.blockchain as chain, w.risk as risk, w.score as score, w.last_seen as lastActivity, w.transaction_count as txCount ORDER BY w.score DESC LIMIT 50")
        return jsonify({"wallets": [{"addr": w["addr"], "chain": w["chain"] or "Ethereum", "risk": w["risk"] or "medium", "score": w["score"] or 45, "lastActivity": w["lastActivity"] or "Recent", "txCount": w["txCount"] or 0} for w in wallets]}), 200
    except Exception as e:
        return handle_db_error(e)

@app.route('/api/wallets', methods=['POST'])
def add_global_wallet():
    try:
        addr = request.json.get("address")
        chain = "Bitcoin" if str(addr).startswith(("bc1", "1", "3")) else "Ethereum"
        query = "MERGE (w:Wallet {address: $address}) ON CREATE SET w.blockchain = $blockchain, w.risk = 'medium', w.score = 55, w.transaction_count = 0, w.last_seen = 'Just added' RETURN w.address as addr, w.blockchain as chain, w.risk as risk, w.score as score, w.last_seen as lastActivity, w.transaction_count as txCount"
        res = neo4j_conn.query(query, {"address": addr.lower(), "blockchain": chain})
        return jsonify({"status": "success", "wallet": res[0]}), 201
    except Exception as e:
        return handle_db_error(e)

# ===================== CASE MANAGEMENT =====================

@app.route('/api/cases', methods=['GET'])
def get_cases():
    try:
        query = "MATCH (c:Case) OPTIONAL MATCH (c)-[:TRACKS]->(w:Wallet) RETURN c.id as id, c.title as title, c.investigator as investigator, c.status as status, c.date_opened as date_opened, c.risk as risk, count(w) as wallets ORDER BY c.date_opened DESC"
        return jsonify({"cases": neo4j_conn.query(query)}), 200
    except Exception as e:
        return handle_db_error(e)

@app.route('/api/cases', methods=['POST'])
def create_case():
    try:
        data = request.json
        case_id = f"CASE-{str(uuid.uuid4())[:8].upper()}"
        query = "CREATE (c:Case {id: $id, title: $title, investigator: $investigator, status: $status, date_opened: $date, risk: $risk}) RETURN c"
        params = {"id": case_id, "title": data.get("title", "New Investigation"), "investigator": data.get("investigator", "Investigator Singh"), "status": "Open", "date": datetime.now().strftime("%Y-%m-%d"), "risk": data.get("risk", "medium")}
        neo4j_conn.query(query, params)
        return jsonify({"status": "success", "case": params}), 201
    except Exception as e:
        return handle_db_error(e)

@app.route('/api/cases/<case_id>/patterns', methods=['GET'])
def get_case_patterns(case_id):
    try:
        res = neo4j_conn.query("MATCH (c:Case {id: $case_id})-[:TRACKS]->(w:Wallet) RETURN count(w) as count", {"case_id": case_id})
        if (res[0]['count'] if res else 0) > 0:
            patterns = [{"badge": "DETECTED", "title": "Fund Splitting", "desc": "Funds divided across multiple intermediary wallets."}, {"badge": "POSSIBLE", "title": "Peel Chain", "desc": "Repeated intermediary transfers."}]
        else:
            patterns = [{"badge": "PENDING", "title": "No Entities Tracked", "desc": "Add wallet addresses to activate AI detection."}]
        return jsonify({"patterns": patterns}), 200
    except Exception as e:
        return handle_db_error(e)

@app.route('/api/cases/<case_id>/wallets', methods=['GET'])
def get_case_wallets(case_id):
    try:
        wallets = neo4j_conn.query("MATCH (c:Case {id: $case_id})-[:TRACKS]->(w:Wallet) RETURN w.address as addr, w.blockchain as chain, w.risk as risk, w.score as score, w.last_seen as lastActivity, w.transaction_count as txCount ORDER BY w.score DESC", {"case_id": case_id})
        return jsonify({"wallets": [{"addr": w["addr"], "chain": w["chain"] or "Ethereum", "risk": w["risk"] or "medium", "score": w["score"] or 45, "lastActivity": w["lastActivity"] or "Recent", "txCount": w["txCount"] or 0} for w in wallets]}), 200
    except Exception as e:
        return handle_db_error(e)

@app.route('/api/cases/<case_id>/wallets', methods=['POST'])
def add_case_wallet(case_id):
    try:
        addr = request.json.get("address")
        chain = "Bitcoin" if str(addr).startswith(("bc1", "1", "3")) else "Ethereum"
        query = "MATCH (c:Case {id: $case_id}) MERGE (w:Wallet {address: $address}) ON CREATE SET w.blockchain = $blockchain, w.risk = 'medium', w.score = 55, w.transaction_count = 0, w.last_seen = 'Just added' MERGE (c)-[:TRACKS]->(w) RETURN w.address as addr, w.blockchain as chain, w.risk as risk, w.score as score, w.last_seen as lastActivity, w.transaction_count as txCount"
        res = neo4j_conn.query(query, {"case_id": case_id, "address": addr.lower(), "blockchain": chain})
        return jsonify({"status": "success", "wallet": res[0]}), 201
    except Exception as e:
        return handle_db_error(e)

# ===================== TRANSACTION EXPLORER =====================

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    try:
        limit = request.args.get("limit", 50, type=int)
        offset = request.args.get("offset", 0, type=int)
        
        query = """
        MATCH (from:Wallet)-[r:SENT_TO]->(to:Wallet)
        RETURN 
            from.address as from_address,
            to.address as to_address,
            r.amount as amount,
            r.last_transaction as timestamp,
            r.transaction_count as count
        ORDER BY r.last_transaction DESC
        SKIP $offset
        LIMIT $limit
        """
        result = neo4j_conn.query(query, {"offset": offset, "limit": limit})
        
        count_query = "MATCH (w:Wallet)-[r:SENT_TO]->(w2:Wallet) RETURN count(r) as total"
        count_result = neo4j_conn.query(count_query)
        total = count_result[0]['total'] if count_result else 0
        
        transactions = [
            {"from": tx['from_address'], "to": tx['to_address'], "amount": float(tx['amount'] or 0), "timestamp": tx['timestamp'], "count": tx['count'] or 1}
            for tx in result
        ]
        return jsonify({"transactions": transactions, "total": total, "limit": limit, "offset": offset}), 200
    except Exception as e:
        return handle_db_error(e)

@app.route('/api/transactions/search', methods=['GET'])
def search_transactions():
    try:
        # Frontend uses 'q', but we also check 'address' for backward compatibility
        address = request.args.get("q", "").strip() or request.args.get("address", "").strip()
        if not address: return jsonify({"error": "Address required"}), 400
        
        query = """
        MATCH (from:Wallet {address: $address})-[r:SENT_TO]->(to:Wallet)
        RETURN 
            from.address as from_address,
            to.address as to_address,
            r.amount as amount,
            r.last_transaction as timestamp,
            r.transaction_count as count
        ORDER BY r.last_transaction DESC
        """
        result = neo4j_conn.query(query, {"address": address.lower()})
        
        transactions = [
            {"from": tx['from_address'], "to": tx['to_address'], "amount": float(tx['amount'] or 0), "timestamp": tx['timestamp'], "count": tx['count'] or 1}
            for tx in result
        ]
        return jsonify({"transactions": transactions, "total": len(transactions), "address": address}), 200
    except Exception as e:
        return handle_db_error(e)

# ===================== BLOCKCHAIN GRAPH =====================

@app.route('/api/graph', methods=['GET'])
def get_graph():
    try:
        case_id = request.args.get("case_id")
        
        if case_id:
            query = """
            MATCH (c:Case {id: $case_id})-[:TRACKS]->(w:Wallet)
            OPTIONAL MATCH (w)-[r:SENT_TO]->(w2:Wallet)
            WITH w, count(DISTINCT r) as linked_count
            RETURN 
                collect(DISTINCT {id: w.address, label: w.address, risk: coalesce(w.risk, 'medium'), score: coalesce(w.score, 0), txCount: coalesce(w.transaction_count, 0), linked: linked_count, patterns: []}) as nodes
            """
            result = neo4j_conn.query(query, {"case_id": case_id})
        else:
            query = """
            MATCH (w:Wallet)
            OPTIONAL MATCH (w)-[r:SENT_TO]->(w2:Wallet)
            WITH w, count(DISTINCT r) as linked_count
            ORDER BY w.score DESC
            LIMIT 10
            RETURN 
                collect({id: w.address, label: w.address, risk: coalesce(w.risk, 'medium'), score: coalesce(w.score, 0), txCount: coalesce(w.transaction_count, 0), linked: linked_count, patterns: []}) as nodes
            """
            result = neo4j_conn.query(query)
        
        if not result or not result[0].get('nodes'): 
            return jsonify({"nodes": [], "links": []}), 200
        
        res = result[0]
        nodes = res.get('nodes', [])
        
        positioned_nodes = []
        for i, node in enumerate(nodes):
            angle = (i / max(len(nodes), 1)) * 2 * 3.14159
            positioned_nodes.append({
                **node,
                "x": 0.5 + 0.35 * (3.14159 / 3.14159) * angle,
                "y": 0.5 + 0.35 * (angle / 3.14159)
            })
        
        link_query = """
        MATCH (from:Wallet)-[r:SENT_TO]->(to:Wallet)
        WHERE from.address IN $addresses AND to.address IN $addresses
        RETURN [from.address, to.address] as link, r.amount as amount
        """
        addresses = [n['id'] for n in positioned_nodes]
        link_results = neo4j_conn.query(link_query, {"addresses": addresses})
        links = [[lr['link'][0], lr['link'][1]] for lr in link_results if lr['link']]
        
        return jsonify({"nodes": positioned_nodes, "links": links}), 200
    except Exception as e:
        logger.error(f"Graph Error: {str(e)}")
        return handle_db_error(e)

# ===================== DASHBOARD =====================

@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    try:
        wallet_count = neo4j_conn.query("MATCH (w:Wallet) RETURN count(w) as total_wallets")
        transaction_count = neo4j_conn.query("MATCH (w:Wallet)-[r:SENT_TO]->(w2:Wallet) RETURN count(r) as total_transactions")
        return jsonify({
            "stats": [
                {"label": "Wallets Tracked", "value": str(wallet_count[0]['total_wallets'] if wallet_count else 0), "note": "Active addresses", "icon": "Search"},
                {"label": "Active Cases", "value": "5", "note": "+1 this week", "icon": "Search"},
                {"label": "High-Risk Alerts", "value": "8", "note": "Flagged today", "icon": "AlertTriangle"},
                {"label": "Transactions Traced", "value": str(transaction_count[0]['total_transactions'] if transaction_count else 0), "note": "Fund flows mapped", "icon": "TrendingUp"}
            ],
            "chartData": [
                {"month": "Jan", "crores": 45}, {"month": "Feb", "crores": 52},
                {"month": "Mar", "crores": 48}, {"month": "Apr", "crores": 61},
                {"month": "May", "crores": 55}, {"month": "Jun", "crores": 67}
            ]
        }), 200
    except Exception as e:
        return handle_db_error(e)

@app.route('/api/dashboard/alerts', methods=['GET'])
def get_dashboard_alerts():
    try:
        alerts = {
            "alerts": [
                {"wallet": "0xabc123...", "title": "Rapid fund movement detected", "sev": "high"},
                {"wallet": "0xdef456...", "title": "Multiple exchange transfers", "sev": "high"},
                {"wallet": "0xghi789...", "title": "Mixing service interaction", "sev": "high"},
                {"wallet": "0xjkl012...", "title": "Unusual transaction pattern", "sev": "medium"},
                {"wallet": "0xmno345...", "title": "High-volume activity spike", "sev": "medium"},
            ]
        }
        return jsonify(alerts), 200
    except Exception as e:
        return handle_db_error(e)

# ===================== ERROR HANDLERS =====================

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    logger.info("🚀 ChainSleuth Backend (Live Data Mode)")
    logger.info("✅ Endpoints configured:")
    logger.info("   - /api/login (Authentication)")
    logger.info("   - /api/register (Registration)")
    logger.info("   - /api/cases (Case Management)")
    logger.info("   - /api/wallets (Wallet Explorer)")
    logger.info("   - /api/wallets/analyze (Analysis - POST)")
    logger.info("   - /api/wallets/<address>/connections (Graph Data)")
    logger.info("   - /api/transactions (Transaction Explorer)")
    logger.info("   - /api/graph (Blockchain Graph)")
    logger.info("   - /api/dashboard/* (Dashboard Telemetry)")
    logger.info("✅ CORS enabled for Vercel + local dev")
    app.run(debug=True, port=5001)