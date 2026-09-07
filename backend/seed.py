from neo4j import GraphDatabase
import os
from dotenv import load_dotenv

load_dotenv()

# Connect to your local Neo4j instance
URI = os.getenv("NEO4J_URI", "neo4j://localhost:7687")
USER = os.getenv("NEO4J_USER", "neo4j")
PASSWORD = os.getenv("NEO4J_PASSWORD") # Ensure this matches your .env

def seed_database():
    driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))
    
    query = """
    // Match your existing case
    MERGE (c:Case {id: 'CASE-70196637'})
    
    // Create realistic wallet nodes
    MERGE (w1:Wallet {address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'})
    SET w1.blockchain = 'Ethereum', w1.risk = 'high', w1.score = 87, w1.transaction_count = 247, w1.last_seen = '2h ago'
    
    MERGE (w2:Wallet {address: '0x19a3b844Bc454e4438f44e742d35Cc6634C053292'})
    SET w2.blockchain = 'Ethereum', w2.risk = 'low', w2.score = 12, w2.transaction_count = 5, w2.last_seen = '1d ago'
    
    MERGE (w3:Wallet {address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'})
    SET w3.blockchain = 'Bitcoin', w3.risk = 'medium', w3.score = 55, w3.transaction_count = 14, w3.last_seen = '3h ago'
    
    // Link the wallets directly to your case
    MERGE (c)-[:TRACKS]->(w1)
    MERGE (c)-[:TRACKS]->(w2)
    MERGE (c)-[:TRACKS]->(w3)
    """
    
    try:
        with driver.session() as session:
            session.run(query)
        print("✅ Database successfully populated with realistic wallet data!")
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
    finally:
        driver.close()

if __name__ == "__main__":
    seed_database()