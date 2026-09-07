export const LANDING_HTML = `
<div class="grid-bg"></div>
<nav class="nav" id="navbar" role="navigation" aria-label="Main navigation">
    <div class="nav-inner">
        <a href="#" class="nav-logo" aria-label="ChainSleuth Home">
            <div class="nav-logo-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg></div>
            ChainSleuth
        </a>
        <ul class="nav-links">
            <li><a href="#investigate">Investigate</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#how">How It Works</a></li>
            <li><a href="#tech">Technology</a></li>
        </ul>
        <div class="nav-right">
            <div class="status-badge"><span class="status-dot"></span>LIVE</div>
            <button id="login-btn" class="btn btn-secondary btn-sm" style="border-radius: 8px; font-family: inherit;">Login Portal &rarr;</button>
        </div>
    </div>
</nav>

<!-- Hero Section -->
<section class="hero" id="hero">
    <div class="hero-bg-text">FORENSICS</div>
    <div class="container">
        <div class="hero-inner">
            <div class="hero-content">
                <div class="hero-eyebrow">Blockchain Forensics / Intelligence Platform</div>
                <h1 class="hero-title">Trace the <span class="highlight">money</span>.<br>Expose the <span class="highlight">pattern</span>.</h1>
                <p class="hero-desc">Investigate cryptocurrency transactions, uncover suspicious wallet relationships, and identify potential laundering patterns through transparent blockchain intelligence.</p>
                <div class="hero-buttons">
                    <button id="launch-btn" class="btn btn-primary" style="font-family: inherit;">Launch Dashboard <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></button>
                    <button class="btn btn-secondary" onclick="document.getElementById('about').scrollIntoView({behavior: 'smooth'})" style="font-family: inherit;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg> Learn More</button>
                </div>
                <div class="hero-trust">
                    <div class="trust-item"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B6FF00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg><strong>LIVE BLOCKCHAIN DATA</strong></div>
                    <div class="trust-item"><span>Etherscan / Ethereum</span></div>
                    <div class="trust-item"><span>Blockchain.info / Bitcoin</span></div>
                </div>
            </div>
            <div class="hero-visual">
                <svg class="network-graph" id="heroGraph" viewBox="0 0 500 500"></svg>
                <div class="floating-card fc-risk">
                    <div class="floating-card-label">Risk Score</div>
                    <div class="floating-card-value">87 / 100</div>
                </div>
                <div class="floating-card fc-pattern">
                    <div class="floating-card-label">Suspicious Pattern</div>
                    <div class="floating-card-value" style="font-size:0.875rem;">Rapid Pass-Through</div>
                </div>
                <div class="floating-card fc-linked">
                    <div class="floating-card-label">Linked Wallets</div>
                    <div class="floating-card-value">14</div>
                </div>
                <div class="floating-card fc-tx">
                    <div class="floating-card-label">Transactions</div>
                    <div class="floating-card-value">247</div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Investigation Input -->
<section class="investigate-section" id="investigate">
    <div class="container">
        <div class="section-header">
            <h2 class="section-title">Start an Investigation</h2>
            <p class="section-subtitle">Enter a wallet address to begin tracing transaction flows and detecting suspicious patterns.</p>
        </div>
        <div class="investigate-box">
            <div class="input-group">
                <label class="input-label" for="walletInput">Enter wallet address</label>
                <input type="text" class="input-field" id="walletInput" placeholder="0x742d35Cc6634C0532925a3b844Bc454e4438f44e" aria-label="Wallet address input">
            </div>
            <div class="input-row">
                <div class="input-group">
                    <label class="input-label" for="blockchainSelect">Blockchain</label>
                    <select class="select-field" id="blockchainSelect" aria-label="Select blockchain">
                        <option value="ethereum">Ethereum</option>
                        <option value="bitcoin">Bitcoin</option>
                    </select>
                </div>
                <div class="input-group">
                    <label class="input-label" for="modeSelect">Investigation Mode</label>
                    <select class="select-field" id="modeSelect" aria-label="Select investigation mode">
                        <option value="full">Full Analysis</option>
                        <option value="flow">Transaction Flow</option>
                        <option value="risk">Risk Analysis</option>
                    </select>
                </div>
            </div>
            <div class="investigate-actions">
                <button class="btn btn-primary" id="analyzeBtn" style="font-family: inherit;">Analyze Wallet <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></button>
                <button class="demo-btn" id="loadDemoBtn" style="font-family: inherit;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Load Demo Investigation</button>
            </div>
        </div>
    </div>
</section>

<!-- Why ChainSleuth -->
<section class="why-section" id="about">
    <div class="container">
        <div class="section-header">
            <h2 class="section-title">Why ChainSleuth?</h2>
            <p class="section-subtitle">Blockchain data is public. Investigation shouldn't be complicated.</p>
        </div>
        <p style="text-align:center;color:var(--text-secondary);max-width:700px;margin:0 auto 3rem;line-height:1.7;">Blockchain transactions are publicly visible, but manually tracing funds across multiple wallets is slow and technically difficult. ChainSleuth transforms raw transaction data into actionable intelligence.</p>
        <div class="why-grid">
            <div class="why-card">
                <div class="why-number">01</div>
                <h3 class="why-card-title">Trace</h3>
                <p class="why-card-desc">Follow funds across connected wallets with an interactive visual graph. See exactly where money moved, when, and through which intermediaries.</p>
            </div>
            <div class="why-card">
                <div class="why-number">02</div>
                <h3 class="why-card-title">Detect</h3>
                <p class="why-card-desc">Identify suspicious transaction patterns automatically — fund splitting, rapid pass-throughs, peel chains, and connections to flagged addresses.</p>
            </div>
            <div class="why-card">
                <div class="why-number">03</div>
                <h3 class="why-card-title">Prioritize</h3>
                <p class="why-card-desc">Get a transparent, explainable risk score that helps investigators focus on the most suspicious leads first. No black boxes.</p>
            </div>
        </div>
    </div>
</section>

<!-- How It Works -->
<section class="how-section" id="how">
    <div class="container">
        <div class="section-header">
            <h2 class="section-title">How It Works</h2>
            <p class="section-subtitle">From wallet address to investigative lead in four steps.</p>
        </div>
        <div class="steps">
            <div class="step">
                <div class="step-number">01</div>
                <h3 class="step-title">Submit</h3>
                <p class="step-desc">Enter a suspicious wallet address and select your investigation parameters.</p>
            </div>
            <div class="step">
                <div class="step-number">02</div>
                <h3 class="step-title">Collect</h3>
                <p class="step-desc">Retrieve public blockchain transaction data from Etherscan or Blockchain.info APIs.</p>
            </div>
            <div class="step">
                <div class="step-number">03</div>
                <h3 class="step-title">Analyze</h3>
                <p class="step-desc">Detect suspicious wallet relationships, patterns, and anomalies using rule-based analytics.</p>
            </div>
            <div class="step">
                <div class="step-number">04</div>
                <h3 class="step-title">Investigate</h3>
                <p class="step-desc">Explore the visual graph and prioritized findings with full transparency and explainability.</p>
            </div>
        </div>
    </div>
</section>

<!-- Technology -->
<section class="tech-section" id="tech">
    <div class="container">
        <div class="section-header">
            <h2 class="section-title">Built for Blockchain Investigation</h2>
            <p class="section-subtitle">A transparent, modular technology stack designed for forensic workflows.</p>
        </div>
        <div class="tech-grid">
            <div class="tech-card">
                <div class="tech-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg></div>
                <div><div class="tech-name">Etherscan API</div><div class="tech-desc">Ethereum transaction data</div></div>
            </div>
            <div class="tech-card">
                <div class="tech-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.767 19.089c4.924.868 6.14-6.025 1.192-6.897m-1.192 6.897L12.5 21.5m-1.225-2.411c-4.924.868-6.14-6.025-1.192-6.897m1.192 6.897L11.5 21.5m1.225-2.411c4.924.868 6.14-6.025 1.192-6.897m-1.192 6.897L12.5 21.5"/><path d="M15.5 11.5c.466.751.593 1.677.296 2.548-.297.87-1.01 1.547-1.87 1.79"/><path d="M8.5 11.5c-.466.751-.593 1.677-.296 2.548.297.87 1.01 1.547 1.87 1.79"/></svg></div>
                <div><div class="tech-name">Blockchain.info API</div><div class="tech-desc">Bitcoin transaction data</div></div>
            </div>
            <div class="tech-card">
                <div class="tech-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg></div>
                <div><div class="tech-name">Neo4j</div><div class="tech-desc">Wallet relationship graph</div></div>
            </div>
            <div class="tech-card">
                <div class="tech-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/><path d="M11 17v.01"/><path d="M7 14v.01"/></svg></div>
                <div><div class="tech-name">Python</div><div class="tech-desc">Pattern detection and analytics</div></div>
            </div>
            <div class="tech-card">
                <div class="tech-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg></div>
                <div><div class="tech-name">React</div><div class="tech-desc">Investigator interface</div></div>
            </div>
            <div class="tech-card">
                <div class="tech-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg></div>
                <div><div class="tech-name">D3.js / React Flow</div><div class="tech-desc">Transaction visualization</div></div>
            </div>
        </div>
    </div>
</section>

<!-- Disclaimer -->
<section class="disclaimer">
    <div class="container">
        <div class="disclaimer-box">
            <div class="disclaimer-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg></div>
            <p class="disclaimer-text"><strong>Important:</strong> ChainSleuth identifies suspicious patterns in publicly available blockchain data. It does not make legal determinations or accusations. All findings should be reviewed by a qualified human investigator. Risk scores represent detected pattern correlations, not proof of criminal activity.</p>
        </div>
    </div>
</section>

<!-- Footer -->
<footer class="footer">
    <div class="container">
        <div class="footer-inner">
            <div class="footer-brand">
                <a href="#" class="footer-logo">
                    <div class="nav-logo-icon" style="width:28px;height:28px;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg></div>
                    ChainSleuth
                </a>
                <p class="footer-tagline">Blockchain intelligence for modern investigations. Trace the money. Expose the pattern.</p>
            </div>
            <div>
                <h4 class="footer-col-title">Product</h4>
                <ul class="footer-links">
                    <li><a href="#" id="footer-investigate">Investigate</a></li>
                    <li><a href="#about">About</a></li>
                </ul>
            </div>
            <div>
                <h4 class="footer-col-title">Resources</h4>
                <ul class="footer-links">
                    <li><a href="#">Documentation</a></li>
                    <li><a href="#">API Reference</a></li>
                </ul>
            </div>
            <div>
                <h4 class="footer-col-title">Company</h4>
                <ul class="footer-links">
                    <li><a href="#">Privacy</a></li>
                    <li><a href="#">Terms</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p class="footer-copyright">© 2026 ChainSleuth. All rights reserved. Demo prototype for hackathon presentation.</p>
            <div class="footer-status"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> System Status: Operational</div>
        </div>
    </div>
</footer>
`;
