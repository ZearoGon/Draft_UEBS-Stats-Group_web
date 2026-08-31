(function statisticsStudyGroupOptimisation() {
  "use strict";

  if (window.__statisticsStudyGroupOptimisation) return;
  window.__statisticsStudyGroupOptimisation = true;

  const scriptNode = document.currentScript;
  const assetBase = scriptNode && scriptNode.src
    ? new URL(".", scriptNode.src)
    : new URL("./assets/", document.baseURI);

  const vendorUrl = (name) => new URL(`vendor/${name}`, assetBase).href;
  const threeUrl = scriptNode && scriptNode.dataset.threeSrc
    ? new URL(scriptNode.dataset.threeSrc, document.baseURI).href
    : vendorUrl("three.module.min.js");
  const p5Url = scriptNode && scriptNode.dataset.p5Src
    ? new URL(scriptNode.dataset.p5Src, document.baseURI).href
    : vendorUrl("p5.min.js");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const desktopField = window.matchMedia("(min-width: 960px)");
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  const globalCleanups = [];
  let disposed = false;

  function reportFallback(label, error) {
    if (!window.console || typeof window.console.info !== "function") return;
    console.info(`[optimisation] ${label} kept its static fallback.`, error || "");
  }

  function listenToMedia(query, listener) {
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", listener);
      return () => query.removeEventListener("change", listener);
    }
    query.addListener(listener);
    return () => query.removeListener(listener);
  }

  function runWhenIdle(callback, timeout) {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(callback, { timeout: timeout || 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(callback, Math.min(timeout || 1200, 420));
    return () => window.clearTimeout(id);
  }

  function dimensionsFor(element) {
    const rect = element.getBoundingClientRect();
    return {
      width: Math.max(1, Math.round(rect.width)),
      height: Math.max(1, Math.round(rect.height))
    };
  }

  function directChildMatching(parent, selectors) {
    return Array.from(parent.children).find((child) => selectors.some((selector) => child.matches(selector))) || null;
  }

  function ensureLayerHost(section, selectors, className, dataAttribute) {
    let host = directChildMatching(section, selectors);
    const owned = !host;

    if (!host) {
      host = document.createElement("div");
      section.insertBefore(host, section.firstChild);
    }

    host.classList.add(className);
    host.setAttribute(dataAttribute, "");
    host.setAttribute("aria-hidden", "true");
    return { host, owned };
  }

  function waitForElement(selector, callback) {
    const current = document.querySelector(selector);
    if (current) {
      callback(current);
      return () => {};
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (!element) return;
      observer.disconnect();
      window.clearTimeout(timeoutId);
      callback(element);
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
    const timeoutId = window.setTimeout(() => observer.disconnect(), 15000);
    return () => {
      observer.disconnect();
      window.clearTimeout(timeoutId);
    };
  }

  function loadClassicScript(url, globalName, timeoutMs) {
    if (globalName && window[globalName]) return Promise.resolve(window[globalName]);

    return new Promise((resolve, reject) => {
      const absolute = new URL(url, document.baseURI).href;
      let node = Array.from(document.scripts).find((candidate) => candidate.src === absolute);
      let settled = false;

      const finish = (error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        if (error) {
          reject(error);
          return;
        }
        if (globalName && !window[globalName]) {
          reject(new Error(`${globalName} did not initialise from ${absolute}`));
          return;
        }
        resolve(globalName ? window[globalName] : node);
      };

      if (!node) {
        node = document.createElement("script");
        node.src = absolute;
        node.async = true;
        node.dataset.optimisationVendor = globalName || "script";
        document.head.appendChild(node);
      }

      node.addEventListener("load", () => finish(), { once: true });
      node.addEventListener("error", () => finish(new Error(`Could not load ${absolute}`)), { once: true });

      const timeoutId = window.setTimeout(
        () => finish(new Error(`Timed out loading ${absolute}`)),
        timeoutMs || 12000
      );

      if (globalName && window[globalName]) finish();
    });
  }

  async function loadFirstAvailable(urls, globalName) {
    let lastError = null;
    for (const url of urls) {
      try {
        return await loadClassicScript(url, globalName);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error(`Could not load ${globalName || "script"}`);
  }

  const motionDirector = (() => {
    const scenes = new Map();
    const ratios = new Map();
    let owner = null;

    function chooseOwner() {
      if (document.hidden || reducedMotion.matches) return null;
      const candidates = Array.from(scenes.keys())
        .map((name) => ({ name, ratio: ratios.get(name) || 0 }))
        .filter((candidate) => candidate.ratio > 0.015)
        .sort((a, b) => b.ratio - a.ratio);

      if (!candidates.length) return null;
      const current = candidates.find((candidate) => candidate.name === owner);
      if (current && current.ratio >= candidates[0].ratio * 0.78) return current.name;
      return candidates[0].name;
    }

    function reconcile() {
      const nextOwner = chooseOwner();
      scenes.forEach((scene, name) => {
        if (name === nextOwner) scene.play();
        else scene.pause();
      });
      owner = nextOwner;
    }

    function renderStaticFrames() {
      scenes.forEach((scene) => {
        scene.pause();
        if (typeof scene.renderStatic === "function") scene.renderStatic();
      });
    }

    return {
      register(name, scene) {
        scenes.set(name, scene);
        reconcile();
      },
      unregister(name) {
        const scene = scenes.get(name);
        if (scene) scene.pause();
        scenes.delete(name);
        if (owner === name) owner = null;
        reconcile();
      },
      setVisibility(name, ratio, isIntersecting) {
        ratios.set(name, isIntersecting ? ratio : 0);
        reconcile();
      },
      preferenceChanged() {
        if (reducedMotion.matches) renderStaticFrames();
        reconcile();
      },
      visibilityChanged() {
        reconcile();
      },
      destroy() {
        scenes.forEach((scene) => scene.pause());
        scenes.clear();
        ratios.clear();
        owner = null;
      }
    };
  })();

  function watchVisibility(name, element) {
    if (!("IntersectionObserver" in window)) {
      motionDirector.setVisibility(name, 1, true);
      return () => motionDirector.setVisibility(name, 0, false);
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      motionDirector.setVisibility(name, entry.intersectionRatio, entry.isIntersecting);
    }, { threshold: [0, 0.015, 0.12, 0.35, 0.65, 1] });

    observer.observe(element);
    return () => {
      observer.disconnect();
      motionDirector.setVisibility(name, 0, false);
    };
  }

  function watchNearViewport(element, callback) {
    if (!("IntersectionObserver" in window)) {
      callback(true);
      return () => {};
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      callback(entry.isIntersecting);
    }, { rootMargin: "320px 0px", threshold: 0 });

    observer.observe(element);
    return () => observer.disconnect();
  }

  function createThrottledScene(drawFrame, framesPerSecond) {
    let active = false;
    let timeoutId = 0;
    let animationFrameId = 0;
    let lastTime = 0;
    let elapsed = 0;
    const interval = 1000 / framesPerSecond;

    function cancelScheduled() {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(animationFrameId);
      timeoutId = 0;
      animationFrameId = 0;
    }

    function schedule() {
      if (!active) return;
      timeoutId = window.setTimeout(() => {
        animationFrameId = window.requestAnimationFrame(tick);
      }, interval);
    }

    function tick(now) {
      if (!active) return;
      const delta = lastTime ? Math.min(0.08, (now - lastTime) / 1000) : 0;
      lastTime = now;
      elapsed += delta;
      drawFrame(elapsed, delta);
      schedule();
    }

    return {
      play() {
        if (active || reducedMotion.matches || document.hidden) return;
        active = true;
        lastTime = 0;
        schedule();
      },
      pause() {
        if (!active && !timeoutId && !animationFrameId) return;
        active = false;
        cancelScheduled();
        lastTime = 0;
      },
      renderStatic() {
        drawFrame(elapsed, 0);
      },
      destroy() {
        active = false;
        cancelScheduled();
      }
    };
  }

  let heroController = null;
  let heroTask = null;
  let heroToken = 0;

  async function createProbabilityField(section, isCurrent) {
    const layer = ensureLayerHost(
      section,
      ["[data-probability-field]", ".hero-probability-field", ".optimisation-probability-field"],
      "optimisation-probability-field",
      "data-probability-field"
    );
    const { host, owned } = layer;
    host.classList.add("is-loading");

    let THREE;
    try {
      THREE = await import(threeUrl);
    } catch (error) {
      host.classList.remove("is-loading");
      host.classList.add("is-fallback");
      reportFallback("Three.js probability field", error);
      return {
        destroy() {
          if (owned) host.remove();
          else host.classList.remove("optimisation-probability-field", "is-fallback", "is-loading");
        }
      };
    }

    if (!isCurrent() || !host.isConnected) {
      if (owned) host.remove();
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.className = "optimisation-probability-canvas";
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        depth: true,
        powerPreference: "low-power",
        premultipliedAlpha: true,
        failIfMajorPerformanceCaveat: true
      });
    } catch (error) {
      canvas.remove();
      host.classList.remove("is-loading");
      host.classList.add("is-fallback");
      reportFallback("WebGL probability field", error);
      return {
        destroy() {
          if (owned) host.remove();
          else host.classList.remove("optimisation-probability-field", "is-fallback", "is-loading");
        }
      };
    }

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 50);
    camera.position.set(0.15, 3.65, 8.4);
    camera.lookAt(0.2, 0.35, 0);

    const fieldGroup = new THREE.Group();
    fieldGroup.rotation.set(-0.12, -0.28, -0.12);
    fieldGroup.position.set(0.85, -0.28, 0);
    scene.add(fieldGroup);

    const columns = 43;
    const rows = 31;
    const rho = 0.56;
    const positions = new Float32Array(columns * rows * 3);
    const densities = new Float32Array(columns * rows);
    let point = 0;

    for (let row = 0; row < rows; row += 1) {
      const ny = -2.7 + (row / (rows - 1)) * 5.4;
      for (let column = 0; column < columns; column += 1) {
        const nx = -3.2 + (column / (columns - 1)) * 6.4;
        const standardX = nx / 1.28;
        const standardY = ny / 1.08;
        const quadratic = (
          standardX * standardX -
          2 * rho * standardX * standardY +
          standardY * standardY
        ) / (2 * (1 - rho * rho));
        const density = Math.exp(-quadratic);
        const offset = point * 3;

        positions[offset] = nx;
        positions[offset + 1] = density * 2.4 - 0.34;
        positions[offset + 2] = ny * 0.72;
        densities[point] = density;
        point += 1;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aDensity", new THREE.BufferAttribute(densities, 1));
    geometry.computeBoundingSphere();

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTail: { value: new THREE.Color(0x6f8d99) },
        uPeak: { value: new THREE.Color(0x0b384e) },
        uPointSize: { value: 2.2 * Math.min(window.devicePixelRatio || 1, 1.5) }
      },
      vertexShader: [
        "attribute float aDensity;",
        "uniform float uPointSize;",
        "varying float vDensity;",
        "void main() {",
        "  vDensity = aDensity;",
        "  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);",
        "  gl_PointSize = clamp(uPointSize * (11.0 / max(2.0, -viewPosition.z)), 1.0, 5.5);",
        "  gl_Position = projectionMatrix * viewPosition;",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform vec3 uTail;",
        "uniform vec3 uPeak;",
        "varying float vDensity;",
        "void main() {",
        "  float radius = distance(gl_PointCoord, vec2(0.5));",
        "  float disc = 1.0 - smoothstep(0.22, 0.5, radius);",
        "  float alpha = (0.10 + 0.58 * pow(vDensity, 1.25)) * disc;",
        "  vec3 colour = mix(uTail, uPeak, smoothstep(0.05, 0.9, vDensity));",
        "  gl_FragColor = vec4(colour, alpha);",
        "}"
      ].join("\n")
    });

    const points = new THREE.Points(geometry, material);
    fieldGroup.add(points);

    let lastWidth = 0;
    let lastHeight = 0;
    function resize() {
      const size = dimensionsFor(host);
      if (size.width === lastWidth && size.height === lastHeight) return;
      lastWidth = size.width;
      lastHeight = size.height;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(size.width, size.height, false);
      camera.aspect = size.width / size.height;
      camera.updateProjectionMatrix();
    }

    function draw(elapsed) {
      if (!isCurrent() || !host.isConnected) return;
      resize();
      fieldGroup.rotation.y = -0.28 + Math.sin(elapsed * 0.19) * 0.055;
      fieldGroup.rotation.z = -0.12 + Math.cos(elapsed * 0.14) * 0.018;
      fieldGroup.position.y = -0.28 + Math.sin(elapsed * 0.22) * 0.025;
      renderer.render(scene, camera);
    }

    const paced = createThrottledScene(draw, 24);
    const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(() => paced.renderStatic()) : null;
    if (resizeObserver) resizeObserver.observe(host);
    else window.addEventListener("resize", paced.renderStatic, { passive: true });

    try {
      paced.renderStatic();
      host.classList.remove("is-loading", "is-fallback");
      host.classList.add("is-webgl-ready");
    } catch (error) {
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener("resize", paced.renderStatic);
      paced.destroy();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (typeof renderer.forceContextLoss === "function") renderer.forceContextLoss();
      canvas.remove();
      host.classList.remove("is-loading", "is-webgl-ready");
      host.classList.add("is-fallback");
      reportFallback("Three.js render", error);
      return {
        destroy() {
          if (owned) host.remove();
          else host.classList.remove("optimisation-probability-field", "is-fallback", "is-loading");
        }
      };
    }

    motionDirector.register("hero", paced);

    return {
      destroy() {
        motionDirector.unregister("hero");
        paced.destroy();
        if (resizeObserver) resizeObserver.disconnect();
        else window.removeEventListener("resize", paced.renderStatic);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        if (typeof renderer.forceContextLoss === "function") renderer.forceContextLoss();
        canvas.remove();
        host.classList.remove("is-loading", "is-webgl-ready", "is-fallback");
        if (owned) host.remove();
        else host.classList.remove("optimisation-probability-field");
      }
    };
  }

  function beginProbabilityField(section) {
    if (disposed || heroController || heroTask || saveData || !desktopField.matches) return;
    const token = ++heroToken;
    const task = createProbabilityField(section, () => token === heroToken && desktopField.matches)
      .then((controller) => {
        if (token !== heroToken) {
          if (controller) controller.destroy();
          return;
        }
        heroController = controller;
      })
      .finally(() => {
        if (heroTask === task) heroTask = null;
        if (!disposed && token !== heroToken && desktopField.matches && section.isConnected) {
          beginProbabilityField(section);
        }
      });
    heroTask = task;
  }

  function stopProbabilityField() {
    heroToken += 1;
    if (heroController) heroController.destroy();
    heroController = null;
  }

  function mulberry32(seed) {
    let value = seed >>> 0;
    return function random() {
      value += 0x6D2B79F5;
      let result = value;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function normalPair(random) {
    const u1 = Math.max(0.000001, random());
    const u2 = random();
    const magnitude = Math.sqrt(-2 * Math.log(u1));
    return [
      magnitude * Math.cos(Math.PI * 2 * u2),
      magnitude * Math.sin(Math.PI * 2 * u2)
    ];
  }

  let joinController = null;
  let joinTask = null;
  let joinToken = 0;

  async function createStatisticalStarField(section, isCurrent) {
    const layer = ensureLayerHost(
      section,
      ["[data-p5-field]", ".join-visual", ".optimisation-join-field"],
      "optimisation-join-field",
      "data-p5-field"
    );
    const { host, owned } = layer;
    const legacy = directChildMatching(section, [".star-river"]);
    if (legacy) host.classList.add("has-legacy-pending");

    let P5;
    try {
      P5 = await loadClassicScript(p5Url, "p5");
    } catch (error) {
      host.classList.add("is-fallback");
      reportFallback("p5 statistical star field", error);
      return {
        destroy() {
          if (owned) host.remove();
          else host.classList.remove("optimisation-join-field", "is-fallback", "has-legacy-pending");
        }
      };
    }

    if (!isCurrent() || !host.isConnected) {
      if (owned) host.remove();
      return null;
    }

    const random = mulberry32(20260830);
    const gaussianStars = [];
    const backgroundStars = [];
    const formulas = [
      { text: "p(θ | y) ∝ p(y | θ)p(θ)", x: 0.18, y: 0.22, phase: 0.6 },
      { text: "√n(θ̂ - θ) → N(0, V)", x: 0.73, y: 0.36, phase: 2.2 },
      { text: "E[R] - Rf = βλ", x: 0.34, y: 0.79, phase: 4.1 }
    ];

    while (gaussianStars.length < 165) {
      const pair = normalPair(random);
      const z1 = pair[0];
      const z2 = pair[1];
      const x = 0.5 + z1 * 0.235;
      const y = 0.51 + (0.6 * z1 + 0.8 * z2) * 0.175;
      if (x < -0.04 || x > 1.04 || y < -0.04 || y > 1.04) continue;
      gaussianStars.push({
        x,
        y,
        z1,
        z2,
        density: Math.exp(-0.5 * (z1 * z1 + z2 * z2)),
        radius: 0.45 + random() * 1.15,
        phase: random() * Math.PI * 2,
        speed: 0.09 + random() * 0.16
      });
    }

    for (let index = 0; index < 58; index += 1) {
      backgroundStars.push({
        x: random(),
        y: random(),
        radius: 0.35 + random() * 0.75,
        phase: random() * Math.PI * 2,
        speed: 0.06 + random() * 0.12
      });
    }

    let destroyed = false;
    let failed = false;
    let ready = false;
    let legacyHideTimer = 0;
    let instance = null;
    let resizeObserver = null;
    let currentTime = 0;

    const paced = createThrottledScene((elapsed) => {
      currentTime = elapsed;
      if (instance && ready && !failed) instance.redraw();
    }, 20);

    const restoreLegacy = () => {
      window.clearTimeout(legacyHideTimer);
      section.classList.remove("has-optimised-star-field");
      if (legacy) {
        legacy.hidden = false;
        legacy.removeAttribute("data-superseded");
      }
    };

    const revealAfterFirstFrame = () => {
      if (ready || failed || destroyed) return;
      ready = true;
      window.requestAnimationFrame(() => {
        if (destroyed || failed) return;
        host.classList.add("is-ready");
        section.classList.add("has-optimised-star-field");
        if (legacy) {
          legacy.setAttribute("data-superseded", "true");
          legacyHideTimer = window.setTimeout(() => {
            if (!destroyed && ready) legacy.hidden = true;
          }, 520);
        }
        motionDirector.register("join", paced);
      });
    };

    const fail = (error) => {
      if (failed || destroyed) return;
      failed = true;
      paced.destroy();
      motionDirector.unregister("join");
      host.classList.remove("is-ready");
      host.classList.add("is-fallback");
      restoreLegacy();
      reportFallback("p5 draw", error);
    };

    const sketch = (p) => {
      p.setup = () => {
        try {
          const size = dimensionsFor(host);
          // p5 rounds fractional pixel densities upward. A fixed density of
          // one keeps this decorative field crisp without silently doubling
          // its backing canvas on Chromium's fractional DPR values.
          const canvas = p.createCanvas(size.width, size.height);
          // createCanvas constructs a fresh renderer, so set the density
          // afterwards; setting it beforehand is discarded by p5 2.x.
          p.pixelDensity(1);
          canvas.addClass("optimisation-join-canvas");
          canvas.attribute("aria-hidden", "true");
          p.noLoop();
        } catch (error) {
          fail(error);
        }
      };

      p.draw = () => {
        if (destroyed || failed) return;
        try {
          const time = currentTime;
          p.clear();

          p.push();
          p.translate(p.width * 0.5, p.height * 0.51);
          p.rotate(0.21);
          p.noFill();
          p.strokeWeight(1);
          [0.58, 0.82, 1.06].forEach((scale, index) => {
            const breathing = reducedMotion.matches ? 1 : 1 + Math.sin(time * 0.17 + index) * 0.006;
            p.stroke(190, 220, 233, 18 - index * 4);
            p.ellipse(0, 0, p.width * scale * breathing, p.height * 0.34 * scale * breathing);
          });
          p.pop();

          p.noStroke();
          backgroundStars.forEach((star) => {
            const shimmer = reducedMotion.matches ? 0.55 : 0.48 + Math.sin(time * star.speed + star.phase) * 0.18;
            p.fill(205, 228, 239, 24 + shimmer * 26);
            p.circle(star.x * p.width, star.y * p.height, star.radius * 2);
          });

          const limit = p.width < 720 ? 108 : gaussianStars.length;
          for (let index = 0; index < limit; index += 1) {
            const star = gaussianStars[index];
            const motionX = reducedMotion.matches ? 0 : Math.sin(time * star.speed + star.phase) * 0.0028;
            const motionY = reducedMotion.matches ? 0 : Math.cos(time * star.speed * 0.78 + star.phase) * 0.0035;
            const shimmer = reducedMotion.matches ? 0.68 : 0.62 + Math.sin(time * 0.28 + star.phase) * 0.24;
            const alpha = 20 + star.density * 78 * shimmer;
            const diameter = star.radius * (1.2 + star.density * 0.9);
            p.fill(198, 226, 239, alpha);
            p.circle((star.x + motionX) * p.width, (star.y + motionY) * p.height, diameter);
          }

          p.textAlign(p.CENTER, p.CENTER);
          p.textFont("Source Serif 4, Georgia, serif");
          p.textStyle(p.ITALIC);
          p.textSize(Math.max(12, Math.min(15, p.width / 82)));
          formulas.forEach((formula) => {
            const drift = reducedMotion.matches ? 0 : Math.sin(time * 0.12 + formula.phase) * 5;
            p.fill(190, 219, 232, 28);
            p.text(formula.text, formula.x * p.width + drift, formula.y * p.height);
          });
          p.textStyle(p.NORMAL);

          revealAfterFirstFrame();
        } catch (error) {
          fail(error);
        }
      };
    };

    try {
      instance = new P5(sketch, host);
    } catch (error) {
      fail(error);
    }

    if (instance && !failed) {
      resizeObserver = "ResizeObserver" in window
        ? new ResizeObserver(() => {
          if (destroyed || failed || !instance) return;
          const size = dimensionsFor(host);
          if (instance.width === size.width && instance.height === size.height) return;
          instance.resizeCanvas(size.width, size.height, true);
          instance.redraw();
        })
        : null;
      if (resizeObserver) resizeObserver.observe(host);
      window.setTimeout(() => {
        if (!destroyed && !failed && instance && !ready) instance.redraw();
      }, 0);
    }

    return {
      destroy() {
        if (destroyed) return;
        destroyed = true;
        motionDirector.unregister("join");
        paced.destroy();
        if (resizeObserver) resizeObserver.disconnect();
        restoreLegacy();
        if (instance) instance.remove();
        host.classList.remove("is-ready", "is-fallback", "has-legacy-pending");
        if (owned) host.remove();
        else host.classList.remove("optimisation-join-field");
      },
      renderStatic() {
        if (instance && !failed) instance.redraw();
      }
    };
  }

  function beginStatisticalStarField(section) {
    if (joinController || joinTask || saveData) return;
    const token = ++joinToken;
    joinTask = createStatisticalStarField(section, () => token === joinToken)
      .then((controller) => {
        if (token !== joinToken) {
          if (controller) controller.destroy();
          return;
        }
        joinController = controller;
      })
      .finally(() => {
        if (token === joinToken) joinTask = null;
      });
  }

  function stopStatisticalStarField() {
    joinToken += 1;
    if (joinController) joinController.destroy();
    joinController = null;
    joinTask = null;
  }

  function scheduleKatexRender() {
    const formulaBackground = document.querySelector(".formula-bg");
    if (!formulaBackground || formulaBackground.dataset.katexEnhanced === "true") return;

    formulaBackground.dataset.katexEnhanced = "pending";
    runWhenIdle(async () => {
      const localKatex = vendorUrl("katex.min.js");
      const localAutoRender = vendorUrl("auto-render.min.js");
      const externalKatex = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
      const externalAutoRender = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js";

      try {
        if (!window.katex) {
          await loadFirstAvailable([localKatex, externalKatex], "katex");
        }
        if (typeof window.renderMathInElement !== "function") {
          await loadFirstAvailable([localAutoRender, externalAutoRender], "renderMathInElement");
        }
        window.renderMathInElement(formulaBackground, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false }
          ],
          throwOnError: false
        });
        formulaBackground.dataset.katexEnhanced = "true";
      } catch (error) {
        formulaBackground.dataset.katexEnhanced = "fallback";
        reportFallback("KaTeX formula background", error);
      }
    }, 2200);
  }

  function initialise() {
    let heroSection = null;
    let joinSection = null;
    let heroNear = false;
    let heroIdleCancel = null;
    let joinIdleCancel = null;

    globalCleanups.push(waitForElement(".hero", (section) => {
      heroSection = section;
      globalCleanups.push(watchVisibility("hero", section));
      globalCleanups.push(watchNearViewport(section, (near) => {
        heroNear = near;
        if (!near || heroController || heroTask || heroIdleCancel || saveData || !desktopField.matches) return;
        heroIdleCancel = runWhenIdle(() => {
          heroIdleCancel = null;
          if (heroNear && heroSection && desktopField.matches) beginProbabilityField(heroSection);
        }, 900);
      }));
    }));

    globalCleanups.push(waitForElement("#join", (section) => {
      joinSection = section;
      globalCleanups.push(watchVisibility("join", section));
      globalCleanups.push(watchNearViewport(section, (near) => {
        if (!near || joinController || joinTask || joinIdleCancel || saveData) return;
        joinIdleCancel = runWhenIdle(() => {
          joinIdleCancel = null;
          if (joinSection) beginStatisticalStarField(joinSection);
        }, 900);
      }));
    }));

    const onDesktopChange = () => {
      if (!desktopField.matches) {
        if (heroIdleCancel) heroIdleCancel();
        heroIdleCancel = null;
        stopProbabilityField();
        return;
      }
      if (heroNear && heroSection && !heroIdleCancel) {
        heroIdleCancel = runWhenIdle(() => {
          heroIdleCancel = null;
          beginProbabilityField(heroSection);
        }, 600);
      }
    };

    globalCleanups.push(listenToMedia(desktopField, onDesktopChange));
    globalCleanups.push(() => {
      if (heroIdleCancel) heroIdleCancel();
      if (joinIdleCancel) joinIdleCancel();
    });

    scheduleKatexRender();
  }

  const onVisibilityChange = () => motionDirector.visibilityChanged();
  const onMotionChange = () => motionDirector.preferenceChanged();
  document.addEventListener("visibilitychange", onVisibilityChange);
  globalCleanups.push(() => document.removeEventListener("visibilitychange", onVisibilityChange));
  globalCleanups.push(listenToMedia(reducedMotion, onMotionChange));

  const api = {
    version: "2026.08.30",
    destroy() {
      disposed = true;
      stopProbabilityField();
      stopStatisticalStarField();
      motionDirector.destroy();
      while (globalCleanups.length) {
        const cleanup = globalCleanups.pop();
        try {
          cleanup();
        } catch (error) {
          reportFallback("cleanup", error);
        }
      }
      window.__statisticsStudyGroupOptimisation = false;
    }
  };

  window.StatisticsStudyGroupOptimisation = api;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise, { once: true });
  } else {
    initialise();
  }

  window.addEventListener("pagehide", (event) => {
    if (event.persisted) {
      motionDirector.visibilityChanged();
      return;
    }
    api.destroy();
  }, { once: true });
})();
