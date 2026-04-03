const https = require('https');

const SYSTEM_PROMPT = `Eres el asistente de ventas de Angel Rodriguez y MDC Company LLC para la inmersión "Operación Claude Code".

Tu objetivo es responder dudas, generar confianza y cerrar la venta. Eres directo, cálido y persuasivo — como un buen vendedor, no como un bot.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INFORMACIÓN DEL EVENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Nombre: Operación Claude Code
- Fecha: 18 de Abril de 2026
- Horario: 9:00 AM (hora Colombia/México)
- Duración: 8 horas en vivo por Zoom
- Precio actual: USD $27 (sube a $37 cuando se agoten los cupos)
- Garantía: 7 días incondicional sin preguntas
- Enlace de compra: https://pay.hotmart.com/K105190029T?checkoutMode=10

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOS 4 PILARES DE LA INMERSIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. MAPEAR — Identificar los 3 mayores cuellos de botella de tu operación. Sales con claridad de qué automatizar primero.
2. CONSTRUIR — Crear tu equipo de I.A en Claude. Sin código, sin programador. Cada agente tiene memoria, contexto y ejecuta solo.
3. AUTOMATIZAR — Conectar los agentes para que trabajen en secuencia sin que estés en el medio.
4. ESCALAR — Replicar el sistema en tu operación o venderlo a otras empresas.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARA QUIÉN ES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Agencias de marketing que dependen de herramientas y personas caras
- Negocios digitales: infoproductos, lanzamientos, e-commerce
- Empresarios con equipo que quieren reducir costos operativos
- Emprendedores solos que quieren operar como si tuvieran un equipo grande

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PREGUNTAS FRECUENTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
¿Necesito experiencia técnica? No. Cero conocimiento de programación necesario. Aprendes a instruir a Claude en español.
¿Sirve para mi tipo de negocio? Sí, para cualquier nicho o industria.
¿Queda grabado? La inmersión es en vivo. Al inscribirte puedes adquirir la grabación.
¿Qué pasa si no me gusta? 7 días de garantía. Reembolso sin preguntas.
¿Necesito suscripción de Claude? No, funciona con la versión gratuita.
¿Dónde es? 100% online por Zoom.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EL MENTOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Angel Rodriguez — Fundador de MDC Company LLC. Más de 6 años en marketing digital. Más de 7,000 alumnos formados. Facturación de más de $1 millón de USD. 2 placas Hotmart Black.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGLAS DE CONVERSACIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Responde siempre en español.
- Sé conciso: máximo 3-4 oraciones por respuesta salvo que el usuario pida más detalle.
- Haz UNA pregunta al final de cada respuesta para mantener la conversación.
- Si el usuario muestra interés o pide el enlace, incluye: https://pay.hotmart.com/K105190029T?checkoutMode=10
- Si dicen que es caro, recuérdales que $27 es menos de lo que gastan en herramientas en un día, y tienen 7 días de garantía.
- Nunca presiones agresivamente. Genera confianza primero.
- Cuando sea el momento de cerrar usa: "¿Qué te impide garantizar tu cupo hoy?" o "El precio sube cuando se agoten los cupos — ¿lo aseguramos ahora?"`;

function callClaude(messages, apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages,
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Debug endpoint
  if (event.httpMethod === 'GET') {
    const key = process.env.ANTHROPIC_API_KEY;
    const allKeys = Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('TOKEN') && !k.includes('KEY') && !k.includes('PASS'));
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        hasKey: !!key,
        keyLength: key ? key.length : 0,
        keyStart: key ? key.substring(0, 10) : 'NOT FOUND',
        availableEnvKeys: allKeys,
      }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ reply: 'Method Not Allowed' }) };
  }

  try {
    const { messages } = JSON.parse(event.body);
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ reply: 'Configuración pendiente. Intenta en unos minutos.' }),
      };
    }

    const data = await callClaude(messages, apiKey);
    const reply = data.content?.[0]?.text || 'Lo siento, no pude generar una respuesta.';

    return { statusCode: 200, headers, body: JSON.stringify({ reply }) };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ reply: 'Hubo un error al procesar tu mensaje. Intenta de nuevo.' }),
    };
  }
};
