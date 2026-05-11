/**
 * MathBot - Bot de Telegram para practica de restas
 * Usa: Telegraf.js v4+
 * Instalar: npm install telegraf
 * Correr:   BOT_TOKEN=tu_token node bot.js
 */

const { Telegraf, Markup } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN || "TU_TOKEN_AQUI";
const bot = new Telegraf(BOT_TOKEN);

const CONFIG = {
  PUNTOS_CORRECTO: 10,
  PUNTOS_INCORRECTO: -5,
  MAX_ERRORES: 3,
  TIEMPO_LIMITE: 30,
  NIVELES: {
    facil:   { min: -10,  max: 10,  label: "Facil   (-10 a 10)"   },
    medio:   { min: -50,  max: 50,  label: "Medio   (-50 a 50)"   },
    dificil: { min: -100, max: 100, label: "Dificil (-100 a 100)" },
    custom:  { min: null, max: null, label: "Personalizado"        },
  },
};

function estadoInicial() {
  return {
    fase: "inicio",
    nivel: null,
    rango: { min: -10, max: 10 },
    preguntaActual: null,
    respuestaCorrecta: null,
    puntaje: 0,
    errores: 0,
    preguntasRespondidas: 0,
    aciertos: 0,
    timerHandle: null,
    historial: [],
  };
}

function numRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generarPregunta(rango) {
  const a = numRandom(rango.min, rango.max);
  const b = numRandom(rango.min, rango.max);
  return { texto: `${a} - ${b}`, resultado: a - b };
}

function barraVidas(errores, max) {
  const restantes = max - errores;
  return `Vidas: ${"[+]".repeat(restantes)}${"[ ]".repeat(errores)}`;
}

const sessions = {};
bot.use((ctx, next) => {
  const id = ctx.from?.id;
  if (!sessions[id]) sessions[id] = estadoInicial();
  ctx.state.juego = sessions[id];
  return next();
});

async function mostrarMenuNivel(ctx) {
  const j = ctx.state.juego;
  j.fase = "eligiendo_nivel";
  await ctx.reply(
    "*Selecciona el rango de numeros:*",
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback(CONFIG.NIVELES.facil.label,   "nivel_facil")],
        [Markup.button.callback(CONFIG.NIVELES.medio.label,   "nivel_medio")],
        [Markup.button.callback(CONFIG.NIVELES.dificil.label, "nivel_dificil")],
        [Markup.button.callback(CONFIG.NIVELES.custom.label,  "nivel_custom")],
      ]),
    }
  );
}

async function iniciarJuego(ctx) {
  const j = ctx.state.juego;
  j.fase = "jugando";
  j.puntaje = 0;
  j.errores = 0;
  j.preguntasRespondidas = 0;
  j.aciertos = 0;
  j.historial = [];

  await ctx.reply(
    `*Rango:* de *${j.rango.min}* a *${j.rango.max}*\n\n` +
    `Reglas:\n` +
    `- Correcta: *+${CONFIG.PUNTOS_CORRECTO} pts*\n` +
    `- Incorrecta: *${CONFIG.PUNTOS_INCORRECTO} pts*\n` +
    `- ${CONFIG.MAX_ERRORES} errores = fin de sesion\n` +
    `- *${CONFIG.TIEMPO_LIMITE}s* por pregunta\n\n` +
    `Comenzamos!`,
    { parse_mode: "Markdown" }
  );

  await enviarPregunta(ctx);
}

async function enviarPregunta(ctx) {
  const j = ctx.state.juego;
  if (j.timerHandle) clearTimeout(j.timerHandle);

  const { texto, resultado } = generarPregunta(j.rango);
  j.preguntaActual = texto;
  j.respuestaCorrecta = resultado;

  const opciones = new Set([resultado]);
  let tries = 0;
  while (opciones.size < 4 && tries++ < 50) {
    const off = numRandom(-15, 15);
    if (off !== 0) opciones.add(resultado + off);
  }
  const opcionesArr = [...opciones].sort(() => Math.random() - 0.5);
  j.opcionesActuales = opcionesArr;

  await ctx.reply(
    `${barraVidas(j.errores, CONFIG.MAX_ERRORES)}   Puntaje: *${j.puntaje}*\n\n` +
    `*Pregunta #${j.preguntasRespondidas + 1}*\n\n` +
    `\`\`\`\n  ${j.preguntaActual} = ?\n\`\`\`\n\n` +
    `Tienes *${CONFIG.TIEMPO_LIMITE} segundos*. Escribe el numero o usa los botones:`,
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(
        opcionesArr.map((op) => Markup.button.callback(`${op}`, `resp_${op}`)),
        { columns: 2 }
      ),
    }
  );

  j.timerHandle = setTimeout(async () => {
    if (j.fase !== "jugando") return;
    await procesarRespuesta(ctx, null, true);
  }, CONFIG.TIEMPO_LIMITE * 1000);
}

