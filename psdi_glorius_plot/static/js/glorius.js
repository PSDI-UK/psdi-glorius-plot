(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/@mathjax/src/bundle/startup.js
  var require_startup = __commonJS({
    "node_modules/@mathjax/src/bundle/startup.js"(exports) {
      (() => {
        "use strict";
        var e = { d: (t2, n2) => {
          for (var o2 in n2) e.o(n2, o2) && !e.o(t2, o2) && Object.defineProperty(t2, o2, { enumerable: true, get: n2[o2] });
        } };
        e.g = (function() {
          if ("object" == typeof globalThis) return globalThis;
          try {
            return this || new Function("return this")();
          } catch (e2) {
            if ("object" == typeof window) return window;
          }
        })(), e.o = (e2, t2) => Object.prototype.hasOwnProperty.call(e2, t2), e.r = (e2) => {
          "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e2, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(e2, "__esModule", { value: true });
        };
        var t = {};
        e.r(t), e.d(t, { Package: () => f, PackageError: () => x2 });
        var n = {};
        e.r(n), e.d(n, { CONFIG: () => L2, Loader: () => O2, MathJax: () => M2, PathFilters: () => v });
        var o = {};
        e.r(o), e.d(o, { CONFIG: () => R2, MathJax: () => E, Startup: () => k2 });
        const s = "4.1.3", a = {}, i = "undefined" != typeof window ? window : void 0 !== e.g ? e.g : "undefined" != typeof globalThis ? globalThis : a;
        function r(e2) {
          return "object" == typeof e2 && null !== e2;
        }
        function d3(e2, t2, n2 = false) {
          var o2;
          for (const s2 of Object.keys(t2)) "__esModule" !== s2 && e2[s2] !== t2[s2] && null !== t2[s2] && void 0 !== t2[s2] && (r(e2[s2]) && r(t2[s2]) ? d3(e2[s2], t2[s2], n2 || "_" === s2) : n2 && (null === (o2 = Object.getOwnPropertyDescriptor(e2, s2)) || void 0 === o2 ? void 0 : o2.get) || (e2[s2] = t2[s2]));
          return e2;
        }
        function c(e2, t2, n2) {
          e2[t2] || (e2[t2] = {}), e2 = e2[t2];
          for (const t3 of Object.keys(n2)) r(e2[t3]) && r(n2[t3]) ? c(e2, t3, n2[t3]) : null == e2[t3] && null != n2[t3] && (e2[t3] = n2[t3]);
          return e2;
        }
        function u(e2) {
          return d3(l, e2);
        }
        void 0 !== i.MathJax && i.MathJax.constructor === {}.constructor || (i.MathJax = {}), i.MathJax.version || (i.MathJax = { version: s, _: {}, config: i.MathJax });
        const l = i.MathJax;
        !Object.hasOwn && l.config.startup.polyfillHasOwn && (Object.hasOwn = function(e2, t2) {
          if (null == e2) throw new TypeError("Cannot convert undefined or null to object");
          return Object.prototype.hasOwnProperty.call(Object(e2), t2);
        });
        const p = "undefined" != typeof window, h = "undefined" != typeof exports, m = { window: p ? window : null, document: p ? window.document : null, os: (() => {
          if (p && window.navigator) {
            const e2 = window.navigator.appVersion, t2 = [["Win", "Windows"], ["Mac", "MacOS"], ["X11", "Unix"], ["Linux", "Unix"]];
            for (const [n2, o2] of t2) if (e2.includes(n2)) return o2;
            if (window.navigator.userAgent.includes("Android")) return "Unix";
          } else if ("undefined" != typeof process) return { linux: "Unix", android: "Unix", aix: "Unix", freebsd: "Unix", netbsd: "Unix", openbsd: "Unix", sunos: "Unix", darwin: "MacOS", win32: "Windows", cygwin: "Windows" }[process.platform] || process.platform;
          return "unknown";
        })(), path: (e2) => e2 };
        "Windows" === m.os && (m.path = (e2) => e2.match(/^[/\\]?[a-zA-Z]:[/\\]/) ? (h ? "" : "file://") + e2.replace(/\\/g, "/").replace(/^\//, "") : e2.replace(/^\//, "file:///"));
        class x2 extends Error {
          constructor(e2, t2) {
            super(e2), this.package = t2;
          }
        }
        class f {
          get canLoad() {
            return 0 === this.dependencyCount && !this.noLoad && !this.isLoading && !this.hasFailed;
          }
          static loadPromise(e2) {
            const t2 = L2[e2] || {}, n2 = t2.extraLoads ? O2.load(...t2.extraLoads) : Promise.resolve(), o2 = t2.checkReady || (() => Promise.resolve());
            return n2.then(() => o2());
          }
          static resolvePath(e2, t2 = true) {
            const n2 = { name: e2, original: e2, addExtension: t2 };
            return O2.pathFilters.execute(n2), n2.name;
          }
          static loadAll() {
            for (const e2 of this.packages.values()) e2.canLoad && e2.load();
          }
          constructor(e2, t2 = false) {
            this.isLoaded = false, this.result = {}, this.isLoading = false, this.hasFailed = false, this.dependents = [], this.dependencies = [], this.dependencyCount = 0, this.provided = [], this.name = e2, this.noLoad = t2, f.packages.set(e2, this), this.promise = this.makePromise(this.makeDependencies());
          }
          makeDependencies() {
            const e2 = [], t2 = f.packages, n2 = this.noLoad, o2 = this.name, s2 = [];
            Object.hasOwn(L2.dependencies, o2) ? s2.push(...L2.dependencies[o2]) : "core" !== o2 && s2.push("core");
            for (const o3 of s2) {
              const s3 = t2.get(o3) || new f(o3, n2);
              this.dependencies.includes(s3) || (s3.addDependent(this, n2), this.dependencies.push(s3), s3.isLoaded || (this.dependencyCount++, e2.push(s3.promise)));
            }
            return e2;
          }
          makePromise(e2) {
            let t2 = new Promise((e3, t3) => {
              this.resolve = e3, this.reject = t3;
            });
            const n2 = L2[this.name] || {};
            return n2.ready && (t2 = t2.then((e3) => n2.ready(this.name))), e2.length && (e2.push(t2), t2 = Promise.all(e2).then((e3) => e3.join(", "))), n2.failed && t2.catch((e3) => n2.failed(new x2(e3, this.name))), t2;
          }
          load() {
            if (!this.isLoaded && !this.isLoading && !this.noLoad) {
              this.isLoading = true;
              const e2 = f.resolvePath(this.name);
              L2.require ? this.loadCustom(e2) : this.loadScript(e2);
            }
          }
          loadCustom(e2) {
            try {
              const t2 = L2.require(e2);
              t2 instanceof Promise ? t2.then((e3) => this.result = e3).then(() => this.checkLoad()).catch((t3) => this.failed(`Can't load "` + e2 + '"\n' + t3.message.trim())) : (this.result = t2, this.checkLoad());
            } catch (e3) {
              this.failed(e3.message);
            }
          }
          loadScript(e2) {
            const t2 = m.document.createElement("script");
            t2.src = e2, t2.charset = "UTF-8", t2.onload = (e3) => this.checkLoad(), t2.onerror = (t3) => this.failed(`Can't load "` + e2 + '"'), m.document.head.appendChild(t2);
          }
          loaded() {
            this.isLoaded = true, this.isLoading = false;
            for (const e2 of this.dependents) e2.requirementSatisfied();
            for (const e2 of this.provided) e2.loaded();
            this.resolve(this.name);
          }
          failed(e2) {
            this.hasFailed = true, this.isLoading = false, this.reject(new x2(e2, this.name));
          }
          checkLoad() {
            f.loadPromise(this.name).then(() => this.loaded()).catch((e2) => this.failed(e2));
          }
          requirementSatisfied() {
            this.dependencyCount && (this.dependencyCount--, this.canLoad && this.load());
          }
          provides(e2 = []) {
            for (const t2 of e2) {
              let e3 = f.packages.get(t2);
              e3 || (L2.dependencies[t2] || (L2.dependencies[t2] = []), L2.dependencies[t2].push(t2), e3 = new f(t2, true), e3.isLoading = true), this.provided.push(e3);
            }
          }
          addDependent(e2, t2) {
            this.dependents.push(e2), t2 || this.checkNoLoad();
          }
          checkNoLoad() {
            if (this.noLoad) {
              this.noLoad = false;
              for (const e2 of this.dependencies) e2.checkNoLoad();
            }
          }
        }
        f.packages = /* @__PURE__ */ new Map();
        class g {
          constructor() {
            this.items = [], this.items = [];
          }
          [Symbol.iterator]() {
            let e2 = 0;
            const t2 = this.items;
            return { next: () => ({ value: t2[e2++], done: e2 > t2.length }) };
          }
          add(e2, t2 = g.DEFAULTPRIORITY) {
            let n2 = this.items.length;
            do {
              n2--;
            } while (n2 >= 0 && t2 < this.items[n2].priority);
            return this.items.splice(n2 + 1, 0, { item: e2, priority: t2 }), e2;
          }
          remove(e2) {
            let t2 = this.items.length;
            do {
              t2--;
            } while (t2 >= 0 && this.items[t2].item !== e2);
            return t2 >= 0 && this.items.splice(t2, 1), this;
          }
        }
        g.DEFAULTPRIORITY = 5;
        const y = l.config || {};
        var b = function(e2, t2, n2, o2) {
          return new (n2 || (n2 = Promise))(function(s2, a2) {
            function i2(e3) {
              try {
                d4(o2.next(e3));
              } catch (e4) {
                a2(e4);
              }
            }
            function r2(e3) {
              try {
                d4(o2.throw(e3));
              } catch (e4) {
                a2(e4);
              }
            }
            function d4(e3) {
              var t3;
              e3.done ? s2(e3.value) : (t3 = e3.value, t3 instanceof n2 ? t3 : new n2(function(e4) {
                e4(t3);
              })).then(i2, r2);
            }
            d4((o2 = o2.apply(e2, t2 || [])).next());
          });
        };
        const v = { source: (e2) => (Object.hasOwn(L2.source, e2.name) && (e2.name = L2.source[e2.name]), true), normalize: (e2) => {
          const t2 = e2.name;
          return t2.match(/^(?:[a-z]+:\/)?\/|[a-z]:[/\\]|\[/i) || (e2.name = "[mathjax]/" + t2.replace(/^\.\//, "")), true;
        }, prefix: (e2) => {
          let t2;
          for (; (t2 = e2.name.match(/^\[([^\]]*)\]/)) && Object.hasOwn(L2.paths, t2[1]); ) e2.name = L2.paths[t2[1]] + e2.name.substring(t2[0].length);
          return true;
        }, addExtension: (e2) => (e2.addExtension && !e2.name.match(/\.[^/]+$/) && (e2.name += ".js"), true) }, w = l.version, O2 = { versions: /* @__PURE__ */ new Map(), nestedLoads: [], ready(...e2) {
          0 === e2.length && (e2 = Array.from(f.packages.keys()));
          const t2 = [];
          for (const n2 of e2) {
            const e3 = f.packages.get(n2) || new f(n2, true);
            t2.push(e3.promise);
          }
          return Promise.all(t2);
        }, load(...e2) {
          if (0 === e2.length) return Promise.resolve([]);
          let t2 = [];
          this.nestedLoads.unshift(t2);
          const n2 = Promise.resolve().then(() => b(this, void 0, void 0, function* () {
            const n3 = [];
            for (const t3 of e2) {
              let e3 = f.packages.get(t3);
              e3 || (e3 = new f(t3), e3.provides(L2.provides[t3])), e3.checkNoLoad(), n3.push(e3.promise.then(() => (L2.versionWarnings && e3.isLoaded && !O2.versions.has(f.resolvePath(t3)) && console.warn(`No version information available for component ${t3}`), e3.result)));
            }
            f.loadAll();
            const o2 = yield Promise.all(n3);
            for (; t2.length; ) {
              const e3 = Promise.all(t2);
              t2 = this.nestedLoads[this.nestedLoads.indexOf(t2)] = [], yield e3;
            }
            return this.nestedLoads.splice(this.nestedLoads.indexOf(t2), 1), o2;
          }));
          return this.nestedLoads.slice(1).forEach((e3) => e3.push(n2)), n2;
        }, preLoaded(...e2) {
          for (const t2 of e2) {
            let e3 = f.packages.get(t2);
            e3 || (e3 = new f(t2, true), e3.provides(L2.provides[t2])), e3.loaded();
          }
        }, addPackageData(e2, t2) {
          let n2 = L2[e2];
          n2 || (n2 = L2[e2] = {});
          for (const [e3, o2] of Object.entries(t2)) if (Array.isArray(o2)) {
            n2[e3] || (n2[e3] = []);
            const t3 = /* @__PURE__ */ new Set([...n2[e3], ...o2]);
            n2[e3] = [...t3];
          } else n2[e3] = o2;
        }, defaultReady() {
          void 0 !== M2.startup && M2.config.startup.ready();
        }, getRoot() {
          if (m.document) {
            const e2 = m.document.currentScript || m.document.getElementById("MathJax-script");
            if (e2 && e2 instanceof HTMLScriptElement) return e2.src.replace(/\/[^/]*$/, "");
          }
          return y?.loader?.paths?.mathjax || y?.__dirname || "/";
        }, checkVersion(e2, t2, n2) {
          return this.saveVersion(e2), !(!L2.versionWarnings || t2 === w) && (console.warn(`Component ${e2} uses ${t2} of MathJax; version in use is ${w}`), true);
        }, saveVersion(e2) {
          O2.versions.set(f.resolvePath(e2), w);
        }, pathFilters: new class extends g {
          constructor(e2 = null) {
            super(), e2 && this.addList(e2);
          }
          addList(e2) {
            for (const t2 of e2) Array.isArray(t2) ? this.add(t2[0], t2[1]) : this.add(t2);
          }
          execute(...e2) {
            for (const t2 of this) {
              if (false === t2.item(...e2)) return false;
            }
            return true;
          }
          asyncExecute(...e2) {
            let t2 = -1;
            const n2 = this.items;
            return new Promise((o2, s2) => {
              !(function a2() {
                for (; ++t2 < n2.length; ) {
                  const i2 = n2[t2].item(...e2);
                  if (i2 instanceof Promise) return void i2.then(a2).catch((e3) => s2(e3));
                  if (false === i2) return void o2(false);
                }
                o2(true);
              })();
            });
          }
        }() };
        O2.pathFilters.add(v.source, 0), O2.pathFilters.add(v.normalize, 10), O2.pathFilters.add(v.prefix, 20), O2.pathFilters.add(v.addExtension, 30);
        const M2 = l;
        if (void 0 === M2.loader) {
          c(M2.config, "loader", { paths: { mathjax: O2.getRoot(), fonts: m.window ? "https://cdn.jsdelivr.net/npm/@mathjax" : "@mathjax" }, source: {}, dependencies: {}, provides: {}, load: [], ready: O2.defaultReady.bind(O2), failed: (e2) => console.log(`MathJax(${e2.package || "?"}): ${e2.message}`), require: null, pathFilters: [], versionWarnings: true }), u({ loader: O2 });
          for (const e2 of M2.config.loader.pathFilters) Array.isArray(e2) ? O2.pathFilters.add(e2[0], e2[1]) : O2.pathFilters.add(e2);
        }
        const L2 = M2.config.loader;
        const P2 = { invalidOption: "warn", optionError: (e2, t2) => {
          if ("fatal" === P2.invalidOption) throw new Error(e2);
          console.warn("MathJax: " + e2);
        } };
        var j2 = function(e2, t2, n2, o2) {
          return new (n2 || (n2 = Promise))(function(s2, a2) {
            function i2(e3) {
              try {
                d4(o2.next(e3));
              } catch (e4) {
                a2(e4);
              }
            }
            function r2(e3) {
              try {
                d4(o2.throw(e3));
              } catch (e4) {
                a2(e4);
              }
            }
            function d4(e3) {
              var t3;
              e3.done ? s2(e3.value) : (t3 = e3.value, t3 instanceof n2 ? t3 : new n2(function(e4) {
                e4(t3);
              })).then(i2, r2);
            }
            d4((o2 = o2.apply(e2, t2 || [])).next());
          });
        };
        class k2 {
          static toMML(e2) {
            return k2.visitor.visitTree(e2, this.document);
          }
          static registerConstructor(e2, t2) {
            k2.constructors[e2] = t2;
          }
          static useHandler(e2, t2 = false) {
            R2.handler && !t2 || (R2.handler = e2);
          }
          static useAdaptor(e2, t2 = false) {
            R2.adaptor && !t2 || (R2.adaptor = e2);
          }
          static useInput(e2, t2 = false) {
            F && !t2 || R2.input.push(e2);
          }
          static useOutput(e2, t2 = false) {
            R2.output && !t2 || (R2.output = e2);
          }
          static extendHandler(e2, t2 = 10) {
            k2.extensions.add(e2, t2);
          }
          static defaultReady() {
            k2.getComponents(), k2.makeMethods(), k2.pagePromise.then(() => R2.pageReady()).then(() => k2.promiseResolve()).catch((e2) => k2.promiseReject(e2));
          }
          static defaultPageReady() {
            return (R2.loadAllFontFiles && k2.output.font ? k2.output.font.loadDynamicFiles() : Promise.resolve()).then(() => {
              var e2;
              return null === (e2 = k2.document.menu) || void 0 === e2 ? void 0 : e2.loadingPromise;
            }).then(R2.typeset && E.typesetPromise ? () => k2.typesetPromise(R2.elements) : Promise.resolve()).then(() => k2.promiseResolve());
          }
          static typesetPromise(e2) {
            return this.hasTypeset = true, k2.document.whenReady(() => j2(this, void 0, void 0, function* () {
              k2.document.options.elements = e2, k2.document.reset(), yield k2.document.renderPromise();
            }));
          }
          static getComponents() {
            k2.visitor = new E._.core.MmlTree.SerializedMmlVisitor.SerializedMmlVisitor(), k2.mathjax = E._.mathjax.mathjax, k2.input = k2.getInputJax(), k2.output = k2.getOutputJax(), k2.adaptor = k2.getAdaptor(), k2.handler && k2.mathjax.handlers.unregister(k2.handler), k2.handler = k2.getHandler(), k2.handler && (k2.mathjax.handlers.register(k2.handler), k2.document = k2.getDocument());
          }
          static makeMethods() {
            k2.input && k2.output && k2.makeTypesetMethods();
            const e2 = k2.output ? k2.output.name.toLowerCase() : "";
            for (const t2 of k2.input) {
              const n2 = t2.name.toLowerCase();
              k2.makeMmlMethods(n2, t2), k2.makeResetMethod(n2, t2), k2.output && k2.makeOutputMethods(n2, e2, t2);
            }
            E.done = () => k2.document.done(), E.whenReady = (e3) => k2.document.whenReady(e3);
          }
          static makeTypesetMethods() {
            E.typeset = (e2 = null) => {
              this.hasTypeset = true, k2.document.options.elements = e2, k2.document.reset(), k2.document.render();
            }, E.typesetPromise = (e2 = null) => k2.typesetPromise(e2), E.typesetClear = (e2 = null) => {
              e2 ? k2.document.clearMathItemsWithin(e2) : k2.document.clear();
            };
          }
          static makeOutputMethods(e2, t2, n2) {
            const o2 = e2 + "2" + t2;
            E[o2] = (e3, t3 = {}) => (t3 = Object.assign(Object.assign({}, t3), { format: n2.name }), k2.document.convert(e3, t3)), E[o2 + "Promise"] = (e3, t3 = {}) => (t3 = Object.assign(Object.assign({}, t3), { format: n2.name }), k2.document.convertPromise(e3, t3)), E[t2 + "Stylesheet"] = () => k2.output.styleSheet(k2.document), "getMetricsFor" in k2.output && (E.getMetricsFor = (e3, t3) => k2.output.getMetricsFor(e3, t3));
          }
          static makeMmlMethods(e2, t2) {
            const n2 = E._.core.MathItem.STATE;
            E[e2 + "2mml"] = (e3, o2 = {}) => (o2 = Object.assign(Object.assign({}, o2), { end: n2.CONVERT, format: t2.name }), k2.toMML(k2.document.convert(e3, o2))), E[e2 + "2mmlPromise"] = (e3, ...o2) => j2(this, [e3, ...o2], void 0, function* (e4, o3 = {}) {
              o3 = Object.assign(Object.assign({}, o3), { end: n2.CONVERT, format: t2.name });
              const s2 = yield k2.document.convertPromise(e4, o3);
              return k2.toMML(s2);
            });
          }
          static makeResetMethod(e2, t2) {
            E[e2 + "Reset"] = (...e3) => t2.reset(...e3);
          }
          static getInputJax() {
            const e2 = [];
            for (const t2 of R2.input) {
              const n2 = k2.constructors[t2];
              if (!n2) throw Error('Input Jax "' + t2 + '" is not defined (has it been loaded?)');
              e2[t2] = new n2(E.config[t2]), e2.push(e2[t2]);
            }
            return e2;
          }
          static getOutputJax() {
            const e2 = R2.output;
            if (!e2) return null;
            const t2 = k2.constructors[e2];
            if (!t2) throw Error('Output Jax "' + e2 + '" is not defined (has it been loaded?)');
            return new t2(E.config[e2]);
          }
          static getAdaptor() {
            const e2 = R2.adaptor;
            if (!e2 || "none" === e2) return null;
            const t2 = k2.constructors[e2];
            if (!t2) throw Error('DOMAdaptor "' + e2 + '" is not defined (has it been loaded?)');
            return t2(E.config[e2]);
          }
          static getHandler() {
            const e2 = R2.handler;
            if (!e2 || "none" === e2 || !k2.adaptor) return null;
            const t2 = k2.constructors[e2];
            if (!t2) throw Error('Handler "' + e2 + '" is not defined (has it been loaded?)');
            let n2 = new t2(k2.adaptor, 5);
            for (const e3 of k2.extensions) n2 = e3.item(n2);
            return n2;
          }
          static getDocument(e2 = null) {
            return k2.mathjax.document(e2 || R2.document, Object.assign(Object.assign({}, E.config.options), { InputJax: k2.input, OutputJax: k2.output }));
          }
        }
        k2.extensions = new g(), k2.constructors = {}, k2.input = [], k2.output = null, k2.handler = null, k2.adaptor = null, k2.elements = null, k2.document = null, k2.promise = new Promise((e2, t2) => {
          k2.promiseResolve = e2, k2.promiseReject = t2;
        }), k2.pagePromise = new Promise((e2, t2) => {
          const n2 = i.document;
          if (n2 && n2.readyState && "complete" !== n2.readyState && "interactive" !== n2.readyState) {
            const t3 = () => e2();
            n2.defaultView.addEventListener("load", t3, true), n2.defaultView.addEventListener("DOMContentLoaded", t3, true);
          } else e2();
        }), k2.hasTypeset = false, k2.defaultOptionError = P2.optionError;
        const E = l;
        void 0 === E._.startup && (c(E.config, "startup", { input: [], output: "", handler: null, adaptor: null, document: m.document || "", elements: null, typeset: true, ready: k2.defaultReady.bind(k2), pageReady: k2.defaultPageReady.bind(k2), polyfillHasOwn: true }), u({ startup: k2, options: {} }), E.config.startup.invalidOption && (P2.invalidOption = E.config.startup.invalidOption), E.config.startup.optionError && (P2.optionError = E.config.startup.optionError));
        const R2 = E.config.startup, F = 0 !== R2.input.length;
        MathJax.loader && MathJax.loader.checkVersion("startup", s, "startup"), u({ _: { components: { loader: n, package: t, startup: o } } });
        var J;
        O2.preLoaded("loader", "startup"), c(MathJax.config.loader, "dependencies", { "a11y/semantic-enrich": ["input/mml", "a11y/sre"], "a11y/speech": ["a11y/semantic-enrich"], "a11y/complexity": ["a11y/semantic-enrich"], "a11y/explorer": ["a11y/speech"], "[mml]/mml3": ["input/mml"], "[tex]/action": ["input/tex-base"], "[tex]/ams": ["input/tex-base", "[tex]/newcommand"], "[tex]/amscd": ["input/tex-base"], "[tex]/autoload": ["input/tex-base", "[tex]/require"], "[tex]/bbm": ["input/tex-base"], "[tex]/bboldx": ["input/tex-base", "[tex]/textmacros"], "[tex]/bbox": ["input/tex-base"], "[tex]/begingroup": ["input/tex-base", "[tex]/newcommand"], "[tex]/boldsymbol": ["input/tex-base"], "[tex]/braket": ["input/tex-base"], "[tex]/bussproofs": ["input/tex-base"], "[tex]/cancel": ["input/tex-base", "[tex]/enclose"], "[tex]/cases": ["[tex]/empheq"], "[tex]/centernot": ["input/tex-base"], "[tex]/color": ["input/tex-base"], "[tex]/colortbl": ["input/tex-base", "[tex]/color"], "[tex]/colorv2": ["input/tex-base"], "[tex]/configmacros": ["input/tex-base", "[tex]/newcommand"], "[tex]/dsfont": ["input/tex-base"], "[tex]/empheq": ["input/tex-base", "[tex]/ams"], "[tex]/enclose": ["input/tex-base"], "[tex]/extpfeil": ["input/tex-base", "[tex]/newcommand", "[tex]/ams"], "[tex]/gensymb": ["input/tex-base"], "[tex]/html": ["input/tex-base"], "[tex]/mathtools": ["input/tex-base", "[tex]/newcommand", "[tex]/ams", "[tex]/boldsymbol"], "[tex]/mhchem": ["input/tex-base", "[tex]/ams"], "[tex]/newcommand": ["input/tex-base"], "[tex]/noerrors": ["input/tex-base"], "[tex]/noundefined": ["input/tex-base"], "[tex]/physics": ["input/tex-base"], "[tex]/require": ["input/tex-base"], "[tex]/setoptions": ["input/tex-base"], "[tex]/tagformat": ["input/tex-base"], "[tex]/texhtml": ["input/tex-base"], "[tex]/textcomp": ["input/tex-base", "[tex]/textmacros"], "[tex]/textmacros": ["input/tex-base"], "[tex]/unicode": ["input/tex-base"], "[tex]/units": ["input/tex-base"], "[tex]/upgreek": ["input/tex-base"], "[tex]/verb": ["input/tex-base"], "ui/menu": ["a11y/sre"] }), c(MathJax.config.loader, "paths", { tex: "[mathjax]/input/tex/extensions", mml: "[mathjax]/input/mml/extensions", sre: "[mathjax]/sre", mathmaps: "[sre]/mathmaps" }), c(MathJax.config.loader, "provides", { startup: ["loader"], "input/tex": ["input/tex-base", "[tex]/ams", "[tex]/newcommand", "[tex]/textmacros", "[tex]/noundefined", "[tex]/require", "[tex]/autoload", "[tex]/configmacros"] }), c(MathJax.config.loader, "source", { "[tex]/amsCd": "[tex]/amscd", "[tex]/colorV2": "[tex]/colorv2", "[tex]/configMacros": "[tex]/configmacros", "[tex]/tagFormat": "[tex]/tagformat" }), O2.load(...L2.load).then(() => (J || function() {
        })()).then(() => L2.ready()).catch((e2) => L2.failed(e2));
      })();
    }
  });

  // src/dirty-forms.mjs
  function initDirtyForms(selector = "form", message = null) {
    $(selector).dirtyForms();
    if (message !== null)
      $.DirtyForms.message = message;
  }
  function cleanDirtyForms(selector = "form") {
    $(selector).dirtyForms("setClean");
  }
  function checkIsDirty(selector = "form") {
    return $(selector).dirtyForms("isDirty");
  }

  // src/color-mixing.mjs
  function hex2dec(hex) {
    return hex.match(/[^#]{2}/g).map((n) => parseInt(n, 16));
  }
  function rgb2hex(r, g, b) {
    r = Math.round(r);
    g = Math.round(g);
    b = Math.round(b);
    r = Math.min(r, 255);
    g = Math.min(g, 255);
    b = Math.min(b, 255);
    return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
  }
  function rgb2cmyk(r, g, b) {
    let c = 1 - r / 255;
    let m = 1 - g / 255;
    let y = 1 - b / 255;
    let k2 = Math.min(c, m, y);
    c = (c - k2) / (1 - k2);
    m = (m - k2) / (1 - k2);
    y = (y - k2) / (1 - k2);
    c = isNaN(c) ? 0 : c;
    m = isNaN(m) ? 0 : m;
    y = isNaN(y) ? 0 : y;
    k2 = isNaN(k2) ? 0 : k2;
    return [c, m, y, k2];
  }
  function cmyk2rgb(c, m, y, k2) {
    let r = c * (1 - k2) + k2;
    let g = m * (1 - k2) + k2;
    let b = y * (1 - k2) + k2;
    r = (1 - r) * 255 + 0.5;
    g = (1 - g) * 255 + 0.5;
    b = (1 - b) * 255 + 0.5;
    return [r, g, b];
  }
  function mixCmyks(cmyk1, cmyk2, ratio1) {
    ratio1 = Math.min(Math.max(ratio1, 0), 1);
    let c = ratio1 * cmyk1[0] + (1 - ratio1) * cmyk2[0];
    let m = ratio1 * cmyk1[1] + (1 - ratio1) * cmyk2[1];
    let y = ratio1 * cmyk1[2] + (1 - ratio1) * cmyk2[2];
    let k2 = ratio1 * cmyk1[3] + (1 - ratio1) * cmyk2[3];
    return [c, m, y, k2];
  }
  function mixHexes(hex1, hex2, ratio1) {
    let rgb1 = hex2dec(hex1);
    let rgb2 = hex2dec(hex2);
    let cmyk1 = rgb2cmyk(...rgb1);
    let cmyk2 = rgb2cmyk(...rgb2);
    let cmykMix = mixCmyks(cmyk1, cmyk2, ratio1);
    let rgbMix = cmyk2rgb(...cmykMix);
    let hexMix = rgb2hex(...rgbMix);
    return hexMix;
  }

  // node_modules/lru-cache/dist/esm/browser/index.min.js
  var L = { hasSubscribers: false };
  var S = L;
  var W = L;
  var M = typeof performance == "object" && performance && typeof performance.now == "function" ? performance : Date;
  var R = () => S.hasSubscribers || W.hasSubscribers;
  var j = /* @__PURE__ */ new Set();
  var I = typeof process == "object" && process ? process : {};
  var P = (d3, e, t, i) => {
    typeof I.emitWarning == "function" ? I.emitWarning(d3, e, t, i) : console.error(`[${t}] ${e}: ${d3}`);
  };
  var k = (d3) => !j.has(d3);
  var T = (d3) => !!d3 && d3 === Math.floor(d3) && d3 > 0 && isFinite(d3);
  var G = (d3) => T(d3) ? d3 <= Math.pow(2, 8) ? Uint8Array : d3 <= Math.pow(2, 16) ? Uint16Array : d3 <= Math.pow(2, 32) ? Uint32Array : d3 <= Number.MAX_SAFE_INTEGER ? O : null : null;
  var O = class extends Array {
    constructor(e) {
      super(e), this.fill(0);
    }
  };
  var x = class d {
    heap;
    length;
    static #o = false;
    static create(e) {
      let t = G(e);
      if (!t) return [];
      d.#o = true;
      let i = new d(e, t);
      return d.#o = false, i;
    }
    constructor(e, t) {
      if (!d.#o) throw new TypeError("instantiate Stack using Stack.create(n)");
      this.heap = new t(e), this.length = 0;
    }
    push(e) {
      this.heap[this.length++] = e;
    }
    pop() {
      return this.heap[--this.length];
    }
  };
  var U = class d2 {
    #o;
    #c;
    #S;
    #O;
    #w;
    #M;
    #I;
    #m;
    get perf() {
      return this.#m;
    }
    ttl;
    ttlResolution;
    ttlAutopurge;
    updateAgeOnGet;
    updateAgeOnHas;
    allowStale;
    noDisposeOnSet;
    noUpdateTTL;
    maxEntrySize;
    sizeCalculation;
    noDeleteOnFetchRejection;
    noDeleteOnStaleGet;
    allowStaleOnFetchAbort;
    allowStaleOnFetchRejection;
    ignoreFetchAbort;
    backgroundFetchSize;
    #n;
    #b;
    #s;
    #i;
    #t;
    #l;
    #u;
    #a;
    #h;
    #y;
    #r;
    #_;
    #F;
    #d;
    #g;
    #T;
    #U;
    #f;
    #D;
    static unsafeExposeInternals(e) {
      return { starts: e.#F, ttls: e.#d, autopurgeTimers: e.#g, sizes: e.#_, keyMap: e.#s, keyList: e.#i, valList: e.#t, next: e.#l, prev: e.#u, get head() {
        return e.#a;
      }, get tail() {
        return e.#h;
      }, free: e.#y, isBackgroundFetch: (t) => e.#e(t), backgroundFetch: (t, i, s, n) => e.#P(t, i, s, n), moveToTail: (t) => e.#L(t), indexes: (t) => e.#A(t), rindexes: (t) => e.#z(t), isStale: (t) => e.#p(t) };
    }
    get max() {
      return this.#o;
    }
    get maxSize() {
      return this.#c;
    }
    get calculatedSize() {
      return this.#b;
    }
    get size() {
      return this.#n;
    }
    get fetchMethod() {
      return this.#M;
    }
    get memoMethod() {
      return this.#I;
    }
    get dispose() {
      return this.#S;
    }
    get onInsert() {
      return this.#O;
    }
    get disposeAfter() {
      return this.#w;
    }
    constructor(e) {
      let { max: t = 0, ttl: i, ttlResolution: s = 1, ttlAutopurge: n, updateAgeOnGet: o, updateAgeOnHas: l, allowStale: h, dispose: r, onInsert: c, disposeAfter: m, noDisposeOnSet: _, noUpdateTTL: u, maxSize: g = 0, maxEntrySize: f = 0, sizeCalculation: y, fetchMethod: a, memoMethod: w, noDeleteOnFetchRejection: F, noDeleteOnStaleGet: b, allowStaleOnFetchRejection: p, allowStaleOnFetchAbort: A, ignoreFetchAbort: z, backgroundFetchSize: C = 1, perf: E } = e;
      if (this.backgroundFetchSize = C, E !== void 0 && typeof E?.now != "function") throw new TypeError("perf option must have a now() method if specified");
      if (this.#m = E ?? M, t !== 0 && !T(t)) throw new TypeError("max option must be a nonnegative integer");
      let v = t ? G(t) : Array;
      if (!v) throw new Error("invalid max value: " + t);
      if (this.#o = t, this.#c = g, this.maxEntrySize = f || this.#c, this.sizeCalculation = y, this.sizeCalculation) {
        if (!this.#c && !this.maxEntrySize) throw new TypeError("cannot set sizeCalculation without setting maxSize or maxEntrySize");
        if (typeof this.sizeCalculation != "function") throw new TypeError("sizeCalculation set to non-function");
      }
      if (w !== void 0 && typeof w != "function") throw new TypeError("memoMethod must be a function if defined");
      if (this.#I = w, a !== void 0 && typeof a != "function") throw new TypeError("fetchMethod must be a function if specified");
      if (this.#M = a, this.#U = !!a, this.#s = /* @__PURE__ */ new Map(), this.#i = Array.from({ length: t }).fill(void 0), this.#t = Array.from({ length: t }).fill(void 0), this.#l = new v(t), this.#u = new v(t), this.#a = 0, this.#h = 0, this.#y = x.create(t), this.#n = 0, this.#b = 0, typeof r == "function" && (this.#S = r), typeof c == "function" && (this.#O = c), typeof m == "function" ? (this.#w = m, this.#r = []) : (this.#w = void 0, this.#r = void 0), this.#T = !!this.#S, this.#D = !!this.#O, this.#f = !!this.#w, this.noDisposeOnSet = !!_, this.noUpdateTTL = !!u, this.noDeleteOnFetchRejection = !!F, this.allowStaleOnFetchRejection = !!p, this.allowStaleOnFetchAbort = !!A, this.ignoreFetchAbort = !!z, this.maxEntrySize !== 0) {
        if (this.#c !== 0 && !T(this.#c)) throw new TypeError("maxSize must be a positive integer if specified");
        if (!T(this.maxEntrySize)) throw new TypeError("maxEntrySize must be a positive integer if specified");
        this.#X();
      }
      if (this.allowStale = !!h, this.noDeleteOnStaleGet = !!b, this.updateAgeOnGet = !!o, this.updateAgeOnHas = !!l, this.ttlResolution = T(s) || s === 0 ? s : 1, this.ttlAutopurge = !!n, this.ttl = i || 0, this.ttl) {
        if (!T(this.ttl)) throw new TypeError("ttl must be a positive integer if specified");
        this.#k();
      }
      if (this.#o === 0 && this.ttl === 0 && this.#c === 0) throw new TypeError("At least one of max, maxSize, or ttl is required");
      if (!this.ttlAutopurge && !this.#o && !this.#c) {
        let D = "LRU_CACHE_UNBOUNDED";
        k(D) && (j.add(D), P("TTL caching without ttlAutopurge, max, or maxSize can result in unbounded memory consumption.", "UnboundedCacheWarning", D, d2));
      }
    }
    getRemainingTTL(e) {
      return this.#s.has(e) ? 1 / 0 : 0;
    }
    #k() {
      let e = new O(this.#o), t = new O(this.#o);
      this.#d = e, this.#F = t;
      let i = this.ttlAutopurge ? Array.from({ length: this.#o }) : void 0;
      this.#g = i, this.#H = (h, r, c = this.#m.now()) => {
        t[h] = r !== 0 ? c : 0, e[h] = r, s(h, r);
      }, this.#R = (h) => {
        t[h] = e[h] !== 0 ? this.#m.now() : 0, s(h, e[h]);
      };
      let s = this.ttlAutopurge ? (h, r) => {
        if (i?.[h] && (clearTimeout(i[h]), i[h] = void 0), r && r !== 0 && i) {
          let c = setTimeout(() => {
            this.#p(h) ? (this.#E(this.#i[h], "expire"), i[h] = void 0) : s(h, l(h));
          }, r + 1);
          c.unref && c.unref(), i[h] = c;
        }
      } : () => {
      };
      this.#v = (h, r) => {
        if (e[r]) {
          let c = e[r], m = t[r];
          if (!c || !m) return;
          h.ttl = c, h.start = m, h.now = n || o();
          let _ = h.now - m;
          h.remainingTTL = c - _;
        }
      };
      let n = 0, o = () => {
        let h = this.#m.now();
        if (this.ttlResolution > 0) {
          n = h;
          let r = setTimeout(() => n = 0, this.ttlResolution);
          r.unref && r.unref();
        }
        return h;
      };
      this.getRemainingTTL = (h) => {
        let r = this.#s.get(h);
        return r === void 0 ? 0 : l(r);
      };
      let l = (h) => {
        let r = e[h], c = t[h];
        if (!r || !c) return 1 / 0;
        let m = (n || o()) - c;
        return r - m;
      };
      this.#p = (h) => {
        let r = t[h], c = e[h];
        return !!c && !!r && (n || o()) - r > c;
      };
    }
    #R = () => {
    };
    #v = () => {
    };
    #H = () => {
    };
    #p = () => false;
    #X() {
      let e = new O(this.#o);
      this.#b = 0, this.#_ = e, this.#x = (t) => {
        this.#b -= e[t], e[t] = 0;
      }, this.#N = (t, i, s, n) => {
        if (!T(s)) {
          if (this.#e(i)) return this.backgroundFetchSize;
          if (n) {
            if (typeof n != "function") throw new TypeError("sizeCalculation must be a function");
            if (s = n(i, t), !T(s)) throw new TypeError("sizeCalculation return invalid (expect positive integer)");
          } else throw new TypeError("invalid size value (must be positive integer). When maxSize or maxEntrySize is used, sizeCalculation or size must be set.");
        }
        return s;
      }, this.#j = (t, i, s) => {
        if (e[t] = i, this.#c) {
          let n = this.#c - e[t];
          for (; this.#b > n; ) this.#G(true);
        }
        this.#b += e[t], s && (s.entrySize = i, s.totalCalculatedSize = this.#b);
      };
    }
    #x = (e) => {
    };
    #j = (e, t, i) => {
    };
    #N = (e, t, i, s) => {
      if (i || s) throw new TypeError("cannot set size without setting maxSize or maxEntrySize on cache");
      return 0;
    };
    *#A({ allowStale: e = this.allowStale } = {}) {
      if (this.#n) for (let t = this.#h; this.#V(t) && ((e || !this.#p(t)) && (yield t), t !== this.#a); ) t = this.#u[t];
    }
    *#z({ allowStale: e = this.allowStale } = {}) {
      if (this.#n) for (let t = this.#a; this.#V(t) && ((e || !this.#p(t)) && (yield t), t !== this.#h); ) t = this.#l[t];
    }
    #V(e) {
      return e !== void 0 && this.#s.get(this.#i[e]) === e;
    }
    *entries() {
      for (let e of this.#A()) this.#t[e] !== void 0 && this.#i[e] !== void 0 && !this.#e(this.#t[e]) && (yield [this.#i[e], this.#t[e]]);
    }
    *rentries() {
      for (let e of this.#z()) this.#t[e] !== void 0 && this.#i[e] !== void 0 && !this.#e(this.#t[e]) && (yield [this.#i[e], this.#t[e]]);
    }
    *keys() {
      for (let e of this.#A()) {
        let t = this.#i[e];
        t !== void 0 && !this.#e(this.#t[e]) && (yield t);
      }
    }
    *rkeys() {
      for (let e of this.#z()) {
        let t = this.#i[e];
        t !== void 0 && !this.#e(this.#t[e]) && (yield t);
      }
    }
    *values() {
      for (let e of this.#A()) this.#t[e] !== void 0 && !this.#e(this.#t[e]) && (yield this.#t[e]);
    }
    *rvalues() {
      for (let e of this.#z()) this.#t[e] !== void 0 && !this.#e(this.#t[e]) && (yield this.#t[e]);
    }
    [Symbol.iterator]() {
      return this.entries();
    }
    [Symbol.toStringTag] = "LRUCache";
    find(e, t = {}) {
      for (let i of this.#A()) {
        let s = this.#t[i], n = this.#e(s) ? s.__staleWhileFetching : s;
        if (n !== void 0 && e(n, this.#i[i], this)) return this.#C(this.#i[i], t);
      }
    }
    forEach(e, t = this) {
      for (let i of this.#A()) {
        let s = this.#t[i], n = this.#e(s) ? s.__staleWhileFetching : s;
        n !== void 0 && e.call(t, n, this.#i[i], this);
      }
    }
    rforEach(e, t = this) {
      for (let i of this.#z()) {
        let s = this.#t[i], n = this.#e(s) ? s.__staleWhileFetching : s;
        n !== void 0 && e.call(t, n, this.#i[i], this);
      }
    }
    purgeStale() {
      let e = false;
      for (let t of this.#z({ allowStale: true })) this.#p(t) && (this.#E(this.#i[t], "expire"), e = true);
      return e;
    }
    info(e) {
      let t = this.#s.get(e);
      if (t === void 0) return;
      let i = this.#t[t], s = this.#e(i) ? i.__staleWhileFetching : i;
      if (s === void 0) return;
      let n = { value: s };
      if (this.#d && this.#F) {
        let o = this.#d[t], l = this.#F[t];
        if (o && l) {
          let h = o - (this.#m.now() - l);
          n.ttl = h, n.start = Date.now();
        }
      }
      return this.#_ && (n.size = this.#_[t]), n;
    }
    dump() {
      let e = [];
      for (let t of this.#A({ allowStale: true })) {
        let i = this.#i[t], s = this.#t[t], n = this.#e(s) ? s.__staleWhileFetching : s;
        if (n === void 0 || i === void 0) continue;
        let o = { value: n };
        if (this.#d && this.#F) {
          o.ttl = this.#d[t];
          let l = this.#m.now() - this.#F[t];
          o.start = Math.floor(Date.now() - l);
        }
        this.#_ && (o.size = this.#_[t]), e.unshift([i, o]);
      }
      return e;
    }
    load(e) {
      this.clear();
      for (let [t, i] of e) {
        if (i.start) {
          let s = Date.now() - i.start;
          i.start = this.#m.now() - s;
        }
        this.#W(t, i.value, i);
      }
    }
    set(e, t, i = {}) {
      let { status: s = S.hasSubscribers ? {} : void 0 } = i;
      i.status = s, s && (s.op = "set", s.key = e, t !== void 0 && (s.value = t), s.cache = this);
      let n = this.#W(e, t, i);
      return s && S.hasSubscribers && S.publish(s), n;
    }
    #W(e, t, i, s) {
      let { ttl: n = this.ttl, start: o, noDisposeOnSet: l = this.noDisposeOnSet, sizeCalculation: h = this.sizeCalculation, status: r } = i, c = this.#e(t);
      if (t === void 0) return r && (r.set = "deleted"), this.delete(e), this;
      let { noUpdateTTL: m = this.noUpdateTTL } = i;
      r && !c && (r.value = t);
      let _ = this.#N(e, t, i.size || 0, h, r);
      if (this.maxEntrySize && _ > this.maxEntrySize) return this.#E(e, "set"), r && (r.set = "miss", r.maxEntrySizeExceeded = true), this;
      let u = this.#n === 0 ? void 0 : this.#s.get(e);
      if (u === void 0) u = this.#n === 0 ? this.#h : this.#y.length !== 0 ? this.#y.pop() : this.#n === this.#o ? this.#G(false) : this.#n, this.#i[u] = e, this.#t[u] = t, this.#s.set(e, u), this.#l[this.#h] = u, this.#u[u] = this.#h, this.#h = u, this.#n++, this.#j(u, _, r), r && (r.set = "add"), m = false, this.#D && !c && this.#O?.(t, e, "add");
      else {
        this.#L(u);
        let g = this.#t[u];
        if (t !== g) {
          if (!l) if (this.#e(g)) {
            g !== s && g.__abortController.abort(new Error("replaced"));
            let { __staleWhileFetching: f } = g;
            f !== void 0 && f !== t && (this.#T && this.#S?.(f, e, "set"), this.#f && this.#r?.push([f, e, "set"]));
          } else this.#T && this.#S?.(g, e, "set"), this.#f && this.#r?.push([g, e, "set"]);
          if (this.#x(u), this.#j(u, _, r), this.#t[u] = t, !c) {
            let f = g && this.#e(g) ? g.__staleWhileFetching : g, y = f === void 0 ? "add" : t !== f ? "replace" : "update";
            r && (r.set = y, f !== void 0 && (r.oldValue = f)), this.#D && this.onInsert?.(t, e, y);
          }
        } else c || (r && (r.set = "update"), this.#D && this.onInsert?.(t, e, "update"));
      }
      if (n !== 0 && !this.#d && this.#k(), this.#d && (m || this.#H(u, n, o), r && this.#v(r, u)), !l && this.#f && this.#r) {
        let g = this.#r, f;
        for (; f = g?.shift(); ) this.#w?.(...f);
      }
      return this;
    }
    pop() {
      try {
        for (; this.#n; ) {
          let e = this.#t[this.#a];
          if (this.#G(true), this.#e(e)) {
            if (e.__staleWhileFetching) return e.__staleWhileFetching;
          } else if (e !== void 0) return e;
        }
      } finally {
        if (this.#f && this.#r) {
          let e = this.#r, t;
          for (; t = e?.shift(); ) this.#w?.(...t);
        }
      }
    }
    #G(e) {
      let t = this.#a, i = this.#i[t], s = this.#t[t], n = this.#e(s);
      n && s.__abortController.abort(new Error("evicted"));
      let o = n ? s.__staleWhileFetching : s;
      return (this.#T || this.#f) && o !== void 0 && (this.#T && this.#S?.(o, i, "evict"), this.#f && this.#r?.push([o, i, "evict"])), this.#x(t), this.#g?.[t] && (clearTimeout(this.#g[t]), this.#g[t] = void 0), e && (this.#i[t] = void 0, this.#t[t] = void 0, this.#y.push(t)), this.#n === 1 ? (this.#a = this.#h = 0, this.#y.length = 0) : this.#a = this.#l[t], this.#s.delete(i), this.#n--, t;
    }
    has(e, t = {}) {
      let { status: i = S.hasSubscribers ? {} : void 0 } = t;
      t.status = i, i && (i.op = "has", i.key = e, i.cache = this);
      let s = this.#Y(e, t);
      return S.hasSubscribers && S.publish(i), s;
    }
    #Y(e, t = {}) {
      let { updateAgeOnHas: i = this.updateAgeOnHas, status: s } = t, n = this.#s.get(e);
      if (n !== void 0) {
        let o = this.#t[n];
        if (this.#e(o) && o.__staleWhileFetching === void 0) return false;
        if (this.#p(n)) s && (s.has = "stale", this.#v(s, n));
        else return i && this.#R(n), s && (s.has = "hit", this.#v(s, n)), true;
      } else s && (s.has = "miss");
      return false;
    }
    peek(e, t = {}) {
      let { status: i = R() ? {} : void 0 } = t;
      i && (i.op = "peek", i.key = e, i.cache = this), t.status = i;
      let s = this.#J(e, t);
      return S.hasSubscribers && S.publish(i), s;
    }
    #J(e, t) {
      let { status: i, allowStale: s = this.allowStale } = t, n = this.#s.get(e);
      if (n === void 0 || !s && this.#p(n)) {
        i && (i.peek = n === void 0 ? "miss" : "stale");
        return;
      }
      let o = this.#t[n], l = this.#e(o) ? o.__staleWhileFetching : o;
      return i && (l !== void 0 ? (i.peek = "hit", i.value = l) : i.peek = "miss"), l;
    }
    #P(e, t, i, s) {
      let n = t === void 0 ? void 0 : this.#t[t];
      if (this.#e(n)) return n;
      let o = new AbortController(), { signal: l } = i;
      l?.addEventListener("abort", () => o.abort(l.reason), { signal: o.signal });
      let h = { signal: o.signal, options: i, context: s }, r = (f, y = false) => {
        let { aborted: a } = o.signal, w = i.ignoreFetchAbort && f !== void 0, F = i.ignoreFetchAbort || !!(i.allowStaleOnFetchAbort && f !== void 0);
        if (i.status && (a && !y ? (i.status.fetchAborted = true, i.status.fetchError = o.signal.reason, w && (i.status.fetchAbortIgnored = true)) : i.status.fetchResolved = true), a && !w && !y) return m(o.signal.reason, F);
        let b = u, p = this.#t[t];
        return (p === u || p === void 0 && w && y) && (f === void 0 ? b.__staleWhileFetching !== void 0 ? this.#t[t] = b.__staleWhileFetching : this.#E(e, "fetch") : (i.status && (i.status.fetchUpdated = true), this.#W(e, f, h.options, b))), f;
      }, c = (f) => (i.status && (i.status.fetchRejected = true, i.status.fetchError = f), m(f, false)), m = (f, y) => {
        let { aborted: a } = o.signal, w = a && i.allowStaleOnFetchAbort, F = w || i.allowStaleOnFetchRejection, b = F || i.noDeleteOnFetchRejection, p = u;
        if (this.#t[t] === u && (!b || !y && p.__staleWhileFetching === void 0 ? this.#E(e, "fetch") : w || (this.#t[t] = p.__staleWhileFetching)), F) return i.status && p.__staleWhileFetching !== void 0 && (i.status.returnedStale = true), p.__staleWhileFetching;
        if (p.__returned === p) throw f;
      }, _ = (f, y) => {
        let a = this.#M?.(e, n, h);
        o.signal.addEventListener("abort", () => {
          (!i.ignoreFetchAbort || i.allowStaleOnFetchAbort) && (f(void 0), i.allowStaleOnFetchAbort && (f = (w) => r(w, true)));
        }), a && a instanceof Promise ? a.then((w) => f(w === void 0 ? void 0 : w), y) : a !== void 0 && f(a);
      };
      i.status && (i.status.fetchDispatched = true);
      let u = new Promise(_).then(r, c), g = Object.assign(u, { __abortController: o, __staleWhileFetching: n, __returned: void 0 });
      return t === void 0 ? (this.#W(e, g, { ...h.options, status: void 0 }), t = this.#s.get(e)) : this.#t[t] = g, g;
    }
    #e(e) {
      if (!this.#U) return false;
      let t = e;
      return !!t && t instanceof Promise && t.hasOwnProperty("__staleWhileFetching") && t.__abortController instanceof AbortController;
    }
    fetch(e, t = {}) {
      let i = W.hasSubscribers, { status: s = R() ? {} : void 0 } = t;
      t.status = s, s && t.context && (s.context = t.context);
      let n = this.#B(e, t);
      return s && i && (s.trace = true, W.tracePromise(() => n, s).catch(() => {
      })), n;
    }
    async #B(e, t = {}) {
      let { allowStale: i = this.allowStale, updateAgeOnGet: s = this.updateAgeOnGet, noDeleteOnStaleGet: n = this.noDeleteOnStaleGet, ttl: o = this.ttl, noDisposeOnSet: l = this.noDisposeOnSet, size: h = 0, sizeCalculation: r = this.sizeCalculation, noUpdateTTL: c = this.noUpdateTTL, noDeleteOnFetchRejection: m = this.noDeleteOnFetchRejection, allowStaleOnFetchRejection: _ = this.allowStaleOnFetchRejection, ignoreFetchAbort: u = this.ignoreFetchAbort, allowStaleOnFetchAbort: g = this.allowStaleOnFetchAbort, context: f, forceRefresh: y = false, status: a, signal: w } = t;
      if (a && (a.op = "fetch", a.key = e, y && (a.forceRefresh = true), a.cache = this), !this.#U) return a && (a.fetch = "get"), this.#C(e, { allowStale: i, updateAgeOnGet: s, noDeleteOnStaleGet: n, status: a });
      let F = { allowStale: i, updateAgeOnGet: s, noDeleteOnStaleGet: n, ttl: o, noDisposeOnSet: l, size: h, sizeCalculation: r, noUpdateTTL: c, noDeleteOnFetchRejection: m, allowStaleOnFetchRejection: _, allowStaleOnFetchAbort: g, ignoreFetchAbort: u, status: a, signal: w }, b = this.#s.get(e);
      if (b === void 0) {
        a && (a.fetch = "miss");
        let p = this.#P(e, b, F, f);
        return p.__returned = p;
      } else {
        let p = this.#t[b];
        if (this.#e(p)) {
          let v = i && p.__staleWhileFetching !== void 0;
          return a && (a.fetch = "inflight", v && (a.returnedStale = true)), v ? p.__staleWhileFetching : p.__returned = p;
        }
        let A = this.#p(b);
        if (!y && !A) return a && (a.fetch = "hit"), this.#L(b), s && this.#R(b), a && this.#v(a, b), p;
        let z = this.#P(e, b, F, f), E = z.__staleWhileFetching !== void 0 && i;
        return a && (a.fetch = A ? "stale" : "refresh", E && A && (a.returnedStale = true)), E ? z.__staleWhileFetching : z.__returned = z;
      }
    }
    forceFetch(e, t = {}) {
      let i = W.hasSubscribers, { status: s = R() ? {} : void 0 } = t;
      t.status = s, s && t.context && (s.context = t.context);
      let n = this.#K(e, t);
      return s && i && (s.trace = true, W.tracePromise(() => n, s).catch(() => {
      })), n;
    }
    async #K(e, t = {}) {
      let i = await this.#B(e, t);
      if (i === void 0) throw new Error("fetch() returned undefined");
      return i;
    }
    memo(e, t = {}) {
      let { status: i = S.hasSubscribers ? {} : void 0 } = t;
      t.status = i, i && (i.op = "memo", i.key = e, t.context && (i.context = t.context), i.cache = this);
      let s = this.#Q(e, t);
      return i && (i.value = s), S.hasSubscribers && S.publish(i), s;
    }
    #Q(e, t = {}) {
      let i = this.#I;
      if (!i) throw new Error("no memoMethod provided to constructor");
      let { context: s, status: n, forceRefresh: o, ...l } = t;
      n && o && (n.forceRefresh = true);
      let h = this.#C(e, l), r = o || h === void 0;
      if (n && (n.memo = r ? "miss" : "hit", r || (n.value = h)), !r) return h;
      let c = i(e, h, { options: l, context: s });
      return n && (n.value = c), this.#W(e, c, l), c;
    }
    get(e, t = {}) {
      let { status: i = S.hasSubscribers ? {} : void 0 } = t;
      t.status = i, i && (i.op = "get", i.key = e, i.cache = this);
      let s = this.#C(e, t);
      return i && (s !== void 0 && (i.value = s), S.hasSubscribers && S.publish(i)), s;
    }
    #C(e, t = {}) {
      let { allowStale: i = this.allowStale, updateAgeOnGet: s = this.updateAgeOnGet, noDeleteOnStaleGet: n = this.noDeleteOnStaleGet, status: o } = t, l = this.#s.get(e);
      if (l === void 0) {
        o && (o.get = "miss");
        return;
      }
      let h = this.#t[l], r = this.#e(h);
      return o && this.#v(o, l), this.#p(l) ? r ? (o && (o.get = "stale-fetching"), i && h.__staleWhileFetching !== void 0 ? (o && (o.returnedStale = true), h.__staleWhileFetching) : void 0) : (n || this.#E(e, "expire"), o && (o.get = "stale"), i ? (o && (o.returnedStale = true), h) : void 0) : (o && (o.get = r ? "fetching" : "hit"), this.#L(l), s && this.#R(l), r ? h.__staleWhileFetching : h);
    }
    #$(e, t) {
      this.#u[t] = e, this.#l[e] = t;
    }
    #L(e) {
      e !== this.#h && (e === this.#a ? this.#a = this.#l[e] : this.#$(this.#u[e], this.#l[e]), this.#$(this.#h, e), this.#h = e);
    }
    delete(e) {
      return this.#E(e, "delete");
    }
    #E(e, t) {
      S.hasSubscribers && S.publish({ op: "delete", delete: t, key: e, cache: this });
      let i = false;
      if (this.#n !== 0) {
        let s = this.#s.get(e);
        if (s !== void 0) if (this.#g?.[s] && (clearTimeout(this.#g[s]), this.#g[s] = void 0), i = true, this.#n === 1) this.#q(t);
        else {
          this.#x(s);
          let n = this.#t[s];
          if (this.#e(n) ? n.__abortController.abort(new Error("deleted")) : (this.#T || this.#f) && (this.#T && this.#S?.(n, e, t), this.#f && this.#r?.push([n, e, t])), this.#s.delete(e), this.#i[s] = void 0, this.#t[s] = void 0, s === this.#h) this.#h = this.#u[s];
          else if (s === this.#a) this.#a = this.#l[s];
          else {
            let o = this.#u[s];
            this.#l[o] = this.#l[s];
            let l = this.#l[s];
            this.#u[l] = this.#u[s];
          }
          this.#n--, this.#y.push(s);
        }
      }
      if (this.#f && this.#r?.length) {
        let s = this.#r, n;
        for (; n = s?.shift(); ) this.#w?.(...n);
      }
      return i;
    }
    clear() {
      return this.#q("delete");
    }
    #q(e) {
      for (let t of this.#z({ allowStale: true })) {
        let i = this.#t[t];
        if (this.#e(i)) i.__abortController.abort(new Error("deleted"));
        else {
          let s = this.#i[t];
          this.#T && this.#S?.(i, s, e), this.#f && this.#r?.push([i, s, e]);
        }
      }
      if (this.#s.clear(), this.#t.fill(void 0), this.#i.fill(void 0), this.#d && this.#F) {
        this.#d.fill(0), this.#F.fill(0);
        for (let t of this.#g ?? []) t !== void 0 && clearTimeout(t);
        this.#g?.fill(void 0);
      }
      if (this.#_ && this.#_.fill(0), this.#a = 0, this.#h = 0, this.#y.length = 0, this.#b = 0, this.#n = 0, this.#f && this.#r) {
        let t = this.#r, i;
        for (; i = t?.shift(); ) this.#w?.(...i);
      }
    }
  };

  // src/formatted-labels.mjs
  var import_startup = __toESM(require_startup(), 1);
  var htmlToSvgCache = new U({ max: 20 });
  var FULL_CLASS = "ql-full";
  var QUILL_THEME = "snow";
  var MATHJAX_DEFAULT_FONT_SIZE = 16;
  var MATHJAX_BASE_FONT_SCALING = 1.125;
  var T_WAIT = 100;
  var compatibilityMode = "unknown";
  var currentRenderBatch = 0;
  var numAwaitingRender = 0;
  var dQuillEditors = {};
  MathJax = {
    loader: {
      paths: { mathjax: "@mathjax/src/bundle" },
      load: ["input/tex", "output/svg", "adaptors/liteDOM"],
      require: ((file) => import(file))
    },
    svg: {
      blacker: 1,
      fontCache: "local"
      // Use a local fontCache to ensure generated SVGs will work as standalone
    },
    output: {
      font: "mathjax-fira"
    }
  };
  loadMathJaxComponents();
  function addQuillEditor(selector, placeholder = "") {
    if (!selector.startsWith("#") || selector.includes(" ") || selector.includes(".")) {
      console.error(`Selector "${selector}" is invalid for initialising a Quill editor. The selector must only be an ID in the format "#editor-ID"`);
      return;
    }
    const el = $(selector);
    const full = el.hasClass(FULL_CLASS);
    if (!placeholder && el.attr("placeholder")) {
      placeholder = el.attr("placeholder").replaceAll(/\s+/gmu, " ");
    }
    const prevEl = el.prev();
    let toolbar, symbolPalette;
    if (prevEl.length == 0 || !prevEl.hasClass("ql-toolbar")) {
      const newToolbar = $($("#quill-toolbar")[0].content.children[0].cloneNode(true));
      el.before(newToolbar);
      const newSymbolPalette = $($("#symbol-palette")[0].content.children[0].cloneNode(true));
      newToolbar.before(newSymbolPalette);
      toolbar = newToolbar;
      symbolPalette = newSymbolPalette;
    } else {
      toolbar = prevEl;
      symbolPalette = toolbar.prev();
      toolbar.find(".insert-symbol").off("click");
      symbolPalette.find("button").off("click");
    }
    toolbar.find(".insert-symbol").on("click", toggleSymbolPalette);
    symbolPalette.find("button").on("click", insertSymbol);
    let bindings = {
      tab: {
        key: [9, "tab", "Tab"],
        handler: () => {
          return true;
        }
      }
    };
    if (!full) {
      bindings.enter = {
        key: [13, "enter", "Enter"],
        handler: () => {
          return false;
        }
      };
      bindings["shift enter"] = {
        key: [13, "enter", "Enter"],
        shiftKey: true,
        handler: () => {
          return false;
        }
      };
    }
    const editor = new Quill(selector, {
      modules: {
        keyboard: {
          bindings
        },
        toolbar: `.ql-toolbar:has(+${selector})`
      },
      placeholder,
      theme: QUILL_THEME
    });
    dQuillEditors[selector] = editor;
    editor.on("selection-change", (range) => {
      if (range)
        enableQuillToolbar(selector);
      else
        disableQuillToolbar(selector);
    });
  }
  function getQuillEditor(selector) {
    return dQuillEditors[selector];
  }
  function setQuillEditor(selector, editor) {
    dQuillEditors[selector] = editor;
  }
  function getQuillEditorHTML(selector, clean = true, allowBreaking = false) {
    const editor = getQuillEditor(selector);
    if (!editor)
      return "";
    let editorHTML = editor.getSemanticHTML();
    if (clean)
      editorHTML = cleanTags(editorHTML);
    if (allowBreaking)
      editorHTML = editorHTML.replaceAll("&nbsp;", " ");
    return editorHTML;
  }
  function removeQuillEditor(selector) {
    delete dQuillEditors[selector];
  }
  function updateQuillContents(selector, contents) {
    $(selector + " .ql-editor p").html(contents);
    dQuillEditors[selector].updateContents();
  }
  function enableQuillToolbar(selector) {
    $(selector).parent().find(".ql-toolbar").addClass("visible");
  }
  function disableQuillToolbar(selector) {
    const toolbar = $(selector).parent().find(".ql-toolbar");
    toolbar.removeClass("visible");
    disableSymbolPalette(selector);
    toolbar.find(".insert-symbol").removeClass("ql-active");
  }
  function disableSymbolPalette(selector) {
    const parent = $(selector).parent();
    parent.find(".insert-symbol").removeClass("ql-active");
    parent.find(".symbol-palette").removeClass("visible");
  }
  function toggleSymbolPalette(e) {
    const openPaletteButton = $(e.delegateTarget);
    const symbolPalette = openPaletteButton.parents(":has(>.ql-toolbar)").find(".symbol-palette");
    if (symbolPalette.hasClass("visible")) {
      openPaletteButton.removeClass("ql-active");
      symbolPalette.removeClass("visible");
    } else {
      openPaletteButton.addClass("ql-active");
      symbolPalette.addClass("visible");
    }
  }
  function insertSymbol(e) {
    const symbolButton = $(e.delegateTarget);
    const symbol = symbolButton.find(".button-text").text();
    const selector = "#" + symbolButton.parents(":has(>.ql-container)").find(".ql-container").attr("id");
    const quill = getQuillEditor(selector);
    const symbolFormats = {};
    const lFormatButtons = $(selector).parents(":has(>.ql-container)").find(".ql-formats>button");
    lFormatButtons.each(function() {
      const formatButton = $(this);
      if (formatButton.hasClass("ql-active")) {
        if (formatButton.hasClass("ql-bold"))
          symbolFormats.bold = true;
        else if (formatButton.hasClass("ql-italic"))
          symbolFormats.italic = true;
        else if (formatButton.hasClass("ql-underline"))
          symbolFormats.underline = true;
        else if (formatButton.hasClass("ql-script"))
          symbolFormats.script = formatButton.val();
      }
    });
    let index = quill.getLength() - 1;
    const range = quill.getSelection();
    if (range) {
      index = range.index;
      if (range.length > 0)
        quill.deleteText(index, range.length, "user");
    }
    quill.insertText(index, symbol, symbolFormats, "user");
    quill.setSelection(index + 1);
  }
  function enableQuillEvents(alwaysCallback, otherCallbacks) {
    Object.entries(dQuillEditors).forEach((entry) => {
      const [selector, editor] = entry;
      editor.off("selection-change");
      editor.on("selection-change", (range) => {
        if (range)
          enableQuillToolbar(selector);
        else
          disableQuillToolbar(selector);
      });
      editor.off("text-change");
      if (!selector.includes("rocrate"))
        editor.on("text-change", alwaysCallback);
    });
    Object.entries(otherCallbacks).forEach(([selector, callback]) => {
      dQuillEditors[selector].on("text-change", callback);
    });
  }
  async function loadMathJaxComponents() {
    return Promise.resolve().then(() => __toESM(require_startup(), 1));
  }
  async function waitForMathJax() {
    return Promise.all([loadMathJaxComponents(), MathJax.startup.promise]);
  }
  function cleanTags(s) {
    return s.replaceAll("&nbsp;", " ").replaceAll("<p>", "").replaceAll("</p>", "").replaceAll("<br>", "").replaceAll(/<span\b[^>]*>/gmu, "").replaceAll("</span>", "").replaceAll(/<([a-zA-Z]+)\b[^>]*>/gmu, "<$1>");
  }
  function stripTags(s) {
    return cleanTags(s).replaceAll(/<\/?em>/g, "").replaceAll(/<\/?strong>/g, "").replaceAll(/<\/?u>/g, "").replaceAll(/<\/?sup>/g, "").replaceAll(/<\/?sub>/g, "");
  }
  function removeGlobalTags(s) {
    const tagRegex = /^<(\w+)>(.*?)<\/\1>/u;
    let haveMatch = true;
    while (haveMatch) {
      let match = s.match(tagRegex);
      if (s && match && match[0] == s)
        s = match[2];
      else
        haveMatch = false;
    }
    return s;
  }
  function incrementRenderBatch() {
    return ++currentRenderBatch;
  }
  async function getSvgFromHtml(labelHtml) {
    let svgHTML = htmlToSvgCache.get(labelHtml);
    if (!svgHTML) {
      const adaptor = MathJax.startup.adaptor;
      const mathJaxSVG = await MathJax.tex2svgPromise(HTMLToTex(labelHtml));
      svgHTML = adaptor.tags(mathJaxSVG, "svg")[0].outerHTML;
      const doubleTagRegex = /(<[^>]+?)<([^>]+?)>([^>]+?>)/g;
      if (compatibilityMode == "unknown") {
        if (svgHTML.search(doubleTagRegex) > 0)
          compatibilityMode = true;
        else
          compatibilityMode = false;
      }
      if (compatibilityMode) {
        let noChange = false;
        let lastSvgHTML = svgHTML;
        while (!noChange) {
          svgHTML = svgHTML.replaceAll(doubleTagRegex, "$1&lt;$2&gt;$3");
          if (svgHTML == lastSvgHTML)
            noChange = true;
          else
            lastSvgHTML = svgHTML;
        }
      }
      svgHTML = svgHTML.replaceAll(/ data-\S*?=".*?"/g, "");
      htmlToSvgCache.set(labelHtml, svgHTML);
    }
    return svgHTML;
  }
  async function drawFormatted(ctx, labelHTML, x2, y, fontSize, hAlign, renderBatch) {
    if (labelHTML == "")
      return;
    ++numAwaitingRender;
    const svgHTML = await getSvgFromHtml(labelHTML);
    let DOMURL = window.URL || window.webkitURL || window;
    let img1 = new Image();
    img1.svgHTML = svgHTML;
    let svg = new Blob([svgHTML], { type: "image/svg+xml" });
    let url = DOMURL.createObjectURL(svg);
    img1.scale = MATHJAX_BASE_FONT_SCALING * fontSize / MATHJAX_DEFAULT_FONT_SIZE;
    img1.renderBatch = renderBatch;
    img1.onload = function() {
      --numAwaitingRender;
      if (img1.renderBatch == currentRenderBatch) {
        let w = img1.naturalWidth * img1.scale;
        let h = img1.naturalHeight * img1.scale;
        let finalX = x2;
        if (hAlign == "center")
          finalX -= w / 2;
        ctx.drawImage(img1, finalX, y, w, h);
      }
      DOMURL.revokeObjectURL(url);
    };
    img1.src = url;
  }
  function HTMLToTex(s) {
    s = s.replaceAll("%", "\\%");
    s = s.replaceAll(" ", "\\:");
    s = s.replaceAll("-", "\u2011");
    s = "{\\rm " + s + "}";
    let changed = true;
    while (changed) {
      let old_s = s;
      s = s.replaceAll(
        /<strong>((?!<\/strong>).*?)<em>(.*?)<\/em>(.*?)<\/strong>/gmu,
        "<strong>$1</strong>\\mathbfit{$2}<strong>$3</strong>"
      );
      if (s == old_s)
        changed = false;
    }
    s = s.replaceAll("<em>", "\\textit{").replaceAll("</em>", "}").replaceAll("<strong>", "\\textbf{").replaceAll("</strong>", "}").replaceAll("<u>", "\\underline{").replaceAll("</u>", "}").replaceAll("<sub>", "_{\\rm ").replaceAll("</sub>", "}").replaceAll("<sup>", "^{\\rm ").replaceAll("</sup>", "}");
    return s;
  }
  function HTMLToMd(s) {
    s = s.replaceAll(/([*~^])/g, "\\$1").replaceAll(/<\/?em>/g, "*").replaceAll(/<\/?strong>/g, "**").replaceAll(/<\/?u>/g, "").replaceAll(/<\/?sub>/g, "~").replaceAll(/<\/?sup>/g, "^");
    return s;
  }
  async function renderingComplete(max_wait = 1e4) {
    return new Promise((resolve, reject) => {
      let interval;
      let elapsed = 0;
      const checkForRenderingComplete = function() {
        elapsed += T_WAIT;
        if (numAwaitingRender == 0) {
          clearInterval(interval);
          resolve();
        } else if (elapsed >= max_wait) {
          clearInterval(interval);
          reject("Maximum wait time exceeded for rendering to complete");
        }
      };
      interval = setInterval(checkForRenderingComplete, T_WAIT);
    });
  }

  // src/io.mjs
  async function exportImage(chartSelector, format, spinnerSelector = null) {
    if (spinnerSelector) {
      $(spinnerSelector).removeClass("hidden");
    }
    let renderFailed = false;
    await renderingComplete().catch((reason) => {
      renderFailed = true;
      $(spinnerSelector).addClass("hidden");
      alert("Error rendering plot: " + reason);
    });
    if (renderFailed)
      return;
    cleanDirtyForms();
    $(chartSelector)[0].toBlob((blob) => {
      let objectURL = URL.createObjectURL(blob);
      let link = document.createElement("a");
      link.href = objectURL;
      link.download = "glorius_plot." + format;
      if (spinnerSelector) {
        $(spinnerSelector).addClass("hidden");
      }
      link.click();
    }, "image/" + format);
  }
  function saveObject(obj, filename) {
    saveText(JSON.stringify(obj), filename);
  }
  function saveText(text, filename) {
    let blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    saveBlob(blob, filename);
  }
  function saveBlob(blob, filename) {
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    ;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }
  async function loadObject(file, callbackSuccess, callbackError = (e) => alert(e.target.error.name)) {
    let reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(e.target.result);
      callbackSuccess(data);
    };
    reader.onerror = callbackError;
    reader.readAsText(file);
  }
  async function loadDataURL(file) {
    return new Promise((resolve, reject) => {
      var fr = new FileReader();
      fr.onload = () => {
        resolve(fr.result);
      };
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }
  function csvSafe(s) {
    s = s.toString();
    if (!s.includes(","))
      return s;
    s = s.replaceAll('"', '""');
    s = '"' + s + '"';
    return s;
  }
  function makeCsv(lRows) {
    let csv = "";
    lRows.forEach((lCells) => {
      if (csv)
        csv += "\n";
      for (let i = 0; i < lCells.length; ++i) {
        if (i > 0)
          csv += ",";
        csv += csvSafe(lCells[i]);
      }
    });
    return csv;
  }

  // src/utility.mjs
  var ORCID_URL_BASE = "https://orcid.org/";
  function clamp(x2, min, max) {
    return Math.min(Math.max(x2, min), max);
  }
  var webkitMode = null;
  function getWebKitMode() {
    if (webkitMode === null) {
      if (typeof window.webkitConvertPointFromNodeToPage === "function")
        webkitMode = true;
      else
        webkitMode = false;
    }
    return webkitMode;
  }
  function forenameToInitials(forename) {
    let initials = "";
    const forenameSegments = forename.split(/\s+/u);
    forenameSegments.forEach((s) => {
      initials += `${s[0].toUpperCase()}.`;
    });
    return initials;
  }
  function surnameToCapitalized(s) {
    s = s[0].toUpperCase() + s.slice(1).toLowerCase();
    if (s.match(/^(Mc|O')/ui) && s.length > 2) {
      s = s.slice(0, 2) + s[2].toUpperCase() + s.slice(3);
    } else if (s.startsWith("Mac") && !s.startsWith("Mack") && s.length > 3) {
      s = s.slice(0, 3) + s[3].toUpperCase() + s.slice(4);
    }
    return s;
  }
  function formatORCIDUrl(s) {
    const orcIdMatch = s.match(/^(\d\d\d\d)-?(\d\d\d\d)-?(\d\d\d\d)-?(\d\d\d[\dX])$/);
    if (orcIdMatch)
      s = `${ORCID_URL_BASE}${orcIdMatch[1]}-${orcIdMatch[2]}-${orcIdMatch[3]}-${orcIdMatch[4]}`;
    return s;
  }

  // src/rocrate/readme.mjs
  function makeReadme(rocrateInfo) {
    let licenseLine = "";
    const licenseInfo = rocrateInfo.licenseInfo;
    if (licenseInfo.url) {
      licenseLine = `

**License:** [${licenseInfo.name || licenseInfo.url}](${licenseInfo.url})`;
    } else if (licenseInfo.name) {
      licenseLine = `

**License:** ${licenseInfo.name}`;
    }
    let bibInfoText = "";
    if (rocrateInfo.bibInfo.readmeInfo) {
      bibInfoText = `

## Bibliographic Information${rocrateInfo.bibInfo.readmeInfo}`;
    }
    let reactionSchemeLine = "";
    if (rocrateInfo.reactionSchemeFile) {
      reactionSchemeLine = `
  - [**reaction_scheme.cdxml**](./data/reaction_scheme.cdxml): ChemDraw file of the chemical transformation described by the Glorius plot.`;
    }
    let baselineLine = "";
    if (rocrateInfo.baselineDesc) {
      baselineLine = `
  - [**standard_conditions.csv**](./data/standard_conditions.csv): Standard conditions for the chemical transformation plotted by the PSDI Glorius plot Generator.`;
    }
    let condDescLine = "";
    if (rocrateInfo.condDescTable) {
      condDescLine = `
  - [**test_conditions.csv**](./data/test_conditions.csv): Experimental description for each test condition plotted by the PSDI Glorius Plot Generator.`;
    }
    const text = `# README

## About

**Title**: ${rocrateInfo.title.md}

**Description**: ${rocrateInfo.desc.md}

**Date Published**: ${rocrateInfo.timestamp}

**About**: ${rocrateInfo.about.md}${licenseLine}${bibInfoText}

## File Structure

- [**ESI.pdf**](./ESI.pdf): A PDF electronic supplementary information file containing the results table for the sensitivity of the reaction and the Glorius plot.
- [**ro-crate-metadata.json**](./ro-crate-metadata.json): A machine-readable file describing the dataset contained within this Research Object Crate (RO-Crate).

- **data folder**:${reactionSchemeLine}${baselineLine}${condDescLine}
  - **plot folder**:
    - [**glorius_plot.png**](./data/plot/glorius_plot.png): Image of Glorius plot generated by PSDI Glorius Plot Generator.
    - [**sensitivity_table.csv**](./data/plot/sensitivity_table.csv): Tabulated reaction outcomes for each test parameter plotted by the PSDI Plot Generator.
    - [**user_preferences.json**](./data/plot/user_preferences.json): User preferences specified in PSDI Glorius Plot Generator.
`;
    return text;
  }
  function formatReadmeBibInfo(lNamesAndSites, contactEmail, citation) {
    let text = "";
    lNamesAndSites.forEach(([name, site]) => {
      if (!name)
        return;
      if (site) {
        const url = formatORCIDUrl(site);
        text += `

**Name**: [${name}](${url})`;
      } else {
        text += `

**Name**: ${name}`;
      }
    });
    if (contactEmail) {
      text += `

**Contact**: ${contactEmail}`;
    }
    if (citation) {
      text += `

${citation}`;
    }
    return text;
  }

  // src/rocrate/metadata.mjs
  function makeMetadata(rocrateInfo) {
    let licensePartLine = `""`;
    let licenseInfoText = "";
    if (rocrateInfo.licenseInfo.url || rocrateInfo.licenseInfo.name) {
      licensePartLine = `{
				"@id": "${rocrateInfo.licenseInfo.url || rocrateInfo.licenseInfo.name}"
			}`;
      licenseInfoText = `,
		{
			"@id": "${rocrateInfo.licenseInfo.url || rocrateInfo.licenseInfo.name}",
			"@type": "CreativeWork",
			"name": "${rocrateInfo.licenseInfo.name}"
		}`;
    }
    let reactionSchemePartLine = "";
    let reactionSchemeInfoText = "";
    if (rocrateInfo.reactionSchemeFile) {
      reactionSchemePartLine = `,
				{"@id": "data/reaction_scheme.cdxml"}`;
      reactionSchemeInfoText = `,
		{
			"@id": "data/reaction_scheme.cdxml",
			"@type": "File",
			"name": "data/reaction_scheme.cdxml",
			"description": "ChemDraw file of the chemical transformation described by the Glorius plot.",
			"encodingFormat": "application/vnd.chemdraw+xml"
		}`;
    }
    let baselineDescPartLine = "";
    let baselineDescInfoText = "";
    if (rocrateInfo.baselineDesc) {
      baselineDescPartLine = `,
				{"@id": "data/standard_conditions.html"}`;
      baselineDescInfoText = `,
		{
			"@id": "data/standard_conditions.html",
			"@type": "File",
			"name": "data/standard_conditions.html",
			"description": "Standard conditions for the chemical transformation plotted by the PSDI Glorius plot Generator.",
			"encodingFormat": "text/html"
		}`;
    }
    let condDescPartLine = "";
    let condDescInfoText = "";
    if (rocrateInfo.condDescTable) {
      condDescPartLine = `,
				{"@id": "data/test_conditions.csv"}`;
      condDescInfoText = `,
		{
			"@id": "data/test_conditions.csv",
			"@type": "File",
			"name": "data/test_conditions.csv",
			"description": "Experimental description for each test condition plotted by the PSDI Glorius Plot Generator.",
			"encodingFormat": "text/csv"
		}`;
    }
    let text = `{
    "@context": "https://w3id.org/ro/crate/1.3/context",
    "@graph": [
		{
			"@id": "./",
			"@type": "Dataset",
			"name": "${rocrateInfo.title.txt}",
			"description": "${rocrateInfo.desc.txt}",
			"datePublished": "${rocrateInfo.timestamp}",
			"instrument": {
				"@id": "https://psdi-uk.github.io/psdi-glorius-plot/"
			},
			"hasPart": [
				{"@id": "data/plot/glorius_plot.png"},
				{"@id": "data/plot/sensitivity_table.csv"},
				{"@id": "data/plot/user_preferences.json"},
				{"@id": "ESI.pdf"},
				{"@id": "README.md"}${reactionSchemePartLine}${baselineDescPartLine}${condDescPartLine}
			],
			"mainEntity": {
                "@id": "ESI.pdf"
            }${rocrateInfo.bibInfo.authorInfoText},
			"license": ${licensePartLine}
		},
		{
			"@id": "ro-crate-metadata.json",
			"@type": "CreativeWork",
			"description": "A machine-readable file describing the dataset contained within this Research Object Crate (RO-Crate).",
			"about": {
                "@id": "./"
            },
            "conformsTo": [
                {
                    "@id": "https://w3id.org/ro/crate/1.1"
                }
            ]
		},
		{
			"@id": "https://psdi-uk.github.io/psdi-glorius-plot/",
			"@type": "SoftwareApplication",
			"url": "https://psdi-uk.github.io/psdi-glorius-plot/",
			"name": "PSDI Glorius Plot Generator",
			"version": "${rocrateInfo.version}"
		},
		{
			"@id": "data/plot/glorius_plot.png",
			"@type": "File",
			"name": "data/plot/glorius_plot.png",
			"description":"Image of Glorius plot generated by PSDI Glorius Plot Generator.",
			"encodingFormat": "image/png"
		},
		{
			"@id": "data/plot/sensitivity_table.csv",
			"@type": "File",
			"name": "data/plot/sensitivity_table.csv",
			"description": "Tabulated reaction outcomes for each test condition plotted by the PSDI Plot Generator.",
			"encodingFormat": "text/csv"
		},
		{
			"@id": "data/plot/user_preferences.json",
			"@type": "File",
			"name": "data/plot/user_preferences.json",
			"description": "User preferences specified in PSDI Glorius Plot Generator.",
			"encodingFormat": "application/json"
		},
		{
			"@id": "ESI.pdf",
			"@type": "File",
			"name": "ESI.pdf", 
			"description": "A PDF electronic supplementary information file containing bibliographic information, details of the standard conditions for the experiment, preparation of the experimental conditions for the sensitivity assessment for the reaction, an image of the reaction, the results table for the sensitivity of the reaction, and the Glorius plot.",
			"encodingFormat": "application/pdf"
		},
		{
			"@id": "README.md",
			"@type": "File",
			"name": "README.md", 
			"description": "README for dataset generated by PSDI Glorius Plot Generator",
			"encodingFormat": "text/markdown"
		}${reactionSchemeInfoText}${baselineDescInfoText}${condDescInfoText}${rocrateInfo.bibInfo.bibInfoText}${licenseInfoText}
	]
}`;
    return text;
  }
  function formatMetadataBibInfo(lNamesAndORCIDs) {
    let authorInfo = "";
    let bibInfo = "";
    if (!lNamesAndORCIDs)
      return [authorInfo, bibInfo];
    let haveSomeInfo = false;
    lNamesAndORCIDs.forEach(([name, orcId]) => {
      if (name || orcId)
        haveSomeInfo = true;
    });
    if (!haveSomeInfo)
      return [authorInfo, bibInfo];
    authorInfo = `,
			"author": [`;
    let firstEntry = true;
    lNamesAndORCIDs.forEach(([name, site]) => {
      if (!(name || site))
        return;
      const url = site && formatORCIDUrl(site);
      const id = url || name;
      if (firstEntry)
        firstEntry = false;
      else
        authorInfo += ",";
      authorInfo += `
				{
					"@id": "${id}"
				}`;
      bibInfo += `,
		{
			"@id": "${id}",
			"@type": "Person",
			"name": "${name}"
		}`;
    });
    authorInfo += `
			]`;
    return [authorInfo, bibInfo];
  }

  // src/rocrate/baseline.mjs
  function makeBaselineDesc(baselineDesc) {
    const text = `<!DOCTYPE html>
<html>
<body>
<h2>Standard conditions</h2>
<p>
${baselineDesc}
</p>
</html>`;
    return text;
  }

  // src/rocrate/test-conditions.mjs
  function makeCondDescTable(lCondDescs) {
    let lRows = [["Test parameter", "Experimental conditions"]];
    lCondDescs.forEach((row) => {
      lRows.push(row);
    });
    return {
      arr: lRows,
      csv: makeCsv(lRows)
    };
  }

  // src/rocrate/esi.mjs
  var pdfFontsLoaded = false;
  function initPdfFonts(siteUrl) {
    if (pdfFontsLoaded)
      return;
    pdfFontsLoaded = true;
    var fonts = {
      Arial: {
        normal: siteUrl + "static/fonts/Arial.ttf",
        bold: siteUrl + "static/fonts/Arial-B.ttf",
        italics: siteUrl + "static/fonts/Arial-I.ttf",
        bolditalics: siteUrl + "static/fonts/Arial-BI.ttf"
      }
    };
    pdfMake.addFonts(fonts);
  }
  async function makeESI(rocrateInfo) {
    if (rocrateInfo.reactionSchemeImg) {
      var reactionSchemeImgPromise = loadDataURL(rocrateInfo.reactionSchemeImg);
    }
    let url = window.location.href, hash = window.location.hash, search = window.location.search;
    if (hash && url.endsWith(hash))
      url = url.slice(0, -hash.length);
    if (search && url.endsWith(search))
      url = url.slice(0, -search.length);
    let lastUrlSegment = url.split("/").at(-1);
    if (lastUrlSegment.includes(".")) {
      url = url.replace(new RegExp(lastUrlSegment.replaceAll(".", ".") + "$"), "");
    }
    initPdfFonts(url);
    const docStyles = {
      header: {
        fontSize: 18,
        bold: true
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 20, 0, 8]
      }
    };
    const defaultStyle = {
      font: "Arial",
      fontSize: 12
    };
    const leftLabelLayout = {
      hLineWidth: function() {
        return 0;
      },
      vLineWidth: function() {
        return 0;
      },
      paddingLeft: function() {
        return 0;
      },
      paddingRight: function(colIndex) {
        return colIndex === 0 ? 24 : 16;
      },
      paddingTop: function() {
        return 2;
      },
      paddingBottom: function(rowIndex) {
        return rowIndex === 0 ? 4 : 2;
      }
    };
    const docContent = [
      {
        text: rocrateInfo.title.txt,
        style: "header"
      },
      {
        text: "Bibliographic Information",
        style: "subheader"
      },
      {
        text: rocrateInfo.bibInfo.esiInfo
      }
    ];
    if (rocrateInfo.baselineDesc) {
      docContent.push(
        {
          text: "Standard conditions",
          style: "subheader"
        },
        formatFromHTML(rocrateInfo.baselineDesc.html)
      );
    }
    if (rocrateInfo.condDescTable) {
      const condDescTableFormatted = rocrateInfo.condDescTable.arr.map((row, i) => {
        return row.map((cell) => {
          let content = formatFromHTML(cell);
          if (i == 0) {
            content = {
              text: content,
              bold: true
            };
          }
          return content;
        });
      });
      docContent.push(
        {
          text: "Preparation of sensitivity assessment of reaction",
          style: "subheader"
        },
        {
          layout: leftLabelLayout,
          table: {
            headerRows: 1,
            body: condDescTableFormatted
          }
        }
      );
    }
    if (rocrateInfo.reactionSchemeImg) {
      var reactionSchemeImgInfo = {
        image: null,
        fit: [500, 700]
      };
      docContent.push(
        {
          layout: "noBorders",
          table: {
            headerRows: 2,
            keepWithHeaderRows: true,
            body: [
              [{
                text: "Reaction",
                style: "subheader"
              }],
              [reactionSchemeImgInfo]
            ]
          }
        }
      );
    }
    var gloriusPlotImgInfo = {
      image: null,
      fit: [500, 700]
    };
    const sensitivityTableFormatted = rocrateInfo.sensitivityTable.arr.map((row, i) => {
      return row.map((cell) => {
        let content;
        if (typeof cell === "string" || cell instanceof String)
          content = formatFromHTML(cell);
        else
          content = cell.toString();
        if (i == 0) {
          content = {
            text: content,
            bold: true
          };
        }
        return content;
      });
    });
    docContent.push(
      {
        text: "Results of sensitivity of reaction",
        style: "subheader"
      },
      {
        layout: leftLabelLayout,
        table: {
          headerRows: 1,
          body: sensitivityTableFormatted
        }
      },
      {
        layout: "noBorders",
        table: {
          headerRows: 2,
          keepWithHeaderRows: true,
          body: [
            [{
              text: "Glorius plot",
              style: "subheader"
            }],
            [gloriusPlotImgInfo]
          ]
        }
      }
    );
    gloriusPlotImgInfo.image = await rocrateInfo.gloriusPlotPromise.then((blob) => {
      return new Promise((resolve, reject) => {
        var fr = new FileReader();
        fr.onload = (e) => {
          resolve(e.target.result);
        };
        fr.onerror = (e) => {
          reject(e.target.result);
        };
        fr.readAsDataURL(blob);
      });
    });
    if (rocrateInfo.reactionSchemeImg) {
      reactionSchemeImgInfo.image = await reactionSchemeImgPromise;
    }
    return pdfMake.createPdf({ content: docContent, styles: docStyles, defaultStyle }).getBlob();
  }
  function formatESIBibInfo(lNamesAndORCIDs, contactEmail, citation) {
    const lFormattedNames = [];
    lNamesAndORCIDs.forEach(([name, orcId]) => {
      if (!name)
        return;
      lFormattedNames.push({ text: name, link: formatORCIDUrl(orcId), decoration: "underline" });
    });
    const lTextSegments = [];
    if (lFormattedNames.length == 1) {
      lTextSegments.push("Author: ", lFormattedNames[0], ".");
    } else if (lFormattedNames.length == 2) {
      lTextSegments.push("Authors: ", lFormattedNames[0], " and ", lFormattedNames[1], ".");
    } else if (lFormattedNames.length > 2) {
      lTextSegments.push("Authors: ");
      for (let i = 0; i < lFormattedNames.length; ++i) {
        if (i < lFormattedNames.length - 1)
          lTextSegments.push(lFormattedNames[i], ", ");
        else
          lTextSegments.push("and ", lFormattedNames[i], ".");
      }
    }
    if (contactEmail) {
      lTextSegments.push(
        " Contact: ",
        { text: contactEmail, link: `mailto:${contactEmail}`, decoration: "underline" },
        "."
      );
    }
    if (citation) {
      if (lTextSegments.length > 0)
        lTextSegments.push("\n\n");
      lTextSegments.push(formatFromHTML(citation));
    }
    if (lTextSegments.length == 0)
      return ["N/A"];
    return lTextSegments;
  }
  function formatFromHTML(text) {
    text = cleanTags(text);
    const tagRegex = /<(\/?em|\/?strong|\/?u|\/?sub|\/?sup)>/gmu;
    const lInTextSegments = text.split(tagRegex);
    const numTags = (lInTextSegments.length - 1) / 2;
    if (numTags == 0)
      return text;
    let lOutTextSegments = [{
      text: lInTextSegments[0],
      bold: false,
      italics: false,
      sub: false,
      sup: false,
      decoration: false
    }];
    for (let i = 0; i < numTags; ++i) {
      const newSegment = { ...lOutTextSegments[i] };
      newSegment.text = lInTextSegments[2 * i + 2];
      switch (lInTextSegments[2 * i + 1]) {
        case "em":
          newSegment.italics = true;
          break;
        case "/em":
          newSegment.italics = false;
          break;
        case "strong":
          newSegment.bold = true;
          break;
        case "/strong":
          newSegment.bold = false;
          break;
        case "u":
          newSegment.decoration = "underline";
          break;
        case "/u":
          newSegment.decoration = false;
          break;
        case "sub":
          newSegment.sub = true;
          break;
        case "/sub":
          newSegment.sub = false;
          break;
        case "sup":
          newSegment.sup = true;
          break;
        case "/sup":
          newSegment.sup = false;
          break;
        default:
      }
      lOutTextSegments.push(newSegment);
    }
    return { text: lOutTextSegments };
  }

  // src/index.mjs
  var CHART_ID = "glorius-plot";
  var CHART_SELECTOR = `#${CHART_ID}`;
  var DIRTY_FORMS_MESSAGE = "Data currently entered in the form will be lost. Do you want to proceed?";
  var LABEL_FONT_FAMILY = "'Fira Sans', sans-serif";
  var WEBKIT_FONT_SCALING = 8 / 9;
  var CONDITION = "condition";
  var SAMPLE = "sample";
  var L_DIMS = [CONDITION, SAMPLE];
  var D_DIM_LIMITS = {
    condition: {
      min: 3,
      max: 12
    },
    sample: {
      min: 1,
      max: 10
    }
  };
  var D_COLOR_SCHEMES = {
    classic: {
      min: "#FF8080",
      max: "#20A020"
    },
    colourblind: {
      min: "#F05200",
      max: "#0093F5"
    },
    greyscale: {
      min: "#A0A0A0",
      max: "#A0A0A0"
    },
    custom: {
      min: null,
      max: null
    }
  };
  var CONDITION_PLACEHOLDER = "e.g. \u201CHigh conc.\u201D";
  var CONDITION_DESC_PLACEHOLDER = "Enter description";
  var DEFAULT_VALUE_MEAN = 100;
  var VALUE_MIN = 0;
  var VALUE_MAX = 100;
  var RAND_BASELINE_MIN = 60;
  var RAND_BASELINE_MAX = 100;
  var D_DEV_PLOT_MODE_INFO = {
    relative: {
      label: "Deviation (%)",
      key: "rel-deviation",
      beforeOutput: "Deviation of ",
      afterOutput: " from standard conditions (%)",
      stripBegin: null,
      stripEnd: " (%)"
    },
    absolute: {
      label: "Deviation (+/-)",
      key: "abs-deviation",
      beforeOutput: "Deviation of ",
      afterOutput: " from standard conditions (+/-)",
      stripBegin: null,
      stripEnd: " (%)"
    },
    mean: {
      label: "Mean",
      key: "mean",
      beforeOutput: "Mean ",
      afterOutput: "",
      stripBegin: null,
      stripEnd: null
    },
    value: {
      beforeOutput: "",
      afterOutput: "",
      stripBegin: null,
      stripEnd: null
    }
  };
  var COLOR_TRANSPARENT = "#FFFFFF00";
  var BORDER_WIDTH = 4;
  var L_BORDER_DASHES = [[], [6, 6], [4, 4], [2, 2], [1, 1]];
  var BASELINE_WIDTH = 4;
  var BASELINE_COLOR = "#FFFFFF";
  var DATA_BG_COLOR = [COLOR_TRANSPARENT];
  var SHOW_GRID_LINES = true;
  var SHOW_AXIS_LINES = true;
  var GRID_WIDTH = 1;
  var GRID_COLOR = "#00000080";
  var TIP_SIZE = 3;
  var BASE_SEPARATION = 3;
  var BAR_SIZE = 2 * (TIP_SIZE + BASE_SEPARATION + 1);
  var BASELINE_DESC_INFO_TEXT = "Add text to describe the experimental conditions that give the REPLACEME you reported for the \u201CStandard Conditions\u201D of your chemical process:";
  var DEFAULT_DATASET_ABOUT_TEXT = "This dataset enables users to visualise the sensitivity of a given chemical transformation to user-defined reaction conditions through the use of a Glorius Plot, based on an original concept from the Glorius research group.";
  var MIN_NUM_CONTRIBS = 1;
  var MAX_NUM_CONTRIBS = 10;
  var D_LICENSE_INFO = {
    "none": {
      name: "",
      id: "",
      url: ""
    },
    "cc0-1.0": {
      name: "Creative Commons Zero v1.0 Universal",
      id: "CC0-1.0",
      url: "https://spdx.org/licenses/CC0-1.0.html"
    },
    "cc-by-4.0": {
      name: "Creative Commons Attribution 4.0 International",
      id: "CC0-1.0",
      url: "https://spdx.org/licenses/CC-BY-4.0.html"
    },
    "cc-by-sa-4.0": {
      name: "Creative Commons Attribution Share Alike 4.0 International",
      id: "CC0-1.0",
      url: "https://spdx.org/licenses/CC-BY-SA-4.0.html"
    },
    "other": {
      name: "",
      id: "",
      url: ""
    }
  };
  var ROCRATE_FILENAME_BASE = "glorius-plot-ro-crate.zip";
  var ROCRATE_ROOT_DIR = "";
  var ROCRATE_DATA_DIR = ROCRATE_ROOT_DIR + "data/";
  var ROCRATE_PLOT_DIR = ROCRATE_DATA_DIR + "plot/";
  var tooltipList;
  var setupPhase = true;
  var reportedFirstInteraction = false;
  var autoUpdating = false;
  var gloriusPlot = null;
  var lastAspectRatio;
  var lastLabelFontSizeWidthRatio;
  var lastLabelFontSizeHeightRatio;
  var lastAxisFontSizeWidthRatio;
  var lastAxisFontSizeHeightRatio;
  var initWidth;
  var initHeight;
  var initLabelFontSize;
  var initAxisFontSize;
  var lastMinOutput = null;
  var lastMaxOutput = null;
  var roCrateFormUpdating = false;
  var exportChecks = {};
  var lastColorVal = "colourblind";
  var lastCustomColorMin = null;
  var lastCustomColorMax = null;
  var lastLicenseVal = "none";
  var lastLicenseName = "";
  var lastLicenseUrl = "";
  var lastDatasetTitle;
  var lastDatasetDesc;
  var lastDatasetAbout;
  var lastCitation;
  var userHasEditedCitation = false;
  function loadScript(scriptUrl) {
    const script = document.createElement("script");
    script.src = scriptUrl;
    document.body.appendChild(script);
    return new Promise((resolve, reject) => {
      script.onload = function() {
        resolve();
      };
      script.onerror = function() {
        console.error("Remote script " + scriptUrl + " could not be loaded");
        reject();
      };
    });
  }
  var customCanvasBackgroundColorPlugin = {
    id: "customCanvasBackgroundColor",
    beforeDraw: (chart, args, options) => {
      const { ctx } = chart;
      ctx.save();
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = options.color || "#FFFFFF";
      ctx.fillRect(0, 0, chart.width, chart.height);
      ctx.restore();
    }
  };
  function getTargetIndex(e, defaultVal = 0) {
    let targetIndex;
    if (e === null) {
      targetIndex = defaultVal;
    } else {
      let eId = e.target.id;
      targetIndex = +eId.split("-").at(-1);
    }
    return targetIndex;
  }
  function getDimSize(dim) {
    if (dim == CONDITION)
      return getNumConditions();
    else
      return getNumSamples();
  }
  function getNumConditions() {
    return $(".condition-row").length;
  }
  function getNumSamples() {
    return $(".sample-heading").length;
  }
  function addDim(dim, e, updateAfter) {
    if (dim == CONDITION)
      return addConditionRow(e, updateAfter);
    else
      return addSampleCol(e, updateAfter);
  }
  function removeDim(dim, e, updateAfter) {
    if (dim == CONDITION)
      return removeConditionRow(e, updateAfter);
    else
      return removeSampleCol(e, updateAfter);
  }
  function setNumDim(dim, num, updateAfter = true) {
    const numDim = getDimSize(dim);
    if (numDim < num) {
      for (let i = 0; i < num - numDim; ++i) {
        addDim(dim, null, false);
      }
    } else if (numDim > num) {
      for (let i = 0; i < numDim - num; ++i) {
        removeDim(dim, null, false);
      }
    } else {
      return;
    }
    postTableUpdateCleanup(dim, updateAfter);
  }
  function updateDimSelector(dim) {
    $("select#num-" + dim).val(getDimSize(dim));
  }
  function updateButtonStatus(dim) {
    const num = getDimSize(dim);
    if (num >= D_DIM_LIMITS[dim].max)
      $("button.add-" + dim).attr("disabled", true);
    else
      $("button.add-" + dim).removeAttr("disabled");
    if (num <= D_DIM_LIMITS[dim].min)
      $("button.remove-" + dim).attr("disabled", true);
    else
      $("button.remove-" + dim).removeAttr("disabled");
  }
  function postTableUpdateCleanup(dim, updateAfter) {
    if (updateAfter) {
      updateButtonStatus(dim);
      updateDimSelector(dim);
      initNumDimControls(dim);
      relabelDim(dim);
      updateMeanColumn();
      updatePlotSelect();
      enableNavigation();
      if (autoUpdating) {
        enableAutoUpdates();
      }
    }
  }
  function relabelDim(dim) {
    const d3 = dim[0];
    const num = getDimSize(dim);
    const lButtonCells = $(`.${dim}-button-cell`);
    const lHeadings = $(`.${dim}-heading`);
    const lInputs = $(`.${dim}-input`);
    for (let i = 0; i < num; i++) {
      const sI = i.toString();
      const buttonCell = lButtonCells.eq(i);
      buttonCell.find(".remove-" + dim).attr("id", `remove-${d3}b-${sI}`);
      buttonCell.find(".add-" + dim).attr("id", `add-${d3}b-${sI}`);
      if (lHeadings.length > 0) {
        let headingText = getOutputLabel();
        updateOutputLabel(headingText);
      }
      if (lInputs.length > 0) {
        lInputs.eq(i).attr("id", `${d3}l-${sI}`);
      }
    }
  }
  function updateMeanColumn() {
    const meanElements = $(".button-mean-cell, .mean-heading, .baseline-mean-cell, .mean-value-cell, .empty-cell.mean-shown-only");
    if (getNumSamples() > 1)
      meanElements.removeClass("hidden");
    else
      meanElements.addClass("hidden");
    $(".mean-heading").text("Mean " + $("#ol-0").val());
  }
  function addConditionRow(e, updateAfter = true) {
    const oldNumConditions = getNumConditions();
    if (oldNumConditions >= D_DIM_LIMITS.condition.max) {
      console.error("Attempt to add condition when maximum rows already reached");
      return;
    }
    const newRow = $(".condition-row").eq(0).clone();
    newRow.find(".condition-input .ql-editor p").html("");
    newRow.find(".sample-value").val("");
    newRow.find(".mean-value").val("100");
    newRow.find(".abs-deviation-value").val("0");
    newRow.find(".rel-deviation-value").val("0");
    const targetRowIndex = getTargetIndex(e, oldNumConditions - 1);
    if (targetRowIndex >= oldNumConditions - 1)
      $(".sensitivity-table tbody #plot-select-row").before(newRow);
    else
      $(".sensitivity-table tbody .condition-row").eq(targetRowIndex + 1).before(newRow);
    if (updateAfter) {
      const lastAutoUpdating = autoUpdating;
      if (autoUpdating)
        disableAutoUpdates();
      postTableUpdateCleanup("condition", updateAfter);
      if (lastAutoUpdating)
        enableAutoUpdates();
    } else {
      relabelDim("condition");
    }
    for (let i = oldNumConditions; i > targetRowIndex + 1; --i) {
      setQuillEditor("#cl-" + i, getQuillEditor("#cl-" + (i - 1)));
      removeQuillEditor("#cl-" + (i - 1));
    }
    $("#cl-" + (targetRowIndex + 1)).html("");
    addQuillEditor("#cl-" + (targetRowIndex + 1), CONDITION_PLACEHOLDER);
    if (updateAfter && autoUpdating)
      generatePlot();
    if (roCrateFormUpdating) {
      addROCrateCondRow(targetRowIndex);
    } else {
      enableQuillEventsAndCallbacks();
    }
  }
  function removeConditionRow(e, updateAfter = true) {
    const oldNumConditions = getNumConditions();
    if (oldNumConditions <= D_DIM_LIMITS.condition.min) {
      console.error("Attempt to remove row when minimum rows already reached");
      return;
    }
    const targetRowIndex = getTargetIndex(e, oldNumConditions - 1);
    removeQuillEditor("#cl-" + targetRowIndex);
    $(".sensitivity-table tbody")[0].removeChild($(".condition-row")[targetRowIndex]);
    if (updateAfter) {
      const lastAutoUpdating = autoUpdating;
      if (autoUpdating)
        disableAutoUpdates();
      postTableUpdateCleanup("condition", updateAfter);
      if (lastAutoUpdating)
        enableAutoUpdates();
    } else {
      relabelDim("condition");
    }
    for (let i = targetRowIndex; i < oldNumConditions - 1; ++i) {
      setQuillEditor("#cl-" + i, getQuillEditor("#cl-" + (i + 1)));
      removeQuillEditor("#cl-" + (i + 1));
    }
    if (updateAfter && autoUpdating)
      generatePlot();
    if (roCrateFormUpdating) {
      removeROCrateCondRow(targetRowIndex);
    } else {
      enableQuillEventsAndCallbacks();
    }
  }
  function addSampleCol(e, updateAfter = true) {
    const numSamples = getNumSamples();
    if (numSamples >= D_DIM_LIMITS.sample.max) {
      console.error("Attempt to add sample when maximum samples already reached");
      return;
    }
    const targetColIndex = getTargetIndex(e, numSamples - 1);
    const newButtonCell = $(".sample-button-cell")[0].cloneNode(true);
    const newHeadingCell = $(".sample-heading")[0].cloneNode(true);
    const newBaselineValueCell = $(".baseline-value-cell")[0].cloneNode(true);
    $(newBaselineValueCell).find(".baseline-value").val("");
    const newEmptyCell = $("#plot-select-row .empty-cell")[0].cloneNode(true);
    if (targetColIndex >= numSamples - 1) {
      $(".sensitivity-buttons")[0].insertBefore(newButtonCell, $(".button-mean-cell")[0]);
      $(".sensitivity-header")[0].insertBefore(newHeadingCell, $(".mean-heading")[0]);
      $(".baseline-row")[0].insertBefore(newBaselineValueCell, $(".baseline-mean-cell")[0]);
    } else {
      $(".sensitivity-buttons")[0].insertBefore(newButtonCell, $(".sample-button-cell")[targetColIndex + 1]);
      $(".sensitivity-header")[0].insertBefore(newHeadingCell, $(".sample-heading")[targetColIndex + 1]);
      $(".baseline-row")[0].insertBefore(newBaselineValueCell, $(".baseline-value-cell")[targetColIndex + 1]);
    }
    $("#plot-select-row")[0].insertBefore(newEmptyCell, $("#plot-select-row .empty-cell.mean-shown-only")[0]);
    const numConditions = getNumConditions();
    for (let i = 0; i < numConditions; i++) {
      const conditionRow = $(".condition-row")[i];
      const lValueCells = $(conditionRow).find(".sample-value-cell");
      const newValueCell = lValueCells[0].cloneNode(true);
      $(newValueCell).find(".sample-value").val("");
      if (targetColIndex >= numSamples - 1)
        conditionRow.insertBefore(newValueCell, $(conditionRow).find(".mean-value-cell")[0]);
      else
        conditionRow.insertBefore(newValueCell, lValueCells[targetColIndex + 1]);
    }
    postTableUpdateCleanup("sample", updateAfter);
  }
  function removeSampleCol(e, updateAfter = true) {
    const numSamples = getNumSamples();
    if (numSamples <= D_DIM_LIMITS.sample.min) {
      console.error("Attempt to remove sample when minimum samples already reached");
      return;
    }
    const targetColIndex = getTargetIndex(e, numSamples - 1);
    $(".sensitivity-buttons")[0].removeChild($(".sample-button-cell")[targetColIndex]);
    $(".sensitivity-header")[0].removeChild($(".sample-heading")[targetColIndex]);
    $(".baseline-row")[0].removeChild($(".baseline-value-cell")[targetColIndex]);
    $("#plot-select-row")[0].removeChild($("#plot-select-row .empty-cell")[targetColIndex]);
    const numConditions = getNumConditions();
    for (let i = 0; i < numConditions; i++) {
      const conditionRow = $(".condition-row")[i];
      conditionRow.removeChild($(conditionRow).find(".sample-value-cell")[targetColIndex]);
    }
    postTableUpdateCleanup("sample", updateAfter);
  }
  function updateCanvasShape(canvasOnly = false) {
    let lSelectors = [CHART_SELECTOR];
    if (!canvasOnly)
      lSelectors.push(CHART_SELECTOR + "-container");
    for (const selector of lSelectors) {
      $(selector).css({
        "width": getWidth().toString(),
        "height": getHeight().toString()
      });
    }
  }
  function updateWidth() {
    if (getAspectRatioLock())
      $("#height-input").val(getWidth() / lastAspectRatio);
    else
      lastAspectRatio = getAspectRatio();
    if (getFontSizeScaleLock()) {
      $("#label-font-size-input").val(getWidth() * lastLabelFontSizeWidthRatio);
      lastLabelFontSizeHeightRatio = getLabelFontSizeHeightRatio();
      $("#axis-font-size-input").val(getWidth() * lastAxisFontSizeWidthRatio);
      lastAxisFontSizeHeightRatio = getAxisFontSizeHeightRatio();
    } else {
      lastLabelFontSizeWidthRatio = getLabelFontSizeWidthRatio();
      lastAxisFontSizeWidthRatio = getAxisFontSizeWidthRatio();
    }
    if (autoUpdating)
      updateCanvasShape(true);
  }
  function updateHeight() {
    if (getAspectRatioLock())
      $("#width-input").val(getHeight() * lastAspectRatio);
    else
      lastAspectRatio = getAspectRatio();
    if (getFontSizeScaleLock()) {
      $("#label-font-size-input").val(getHeight() * lastLabelFontSizeHeightRatio);
      lastLabelFontSizeWidthRatio = getLabelFontSizeWidthRatio();
      $("#axis-font-size-input").val(getHeight() * lastAxisFontSizeHeightRatio);
      lastAxisFontSizeWidthRatio = getAxisFontSizeWidthRatio();
    } else {
      lastLabelFontSizeHeightRatio = getLabelFontSizeHeightRatio();
      lastAxisFontSizeHeightRatio = getAxisFontSizeHeightRatio();
    }
    if (autoUpdating)
      updateCanvasShape(true);
  }
  function finalisePlotDimsUpdate() {
    if ($("#width-input:focus").length > 0 || $("#height-input:focus").length > 0)
      return;
    updateCanvasShape(false);
  }
  function updateFontSize() {
    lastLabelFontSizeWidthRatio = getLabelFontSizeWidthRatio();
    lastLabelFontSizeHeightRatio = getLabelFontSizeHeightRatio();
    lastAxisFontSizeWidthRatio = getAxisFontSizeWidthRatio();
    lastAxisFontSizeHeightRatio = getAxisFontSizeHeightRatio();
  }
  function resetPlotDims() {
    $("#width-input").val(initWidth);
    $("#height-input").val(initHeight);
    $("#label-font-size-input").val(initLabelFontSize);
    $("#axis-font-size-input").val(initAxisFontSize);
    lastAspectRatio = getAspectRatio();
    updateFontSize();
    generateIfUpdating();
  }
  function clearTooltips() {
    tooltipList.forEach((tooltip) => {
      tooltip.hide();
    });
  }
  function getTitle() {
    return getQuillEditorHTML("#title-input");
  }
  function setTitle(val) {
    return updateQuillContents("#title-input", val);
  }
  function getOutcomeValue() {
    return $("#os-0").val();
  }
  function setOutcomeValue(val) {
    $("#os-0").val(val);
  }
  function getOutputLabel() {
    return getQuillEditorHTML("#ol-0");
  }
  function setOutputLabel(val) {
    updateQuillContents("#ol-0", val);
  }
  function getFullOutputLabel() {
    let devPlotMode = getDevPlotMode();
    if (devPlotMode == "mean" && getNumSamples() == 1)
      devPlotMode = "value";
    const dDevPlotModeInfo = D_DEV_PLOT_MODE_INFO[devPlotMode];
    let outputLabel = getOutputLabel();
    if (dDevPlotModeInfo.stripEnd != null && outputLabel.endsWith(dDevPlotModeInfo.stripEnd)) {
      outputLabel = outputLabel.slice(0, -dDevPlotModeInfo.stripEnd.length);
    }
    if (dDevPlotModeInfo.stripBegin != null && outputLabel.endsWith(dDevPlotModeInfo.stripBegin)) {
      outputLabel = outputLabel.slice(dDevPlotModeInfo.stripBegin.length);
    }
    outputLabel = dDevPlotModeInfo.beforeOutput + outputLabel + dDevPlotModeInfo.afterOutput;
    return outputLabel;
  }
  function getConditionLabel(i) {
    return getQuillEditorHTML("#cl-" + i);
  }
  function setConditionLabel(i, val) {
    updateQuillContents("#cl-" + i, val);
  }
  function getLConditionLabels() {
    const lCondtionLabelsHTML = [];
    $(".condition-input").each((i) => {
      lCondtionLabelsHTML.push(getConditionLabel(i));
    });
    return lCondtionLabelsHTML;
  }
  function setLConditionLabels(lVals) {
    for (let i = 0; i < lVals.length; ++i) {
      setConditionLabel(i, lVals[i]);
    }
  }
  function getDevPlotMode() {
    const lPlotSelectRadio = $("input.plot-select");
    let rVal = "absolute";
    lPlotSelectRadio.each(function() {
      const oThis = $(this);
      if (oThis.is(":checked"))
        rVal = oThis.val();
    });
    return rVal;
  }
  function updateMinMaxOutputStatus() {
    const devPlotMode = getDevPlotMode();
    const minOutputInput = $("#min-output-input"), maxOutputInput = $("#max-output-input");
    if (devPlotMode == "mean") {
      minOutputInput.attr("disabled", "disabled");
      lastMinOutput = minOutputInput.val();
      minOutputInput.val(0);
      maxOutputInput.attr("disabled", "disabled");
      lastMaxOutput = maxOutputInput.val();
      maxOutputInput.val(100);
    } else {
      minOutputInput.removeAttr("disabled");
      if (lastMinOutput !== null) {
        minOutputInput.val(lastMinOutput);
        lastMinOutput = null;
      }
      maxOutputInput.removeAttr("disabled");
      if (lastMaxOutput !== null) {
        maxOutputInput.val(lastMaxOutput);
        lastMaxOutput = null;
      }
    }
  }
  function setDevPlotMode(val) {
    const lPlotSelectRadio = $("input.plot-select");
    lPlotSelectRadio.each(function() {
      const oThis = $(this);
      if (oThis.val() == val)
        oThis.prop("checked", true);
      else
        oThis.prop("checked", false);
    });
    updateMinMaxOutputStatus();
  }
  function getWidth() {
    return +$("#width-input").val();
  }
  function setWidth(val) {
    $("#width-input").val(val);
  }
  function getHeight() {
    return +$("#height-input").val();
  }
  function setHeight(val) {
    $("#height-input").val(val);
  }
  function getLabelFontSize() {
    return +$("#label-font-size-input").val();
  }
  function setLabelFontSize(val) {
    $("#label-font-size-input").val(val);
  }
  function getAxisFontSize() {
    return +$("#axis-font-size-input").val();
  }
  function setAxisFontSize(val) {
    $("#axis-font-size-input").val(val);
  }
  function getAspectRatio() {
    return getWidth() / getHeight();
  }
  function getAspectRatioLock() {
    return $("#lock-aspect-ratio").is(":checked");
  }
  function getLabelFontSizeWidthRatio() {
    return getLabelFontSize() / getWidth();
  }
  function getLabelFontSizeHeightRatio() {
    return getLabelFontSize() / getHeight();
  }
  function getAxisFontSizeWidthRatio() {
    return getAxisFontSize() / getWidth();
  }
  function getAxisFontSizeHeightRatio() {
    return getAxisFontSize() / getHeight();
  }
  function getFontSizeScaleLock() {
    return $("#scale-font-size").is(":checked");
  }
  function getMinOutput() {
    if (getDevPlotMode() == "mean")
      return 0;
    let minOutput = $("#min-output-input").val();
    minOutput = clamp(minOutput, -100, -1);
    return minOutput;
  }
  function setMinOutput(val) {
    $("#min-output-input").val(val);
  }
  function getMaxOutput() {
    if (getDevPlotMode() == "mean")
      return 100;
    let maxOutput = $("#max-output-input").val();
    maxOutput = clamp(maxOutput, 1, 1e3);
    return maxOutput;
  }
  function setMaxOutput(val) {
    $("#max-output-input").val(val);
  }
  function getOutputMidpoint() {
    if (getDevPlotMode() != "mean")
      return 0;
    return +$(".baseline-row").find(".mean-value").eq(0).val();
  }
  function getBandWidth() {
    let bandWidth = $("#band-width-input").val();
    bandWidth = clamp(bandWidth, 1, 1e3);
    return bandWidth;
  }
  function setBandWidth(val) {
    $("#band-width-input").val(val);
  }
  function getColourScheme() {
    return $("#color-select").val();
  }
  function setColourScheme(val) {
    $("#color-select").val(val);
  }
  function getMinColor() {
    return $("#min-color-input").val();
  }
  function setMinColor(val) {
    $("#min-color-input").val(val);
  }
  function getMaxColor() {
    return $("#max-color-input").val();
  }
  function setMaxColor(val) {
    $("#max-color-input").val(val);
  }
  function getFanMode() {
    return $("#fan-select").val() == "fan";
  }
  function setFanMode(val) {
    if (val)
      $("#fan-select").val("fan");
    else
      $("#fan-select").val("radar");
  }
  function getDataSorting() {
    return +$("#sort-option").find(":selected").val();
  }
  function setDataSorting(val) {
    $("#sort-option").val(val);
  }
  function disableRowButtonTabs() {
    $("button.remove-condition, button.add-condition").attr("tabindex", "-1");
  }
  function enableRowButtonTabs() {
    $("button.remove-condition, button.add-condition").removeAttr("tabindex");
  }
  function navigateToRowButtons(e) {
    const currentCell = $(e.delegateTarget);
    const currentRow = currentCell.parent("tr");
    if (currentRow.length != 1)
      return console.error("navigateCell method called on an element whose parent isn't a table row");
    const removeRowButton = currentRow.find("button.remove-condition");
    const addRowButton = currentRow.find("button.add-condition");
    if (!addRowButton && !removeRowButton)
      return;
    let targetButton = removeRowButton;
    if (targetButton.attr("disabled")) {
      targetButton = addRowButton;
    }
    if (targetButton[0])
      targetButton[0].focus();
    const quillEl = currentCell.find(".condition-input");
    if (quillEl[0]) {
      const selector = "#" + quillEl.attr("id");
      disableQuillToolbar(selector);
    }
  }
  function navigateCell(e) {
    const currentCell = $(e.delegateTarget);
    const currentRow = currentCell.parent("tr");
    if (currentRow.length != 1)
      return console.error("navigateCell method called on an element whose parent isn't a table row");
    const parentTable = currentRow.parent("tbody");
    if (parentTable.length != 1)
      return console.error("navigateCell method called in a row whose parent isn't a tbody element");
    const cellIndex = $.inArray(currentCell[0], currentRow.children("td"));
    let newCellIndex = cellIndex;
    const rowIndex = $.inArray(currentRow[0], parentTable.children("tr"));
    let newRowIndex = rowIndex;
    const lRows = parentTable.children("tr");
    const numRows = lRows.length;
    const numCells = currentRow.children("td").length;
    const advanceEnter = function() {
      ++newRowIndex;
      if (newRowIndex > numRows) {
        newRowIndex = 0;
        ++newCellIndex;
        if (newCellIndex > numCells) {
          newCellIndex = 0;
        }
      }
    };
    const reverseEnter = function() {
      --newRowIndex;
      if (newRowIndex < 0) {
        newRowIndex = numRows - 1;
        --newCellIndex;
        if (newCellIndex < 0) {
          newCellIndex = numCells - 1;
        }
      }
    };
    const noAdvance = function() {
    };
    let advance = noAdvance;
    if (e.code === "Enter" || e.code === "NumpadEnter") {
      if (e.shiftKey)
        advance = reverseEnter;
      else
        advance = advanceEnter;
    }
    let foundInput = false;
    while (!foundInput) {
      advance();
      const newRow = lRows.eq(newRowIndex);
      const newCell = newRow.children("td").eq(newCellIndex);
      const eToFocus = newCell.find("input, .ql-editor");
      if (eToFocus.length >= 1 && eToFocus.attr("disabled") != "disabled" && eToFocus.attr("type") != "radio") {
        foundInput = true;
        eToFocus[0].focus();
        if (eToFocus[0].select) {
          eToFocus[0].select();
        } else {
          const quill = getQuillEditor("#" + eToFocus.parent().attr("id"));
          quill.setSelection(0, quill.getLength());
        }
      }
    }
  }
  function getPlotData() {
    let data = {
      "software-version": version,
      "title": getTitle(),
      "outcome-value": getOutcomeValue(),
      "outcome-text": getOutputLabel(),
      "value-to-plot": getDevPlotMode(),
      "plot-width": getWidth(),
      "plot-height": getHeight(),
      "label-font-size": getLabelFontSize(),
      "axis-font-size": getAxisFontSize(),
      "min-output": getMinOutput(),
      "max-output": getMaxOutput(),
      "band-width": getBandWidth(),
      "fan-display": getFanMode(),
      "color-scheme": getColourScheme(),
      "min-color": getMinColor(),
      "max-color": getMaxColor(),
      "data-arrangement": getDataSorting()
    };
    const numConditions = getNumConditions(), numSamples = getNumSamples();
    const lBaselineCells = $(".baseline-row").find(".baseline-value-cell");
    const lBaselineSamples = [];
    for (let k2 = 0; k2 < numSamples; k2++) {
      const baselineSampleVal = lBaselineCells.eq(k2).find(".baseline-value").val();
      if (baselineSampleVal != "") {
        lBaselineSamples.push(+baselineSampleVal);
      } else {
        lBaselineSamples.push("");
      }
    }
    data["baseline-samples"] = lBaselineSamples;
    data["condition-labels"] = getLConditionLabels();
    const lConditionRows = $(".condition-row");
    const llConditionSamples = [];
    for (let i = 0; i < numConditions; i++) {
      const conditionRow = lConditionRows.eq(i);
      const lConditionCells = conditionRow.find(".sample-value-cell");
      const lConditionSamples = [];
      llConditionSamples.push(lConditionSamples);
      for (let k2 = 0; k2 < numSamples; k2++) {
        const conditionSampleVal = lConditionCells.eq(k2).find(".sample-value").val();
        if (conditionSampleVal != "") {
          lConditionSamples.push(+conditionSampleVal);
        } else {
          lConditionSamples.push("");
        }
      }
    }
    data["condition-samples"] = llConditionSamples;
    return data;
  }
  async function loadPlotData() {
    if (checkIsDirty()) {
      if (!confirm(DIRTY_FORMS_MESSAGE)) {
        return;
      }
    }
    const fileInput = $("#load-data-file")[0];
    const file = fileInput.files[0];
    loadObject(file, (data) => {
      const lastAutoUpdating = autoUpdating;
      if (autoUpdating)
        disableAutoUpdates();
      autoUpdating = false;
      fileInput.value = null;
      setTitle(data["title"]);
      setOutcomeValue(data["outcome-value"]);
      setOutputLabel(data["outcome-text"]);
      setDevPlotMode(data["value-to-plot"]);
      setWidth(data["plot-width"]);
      setHeight(data["plot-height"]);
      setLabelFontSize(data["label-font-size"]);
      setAxisFontSize(data["axis-font-size"]);
      setMinOutput(data["min-output"]);
      setMaxOutput(data["max-output"]);
      setBandWidth(data["band-width"]);
      setFanMode(data["fan-display"]);
      setColourScheme(data["color-scheme"]);
      setMinColor(data["min-color"]);
      setMaxColor(data["max-color"]);
      setDataSorting(data["data-arrangement"]);
      const llSamples = data["condition-samples"];
      const numConditions = llSamples.length;
      const numSamples = llSamples[0].length;
      setNumDim(CONDITION, numConditions);
      setNumDim(SAMPLE, numSamples);
      const lConditionLabels = data["condition-labels"];
      setLConditionLabels(lConditionLabels);
      const lBaselineSamples = data["baseline-samples"];
      const lBaselineCells = $(".baseline-row").find(".baseline-value-cell");
      for (let k2 = 0; k2 < numSamples; k2++) {
        lBaselineCells.eq(k2).find(".baseline-value").val(lBaselineSamples[k2]);
      }
      const lConditionRows = $(".condition-row");
      for (let i = 0; i < numConditions; i++) {
        const conditionRow = lConditionRows.eq(i);
        const lConditionCells = conditionRow.find(".sample-value-cell");
        for (let k2 = 0; k2 < numSamples; k2++) {
          lConditionCells.eq(k2).find(".sample-value").val(llSamples[i][k2]);
        }
      }
      if (lastAutoUpdating)
        enableAutoUpdates();
      cleanDirtyForms();
    });
  }
  function makeSensitivityTable(plotData, clean = false) {
    const lBaselineSamples = plotData["baseline-samples"];
    const lConditionLabels = plotData["condition-labels"];
    const llConditionSamples = plotData["condition-samples"];
    const numSamples = lBaselineSamples.length;
    const numConditions = lConditionLabels.length;
    const devPlotMode = getDevPlotMode();
    const includeDev = !(devPlotMode == "mean" && numSamples == 1);
    const lDevValueInputs = $(`input.${D_DEV_PLOT_MODE_INFO[devPlotMode].key}-value`);
    const lRows = [];
    const headerRow = ["Test parameter"];
    const outputLabel = getOutputLabel();
    if (numSamples == 1) {
      headerRow.push(outputLabel);
    } else {
      for (let j2 = 0; j2 < numSamples; ++j2) {
        headerRow.push(`${outputLabel} ${j2 + 1}`);
      }
    }
    if (includeDev)
      headerRow.push(D_DEV_PLOT_MODE_INFO[getDevPlotMode()].label);
    lRows.push(headerRow);
    const baselineRow = ["Standard Conditions"];
    lBaselineSamples.forEach((s) => baselineRow.push(s));
    baselineRow.push("");
    lRows.push(baselineRow);
    for (let i = 0; i < numConditions; ++i) {
      const newRow = [];
      newRow.push(lConditionLabels[i]);
      llConditionSamples[i].forEach((s) => newRow.push(s));
      if (includeDev)
        newRow.push(lDevValueInputs[i].value);
      lRows.push(newRow);
    }
    if (clean) {
      delete plotData["baseline-samples"];
      delete plotData["condition-labels"];
      delete plotData["condition-samples"];
    }
    return {
      arr: lRows,
      csv: makeCsv(lRows)
    };
  }
  function calcDeviation() {
    const numConditions = getNumConditions(), numOutputs = 1, numSamples = getNumSamples();
    const baselineRow = $(".baseline-row");
    const lBaselineCells = baselineRow.find(".baseline-value-cell");
    const lBaselineMeanInputs = baselineRow.find(".mean-value");
    const lBaselineMeans = [];
    const llBaselineSamples = [];
    for (let j2 = 0; j2 < numOutputs; j2++) {
      llBaselineSamples.push([]);
    }
    for (let k2 = 0; k2 < numSamples; k2++) {
      const baselineSampleCell = lBaselineCells.eq(k2);
      for (let j2 = 0; j2 < numOutputs; j2++) {
        const baselineSampleVal = baselineSampleCell.find(".baseline-value").eq(j2).val();
        if (baselineSampleVal != "") {
          llBaselineSamples[j2].push(+baselineSampleVal);
        }
      }
    }
    for (let j2 = 0; j2 < numOutputs; j2++) {
      const lBaselineSamples = llBaselineSamples[j2];
      let baselineMean;
      if (lBaselineSamples.length > 0)
        baselineMean = lBaselineSamples.reduce((a, b) => a + b) / lBaselineSamples.length;
      else
        baselineMean = DEFAULT_VALUE_MEAN;
      lBaselineMeans.push(baselineMean);
      lBaselineMeanInputs.eq(j2).val(Math.round(baselineMean));
    }
    const lConditionRows = $(".condition-row");
    for (let i = 0; i < numConditions; i++) {
      const conditionRow = lConditionRows.eq(i);
      const lConditionCells = conditionRow.find(".sample-value-cell");
      const llConditionSamples = [];
      for (let j2 = 0; j2 < numOutputs; j2++) {
        llConditionSamples.push([]);
      }
      for (let k2 = 0; k2 < numSamples; k2++) {
        const conditionSampleCell = lConditionCells.eq(k2);
        for (let j2 = 0; j2 < numOutputs; j2++) {
          const conditionSampleVal = conditionSampleCell.find(".sample-value").eq(j2).val();
          if (conditionSampleVal != "") {
            llConditionSamples[j2].push(+conditionSampleVal);
          }
        }
      }
      const lMeanInputs = conditionRow.find(".mean-input-line");
      const lAbsDeviationInputs = conditionRow.find(".abs-deviation-input-line");
      const lRelDeviationInputs = conditionRow.find(".rel-deviation-input-line");
      for (let j2 = 0; j2 < numOutputs; j2++) {
        const baselineMean = lBaselineMeans[j2];
        const lConditionSamples = llConditionSamples[j2];
        let conditionMean;
        if (lConditionSamples.length > 0)
          conditionMean = lConditionSamples.reduce((a, b) => a + b) / lConditionSamples.length;
        else
          conditionMean = baselineMean;
        const absDeviation = conditionMean - baselineMean;
        const relDeviation = (conditionMean - baselineMean) / baselineMean * 100;
        lMeanInputs.eq(j2).find(".mean-value").val(Math.round(conditionMean));
        lAbsDeviationInputs.eq(j2).find(".abs-deviation-value").val(Math.round(absDeviation));
        lRelDeviationInputs.eq(j2).find(".rel-deviation-value").val(Math.round(relDeviation));
      }
    }
  }
  async function generatePlot(context = null) {
    if (window.CookieConsent.acceptedCategory("analytics") && !reportedFirstInteraction) {
      if (setupPhase) {
        setupPhase = false;
      } else {
        window.gtag("event", "interaction");
        reportedFirstInteraction = true;
      }
    }
    let renderBatch = incrementRenderBatch();
    calcDeviation();
    const numConditions = getNumConditions(), numOutputs = 1;
    const minOutput = getMinOutput(), maxOutput = getMaxOutput(), outputMidpoint = getOutputMidpoint();
    const bandWidth = getBandWidth();
    const fanMode = getFanMode();
    const minColor = getMinColor(), maxColor = getMaxColor();
    const numAnglePoints = numConditions * BAR_SIZE;
    const llData = [];
    const lOutputLabels = [];
    const lOrder = [];
    const lBorderColors = [], lBorderWidths = [];
    const lBackgroundColors = [], lFill = [];
    const lBorderDashes = [];
    let numAxisLines;
    let numBgColorsLow, numBgColorsHi, numBgColors;
    let numDatasetMultiplier;
    if (fanMode) {
      numAxisLines = numBgColorsLow = numBgColorsHi = numBgColors = 0;
      numDatasetMultiplier = numConditions;
    }
    lOutputLabels.push("");
    let lMidpointData = [];
    let numMidpointPoints = numConditions;
    if (fanMode)
      numMidpointPoints = numAnglePoints;
    for (let i = 0; i < numMidpointPoints; ++i) {
      lMidpointData.push(outputMidpoint);
    }
    llData.push(lMidpointData);
    lOrder.push(1);
    lBorderColors.push(BASELINE_COLOR), lBorderDashes.push([]);
    lBackgroundColors.push(BASELINE_COLOR), lFill.push(false);
    if (fanMode)
      lBorderWidths.push(0);
    else
      lBorderWidths.push(BASELINE_WIDTH);
    if (!fanMode) {
      const numLowBands = Math.ceil((outputMidpoint - minOutput) / bandWidth);
      const numHiBands = Math.ceil((maxOutput - outputMidpoint) / bandWidth);
      numBgColorsLow = numLowBands, numBgColorsHi = numHiBands + 1;
      numBgColors = numBgColorsLow + numBgColorsHi;
      numDatasetMultiplier = 1;
      const lBgColorBoundsLow = [], lBgOrderLow = [];
      for (let i = 0; i < numBgColorsLow; ++i) {
        lBgColorBoundsLow.push(Math.max(outputMidpoint - bandWidth * (i + 1), minOutput));
        lBgOrderLow.push(i + 1);
      }
      const lBgColorBoundsHi = [], lBgOrderHi = [];
      for (let i = 0; i < numBgColorsHi; ++i) {
        lBgColorBoundsHi.push(Math.min(outputMidpoint + bandWidth * i, maxOutput));
        lBgOrderHi.push(i + 1);
      }
      for (let k2 = 0; k2 < numBgColorsHi; ++k2) {
        lOutputLabels.push("");
        let lFakeData = [];
        for (let i = 0; i < numConditions; ++i) {
          lFakeData.push(lBgColorBoundsHi[k2]);
        }
        llData.push(lFakeData);
        lOrder.push(lBgOrderHi[k2]);
        let colorRatio = 1;
        if (numBgColorsHi > 1)
          colorRatio = k2 / (numBgColorsHi - 1);
        let backgroundColor = mixHexes(maxColor, "#FFFFFF", colorRatio);
        lBackgroundColors.push(backgroundColor), lFill.push(0);
        if (SHOW_GRID_LINES)
          lBorderColors.push(GRID_COLOR), lBorderWidths.push(GRID_WIDTH);
        else
          lBorderColors.push(backgroundColor), lBorderWidths.push(0);
        lBorderDashes.push([]);
      }
      for (let k2 = 0; k2 < numBgColorsLow; ++k2) {
        lOutputLabels.push("");
        let lFakeData = [];
        for (let i = 0; i < numConditions; ++i) {
          lFakeData.push(lBgColorBoundsLow[k2]);
        }
        llData.push(lFakeData);
        lOrder.push(lBgOrderLow[k2]);
        let colorRatio = (k2 + 1) / numBgColorsLow;
        let backgroundColor = mixHexes(minColor, "#FFFFFF", colorRatio);
        lBackgroundColors.push(backgroundColor), lFill.push(0);
        if (SHOW_GRID_LINES)
          lBorderColors.push(GRID_COLOR), lBorderWidths.push(GRID_WIDTH);
        else
          lBorderColors.push(backgroundColor), lBorderWidths.push(0);
        lBorderDashes.push([]);
      }
      if (SHOW_AXIS_LINES) {
        numAxisLines = numConditions;
        for (let k2 = 0; k2 < numConditions; ++k2) {
          lOutputLabels.push("");
          let lFakeData = [];
          for (let i = 0; i < numConditions; ++i) {
            if (i == k2)
              lFakeData.push(minOutput);
            else
              lFakeData.push(maxOutput);
          }
          llData.push(lFakeData);
          lOrder.push(-1);
          lBorderColors.push(GRID_COLOR), lBorderWidths.push(GRID_WIDTH), lBorderDashes.push([]);
          lBackgroundColors.push(DATA_BG_COLOR), lFill.push(false);
        }
      } else {
        numAxisLines = 0;
      }
    }
    const lConditionLabels = getLConditionLabels();
    const devPlotMode = getDevPlotMode();
    for (let j2 = 0; j2 < numOutputs; ++j2) {
      lOutputLabels.push(stripTags(getFullOutputLabel()));
      let lInvisibleData = [];
      let numInvisiblePoints = numConditions;
      if (fanMode)
        numMidpointPoints = numAnglePoints;
      for (let i = 0; i < numInvisiblePoints; ++i) {
        if (i == 0)
          lInvisibleData.push(outputMidpoint);
        else
          lInvisibleData.push(null);
      }
      llData.push(lInvisibleData);
      lOrder.push(999);
      lBorderColors.push("black"), lBorderWidths.push(BORDER_WIDTH), lBorderDashes.push(L_BORDER_DASHES[j2]);
      lBackgroundColors.push("white"), lFill.push(false);
    }
    for (let j2 = 0; j2 < numOutputs * numDatasetMultiplier; ++j2) {
      llData.push([]);
    }
    const lSensRows = $(".condition-row");
    const lConditionData = [];
    for (let i = 0; i < numConditions; ++i) {
      let lSingleConditionData = [];
      const devPlotModeKey = D_DEV_PLOT_MODE_INFO[devPlotMode].key;
      const lCells = lSensRows.eq(i).find(`.${devPlotModeKey}-value-cell`);
      const lInputs = lCells.eq(0).find(`input.${devPlotModeKey}-value`);
      for (let j2 = 0; j2 < numOutputs; ++j2) {
        lSingleConditionData.push(lInputs[j2].value);
      }
      lConditionData.push({
        label: stripTags(lConditionLabels[i]),
        labelHTML: lConditionLabels[i],
        data: lSingleConditionData,
        displayIndex: i
      });
    }
    let sort_mode = getDataSorting();
    lConditionData.sort(function(a, b) {
      return (a.data[0] - b.data[0]) * sort_mode;
    });
    lConditionData.map((d3, i) => {
      d3.displayIndex = i;
    });
    let lOutputConditionLabels = lConditionLabels;
    if (fanMode) {
      lOutputConditionLabels = [];
      for (let l = 0; l < numAnglePoints; ++l)
        lOutputConditionLabels.push("");
    }
    for (let i = 0; i < numConditions; ++i) {
      let conditionData = lConditionData[i];
      if (fanMode) {
        for (let j2 = 0; j2 < numOutputs; ++j2) {
          const lData = llData[1 + numBgColors + numAxisLines + i + j2 * numConditions + numOutputs];
          const tipCenter = BAR_SIZE * (i + 0.5 + 0.5 * j2 / numOutputs);
          for (let l = 0; l < numAnglePoints; ++l) {
            if (j2 == 0 && l == tipCenter) {
              lOutputConditionLabels[l] = conditionData.label;
              conditionData.displayIndex = l;
            }
            let tipDistance = Math.abs(l - tipCenter);
            if (tipDistance > numAnglePoints / 2)
              tipDistance = numAnglePoints - tipDistance;
            if (tipDistance <= TIP_SIZE)
              lData.push(clamp(conditionData.data[j2], minOutput, maxOutput));
            else if (tipDistance <= TIP_SIZE + 1)
              lData.push(outputMidpoint);
            else if (j2 == 0 && tipDistance <= TIP_SIZE + BASE_SEPARATION + 1)
              lData.push(outputMidpoint);
            else
              lData.push(null);
          }
        }
      } else {
        lOutputConditionLabels[i] = conditionData.label;
        for (let j2 = 0; j2 < numOutputs; ++j2) {
          llData[1 + numBgColors + numAxisLines + j2 + numOutputs].push(clamp(conditionData.data[j2], minOutput, maxOutput));
        }
      }
    }
    for (let j2 = 0; j2 < numOutputs; ++j2) {
      for (let i = 0; i < numDatasetMultiplier; ++i) {
        lOutputLabels.push("");
        lOrder.push(0);
        lBorderColors.push("black"), lBorderWidths.push(BORDER_WIDTH), lBorderDashes.push(L_BORDER_DASHES[j2]);
        if (fanMode) {
          let color;
          let clampedVal = clamp(lConditionData[i].data[j2], minOutput, maxOutput);
          if (clampedVal >= outputMidpoint) {
            if (maxOutput == outputMidpoint) {
              color = maxColor;
            } else {
              let colorRatio = (clampedVal - outputMidpoint) / (maxOutput - outputMidpoint);
              color = mixHexes(maxColor, "#FFFFFF", colorRatio);
            }
          } else {
            if (minOutput == outputMidpoint) {
              color = minColor;
            } else {
              let colorRatio = (outputMidpoint - clampedVal) / (outputMidpoint - minOutput);
              color = mixHexes(minColor, "#FFFFFF", colorRatio);
            }
          }
          lBackgroundColors.push(color);
          lFill.push(0);
        } else {
          lBackgroundColors.push(DATA_BG_COLOR);
          lFill.push(false);
        }
      }
    }
    const lDatasets = [];
    for (let j2 = 0; j2 < 1 + numBgColors + numAxisLines + numOutputs * (1 + numDatasetMultiplier); ++j2) {
      lDatasets.push({
        label: lOutputLabels[j2],
        data: llData[j2],
        order: lOrder[j2],
        borderColor: lBorderColors[j2],
        borderWidth: lBorderWidths[j2],
        backgroundColor: lBackgroundColors[j2],
        borderDash: lBorderDashes[j2],
        pointRadius: 0,
        fill: lFill[j2]
      });
    }
    const labelFontSize = getLabelFontSize();
    let alignmentFontSize = labelFontSize;
    if (getWebKitMode())
      alignmentFontSize *= WEBKIT_FONT_SCALING;
    const plotROptions = {
      grid: {
        circular: fanMode
      },
      min: minOutput,
      max: maxOutput,
      pointLabels: {
        font: {
          family: LABEL_FONT_FAMILY,
          size: alignmentFontSize
        },
        // Hide the normal label, since we implement it ourselves with custom styling. We still use it so we get the
        // optimal positioning, which is why we don't filter it all out.
        color: COLOR_TRANSPARENT
      },
      reverse: true,
      ticks: {
        stepSize: bandWidth,
        z: 2,
        font: {
          family: LABEL_FONT_FAMILY,
          size: getAxisFontSize()
        }
      }
    };
    const plotLegendOptions = {
      position: "bottom",
      labels: {
        boxHeight: alignmentFontSize,
        boxWidth: alignmentFontSize,
        font: {
          family: LABEL_FONT_FAMILY,
          size: alignmentFontSize,
          weight: "bold"
        },
        // Hide the normal label, since we implement it ourselves with custom styling. We still use it so we get the
        // optimal positioning, which is why we don't filter it all out.
        color: COLOR_TRANSPARENT,
        filter: function(legendLabel, _) {
          return legendLabel.text != "";
        }
      }
    };
    const titleHTML = getTitle();
    const titleHTMLText = stripTags(titleHTML);
    const plotTitleOptions = {
      display: titleHTMLText != "",
      text: titleHTMLText,
      font: {
        family: LABEL_FONT_FAMILY,
        size: alignmentFontSize,
        weight: "bold"
      },
      // Hide the normal label, since we implement it ourselves with custom styling. We still use it so we get the
      // optimal positioning, which is why we don't filter it all out.
      color: COLOR_TRANSPARENT
    };
    let plot;
    if (gloriusPlot === null || context !== null) {
      let config = {
        type: "radar",
        data: {
          labels: lOutputConditionLabels,
          datasets: lDatasets
        },
        plugins: [customCanvasBackgroundColorPlugin],
        options: {
          aspectRatio: getAspectRatio(),
          events: [],
          responsive: false,
          scales: {
            r: plotROptions
          },
          plugins: {
            customCanvasBackgroundColor: {
              color: "#FFFFFF"
            },
            legend: plotLegendOptions,
            title: plotTitleOptions
          },
          animation: false
        }
      };
      let usingDefaultContext = true;
      if (context === null) {
        context = CHART_ID;
      } else {
        usingDefaultContext = false;
      }
      plot = new Chart(context, config);
      if (usingDefaultContext) {
        gloriusPlot = plot;
      }
    } else {
      plot = gloriusPlot;
      plot.data = {
        labels: lOutputConditionLabels,
        datasets: lDatasets
      };
      plot.options.aspectRatio = getAspectRatio();
      plot.options.scales.r = plotROptions;
      plot.options.plugins.legend = plotLegendOptions;
      plot.options.plugins.title = plotTitleOptions;
      plot.resize(getWidth(), getHeight());
      plot.update();
    }
    await waitForMathJax();
    const ctx = plot.ctx;
    const titleBlock = plot.titleBlock;
    drawFormatted(
      ctx,
      titleHTML,
      (titleBlock.left + titleBlock.right) / 2,
      titleBlock.top + titleBlock.options.padding + 0.125 * labelFontSize,
      labelFontSize,
      "center",
      renderBatch
    );
    let legendLeftOffset, legendTopOffset;
    const legendHitBox = plot.legend.legendHitBoxes[0];
    if (legendHitBox) {
      if (getWebKitMode()) {
        legendLeftOffset = 1.5 * alignmentFontSize - 0.0325 * legendHitBox.width;
        legendTopOffset = 0.05 * alignmentFontSize;
      } else {
        legendLeftOffset = 1.5 * labelFontSize;
        legendTopOffset = 0;
      }
      drawFormatted(
        ctx,
        getFullOutputLabel(),
        legendHitBox.left + legendLeftOffset,
        legendHitBox.top + legendTopOffset,
        labelFontSize,
        "left",
        renderBatch
      );
    }
    const lPointLabelItems = plot.scales.r._pointLabelItems;
    for (let i = 0; i < lConditionData.length; ++i) {
      const conditionData = lConditionData[i];
      const labelData = lPointLabelItems[conditionData.displayIndex];
      drawFormatted(
        ctx,
        conditionData.labelHTML,
        (labelData.left + labelData.right) / 2,
        labelData.y + 0.125 * labelFontSize,
        labelFontSize,
        "center",
        renderBatch
      );
    }
  }
  function generateIfUpdating() {
    if (autoUpdating)
      generatePlot();
  }
  async function exportSvg() {
    if (window.CookieConsent.acceptedCategory("analytics")) {
      window.gtag("event", "download_plot", { format: "svg" });
    }
    $("#export-image-buttons .loading-spinner").removeClass("hidden");
    const ctx = C2S(getWidth(), getHeight());
    generatePlot(ctx);
    let renderFailed = false;
    await renderingComplete().catch((reason) => {
      renderFailed = true;
      alert("Error rendering plot: " + reason);
    });
    if (renderFailed) {
      $("#export-image-buttons .loading-spinner").addClass("hidden");
      return;
    }
    const serializedSvg = ctx.getSerializedSvg(true);
    $("#export-image-buttons .loading-spinner").addClass("hidden");
    saveText(serializedSvg, "glorius_plot.svg");
  }
  function fillRandom() {
    if (checkIsDirty()) {
      if (!confirm(DIRTY_FORMS_MESSAGE)) {
        return;
      }
    }
    const lastAutoUpdating = autoUpdating;
    if (autoUpdating)
      disableAutoUpdates();
    for (let i = 0; i < getNumConditions(); ++i) {
      updateQuillContents("#cl-" + i, i + 1);
    }
    const lBaselineInputs = $(".baseline-value");
    for (let k2 = 0; k2 < lBaselineInputs.length; ++k2) {
      let val = RAND_BASELINE_MIN + Math.random() * (RAND_BASELINE_MAX - RAND_BASELINE_MIN);
      lBaselineInputs[k2].value = Math.round(val);
    }
    const lDataCells = $(".sample-value");
    for (let k2 = 0; k2 < lDataCells.length; ++k2) {
      let val = VALUE_MIN + Math.random() * (VALUE_MAX - VALUE_MIN);
      lDataCells[k2].value = Math.round(val);
    }
    if (lastAutoUpdating)
      enableAutoUpdates();
    cleanDirtyForms();
  }
  function fillExample() {
    if (checkIsDirty()) {
      if (!confirm(DIRTY_FORMS_MESSAGE)) {
        setTimeout(clearTooltips, 100);
        return;
      }
    }
    const lastAutoUpdating = autoUpdating;
    if (autoUpdating)
      disableAutoUpdates();
    setNumDim(CONDITION, 10), setNumDim(SAMPLE, 1);
    $("#title-input .ql-editor p").html("<b>Reaction-condition sensitivity analysis for 1,3-cyclization</b>");
    $(".output-label-select").val("Isolated Yield (%)").trigger("change");
    updateQuillContents("#cl-0", "High <em>c</em>");
    updateQuillContents("#cl-1", "Low <em>c</em>");
    updateQuillContents("#cl-2", "H<sub>2</sub>O");
    updateQuillContents("#cl-3", "Low O<sub>2</sub>");
    updateQuillContents("#cl-4", "High O<sub>2</sub>");
    updateQuillContents("#cl-5", "Low <em>T</em>");
    updateQuillContents("#cl-6", "High <em>T</em>");
    updateQuillContents("#cl-7", "Low <em>I</em>");
    updateQuillContents("#cl-8", "High <em>I</em>");
    updateQuillContents("#cl-9", "Big scale");
    $(".baseline-value").eq(0).val("58");
    const lDataCells = $(".sample-value");
    lDataCells.eq(0).val("48");
    lDataCells.eq(1).val("20");
    lDataCells.eq(2).val("26");
    lDataCells.eq(3).val("49");
    lDataCells.eq(4).val("14");
    lDataCells.eq(5).val("47");
    lDataCells.eq(6).val("40");
    lDataCells.eq(7).val("46");
    lDataCells.eq(8).val("13");
    lDataCells.eq(9).val("50");
    calcDeviation();
    if (lastAutoUpdating)
      enableAutoUpdates();
    updateROCrateForm(false, true);
    updateQuillContents("#rocrate-baseline-desc", "To a 10 mL Schlenk tube equipped with a Teflon-coated magnetic stir bar, BCB (0.2 mmol, 1.0 equiv.), Na<sub>2</sub>CO<sub>3</sub> (2.0 equiv.) and <em>fac</em>-Ir(ppy)3 (0.03 equiv.) were added. The Schlenk tube was evacuated and backfilled with argon three times. Subsequently, <em>tert</em>-butyl bromoacetate (0.22 mmol, 1.1 equiv.) and MeCN:CH<sub>2</sub>Cl<sub>2</sub> (1:1) 1.0 mL were added against the positive flow of argon. For entry 5, the reaction was prepared similar under air.  All reactions were then stirred under irradiation with blue LEDs (30 W, \u03BB<sub>max</sub> = 450 nm) at rt (30 \xB0C to 35 \xB0C) for 2 h. Later, the reaction mixture passed through a celite plug and the solvent was removed in vacuo. The yield was determined by crude NMR.");
    updateQuillContents("#rcdi-0", "- 0.6 mL");
    updateQuillContents("#rcdi-1", "+ 1.5 mL");
    updateQuillContents("#rcdi-2", "+ 10 \xB5l H<sub>2</sub>O");
    updateQuillContents("#rcdi-3", "degassed");
    updateQuillContents("#rcdi-4", "+ 10 ml air");
    updateQuillContents("#rcdi-5", "0 \xB0C");
    updateQuillContents("#rcdi-6", "55 \xB0C");
    updateQuillContents("#rcdi-7", "20 cm distance to the LED");
    updateQuillContents("#rcdi-8", "2 cm distance to the LED");
    updateQuillContents("#rcdi-9", "standard scale \xD7 30");
    $("#rocrate-license-cc-by-4\\.0").prop("checked", true).change();
    $("select#num-contrib").val(6).change();
    $("#rni-0").val("Fuhao Zhang"), $("#roi-0").val("0000-0003-0649-2707");
    $("#rni-1").val("Subhabrata Dutta"), $("#roi-1").val("0000-0002-6041-557X");
    $("#rni-2").val("Alessia Petti"), $("#roi-2").val("0000-0002-9732-6079");
    $("#rni-3").val("Debanjan Rana"), $("#roi-3").val("https://onlinelibrary.wiley.com/authored-by/Rana/Debanjan");
    $("#rni-4").val("Constantin G. Daniliuc"), $("#roi-4").val("0000-0002-6709-3673");
    $("#rni-5").val("Frank Glorius"), $("#roi-5").val("0000-0002-0648-956X");
    $("#rocrate-email-input").val("glorius@uni-muenster.de");
    userHasEditedCitation = true;
    setTimeout(() => {
      let datasetTitle = cleanTags(getQuillEditorHTML("#rocrate-title-input"));
      const date = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      updateQuillContents("#rocrate-citation", `Please cite: <em>F.Zhang, S.Dutta, A.Petti, D.Rana, C. G.Daniliuc, F.Glorius</em>, Angew. Chem. Int. Ed.2025, 64, e202418239. https://doi.org/10.1002/anie.202418239. ${datasetTitle} generated by PSDI Glorius Plot Generator version ${version} (${date}).`);
    }, 100);
    cleanDirtyForms();
    setTimeout(clearTooltips, 100);
  }
  function scrollToSection(selector) {
    $(selector)[0].scrollIntoView({ behavior: "smooth" });
    window.history.pushState({}, "", selector);
  }
  function startROCrateExport(scroll = true) {
    if (window.CookieConsent.acceptedCategory("analytics")) {
      window.gtag("event", "config_rocrate");
    }
    $(".hidden-after-rocrate").addClass("hidden");
    $(".hidden-until-rocrate").removeClass("hidden");
    $(".rocrate-export").removeClass("hidden");
    roCrateFormUpdating = true;
    updateROCrateForm(true);
    updateROCrateDownloadEnabled();
    if (scroll)
      scrollToSection("#rocrate-export-title");
  }
  async function updateROCrateForm(firstTime = false, example = false) {
    updateROCrateOutputLabel();
    if (firstTime || example) {
      initCondDescs();
      enableQuillEventsAndCallbacks();
      setTimeout(useDefaultROCrateTitleDesc, 100);
    }
    if (firstTime && !userHasEditedCitation) {
      setTimeout(useDefaultCitation, 100);
    }
  }
  function updateROCrateOutputLabel() {
    if (!roCrateFormUpdating)
      return;
    let outputLabel = getOutputLabel();
    if ($(".output-label-select").val() != "Other")
      outputLabel = outputLabel.toLowerCase();
    else if (outputLabel == "")
      outputLabel = "outcome";
    $('label[for="baseline-desc-container"]').html(BASELINE_DESC_INFO_TEXT.replace("REPLACEME", outputLabel));
  }
  function initCondDescs() {
    const numRows = getNumConditions();
    setNumROCrateCondRow(numRows);
    for (let i = 0; i < numRows; ++i) {
      updateCondDescLabel(i);
    }
  }
  function addROCrateCondRow(targetRowIndex = -1, updateAfter = true) {
    const descTable = $("#rocrate-cond-desc-table>tbody");
    const newRow = $(".rocrate-cond-row").eq(0).clone();
    newRow.find(".rocrate-cond-desc-label").html(":");
    newRow.find(".rocrate-cond-desc-input .ql-editor").html("");
    if (targetRowIndex == -1) {
      targetRowIndex = descTable.find("tr").length - 1;
      descTable.append(newRow);
    } else {
      descTable.find("tr").eq(targetRowIndex).after(newRow);
    }
    relabelCondDesc();
    const newNumConditions = $(".rocrate-cond-row").length;
    for (let i = newNumConditions - 1; i > targetRowIndex + 1; --i) {
      setQuillEditor("#rcdi-" + i, getQuillEditor("#rcdi-" + (i - 1)));
      removeQuillEditor("#rcdi-" + (i - 1));
    }
    addQuillEditor("#rcdi-" + (targetRowIndex + 1), CONDITION_DESC_PLACEHOLDER);
    if (updateAfter)
      enableQuillEventsAndCallbacks();
  }
  function removeROCrateCondRow(targetRowIndex = -1, updateAfter = true) {
    const descTable = $("#rocrate-cond-desc-table>tbody");
    const lRows = descTable.find("tr");
    const oldNumConditions = lRows.length;
    if (targetRowIndex == -1) {
      targetRowIndex = oldNumConditions - 1;
    }
    removeQuillEditor("#rcdi-" + targetRowIndex);
    lRows.eq(targetRowIndex).remove();
    relabelCondDesc();
    for (let i = targetRowIndex; i < oldNumConditions - 1; ++i) {
      setQuillEditor("#rcdi-" + i, getQuillEditor("#rcdi-" + (i + 1)));
      removeQuillEditor("#rcdi-" + (i + 1));
    }
    if (updateAfter)
      enableQuillEventsAndCallbacks();
  }
  function setNumROCrateCondRow(num) {
    const oldNum = $("#rocrate-cond-desc-table tr").length;
    if (oldNum < num) {
      for (let i = 0; i < num - oldNum; ++i) {
        addROCrateCondRow(-1, false);
      }
    } else if (oldNum > num) {
      for (let i = 0; i < oldNum - num; ++i) {
        removeROCrateCondRow(-1, false);
      }
    } else {
      return;
    }
    enableQuillEventsAndCallbacks();
  }
  function relabelCondDesc() {
    const num = $(".rocrate-cond-row").length;
    const lLabels = $(".rocrate-cond-desc-label");
    const lDescs = $(".rocrate-cond-desc-input");
    for (let i = 0; i < num; i++) {
      lLabels.eq(i).attr("id", `rcdl-${i}`);
      lDescs.eq(i).attr("id", `rcdi-${i}`);
    }
  }
  function getNumContribs() {
    return $(".rocrate-contrib-row").length;
  }
  function addROCrateContribRow(e, updateAfter = true) {
    const newRow = $(".rocrate-contrib-row").eq(0).clone();
    newRow.find(".rocrate-name-input").val("");
    newRow.find(".rocrate-orcid-input").val("");
    const targetRowIndex = getTargetIndex(e, getNumContribs() - 1);
    $(".rocrate-contrib-row").eq(targetRowIndex).after(newRow);
    relabelContribs();
    if (updateAfter)
      postContribRowUpdate();
  }
  function removeROCrateContribRow(e, updateAfter = true) {
    const lRows = $(".rocrate-contrib-row");
    const targetRowIndex = getTargetIndex(e, getNumContribs() - 1);
    lRows.eq(targetRowIndex).remove();
    relabelContribs();
    if (updateAfter)
      postContribRowUpdate();
  }
  function setNumROCrateContribRow(e) {
    const oldNum = getNumContribs();
    const num = +$(e.target).find(":selected").val();
    if (oldNum < num) {
      for (let i = 0; i < num - oldNum; ++i) {
        addROCrateContribRow(null, false);
      }
    } else if (oldNum > num) {
      for (let i = 0; i < oldNum - num; ++i) {
        removeROCrateContribRow(null, false);
      }
    } else {
      return;
    }
    postContribRowUpdate();
  }
  function lookupOrcid(e) {
    const targetRowIndex = getTargetIndex(e, getNumContribs() - 1);
    const targetRow = $(".rocrate-contrib-row").eq(targetRowIndex);
    const authorName = targetRow.find(".rocrate-name-input").val();
    const lookupUrl = `https://orcid.org/orcid-search/search?searchQuery=${authorName.replace(" ", "%20")}`;
    window.open(lookupUrl, "_blank").focus();
  }
  function relabelContribs() {
    const num = getNumContribs();
    const lRemoveButtons = $(".remove-contrib");
    const lAddButtons = $(".add-contrib");
    const lNameLabels = $(".rocrate-name-label");
    const lNameInputs = $(".rocrate-name-input");
    const lOrcidButtons = $(".rocrate-orcid-lookup");
    const lOrcidLabels = $(".rocrate-orcid-label");
    const lOrcidInputs = $(".rocrate-orcid-input");
    for (let i = 0; i < num; i++) {
      lRemoveButtons.eq(i).attr("id", `remove-rcb-${i}`);
      lAddButtons.eq(i).attr("id", `add-rcb-${i}`);
      lNameLabels.eq(i).attr("id", `rnl-${i}`);
      lNameInputs.eq(i).attr("id", `rni-${i}`);
      lOrcidButtons.eq(i).attr("id", `rob-${i}`);
      lOrcidLabels.eq(i).attr("id", `rol-${i}`);
      lOrcidInputs.eq(i).attr("id", `roi-${i}`);
    }
  }
  function postContribRowUpdate() {
    const lAddContribButtons = $("button.add-contrib");
    const lRemoveContribButtons = $("button.remove-contrib");
    const lOrcidLookupButtons = $("button.rocrate-orcid-lookup");
    lAddContribButtons.off("click");
    lRemoveContribButtons.off("click");
    lOrcidLookupButtons.off("click");
    lAddContribButtons.on("click", addROCrateContribRow);
    lRemoveContribButtons.on("click", removeROCrateContribRow);
    lOrcidLookupButtons.on("click", lookupOrcid);
    const numContribs = getNumContribs();
    if (numContribs >= MAX_NUM_CONTRIBS)
      lAddContribButtons.attr("disabled", true);
    else
      lAddContribButtons.removeAttr("disabled");
    if (numContribs <= MIN_NUM_CONTRIBS)
      lRemoveContribButtons.attr("disabled", true);
    else
      lRemoveContribButtons.removeAttr("disabled");
    for (let i = 0; i < numContribs; ++i) {
      const e = $("#rni-" + i);
      e.off("change");
      e.on("change", () => {
        if (!userHasEditedCitation)
          useDefaultCitation();
      });
    }
    $("select#num-contrib").val(lAddContribButtons.length);
  }
  function updateCondDescLabel(i) {
    $("#rcdl-" + i).html(getConditionLabel(i) + ":");
  }
  function useDefaultROCrateTitleDesc(e) {
    if (e) {
      lastDatasetTitle = getQuillEditorHTML("#rocrate-title-input");
      lastDatasetDesc = getQuillEditorHTML("#rocrate-desc-input");
      lastDatasetAbout = getQuillEditorHTML("#rocrate-about");
      $("#rocrate-revert-title-desc").removeAttr("disabled");
    }
    const title = removeGlobalTags(getTitle());
    updateQuillContents("#rocrate-title-input", title);
    updateQuillContents("#rocrate-desc-input", title + " dataset generated by PSDI Glorius Plot Generator");
    updateQuillContents("#rocrate-about", DEFAULT_DATASET_ABOUT_TEXT);
  }
  function revertROCrateTitleDesc() {
    let tempDatasetTitle = getQuillEditorHTML("#rocrate-title-input");
    let tempDatasetDesc = getQuillEditorHTML("#rocrate-desc-input");
    let tempDatasetAbout = getQuillEditorHTML("#rocrate-about");
    updateQuillContents("#rocrate-title-input", lastDatasetTitle);
    updateQuillContents("#rocrate-desc-input", lastDatasetDesc);
    updateQuillContents("#rocrate-about", lastDatasetAbout);
    lastDatasetTitle = tempDatasetTitle;
    lastDatasetDesc = tempDatasetDesc;
    lastDatasetAbout = tempDatasetAbout;
  }
  function useDefaultCitation(e) {
    if (e) {
      lastCitation = getQuillEditorHTML("#rocrate-citation");
      userHasEditedCitation = false;
      $("#rocrate-revert-citation").removeAttr("disabled");
    }
    let datasetTitle = cleanTags(getQuillEditorHTML("#rocrate-title-input"));
    if (!datasetTitle)
      datasetTitle = "Data package";
    const date = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const lNames = [];
    $(".rocrate-name-input").each((_, nameInput) => {
      let name = nameInput.value;
      const lNameSegments = name.split(/\s+/u);
      let formattedName;
      if (!lNameSegments[0]) {
        return;
      } else if (lNameSegments.length == 1) {
        formattedName = name;
      } else {
        const lCommaSplitSegments = name.split(/,\s+/u);
        if (lCommaSplitSegments.length == 2) {
          formattedName = `${lCommaSplitSegments[0]}, ${forenameToInitials(lCommaSplitSegments[1])}`;
        } else {
          if (lCommaSplitSegments.length > 2) {
            lNameSegments.forEach((s, i) => {
              lNameSegments[i] = s.replace(",", "");
            });
          }
          const lCapsSurnameSegments = [];
          const lCapsForenameSegments = [];
          lNameSegments.forEach((s) => {
            const nonInitialSegment = s.replaceAll(/\w\./g, "");
            if (nonInitialSegment.length > 1 && s === s.toUpperCase()) {
              lCapsSurnameSegments.push(s);
            } else {
              lCapsForenameSegments.push(s);
            }
          });
          if (lCapsSurnameSegments.length > 0) {
            lCapsSurnameSegments.forEach((s, i) => {
              lCapsSurnameSegments[i] = surnameToCapitalized(s);
            });
            formattedName = `${lCapsSurnameSegments.join(" ")}, ${forenameToInitials(lCapsForenameSegments.join(" "))}`;
          } else {
            formattedName = `${lNameSegments.at(-1)}, ${forenameToInitials(lNameSegments.slice(0, -1).join(" "))}`;
          }
        }
      }
      lNames.push(formattedName);
    });
    let authorList;
    if (lNames.length == 0) {
      authorList = "";
    } else if (lNames.length == 1) {
      authorList = lNames[0];
    } else if (lNames.length == 2) {
      authorList = lNames[0];
      authorList = `${lNames[0]}; and ${lNames[1]}`;
    } else {
      authorList = "";
      for (let i = 0; i < lNames.length; ++i) {
        if (i < lNames.length - 1)
          authorList += `${lNames[i]}; `;
        else
          authorList += `and ${lNames[i]}`;
      }
    }
    if (authorList.length > 0 && authorList.at(-1) == ".") {
      authorList += " ";
    } else if (authorList.length > 0) {
      authorList += ". ";
    }
    const citation = `Please cite: <em>${authorList}</em>${datasetTitle} generated by PSDI Glorius Plot Generator version ${version} (${date}).`;
    const lastUserHasEditedCitation = userHasEditedCitation;
    updateQuillContents("#rocrate-citation", citation);
    if (e) {
      userHasEditedCitation = false;
    } else {
      userHasEditedCitation = lastUserHasEditedCitation;
    }
  }
  function revertCitation() {
    let tempCitation = getQuillEditorHTML("#rocrate-citation");
    updateQuillContents("#rocrate-citation", lastCitation);
    lastCitation = tempCitation;
    userHasEditedCitation = true;
  }
  function updateLicense() {
    const licenseNameInput = $("#rocrate-license-name");
    const licenseUrlInput = $("#rocrate-license-url");
    const license = $("input[name='rocrate-license']:checked").val();
    const licenseInfo = D_LICENSE_INFO[license];
    if (lastLicenseVal === "other" && license !== "other") {
      lastLicenseName = licenseNameInput.val();
      lastLicenseUrl = licenseUrlInput.val();
    }
    if (license === "other") {
      licenseNameInput.val(lastLicenseName);
      licenseUrlInput.val(lastLicenseUrl);
    } else {
      licenseNameInput.val(licenseInfo.name);
      licenseUrlInput.val(licenseInfo.url);
    }
    lastLicenseVal = license;
    if (license === "other") {
      licenseNameInput.removeAttr("disabled");
      licenseUrlInput.removeAttr("disabled");
      licenseNameInput.focus();
    } else {
      licenseNameInput.attr("disabled", true);
      licenseUrlInput.attr("disabled", true);
    }
  }
  function getLicenseInfo() {
    return {
      name: $("#rocrate-license-name").val(),
      url: $("#rocrate-license-url").val()
    };
  }
  function reactionSchemePresent() {
    return !!$("#rocrate-cdxml").val();
  }
  function updateReactionScheme() {
    if (reactionSchemePresent())
      $("#rocrate-reaction-scheme-li").removeClass("hidden");
    else
      $("#rocrate-reaction-scheme-li").addClass("hidden");
  }
  function getReactionScheme() {
    return $("#rocrate-cdxml")[0].files[0];
  }
  function reactionSchemeImgPresent() {
    return !!$("#rocrate-img").val();
  }
  function getReactionSchemeImg() {
    return $("#rocrate-img")[0].files[0];
  }
  function getBaselineDesc() {
    return getQuillEditorHTML("#rocrate-baseline-desc", false, true);
  }
  function baselineDescPresent() {
    return !!cleanTags(getBaselineDesc());
  }
  function checkBaselineDesc() {
    if (baselineDescPresent())
      $("#rocrate-baseline-li").removeClass("hidden");
    else
      $("#rocrate-baseline-li").addClass("hidden");
  }
  function getCondDescs() {
    const numConditions = getNumConditions();
    let lCondDescs = [];
    for (let i = 0; i < numConditions; ++i) {
      lCondDescs.push([getConditionLabel(i), getQuillEditorHTML("#rcdi-" + i)]);
    }
    return lCondDescs;
  }
  function condDescsPresent() {
    const numConditions = getNumConditions();
    for (let i = 0; i < numConditions; ++i) {
      if (getQuillEditorHTML("#rcdi-" + i))
        return true;
    }
    return false;
  }
  function checkCondDescs() {
    if (condDescsPresent())
      $("#rocrate-test-conditions-li").removeClass("hidden");
    else
      $("#rocrate-test-conditions-li").addClass("hidden");
  }
  function updateROCrateDownloadEnabled() {
    let allGood = true;
    Object.entries(exportChecks).forEach((check) => {
      if (!check)
        allGood = false;
    });
    if (allGood || debug)
      $("#rocrate-download").removeAttr("disabled");
    else
      $("#rocrate-download").attr("disabled", true);
  }
  function makeTextVersions(textHTML) {
    return {
      html: textHTML,
      md: HTMLToMd(cleanTags(textHTML)),
      txt: stripTags(textHTML)
    };
  }
  async function exportROCrate() {
    if (window.CookieConsent.acceptedCategory("analytics")) {
      window.gtag("event", "download_rocrate");
    }
    $(".rocrate-download-and-spinner .loading-spinner").removeClass("hidden");
    let renderFailed = false;
    await renderingComplete().catch((reason) => {
      renderFailed = true;
      $(".rocrate-download-and-spinner .loading-spinner").addClass("hidden");
      alert("Error rendering plot: " + reason);
    });
    if (renderFailed)
      return;
    const utcTime = /* @__PURE__ */ new Date();
    const localTime = new Date(utcTime - utcTime.getTimezoneOffset() * 60 * 1e3);
    const plotData = getPlotData();
    const rocrateInfo = {
      title: makeTextVersions(getQuillEditorHTML("#rocrate-title-input")),
      desc: makeTextVersions(getQuillEditorHTML("#rocrate-desc-input")),
      about: makeTextVersions(getQuillEditorHTML("#rocrate-about")),
      timestamp: localTime.toISOString(),
      version,
      reactionSchemeFile: reactionSchemePresent() && getReactionScheme(),
      reactionSchemeImg: reactionSchemeImgPresent() && getReactionSchemeImg(),
      baselineDesc: baselineDescPresent() && makeTextVersions(getBaselineDesc()),
      condDescTable: condDescsPresent() && makeCondDescTable(getCondDescs()),
      licenseInfo: getLicenseInfo(),
      bibInfo: makeBibInfo(),
      plotData,
      sensitivityTable: makeSensitivityTable(plotData, true),
      gloriusPlotPromise: new Promise((resolve, reject) => {
        $(CHART_SELECTOR)[0].toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Could not create blob from canvas " + CHART_SELECTOR));
          }
        });
      })
    };
    const rocrate = new JSZip();
    rocrate.file(ROCRATE_ROOT_DIR + "README.md", makeReadme(rocrateInfo));
    rocrate.file(ROCRATE_ROOT_DIR + "ro-crate-metadata.json", makeMetadata(rocrateInfo));
    rocrate.file(ROCRATE_ROOT_DIR + "ESI.pdf", makeESI(rocrateInfo));
    if (rocrateInfo.reactionSchemeFile)
      rocrate.file(ROCRATE_DATA_DIR + "reaction_scheme.cdxml", rocrateInfo.reactionSchemeFile);
    if (rocrateInfo.baselineDesc)
      rocrate.file(ROCRATE_DATA_DIR + "standard_conditions.html", makeBaselineDesc(rocrateInfo.baselineDesc.html));
    if (rocrateInfo.condDescTable)
      rocrate.file(ROCRATE_DATA_DIR + "test_conditions.csv", rocrateInfo.condDescTable.csv);
    rocrate.file(ROCRATE_PLOT_DIR + "user_preferences.json", JSON.stringify(rocrateInfo.plotData));
    rocrate.file(ROCRATE_PLOT_DIR + "sensitivity_table.csv", rocrateInfo.sensitivityTable.csv);
    rocrate.file(ROCRATE_PLOT_DIR + "glorius_plot.png", rocrateInfo.gloriusPlotPromise);
    rocrate.generateAsync({ type: "blob" }).then((blob) => {
      let timestamp = rocrateInfo.timestamp.replace(/[TZ]/g, "-").replace(/:|(\.\d*)/g, "");
      saveBlob(blob, timestamp + ROCRATE_FILENAME_BASE);
      cleanDirtyForms();
    }).catch((error) => {
      let msg = "Failed to generate data package";
      if (error)
        msg += ". The error message was:\n\n" + error;
      else
        msg += " for an unknown reason.";
      window.alert(msg);
    }).finally(() => {
      $(".rocrate-download-and-spinner .loading-spinner").addClass("hidden");
    });
  }
  function makeBibInfo() {
    const lNamesAndORCIDs = [];
    $(".rocrate-contrib-row").each((_, el) => {
      const oEl = $(el);
      const name = oEl.find(".rocrate-name-input").val();
      const orcId = oEl.find(".rocrate-orcid-input").val();
      lNamesAndORCIDs.push([name, orcId]);
    });
    const contactEmail = $("#rocrate-email-input").val();
    const citationHtml = cleanTags(getQuillEditorHTML("#rocrate-citation"));
    const citationMd = HTMLToMd(cleanTags(citationHtml));
    const bibInfo = {
      readmeInfo: formatReadmeBibInfo(lNamesAndORCIDs, contactEmail, citationMd),
      esiInfo: formatESIBibInfo(lNamesAndORCIDs, contactEmail, citationHtml)
    };
    [bibInfo.authorInfoText, bibInfo.bibInfoText] = formatMetadataBibInfo(lNamesAndORCIDs);
    return bibInfo;
  }
  function enableCanvasUpdate() {
    $("#width-input").on("change", updateWidth);
    $("#height-input").on("change", updateHeight);
    $("#label-font-size-input").on("change", updateFontSize);
  }
  function enableDeviationCalc() {
    disableDeviationCalc();
    $(".trigger-deviation-update").on("change", calcDeviation);
  }
  function disableDeviationCalc() {
    $(".trigger-deviation-update").off("change");
  }
  function enableAutoUpdates() {
    disableAutoUpdates();
    disableDeviationCalc();
    $(".trigger-chart-update, .trigger-deviation-update").on("change", () => generatePlot());
    autoUpdating = true;
    updateCanvasShape();
    generatePlot();
  }
  function enableToggles() {
    $("#auto-update-toggle").on("click", toggleAutoUpdates);
  }
  function enableButtons() {
    $("#fill-random").on("click", fillRandom);
    $("#fill-example").on("click", fillExample);
    $("#generate-plot").on("click", () => generatePlot());
    $("#export-image-png").on("click", () => {
      if (window.CookieConsent.acceptedCategory("analytics")) {
        window.gtag("event", "download_plot", { format: "png" });
      }
      exportImage(CHART_SELECTOR, "png", "#export-image-buttons .loading-spinner");
    });
    $("#export-image-svg").on("click", exportSvg);
    $("#export-rocrate-start").on("click", startROCrateExport);
    $("#save-data").on("click", () => saveObject(getPlotData(), "glorius_plot_data.json"));
    $("#load-data").on("click", () => $("#load-data-file").click());
    $("#load-data-file").on("change", loadPlotData);
    $("#reset-plot-dims").on("click", resetPlotDims);
    $("#returnToDataInput").on("click", () => scrollToSection("#data-input"));
    $(".returnToROCrateExport").on("click", () => scrollToSection("#rocrate-export-title"));
    $("#rocrate-default-title-desc").on("click", useDefaultROCrateTitleDesc);
    $("#rocrate-revert-title-desc").on("click", revertROCrateTitleDesc);
    $("#rocrate-default-citation").on("click", useDefaultCitation);
    $("#rocrate-revert-citation").on("click", revertCitation);
    $("#rocrate-download").on("click", exportROCrate);
  }
  function enableNavigation() {
    const inputElements = $("td.condition-label-cell, td.baseline-value-cell, td.sample-value-cell");
    enableRowButtonTabs();
    inputElements.off("focus");
    inputElements.on("focus", "input, .ql-editor", disableRowButtonTabs);
    inputElements.off("blur");
    inputElements.on("blur", "input, .ql-editor", enableRowButtonTabs);
    inputElements.off("keyup");
    inputElements.on("keyup", "input, .ql-editor", function(e) {
      if (e.code === "Enter" || e.code === "NumpadEnter" || e.code === "Tab") {
        e.preventDefault();
        navigateCell(e);
      } else if (e.code === "Escape") {
        navigateToRowButtons(e);
      }
    });
  }
  function enableOnChangeTriggers() {
    enableDeviationCalc();
    enableCanvasUpdate();
    $("#fan-select").on("change", toggleChartMode);
    $("#dev-plot-select").on("change", generateIfUpdating);
    $(".output-label-select").on("change", updateOutputLabelSelection);
    $("#color-select").on("change", updateColorSchemeSelection);
    $(".color-custom").on("change", selectCustomColorScheme);
    $(".plot-select").on("change", updatePlotSelect);
  }
  function disableAutoUpdates() {
    $(".trigger-chart-update").off("change");
    autoUpdating = false;
    enableOnChangeTriggers();
  }
  function toggleChartMode(e) {
    if ($(e.target).is(":checked"))
      document.documentElement.setAttribute("chart-mode", "fan");
    else
      document.documentElement.setAttribute("chart-mode", "radar");
  }
  function initNumDimControls(dim) {
    $("button.add-" + dim).off("click");
    $("button.remove-" + dim).off("click");
    $("select#num-" + dim).off("change");
    $("button.add-" + dim).on("click", (e) => addDim(dim, e, true));
    $("button.remove-" + dim).on("click", (e) => removeDim(dim, e, true));
    $("select#num-" + dim).on("change", (e) => setNumDim(dim, $(e.target).val()));
  }
  function updateOutputLabelSelection(e) {
    let newValue = this.value;
    let outcomeInputCell = $(".output-label-value-cell");
    let outcomeInput = $("#ol-0 .ql-editor p");
    if (newValue != "Other") {
      outcomeInputCell.addClass("hidden");
      outcomeInput.html(newValue);
    } else {
      outcomeInputCell.removeClass("hidden");
      outcomeInput.html("");
    }
  }
  function updateOutputLabel(label) {
    let lOutputHeadings = $(".sample-heading");
    let numSamples = getNumSamples();
    if (numSamples == 1) {
      lOutputHeadings.html(label);
    } else {
      for (let i = 0; i < numSamples; ++i) {
        lOutputHeadings.eq(i).html(label + " " + (i + 1).toString());
      }
    }
    updateMeanColumn();
  }
  function updateOutputLabelCallback() {
    updateOutputLabel(getOutputLabel());
    updateROCrateOutputLabel();
  }
  function updateColorSchemeSelection() {
    let newValue = this.value;
    if (newValue === lastColorVal)
      return;
    if (newValue !== "custom") {
      if (lastColorVal === "custom") {
        lastCustomColorMin = $("#min-color-input").val();
        lastCustomColorMax = $("#max-color-input").val();
      }
      $("#min-color-input").val(D_COLOR_SCHEMES[newValue].min);
      $("#max-color-input").val(D_COLOR_SCHEMES[newValue].max);
    } else if (lastCustomColorMin && lastColorVal !== "custom" && !userChangedColourInput) {
      $("#min-color-input").val(lastCustomColorMin);
      $("#max-color-input").val(lastCustomColorMax);
    }
    lastColorVal = newValue;
    generateIfUpdating();
  }
  function selectCustomColorScheme() {
    $("#color-select").val("custom");
    lastColorVal = "custom";
  }
  function updatePlotSelect() {
    const devPlotMode = getDevPlotMode();
    $(".sample-button-cell, .mean-heading, .abs-deviation-heading, .rel-deviation-heading").removeClass("col-selected-top");
    $(".sample-heading, .baseline-value-cell, .sample-value-cell, .baseline-mean-cell, .baseline-abs-deviation-cell, .baseline-rel-deviation-cell, .mean-value-cell, .abs-deviation-value-cell, .rel-deviation-value-cell").removeClass("col-selected");
    $(".plot-select-mean-cell, .plot-select-abs-cell, .plot-select-rel-cell").removeClass("col-selected-bottom");
    if (devPlotMode == "mean") {
      if (getNumSamples() == 1) {
        $(".sample-button-cell").addClass("col-selected-top");
        $(".sample-heading, .baseline-value-cell, .sample-value-cell").addClass("col-selected");
      } else {
        $(".mean-heading").addClass("col-selected-top");
        $(".baseline-mean-cell, .mean-value-cell").addClass("col-selected");
      }
      $(".plot-select-mean-cell").addClass("col-selected-bottom");
    } else if (devPlotMode == "absolute") {
      $(".abs-deviation-heading").addClass("col-selected-top");
      $(".baseline-abs-deviation-cell, .abs-deviation-value-cell").addClass("col-selected");
      $(".plot-select-abs-cell").addClass("col-selected-bottom");
    } else {
      $(".rel-deviation-heading").addClass("col-selected-top");
      $(".baseline-rel-deviation-cell, .rel-deviation-value-cell").addClass("col-selected");
      $(".plot-select-rel-cell").addClass("col-selected-bottom");
    }
    updateMinMaxOutputStatus();
  }
  function toggleAutoUpdates(e) {
    if ($(e.target).is(":checked"))
      enableAutoUpdates();
    else
      disableAutoUpdates();
  }
  function initGlobals() {
    lastAspectRatio = getAspectRatio();
    lastLabelFontSizeWidthRatio = getLabelFontSizeWidthRatio();
    lastLabelFontSizeHeightRatio = getLabelFontSizeHeightRatio();
    lastAxisFontSizeWidthRatio = getAxisFontSizeWidthRatio();
    lastAxisFontSizeHeightRatio = getAxisFontSizeHeightRatio();
    initWidth = getWidth(), initHeight = getHeight();
    initLabelFontSize = getLabelFontSize(), initAxisFontSize = getAxisFontSize();
  }
  function initTooltips() {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipList = [...tooltipTriggerList].map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl));
  }
  function initQuill() {
    addQuillEditor("#title-input", "e.g. \u201CReaction-condition sensitivity analysis\u201D");
    addQuillEditor("#ol-0", "Define outcome");
    $(".condition-input").each((i) => {
      addQuillEditor("#cl-" + i, CONDITION_PLACEHOLDER);
    });
    addQuillEditor("#rocrate-baseline-desc");
    $(".rocrate-cond-desc-input").each((i) => {
      addQuillEditor("#rcdi-" + i, CONDITION_DESC_PLACEHOLDER);
    });
    addQuillEditor("#rocrate-title-input");
    addQuillEditor("#rocrate-desc-input");
    addQuillEditor("#rocrate-about");
    addQuillEditor("#rocrate-citation");
    enableQuillEventsAndCallbacks();
  }
  function enableQuillEventsAndCallbacks() {
    const otherCallbacks = {
      "#ol-0": updateOutputLabelCallback,
      "#rocrate-baseline-desc": checkBaselineDesc,
      "#rocrate-citation": () => {
        userHasEditedCitation = true;
      }
    };
    const numConditions = getNumConditions();
    for (let i = 0; i < numConditions; ++i) {
      otherCallbacks["#cl-" + i] = () => {
        updateCondDescLabel(i);
      };
      if (roCrateFormUpdating)
        otherCallbacks["#rcdi-" + i] = checkCondDescs;
    }
    enableQuillEvents(generateIfUpdating, otherCallbacks);
  }
  function enableROCrateOnChangeTriggers() {
    $("#rocrate-cdxml").on("change", updateReactionScheme);
    $("input[name='rocrate-license']").on("change", updateLicense);
    $("#num-contrib").on("change", setNumROCrateContribRow);
  }
  $(document).ready(function() {
    initDirtyForms("form", DIRTY_FORMS_MESSAGE);
    initTooltips(), initGlobals(), initQuill();
    L_DIMS.forEach((dim) => initNumDimControls(dim));
    enableOnChangeTriggers(), enableToggles(), enableButtons(), enableNavigation();
    $("#width-input, #height-input").on("focusout", () => {
      setTimeout(finalisePlotDimsUpdate, 10);
    });
    enableDeviationCalc(), enableCanvasUpdate();
    enableROCrateOnChangeTriggers();
    postContribRowUpdate();
    if (debug) {
      fillExample();
      startROCrateExport(false);
      setTimeout(() => {
        useDefaultROCrateTitleDesc();
        useDefaultCitation();
      }, 100);
    }
    const backupPath2D = Path2D;
    Path2D = null;
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js").finally(() => {
      Path2D = backupPath2D;
      enableAutoUpdates();
    });
  });
})();
