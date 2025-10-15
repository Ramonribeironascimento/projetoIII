/* app.js
   SPA, templates, validação, masks, localStorage, modal, toasts.
   Desenvolvido para o projeto da ONG (HTML5/CSS3).
*/

console.log('App JS carregado');

(() => {
    'use strict';
    console.log('App JS carregado1');
    /* ----------------------------
       Config / Design tokens (JS)
       ---------------------------- */
    const STORE_KEYS = {
        DRAFT_CADASTRO: 'ong:draft:cadastro',
        SUBMISSIONS: 'ong:submissions'
    };

    /* ----------------------------
       Utilitários
       ---------------------------- */
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
    const htmlEscape = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
    console.log('App JS carregado2' + $);

    /* ----------------------------
       Router SPA (carrega HTML parcial no main#main-content)
       - links com data-link="/projetos.html" serão interceptados
       ---------------------------- */
    const SPA = {
        init() {
            // interceptar links
            document.addEventListener('click', (e) => {
                const a = e.target.closest('a[data-link]');
                if (a) {
                    e.preventDefault();
                    const href = a.getAttribute('data-link') || a.href;
                    this.navigate(href);
                }
            });

            // handle back/forward
            window.addEventListener('popstate', () => {
                this.load(location.pathname);
            });

            // initial load: if root, load index page content (index.html)
            // If using multiple files, navigate to location.pathname
            this.load(location.pathname || '/index.html', { push: false });
        },

        async load(path, { push = true } = {}) {
            const main = $('#main-content');
            if (!main) return console.warn('SPA: main#main-content não encontrado');

            this.showLoader(main);

            // normalize: if path is "/" -> /index.html
            if (path === '/' || path === '') path = '/index.html';
            try {
                const resp = await fetch(path, { cache: 'no-store' });
                if (!resp.ok) throw new Error(`Erro ao carregar ${path}: ${resp.status}`);
                const text = await resp.text();

                // Extrair apenas o conteúdo do <main> da página carregada, se possível.
                let content = text;
                const m = /<main[^>]*>([\s\S]*?)<\/main>/i.exec(text);
                if (m) content = m[1];

                main.innerHTML = content;

                // after loading, initialize page-specific behaviors
                this.hydratePage(path);
                if (push) history.pushState({}, '', path);
            } catch (err) {
                main.innerHTML = `<section class="error"><h2>Erro</h2><p>Não foi possível carregar o conteúdo.</p><pre>${htmlEscape(err.message)}</pre></section>`;
                console.error(err);
            } finally {
                this.hideLoader(main);
            }
        },

        hydratePage(path) {
            // identifica a página e inicializa comportamentos específicos
            const page = path.split('/').pop();
            if (!page || page === 'index.html') {
                Home.init && Home.init();
            } else if (page.startsWith('projetos')) {
                Projects.init && Projects.init();
            } else if (page.startsWith('cadastro')) {
                Cadastro.init && Cadastro.init();
            }
            // acessibilidade: mover foco para main
            const main = $('#main-content');
            if (main) main.setAttribute('tabindex', '-1'), main.focus();
        },

        showLoader(container) {
            if (!container) return;
            const loader = document.createElement('div');
            loader.className = 'spa-loader';
            loader.innerHTML = '<div class="spinner" aria-hidden="true"></div>';
            container.appendChild(loader);
        },

        hideLoader(container) {
            if (!container) return;
            const l = container.querySelector('.spa-loader');
            if (l) l.remove();
        },

        navigate(href) {
            // resolve relative to current origin
            const url = new URL(href, location.href);
            this.load(url.pathname);
        }
    };

    console.log('App JS carregado3');

    /* ----------------------------
       Template helpers (Projects cards)
       ---------------------------- */
    const Templates = {
        projectCard(p) {
            return `
        <article class="card project-card" role="article" aria-labelledby="proj-title-${p.id}">
          <div class="card-media">
            <img src="${htmlEscape(p.image)}" alt="${htmlEscape(p.title)}" loading="lazy">
          </div>
          <div class="card-body">
            <h3 id="proj-title-${p.id}">${htmlEscape(p.title)}</h3>
            <p class="muted">${htmlEscape(p.excerpt)}</p>
            <div class="card-meta">
              <span class="badge">${htmlEscape(p.category)}</span>
              <button class="btn btn-sm" data-action="open-project" data-id="${p.id}">Ver detalhes</button>
            </div>
          </div>
        </article>
      `;
        }
    };

    console.log('App JS carregado4');

    /* ----------------------------
       Fake data / Projects
       ---------------------------- */
    const SAMPLE_PROJECTS = [
        {
            id: 'p1',
            title: 'Distribuição de Cestas Básicas',
            excerpt: 'Apoio emergencial a famílias com cestas alimentares semanais.',
            category: 'Alimentação',
            image: '/img/8.jpg'
        },
        {
            id: 'p2',
            title: 'Capacitação Jovem - Mercado de Trabalho',
            excerpt: 'Cursos e oficinas para jovens ingressarem no mercado de trabalho.',
            category: 'Capacitação',
            image: '/img/1.jpg'
         },
        {
            id: 'p3',
            title: 'Acompanhamento Pedagógico',
            excerpt: 'Aulas de reforço e acompanhamento pedagógico para crianças.',
            category: 'Educação',
            image: '/img/10.jpg'
        }
    ];

    console.log('App JS carregado5');

    /* ----------------------------
       Projects module
       ---------------------------- */
    const Projects = {
        init() {
            // render cards into #projectsGrid if exists
            const grid = $('#projectsGrid') || createProjectsGrid();
            renderProjects(grid, SAMPLE_PROJECTS);

            // delegation for project actions
            grid.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-action="open-project"]');
                if (btn) {
                    const id = btn.dataset.id;
                    const proj = SAMPLE_PROJECTS.find(p => p.id === id);
                    if (proj) {
                        Modal.open({
                            title: proj.title,
                            content: `<p>${htmlEscape(proj.excerpt)}</p><img src="${htmlEscape(proj.image)}" alt="">`,
                            size: 'lg'
                        });
                    }
                }
            });
        }
    };

    console.log('App JS carregado6');

    function createProjectsGrid() {
        const main = $('#main-content');
        if (!main) return null;
        const wrapper = document.createElement('div');
        wrapper.id = 'projectsGrid';
        wrapper.className = 'projects-grid';
        main.appendChild(wrapper);
        return wrapper;
    }

    function renderProjects(container, projects) {
        if (!container) return;
        container.innerHTML = projects.map(Templates.projectCard).join('');
    }

    console.log('App JS carregado7');

    /* ----------------------------
       Cadastro module (form handling, validation, masks, localStorage)
       ---------------------------- */
    const Cadastro = {
        init() {
            const form = $('#cadastroForm');
            if (!form) return;
            console.log('App JS carregado7a');
            // restore draft
            const draft = localStorage.getItem(STORE_KEYS.DRAFT_CADASTRO);
            if (draft) {
                try {
                    const data = JSON.parse(draft);
                    Object.keys(data).forEach(k => {
                        const el = form.elements[k];
                        if (el) el.value = data[k];
                    });
                    Toast.info('Rascunho recuperado do armazenamento local.');
                } catch (err) {
                    console.warn('Erro ao recuperar rascunho', err);
                }
            }

            // input masks (delegation)
            form.addEventListener('input', onFormInputMask);

            // auto-save draft
            form.addEventListener('input', debounce(() => {
                saveDraft(form);
            }, 600));

            // submit
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                handleSubmit(form);
            });

            // validation visual feedback on blur
            form.addEventListener('blur', (ev) => {
                if (ev.target && ev.target.tagName === 'INPUT') {
                    validateField(ev.target);
                }
            }, true);
        }
    };

    console.log('App JS carregado8');

    function saveDraft(form) {
        const data = {};
        Array.from(form.elements).forEach(el => {
            if (!el.name) return;
            if (el.type === 'checkbox' || el.type === 'radio') {
                if (el.checked) data[el.name] = el.value;
            } else {
                data[el.name] = el.value;
            }
        });
        localStorage.setItem(STORE_KEYS.DRAFT_CADASTRO, JSON.stringify(data));
        //console.debug('Rascunho salvo', data);
    }

    function handleSubmit(form) {
        const validity = form.checkValidity();
        // run custom validations
        const fields = Array.from(form.elements).filter(el => el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA');
        let ok = validity;
        fields.forEach(f => {
            ok = validateField(f) && ok;
        });

        if (!ok) {
            Toast.error('Por favor corrija os erros no formulário antes de enviar.');
            return;
        }

        // coletar valores
        const values = {};
        fields.forEach(f => { if (f.name) values[f.name] = f.value; });

        // simular envio: armazenar localmente
        const all = JSON.parse(localStorage.getItem(STORE_KEYS.SUBMISSIONS) || '[]');
        all.push({ id: `sub-${Date.now()}`, ts: new Date().toISOString(), data: values });
        localStorage.setItem(STORE_KEYS.SUBMISSIONS, JSON.stringify(all));

        // limpar draft
        localStorage.removeItem(STORE_KEYS.DRAFT_CADASTRO);

        Toast.success('Cadastro enviado com sucesso (simulado). Obrigado!');
        form.reset();
    }

    function validateField(field) {
        if (!field || !field.name) return true;

        // native validation first
        const nativeOk = field.checkValidity();

        // custom rules: CPF length (11 digits), CEP (8 digits), telefone >= 10 digits
        let customOk = true;
        const val = (field.value || '').replace(/\D/g, '');

        if (field.name === 'cpf') {
            customOk = /^\d{11}$/.test(val);
        } else if (field.name === 'cep') {
            customOk = /^\d{8}$/.test(val);
        } else if (field.name === 'telefone') {
            customOk = /^\d{10,11}$/.test(val);
        } else {
            customOk = true;
        }

        const ok = nativeOk && customOk;

        toggleFieldFeedback(field, ok, nativeOk ? '' : field.validationMessage || 'Campo inválido');

        return ok;
    }

    function toggleFieldFeedback(field, ok, message = '') {
        field.classList.toggle('invalid', !ok);
        field.setAttribute('aria-invalid', String(!ok));
        let hint = field.nextElementSibling;
        if (!hint || !hint.classList.contains('field-hint')) {
            hint = document.createElement('div');
            hint.className = 'field-hint';
            field.parentNode.insertBefore(hint, field.nextSibling);
        }
        hint.textContent = ok ? '' : message;
    }

    /* ----------------------------
       Masks: simple formatting while typing
       - CPF: 000.000.000-00
       - Telefone: (00) 00000-0000 or (00) 0000-0000
       - CEP: 00000-000
       ---------------------------- */
    function onFormInputMask(e) {
        const el = e.target;
        if (!el || !el.name) return;
        if (el.name === 'cpf') {
            const raw = el.value.replace(/\D/g, '').slice(0, 11);
            let v = raw;
            if (raw.length > 9) v = raw.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2}).*/, '$1.$2.$3-$4');
            else if (raw.length > 6) v = raw.replace(/^(\d{3})(\d{3})(\d{1,3}).*/, '$1.$2.$3');
            else if (raw.length > 3) v = raw.replace(/^(\d{3})(\d{1,3}).*/, '$1.$2');
            el.value = v;
        } else if (el.name === 'telefone') {
            let raw = el.value.replace(/\D/g, '').slice(0, 11);
            if (raw.length > 10) { // 11 digits (cel)
                raw = raw.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
            } else {
                raw = raw.replace(/^(\d{2})(\d{4,5})(\d{0,4}).*/, '($1) $2-$3');
            }
            el.value = raw;
        } else if (el.name === 'cep') {
            const raw = el.value.replace(/\D/g, '').slice(0, 8);
            el.value = raw.replace(/^(\d{5})(\d{1,3})?/, (m, a, b) => b ? `${a}-${b}` : a);
        }
    }

    console.log('App JS carregado10');

    /* ----------------------------
       Modal (simples)
       ---------------------------- 
    const Modal = (() => {
        let container = null;
        function ensure() {
            if (container) return container;
            container = document.createElement('div');
            container.className = 'app-modal';
            container.innerHTML = `
        <div class="modal-backdrop" data-action="close-modal" tabindex="-1" aria-hidden="true"></div>
        <div class="modal-panel" role="dialog" aria-modal="true" aria-label="Dialogo" >
          <header class="modal-header"><h2 class="modal-title"></h2><button class="modal-close" aria-label="Fechar">&times;</button></header>
          <div class="modal-body"></div>
        </div>
      `;
            document.body.appendChild(container);

            container.addEventListener('click', (e) => {
                if (e.target.closest('[data-action="close-modal"]') || e.target.classList.contains('modal-close')) {
                    close();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') close();
            });

            return container;
        }
        function open({ title = '', content = '', size = 'md' } = {}) {
            const c = ensure();
            c.querySelector('.modal-title').textContent = title;
            const body = c.querySelector('.modal-body');
            body.innerHTML = content;
            c.classList.add('open', `size-${size}`);
            // foco
            const close = c.querySelector('.modal-close');
            close && close.focus();
        }
        function close() {
            const c = ensure();
            c.classList.remove('open', 'size-lg', 'size-md', 'size-sm');
        }
        return { open, close };
    })();

    console.log('App JS carregado11');
*/
    /* ----------------------------
       Toasts (alerts)
       ---------------------------- */
    const Toast = (() => {
        let area = null;
        function ensure() {
            if (area) return area;
            area = document.createElement('div');
            area.className = 'toast-area';
            document.body.appendChild(area);
            return area;
        }
        function _show(msg, type = 'info', timeout = 4000) {
            const a = ensure();
            const t = document.createElement('div');
            t.className = `toast toast-${type}`;
            t.setAttribute('role', 'status');
            t.innerHTML = `<div class="toast-msg">${htmlEscape(msg)}</div><button class="toast-close" aria-label="Fechar">&times;</button>`;
            a.appendChild(t);
            t.querySelector('.toast-close').addEventListener('click', () => t.remove());
            setTimeout(() => t.remove(), timeout);
        }
        return {
            info: (m) => _show(m, 'info', 3000),
            success: (m) => _show(m, 'success', 3500),
            error: (m) => _show(m, 'error', 6000)
        };
    })();

    console.log('App JS carregado12');

    /* ----------------------------
       Small helpers
       ---------------------------- */
    function debounce(fn, wait = 200) {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    console.log('App JS carregado13');

    /* ----------------------------
       Home (index) placeholder behaviors
       ---------------------------- */
    const Home = {
        init() {
            // example: attach event for hero CTA
            const cta = $('[data-action="cta-volunteer"]');
            if (cta) cta.addEventListener('click', (e) => {
                e.preventDefault();
                SPA.navigate('/projetos.html');
            });
        }
    };

    /* ----------------------------
       Global init: attach nav links and start SPA
       - Look for <a href="..." data-link> or <a data-link="...">
       ---------------------------- */
    function initGlobal() {
        // convert normal nav anchors to data-link for SPA if same origin and .html
        $$('a[href$=".html"]').forEach(a => {
            try {
                const url = new URL(a.href, location.href);
                if (url.origin === location.origin) {
                    a.setAttribute('data-link', url.pathname);
                }
            } catch (err) { }
        });

        // open/close menu mobile (if present)
        const hamburger = document.querySelector('[data-action="toggle-menu"]');
        if (hamburger) {
            hamburger.addEventListener('click', () => {
                document.documentElement.classList.toggle('nav-open');
            });
        }

        // delegation: elements with data-modal-url -> fetch and open
        document.addEventListener('click', (e) => {
            const a = e.target.closest('[data-modal-url]');
            if (!a) return;
            e.preventDefault();
            const url = a.getAttribute('data-modal-url');
            fetch(url).then(r => r.text()).then(html => {
                Modal.open({ title: a.getAttribute('data-modal-title') || '', content: html, size: 'lg' });
            }).catch(err => {
                Toast.error('Erro ao abrir modal.');
                console.error(err);
            });
        });

        SPA.init();
    }

    console.log('App JS carregado14');

    // start after DOMContentLoaded (script is defer so can run now)
    document.addEventListener('DOMContentLoaded', initGlobal);

    /* ----------------------------
       Expose some for debugging (optional)
       ---------------------------- */
    window._ONG = {
        SPA, Modal, Toast, Templates, SAMPLE_PROJECTS
    };

    console.log('App JS carregado15');

})();
