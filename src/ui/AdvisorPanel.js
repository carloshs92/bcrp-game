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
        // Panel background
        const panel = this.scene.add.graphics();
        panel.fillStyle(0x0a0e1a, 0.95);
        panel.lineStyle(3, 0xffd700, 1);
        panel.fillRoundedRect(this.x - 200, this.y - 80, 400, 160, 10);
        panel.strokeRoundedRect(this.x - 200, this.y - 80, 400, 160, 10);
        
        // Title with advisor icon
        this.scene.add.text(this.x, this.y - 55, '💼 ASESOR ECONÓMICO', {
            font: 'bold 14px Courier New',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Advisor name
        this.scene.add.text(this.x, this.y - 35, 'Dr. Velarde - Equipo BCRP', {
            font: '11px Courier New',
            fill: '#888888'
        }).setOrigin(0.5);
        
        // Advice text (will be updated)
        this.adviceText = this.scene.add.text(this.x, this.y, 'Todo bajo control por ahora...', {
            font: '12px Courier New',
            fill: '#ffffff',
            align: 'center',
            wordWrap: { width: 360 },
            lineSpacing: 4
        }).setOrigin(0.5);
        
        // Urgency indicator
        this.urgencyIndicator = this.scene.add.text(this.x - 180, this.y - 55, '🟢', {
            font: '16px Courier New'
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
                    ? '🔥 ¡HIPERINFLACIÓN!\n\n💡 Sube la tasa de interés a 8-9%\n💡 Vende dólares para fortalecer el sol\n💡 Esto enfriará la economía'
                    : '⚠️ Inflación muy alta\n\n💡 Sube la tasa de interés a 7.5-8%\n💡 Reduce la demanda agregada\n💡 Monitorea el tipo de cambio'
            });
        }
        
        // Low inflation / deflation
        if (state.inflation < 1) {
            problems.push({
                type: 'deflation',
                urgency: state.inflation < 0.5 ? 'high' : 'medium',
                advice: state.inflation < 0.5
                    ? '❄️ ¡DEFLACIÓN PELIGROSA!\n\n💡 Baja la tasa de interés a 5-6%\n💡 Estimula la demanda\n💡 Acepta algo de depreciación del sol'
                    : '📉 Inflación muy baja\n\n💡 Baja la tasa de interés a 6-6.5%\n💡 Impulsa el crecimiento económico\n💡 Vigila que no caiga más'
            });
        }
        
        // Exchange rate too high
        if (state.exchangeRate > 4.2) {
            problems.push({
                type: 'weak-currency',
                urgency: state.exchangeRate > 4.5 ? 'critical' : 'high',
                advice: state.exchangeRate > 4.5
                    ? '💸 ¡SOL MUY DÉBIL!\n\n💡 Vende USD $500-800M urgente\n💡 Sube la tasa de interés\n💡 Esto atraerá capital extranjero'
                    : '💵 Sol debilitándose\n\n💡 Vende USD $300-500M\n💡 Considera subir tasa 0.25-0.5%\n💡 Protege tus reservas'
            });
        }
        
        // Exchange rate too low
        if (state.exchangeRate < 3.5) {
            problems.push({
                type: 'strong-currency',
                urgency: 'medium',
                advice: '💪 Sol muy fuerte\n\n💡 Compra USD $300-500M\n💡 Baja la tasa de interés\n💡 Ayuda a exportadores'
            });
        }
        
        // Low reserves
        if (state.reserves < 55000) {
            problems.push({
                type: 'low-reserves',
                urgency: state.reserves < 50000 ? 'critical' : 'high',
                advice: state.reserves < 50000
                    ? '🚨 ¡RESERVAS CRÍTICAS!\n\n💡 DEJA de vender dólares\n💡 Sube la tasa para atraer capital\n💡 Compra USD cuando puedas'
                    : '⚠️ Reservas bajas\n\n💡 Reduce intervenciones cambiarias\n💡 Solo vende USD en emergencias\n💡 Acumula reservas comprando'
            });
        }
        
        // Low credibility
        if (state.credibility < 70) {
            problems.push({
                type: 'low-credibility',
                urgency: state.credibility < 50 ? 'critical' : 'high',
                advice: state.credibility < 50
                    ? '⭐ ¡CREDIBILIDAD PERDIDA!\n\n💡 Cumple la meta de inflación 1-3%\n💡 Sé consistente con tus políticas\n💡 Evita cambios bruscos'
                    : '📉 Credibilidad cayendo\n\n💡 Enfócate en controlar inflación\n💡 Mantén políticas predecibles\n💡 La credibilidad es tu activo más valioso'
            });
        }
        
        // Negative GDP
        if (state.gdpGrowth < -0.5) {
            problems.push({
                type: 'recession',
                urgency: 'high',
                advice: '📉 ¡RECESIÓN!\n\n💡 Baja la tasa de interés\n💡 Estimula la economía\n💡 Acepta algo más de inflación temporalmente'
            });
        }
        
        // Multiple problems (crisis)
        const criticalCount = problems.filter(p => p.urgency === 'critical').length;
        if (criticalCount >= 2) {
            problems.unshift({
                type: 'crisis',
                urgency: 'critical',
                advice: '🚨 ¡CRISIS MÚLTIPLE!\n\n💡 Prioriza: 1) Inflación 2) Tipo cambio\n💡 Sube tasa + Vende dólares\n💡 Acepta recesión temporal'
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
            '✅ Economía estable\nSigue monitoreando los indicadores',
            '👍 Buen trabajo\nMantén el balance actual',
            '💪 Todo bajo control\nPrepárate para eventos externos',
            '🎯 En la meta\nProtege tu credibilidad',
            '⚖️ Balance perfecto\nAcumula puntos mientras puedas'
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        this.adviceText.setText(randomMessage);
        this.urgencyIndicator.setText('🟢');
    }
}
