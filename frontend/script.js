const MK = "$2a$10$6YYYPd5hjRWm8dbvcWSIWebcGuYrdJhWq//j2fJMZDUXpsB5jg1v6";
const BURL = "https://kaos-backend.onrender.com/api/data";
let BIN_ID = localStorage.getItem('kg_bin') || null;
let CU = null;
let DB = { users:[], bugs:[], milestones:[], games:[], activity:[] };

// ── JSONBIN DATABASE ──────────────────────────────────────────────────────────
async function dbRead() {
  if (!BIN_ID) return false;
  try {
    const r = await fetch(`${BURL}/b/${BIN_ID}/latest`, { headers:{ 'X-Master-Key': MK } });
    if (!r.ok) return false;
    const d = await r.json();
    DB = d.record;
    return true;
  } catch { return false; }
}

async function dbWrite() {
  if (!BIN_ID) return;
  await fetch(`${BURL}/b/${BIN_ID}`, {
    method:'PUT',
    headers:{ 'Content-Type':'application/json', 'X-Master-Key': MK },
    body: JSON.stringify(DB)
  });
}

async function dbCreate() {
  const r = await fetch(`${BURL}/b`, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'X-Master-Key': MK, 'X-Bin-Name':'kaos-portal', 'X-Bin-Private':'true' },
    body: JSON.stringify(DB)
  });
  const d = await r.json();
  BIN_ID = d.metadata?.id;
  if (BIN_ID) localStorage.setItem('kg_bin', BIN_ID);
  return !!BIN_ID;
}

// ── BOOT ──────────────────────────────────────────────────────────────────────
async function boot() {
  showL('Connecting to JSONBin...');
  
  ['kg_bins'].forEach(k => localStorage.removeItem(k));

  if (BIN_ID) {
    const ok = await dbRead();
    if (!ok) { BIN_ID = null; localStorage.removeItem('kg_bin'); }
  }

  if (!BIN_ID) {
    showL('First time setup...');
    seed();
    const ok = await dbCreate();
    if (!ok) { hideL(); document.getElementById('lerr').textContent = 'Could not connect to database.'; return; }
  }

  hideL();
  tryRestore();
}