async function procesarRespuesta(ctx, respuestaUsuario, tiempoAgotado = false) {
  const j = ctx.state.juego;
  if (j.fase !== "jugando") return;
  if (j.timerHandle) clearTimeout(j.timerHandle);

  const correcta = !tiempoAgotado && respuestaUsuario === j.respuestaCorrecta;
  const puntos = correcta ? CONFIG.PUNTOS_CORRECTO : CONFIG.PUNTOS_INCORRECTO;

  j.puntaje += puntos;
  j.preguntasRespondidas++;
  if (correcta) j.aciertos++;
  else j.errores++;

  if (tiempoAgotado) {
    await ctx.reply(
      `Tiempo agotado. La respuesta era *${j.respuestaCorrecta}*\n` +
      `Errores: ${j.errores}/${CONFIG.MAX_ERRORES}  |  Puntaje: *${j.puntaje}*`,
      { parse_mode: "Markdown" }
    );
  } else if (correcta) {
    await ctx.reply(
      `Correcto! +${CONFIG.PUNTOS_CORRECTO} pts\nPuntaje: *${j.puntaje}*`,
      { parse_mode: "Markdown" }
    );
  } else {
    await ctx.reply(
      `Incorrecto. La respuesta era *${j.respuestaCorrecta}* (${CONFIG.PUNTOS_INCORRECTO} pts)\n` +
      `Errores: ${j.errores}/${CONFIG.MAX_ERRORES}  |  Puntaje: *${j.puntaje}*`,
      { parse_mode: "Markdown" }
    );
  }

  if (j.errores >= CONFIG.MAX_ERRORES) {
    await finalizarSesion(ctx);
  } else {
    await enviarPregunta(ctx);
  }
}

