import numpy as np

# Known OFAC-sanctioned / high-profile exploit addresses (lowercase)
KNOWN_FLAGGED_WALLETS = {
    "0x098b716b8aaf21512996dc57eb0615e2383e2f96": "OFAC Sanctioned - Lazarus Group (Ronin Bridge Exploit)",
    "0xd90e2f925da726b50c4ed8d0fb90ad053324f31b": "OFAC Sanctioned - Tornado Cash Router",
    "0x8576acc5c05d6ce88f4e49bf65bdf0c62f91353c": "OFAC Sanctioned - Tornado Cash 100 ETH Pool",
    "0x1da5821544e25c636c1417ba96ade4cf6d2f9b5a": "OFAC Sanctioned - Lazarus Group Associated",
    "0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936": "OFAC Sanctioned - Tornado Cash 10 ETH Pool",
    "0x7f367cc41522ce07553e823bf3be79a889debe1b": "Tornado Cash Contract",
}

def calculate_suspicion_score(wallet_address, transaction_features):
    """
    Analyze transaction features and return suspicion score (0-100)
    
    Input:
        - wallet_address: Ethereum address
        - transaction_features: List of extracted features from transactions
    
    Output:
        - Dict with score, flags, risk level
    """
    score = 0
    flags = []
    normalized_addr = wallet_address.lower().strip() if wallet_address else ""
    
    try:
        # Convert numpy array to list if needed
        if hasattr(transaction_features, 'tolist'):
            features = transaction_features.tolist()
        else:
            features = list(transaction_features)
        
        # Feature indices mapped from app.py:
        # [0]=tx_count, [1]=avg_value, [2]=std_value, [3]=max_value, 
        # [4]=min_value, [7]=unique_recipients, [9]=recipient_ratio
        tx_count = features[0] if len(features) > 0 else 0
        avg_value = features[1] if len(features) > 1 else 0
        std_value = features[2] if len(features) > 2 else 0
        max_value = features[3] if len(features) > 3 else 0
        unique_recipients = features[7] if len(features) > 7 else 0
        recipient_ratio = features[9] if len(features) > 9 else 0
        
        # Layer 1: Sanction / OFAC / Known Exploit Database Match
        if normalized_addr in KNOWN_FLAGGED_WALLETS:
            score += 65
            flags.append("OFAC_SANCTIONED")
        
        # Layer 2: Extreme Outlier / Whale Drain Detection
        # Exploiters frequently move hundreds or thousands of ETH in single transactions
        if max_value > 500:
            score += 35
            flags.append("EXTREME_VALUE_OUTLIER")
        elif max_value > 100:
            score += 20
            flags.append("HIGH_VALUE_OUTLIER")
            
        # Layer 3: High Standard Deviation (Volatile Siphoning vs. Organic Trading)
        if std_value > 100:
            score += 15
            flags.append("UNUSUAL_VALUE_PATTERN")
        elif avg_value > 50 or (avg_value < 0.001 and tx_count > 50):
            score += 15
            flags.append("UNUSUAL_VALUE_PATTERN")
        
        # Layer 4: Recipient Diversity & Rapid Layering
        if recipient_ratio > 0.8 and tx_count > 20:
            score += 25
            flags.append("HIGH_RECIPIENT_DIVERSITY")
        elif recipient_ratio > 0.6 and tx_count > 50:
            score += 15
            flags.append("HIGH_RECIPIENT_DIVERSITY")
            
        # Layer 5: Activity Volume Heuristics
        if tx_count < 3 and tx_count > 0:
            score += 15
            flags.append("LOW_TX_COUNT")
        elif tx_count > 1000:
            score += 10
            flags.append("HIGH_VOLUME")
            
        # Layer 6: Repetitive Outflows
        if tx_count > 10 and avg_value > 0:
            score += 10
            flags.append("REPEATED_TRANSACTIONS")
        
        # Baseline if benign
        if len(flags) == 0:
            score = 10
            flags.append("NORMAL_PATTERN")
        
        # Cap score at 100
        final_score = min(100, max(0, score))
        
        # Risk level calibration
        if final_score >= 65:
            risk_level = "HIGH"
        elif final_score >= 35:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
            
        return {
            "address": wallet_address,
            "suspicion_score": final_score,
            "flags": flags,
            "risk_level": risk_level,
            "reason": " | ".join(flags)
        }
        
    except Exception as e:
        return {
            "address": wallet_address,
            "suspicion_score": 50,
            "flags": ["ERROR_IN_SCORING"],
            "risk_level": "UNKNOWN",
            "reason": str(e)
        }