// Égida Jurídica — demo de rediseño: animaciones ligadas al scroll e interacciones
(() => {
  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const limitar = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

  // Entrada de la portada (título y arco que sube)
  requestAnimationFrame(() => setTimeout(() => document.body.classList.add("cargada"), 120));

  /* ── Medallas de laurel ────────────────────────────── */
  const NS = "http://www.w3.org/2000/svg";
  $$(".medalla__laurel").forEach((svg) => {
    const cx = 50;
    const cy = 50;
    const r = 40;
    const rama = (desde, hasta, signo) => {
      const pasos = 7;
      for (let i = 0; i < pasos; i++) {
        const t = desde + ((hasta - desde) * (i + 0.5)) / pasos;
        const x = cx + r * Math.cos((t * Math.PI) / 180);
        const y = cy + r * Math.sin((t * Math.PI) / 180);
        const hoja = document.createElementNS(NS, "path");
        hoja.setAttribute("d", "M0 0C3-2.6 7.5-2.6 10.5 0C7.5 2.6 3 2.6 0 0Z");
        hoja.setAttribute("transform", `translate(${x} ${y}) rotate(${t + 90 * signo - 35 * signo})`);
        svg.appendChild(hoja);
      }
    };
    rama(100, 245, 1);
    rama(80, -65, -1);
  });

  /* ── Encabezado y menú ─────────────────────────────── */
  const header = $("#header");
  const hamburguesa = $(".hamburguesa");
  const alternarMenu = (abrir) => {
    document.body.classList.toggle("menu-abierto", abrir);
    document.body.classList.toggle("sin-scroll", abrir);
    hamburguesa.setAttribute("aria-expanded", String(abrir));
    hamburguesa.setAttribute("aria-label", abrir ? "Cerrar menú" : "Abrir menú");
  };
  hamburguesa.addEventListener("click", () => alternarMenu(!document.body.classList.contains("menu-abierto")));
  $$(".menu-movil a").forEach((a) => a.addEventListener("click", () => alternarMenu(false)));
  document.addEventListener("keydown", (e) => e.key === "Escape" && alternarMenu(false));

  const enlacesNav = $$(".nav a");
  const espia = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        const id = e.target.id === "fundador" ? "equipo" : e.target.id;
        enlacesNav.forEach((a) => a.classList.toggle("activo", a.getAttribute("href") === `#${id}`));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  $$("main section[id]").forEach((s) => espia.observe(s));

  /* ── Carrusel de piezas del manual: avanza solo, flechas, puntos y deslizar ── */
  const carrusel = $("[data-carrusel]");
  if (carrusel) {
    const pistaC = $("[data-pista]", carrusel);
    const piezas = $$(".pieza", pistaC);
    const puntos = $("[data-puntos]", carrusel);
    let actual = 0;
    let temporizador;
    piezas.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `Ver pieza ${i + 1}`);
      b.addEventListener("click", () => ir(i, true));
      puntos.appendChild(b);
    });
    const marcar = () => $$("button", puntos).forEach((b, i) => b.classList.toggle("activo", i === actual));
    const ir = (i, manual) => {
      actual = (i + piezas.length) % piezas.length;
      const destino = piezas[actual].offsetLeft - pistaC.offsetLeft - (pistaC.clientWidth - piezas[actual].offsetWidth) / 2;
      pistaC.scrollTo({ left: destino, behavior: reducido ? "auto" : "smooth" });
      marcar();
      if (manual) reiniciar();
    };
    const reiniciar = () => {
      clearInterval(temporizador);
      if (!reducido) temporizador = setInterval(() => ir(actual + 1), 4200);
    };
    $$("[data-mover]", carrusel).forEach((b) => b.addEventListener("click", () => ir(actual + Number(b.dataset.mover), true)));
    // al deslizar con el dedo o el trackpad, el punto sigue a la pieza más centrada
    let espera;
    pistaC.addEventListener("scroll", () => {
      clearTimeout(espera);
      espera = setTimeout(() => {
        const centro = pistaC.scrollLeft + pistaC.clientWidth / 2;
        let mejor = 0;
        piezas.forEach((p, i) => {
          const c = p.offsetLeft - pistaC.offsetLeft + p.offsetWidth / 2;
          const m = piezas[mejor].offsetLeft - pistaC.offsetLeft + piezas[mejor].offsetWidth / 2;
          if (Math.abs(c - centro) < Math.abs(m - centro)) mejor = i;
        });
        actual = mejor;
        marcar();
      }, 120);
    }, { passive: true });
    carrusel.addEventListener("mouseenter", () => clearInterval(temporizador));
    carrusel.addEventListener("mouseleave", reiniciar);
    carrusel.addEventListener("focusin", () => clearInterval(temporizador));
    marcar();
    reiniciar();
  }

  /* ── Portada: la estatua ocupa solo el espacio libre bajo el texto ── */
  const textoHero = $(".hero__texto");
  const medirPortada = () => {
    const alto = window.innerHeight;
    // Bajo del texto (incluido el botón) + un margen; nunca menos del 30 % de pantalla para la estatua
    // La estatua sube hasta la mitad del texto: su borde superior se funde, así que el título sigue legible
    const fin = Math.min(textoHero.offsetTop + textoHero.offsetHeight - 40, alto * 0.6);
    hero.style.setProperty("--texto-fin", `${fin}px`);
    hero.style.setProperty("--estatua-w", `${Math.min(window.innerWidth * 0.94, (alto - fin) * 1.45)}px`);
  };

  /* ── Bucle de scroll: portada, texto, anillo ───────── */
  const hero = $(".hero");
  let pendiente = false;

  const actualizar = () => {
    pendiente = false;
    const y = window.scrollY;
    const alto = window.innerHeight;
    header.classList.toggle("con-fondo", y > 40);

    // Portada: el arco con la estatua crece hasta llenar la pantalla
    const recorrido = hero.offsetHeight - alto;
    const p = reducido ? 0 : limitar((y - hero.offsetTop) / recorrido);
    hero.style.setProperty("--p", p.toFixed(4));
  };

  const alHacerScroll = () => {
    if (!pendiente) {
      pendiente = true;
      requestAnimationFrame(actualizar);
    }
  };
  window.addEventListener("scroll", alHacerScroll, { passive: true });
  window.addEventListener("resize", () => {
    medirPortada();
    alHacerScroll();
  });
  medirPortada();
  document.fonts?.ready.then(medirPortada);
  actualizar();

  /* ── Aparición de bloques ──────────────────────────── */
  const revelador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("visible");
        revelador.unobserve(e.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );
  $$("[data-revelar]").forEach((el) => revelador.observe(el));

  /* Un temporizador que solo corre mientras el bloque se ve en pantalla */
  const alVerse = (el, alEntrar, alSalir) =>
    new IntersectionObserver(([e]) => (e.isIntersecting ? alEntrar() : alSalir()), { threshold: 0.3 }).observe(el);

  /* ── Esencia: pestañas Misión / Visión que rotan ─────── */
  const pestanas = $("[data-pestanas]");
  if (pestanas) {
    const botones = $$("button", pestanas);
    const vistas = botones.map((b) => document.getElementById(b.getAttribute("aria-controls")));
    let i = 0;
    let t;
    const CICLO = 6000;
    pestanas.style.setProperty("--ciclo", `${CICLO}ms`);
    const mostrar = (n) => {
      i = n % botones.length;
      botones.forEach((b, k) => {
        b.setAttribute("aria-selected", String(k === i));
        // reinicia la barra de progreso
        const barra = $("i", b);
        barra.style.animation = "none";
        void barra.offsetWidth;
        barra.style.animation = "";
        vistas[k].classList.toggle("activa", k === i);
        vistas[k].hidden = k !== i;
      });
    };
    const correr = () => {
      clearInterval(t);
      if (!reducido) t = setInterval(() => mostrar(i + 1), CICLO);
    };
    botones.forEach((b, k) => b.addEventListener("click", () => { mostrar(k); correr(); }));
    const panel = $(".esencia2__panel");
    [pestanas, panel].forEach((el) => {
      el.addEventListener("mouseenter", () => { clearInterval(t); pestanas.classList.add("pausa"); });
      el.addEventListener("mouseleave", () => { pestanas.classList.remove("pausa"); mostrar(i); correr(); });
    });
    alVerse(panel, () => { mostrar(i); correr(); }, () => clearInterval(t));
  }

  /* ── Pilares: el panel activo se expande; rota solo ──── */
  const acordeon = $("[data-acordeon]");
  if (acordeon) {
    const hojas = $$(".hoja", acordeon);
    let i = 0;
    let t;
    const activar = (n) => {
      i = n % hojas.length;
      hojas.forEach((h, k) => h.classList.toggle("activa", k === i));
    };
    const correr = () => {
      clearInterval(t);
      if (!reducido) t = setInterval(() => activar(i + 1), 4200);
    };
    hojas.forEach((h, k) => {
      h.addEventListener("mouseenter", () => { clearInterval(t); activar(k); });
      h.addEventListener("focus", () => { clearInterval(t); activar(k); });
      h.addEventListener("click", () => activar(k));
    });
    acordeon.addEventListener("mouseleave", correr);
    alVerse(acordeon, correr, () => clearInterval(t));
  }

  /* ── Equipo: miembro destacado que cambia solo ───────── */
  const plantel = $("[data-plantel]");
  if (plantel) {
    const minis = $$(".mini", plantel);
    const dest = $(".destacado", plantel);
    const foto = $("[data-d-foto]", plantel);
    const barra = $("[data-d-barra]", plantel);
    let i = 0;
    let t;
    const pintar = (n, animar = true) => {
      i = (n + minis.length) % minis.length;
      const m = minis[i];
      minis.forEach((x, k) => x.classList.toggle("activa", k === i));
      const aplicar = () => {
        foto.src = m.dataset.foto;
        foto.alt = `Fotografía de ${m.dataset.nombre}`;
        $("[data-d-nombre]", plantel).textContent = m.dataset.nombre;
        $("[data-d-cargo]", plantel).textContent = m.dataset.cargo;
        $("[data-d-num]", plantel).textContent = `${String(i + 1).padStart(2, "0")} / ${String(minis.length).padStart(2, "0")}`;
        const lista = $("[data-d-areas]", plantel);
        lista.innerHTML = "";
        m.dataset.areas.split("|").forEach((a) => {
          const li = document.createElement("li");
          li.textContent = a;
          lista.appendChild(li);
        });
        dest.classList.remove("cambiando");
      };
      const numGrande = $("[data-d-numgrande]", plantel);
      const aplicarTodo = () => {
        aplicar();
        if (numGrande) numGrande.textContent = String(i + 1).padStart(2, "0");
      };
      if (animar && !reducido) {
        // la cortina cobre barre la foto y, a mitad del barrido, cambia la persona
        dest.classList.remove("barre");
        void dest.offsetWidth;
        dest.classList.add("barre", "cambiando");
        setTimeout(aplicarTodo, 420);
        setTimeout(() => dest.classList.remove("barre"), 950);
      } else aplicarTodo();
      barra.classList.remove("corre");
      void barra.offsetWidth;
      if (!reducido) barra.classList.add("corre");
    };
    const correr = () => {
      clearInterval(t);
      if (!reducido) t = setInterval(() => pintar(i + 1), 4500);
    };
    minis.forEach((m, k) => m.addEventListener("click", () => { pintar(k); correr(); }));
    plantel.addEventListener("mouseenter", () => { clearInterval(t); plantel.classList.add("pausa"); });
    plantel.addEventListener("mouseleave", () => { plantel.classList.remove("pausa"); pintar(i, false); correr(); });
    pintar(0, false);
    alVerse(plantel, () => { pintar(i, false); correr(); }, () => clearInterval(t));
  }

  /* ── Equipo: miniaturas escalonadas y con inclinación 3D al pasar el mouse ── */
  $$(".mini").forEach((m, k) => {
    m.style.setProperty("--i", k);
    if (reducido) return;
    m.addEventListener("pointermove", (e) => {
      const r = m.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      m.classList.add("inclinada");
      m.style.setProperty("--ry", `${(x - 0.5) * 14}deg`);
      m.style.setProperty("--rx", `${(0.5 - y) * 14}deg`);
      m.style.setProperty("--gx", `${x * 100}%`);
      m.style.setProperty("--gy", `${y * 100}%`);
    });
    m.addEventListener("pointerleave", () => m.classList.remove("inclinada"));
  });

  /* ── Concepto: mazo de piezas del manual que se baraja solo ── */
  const mazo = $("[data-mazo]");
  if (mazo) {
    const cartas = $$(".mazo__carta", mazo);
    const puntosM = $("[data-mazo-puntos]", mazo);
    let orden = cartas.map((_, k) => k); // orden[0] = la de arriba
    let t;
    let ocupado = false;
    const pintarM = () => {
      orden.forEach((c, n) => {
        cartas[c].style.setProperty("--n", n);
        cartas[c].classList.toggle("arriba", n === 0);
        cartas[c].setAttribute("aria-hidden", String(n !== 0));
      });
      $$("button", puntosM).forEach((b, k) => b.classList.toggle("activo", k === orden[0]));
    };
    cartas.forEach((_, k) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `Ver pieza ${k + 1}`);
      b.addEventListener("click", () => irA(k));
      puntosM.appendChild(b);
    });
    const avanzar = (dir = 1) => {
      if (ocupado) return;
      if (dir < 0 || reducido) {
        orden = dir < 0 ? [orden[orden.length - 1], ...orden.slice(0, -1)] : [...orden.slice(1), orden[0]];
        pintarM();
        return;
      }
      ocupado = true;
      const arriba = cartas[orden[0]];
      arriba.classList.add("sale");
      setTimeout(() => {
        orden = [...orden.slice(1), orden[0]];
        arriba.classList.remove("sale");
        pintarM();
        ocupado = false;
      }, 650);
    };
    const irA = (k) => {
      while (orden[0] !== k) orden = [...orden.slice(1), orden[0]];
      pintarM();
      correrM();
    };
    const correrM = () => {
      clearInterval(t);
      if (!reducido) t = setInterval(() => avanzar(1), 4000);
    };
    cartas.forEach((c) => c.addEventListener("click", () => { avanzar(1); correrM(); }));
    $$("[data-mazo-mover]", mazo).forEach((b) =>
      b.addEventListener("click", () => { avanzar(Number(b.dataset.mazoMover)); correrM(); }),
    );
    mazo.addEventListener("mouseenter", () => clearInterval(t));
    mazo.addEventListener("mouseleave", correrM);
    pintarM();
    alVerse(mazo, correrM, () => clearInterval(t));
  }

  /* ── Fundador: entra en escena una sola vez al aparecer en pantalla ── */
  const escena = $("[data-escena]");
  if (escena) {
    const entrar = () => {
      escena.classList.add("en-escena");
      setTimeout(() => escena.classList.add("listo"), 3000);
    };
    if (reducido) entrar();
    else {
      const obs = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return;
          entrar();
          obs.disconnect();
        },
        { threshold: 0.28 },
      );
      obs.observe(escena);
    }
  }

  /* ── Fundador: el marco y la marca de fondo se mueven con el scroll ── */
  const fundador = $(".fundador3") || $(".fundador2");
  if (fundador && !reducido) {
    const mover = () => {
      const r = fundador.getBoundingClientRect();
      const avance = limitar((window.innerHeight - r.top) / (window.innerHeight + r.height));
      fundador.style.setProperty("--avance", (avance * 2 - 1).toFixed(3));
    };
    window.addEventListener("scroll", () => requestAnimationFrame(mover), { passive: true });
    mover();
  }

  /* ── Fundador 4: la frase entra palabra por palabra y el +20 cuenta ── */
  const escena4 = $("[data-escena4]");
  if (escena4) {
    const frase = $("[data-palabras4]", escena4);
    const clavesF = new Set(["causa", "propia."]);
    const palabrasF = frase.textContent.trim().split(/\s+/);
    frase.textContent = "";
    palabrasF.forEach((p, k) => {
      const s = document.createElement("span");
      s.className = `p4${clavesF.has(p.toLowerCase()) ? " clave" : ""}`;
      s.style.setProperty("--w", k);
      s.textContent = p;
      frase.append(s, k < palabrasF.length - 1 ? " " : "");
    });
    const contar = () =>
      $$("[data-contar]", escena4).forEach((el) => {
        const fin = Number(el.dataset.contar);
        if (reducido) return (el.textContent = `+${fin}`);
        const t0 = performance.now() + 1300;
        const paso = (t) => {
          const p = limitar((t - t0) / 1400);
          el.textContent = `+${Math.round(fin * (1 - Math.pow(1 - p, 3)))}`;
          if (p < 1) requestAnimationFrame(paso);
        };
        requestAnimationFrame(paso);
      });
    const entrar4 = () => {
      escena4.classList.add("en-escena");
      contar();
    };
    if (reducido) entrar4();
    else {
      const obs4 = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return;
          entrar4();
          obs4.disconnect();
        },
        { threshold: 0.3 },
      );
      obs4.observe(escena4);
    }
  }

  /* ── Equipo 4: cinta de retratos que avanza sola ────── */
  const pistaCinta = $("[data-cinta-pista]");
  if (pistaCinta) {
    // [foto (sin foto: null), nombre, cargo, áreas]. Datos actualizados por el cliente el 16/11/2026.
    const EQUIPO = [
      ["rafael-mallqui", "Rafael Mallqui López", "Abogado", ["Derecho laboral", "Derecho empresarial"]],
      ["stefanny-pretell", "Stefanny Pretell Castro", "Abogada", ["Derecho empresarial"]],
      ["carlos-canchumanya", "Carlos Canchumanya Camargo", "Abogado", ["Derecho bancario y financiero", "Derecho patrimonial"]],
      ["alfredo-freyre", "Alfredo Freyre Lira", "Abogado", ["Derecho laboral", "Derecho corporativo"]],
      ["massiel-picho", "Massiel Picho Santivañez", "Abogada", ["Derecho laboral", "Procedimiento disciplinario laboral público y privado"]],
      ["nataly-lazaro", "Nataly Lázaro Blas", "Abogada", ["Derecho laboral", "Derecho administrativo económico"]],
      ["jennyfer-chuman", "Jennyfer Chumán Aguirre", "Abogada", ["Derecho de familia", "Derecho civil"]],
      ["yessica-carrasco", "Yessica Carrasco Muñoz", "Abogada", ["Derecho laboral", "Litigación judicial"]],
      ["ivan-mora", "Iván Mora", "Abogado", ["Derecho empresarial", "Prevención de riesgos laborales"]],
      ["olga", "Olga", "Abogada", ["Derecho tributario", "Comunicación corporativa"]],
    ];
    const iniciales = (n) =>
      n
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase();
    const tarjeta = ([foto, nombre, cargo, areas], k, copia) => {
      const a = document.createElement("a");
      a.className = "perfil";
      a.href = "#contacto";
      if (copia) {
        a.setAttribute("aria-hidden", "true");
        a.tabIndex = -1;
      }
      if (!foto) a.classList.add("perfil--sinfoto");
      const media = foto
        ? `<img src="img/equipo/${foto}.jpg" alt="" decoding="async" />` // sin lazy: en la cinta que se mueve no llegan a cargar
        : `<span class="perfil__monograma" aria-hidden="true">${iniciales(nombre)}</span>`;
      a.innerHTML = `${media}<span class="perfil__num">${String(k + 1).padStart(2, "0")}</span><div class="perfil__info"><h3></h3><p></p><ul class="perfil__areas"></ul><span class="perfil__accion">Agenda una consulta <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 17 17 7M8 7h9v9" /></svg></span></div>`;
      if (foto) $("img", a).alt = copia ? "" : `Fotografía de ${nombre}`;
      else if (!copia) a.setAttribute("aria-label", `${nombre}, ${cargo}`);
      $("h3", a).textContent = nombre;
      $(".perfil__info > p", a).textContent = cargo;
      areas.forEach((x) => {
        const li = document.createElement("li");
        li.textContent = x;
        $(".perfil__areas", a).appendChild(li);
      });
      return a;
    };
    // dos copias seguidas para que la cinta dé la vuelta sin saltos
    [false, true].forEach((copia) => EQUIPO.forEach((m, k) => pistaCinta.appendChild(tarjeta(m, k, copia))));
    pistaCinta.style.setProperty("--duracion", `${EQUIPO.length * 6}s`);
    // parte visible de cada tarjeta cerrada: nombre (1 o 2 líneas) + cargo
    const medirPerfiles = () =>
      $$(".perfil", pistaCinta).forEach((p) => {
        const h3 = $("h3", p);
        const cargo = $(".perfil__info > p", p);
        p.style.setProperty("--v", `${h3.offsetHeight + cargo.offsetHeight + 30}px`);
      });
    medirPerfiles();
    document.fonts?.ready.then(medirPerfiles);
    window.addEventListener("resize", medirPerfiles);
    const total = $("[data-equipo-total]");
    if (total) total.textContent = EQUIPO.length;
  }

  /* ── Servicios: elegir el área en el formulario ────── */
  $$("[data-servicio]").forEach((tarjeta) =>
    tarjeta.addEventListener("click", () => {
      const opcion = $(`.opciones input[value="${tarjeta.dataset.servicio}"]`);
      if (opcion) opcion.checked = true;
    }),
  );

  /* ── Equipo: en táctiles, tocar muestra a color ────── */
  $$("figure.miembro").forEach((m) =>
    m.addEventListener("click", () => {
      const activo = !m.classList.contains("activo");
      $$("figure.miembro").forEach((o) => o.classList.remove("activo"));
      m.classList.toggle("activo", activo);
    }),
  );

  /* ── Testimonios (los de la web actual) ────────────── */
  const testimonios = [
    ["Carlos M.", "Desde el primer contacto recibí un trato muy profesional y cercano. Me explicaron con claridad las opciones legales que tenía y me acompañaron durante todo el proceso."],
    ["Laura G.", "Lo que más valoro de su trabajo es la seriedad y el rigor con el que analizan cada situación. No prometen soluciones rápidas, sino estrategias realistas y bien fundamentadas."],
    ["Michael Zarate", "Destaco su rigor jurídico y la tranquilidad que transmiten durante todo el proceso. Un equipo serio y comprometido con su trabajo."],
    ["Daniel T.", "Valoro mucho la transparencia con la que trabajaron mi caso. En todo momento supe en qué punto estaba el procedimiento y qué pasos se iban a dar a continuación."],
    ["Samantha Rodriguez", "Gracias a su asesoramiento pude tomar decisiones importantes con seguridad. Comunicación directa y soluciones bien planteadas."],
    ["Javier S.", "Destaco especialmente su compromiso y su capacidad para ofrecer soluciones claras en situaciones complejas. Es un equipo serio, accesible y muy bien preparado."],
    ["María R.", "El equipo mostró una gran capacidad para entender mi situación y ofrecer una estrategia adaptada a mis necesidades. Su trato fue cercano y profesional."],
    ["Erick Ortiz", "Un despacho en el que se nota la experiencia. Analizaron mi caso con detalle y me ofrecieron una estrategia clara desde el inicio."],
    ["Pablo C.", "Me sentí acompañado y bien asesorado desde el inicio hasta el final. Supieron explicarme aspectos legales complejos de forma sencilla."],
    ["Elena V.", "Recomiendo este despacho por su seriedad, su compromiso y la forma clara en la que trabajan. Gracias a su apoyo pude afrontar un problema legal importante con mayor seguridad."],
  ];

  const carril = $("[data-testimonios]");
  testimonios.forEach(([autor, texto]) => {
    const tarjeta = document.createElement("blockquote");
    tarjeta.className = "testimonio";
    tarjeta.innerHTML = `<span class="testimonio__estrellas" aria-label="5 de 5 estrellas">★★★★★</span><p></p><cite><b></b><span></span></cite>`;
    $("p", tarjeta).textContent = `“${texto}”`;
    $("cite b", tarjeta).textContent = autor
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2);
    $("cite span", tarjeta).textContent = autor;
    carril.appendChild(tarjeta);
  });

  $$(".flecha[data-dir]").forEach((f) =>
    f.addEventListener("click", () => {
      const ancho = $(".testimonio", carril).offsetWidth + 18;
      carril.scrollBy({ left: ancho * Number(f.dataset.dir), behavior: reducido ? "auto" : "smooth" });
    }),
  );

  /* ── Formulario → WhatsApp ─────────────────────────── */
  const formulario = $("#formulario");
  const validar = (campo, ok) => {
    campo.closest(".campo").classList.toggle("error", !ok);
    return ok;
  };

  formulario.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = $("#nombre");
    const telefono = $("#telefono");
    const mensaje = $("#mensaje");
    const valido = [
      validar(nombre, nombre.value.trim().length >= 2),
      validar(telefono, /^[+\d\s()-]{7,}$/.test(telefono.value.trim())),
      validar(mensaje, mensaje.value.trim().length >= 10),
    ].every(Boolean);
    if (!valido) {
      $(".campo.error input, .campo.error textarea", formulario)?.focus();
      return;
    }
    const area = $(".opciones input:checked").value;
    const texto = [
      "Hola, Égida Jurídica. Quisiera agendar una consulta.",
      `• Nombre: ${nombre.value.trim()}`,
      `• Teléfono: ${telefono.value.trim()}`,
      `• Área: ${area}`,
      `• Caso: ${mensaje.value.trim()}`,
    ].join("\n");
    window.open(`https://wa.me/51964943865?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
    formulario.classList.add("enviado");
    formulario.reset();
  });

  $$("input, textarea", formulario).forEach((c) =>
    c.addEventListener("input", () => c.closest(".campo")?.classList.remove("error")),
  );

  $("#anio").textContent = new Date().getFullYear();
})();
