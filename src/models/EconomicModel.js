/**
 * EconomicModel - Simplified macroeconomic simulation
 * Models the relationship between interest rate and inflation
 * NOW WITH: Exchange rate, reserves, GDP, full BCRP mechanics, and NEWS SYSTEM
 */
export default class EconomicModel {
    constructor() {
        // State variables - START WITH REALISTIC CONDITIONS
        this.inflation = 2.8; // Start in middle of target (more realistic)
        this.inflationSAE = 2.5; // Core inflation (Sin Alimentos y Energía)
        this.interestRate = 6.25; // Neutral rate
        this.exchangeRate = 3.75; // Middle of realistic range
        this.reserves = 68000; // Comfortable level
        this.gdpGrowth = 2.5; // Moderate growth
        this.potentialGDP = 3.0; // Potential GDP growth rate
        this.outputGap = -0.5; // Small negative gap
        this.demand = 100; // Normal
        this.expectations = 2.5; // Anchored
        this.credibility = 90; // Good credibility
        this.fedRate = 4.5; // US Federal Reserve rate
        
        // Target ranges
        this.targetInflationMin = 1.0;
        this.targetInflationMax = 3.0;
        this.targetExchangeRateMin = 3.40; // More realistic range (was 3.60)
        this.targetExchangeRateMax = 3.90; // Keep upper bound
        
        // Model parameters (tunable)
        this.sensitivity = 0.20; // Increased - interest rate affects inflation more
        this.lagPeriods = 3; // Number of periods for full effect
        this.naturalInflation = 3.0; // Higher baseline - economy tends toward inflation
        this.inertia = 0.90; // Higher inertia - harder to change inflation
        
        // Exchange rate parameters
        this.exchangeRateVolatility = 0.025; // Increased volatility
        
        // Internal state for lag implementation
        this.rateHistory = [];
        this.weekCounter = 0; // Changed to weeks
        this.weeksPerUpdate = 1; // Game weeks per update call
        
        // Player actions
        this.lastIntervention = null; // 'buy' or 'sell' dollars
        this.interventionCooldown = 0;
        this.interventionAmount = 200; // Default intervention amount in millions USD
        
        // News and events system
        this.newsQueue = [];
        this.lastNewsTime = 0;
        this.nextEventTime = Math.random() * 10 + 5; // Events every 5-15 months (more frequent)
        
        // Level system
        this.level = 1;
        
        // Quarterly report system
        this.lastReportWeek = 0; // Changed to weeks
        this.reportQueue = [];
    }
    