function seed() {
  const g1 = uid(), g2 = uid();
  DB.games = [
    { id:g1, name:'R-Fighters', status:'development', desc:'Fighting game on Roblox', created:now() },
    { id:g2, name:'Formula', status:'development', desc:'Racing game on Roblox', created:now() }
  ];
  DB.users = [
    { id:uid(), name:'Admin', username:'admin', password:'password123', role:'admin', games:[], created:now() },
    { id:uid(), name:'Liminal', username:'liminal', password:'rfighters2026', role:'client', games:['R-Fighters','Formula'], created:now() },
    { id:uid(), name:'QA Lead', username:'qa_lead', password:'qakaos2026', role:'qa', games:[], created:now() },
    { id:uid(), name:'Developer', username:'dev_netsu', password:'dev2026', role:'dev', games:[], created:now() },
    { id:uid(), name:'Project Manager', username:'pm_kaos', password:'pm2026', role:'pm', games:[], created:now() }
  ];
  DB.milestones = [
    { id:uid(), game:'R-Fighters', title:'Core Mechanics', date:'2026-05-23', status:'done', desc:'Basic fight mechanics', created:now() },
    { id:uid(), game:'R-Fighters', title:'Character Roster', date:'2026-06-01', status:'active', desc:'8 playable characters', created:now() }
  ];
  DB.bugs = [];
  DB.activity = [{ id:uid(), text:'Portal initialized via JSONBin', by:'System', time:now() }];
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
function tryRestore() {
  const sid = localStorage.getItem('kg_s') || sessionStorage.getItem('kg_s');
  if (!sid) return;
  const u = DB.users.find(x => x.id === sid);
  if (u) { CU = u; launch(); }
}

function doLogin() {
  const u = document.getElementById('lu').value.trim().toLowerCase();
  const p = document.getElementById('lp').value;
  const user = DB.users.find(x => x.username.toLowerCase() === u && x.password === p);
  if (!user) { document.getElementById('lerr').textContent = 'Incorrect username or password.'; return; }
  document.getElementById('lerr').textContent = '';
  CU = user;
  if (document.getElementById('rem').checked) localStorage.setItem('kg_s', user.id);
  else sessionStorage.setItem('kg_s', user.id);
  launch();
}

function doLogout() {
  CU = null;
  localStorage.removeItem('kg_s'); sessionStorage.removeItem('kg_s');
  document.getElementById('app').style.display = 'none';
  document.getElementById('ls').style.display = 'flex';
  document.getElementById('lp').value = '';
}

function launch() {
  document.getElementById('ls').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  document.getElementById('uav').textContent = CU.name[0].toUpperCase();
  document.getElementById('uname').textContent = CU.name;
  document.getElementById('urole').textContent = rn(CU.role);
  buildNav();
}

function rn(r) { return {admin:'Admin',client:'Client',qa:'QA Tester',dev:'Developer',pm:'Project Manager'}[r]||r; }

// ── NAV ───────────────────────────────────────────────────────────────────────
function buildNav() {
  const navs = {
    admin:[{i:'📊',l:'Dashboard',p:'dashboard'},{i:'🎮',l:'Games',p:'games'},{i:'🏁',l:'Milestones',p:'milestones'},{i:'🐛',l:'Bug Reports',p:'bugs'},{i:'👥',l:'Users',p:'users'},{i:'📋',l:'Activity',p:'activity'}],
    client:[{i:'📁',l:'My Project',p:'client-proj'},{i:'🐛',l:'Bug Reports',p:'client-bugs'},{i:'📋',l:'Activity',p:'activity'}],
    qa:[{i:'📊',l:'Dashboard',p:'qa-dash'},{i:'🐛',l:'Report Bug',p:'qa-rep'},{i:'📋',l:'My Reports',p:'qa-reps'}],
    dev:[{i:'📊',l:'Dashboard',p:'dev-dash'},{i:'🐛',l:'Bug Reports',p:'bugs'},{i:'🏁',l:'Milestones',p:'milestones'}],
    pm:[{i:'📊',l:'Dashboard',p:'dashboard'},{i:'🎮',l:'Games',p:'games'},{i:'🏁',l:'Milestones',p:'milestones'},{i:'🐛',l:'Bug Reports',p:'bugs'},{i:'📋',l:'Activity',p:'activity'}]
  };
  const items = navs[CU.role]||navs.admin;
  document.getElementById('nav').innerHTML = '<div class="ns">Menu</div>'+items.map(n=>`<div class="ni" onclick="sp('${n.p}',this)" data-p="${n.p}"><span class="ni-ic">${n.i}</span>${n.l}</div>`).join('');
  sp(items[0].p, document.querySelector('.ni'));
}

function sp(page, el) {
  document.querySelectorAll('.ni').forEach(n=>n.classList.remove('active'));
  if(el) el.classList.add('active');
  document.getElementById('mc').innerHTML = rp(page);
}

// ── PAGES ─────────────────────────────────────────────────────────────────────
function rp(p) {
  switch(p) {
    case 'dashboard': return pgDash();
    case 'games': return pgGames();
    case 'milestones': return pgMS();
    case 'bugs': return pgBugs();
    case 'users': return pgUsers();
    case 'activity': return pgActivity();
    case 'client-proj': return pgClientProj();
    case 'client-bugs': return pgClientBugs();
    case 'qa-dash': return pgQaDash();
    case 'qa-rep': return pgQaRep();
    case 'qa-reps': return pgQaReps();
    case 'dev-dash': return pgDevDash();
    default: return '<div class="es">Page not found.</div>';
  }
}

function pgDash() {
  const ob = DB.bugs.filter(b=>b.status==='open').length;
  const fb = DB.bugs.filter(b=>b.status==='fixed').length;
  const dm = DB.milestones.filter(m=>m.status==='done').length;
  const recent = [...DB.activity].reverse().slice(0,8);
  return `<div class="ph"><div><h1>Dashboard</h1><p>Studio overview</p></div></div>
  <div class="sg">
    <div class="sc"><div class="sl2">Games</div><div class="sv purple">${DB.games.length}</div></div>
    <div class="sc"><div class="sl2">Open Bugs</div><div class="sv red">${ob}</div></div>
    <div class="sc"><div class="sl2">Fixed Bugs</div><div class="sv green">${fb}</div></div>
    <div class="sc"><div class="sl2">Milestones Done</div><div class="sv">${dm}/${DB.milestones.length}</div></div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;flex-wrap:wrap">
    <div class="tw"><div class="th"><h3>Recent Bugs</h3></div>
      ${DB.bugs.length?`<table><thead><tr><th>Title</th><th>Severity</th><th>Status</th></tr></thead><tbody>
      ${[...DB.bugs].reverse().slice(0,6).map(b=>`<tr><td>${esc(b.title)}</td><td>${sb(b.severity)}</td><td>${stb(b.status)}</td></tr>`).join('')}
      </tbody></table>`:'<div class="es">No bugs yet.</div>'}
    </div>
    <div class="tw"><div class="th"><h3>Activity</h3></div>
      <div style="padding:12px 16px">${recent.map(a=>`<div class="ai"><div class="ad"></div><div><div class="at">${esc(a.text)}</div><div class="atm">${fd(a.time)}</div></div></div>`).join('')||'<div class="es">None yet.</div>'}</div>
    </div>
  </div>`;
}

function pgGames() {
  return `<div class="ph"><h1>Games</h1><button class="btn btn-p" onclick="openGameModal()">+ Add Game</button></div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px">
    ${DB.games.map(g=>{
      const gm=DB.milestones.filter(m=>m.game===g.name);
      const dn=gm.filter(m=>m.status==='done').length;
      const pct=gm.length?Math.round(dn/gm.length*100):0;
      const ob=DB.bugs.filter(b=>b.game===g.name&&b.status==='open').length;
      return `<div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:20px">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px"><div style="font-size:16px;font-weight:700">${esc(g.name)}</div>${stb(g.status)}</div>
        <div style="font-size:13px;color:var(--tx2);margin-bottom:12px">${esc(g.desc||'')}</div>
        <div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--tx2);margin-bottom:4px"><span>Progress</span><span>${pct}%</span></div>
        <div class="pb"><div class="pf" style="width:${pct}%"></div></div></div>
        <div style="font-size:12px;color:var(--tx2)">🏁 ${gm.length} milestones &nbsp; 🐛 ${ob} open bugs</div>
      </div>`;
    }).join('')||'<div class="es">No games yet.</div>'}
  </div>`;
}

