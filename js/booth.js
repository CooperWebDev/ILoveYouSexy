/* =====================================================================
   Photo booth (camera) and "Say it out loud" (microphone).
   Everything stays on her device — nothing is uploaded anywhere.
   ===================================================================== */

/* ---------- photo booth ---------- */
(function photoBooth() {
  const screen = $("#boothScreen");
  if (!screen) return;
  const video = $("#boothVideo"), fxCv = $("#boothFx"), fx2 = fxCv.getContext("2d");
  const off = $("#boothOff"), camBtn = $("#camBtn"), camMsg = $("#camMsg"), snapBtn = $("#snapBtn"), countEl = $("#boothCount");
  const result = $("#boothResult"), img = $("#boothImg"), saveBtn = $("#saveBtn");
  const FRAMES = [
    { id: "hearts", label: T("hearts") }, { id: "bunny", label: T("bunny") },
    { id: "orchid", label: T("orchids") }, { id: "stage", label: T("concert") },
  ];
  let frame = "hearts", stream = null, busy = false;

  FRAMES.forEach((f) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "bf" + (f.id === frame ? " on" : ""); b.textContent = f.label;
    b.addEventListener("click", () => {
      frame = f.id;
      [...$("#boothFrames").children].forEach((x) => x.classList.toggle("on", x === b));
    });
    $("#boothFrames").appendChild(b);
  });

  function emoji(c, ch, x, y, size, rot = 0) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.font = `${size}px serif`; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(ch, 0, 0); c.restore();
  }
  /* draws the chosen frame on top of the picture (used live AND in the saved photo) */
  function drawFrame(c, w, h, t, which) {
    const u = Math.min(w, h) / 400;
    if (which === "hearts") {
      c.strokeStyle = "rgba(255,156,194,.9)"; c.lineWidth = 12 * u; c.strokeRect(6 * u, 6 * u, w - 12 * u, h - 12 * u);
      const n = 26, per = 2 * (w + h);
      for (let i = 0; i < n; i++) {
        let s = ((i / n + t * 0.02) % 1) * per, x, y;
        if (s < w) { x = s; y = 14 * u; } else if ((s -= w) < h) { x = w - 14 * u; y = s; }
        else if ((s -= h) < w) { x = w - s; y = h - 14 * u; } else { x = 14 * u; y = h - (s - w); }
        emoji(c, i % 3 ? "💗" : "💖", x, y, (22 + 6 * Math.sin(t * 3 + i)) * u);
      }
    } else if (which === "bunny") {
      c.fillStyle = "rgba(255,255,255,.95)"; c.strokeStyle = "#ffb3d1"; c.lineWidth = 4 * u;
      [[-1, -0.25], [1, 0.25]].forEach(([side, tilt]) => {
        c.save();
        c.translate(w / 2 + side * 42 * u, h * 0.2);
        c.rotate(tilt + Math.sin(t * 2 + side) * 0.06);
        c.beginPath(); c.ellipse(0, -60 * u, 24 * u, 70 * u, 0, 0, 6.28); c.fill(); c.stroke();
        c.fillStyle = "#ffc2da"; c.beginPath(); c.ellipse(0, -58 * u, 11 * u, 50 * u, 0, 0, 6.28); c.fill();
        c.fillStyle = "rgba(255,255,255,.95)";
        c.restore();
      });
      emoji(c, "🐰", 40 * u, h - 40 * u, 46 * u, Math.sin(t * 2) * 0.2);
      emoji(c, "🥕", w - 40 * u, h - 40 * u, 40 * u, -0.4);
      emoji(c, "💗", w - 40 * u, 40 * u, 30 * u);
    } else if (which === "orchid") {
      const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
      g.addColorStop(0, "rgba(255,200,225,0)"); g.addColorStop(1, "rgba(255,170,210,.75)");
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      [[0, 0], [w, 0], [0, h], [w, h]].forEach(([x, y], i) => {
        emoji(c, "🌸", x + (x ? -36 : 36) * u, y + (y ? -36 : 36) * u, 64 * u, t * 0.4 * (i % 2 ? 1 : -1));
        emoji(c, "🌷", x + (x ? -90 : 90) * u, y + (y ? -24 : 24) * u, 34 * u, Math.sin(t + i) * 0.3);
      });
    } else if (which === "stage") {
      c.save(); c.globalCompositeOperation = "lighter";
      ["255,80,170", "200,110,255", "255,180,220"].forEach((col, i) => {
        const a = Math.sin(t * 0.9 + i * 2.1) * 0.5, x0 = w * (0.2 + i * 0.3);
        const g = c.createLinearGradient(x0, 0, x0 + Math.sin(a) * h, h);
        g.addColorStop(0, `rgba(${col},.55)`); g.addColorStop(1, `rgba(${col},0)`);
        c.fillStyle = g;
        c.beginPath(); c.moveTo(x0, -10);
        c.lineTo(x0 + Math.sin(a) * h - 90 * u, h); c.lineTo(x0 + Math.sin(a) * h + 90 * u, h); c.closePath(); c.fill();
      });
      for (let i = 0; i < 30; i++) {
        const x = (Math.sin(i * 91.7) * 0.5 + 0.5) * w, y = (Math.sin(i * 37.3) * 0.5 + 0.5) * h;
        c.fillStyle = `rgba(255,255,255,${0.4 + 0.6 * Math.abs(Math.sin(t * 3 + i))})`;
        c.beginPath(); c.arc(x, y, 2 * u, 0, 6.28); c.fill();
      }
      c.restore();
      c.fillStyle = "#fff"; c.strokeStyle = "#f0528f"; c.lineWidth = 6 * u;
      c.font = `700 ${30 * u}px Quicksand, sans-serif`; c.textAlign = "center";
      c.strokeText(T("stay___forever"), w / 2, h - 26 * u); c.fillText(T("stay___forever"), w / 2, h - 26 * u);
    }
  }

  function loop(t) {
    if (!stream) { fx2.clearRect(0, 0, fxCv.width, fxCv.height); return; }
    const dpr = Math.min(devicePixelRatio || 1, 2), w = fxCv.clientWidth, h = fxCv.clientHeight;
    if (fxCv.width !== Math.round(w * dpr)) { fxCv.width = w * dpr; fxCv.height = h * dpr; }
    fx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    fx2.clearRect(0, 0, w, h);
    drawFrame(fx2, w, h, t / 1000, frame);
    requestAnimationFrame(loop);
  }

  async function startCam() {
    camMsg.textContent = "";
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      video.srcObject = stream;
      await video.play();
      off.classList.add("hide");
      snapBtn.disabled = false;
      requestAnimationFrame(loop);
    } catch (e) {
      stream = null;
      camMsg.textContent = T("couldn_t_open_the_camera");
    }
  }
  function stopCam() {
    if (stream) stream.getTracks().forEach((tr) => tr.stop());
    stream = null;
    off.classList.remove("hide");
    snapBtn.disabled = true;
  }
  camBtn.addEventListener("click", startCam);
  document.addEventListener("visibilitychange", () => { if (document.hidden) stopCam(); });

  async function snap() {
    if (!stream || busy) return;
    busy = true;
    snapBtn.disabled = true;
    for (const n of ["3", "2", "1"]) {
      countEl.textContent = n;
      countEl.animate([{ transform: "scale(2)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: 400, easing: "cubic-bezier(.3,1.6,.5,1)" });
      if (typeof sound === "function") sound(n === "1" ? 784 : 523);
      await sleep(800);
    }
    countEl.textContent = "";
    flash(0.95, 500);
    if (typeof sound === "function") sound(1046);

    // build the polaroid: crop the video like the screen shows it, mirror it, add the frame + caption
    const sw = screen.clientWidth, sh = screen.clientHeight, vw = video.videoWidth, vh = video.videoHeight;
    const PW = 1000, PH = Math.round(PW * (sh / sw));
    const pad = 50, bottom = 190;
    const out = document.createElement("canvas");
    out.width = PW + pad * 2; out.height = PH + pad + bottom;
    const c = out.getContext("2d");
    c.fillStyle = "#fffaf6"; c.fillRect(0, 0, out.width, out.height);
    const scale = Math.max(PW / vw, PH / vh), cw = PW / scale, ch = PH / scale;
    c.save();
    c.beginPath(); c.rect(pad, pad, PW, PH); c.clip();
    c.translate(pad + PW, pad); c.scale(-1, 1);
    c.drawImage(video, (vw - cw) / 2, (vh - ch) / 2, cw, ch, 0, 0, PW, PH);
    c.restore();
    c.save(); c.translate(pad, pad); c.beginPath(); c.rect(0, 0, PW, PH); c.clip();
    drawFrame(c, PW, PH, performance.now() / 1000, frame);
    c.restore();
    const day = Math.floor((Date.now() - START) / 864e5) + 1;
    c.fillStyle = "#d63a78"; c.textAlign = "center";
    c.font = `700 64px "Dancing Script", cursive`;
    c.fillText(T("day",[day]), out.width / 2, PH + pad + 100);
    c.fillStyle = "#9a4f75"; c.font = `600 26px Quicksand, sans-serif`;
    c.fillText(new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) + T("made_by"), out.width / 2, PH + pad + 150);

    const url = out.toDataURL("image/png");
    img.src = url;
    saveBtn.href = url;
    saveBtn.download = `${CONFIG.herName.toLowerCase()}-day-${day}.png`;
    result.classList.remove("show"); void result.offsetWidth; result.classList.add("show");
    const [x, y] = center(screen);
    burst(x, y, 20, ["📸", "💗", "✨", "🌸"]);
    achieve("photo", T("cutest_photo_ever"));
    setTimeout(() => result.scrollIntoView({ behavior: "smooth", block: "center" }), 400);
    busy = false;
    snapBtn.disabled = false;
  }
  snapBtn.addEventListener("click", snap);
  $("#againBtn").addEventListener("click", () => { result.classList.remove("show"); screen.scrollIntoView({ behavior: "smooth", block: "center" }); });
})();