    /**
     * Update the economic simulation by one time step (1 week)
     */
    update(deltaTime = 1) {
        const prevWeek = Math.floor(this.weekCounter);
        this.weekCounter += deltaTime;
        const currentWeek = Math.floor(this.weekCounter);
        const currentMonth = Math.floor(currentWeek / 4); // 4 weeks = 1 month
        const prevMonth = Math.floor(prevWeek / 4);
        
        // Store interest rate history for lag calculation
        this.rateHistory.push(this.interestRate);
        if (this.rateHistory.length > this.lagPeriods) {
            this.rateHistory.shift();
        }
        
        // Generate news when month changes (every 4 weeks)
        if (currentMonth > prevMonth) {
            this.generateEconomicNews();
        }
        
        // Generate random events (less frequent - every 4 weeks = monthly)
        if (currentWeek > prevWeek && currentWeek % 4 === 0) {
            if (this.weekCounter >= this.nextEventTime) {
                this.generateRandomEvent();
            }
        }
        
        // Calculate average lagged interest rate effect
        const avgLaggedRate = this.rateHistory.reduce((sum, rate) => sum + rate, 0) / this.rateHistory.length;
        
        // Interest rate transmission mechanism:
        // Higher interest rate → Lower inflation (with lag)
        const neutralRate = 5.0; // Neutral interest rate (no effect on inflation)
        const rateGap = avgLaggedRate - neutralRate;
        const rateEffect = -this.sensitivity * rateGap;
        
        // Exchange rate affects inflation (pass-through effect)
        const exchangeRateChange = this.exchangeRate - 3.75; // Deviation from equilibrium
        const exchangeRateEffect = Math.max(0, exchangeRateChange * 0.25); // Only positive (depreciation increases inflation)
        
        // Demand affects inflation
        const demandEffect = (this.demand - 100) * 0.02;
        
        // Inflation dynamics with inertia (weekly changes are smaller)
        const weeklyAdjustment = 0.25; // Weekly changes are 1/4 of monthly
        const targetInflation = this.naturalInflation + rateEffect + exchangeRateEffect + demandEffect;
        this.inflation = this.inertia * this.inflation + (1 - this.inertia) * targetInflation * weeklyAdjustment;
        
        // Core inflation (SAE - Sin Alimentos y Energía)
        // More stable, less affected by temporary shocks
        const coreTargetInflation = this.naturalInflation + rateEffect + demandEffect * 0.5;
        this.inflationSAE = 0.95 * this.inflationSAE + 0.05 * coreTargetInflation;
        
        // Expectations follow actual inflation
        this.expectations = 0.7 * this.expectations + 0.3 * this.inflation;
        
        // Exchange rate dynamics
        this.updateExchangeRate();
        
        // GDP growth affected by interest rate and exchange rate
        const rateImpactOnGDP = -0.15 * (this.interestRate - 5.0); // Higher rates slow growth MORE
        const exchangeImpactOnGDP = 0.03 * (this.exchangeRate - 3.75); // Depreciation helps exports (reduced)
        this.gdpGrowth = 1.5 + rateImpactOnGDP + exchangeImpactOnGDP + (Math.random() - 0.6) * 0.4; // Biased downward
        this.gdpGrowth = Math.max(-3, Math.min(6, this.gdpGrowth));
        
        // Output gap (Brecha de producto)
        this.outputGap = this.gdpGrowth - this.potentialGDP;
        
        // Demand affected by GDP growth
        this.demand = 100 + this.gdpGrowth * 2 + (Math.random() - 0.5) * 5;
        
        // AGGRESSIVE natural economic drift - economy deteriorates without intervention
        // This makes the game impossible to win by doing nothing
        // Weekly drift is smaller than monthly
        if (Math.random() < 0.20) { // 20% chance each week (was 70% per month)
            const driftType = Math.random();
            if (driftType < 0.25) {
                // Demand shock (smaller weekly)
                this.demand += (Math.random() - 0.5) * 5;
            } else if (driftType < 0.5) {
                // Exchange rate DEPRECIATION pressure (sol se debilita = tipo de cambio SUBE)
                this.exchangeRate += Math.random() * 0.04; // Smaller weekly change
            } else if (driftType < 0.75) {
                // Inflation pressure (always upward)
                this.inflation += Math.random() * 0.1; // Smaller weekly change
            } else {
                // Credibility erosion
                this.credibility -= Math.random() * 0.75; // Smaller weekly change
            }
        }
        
        // Reserves naturally deplete (capital flight, imports) - weekly
        this.reserves -= Math.random() * 40; // Lose 0-40M per week (was 0-150M per month)
        
        // GDP naturally slows down without stimulus - weekly
        this.gdpGrowth -= Math.random() * 0.025; // Smaller weekly change
        
        // Credibility affected by inflation control (weekly adjustment)
        if (this.isInflationInTarget()) {
            this.credibility = Math.min(100, this.credibility + 0.125); // Weekly: 0.5/4
        } else {
            this.credibility = Math.max(0, this.credibility - 0.25); // Weekly: 1/4
        }
        
        // FED rate changes (random events) - less frequent
        if (Math.random() < 0.005) { // 0.5% chance per week (was 2% per month)
            const change = (Math.random() - 0.5) * 0.5;
            this.fedRate = Math.max(0, Math.min(8, this.fedRate + change));
            if (Math.abs(change) > 0.2) {
                this.addNews(`🇺🇸 FED ${change > 0 ? 'sube' : 'baja'} tasa a ${this.fedRate.toFixed(2)}%`, 'fed');
            }
        }
        
        // Generate quarterly report (every 12 weeks = 3 months)
        if (currentWeek > prevWeek && currentWeek % 12 === 0 && currentWeek !== this.lastReportWeek) {
            this.generateQuarterlyReport();
            this.lastReportWeek = currentWeek;
        }
        
        // Add small random noise for realism
        this.inflation += (Math.random() - 0.5) * 0.1;
        
        // Bounds checking
        this.inflation = Math.max(0, Math.min(15, this.inflation));
        
        // Cooldown for interventions
        if (this.interventionCooldown > 0) {
            this.interventionCooldown--;
        }
    }
    