function pgMS() {
  const isAP = ['admin','pm'].includes(CU.role);
  return `<div class="ph"><h1>Milestones</h1>${isAP?`<button class="btn btn-p" onclick="openMSModal()">+ Add</button>`:''}</div>
  ${DB.games.map(g=>{
    const ms=DB.milestones.filter(m=>m.game===g.name);
    if(!ms.length) return '';
    const dn=ms.filter(m=>m.status==='done').length;
    const pct=Math.round(dn/ms.length*100);
    return `<div style="margin-bottom:24px">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px"><div style="font-size:16px;font-weight:700">${esc(g.name)}</div><span style="font-size:13px;color:var(--tx2)">${dn}/${ms.length}</span></div>
      <div class="pb" style="margin-bottom:12px"><div class="pf" style="width:${pct}%"></div></div>
      ${ms.map(m=>`<div class="mi"><div class="md ${m.status}"></div><div style="flex:1">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <div style="font-size:14px;font-weight:600">${esc(m.title)}</div>
          <div style="display:flex;gap:8px;align-items:center">${stb(m.status)}${isAP?`<button class="btn btn-s btn-sm" onclick="openMSModal('${m.id}')">Edit</button>`:''}
          </div>
        </div>
        <div style="font-size:12px;color:var(--tx2);margin-top:2px">${m.date?fd(m.date):''}</div>
        ${m.desc?`<div style="font-size:12px;color:var(--tx2);margin-top:4px">${esc(m.desc)}</div>`:''}
      </div></div>`).join('')}
    </div>`;
  }).join('')||'<div class="es">No milestones yet.</div>'}`;
}

