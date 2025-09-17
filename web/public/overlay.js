(function(){
  var MOUNT_ID = "pockla-overlay";
  if (document.getElementById(MOUNT_ID)) return;

  // Determine base URL from this script src so we can fetch assets from the same host
  var thisScript = document.currentScript || (function(){
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();
  var base;
  try { base = new URL(thisScript.src).origin; } catch { base = location.origin; }

  var host = document.createElement('div');
  host.id = MOUNT_ID;
  host.style.all = 'initial';
  host.style.position = 'fixed';
  host.style.right = '16px';
  host.style.bottom = '16px';
  host.style.zIndex = '2147483647';
  document.body.appendChild(host);
  var root = host.attachShadow({ mode: 'open' });

  var css = "\n    :host{ font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }\n    .panel{ width:min(380px, 92vw); background: var(--card, #0f1630); color: var(--card-foreground, #e8eeff);\n      border-radius: 14px; box-shadow:0 18px 50px rgba(0,0,0,.35); border:1px solid var(--border, #233057); overflow:hidden; }\n    .hdr{ display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background: var(--popover, #121a35); }\n    .ttl{ font-size:14px; font-weight:600; margin:0; }\n    .close{ all:unset; cursor:pointer; color:inherit; opacity:.8; padding:4px; }\n    .bd{ padding:12px; display:grid; gap:10px; background: var(--card, #0f1630);}\n    .row{ display:flex; gap:8px; align-items:center;}\n    select, input{ flex:1; padding:10px 12px; border-radius:10px; border:1px solid var(--border, #233057); background:#0f1630; color:#e8eeff; }\n    .card{ padding:10px; border:1px solid var(--border, #233057); border-radius:10px; background:#0f1630; }\n    .sub{ font-size:12px; color:#a7b3d6; }\n    .chips{ display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;}\n    .chip{ background:#1a2448; padding:4px 8px; border-radius:999px; font-size:11px; color:#c9d5ff;}\n    .cta{ all:unset; cursor:pointer; display:inline-flex; align-items:center; gap:8px; background:#7c93ff; color:#0b1020; padding:10px 12px; border-radius:10px; font-weight:700; }\n  ";
  var style = document.createElement('style'); style.textContent = css; root.appendChild(style);

  var wrap = document.createElement('div');
  wrap.innerHTML = "\n    <div class=panel>\n      <div class=hdr>\n        <h3 class=ttl>Thistle Initiatives • How we can help</h3>\n        <button class=close aria-label=Close>✕</button>\n      </div>\n      <div class=bd>\n        <div class=row>\n          <input id=oi-url placeholder=\"https://yourcompany.com (optional)\">\n          <select id=oi-sample>\n            <option value=\"\">Sample company…</option>\n            <option>Revolut</option>\n            <option>OpenPayd</option>\n            <option>VertoFX</option>\n          </select>\n        </div>\n        <div id=oi-company class=sub></div>\n        <div class=card>\n          <div id=oi-offering-title style=\"font-weight:600; margin-bottom:6px;\"></div>\n          <div id=oi-offering-sum class=sub></div>\n          <div id=oi-chips class=chips></div>\n        </div>\n        <div class=card>\n          <div style=\"font-weight:600; margin-bottom:6px;\">Credible proof</div>\n          <div id=oi-proof class=sub></div>\n        </div>\n        <div class=row>\n          <a id=oi-cta class=cta target=_blank rel=noopener>Get in touch</a>\n        </div>\n      </div>\n    </div>\n  ";
  root.appendChild(wrap);

  var $ = function(sel){ return root.querySelector(sel); };
  $('.close').onclick = function(){ host.remove(); };

  // Load dataset
  fetch(base + '/data/thistle.json').then(function(r){ return r.json(); }).then(function(data){
    // Default to Payment Services offering for a fintech sample
    var offer = (data.offerings || []).find(function(o){ return o.id === 'payment_services'; }) || data.offerings?.[0];
    var company = data.company || {};
    $('#oi-company').textContent = (company.tagline || '') + (company.proofStats ? ' • ' + (company.proofStats.fcaApplications||'') + ' FCA apps' : '');
    if (offer){
      $('#oi-offering-title').textContent = offer.title;
      $('#oi-offering-sum').textContent = offer.summary || '';
      var chips = offer.outcomes || [];
      $('#oi-chips').innerHTML = chips.map(function(c){ return '<span class="chip">'+c+'</span>'; }).join('');
      var proofId = (offer.proofRefs||[])[0];
      var proof = (data.proofs||[]).find(function(p){ return p.id === proofId; });
      $('#oi-proof').textContent = proof ? (proof.client ? (proof.client+': ') : '') + (proof.quote||proof.title||'') : '—';
      var cta = (offer.ctas||[])[0];
      if (cta){ var a = $('#oi-cta'); a.textContent = cta.label || 'Get in touch'; a.href = cta.url || '#'; }
    }

    // Simple sample selector to tailor headline (no network)
    $('#oi-sample').addEventListener('change', function(e){
      var name = e.target.value || '';
      var t = 'Thistle Initiatives • How we can help' + (name ? (' ' + name) : '');
      root.querySelector('.ttl').textContent = t;
    });
  }).catch(function(){
    $('#oi-company').textContent = 'Unable to load dataset.';
  });
})();