    updateExchangeRate() {
        // Exchange rate affected by interest rate differential (Carry trade)
        const rateDifferential = this.interestRate - this.fedRate; // Use FED rate
        const rateEffect = -rateDifferential * 0.02; // Increased sensitivity (was 0.015)
        
        // Random shocks (capital flows, commodity prices, risk aversion)
        // MORE BALANCED - can go up or down
        const shock = (Math.random() - 0.4) * this.exchangeRateVolatility; // Slight bias toward depreciation (0.4 instead of 0.5)
        
        // Inflation differential effect (PPP - Purchasing Power Parity)
        // Higher inflation = depreciation (tipo de cambio sube)
        const inflationEffect = (this.inflation - 2.0) * 0.015; // Can be negative if inflation is low
        
        // Commodity prices effect (copper, gold, etc.)
        // Simulated: when GDP is strong, commodities are likely high → sol appreciates
        const commodityEffect = (this.gdpGrowth - 2.0) * 0.01; // Negative = appreciation
        
        // Apply all effects
        this.exchangeRate += rateEffect + shock + inflationEffect + commodityEffect;
        
        // MORE REALISTIC BOUNDS - can go lower
        this.exchangeRate = Math.max(2.5, Math.min(5.0, this.exchangeRate)); // Was 3.0 min, now 2.5
        
        // Reset intervention flag (effect was already applied in interveneForex)
        this.lastIntervention = null;
    }
    
    /**
     * Intervene in forex market (player action)
     * BCRP mechanics:
     * - Comprar USD = BCRP compra dólares del mercado, vende soles → tipo de cambio SUBE (sol se debilita)
     * - Vender USD = BCRP vende dólares al mercado, compra soles → tipo de cambio BAJA (sol se fortalece)
     */
    interveneForex(action, amount = null) {
        if (this.interventionCooldown > 0) {
            return { success: false, message: 'Intervención en cooldown' };
        }
        
        const interventionAmount = amount || this.interventionAmount;
        
        if (action === 'buy') {
            // COMPRAR USD: BCRP compra dólares, AUMENTA reservas, DEBILITA el sol (sube tipo de cambio)
            if (this.reserves < 75000) { // Límite superior de reservas
                this.reserves += interventionAmount; // Aumenta reservas
                this.lastIntervention = 'buy';
                this.interventionCooldown = 2;
                
                // Efecto inmediato en tipo de cambio (proporcional al monto)
                const effect = (interventionAmount / 1000) * 0.25; // Más monto = más efecto
                this.exchangeRate += effect; // Sol se debilita (sube el tipo de cambio)
                
                // Generate news about intervention
                this.addNews(`📰 BCRP compra USD $${interventionAmount}M para moderar apreciación del sol`, 'intervention');
                
                return { 
                    success: true, 
                    message: `Comprando USD +$${interventionAmount}M`,
                    effect: 'Sol se debilita',
                    amount: interventionAmount
                };
            } else {
                return { success: false, message: 'Reservas al máximo' };
            }
        } else if (action === 'sell') {
            // VENDER USD: BCRP vende dólares, REDUCE reservas, FORTALECE el sol (baja tipo de cambio)
            if (this.reserves > interventionAmount) {
                this.reserves -= interventionAmount; // Reduce reservas
                this.lastIntervention = 'sell';
                this.interventionCooldown = 2;
                
                // Efecto inmediato en tipo de cambio (proporcional al monto)
                const effect = (interventionAmount / 1000) * 0.25; // Más monto = más efecto
                this.exchangeRate -= effect; // Sol se fortalece (baja el tipo de cambio)
                
                // Generate news about intervention
                this.addNews(`📰 BCRP vende USD $${interventionAmount}M para contener depreciación del sol`, 'intervention');
                
                return { 
                    success: true, 
                    message: `Vendiendo USD -$${interventionAmount}M`,
                    effect: 'Sol se fortalece',
                    amount: interventionAmount
                };
            } else {
                return { success: false, message: `Reservas insuficientes (necesitas $${interventionAmount}M)` };
            }
        }
        
        return { success: false, message: 'Acción inválida' };
    }
    