function pgBugs() {
  const bugs = DB.bugs;
  return `<div class="ph"><h1>Bug Reports</h1><button class="btn btn-p" onclick="openBugModal()">+ Report Bug</button></div>
  <div class="sg">
    <div class="sc"><div class="sl2">Open</div><div class="sv red">${bugs.filter(b=>b.status==='open').length}</div></div>
    <div class="sc"><div class="sl2">In Progress</div><div class="sv yellow">${bugs.filter(b=>b.status==='in_progress').length}</div></div>
    <div class="sc"><div class="sl2">Fixed</div><div class="sv green">${bugs.filter(b=>b.status==='fixed').length}</div></div>
    <div class="sc"><div class="sl2">Critical</div><div class="sv red">${bugs.filter(b=>b.severity==='critical').length}</div></div>
  </div>
  <div class="tw"><div class="th"><h3>All Bugs</h3></div>
    ${bugs.length?`<table><thead><tr><th>Title</th><th>Game</th><th>Severity</th><th>Status</th><th>Reporter</th><th>Date</th><th></th></tr></thead><tbody>
    ${[...bugs].reverse().map(b=>`<tr>
      <td>${esc(b.title)}</td>
      <td><span class="gt">${esc(b.game)}</span></td>
      <td>${sb(b.severity)}</td>
      <td><select style="background:var(--bg3);border:1px solid var(--border);color:var(--tx);border-radius:5px;padding:3px 6px;font-size:11px" onchange="updBug('${b.id}',this.value)">
        <option value="open" ${b.status==='open'?'selected':''}>Open</option>
        <option value="in_progress" ${b.status==='in_progress'?'selected':''}>In Progress</option>
        <option value="fixed" ${b.status==='fixed'?'selected':''}>Fixed</option>
        <option value="wont_fix" ${b.status==='wont_fix'?'selected':''}>Won't Fix</option>
      </select></td>
      <td style="color:var(--tx2)">${esc(b.reporter||'')}</td>
      <td style="color:var(--tx2)">${fd(b.created)}</td>
      <td><button class="btn btn-d btn-sm" onclick="delBug('${b.id}')">Del</button></td>
    </tr>`).join('')}
    </tbody></table>`:'<div class="es">No bugs reported yet.</div>'}
  </div>`;
}

function pgUsers() {
  return `<div class="ph"><h1>Users</h1><button class="btn btn-p" onclick="openUserModal()">+ Add User</button></div>
  <div class="tw"><table><thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Projects</th><th>Actions</th></tr></thead><tbody>
    ${DB.users.map(u=>`<tr>
      <td style="font-weight:600">${esc(u.name)}</td>
      <td style="color:var(--tx2)">${esc(u.username)}</td>
      <td><span class="badge bp">${rn(u.role)}</span></td>
      <td>${u.role==='client'?(u.games||[]).map(g=>`<span class="gt">${esc(g)}</span>`).join(''):'<span style="color:var(--tx3);font-size:12px">All</span>'}</td>
      <td style="display:flex;gap:6px">
        <button class="btn btn-s btn-sm" onclick="openUserModal('${u.id}')">Edit</button>
        ${u.id!==CU.id?`<button class="btn btn-d btn-sm" onclick="delUser('${u.id}')">Del</button>`:''}
      </td>
    </tr>`).join('')}
  </tbody></table></div>`;
}

