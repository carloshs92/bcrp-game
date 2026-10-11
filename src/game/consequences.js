/**
 * Cartas de consecuencia: lo que decidiste hace unos turnos te alcanza. Sin DOM ni azar
 * (solo anota en `m.consequenceCooldown` qué cartas ya salieron).
 *
 * Cada regla mira los turnos ya jugados (`m.records`) con rezago, porque la tasa tarda en hacer
 * efecto: en meses, las decisiones de hace 2 a 4 meses; en trimestres, las de hace 1 a 2.
 * Solo mueven la confianza ciudadana y el enojo del Congreso, nunca el modelo macro, para no
 * alterar la calibración de los capítulos. Sale como mucho una carta por turno.
 *
 * Una carta: { id, who, title, text, effect: { trust, pressure }, tone: 'good' | 'bad' }.
 * `who` es un personaje del elenco (game/cast.js).
 */

export const CONSEQUENCE_RULES = { cooldown: 3 };

/** Turnos de rezago que se miran: [desde, hasta] turnos atrás. */
function lagWindow(m) {
    return m.steps === 1 ? [2, 4] : [1, 2];
}

/** Registros dentro de la ventana de rezago, con cuántos turnos atrás fue cada uno. */
function lagged(m) {
    const [from, to] = lagWindow(m);
    const n = m.records.length;
    const out = [];
    for (let back = from; back <= to; back++) {
        const r = m.records[n - 1 - back];
        if (r) out.push({ ...r, back: back + 1 });
    }
    return out;
}

const ago = (m, back) => `Hace ${back} ${m.unitWord(back)}`;

const RULES = [
    {
        id: 'mypes-cierran', who: 'kevin', tone: 'bad', effect: { trust: -5, pressure: 4 },
        test: (m, win, last) => {
            const hikes = win.filter(r => r.move > 0);
            const total = hikes.reduce((a, r) => a + r.move, 0);
            if (total < 0.75 || last.state.growth >= m.params.potentialGrowth - 0.5) return null;
            const back = Math.max(...hikes.map(r => r.back));
            return {
                title: 'Cierran mypes en Gamarra',
                text: `${ago(m, back)} subiste la tasa ${Math.round(total * 100)} pb. Ahora mi cuota subió, las ventas no levantan y dos talleres de mi galería cerraron.`
            };
        }
    },
    {
        id: 'remarcan', who: 'rosa', tone: 'bad', effect: { trust: -5, pressure: 2 },
        test: (m, win, last) => {
            const cuts = win.filter(r => r.move < 0);
            const total = -cuts.reduce((a, r) => a + r.move, 0);
            if (total < 0.5 || last.state.inflation <= m.params.bandMax) return null;
            const back = Math.max(...cuts.map(r => r.back));
            return {
                title: 'Los bodegueros remarcan',
                text: `${ago(m, back)} bajaron la tasa y la plata corrió. Ahora el pollo, el arroz y el aceite cuestan más cada semana, hijito.`
            };
        }
    },
    {
        id: 'reservas-alerta', who: 'valeria', tone: 'bad', effect: { trust: -3, pressure: 3 },
        test: m => {
            if (!m.fx || m.reserveShare() > 0.45) return null;
            return {
                title: 'Una calificadora mira tus reservas',
                text: `Vendiste muchos dólares y las reservas que puedes usar bajaron a ${Math.round(m.reserveShare() * 100)}%. Mis clientes de afuera ya me preguntan si el Perú aguanta otro golpe.`
            };
        }
    },
    {
        id: 'palabra-rota', who: 'feed', tone: 'bad', effect: { trust: -4, pressure: 2 },
        test: (m, win, last) => last.notes?.some(n => n.text.startsWith('Tu comunicado anterior')) ? {
            title: '#ElBCRDijo es tendencia',
            text: 'Las redes comparan tu comunicado con lo que hiciste. Los memes no perdonan: «dijo una cosa e hizo otra».'
        } : null
    },
    {
        id: 'promesa-rota', who: 'congresista', tone: 'bad', effect: { trust: -3, pressure: 5 },
        test: (m, win, last) => last.notes?.some(n => n.text.startsWith('Rompiste tu promesa')) ? {
            title: '«El BCR le mintió al Congreso»',
            text: 'Lo dijo en la sesión y lo repite en cada entrevista: prometiste no subir la tasa y la subiste.'
        } : null
    },
    {
        id: 'encaje-queja', who: 'kevin', tone: 'bad', effect: { trust: -2, pressure: 2 },
        test: (m, win) => win.some(r => r.tool === 'encaje-sube' || r.tool === 'encaje-dolares') ? {
            title: 'El banco me negó el préstamo',
            text: 'Me dijeron que ahora deben guardar más plata en el BCR por el encaje. Justo cuando iba a comprar otra máquina.'
        } : null
    },
    {
        id: 'precios-calman', who: 'rosa', tone: 'good', effect: { trust: 6, pressure: -2 },
        test: (m, win, last) => {
            const before = m.records.at(-2);
            if (!before || before.state.inflation <= m.params.bandMax || last.state.inflation > m.params.bandMax) return null;
            return {
                title: '¡Por fin bajó el limón!',
                text: 'Esta semana el mercado estuvo tranquilo: el pollo no subió y el limón bajó. Así sí se puede, caserito.'
            };
        }
    },
    {
        id: 'credito-fluye', who: 'kevin', tone: 'good', effect: { trust: 4, pressure: -2 },
        test: (m, win, last) => {
            const cuts = win.filter(r => r.move < 0);
            if (!cuts.length || last.state.growth < m.params.potentialGrowth || last.state.inflation > m.params.bandMax) return null;
            const back = Math.max(...cuts.map(r => r.back));
            return {
                title: 'Contraté a dos chicos',
                text: `${ago(m, back)} bajaron la tasa. La caja municipal me prestó más barato, compré otra remalladora y ya somos cinco en el taller.`
            };
        }
    },
    {
        id: 'dolar-quieto', who: 'valeria', tone: 'good', effect: { trust: 3 },
        test: (m, win, last) => m.fx && last.fx && Math.abs(last.fx.dep) < 0.6 && win.some(r => r.fx && Math.abs(r.fx.dep) > 2) ? {
            title: 'Cerré un contrato a un año',
            text: 'Con el dólar tranquilo, por fin pude fijar precios con mi cliente de Rotterdam. Sin sustos cambiarios se puede planificar.'
        } : null
    },
    {
        id: 'racha-meta', who: 'feed', tone: 'good', effect: { trust: 4 },
        test: m => m.streak > 0 && m.streak % 4 === 0 ? {
            title: '#SolFirme es tendencia',
            text: `${m.streak} ${m.unitWord(m.streak)} seguidos con la inflación en la meta. En redes ya hay quien pide tu foto en los billetes.`
        } : null
    }
];

/** Cartas que deja el turno recién jugado (como mucho una). */
export function consequenceCards(m) {
    const last = m.records.at(-1);
    if (!last) return [];
    const win = lagged(m);
    const turn = m.records.length;
    m.consequenceCooldown ??= {};
    for (const rule of RULES) {
        if ((m.consequenceCooldown[rule.id] ?? -99) > turn - CONSEQUENCE_RULES.cooldown) continue;
        const card = rule.test(m, win, last);
        if (card) {
            m.consequenceCooldown[rule.id] = turn;
            return [{ id: rule.id, who: rule.who, tone: rule.tone, effect: rule.effect, ...card }];
        }
    }
    return [];
}

export const CONSEQUENCE_IDS = RULES.map(r => r.id);