    /**
     * Add news to the queue (avoid duplicates)
     */
    addNews(text, type = 'general') {
        // Check if this exact news already exists in recent news
        const isDuplicate = this.newsQueue.some(item => item.text === text);
        if (isDuplicate) return;
        
        this.newsQueue.push({
            text: text,
            type: type,
            time: Math.floor(this.weekCounter / 4) // Store as months for compatibility
        });
        
        // Keep only last 12 news items
        if (this.newsQueue.length > 12) {
            this.newsQueue.shift();
        }
    }
    
    /**
     * Generate economic news based on current state
     */
    generateEconomicNews() {
        const state = this.getState();
        
        // Interest rate changes generate news
        if (this.rateHistory.length >= 2 && Math.abs(this.interestRate - this.rateHistory[this.rateHistory.length - 2]) > 0.5) {
            if (this.interestRate > this.rateHistory[this.rateHistory.length - 2]) {
                this.addNews(`🔴 BCRP sube tasa a ${this.interestRate.toFixed(2)}% - Créditos más caros`, 'rate');
            } else {
                this.addNews(`🟢 BCRP baja tasa a ${this.interestRate.toFixed(2)}% - Créditos más baratos`, 'rate');
            }
        }
        
        // Inflation news - MORE RELEVANT
        if (state.inflation > 5) {
            this.addNews(`⚠️ INFLACIÓN ALTA: ${state.inflation.toFixed(1)}% - Familias pierden poder adquisitivo`, 'inflation');
        } else if (state.inflation < 1) {
            this.addNews(`❄️ INFLACIÓN BAJA: ${state.inflation.toFixed(1)}% - Riesgo de deflación`, 'inflation');
        } else if (state.inTarget) {
            this.addNews(`✅ Inflación en meta: ${state.inflation.toFixed(1)}% - Economía estable`, 'inflation');
        }
        
        // Exchange rate news - MORE IMPACTFUL
        if (state.exchangeRate > 4.0) {
            this.addNews(`💸 DÓLAR DISPARA: S/ ${state.exchangeRate.toFixed(2)} - Importaciones se encarecen`, 'exchange');
        } else if (state.exchangeRate < 3.5) {
            this.addNews(`💪 SOL FUERTE: S/ ${state.exchangeRate.toFixed(2)} - Exportadores preocupados`, 'exchange');
        }
        
        // GDP news - MORE DRAMATIC
        if (state.gdpGrowth < -1) {
            this.addNews(`📉 RECESIÓN: PBI cae ${Math.abs(state.gdpGrowth).toFixed(1)}% - Desempleo aumenta`, 'gdp');
        } else if (state.gdpGrowth > 4) {
            this.addNews(`🚀 BOOM ECONÓMICO: PBI crece ${state.gdpGrowth.toFixed(1)}% - Inversión récord`, 'gdp');
        }
        
        // Reserves news - CRITICAL ALERTS
        if (state.reserves < 50000) {
            this.addNews(`🚨 RESERVAS CRÍTICAS: $${(state.reserves/1000).toFixed(1)}B - Capacidad de intervención limitada`, 'reserves');
        }
        
        // Credibility news - REPUTATION MATTERS
        if (state.credibility < 60) {
            this.addNews(`⭐ CREDIBILIDAD BAJA: ${Math.floor(state.credibility)}% - Mercados dudan del BCRP`, 'credibility');
        } else if (state.credibility > 95) {
            this.addNews(`⭐ CREDIBILIDAD ALTA: ${Math.floor(state.credibility)}% - Confianza total en BCRP`, 'credibility');
        }
    }
    