function pgActivity() {
  const acts = [...DB.activity].reverse().slice(0,50);
  return `<div class="ph"><h1>Activity</h1></div>
  <div class="tw"><div style="padding:16px">
    ${acts.map(a=>`<div class="ai"><div class="ad"></div><div><div class="at">${esc(a.text)}</div><div class="atm">${fd(a.time)} — ${esc(a.by||'')}</div></div></div>`).join('')||'<div class="es">No activity yet.</div>'}
  </div></div>`;
}

function pgClientProj() {
  const games = CU.games||[];
  if(!games.length) return `<div class="ph"><h1>My Project</h1></div><div class="es">No projects assigned yet.</div>`;
  return `<div class="ph"><h1>My Project</h1></div>
  ${games.map(gn=>{
    const ms=DB.milestones.filter(m=>m.game===gn);
    const dn=ms.filter(m=>m.status==='done').length;
    const pct=ms.length?Math.round(dn/ms.length*100):0;
    return `<div style="margin-bottom:28px">
      <div style="font-size:20px;font-weight:700;margin-bottom:12px">${esc(gn)}</div>
      <div class="tw" style="margin-bottom:14px"><div class="th"><h3>Progress</h3><span style="font-size:14px;font-weight:700;color:var(--ac2)">${pct}%</span></div>
      <div style="padding:16px"><div class="pb" style="height:12px"><div class="pf" style="width:${pct}%"></div></div></div></div>
      ${ms.map(m=>`<div class="mi"><div class="md ${m.status}"></div><div>
        <div style="display:flex;gap:12px;align-items:center"><div style="font-size:14px;font-weight:600">${esc(m.title)}</div>${stb(m.status)}</div>
        <div style="font-size:12px;color:var(--tx2);margin-top:2px">${m.date?fd(m.date):''}</div>
        ${m.desc?`<div style="font-size:12px;color:var(--tx2);margin-top:4px">${esc(m.desc)}</div>`:''}
      </div></div>`).join('')||'<div class="es">No milestones yet.</div>'}
    </div>`;
  }).join('')}`;
}

function pgClientBugs() {
  const games=CU.games||[];
  const bugs=DB.bugs.filter(b=>games.includes(b.game));
  return `<div class="ph"><h1>Bug Reports</h1></div>
  <div class="sg">
    <div class="sc"><div class="sl2">Open</div><div class="sv red">${bugs.filter(b=>b.status==='open').length}</div></div>
    <div class="sc"><div class="sl2">In Progress</div><div class="sv yellow">${bugs.filter(b=>b.status==='in_progress').length}</div></div>
    <div class="sc"><div class="sl2">Fixed</div><div class="sv green">${bugs.filter(b=>b.status==='fixed').length}</div></div>
  </div>
  <div class="tw">${bugs.length?`<table><thead><tr><th>Title</th><th>Game</th><th>Severity</th><th>Status</th><th>Date</th></tr></thead><tbody>
    ${[...bugs].reverse().map(b=>`<tr><td>${esc(b.title)}</td><td><span class="gt">${esc(b.game)}</span></td><td>${sb(b.severity)}</td><td>${stb(b.status)}</td><td style="color:var(--tx2)">${fd(b.created)}</td></tr>`).join('')}
  </tbody></table>`:'<div class="es">No bugs found.</div>'}</div>`;
}

function pgQaDash() {
  const mb=DB.bugs.filter(b=>b.reporterId===CU.id);
  return `<div class="ph"><h1>QA Dashboard</h1></div>
  <div class="sg">
    <div class="sc"><div class="sl2">My Reports</div><div class="sv purple">${mb.length}</div></div>
    <div class="sc"><div class="sl2">Open</div><div class="sv red">${mb.filter(b=>b.status==='open').length}</div></div>
    <div class="sc"><div class="sl2">Fixed</div><div class="sv green">${mb.filter(b=>b.status==='fixed').length}</div></div>
  </div>
  <div style="display:flex;gap:12px"><button class="btn btn-p" onclick="sp('qa-rep',null)">+ Report Bug</button><button class="btn btn-s" onclick="sp('qa-reps',null)">My Reports</button></div>`;
}