/* ---------- say "I love you" out loud: the heart fills up with her voice ---------- */
(function voiceHeart() {
  const box = $("#voice");
  if (!box) return;
  const btn = $("#micBtn"), emo = $("#vEmo"), fillEl = $("#vFill"), msg = $("#vMsg"), barsEl = $("#vBars");
  const bars = Array.from({ length: 24 }, () => { const i = document.createElement("i"); barsEl.appendChild(i); return i; });
  let stream = null, analyser = null, src = null, data = null, fill = 0, level = 0, rec = null, musicWasOn = false, done = false;

  async function start() {
    if (stream) return stop(true);
    done = false; fill = 0;
    box.classList.remove("popped");
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      msg.textContent = T("couldn_t_use_the_microphone");
      return;
    }
    musicWasOn = typeof Music !== "undefined" && Music.on;
    if (musicWasOn) Music.stop();
    const ctx = audio();
    src = ctx.createMediaStreamSource(stream);
    analyser = ctx.createAnalyser(); analyser.fftSize = 512; analyser.smoothingTimeConstant = 0.6;
    src.connect(analyser);                       // NOT connected to the speakers (no echo)
    data = new Uint8Array(analyser.fftSize);
    btn.textContent = T("stop");
    msg.textContent = T("listening__say__i_love");
    // bonus: if the browser can understand speech, hearing the word "love" fills it instantly
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      try {
        rec = new SR(); rec.lang = "en-US"; rec.continuous = true; rec.interimResults = true;
        rec.onresult = (e) => {
          const text = Array.from(e.results).map((r) => r[0].transcript).join(" ").toLowerCase();
          if (/love|사랑/.test(text)) fill = 1;
        };
        rec.onerror = () => {};
        rec.start();
      } catch (e) { rec = null; }
    }
    requestAnimationFrame(loop);
  }
  function stop(byUser) {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    try { src && src.disconnect(); } catch (e) {}
    try { rec && rec.stop(); } catch (e) {}
    rec = null;
    btn.textContent = T("start_listening");
    if (byUser && !done) msg.textContent = T("tap_the_mic_to2");
    if (musicWasOn) { Music.start(); musicWasOn = false; }
  }
  function loop() {
    if (!stream) { emo.style.transform = ""; bars.forEach((b) => (b.style.height = "4px")); return; }
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
    const rms = Math.sqrt(sum / data.length);
    level += (rms - level) * 0.35;
    fill = Math.min(1, Math.max(0, fill + Math.max(0, level - 0.03) * 0.12 - 0.0015));
    emo.style.transform = `scale(${1 + fill * 1.2 + level * 3})`;
    fillEl.style.strokeDashoffset = 1 - fill;
    bars.forEach((b, i) => {
      const k = Math.abs(Math.sin(i * 0.7 + performance.now() / 120));
      b.style.height = 4 + Math.min(36, level * 260 * (0.4 + k * 0.6)) + "px";
    });
    if (fill >= 1) return pop();
    requestAnimationFrame(loop);
  }
  function pop() {
    done = true;
    stop(false);
    fillEl.style.strokeDashoffset = 0;
    box.classList.add("popped");
    const [x, y] = center(emo);
    burst(x, y, 36);
    ring(x, y, { size: 500, width: 4 });
    ring(x, y, { size: 900, width: 3, color: "#d77ae6", delay: 150 });
    Fireworks.show(6);
    heartRain(50);
    if (typeof buzz === "function") buzz([40, 40, 120]);
    msg.textContent = T("i_heard_that");
    achieve("voice", T("said_it_out_loud"));
  }
  btn.addEventListener("click", start);
})();