    /**
     * Generate random external/internal events
     */
    generateRandomEvent() {
        const externalEvents = [
            // External shocks - MORE AGGRESSIVE
            { text: '🌍 FED sube tasas en EE.UU. - Dólares más atractivos', effect: () => { this.exchangeRate += 0.25; this.demand -= 10; }, impact: '↑↑ Tipo cambio, ↓↓ Demanda' },
            { text: '⚡ Guerra en Medio Oriente - Petróleo sube 20%', effect: () => { this.inflation += 0.8; this.exchangeRate += 0.15; }, impact: '↑↑ Inflación, ↑ Tipo cambio' },
            { text: '🇨🇳 China desacelera - Precio del cobre cae', effect: () => { this.exchangeRate += 0.3; this.gdpGrowth -= 0.8; }, impact: '↑↑ Tipo cambio, ↓↓ PBI' },
            { text: '🌪️ Huracán en EE.UU. - Demanda de materias primas sube', effect: () => { this.exchangeRate -= 0.15; this.gdpGrowth += 0.5; }, impact: '↓ Tipo cambio, ↑ PBI' },
            { text: '💰 FMI aprueba línea de crédito para Perú', effect: () => { this.credibility += 8; this.exchangeRate -= 0.08; }, impact: '↑ Credibilidad, ↓ Tipo cambio' },
            { text: '📉 Crisis financiera en Argentina - Contagio regional', effect: () => { this.exchangeRate += 0.25; this.credibility -= 8; }, impact: '↑↑ Tipo cambio, ↓↓ Credibilidad' },
            { text: '🏦 Banco Mundial mejora perspectivas para Perú', effect: () => { this.credibility += 5; this.demand += 8; }, impact: '↑ Credibilidad, ↑ Demanda' },
            { text: '🛢️ OPEP recorta producción - Petróleo se dispara', effect: () => { this.inflation += 0.7; this.exchangeRate += 0.12; }, impact: '↑↑ Inflación, ↑ Tipo cambio' },
            { text: '🇺🇸 Recesión en EE.UU. - Demanda de exportaciones cae', effect: () => { this.gdpGrowth -= 1.0; this.exchangeRate += 0.2; }, impact: '↓↓ PBI, ↑↑ Tipo cambio' },
            { text: '🇪🇺 BCE sube tasas - Capital fluye a Europa', effect: () => { this.exchangeRate += 0.15; this.demand -= 5; }, impact: '↑ Tipo cambio, ↓ Demanda' },
            { text: '🌾 Sequía en Brasil - Precios de alimentos suben', effect: () => { this.inflation += 0.5; }, impact: '↑ Inflación' },
            { text: '💎 Descubren nuevo yacimiento minero en Chile', effect: () => { this.exchangeRate += 0.12; }, impact: '↑ Tipo cambio (competencia)' },
            { text: '🌊 Tsunami en Asia - Pánico en mercados emergentes', effect: () => { this.exchangeRate += 0.3; this.credibility -= 5; }, impact: '↑↑ Tipo cambio, ↓ Credibilidad' },
        ];
        
        const internalEvents = [
            // Internal events - MORE AGGRESSIVE
            { text: '🗳️ Elecciones presidenciales - Incertidumbre política', effect: () => { this.exchangeRate += 0.2; this.demand -= 15; }, impact: '↑↑ Tipo cambio, ↓↓ Demanda' },
            { text: '⚖️ Congreso censura ministro de economía', effect: () => { this.credibility -= 10; this.exchangeRate += 0.15; }, impact: '↓↓ Credibilidad, ↑ Tipo cambio' },
            { text: '🛣️ Gobierno anuncia plan de infraestructura $5B', effect: () => { this.demand += 15; this.gdpGrowth += 0.6; }, impact: '↑↑ Demanda, ↑ PBI' },
            { text: '⛏️ Conflicto minero paraliza producción de cobre', effect: () => { this.gdpGrowth -= 0.5; this.exchangeRate += 0.15; }, impact: '↓ PBI, ↑ Tipo cambio' },
            { text: '🌾 Fenómeno El Niño afecta agricultura', effect: () => { this.inflation += 0.6; this.gdpGrowth -= 0.4; }, impact: '↑ Inflación, ↓ PBI' },
            { text: '🏭 Inversión extranjera récord en minería', effect: () => { this.gdpGrowth += 0.7; this.exchangeRate -= 0.12; }, impact: '↑ PBI, ↓ Tipo cambio' },
            { text: '🚨 Protestas sociales afectan producción nacional', effect: () => { this.demand -= 15; this.gdpGrowth -= 0.6; }, impact: '↓↓ Demanda, ↓ PBI' },
            { text: '📊 Moody\'s mejora calificación crediticia del Perú', effect: () => { this.credibility += 12; this.exchangeRate -= 0.15; }, impact: '↑↑ Credibilidad, ↓ Tipo cambio' },
            { text: '🏛️ Reforma tributaria aprobada en Congreso', effect: () => { this.demand -= 8; this.credibility += 5; }, impact: '↓ Demanda, ↑ Credibilidad' },
            { text: '💼 Desempleo sube a niveles preocupantes', effect: () => { this.demand -= 12; this.inflation -= 0.3; }, impact: '↓↓ Demanda, ↓ Inflación' },
            { text: '🎓 Reforma educativa aumenta productividad', effect: () => { this.gdpGrowth += 0.5; this.credibility += 4; }, impact: '↑ PBI, ↑ Credibilidad' },
            { text: '🏥 Crisis en sistema de salud genera malestar', effect: () => { this.credibility -= 8; this.demand -= 8; }, impact: '↓↓ Credibilidad, ↓ Demanda' },
            { text: '🔥 Incendios forestales destruyen cultivos', effect: () => { this.inflation += 0.5; this.gdpGrowth -= 0.3; }, impact: '↑ Inflación, ↓ PBI' },
        ];
        
        // Choose random event type
        const isExternal = Math.random() > 0.5;
        const eventList = isExternal ? externalEvents : internalEvents;
        const event = eventList[Math.floor(Math.random() * eventList.length)];
        
        // Add news with impact information
        const eventType = isExternal ? 'event-external' : 'event-internal';
        this.addNews(`${event.text}\n💥 Impacto: ${event.impact}`, eventType);
        event.effect();
        
        // Schedule next event (more frequent in higher levels)
        const baseInterval = 60 - (this.level * 8); // Weeks between events
        this.nextEventTime = this.weekCounter + Math.random() * baseInterval + 20;
    }
    