function pgQaRep() {
  return `<div class="ph"><h1>Report a Bug</h1></div>
  <div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:24px;max-width:600px">
    <div class="fg"><label>Game</label><select id="qb-g">${DB.games.map(g=>`<option>${esc(g.name)}</option>`).join('')}</select></div>
    <div class="fg"><label>Title</label><input id="qb-t" placeholder="Short description"></div>
    <div class="fg"><label>Area</label><input id="qb-a" placeholder="e.g. Character, Map, UI"></div>
    <div class="fg"><label>Severity</label><select id="qb-s"><option value="critical">Critical</option><option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option></select></div>
    <div class="fg"><label>Steps to Reproduce</label><textarea id="qb-st" placeholder="1. Go to...&#10;2. Click..."></textarea></div>
    <div class="fg"><label>Expected Result</label><input id="qb-e" placeholder="What should happen"></div>
    <div class="fg"><label>Actual Result</label><input id="qb-ac" placeholder="What actually happened"></div>
    <div class="fg"><label>Screenshot Link</label><input id="qb-i" placeholder="https://..."></div>
    <button class="btn btn-p" onclick="submitQaBug()">Submit Bug Report</button>
  </div>`;
}

function pgQaReps() {
  const mb=[...DB.bugs].filter(b=>b.reporterId===CU.id).reverse();
  return `<div class="ph"><h1>My Reports</h1></div>
  <div class="tw">${mb.length?`<table><thead><tr><th>Title</th><th>Game</th><th>Severity</th><th>Status</th><th>Date</th></tr></thead><tbody>
    ${mb.map(b=>`<tr><td>${esc(b.title)}</td><td><span class="gt">${esc(b.game)}</span></td><td>${sb(b.severity)}</td><td>${stb(b.status)}</td><td style="color:var(--tx2)">${fd(b.created)}</td></tr>`).join('')}
  </tbody></table>`:'<div class="es">No reports yet.</div>'}</div>`;
}

function pgDevDash() {
  const ob=DB.bugs.filter(b=>b.status==='open').length;
  const ip=DB.bugs.filter(b=>b.status==='in_progress').length;
  const cr=DB.bugs.filter(b=>b.severity==='critical'&&b.status!=='fixed').length;
  return `<div class="ph"><h1>Dev Dashboard</h1></div>
  <div class="sg">
    <div class="sc"><div class="sl2">Open Bugs</div><div class="sv red">${ob}</div></div>
    <div class="sc"><div class="sl2">In Progress</div><div class="sv yellow">${ip}</div></div>
    <div class="sc"><div class="sl2">Critical</div><div class="sv red">${cr}</div></div>
  </div>`;
}

