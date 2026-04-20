/**
 * AdvisorPanel - Economic advisor that gives hints when player is struggling
 * Appears naturally as part of the BCRP team
 */
export default class AdvisorPanel {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.currentAdvice = null;
        this.adviceTimer = 0;
        this.adviceDelay = 5000; // Show advice after 5 seconds of problem
        this.problemStartTime = {};
        
        this.create();
    }
    
    create() {
        // Panel background - MORE COMPACT
        const panel = this.scene.add.graphics();
        panel.fillStyle(0x0a0e1a, 0.95);
        panel.lineStyle(3, 0xffd700, 1);
        panel.fillRoundedRect(this.x - 200, this.y - 60, 400, 120, 10);
        panel.strokeRoundedRect(this.x - 200, this.y - 60, 400, 120, 10);
        
        // Title with advisor icon - SMALLER
        this.scene.add.text(this.x, this.y - 40, '💼 ASESOR BCRP', {
            font: 'bold 12px Courier New',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Advice text (will be updated) - MORE COMPACT
        this.adviceText = this.scene.add.text(this.x, this.y + 5, 'Todo bajo control...', {
            font: '11px Courier New',
            fill: '#ffffff',
            align: 'center',
            wordWrap: { width: 360 },
            lineSpacing: 2
        }).setOrigin(0.5);
        
        // Urgency indicator - SMALLER
        this.urgencyIndicator = this.scene.add.text(this.x - 180, this.y - 40, '🟢', {
            font: '14px Courier New'
        });
    }
    
    update(economicState) {
        const now = Date.now();
        
        // Detect problems
        const problems = this.detectProblems(economicState);
        
        if (problems.length > 0) {
            const mainProblem = problems[0]; // Most urgent
            
            // Track how long this problem has existed
            if (!this.problemStartTime[mainProblem.type]) {
                this.problemStartTime[mainProblem.type] = now;
            }
            
            const problemDuration = now - this.problemStartTime[mainProblem.type];
            
            // Show advice after delay (player is struggling)
            if (problemDuration > this.adviceDelay) {
                this.showAdvice(mainProblem);
            }
        } else {
            // No problems, clear timers
            this.problemStartTime = {};
            this.showDefaultMessage();
        }
    }
    
    detectProblems(state) {
        const problems = [];
        
        // High inflation
        if (state.inflation > 5) {
            problems.push({
                type: 'high-inflation',
                urgency: state.inflation > 8 ? 'critical' : 'high',
                advice: state.inflation > 8 
                    ? '🔥 HIPERINFLACIÓN! Sube tasa a 8-9% + Vende USD'
                    : '⚠️ Inflación alta. Sube tasa a 7.5-8%'
            });
        }
        
        // Low inflation / deflation
        if (state.inflation < 1) {
            problems.push({
                type: 'deflation',
                urgency: state.inflation < 0.5 ? 'high' : 'medium',
                advice: state.inflation < 0.5
                    ? '❄️ DEFLACIÓN! Baja tasa a 5-6% + Estimula demanda'
                    : '📉 Inflación baja. Baja tasa a 6-6.5%'
            });
        }
        
        // Exchange rate too high
        if (state.exchangeRate > 4.2) {
            problems.push({
                type: 'weak-currency',
                urgency: state.exchangeRate > 4.5 ? 'critical' : 'high',
                advice: state.exchangeRate > 4.5
                    ? '💸 SOL MUY DÉBIL! Vende USD $500-800M + Sube tasa'
                    : '💵 Sol debilitándose. Vende USD $300-500M'
            });
        }
        
        // Exchange rate too low
        if (state.exchangeRate < 3.5) {
            problems.push({
                type: 'strong-currency',
                urgency: 'medium',
                advice: '💪 Sol muy fuerte. Compra USD $300-500M + Baja tasa'
            });
        }
        
        // Low reserves
        if (state.reserves < 55000) {
            problems.push({
                type: 'low-reserves',
                urgency: state.reserves < 50000 ? 'critical' : 'high',
                advice: state.reserves < 50000
                    ? '🚨 RESERVAS CRÍTICAS! Deja de vender USD + Sube tasa'
                    : '⚠️ Reservas bajas. Reduce intervenciones'
            });
        }
        
        // Low credibility
        if (state.credibility < 70) {
            problems.push({
                type: 'low-credibility',
                urgency: state.credibility < 50 ? 'critical' : 'high',
                advice: state.credibility < 50
                    ? '⭐ CREDIBILIDAD PERDIDA! Cumple meta 1-3% + Sé consistente'
                    : '📉 Credibilidad cayendo. Enfócate en inflación'
            });
        }
        
        // Negative GDP
        if (state.gdpGrowth < -0.5) {
            problems.push({
                type: 'recession',
                urgency: 'high',
                advice: '📉 RECESIÓN! Baja tasa + Estimula economía'
            });
        }
        
        // Multiple problems (crisis)
        const criticalCount = problems.filter(p => p.urgency === 'critical').length;
        if (criticalCount >= 2) {
            problems.unshift({
                type: 'crisis',
                urgency: 'critical',
                advice: '🚨 CRISIS MÚLTIPLE! Prioriza inflación + tipo cambio'
            });
        }
        
        // Sort by urgency
        const urgencyOrder = { 'critical': 0, 'high': 1, 'medium': 2 };
        problems.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
        
        return problems;
    }
    
    showAdvice(problem) {
        this.adviceText.setText(problem.advice);
        
        // Update urgency indicator
        const indicators = {
            'critical': '🔴',
            'high': '🟠',
            'medium': '🟡'
        };
        this.urgencyIndicator.setText(indicators[problem.urgency] || '🟢');
    }
    
    showDefaultMessage() {
        const messages = [
            '✅ Economía estable - Sigue así',
            '👍 Buen trabajo - Mantén el balance',
            '💪 Todo bajo control',
            '🎯 En la meta - Protege credibilidad',
            '⚖️ Balance perfecto'
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        this.adviceText.setText(randomMessage);
        this.urgencyIndicator.setText('🟢');
    }
}