    /**
     * Generate quarterly inflation report (transparency requirement)
     */
    generateQuarterlyReport() {
        const quarter = Math.floor(this.weekCounter / 12); // 12 weeks = 1 quarter
        
        let report = `📊 REPORTE DE INFLACIÓN - T${quarter}\n\n`;
        
        // Inflation assessment
        if (this.isInflationInTarget()) {
            report += `✅ Inflación en meta (${this.inflation.toFixed(1)}%)\n`;
        } else if (this.inflation > this.targetInflationMax) {
            report += `⚠️ Inflación sobre meta (${this.inflation.toFixed(1)}%)\n`;
        } else {
            report += `⚠️ Inflación bajo meta (${this.inflation.toFixed(1)}%)\n`;
        }
        
        // Core inflation
        report += `📌 Inflación subyacente: ${this.inflationSAE.toFixed(1)}%\n`;
        
        // Output gap
        if (this.outputGap > 0) {
            report += `📈 Economía sobre potencial (+${this.outputGap.toFixed(1)}pp)\n`;
        } else {
            report += `📉 Economía bajo potencial (${this.outputGap.toFixed(1)}pp)\n`;
        }
        
        // Policy stance
        if (this.interestRate > 7) {
            report += `🔴 Política monetaria restrictiva\n`;
        } else if (this.interestRate < 6) {
            report += `🟢 Política monetaria expansiva\n`;
        } else {
            report += `🟡 Política monetaria neutral\n`;
        }
        
        // Forward guidance
        if (this.expectations > this.targetInflationMax) {
            report += `⚡ Expectativas desancladas - Acción requerida`;
        } else {
            report += `✓ Expectativas ancladas`;
        }
        
        this.addNews(report, 'report');
    }
    