// ── MODALS ────────────────────────────────────────────────────────────────────
function openUserModal(uid2) {
  const gc = document.getElementById('gs-boxes');
  gc.innerHTML = DB.games.map(g=>`<label><input type="checkbox" name="gm" value="${esc(g.name)}">${esc(g.name)}</label>`).join('');
  const modal = document.getElementById('m-user');
  if (uid2) {
    const u = DB.users.find(x=>x.id===uid2);
    document.getElementById('mu-ttl').textContent='Edit User';
    document.getElementById('mu-n').value=u.name;
    document.getElementById('mu-u').value=u.username;
    document.getElementById('mu-p').value=u.password;
    document.getElementById('mu-r').value=u.role;
    modal.dataset.eid=uid2;
    toggleGS();
    document.querySelectorAll('#gs-boxes input').forEach(cb=>{ if((u.games||[]).includes(cb.value)) cb.checked=true; });
  } else {
    document.getElementById('mu-ttl').textContent='Add User';
    ['mu-n','mu-u','mu-p'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('mu-r').value='qa';
    delete modal.dataset.eid;
    toggleGS();
  }
  modal.classList.add('open');
}

function toggleGS() {
  document.getElementById('gs-grp').style.display = document.getElementById('mu-r').value==='client'?'block':'none';
}

async function saveUser() {
  const name=document.getElementById('mu-n').value.trim();
  const username=document.getElementById('mu-u').value.trim();
  const password=document.getElementById('mu-p').value;
  const role=document.getElementById('mu-r').value;
  const games=role==='client'?[...document.querySelectorAll('#gs-boxes input:checked')].map(cb=>cb.value):[];
  if(!name||!username||!password){toast('Fill in all fields','error');return;}
  showL('Saving...');
  const modal=document.getElementById('m-user');
  if(modal.dataset.eid){
    const idx=DB.users.findIndex(u=>u.id===modal.dataset.eid);
    DB.users[idx]={...DB.users[idx],name,username,password,role,games};
    log(`Updated user: ${name}`);
  } else {
    if(DB.users.find(u=>u.username.toLowerCase()===username.toLowerCase())){hideL();toast('Username taken','error');return;}
    DB.users.push({id:uid(),name,username,password,role,games,created:now()});
    log(`Added user: ${name} (${role})`);
  }
  await dbWrite();hideL();cm('m-user');toast('Saved!','success');sp('users',document.querySelector('.ni.active'));
}

async function delUser(id) {
  if(!confirm('Delete this user?'))return;
  DB.users=DB.users.filter(u=>u.id!==id);
  log('Deleted a user');showL('Deleting...');await dbWrite();hideL();toast('Deleted','success');sp('users',document.querySelector('.ni.active'));
}

function openBugModal() {
  document.getElementById('mb-g').innerHTML=DB.games.map(g=>`<option>${esc(g.name)}</option>`).join('');
  ['mb-t','mb-a','mb-st','mb-e','mb-ac','mb-i'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('mb-s').value='medium';
  document.getElementById('m-bug').classList.add('open');
}

async function saveBug() {
  const title=document.getElementById('mb-t').value.trim();
  if(!title){toast('Enter a title','error');return;}
  const bug={id:uid(),title,game:document.getElementById('mb-g').value,area:document.getElementById('mb-a').value.trim(),severity:document.getElementById('mb-s').value,status:'open',steps:document.getElementById('mb-st').value.trim(),expected:document.getElementById('mb-e').value.trim(),actual:document.getElementById('mb-ac').value.trim(),img:document.getElementById('mb-i').value.trim(),reporter:CU.name,reporterId:CU.id,created:now()};
  DB.bugs.push(bug);log(`Bug reported: ${title}`);showL('Saving...');await dbWrite();hideL();cm('m-bug');toast('Bug reported!','success');sp('bugs',document.querySelector('.ni.active'));
}

async function updBug(id,status) {
  const bug=DB.bugs.find(b=>b.id===id);if(!bug)return;
  bug.status=status;log(`Bug "${bug.title}" → ${status}`);await dbWrite();toast('Updated','success');
}

async function delBug(id) {
  if(!confirm('Delete?'))return;
  DB.bugs=DB.bugs.filter(b=>b.id!==id);log('Deleted a bug');showL('Deleting...');await dbWrite();hideL();toast('Deleted','success');sp('bugs',document.querySelector('.ni.active'));
}

function openMSModal(msId) {
  document.getElementById('mm-g').innerHTML=DB.games.map(g=>`<option>${esc(g.name)}</option>`).join('');
  const modal=document.getElementById('m-ms');
  if(msId){
    const m=DB.milestones.find(x=>x.id===msId);
    document.getElementById('mm-ttl').textContent='Edit Milestone';
    document.getElementById('mm-n').value=m.title;
    document.getElementById('mm-d').value=m.date||'';
    document.getElementById('mm-s').value=m.status;
    document.getElementById('mm-desc').value=m.desc||'';
    document.getElementById('mm-g').value=m.game;
    modal.dataset.eid=msId;
  } else {
    document.getElementById('mm-ttl').textContent='Add Milestone';
    ['mm-n','mm-d','mm-desc'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('mm-s').value='pending';
    delete modal.dataset.eid;
  }
  modal.classList.add('open');
}

async function saveMS() {
  const title=document.getElementById('mm-n').value.trim();
  if(!title){toast('Enter a title','error');return;}
  const data={game:document.getElementById('mm-g').value,title,date:document.getElementById('mm-d').value,status:document.getElementById('mm-s').value,desc:document.getElementById('mm-desc').value.trim()};
  showL('Saving...');
  const modal=document.getElementById('m-ms');
  if(modal.dataset.eid){
    const idx=DB.milestones.findIndex(m=>m.id===modal.dataset.eid);
    DB.milestones[idx]={...DB.milestones[idx],...data};log(`Milestone updated: ${title}`);
  } else {
    DB.milestones.push({id:uid(),...data,created:now()});log(`Milestone added: ${title}`);
  }
  await dbWrite();hideL();cm('m-ms');toast('Saved!','success');sp('milestones',document.querySelector('.ni.active'));
}

function openGameModal() {
  ['mg-n','mg-d'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('mg-s').value='development';
  document.getElementById('m-game').classList.add('open');
}

async function saveGame() {
  const name=document.getElementById('mg-n').value.trim();
  if(!name){toast('Enter a name','error');return;}
  DB.games.push({id:uid(),name,status:document.getElementById('mg-s').value,desc:document.getElementById('mg-d').value.trim(),created:now()});
  log(`Game added: ${name}`);showL('Saving...');await dbWrite();hideL();cm('m-game');toast('Game added!','success');sp('games',document.querySelector('.ni.active'));
}

async function submitQaBug() {
  const title=document.getElementById('qb-t').value.trim();
  if(!title){toast('Enter a title','error');return;}
  const bug={id:uid(),title,game:document.getElementById('qb-g').value,area:document.getElementById('qb-a').value.trim(),severity:document.getElementById('qb-s').value,status:'open',steps:document.getElementById('qb-st').value.trim(),expected:document.getElementById('qb-e').value.trim(),actual:document.getElementById('qb-ac').value.trim(),img:document.getElementById('qb-i').value.trim(),reporter:CU.name,reporterId:CU.id,created:now()};
  DB.bugs.push(bug);log(`Bug by ${CU.name}: ${title}`);showL('Submitting...');await dbWrite();hideL();toast('Submitted!','success');sp('qa-reps',null);
}

function cm(id){document.getElementById(id).classList.remove('open');}

// ── UTILS ─────────────────────────────────────────────────────────────────────
function uid(){return Math.random().toString(36).slice(2,10)+Date.now().toString(36);}
function now(){return new Date().toISOString();}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function fd(s){if(!s)return'';try{return new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}catch{return s;}}
function log(text){DB.activity.push({id:uid(),text,by:CU?.name||'System',time:now()});if(DB.activity.length>200)DB.activity=DB.activity.slice(-200);}
function sb(s){const m={critical:'br',high:'by',medium:'bb',low:'bgr'};return `<span class="badge ${m[s]||'bgr'}">${s||'medium'}</span>`;}
function stb(s){const m={open:'br',in_progress:'by',fixed:'bg',wont_fix:'bgr',active:'by',done:'bg',pending:'bgr',development:'bb',beta:'bp',released:'bg',paused:'bgr'};const l={in_progress:'In Progress',wont_fix:"Won't Fix",done:'Done',active:'Active',development:'Dev',beta:'Beta',released:'Released',paused:'Paused',open:'Open',pending:'Pending',fixed:'Fixed'};return `<span class="badge ${m[s]||'bgr'}">${l[s]||s}</span>`;}
function showL(msg){document.getElementById('lt2').textContent=msg||'Loading...';document.getElementById('lo').classList.add('show');}
function hideL(){document.getElementById('lo').classList.remove('show');}
function toast(msg,type){const t=document.getElementById('toast');t.textContent=msg;t.className='show'+(type?' '+type:'');clearTimeout(t._t);t._t=setTimeout(()=>t.className='',2500);}

boot();