async function finalizarSesion(ctx) {
  const j = ctx.state.juego;
  j.fase = "fin";

  const precision = j.preguntasRespondidas > 0
    ? Math.round((j.aciertos / j.preguntasRespondidas) * 100)
    : 0;

  let medalla = "Bronce";
  if (precision >= 80) medalla = "Oro";
  else if (precision >= 50) medalla = "Plata";

  await ctx.reply(
    `━━━━━━━━━━━━━━━━━━━\n` +
    `*SESION FINALIZADA*\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `Medalla: *${medalla}*\n` +
    `Puntaje final: *${j.puntaje}*\n` +
    `Preguntas: ${j.preguntasRespondidas}\n` +
    `Aciertos: ${j.aciertos}   Errores: ${j.errores}\n` +
    `Precision: ${precision}%\n\n` +
    `Escribe /start para jugar de nuevo.`,
    { parse_mode: "Markdown" }
  );

  sessions[ctx.from.id] = estadoInicial();
}

// ── COMANDOS ────────────────────────────────────────────────────
bot.start(async (ctx) => {
  sessions[ctx.from.id] = estadoInicial();
  const nombre = ctx.from.first_name || "jugador";
  await ctx.reply(
    `*Bienvenido a MathBot, ${nombre}!*\n\n` +
    `Practica operaciones de *resta* con numeros positivos y negativos.\n\n` +
    `Comandos:\n` +
    `/jugar - Iniciar sesion\n` +
    `/ayuda - Ver instrucciones\n` +
    `/puntaje - Ver puntaje actual`,
    { parse_mode: "Markdown" }
  );
});

bot.command("jugar", async (ctx) => {
  sessions[ctx.from.id] = estadoInicial();
  await mostrarMenuNivel(ctx);
});

bot.command("ayuda", async (ctx) => {
  await ctx.reply(
    `*Instrucciones*\n\n` +
    `1. Usa /jugar para comenzar\n` +
    `2. Elige el rango de numeros\n` +
    `3. Responde cada resta escribiendo el numero o usando los botones\n` +
    `4. Tienes ${CONFIG.TIEMPO_LIMITE}s por pregunta\n` +
    `5. ${CONFIG.MAX_ERRORES} errores y la sesion termina\n\n` +
    `Puntuacion:\n` +
    `- Correcta: +${CONFIG.PUNTOS_CORRECTO} pts\n` +
    `- Incorrecta o tiempo agotado: ${CONFIG.PUNTOS_INCORRECTO} pts`,
    { parse_mode: "Markdown" }
  );
});

bot.command("puntaje", async (ctx) => {
  const j = ctx.state.juego;
  if (j.fase === "inicio" || j.fase === "fin") {
    await ctx.reply("No hay sesion activa. Usa /jugar para comenzar.");
  } else {
    await ctx.reply(
      `Puntaje actual: *${j.puntaje}*\n` +
      `Preguntas: ${j.preguntasRespondidas} | Errores: ${j.errores}/${CONFIG.MAX_ERRORES}`,
      { parse_mode: "Markdown" }
    );
  }
});

// ── CALLBACKS ───────────────────────────────────────────────────
bot.action("nivel_facil", async (ctx) => {
  const j = ctx.state.juego;
  j.nivel = "facil";
  j.rango = { min: CONFIG.NIVELES.facil.min, max: CONFIG.NIVELES.facil.max };
  await ctx.answerCbQuery();
  await iniciarJuego(ctx);
});

bot.action("nivel_medio", async (ctx) => {
  const j = ctx.state.juego;
  j.nivel = "medio";
  j.rango = { min: CONFIG.NIVELES.medio.min, max: CONFIG.NIVELES.medio.max };
  await ctx.answerCbQuery();
  await iniciarJuego(ctx);
});

bot.action("nivel_dificil", async (ctx) => {
  const j = ctx.state.juego;
  j.nivel = "dificil";
  j.rango = { min: CONFIG.NIVELES.dificil.min, max: CONFIG.NIVELES.dificil.max };
  await ctx.answerCbQuery();
  await iniciarJuego(ctx);
});

bot.action("nivel_custom", async (ctx) => {
  const j = ctx.state.juego;
  j.fase = "custom_min";
  await ctx.answerCbQuery();
  await ctx.reply(
    "*Rango personalizado*\n\nEscribe el numero *minimo* (puede ser negativo, ej: -50):",
    { parse_mode: "Markdown" }
  );
});

bot.action(/^resp_(-?\d+)$/, async (ctx) => {
  const j = ctx.state.juego;
  if (j.fase !== "jugando") return ctx.answerCbQuery("No hay pregunta activa.");
  const valor = parseInt(ctx.match[1], 10);
  await ctx.answerCbQuery();
  await procesarRespuesta(ctx, valor);
});

// ── TEXTO ───────────────────────────────────────────────────────
bot.on("text", async (ctx) => {
  const j = ctx.state.juego;
  const texto = ctx.message.text.trim();
  if (texto.startsWith("/")) return;

  if (j.fase === "custom_min") {
    const n = parseInt(texto, 10);
    if (isNaN(n)) return ctx.reply("Ingresa un numero entero valido (ej: -20, 5, 100).");
    j.rango.min = n;
    j.fase = "custom_max";
    return ctx.reply(`Minimo: *${n}*\n\nAhora escribe el numero *maximo*:`, { parse_mode: "Markdown" });
  }

  if (j.fase === "custom_max") {
    const n = parseInt(texto, 10);
    if (isNaN(n)) return ctx.reply("Ingresa un numero entero valido.");
    if (n <= j.rango.min) return ctx.reply(`El maximo debe ser mayor que el minimo (${j.rango.min}). Intenta de nuevo:`);
    j.rango.max = n;
    await ctx.reply(`Rango definido: *${j.rango.min}* a *${j.rango.max}*`, { parse_mode: "Markdown" });
    return iniciarJuego(ctx);
  }

  if (j.fase === "jugando") {
    const n = parseInt(texto, 10);
    if (isNaN(n)) return ctx.reply("Por favor escribe solo un numero entero.");
    await procesarRespuesta(ctx, n);
    return;
  }

  if (j.fase === "inicio" || j.fase === "fin") {
    await ctx.reply("Usa /jugar para comenzar una sesion.");
  }
});

// ── ARRANCAR ────────────────────────────────────────────────────
bot.launch().then(() => {
  console.log("MathBot iniciado correctamente.");
}).catch((err) => {
  console.error("Error al iniciar el bot:", err.message);
});

process.once("SIGINT",  () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