    /**
     * Set intervention amount
     */
    setInterventionAmount(amount) {
        this.interventionAmount = Math.max(50, Math.min(1000, amount));
    }
    
    /**
     * Set the interest rate (player action)
     */
    setInterestRate(rate) {
        this.interestRate = Math.max(0, Math.min(20, rate));
    }
    
    /**
     * Check if inflation is within target range
     */
    isInflationInTarget() {
        return this.inflation >= this.targetInflationMin && 
               this.inflation <= this.targetInflationMax;
    }
    
    /**
     * Check if exchange rate is stable
     */
    isExchangeRateStable() {
        return this.exchangeRate >= this.targetExchangeRateMin &&
               this.exchangeRate <= this.targetExchangeRateMax;
    }
    
    /**
     * Get overall economic health score
     */
    getEconomicHealth() {
        let score = 0;
        
        // Inflation in target: +30 points
        if (this.isInflationInTarget()) score += 30;
        
        // Exchange rate stable: +20 points
        if (this.isExchangeRateStable()) score += 20;
        
        // Positive GDP growth: +20 points
        if (this.gdpGrowth > 0) score += 20;
        
        // High reserves: +15 points
        if (this.reserves > 60000) score += 15;
        
        // High credibility: +15 points
        if (this.credibility > 80) score += 15;
        
        return score; // 0-100
    }
    
    /**
     * Get current state for display
     */
    getState() {
        return {
            inflation: this.inflation,
            inflationSAE: this.inflationSAE,
            interestRate: this.interestRate,
            exchangeRate: this.exchangeRate,
            reserves: this.reserves,
            gdpGrowth: this.gdpGrowth,
            potentialGDP: this.potentialGDP,
            outputGap: this.outputGap,
            demand: this.demand,
            expectations: this.expectations,
            credibility: this.credibility,
            fedRate: this.fedRate,
            inTarget: this.isInflationInTarget(),
            exchangeRateStable: this.isExchangeRateStable(),
            economicHealth: this.getEconomicHealth(),
            week: Math.floor(this.weekCounter),
            month: Math.floor(this.weekCounter / 4),
            year: Math.floor(this.weekCounter / 52),
            canIntervene: this.interventionCooldown === 0,
            news: this.newsQueue,
            interventionAmount: this.interventionAmount,
            level: this.level
        };
    }
    
    /**
     * Set level (affects difficulty)
     */
    setLevel(level) {
        this.level = level;
        // Increase volatility with level
        this.exchangeRateVolatility = 0.015 + (level - 1) * 0.005;
    }
    
    /**
     * Reset the model to initial state
     */
    reset() {
        this.inflation = 2.8; // Realistic start
        this.inflationSAE = 2.5;
        this.interestRate = 6.25;
        this.exchangeRate = 3.75; // Realistic start
        this.reserves = 68000; // Comfortable start
        this.gdpGrowth = 2.5; // Moderate start
        this.potentialGDP = 3.0;
        this.outputGap = -0.5;
        this.demand = 100; // Normal start
        this.expectations = 2.5; // Anchored start
        this.credibility = 90; // Good start
        this.fedRate = 4.5;
        this.rateHistory = [];
        this.weekCounter = 0; // Changed to weeks
        this.lastIntervention = null;
        this.interventionCooldown = 0;
        this.newsQueue = [];
        this.nextEventTime = Math.random() * 40 + 20; // Weeks
        this.lastReportWeek = 0; // Changed to weeks
        this.reportQueue = [];
    }
}
