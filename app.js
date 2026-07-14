'use strict';

// ═══ CONSTANTS ════════════════════════════════════════════════════
const C={bg0:"#15171f",bg1:"#1b1e29",card:"#1f2330",border:"#323748",t0:"#ffffff",t1:"#b8bcce",t2:"#7c8194",blue:"#60a5fa",green:"#34d399",amber:"#fbbf24",red:"#f87171",purple:"#c4b5fd",cyan:"#5eead4"};
const DISC_ICON={Ciclismo:"🚴","Ciclismo Indoor":"🚴",Carrera:"🏃","Carrera Indoor":"🏃","Natación":"🏊",Fuerza:"💪",Brick:"⚡",Otro:"🎯"};
const DISC_C={Ciclismo:C.blue,"Ciclismo Indoor":C.blue,Carrera:C.green,"Carrera Indoor":C.green,"Natación":C.cyan,Fuerza:C.purple,Brick:C.amber,Otro:C.t1};
const DISCS=["Ciclismo","Ciclismo Indoor","Carrera","Carrera Indoor","Natación","Fuerza","Brick","Otro"];
const ic=d=>d&&d.toLowerCase().includes("ciclismo");
const ir=d=>d&&d.toLowerCase().includes("carrera");
const isw=d=>d&&(d.toLowerCase().includes("nataci")||d.toLowerCase().includes("swim"));

// ═══ UTILS ════════════════════════════════════════════════════════
const today=()=>new Date().toISOString().split("T")[0];
const r0=n=>Math.round(n);
const r1=n=>Math.round(n*10)/10;
const cl=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const avg=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:0;
const slp=a=>{if(a.length<2)return 0;const xm=(a.length-1)/2,ym=avg(a);let n=0,d=0;a.forEach((y,x)=>{n+=(x-xm)*(y-ym);d+=(x-xm)**2;});return d?n/d:0;};
const dRange=days=>{const o=[];for(let i=days-1;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);o.push(d.toISOString().split("T")[0]);}return o;};
const dUntil=s=>Math.ceil((new Date(s)-new Date())/86400000);
const fmtD=s=>{try{return new Date(s+"T12:00:00").toLocaleDateString("es-ES",{weekday:"short",day:"numeric",month:"short"});}catch{return s;}};
const fmtPace=sec=>{if(!sec||sec<=0)return"—";const m=Math.floor(sec/60),s=r0(sec%60);return`${m}:${String(s).padStart(2,"0")}`;};
const parsePace=s=>{if(!s)return null;const m=s.match(/(\d+)[:\-](\d+)/);return m?+m[1]*60+ +m[2]:null;};

// ═══ STORAGE — DATOS NUNCA SE BORRAN ══════════════════════════════
const DB = {
  KEY_LOGS: 'ic_logs_v2',
  KEY_WKS:  'ic_wks_v2',
  KEY_CFG:  'ic_cfg_v2',

  // Carga con merge: datos base siempre presentes, usuario encima
  loadLogs() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.KEY_LOGS)||'[]');
      const map = {};
      // Base primero
      LOGS0.forEach(l=>{ map[l.date]={...l}; });
      // Usuario encima (nunca se pierden)
      saved.forEach(l=>{ map[l.date]={...(map[l.date]||{}), ...l}; });
      return Object.values(map).sort((a,b)=>a.date.localeCompare(b.date));
    } catch(e) { return [...LOGS0]; }
  },

  loadWks() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.KEY_WKS)||'[]');
      const map = {};
      // Base primero
      WK0.forEach(w=>{ map[w.id]={...w}; });
      // Usuario encima — si usa el mismo id, sobreescribe (corrección); si no, se añade
      saved.forEach(w=>{ map[w.id]={...(map[w.id]||{}), ...w}; });
      return Object.values(map).sort((a,b)=>a.date.localeCompare(b.date));
    } catch(e) { return [...WK0]; }
  },

  isBaseLog(date) { return LOGS0.some(l=>l.date===date); },
  isBaseWk(id) { return WK0.some(w=>w.id===id); },

  loadCfg() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.KEY_CFG)||'null');
      return saved ? {...DEF_CFG,...saved} : {...DEF_CFG};
    } catch(e) { return {...DEF_CFG}; }
  },

  saveLog(log) {
    try {
      const saved = JSON.parse(localStorage.getItem(this.KEY_LOGS)||'[]');
      const filtered = saved.filter(l=>l.date!==log.date);
      const newSaved = [...filtered, log];
      localStorage.setItem(this.KEY_LOGS, JSON.stringify(newSaved));
      return true;
    } catch(e) { return false; }
  },

  saveWk(wk) {
    try {
      const saved = JSON.parse(localStorage.getItem(this.KEY_WKS)||'[]');
      // Nunca duplicar por id
      const filtered = saved.filter(w=>w.id!==wk.id);
      localStorage.setItem(this.KEY_WKS, JSON.stringify([...filtered, wk]));
      return true;
    } catch(e) { return false; }
  },

  // Borra una entrada de usuario. Si date/id corresponde a un dato BASE, no hace nada
  // (no se puede "borrar" un dato del Excel, solo corregirlo o dejarlo tal cual).
  deleteLog(date) {
    try {
      const saved = JSON.parse(localStorage.getItem(this.KEY_LOGS)||'[]');
      localStorage.setItem(this.KEY_LOGS, JSON.stringify(saved.filter(l=>l.date!==date)));
      return true;
    } catch(e) { return false; }
  },

  deleteWk(id) {
    try {
      const saved = JSON.parse(localStorage.getItem(this.KEY_WKS)||'[]');
      localStorage.setItem(this.KEY_WKS, JSON.stringify(saved.filter(w=>w.id!==id)));
      return true;
    } catch(e) { return false; }
  },

  KEY_CFG_HIST: 'ic_cfg_hist_v1',
  CFG_TRACKED: ['ftp','fcmax','fcrest','targetWeight','raceDate'],
  CFG_LABELS: {ftp:'FTP',fcmax:'FC máxima',fcrest:'FC reposo',targetWeight:'Peso objetivo',raceDate:'Fecha de carrera'},

  loadCfgHistory() {
    try { return JSON.parse(localStorage.getItem(this.KEY_CFG_HIST)||'[]'); }
    catch(e) { return []; }
  },

  // Compara cfg anterior vs nuevo, registra solo los campos que cambiaron
  saveCfg(cfg) {
    try {
      const prev = this.loadCfg();
      const hist = this.loadCfgHistory();
      const changes = [];
      this.CFG_TRACKED.forEach(field=>{
        if(prev[field]!==undefined && cfg[field]!==undefined && String(prev[field])!==String(cfg[field])){
          changes.push({field, from:prev[field], to:cfg[field], date:today()});
        }
      });
      if(changes.length){
        const newHist=[...hist,...changes];
        localStorage.setItem(this.KEY_CFG_HIST, JSON.stringify(newHist));
      }
      localStorage.setItem(this.KEY_CFG, JSON.stringify(cfg));
      return true;
    } catch(e) { return false; }
  },

  KEY_PLAN: 'ic_plan_v1',
  loadPlan() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.KEY_PLAN)||'null');
      if(saved) return saved;
    } catch(e) {}
    const empty={};
    DAY_KEYS.forEach(k=>empty[k]={disc:null,note:''});
    return empty;
  },
  savePlan(plan) {
    try {
      localStorage.setItem(this.KEY_PLAN, JSON.stringify(plan));
      return true;
    } catch(e) { return false; }
  },

  KEY_ATHLETE_CORE: 'ic_athlete_core_v1',
  loadAthleteCore() {
    const defaults={
      birthDate:'',
      height:'',
      usualWeight:'',
      experience:'intermedio',
      weeklyHours:8,
      availableDays:5,
      injuries:'',
      limitations:'',
      equipment:'Bicicleta de carretera, rodillo, piscina y material de fuerza',
      primaryPurpose:'Desarrollar un atleta completo',
      secondaryGoals:'',
      strengths:'',
      weaknesses:'',
      preferences:'',
      manualCaps:{
        strength:50,
        mobility:50,
        core:50,
        endurance:50,
        power:50,
        technique:50
      },
      updatedAt:null
    };
    try {
      const saved=JSON.parse(localStorage.getItem(this.KEY_ATHLETE_CORE)||'null');
      return saved?{...defaults,...saved,manualCaps:{...defaults.manualCaps,...(saved.manualCaps||{})}}:defaults;
    } catch(e) { return defaults; }
  },
  saveAthleteCore(core) {
    try {
      localStorage.setItem(this.KEY_ATHLETE_CORE,JSON.stringify({...core,updatedAt:new Date().toISOString()}));
      return true;
    } catch(e) { return false; }
  },

  KEY_DAILY_STATUS: 'ic_daily_status_v1',
  loadDailyStatus() {
    try { return JSON.parse(localStorage.getItem(this.KEY_DAILY_STATUS)||'[]'); }
    catch(e) { return []; }
  },
  getDailyStatus(date) {
    return this.loadDailyStatus().find(s=>s.date===date)||{date,status:'pending',updatedAt:null};
  },
  saveDailyStatus(entry) {
    try {
      const all=this.loadDailyStatus().filter(s=>s.date!==entry.date);
      localStorage.setItem(this.KEY_DAILY_STATUS,JSON.stringify([...all,entry]));
      return true;
    } catch(e) { return false; }
  },

  resetUser() {
    // Solo borra entradas del usuario, NUNCA los datos base
    localStorage.removeItem(this.KEY_LOGS);
    localStorage.removeItem(this.KEY_WKS);
    // Cfg no se borra en reset suave
  },


  countUserLogs() {
    try { return JSON.parse(localStorage.getItem(this.KEY_LOGS)||'[]').length; } catch { return 0; }
  },
  countUserWks() {
    try { return JSON.parse(localStorage.getItem(this.KEY_WKS)||'[]').length; } catch { return 0; }
  }
};

// ═══ DEFAULT CONFIG ════════════════════════════════════════════════
const DEF_CFG={ftp:335,fcmax:187,fcrest:48,targetWeight:79,raceDate:"2027-04-06",raceName:"Ironman 70.3 Valencia"};

// ═══ REAL DATA (Excel import) ══════════════════════════════════════
const LOGS0=[
{date:"2026-04-01",weight:81.1,hrv:78,sleep:7.4,sq:9.2,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-02",weight:null,hrv:109,sleep:5,sq:4.5,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-03",weight:null,hrv:73,sleep:7.6,sq:9,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-04",weight:null,hrv:66,sleep:6.25,sq:7,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-05",weight:null,hrv:100,sleep:4.75,sq:4,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-06",weight:81.1,hrv:65,sleep:6.1,sq:6,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-07",weight:80,hrv:130,sleep:8.25,sq:9.8,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-08",weight:80.6,hrv:67,sleep:6.9,sq:9,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-09",weight:80.6,hrv:94,sleep:7.9,sq:8,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-10",weight:81.1,hrv:80,sleep:7.9,sq:9,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-11",weight:81.9,hrv:66,sleep:6.5,sq:9,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-12",weight:81.9,hrv:92,sleep:6.3,sq:8,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-13",weight:81.2,hrv:133,sleep:6.3,sq:7,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-14",weight:null,hrv:52,sleep:6.5,sq:8.9,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-15",weight:81.9,hrv:66,sleep:7,sq:8.9,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-16",weight:81.1,hrv:79,sleep:7.7,sq:9.6,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-17",weight:81.1,hrv:64,sleep:6.7,sq:8.4,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-18",weight:null,hrv:62,sleep:6.45,sq:8.1,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-19",weight:null,hrv:224,sleep:6.5,sq:7,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-20",weight:81.1,hrv:226,sleep:6.75,sq:7.8,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-21",weight:81.1,hrv:161,sleep:6.7,sq:9,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-22",weight:null,hrv:114,sleep:5.7,sq:8.3,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-23",weight:81.2,hrv:158,sleep:7.2,sq:8.8,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-24",weight:null,hrv:95,sleep:7.15,sq:9.5,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-25",weight:null,hrv:110,sleep:7.1,sq:8.9,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-26",weight:null,hrv:65,sleep:6.75,sq:8.2,fat:3,mus:3,mood:7,str:3},
{date:"2026-04-27",weight:null,hrv:96,sleep:6.3,sq:8.6,fat:3,mus:3,mood:7,str:4},
{date:"2026-04-28",weight:81.8,hrv:100,sleep:6.25,sq:7.5,fat:3,mus:3,mood:7,str:4},
{date:"2026-04-29",weight:null,hrv:75,sleep:6.1,sq:8.4,fat:3,mus:3,mood:7,str:4},
{date:"2026-04-30",weight:81.1,hrv:108,sleep:6.1,sq:9.3,fat:3,mus:3,mood:7,str:5},
{date:"2026-05-01",weight:81.1,hrv:105,sleep:8.5,sq:null,fat:3,mus:3,mood:7,str:5},
{date:"2026-05-02",weight:null,hrv:70,sleep:null,sq:null,fat:3,mus:3,mood:7,str:5},
{date:"2026-05-03",weight:null,hrv:100,sleep:6.5,sq:5.4,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-04",weight:82.7,hrv:127,sleep:6.5,sq:8.1,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-05",weight:null,hrv:81,sleep:6.35,sq:7.3,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-06",weight:82.7,hrv:77,sleep:6.1,sq:8.5,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-07",weight:81.4,hrv:103,sleep:6.8,sq:9.3,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-08",weight:81.4,hrv:103,sleep:8.25,sq:8.7,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-09",weight:null,hrv:67,sleep:null,sq:null,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-10",weight:null,hrv:60,sleep:6.1,sq:7.8,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-11",weight:81,hrv:88,sleep:7.1,sq:9,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-12",weight:null,hrv:50,sleep:6.1,sq:8,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-13",weight:81,hrv:242,sleep:3.75,sq:3.3,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-14",weight:null,hrv:95,sleep:6.8,sq:9.2,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-15",weight:81,hrv:91,sleep:5.6,sq:7.3,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-16",weight:null,hrv:64,sleep:5.55,sq:6.2,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-17",weight:null,hrv:180,sleep:null,sq:null,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-18",weight:null,hrv:65,sleep:5.2,sq:6,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-19",weight:81,hrv:141,sleep:7.5,sq:9.7,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-20",weight:81.7,hrv:67,sleep:6.5,sq:6.9,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-21",weight:82.1,hrv:77,sleep:6,sq:5.7,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-22",weight:null,hrv:92,sleep:6.4,sq:6.4,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-23",weight:82,hrv:97,sleep:6.55,sq:7.4,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-24",weight:82,hrv:113,sleep:7.3,sq:7.1,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-25",weight:82,hrv:102,sleep:8.2,sq:7,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-26",weight:82,hrv:132,sleep:null,sq:8.4,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-27",weight:null,hrv:97,sleep:6,sq:6.2,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-28",weight:82,hrv:96,sleep:7,sq:6.5,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-29",weight:null,hrv:94,sleep:5.9,sq:6.9,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-30",weight:null,hrv:91,sleep:6.7,sq:6.1,fat:3,mus:3,mood:7,str:7},
{date:"2026-05-31",weight:null,hrv:55,sleep:6.85,sq:5.7,fat:4,mus:3,mood:7,str:7},
{date:"2026-06-01",weight:81.8,hrv:95,sleep:6.6,sq:6.8,fat:6,mus:3,mood:7,str:7},
{date:"2026-06-02",weight:81.8,hrv:98,sleep:7.75,sq:7.4,fat:6,mus:3,mood:7,str:4},
{date:"2026-06-03",weight:81.4,hrv:102,sleep:7.8,sq:7.9,fat:3,mus:3,mood:7,str:4},
{date:"2026-06-04",weight:81.4,hrv:107,sleep:7,sq:6.3,fat:7,mus:3,mood:7,str:6},
{date:"2026-06-05",weight:82.3,hrv:93,sleep:6.2,sq:8.5,fat:6,mus:3,mood:7,str:6},
{date:"2026-06-06",weight:null,hrv:70,sleep:5,sq:5.5,fat:6,mus:3,mood:7,str:6},
{date:"2026-06-07",weight:82.7,hrv:97,sleep:7.85,sq:10,fat:6,mus:3,mood:7,str:6},
{date:"2026-06-08",weight:82,hrv:122,sleep:6.35,sq:8,fat:3,mus:3,mood:7,str:6},
{date:"2026-06-09",weight:82,hrv:132,sleep:6.8,sq:9,fat:8,mus:3,mood:7,str:6},
{date:"2026-06-10",weight:82.7,hrv:129,sleep:6.3,sq:8,fat:6,mus:3,mood:7,str:6},
{date:"2026-06-11",weight:81.3,hrv:110,sleep:8.1,sq:10,fat:3,mus:3,mood:7,str:7},
{date:"2026-06-12",weight:null,hrv:121,sleep:5,sq:5,fat:3,mus:3,mood:7,str:3},
{date:"2026-06-13",weight:null,hrv:114,sleep:7.9,sq:9,fat:7,mus:3,mood:7,str:2},
{date:"2026-06-14",weight:null,hrv:101,sleep:6.95,sq:9,fat:6,mus:3,mood:7,str:2},
{date:"2026-06-15",weight:82.2,hrv:160,sleep:6.15,sq:6.5,fat:6,mus:3,mood:7,str:6},
{date:"2026-06-16",weight:82.2,hrv:129,sleep:7.5,sq:9.5,fat:8,mus:3,mood:7,str:6},
{date:"2026-06-17",weight:83.4,hrv:123,sleep:6.85,sq:9,fat:8,mus:3,mood:7,str:6},
{date:"2026-06-18",weight:83.4,hrv:122,sleep:6.95,sq:9,fat:8,mus:3,mood:7,str:6},
{date:"2026-06-19",weight:82.2,hrv:132,sleep:7.15,sq:9.5,fat:5,mus:3,mood:7,str:6}
];

const WK0=[
{id:"x4",date:"2026-04-01",discipline:"Ciclismo Indoor",zone:"Z4",duration:56,distance:30.3,tss:47.5,powerAvg:239,powerNorm:239,powerMax:427,hrAvg:150,hrMax:180,cadence:78,elevation:0,rpe:7,swimPaceSec:null,swolf:null,comment:"Sweet Spot"},
{id:"x5",date:"2026-04-06",discipline:"Ciclismo",zone:"Z2",duration:184,distance:85.72,tss:105,powerAvg:196,powerNorm:196,powerMax:0,hrAvg:136,hrMax:160,cadence:81,elevation:1269,rpe:4,swimPaceSec:null,swolf:null,comment:""},
{id:"x6",date:"2026-04-07",discipline:"Carrera Indoor",zone:"Z3",duration:36,distance:6.55,tss:0,powerAvg:0,powerNorm:0,powerMax:0,hrAvg:145,hrMax:165,cadence:158,elevation:0,rpe:4,swimPaceSec:null,swolf:null,comment:"Tempo"},
{id:"x7",date:"2026-04-08",discipline:"Ciclismo Indoor",zone:"Z4",duration:57,distance:30.8,tss:47.5,powerAvg:237,powerNorm:237,powerMax:361,hrAvg:148,hrMax:179,cadence:77,elevation:0,rpe:5,swimPaceSec:null,swolf:null,comment:"Sweet Spot"},
{id:"x8",date:"2026-04-15",discipline:"Ciclismo Indoor",zone:"Z2",duration:40,distance:0,tss:23.8,powerAvg:200,powerNorm:200,powerMax:200,hrAvg:122,hrMax:142,cadence:0,elevation:0,rpe:2,swimPaceSec:null,swolf:null,comment:""},
{id:"x9",date:"2026-04-15",discipline:"Carrera Indoor",zone:"Z2",duration:20,distance:0,tss:0,powerAvg:0,powerNorm:0,powerMax:0,hrAvg:137,hrMax:147,cadence:157,elevation:0,rpe:2,swimPaceSec:null,swolf:null,comment:""},
{id:"x10",date:"2026-04-16",discipline:"Carrera",zone:"Z2",duration:20,distance:0,tss:0,powerAvg:0,powerNorm:0,powerMax:0,hrAvg:142,hrMax:153,cadence:160,elevation:44,rpe:2,swimPaceSec:null,swolf:null,comment:""},
{id:"x11",date:"2026-04-17",discipline:"Ciclismo Indoor",zone:"Z3",duration:60,distance:32.5,tss:48.8,powerAvg:234,powerNorm:234,powerMax:392,hrAvg:144,hrMax:184,cadence:78,elevation:0,rpe:9,swimPaceSec:null,swolf:null,comment:"Sweet Spot"},
{id:"x12",date:"2026-04-21",discipline:"Fuerza",zone:"Z1",duration:33,distance:0,tss:0,powerAvg:0,powerNorm:0,powerMax:0,hrAvg:108,hrMax:156,cadence:0,elevation:0,rpe:4,swimPaceSec:null,swolf:null,comment:"Fuerza"},
{id:"x13",date:"2026-05-07",discipline:"Ciclismo",zone:"Z1",duration:74,distance:35.32,tss:26.7,powerAvg:156,powerNorm:156,powerMax:0,hrAvg:122,hrMax:155,cadence:79,elevation:349,rpe:4,swimPaceSec:null,swolf:null,comment:"Z2"},
{id:"x14",date:"2026-05-10",discipline:"Carrera",zone:"Z2",duration:27,distance:4.5,tss:0,powerAvg:0,powerNorm:0,powerMax:0,hrAvg:128,hrMax:165,cadence:164,elevation:50,rpe:2,swimPaceSec:null,swolf:null,comment:""},
{id:"x15",date:"2026-05-20",discipline:"Carrera",zone:"Z3",duration:29,distance:5.38,tss:0,powerAvg:0,powerNorm:0,powerMax:0,hrAvg:146,hrMax:160,cadence:158,elevation:41,rpe:3,swimPaceSec:null,swolf:null,comment:"Z2"},
{id:"x16",date:"2026-05-22",discipline:"Ciclismo Indoor",zone:"Z5",duration:63,distance:33,tss:49.9,powerAvg:231,powerNorm:231,powerMax:420,hrAvg:150,hrMax:181,cadence:75,elevation:0,rpe:9,swimPaceSec:null,swolf:null,comment:"VO2max"},
{id:"x17",date:"2026-05-23",discipline:"Ciclismo",zone:"Z2",duration:123,distance:45.72,tss:103.5,powerAvg:202,powerNorm:238,powerMax:790,hrAvg:147,hrMax:186,cadence:85,elevation:341,rpe:7,swimPaceSec:null,swolf:null,comment:"Tempo"},
{id:"x18",date:"2026-05-24",discipline:"Ciclismo",zone:"Z1",duration:120,distance:32.5,tss:35.4,powerAvg:73,powerNorm:141,powerMax:621,hrAvg:90,hrMax:157,cadence:60,elevation:328,rpe:1,swimPaceSec:null,swolf:null,comment:"Z2"},
{id:"x19",date:"2026-06-01",discipline:"Ciclismo Indoor",zone:"Z2",duration:51,distance:0,tss:25.9,powerAvg:173,powerNorm:185,powerMax:299,hrAvg:129,hrMax:148,cadence:80,elevation:0,rpe:3,swimPaceSec:null,swolf:null,comment:""},
{id:"x20",date:"2026-06-02",discipline:"Ciclismo Indoor",zone:"Z2",duration:75,distance:0,tss:51,powerAvg:197,powerNorm:214,powerMax:330,hrAvg:143,hrMax:161,cadence:83,elevation:0,rpe:3,swimPaceSec:null,swolf:null,comment:""},
{id:"x21",date:"2026-06-03",discipline:"Ciclismo",zone:"Z3",duration:103,distance:52.33,tss:83.8,powerAvg:202,powerNorm:234,powerMax:868,hrAvg:147,hrMax:175,cadence:81,elevation:609,rpe:6,swimPaceSec:null,swolf:null,comment:"Z2"},
{id:"x22",date:"2026-06-04",discipline:"Ciclismo",zone:"Z3",duration:71,distance:35.19,tss:57.7,powerAvg:203,powerNorm:234,powerMax:614,hrAvg:137,hrMax:162,cadence:78,elevation:373,rpe:7,swimPaceSec:null,swolf:null,comment:"Z2"},
{id:"x23",date:"2026-06-07",discipline:"Ciclismo",zone:"Z1",duration:77,distance:32.5,tss:31.9,powerAvg:138,powerNorm:167,powerMax:688,hrAvg:121,hrMax:160,cadence:68,elevation:350,rpe:4,swimPaceSec:null,swolf:null,comment:"Z2"},
{id:"x24",date:"2026-06-08",discipline:"Ciclismo",zone:"Z2",duration:66,distance:35.6,tss:63.7,powerAvg:223,powerNorm:255,powerMax:736,hrAvg:143,hrMax:171,cadence:79,elevation:374,rpe:7,swimPaceSec:null,swolf:null,comment:""},
{id:"x25",date:"2026-06-10",discipline:"Ciclismo",zone:"Z2",duration:214,distance:105.87,tss:201.8,powerAvg:204,powerNorm:252,powerMax:753,hrAvg:146,hrMax:177,cadence:79,elevation:1352,rpe:7,swimPaceSec:null,swolf:null,comment:"Tempo"},
{id:"x26",date:"2026-06-12",discipline:"Ciclismo",zone:"Z2",duration:99,distance:34.4,tss:101.7,powerAvg:223,powerNorm:263,powerMax:483,hrAvg:146,hrMax:170,cadence:68,elevation:1081,rpe:7,swimPaceSec:null,swolf:null,comment:""},
{id:"x27",date:"2026-06-13",discipline:"Ciclismo",zone:"Z2",duration:180,distance:52.8,tss:159.2,powerAvg:194,powerNorm:244,powerMax:511,hrAvg:136,hrMax:167,cadence:62,elevation:1852,rpe:8,swimPaceSec:null,swolf:null,comment:""},
{id:"x28",date:"2026-06-15",discipline:"Fuerza",zone:"Z1",duration:30,distance:0,tss:9,powerAvg:0,powerNorm:0,powerMax:0,hrAvg:110,hrMax:157,cadence:157,elevation:0,rpe:4,swimPaceSec:null,swolf:null,comment:"Fuerza"},
{id:"x29",date:"2026-06-16",discipline:"Natación",zone:"Z2",duration:23,distance:1.05,tss:7.5,powerAvg:0,powerNorm:0,powerMax:0,hrAvg:119,hrMax:165,cadence:165,elevation:0,rpe:4,swimPaceSec:136,swolf:80,comment:"ritmo de 2´16¨ los 100m / SWOLF: 80"},
{id:"x30",date:"2026-06-18",discipline:"Natación",zone:"Z2",duration:22,distance:1.05,tss:7,powerAvg:0,powerNorm:0,powerMax:0,hrAvg:124,hrMax:167,cadence:167,elevation:0,rpe:4,swimPaceSec:126,swolf:77,comment:"ritmo de 2´06¨ los 100m / SWOLF: 77"},
{id:"x31",date:"2026-06-19",discipline:"Ciclismo Indoor",zone:"Z3",duration:60,distance:31.4,tss:55.7,powerAvg:250,powerNorm:250,powerMax:359,hrAvg:150,hrMax:178,cadence:78,elevation:0,rpe:8,swimPaceSec:null,swolf:null,comment:"Sweet Spot"}
];

// ═══ METRICS ENGINE ═══════════════════════════════════════════════
function estTSS(w,cfg){
  if(w.tss>0)return w.tss;
  if(ic(w.discipline)&&w.powerNorm>0&&w.duration>0){const IF=w.powerNorm/cfg.ftp;return r1(((w.duration*60)*w.powerNorm*IF)/(cfg.ftp*3600)*100);}
  if(ir(w.discipline))return r1(w.duration*(w.hrAvg?w.hrAvg/cfg.fcmax:0.75)*(w.rpe?w.rpe/10:0.6)*1.2);
  if(isw(w.discipline))return r1(w.duration*(w.rpe?w.rpe/10:0.5)*0.8);
  return r1(w.duration*0.3);
}

function calcPMC(wks){
  const rng=dRange(95),map={};
  wks.forEach(w=>{map[w.date]=(map[w.date]||0)+(w.tss||0);});
  const ctlA=[],atlA=[],tsbA=[];let ctl=0,atl=0;
  rng.forEach(d=>{const t=map[d]||0;ctl=t/42+ctl*(41/42);atl=t/7+atl*(6/7);ctlA.push(r1(ctl));atlA.push(r1(atl));tsbA.push(r1(ctl-atl));});
  return{ctl:ctlA.at(-1),atl:atlA.at(-1),tsb:tsbA.at(-1),ctlA,atlA,tsbA};
}

function calcRS(log,base){
  if(!log)return null;
  const h=log.hrv||base||90;
  const hN=cl((h/(base||90))*70,0,100);
  const sN=cl(((log.sleep||7)/9)*100,0,100);
  const fN=cl(100-((log.fat||3)-1)*11,0,100);
  const mN=cl(100-((log.mus||3)-1)*11,0,100);
  const dN=log.mood?cl((log.mood/10)*100,0,100):60;
  return cl(r0(0.30*hN+0.25*sN+0.20*fN+0.15*mN+0.10*dN),0,100);
}

function calcEF(w){
  if(!w.hrAvg||w.hrAvg<60)return null;
  if(ic(w.discipline)&&w.powerAvg>50)return r1((w.powerNorm||w.powerAvg)/w.hrAvg);
  if(ir(w.discipline)&&w.distance>0&&w.duration>0)return r1((w.distance*1000/w.duration)/w.hrAvg);
  return null;
}

function calcHRV(logs){
  const h=logs.filter(l=>l.hrv>0&&l.hrv<280).sort((a,b)=>a.date.localeCompare(b.date));
  const l7=h.slice(-7).map(l=>l.hrv),l30=h.slice(-30).map(l=>l.hrv);
  const b30=r1(avg(l30)),cur=h.at(-1)?.hrv||0;
  return{b7:r1(avg(l7)),b30,slope:r1(slp(l30)*7),signal:b30>0?cl(r0((cur/b30)*100),0,150):null,hist:h.slice(-30)};
}

function calcWT(logs,tgt){
  const h=logs.filter(l=>l.weight>0).sort((a,b)=>a.date.localeCompare(b.date));
  const l7=h.slice(-7).map(l=>l.weight),l30=h.slice(-30).map(l=>l.weight);
  const cur=h.at(-1)?.weight||0;
  const d7=l7.length>=2?r1(cur-avg(l7.slice(0,-1))):null;
  return{b7:r1(avg(l7)),b30:r1(avg(l30)),slope:r1(slp(l30)*7),cur,d7,def:r1(Math.max(0,cur-tgt)),hist:h.slice(-30)};
}

function calcEFT(wks){
  const ss=wks.filter(w=>(w.zone==="Z2"||w.zone==="Z1")&&(ic(w.discipline)||ir(w.discipline)))
    .map(w=>({date:w.date,ef:calcEF(w)})).filter(e=>e.ef&&e.ef>0.5)
    .sort((a,b)=>a.date.localeCompare(b.date)).slice(-20);
  return{cur:ss.at(-1)?.ef||null,sl:r1(slp(ss.map(e=>e.ef))*4),b4:r1(avg(ss.slice(0,4).map(e=>e.ef))),hist:ss.slice(-12)};
}

function calcIRI(cfg,wks,logs,pmc){
  const wt=calcWT(logs,cfg.targetWeight);
  const hrv=calcHRV(logs);
  const ctlS=cl((pmc.ctl/65)*100,0,100);
  const ftpS=cl(((cfg.ftp/(wt.cur||82))/3.5)*100,0,100);
  const rng56=dRange(56),wg={};
  rng56.forEach(d=>{const k=d.slice(0,7);wg[k]=wg[k]||new Set();});
  wks.filter(w=>rng56.includes(w.date)).forEach(w=>{const k=w.date.slice(0,7);if(wg[k])wg[k].add(w.discipline.split(" ")[0]);});
  const consS=cl((Object.values(wg).filter(s=>s.size>=2).length/8)*100,0,100);
  const maxB=Math.max(0,...wks.filter(w=>ic(w.discipline)).map(w=>w.distance||0));
  const maxR=Math.max(0,...wks.filter(w=>ir(w.discipline)).map(w=>w.distance||0));
  const maxS=Math.max(0,...wks.filter(w=>isw(w.discipline)).map(w=>w.distance||0));
  const hB=hrv.slope>0.5?10:hrv.slope>-0.5?5:0;
  const comp={
    ctl:{sc:r0(ctlS),label:"Volumen base (CTL)",val:`${pmc.ctl}/65`},
    ftp:{sc:r0(ftpS),label:"Potencia/Peso",val:`${r1(cfg.ftp/(wt.cur||82))} W/kg`},
    con:{sc:r0(consS),label:"Consistencia",val:`${r0(consS/12.5)}/8 sem`},
    bike:{sc:r0(cl((maxB/90)*100,0,100)),label:"Largo bici",val:`${r1(maxB)}/90km`},
    run:{sc:r0(cl((maxR/21)*100,0,100)),label:"Largo carrera",val:`${r1(maxR)}/21km`},
    swim:{sc:r0(cl((maxS/1.9)*100,0,100)),label:"Largo natación",val:`${r1(maxS)}/1.9km`},
  };
  const W={ctl:0.25,ftp:0.25,con:0.20,bike:0.15,run:0.10,swim:0.05};
  const tot=cl(r0(Object.entries(comp).reduce((a,[k,c])=>a+c.sc*W[k],0)*0.9+hB),0,100);
  return{tot,comp};
}

// ═══ RACE READINESS SCORE ═════════════════════════════════════════
// 4 pilares: Resistencia específica (40%), Rendimiento específico (30%),
// Estado fisiológico (20%), Consistencia (10%). Por disciplina.

function calcRaceReadiness(disc, wks, logs, pmc, cfg){
  const filterFn = disc==='bike'?ic : disc==='run'?ir : isw;
  const dWks = wks.filter(w=>filterFn(w.discipline));

  // ── Pilar 1: Resistencia específica (40%) ──
  // Sesiones largas predominantemente Z2 (o con desglose Z2 significativo)
  const longZ2 = dWks.filter(w=>{
    const z2min = w.zoneBreakdown ? (w.zoneBreakdown.Z2||0) : (w.zone==='Z2'?w.duration:0);
    return z2min >= 30; // al menos 30min en Z2 para contar como sesión de resistencia
  });
  let resistanceScore = 0;
  if(longZ2.length){
    // Duración: la sesión más larga en Z2, normalizada al objetivo de disciplina
    const targetMin = disc==='bike'?180 : disc==='run'?90 : 40; // minutos objetivo de sesión larga 70.3-relevante
    const maxZ2min = Math.max(...longZ2.map(w=>w.zoneBreakdown?(w.zoneBreakdown.Z2||0):(w.zone==='Z2'?w.duration:0)));
    const durScore = cl((maxZ2min/targetMin)*100,0,100);
    // EF: usar calcEFT ya existente, filtrado a esta disciplina
    const efSessions = longZ2.map(w=>calcEF(w)).filter(e=>e!==null);
    const efScore = efSessions.length ? cl((avg(efSessions)/(disc==='bike'?1.5:1.0))*100,0,100) : 50;
    // Deriva cardíaca: si hay datos, baja deriva = mejor puntuación
    const driftSessions = longZ2.filter(w=>w.cardiacDrift!==null && w.cardiacDrift!==undefined).map(w=>w.cardiacDrift);
    const driftScore = driftSessions.length ? cl(100-(avg(driftSessions)*8),0,100) : null; // 0%=100pts, 12.5%=0pts
    // Combinar: duración 50%, EF 30%, deriva 20% (si existe; si no, redistribuir a duración+EF)
    if(driftScore!==null){
      resistanceScore = r0(durScore*0.5 + efScore*0.3 + driftScore*0.2);
    } else {
      resistanceScore = r0(durScore*0.65 + efScore*0.35);
    }
  }

  // ── Pilar 2: Rendimiento específico (30%) ──
  const qualityZones = ['Z3','Z4','Z5','Z6'];
  const qualityWks = dWks.filter(w=>{
    if(w.zoneBreakdown){
      const qmin = qualityZones.reduce((a,z)=>a+(w.zoneBreakdown[z]||0),0);
      return qmin >= 10;
    }
    return qualityZones.includes(w.zone);
  });
  let performanceScore = 50; // neutral si no hay datos
  if(qualityWks.length){
    if(disc==='bike'){
      const powers = qualityWks.map(w=>w.powerNorm||w.powerAvg).filter(p=>p>0);
      if(powers.length){
        const bestPower = Math.max(...powers);
        const wkg = bestPower/(calcWT(logs,cfg.targetWeight).cur||82);
        performanceScore = cl((wkg/4.0)*100,0,100); // 4.0 W/kg sostenido = referencia top amateur
      }
    } else if(disc==='run'){
      const paces = qualityWks.map(w=>w.paceAvgSec).filter(p=>p>0);
      if(paces.length){
        const bestPace = Math.min(...paces); // menor = más rápido
        performanceScore = cl((270/bestPace)*100,0,100); // 4:30/km = referencia top amateur
      }
    } else {
      const paces = qualityWks.map(w=>w.swimPaceSec).filter(p=>p>0);
      if(paces.length){
        const bestPace = Math.min(...paces);
        performanceScore = cl((100/bestPace)*100,0,100); // 1:40/100m = referencia top amateur
      }
    }
    // Tendencia reciente: comparar primeras vs últimas sesiones de calidad
    if(qualityWks.length>=4){
      const sorted=[...qualityWks].sort((a,b)=>a.date.localeCompare(b.date));
      const efTrend=calcEFT(sorted);
      if(efTrend.sl>0) performanceScore=cl(performanceScore+5,0,100);
    }
  }

  // ── Pilar 3: Estado fisiológico (20%) ──
  const hrv=calcHRV(logs);
  const hrvScore = hrv.signal!==null ? cl(hrv.signal,0,100) : 60;
  const tsbScore = cl(((pmc.tsb+30)/50)*100,0,100);
  const recentLog = logs.filter(l=>l.fat!==undefined).slice(-7);
  const fatScore = recentLog.length ? cl(100-(avg(recentLog.map(l=>l.fat||3))-1)*11,0,100) : 60;
  const physioScore = r0(hrvScore*0.4 + tsbScore*0.35 + fatScore*0.25);

  // ── Pilar 4: Consistencia (10%) ──
  const w4=dRange(28).filter(d=>dWks.some(w=>w.date===d)).length>0?dWks.filter(w=>dRange(28).includes(w.date)).length:0;
  const w8=dWks.filter(w=>dRange(56).includes(w.date)).length;
  const w12=dWks.filter(w=>dRange(84).includes(w.date)).length;
  const expected4=disc==='bike'?8:disc==='run'?8:4; // sesiones esperadas en 4 semanas según disciplina
  const consistencyScore = cl((w4/expected4)*100,0,100);

  const total = cl(r0(resistanceScore*0.40 + performanceScore*0.30 + physioScore*0.20 + consistencyScore*0.10),0,100);

  return {
    total,
    pillars:{
      resistance:{sc:resistanceScore,label:'Resistencia específica',weight:40},
      performance:{sc:r0(performanceScore),label:'Rendimiento específico',weight:30},
      physio:{sc:physioScore,label:'Estado fisiológico',weight:20},
      consistency:{sc:r0(consistencyScore),label:'Consistencia',weight:10},
    },
    sessionsCount:dWks.length,
    longZ2Count:longZ2.length,
    qualityCount:qualityWks.length,
  };
}

function calcRaceReadinessGlobal(wks,logs,pmc,cfg){
  const bike=calcRaceReadiness('bike',wks,logs,pmc,cfg);
  const run=calcRaceReadiness('run',wks,logs,pmc,cfg);
  const swim=calcRaceReadiness('swim',wks,logs,pmc,cfg);
  // Peso por disciplina en el global: bici pesa más en tiempo total de un 70.3
  const global=r0(bike.total*0.45 + run.total*0.35 + swim.total*0.20);

  // Interpretación automática
  const scores={Ciclismo:bike.total,Carrera:run.total,Natación:swim.total};
  const entries=Object.entries(scores).filter(([,v])=>v>0);
  let strongest=null,weakest=null;
  if(entries.length){
    entries.sort((a,b)=>b[1]-a[1]);
    strongest=entries[0][0];
    weakest=entries[entries.length-1][0];
  }
  // Mayor potencial de mejora: el pilar con menor score entre las 3 disciplinas
  const allPillars=[
    {disc:'Ciclismo',...bike.pillars.resistance,sport:'bike'},
    {disc:'Carrera',...run.pillars.resistance,sport:'run'},
    {disc:'Natación',...swim.pillars.resistance,sport:'swim'},
  ];
  allPillars.sort((a,b)=>a.sc-b.sc);
  const improvePotential = allPillars[0];

  return {global, bike, run, swim, strongest, weakest, improvePotential};
}

function getRec(rs,tsb,log,hrv){
  if(tsb<-35)return{lv:"red",title:"Descanso obligatorio",text:`TSB ${tsb}. Carga crítica acumulada.`,zone:null};
  if(hrv.signal&&hrv.signal<85)return{lv:"red",title:"HRV muy bajo",text:`Señal HRV ${hrv.signal}% del baseline. Z1 suave o descanso.`,zone:"Z1"};
  if(log&&log.sleep&&log.sleep<5.5)return{lv:"red",title:"Sueño insuficiente",text:`Solo ${log.sleep}h. Sin sesiones de calidad hoy.`,zone:null};
  if(hrv.signal&&hrv.signal<90)return{lv:"amber",title:"HRV bajo — reducir carga",text:`HRV ${hrv.signal}% baseline. Z2 suave <60min.`,zone:"Z2"};
  if(log&&log.sleep&&log.sleep<6.5)return{lv:"amber",title:"Sueño moderado",text:"Reduce intensidad. Z2 moderado hoy.",zone:"Z2"};
  if(rs!==null&&rs<50)return{lv:"red",title:"Recuperación baja",text:"Descanso activo o movilidad.",zone:"Z1"};
  if(rs!==null&&rs<70)return{lv:"amber",title:"Estado moderado",text:"Z2–Z3 según plan. Sin series duras.",zone:"Z2-Z3"};
  if(tsb>10)return{lv:"green",title:"En forma — sesión de calidad",text:`TSB +${tsb}. Momento ideal para Z4–Z5 o test.`,zone:"Z4-Z5"};
  return{lv:"green",title:"Entreno según plan",text:"Estado óptimo. Ejecuta la sesión planificada.",zone:"Z2-Z4"};
}

// ═══ PARSER ═══════════════════════════════════════════════════════
function parseText(txt){
  const t=txt.toLowerCase(),o={};
  if(/nataci[oó]n|swim|piscina/.test(t))o.discipline="Natación";
  else if(/carrera indoor|cinta|treadmill/.test(t))o.discipline="Carrera Indoor";
  else if(/carrera|running|correr/.test(t))o.discipline="Carrera";
  else if(/ciclismo indoor|rodillo|zwift|trainer|turbo|indoor/.test(t))o.discipline="Ciclismo Indoor";
  else if(/ciclismo|bici|bike/.test(t))o.discipline="Ciclismo";
  else if(/fuerza|gym|gimnasio/.test(t))o.discipline="Fuerza";
  const mH=t.match(/(\d+)\s*h(?:oras?)?(?:\s*(\d{1,2})(?:\s*(?:min|m))?)?/);
  const mM=t.match(/(\d+)\s*min/);
  if(mH)o.duration=+mH[1]*60+(mH[2]?+mH[2]:0);
  else if(mM)o.duration=+mM[1];
  const mK=t.match(/(\d+[.,]\d+|\d+)\s*km/);
  const mM2=t.match(/(\d[\d.]*)\s*\.?000?\s*m(?:[^a-z]|$)/);
  if(mK)o.distance=parseFloat(mK[1].replace(",","."));
  else if(mM2){const v=parseFloat(mM2[1]);o.distance=v>100?v/1000:v;}
  const mTSS=t.match(/tss\s*[:=]?\s*([\d.,]+)/);if(mTSS)o.tss=parseFloat(mTSS[1].replace(",","."));
  const mPA=t.match(/potencia\s*media\s*[:=]?\s*(\d+)\s*w/);if(mPA)o.powerAvg=+mPA[1];
  const mNP=t.match(/(?:np|potencia\s*norm[a-z]*)\s*[:=]?\s*(\d+)\s*w/);if(mNP)o.powerNorm=+mNP[1];
  const mFC=t.match(/fc\s*media\s*[:=]?\s*(\d+)/);if(mFC)o.hrAvg=+mFC[1];
  const mFX=t.match(/fc\s*m[aá]x[a-z]*\s*[:=]?\s*(\d+)/);if(mFX)o.hrMax=+mFX[1];
  const mCad=t.match(/(?:cadencia|cad|rpm|ppm)\s*[:=]?\s*(\d+)/);if(mCad)o.cadence=+mCad[1];
  const mElev=t.match(/(\d+)\s*m\s*(?:desnivel|elev)/);if(mElev)o.elevation=+mElev[1];
  const mRPE=t.match(/(?:rpe|esfuerzo)\s*[:=]?\s*(\d+)/);if(mRPE)o.rpe=Math.min(10,+mRPE[1]);
  const mPc=t.match(/(?:ritmo|pace)\s*[:=]?\s*(\d+):(\d+)/)||t.match(/(\d+):(\d+)\s*(?:min\/km|\/km)/);
  if(mPc)o.paceAvgSec=+mPc[1]*60+ +mPc[2];
  const mSw=t.match(/(\d+):(\d+)\s*(?:\/\s*100\s*m|por\s*100)/);if(mSw)o.swimPaceSec=+mSw[1]*60+ +mSw[2];
  const mSWOLF=t.match(/swolf\s*[:=]?\s*(\d+)/);if(mSWOLF)o.swolf=+mSWOLF[1];

  // Desglose por zona: "10min Z1, 40min Z2, 10min Z4" — tiene prioridad sobre zona única
  const breakdown=parseZoneBreakdown(txt);
  if(Object.keys(breakdown).length){
    o.zoneBreakdown=breakdown;
    // Zona dominante = la que más minutos tiene, para mantener compatibilidad
    let domZ=null,domMin=0;
    Object.entries(breakdown).forEach(([z,m])=>{if(m>domMin){domMin=m;domZ=z;}});
    if(domZ)o.zone=domZ;
  } else {
    const mZ=t.match(/\b(z[1-7])\b/);if(mZ)o.zone=mZ[1].toUpperCase();
  }

  const mSens=txt.match(/sensaci[oó]n(?:es)?\s+([\w\s]+?)(?:[,.]|$)/i);if(mSens)o.comment=mSens[0].trim();
  return o;
}

// Parsea "10min Z1, 40min Z2, 10min Z4" o "Z1 10min, Z2 40min" → {Z1:10, Z2:40, Z4:10}
function parseZoneBreakdown(txt){
  const result={};
  // Patrón: número + (min) + Z + dígito  -- o orden inverso Z+dígito + número + min
  const re1=/(\d+)\s*min(?:utos)?\s*(?:en\s*)?z\s*([1-7])/gi;
  const re2=/z\s*([1-7])\s*[:\-]?\s*(\d+)\s*min/gi;
  let m;
  while((m=re1.exec(txt))!==null){
    const min=+m[1], z=`Z${m[2]}`;
    result[z]=(result[z]||0)+min;
  }
  while((m=re2.exec(txt))!==null){
    const z=`Z${m[1]}`, min=+m[2];
    result[z]=(result[z]||0)+min;
  }
  return result;
}

// Deriva cardíaca opcional: "primera mitad 142bpm, segunda mitad 151bpm"
// también acepta "1a mitad 142, 2a mitad 151" o "fc1 142 fc2 151"
function parseCardiacDrift(txt){
  const t=txt.toLowerCase();
  const m1=t.match(/(?:1[aª]?\s*mitad|primera\s*mitad|fc1)\D{0,10}(\d{2,3})/);
  const m2=t.match(/(?:2[aª]?\s*mitad|segunda\s*mitad|fc2)\D{0,10}(\d{2,3})/);
  if(m1&&m2){
    const hr1=+m1[1], hr2=+m2[1];
    if(hr1>40&&hr1<220&&hr2>40&&hr2<220){
      const drift=r1(((hr2-hr1)/hr1)*100);
      return {hr1,hr2,drift};
    }
  }
  return null;
}

function parseDurationFlexible(v){
  if(v===null||v===undefined)return null;
  const s=String(v).trim().toLowerCase();
  if(!s)return null;
  const minMatch=s.match(/^(\d+(?:[\.,]\d+)?)\s*(?:min|mins|minuto|minutos)$/);
  if(minMatch)return +minMatch[1].replace(',','.');
  if(/^\d+(\.\d+)?$/.test(s))return +s;
  const parts=s.split(':').map(Number);
  if(parts.some(n=>Number.isNaN(n)))return null;
  if(parts.length===3)return r1(parts[0]*60+parts[1]+parts[2]/60);
  if(parts.length===2)return r1(parts[0]+parts[1]/60);
  return null;
}
function parseZoneValueToMinutes(v){
  if(v===null||v===undefined)return 0;
  const s=String(v).trim().toLowerCase();
  if(!s||/^x\s*(?:min|lin)?$/.test(s))return 0;
  const minMatch=s.match(/^(\d+(?:[\.,]\d+)?)\s*(?:min|mins|minuto|minutos|lin)$/);
  if(minMatch)return +minMatch[1].replace(',','.');
  if(/^\d+(\.\d+)?$/.test(s))return +s;
  const parts=s.split(':').map(Number);
  if(parts.some(n=>Number.isNaN(n)))return 0;
  if(parts.length===3)return r1(parts[0]*60+parts[1]+parts[2]/60);
  if(parts.length===2)return r1(parts[0]+parts[1]/60);
  return 0;
}
function normalizeKey(k){
  return k.trim().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\s+/g,'_');
}

function parseSpanishDate(v){
  if(!v)return null;
  const s=String(v).trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[,\.]/g,' ')
    .replace(/\s+/g,' ');
  if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
  const months={
    enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,
    julio:7,agosto:8,septiembre:9,setiembre:9,octubre:10,noviembre:11,diciembre:12
  };
  let m=s.match(/^(\d{1,2})\s+(?:de\s+)?([a-z]+)\s+(?:de\s+)?(\d{4})$/);
  if(m&&months[m[2]]){
    return `${m[3]}-${String(months[m[2]]).padStart(2,'0')}-${String(+m[1]).padStart(2,'0')}`;
  }
  m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if(m){
    return `${m[3]}-${String(+m[2]).padStart(2,'0')}-${String(+m[1]).padStart(2,'0')}`;
  }
  return null;
}
function cleanNumeric(v){
  if(v===null||v===undefined||v==='')return null;
  const m=String(v).replace(',','.').match(/-?\d+(?:\.\d+)?/);
  return m?+m[0]:null;
}
function parseStructuredIronCoach(txt){
  const lines=txt.split(/\r?\n/);
  const raw={};
  lines.forEach(line=>{
    const clean=line.trim();
    if(!clean||clean.startsWith('#'))return;
    const m=clean.match(/^([^:=]+)\s*[:=]\s*(.*)$/);
    if(!m)return;
    raw[normalizeKey(m[1])]=m[2].trim();
  });
  if(!Object.keys(raw).length)return null;
  const get=(...keys)=>{
    for(const k of keys){
      const nk=normalizeKey(k);
      if(raw[nk]!==undefined)return raw[nk];
    }
    return null;
  };
  const num=v=>cleanNumeric(v);
  const out={
    date:parseSpanishDate(get('FECHA','DATE')),
    discipline:get('DISCIPLINA','DEPORTE','SPORT'),
    sessionType:get('TIPO','TIPO_SESION','SESSION_TYPE'),
    duration:parseDurationFlexible(get('DURACION','DURACION_MIN','TIEMPO')),
    distance:num(get('DISTANCIA','DISTANCIA_KM')),
    tss:num(get('TSS')),
    powerAvg:num(get('POTENCIA','POTENCIA MEDIA','POTENCIA_MEDIA','POWER_AVG')),
    powerNorm:num(get('NP','POTENCIA_NP','POWER_NORM')),
    powerMax:num(get('POTENCIA MAX','POTENCIA_MAX','POWER_MAX')),
    hrAvg:num(get('FC','FC MEDIA','FC_MEDIA','HR_AVG')),
    hrMax:num(get('FC MAX','FC_MAX','FC_MAXIMA','HR_MAX')),
    cadence:num(get('CADENCIA','CADENCIA_MEDIA','CADENCE')),
    elevation:num(get('DESNIVEL','ALTITUD','ELEVACION','ELEVATION')),
    rpe:num(get('RPE','ESFUERZO')),
    paceAvgSec:parsePace(get('RITMO','RITMO_KM','PACE')),
    swimPaceSec:parsePace(get('RITMO_100M','SWIM_PACE','RITMO_NATACION')),
    swolf:num(get('SWOLF')),
    comment:get('COMENTARIO','NOTAS','RESUMEN')||'',
    zone:get('ZONA','ZONA_DOMINANTE'),
    cardiacDrift:num(get('DERIVA_CARDIACA','CARDIAC_DRIFT'))
  };
  const zones={};
  for(let i=1;i<=7;i++){
    const v=get(`Z${i}`,`ZONA_${i}`);
    const m=parseZoneValueToMinutes(v);
    if(m>0)zones[`Z${i}`]=m;
  }
  if(Object.keys(zones).length){
    out.zoneBreakdown=zones;
    let dom='Z1',max=-1;
    Object.entries(zones).forEach(([z,m])=>{if(m>max){dom=z;max=m;}});
    out.zone=dom;
  }
  Object.keys(out).forEach(k=>{
    if(out[k]===null||out[k]===undefined||out[k]==='')delete out[k];
  });
  return out;
}
function buildIronCoachTemplate(){
  return `FORMATO=IRONCOACH_V1
FECHA=13 julio 2026
DISCIPLINA=natacion
TIPO=Resistencia
DURACION=65 min
DISTANCIA=45 km
TSS=75
POTENCIA MEDIA=220 W
NP=235 W
POTENCIA MAX=650 W
FC MEDIA=138
FC MAX=165
CADENCIA=86 rpm
ALTITUD=450 m
RPE=6
Z1=10 min
Z2=60 min
Z3=15 min
Z4=x min
Z5=x min
Z6=x min
Z7=x min
DERIVA_CARDIACA=
RITMO_KM=
RITMO_100M=
SWOLF=
COMENTARIO=Resumen breve de la sesión`;
}

// ═══ WEEKLY PLAN PARSER ═══════════════════════════════════════════
const DAY_NAMES=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const DAY_KEYS=['lun','mar','mie','jue','vie','sab','dom'];

function detectDiscFromText(t){
  const tl=t.toLowerCase();
  if(/nataci[oó]n|swim|piscina/.test(tl))return"Natación";
  if(/carrera indoor|cinta|treadmill/.test(tl))return"Carrera Indoor";
  if(/carrera|running|correr|rodaje/.test(tl))return"Carrera";
  if(/ciclismo indoor|rodillo|zwift|trainer|turbo|bici indoor/.test(tl))return"Ciclismo Indoor";
  if(/ciclismo|bici|bike/.test(tl))return"Ciclismo";
  if(/fuerza|gym|gimnasio/.test(tl))return"Fuerza";
  if(/brick/.test(tl))return"Brick";
  if(/descanso|libre|rest/.test(tl))return"Descanso";
  return null;
}

// Parsea texto tipo "Lunes fuerza superior. Martes natación. Miércoles descanso..."
// Devuelve {lun:{disc,note}, mar:{...}, ...}
function parsePlanText(text){
  const plan={};
  DAY_KEYS.forEach(k=>plan[k]={disc:null,note:''});
  // Separar por puntos o saltos de línea, cada fragmento debería empezar por un día
  const dayPattern=/(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)/gi;
  const matches=[...text.matchAll(dayPattern)];
  if(!matches.length)return plan;
  for(let i=0;i<matches.length;i++){
    const start=matches[i].index;
    const end=i+1<matches.length?matches[i+1].index:text.length;
    const chunk=text.slice(start,end).trim();
    const dayWord=matches[i][1].toLowerCase();
    let key=null;
    if(dayWord.startsWith('lun'))key='lun';
    else if(dayWord.startsWith('mar'))key='mar';
    else if(dayWord.startsWith('mi'))key='mie';
    else if(dayWord.startsWith('jue'))key='jue';
    else if(dayWord.startsWith('vie'))key='vie';
    else if(dayWord.startsWith('s'))key='sab';
    else if(dayWord.startsWith('d'))key='dom';
    if(!key)continue;
    // Quitar la palabra del día del principio
    const rest=chunk.replace(dayPattern,'').replace(/^[\s:.,]+/,'').replace(/[.\s]+$/,'').trim();
    const disc=detectDiscFromText(rest);
    plan[key]={disc:disc, note:rest};
  }
  return plan;
}


// ═══ SVG HELPERS ══════════════════════════════════════════════════
function sparkSVG(data,col,w,h){
  if(!data||data.length<2)return'<span style="color:#4d5170;font-size:11px">—</span>';
  const mn=Math.min(...data)*0.98,mx=Math.max(...data)*1.02,rng=mx-mn||1;
  const pts=data.map((v,i)=>[i/(data.length-1)*w,h-((v-mn)/rng)*h]);
  const p=pts.map((pt,i)=>`${i===0?'M':'L'}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(' ');
  return`<svg viewBox="0 0 ${w} ${h}" style="width:${w}px;height:${h}px;display:block" class="spark-canvas"><path d="${p} L${w},${h} L0,${h} Z" fill="${col}18"/><path d="${p}" fill="none" stroke="${col}" stroke-width="1.5" stroke-linecap="round"/><circle cx="${pts.at(-1)[0].toFixed(1)}" cy="${pts.at(-1)[1].toFixed(1)}" r="2.5" fill="${col}"/></svg>`;
}

function lineSVG(data,col,tLine,w,h){
  if(!data||data.length<2)return`<div style="height:${h}px;display:flex;align-items:center;justify-content:center;color:#4d5170;font-size:12px">Sin datos</div>`;
  const all=[...data];if(tLine!=null){all.push(tLine);}
  const mn=Math.min(...all)*0.97,mx=Math.max(...all)*1.03,rng=mx-mn||1;
  const W=w||300,H=h||70;
  const px=(i,l)=>i/(l-1||1)*W,py=v=>H-((v-mn)/rng)*H;
  const pts=data.map((v,i)=>[px(i,data.length),py(v)]);
  const p=pts.map((pt,i)=>`${i===0?'M':'L'}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(' ');
  let tl='';
  if(tLine!=null)tl=`<line x1="0" y1="${py(tLine).toFixed(1)}" x2="${W}" y2="${py(tLine).toFixed(1)}" stroke="${C.green}55" stroke-width="1" stroke-dasharray="4 4"/>`;
  return`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:${H}px" preserveAspectRatio="none">${tl}<path d="${p} L${W},${H} L0,${H} Z" fill="${col}15"/><path d="${p}" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${pts.at(-1)[0].toFixed(1)}" cy="${pts.at(-1)[1].toFixed(1)}" r="3" fill="${col}"/></svg>`;
}

// ═══ STATE ════════════════════════════════════════════════════════
let STATE = {
  page: 'panel',
  analysisTab: 'forma',
  iriOpen: false,
  cfg: DB.loadCfg(),
  plan: DB.loadPlan(),
  athleteCore: DB.loadAthleteCore(),
  logs: [],
  wks: [],
};

function reloadData(){
  STATE.logs = DB.loadLogs();
  const rawWks = DB.loadWks();
  STATE.wks = rawWks.map(w=>({...w, tss: estTSS(w, STATE.cfg)}));
  STATE.plan = DB.loadPlan();
  STATE.athleteCore = DB.loadAthleteCore();
}
reloadData();

// ═══ COMPUTED ═════════════════════════════════════════════════════
function getComputed(){
  const{logs,wks,cfg}=STATE;
  const pmc=calcPMC(wks);
  const tl=logs.find(l=>l.date===today())||null;
  const hrv=calcHRV(logs);
  const wt=calcWT(logs,cfg.targetWeight);
  const eft=calcEFT(wks);
  const rs=calcRS(tl,hrv.b30);
  const iri=calcIRI(cfg,wks,logs,pmc);
  const ftpE=eft.b4&&eft.cur&&eft.b4>0?r0(cfg.ftp*(eft.cur/eft.b4)):cfg.ftp;
  const rec=getRec(rs,pmc.tsb,tl,hrv);
  return{pmc,tl,hrv,wt,eft,rs,iri,ftpE,rec};
}

// ═══ RENDER ENGINE ════════════════════════════════════════════════
function h(tag,attrs,children){
  const el=document.createElement(tag);
  if(attrs)Object.entries(attrs).forEach(([k,v])=>{
    if(k==='style'&&typeof v==='object')Object.assign(el.style,v);
    else if(k.startsWith('on')&&typeof v==='function')el.addEventListener(k.slice(2).toLowerCase(),v);
    else if(k==='className')el.className=v;
    else if(k==='htmlFor')el.htmlFor=v;
    else if(k==='value'&&(tag==='input'||tag==='select'||tag==='textarea'))el.value=v;
    else if(k==='checked')el.checked=v;
    else if(k==='disabled')el.disabled=v;
    else if(k==='placeholder')el.placeholder=v;
    else if(k==='type')el.type=v;
    else if(k==='min')el.min=v;
    else if(k==='max')el.max=v;
    else if(k==='step')el.step=v;
    else if(k==='rows')el.rows=v;
    else el.setAttribute(k,v);
  });
  if(children){
    const arr=Array.isArray(children)?children:[children];
    arr.forEach(c=>{
      if(c==null||c===false)return;
      if(typeof c==='string'||typeof c==='number')el.appendChild(document.createTextNode(String(c)));
      else if(c instanceof Node)el.appendChild(c);
    });
  }
  return el;
}
function hHTML(html){const d=document.createElement('div');d.innerHTML=html;return d;}
function txt(s){return document.createTextNode(String(s??''));}

// ─── UI ATOMS ─────────────────────────────────────────────────────
function mkLbl(s){return h('span',{className:'lbl'},s);}
function mkBig(v,unit,col,sz){
  sz=sz||30;col=col||C.t0;
  const sp=h('span',{style:{fontSize:`${sz}px`,fontWeight:'900',color:col,lineHeight:'1',letterSpacing:'.02em',fontVariantNumeric:'tabular-nums'}});
  sp.textContent=v??'—';
  if(unit){const u=h('span',{style:{fontSize:`${sz*.42}px`,color:C.t1,marginLeft:'2px'}});u.textContent=unit;sp.appendChild(u);}
  return sp;
}
function mkPill(txt_,col){
  col=col||C.blue;
  const sp=h('span',{className:'pill',style:{background:col+'22',color:col}});
  sp.textContent=txt_;return sp;
}
function mkCard(inner,extraStyle){
  const d=h('div',{className:'card'});
  if(extraStyle)Object.assign(d.style,extraStyle);
  if(inner instanceof Node)d.appendChild(inner);
  else if(Array.isArray(inner))inner.forEach(n=>{if(n instanceof Node)d.appendChild(n);});
  return d;
}
function mkBar(val,max,col,height){
  max=max||100;col=col||C.blue;height=height||6;
  const pct=cl((val/max)*100,0,100);
  const wrap=h('div',{className:'bar-wrap',style:{height:`${height}px`,borderRadius:`${height}px`}});
  const fill=h('div',{className:'bar-fill',style:{width:`${pct}%`,background:col,height:`${height}px`}});
  wrap.appendChild(fill);return wrap;
}
function mkInp(label,type,val,onChange,placeholder){
  const wrap=h('div',{style:{display:'flex',flexDirection:'column',gap:'5px'}});
  wrap.appendChild(mkLbl(label));
  const inp=h('input',{type:type||'text',className:'inp',value:val??'',placeholder:placeholder||''});
  inp.addEventListener('input',e=>onChange(e.target.value));
  if(type==='date')inp.value=val??'';
  wrap.appendChild(inp);return wrap;
}
function mkSel(label,val,onChange,opts){
  const wrap=h('div',{style:{display:'flex',flexDirection:'column',gap:'5px'}});
  wrap.appendChild(mkLbl(label));
  const sel=h('select',{className:'sel'});
  opts.forEach(o=>{const op=document.createElement('option');op.value=o.v??o;op.textContent=o.l??o;if(String(o.v??o)===String(val))op.selected=true;sel.appendChild(op);});
  sel.addEventListener('change',e=>onChange(e.target.value));
  wrap.appendChild(sel);return wrap;
}
function mkSld(label,val,min,max,onChange,col){
  col=col||C.blue;
  const wrap=h('div',{style:{display:'flex',flexDirection:'column',gap:'6px'}});
  const row=h('div',{className:'sld-row'});
  row.appendChild(mkLbl(label));
  const num=h('span',{style:{fontSize:'16px',fontWeight:'900',color:col}});num.textContent=`${val}`;
  const den=h('span',{style:{fontSize:'10px',color:C.t2}});den.textContent=`/${max}`;
  num.appendChild(den);row.appendChild(num);
  wrap.appendChild(row);
  const inp=h('input',{type:'range',min:String(min||1),max:String(max||10),value:String(val),style:{accentColor:col,background:C.border}});
  inp.addEventListener('input',e=>{num.childNodes[0].textContent=e.target.value;onChange(+e.target.value);});
  wrap.appendChild(inp);
  const labels=h('div',{style:{display:'flex',justifyContent:'space-between'}});
  const l1=h('span',{style:{fontSize:'9px',color:C.t2}});l1.textContent=String(min||1);
  const l2=h('span',{style:{fontSize:'9px',color:C.t2}});l2.textContent=String(max||10);
  labels.appendChild(l1);labels.appendChild(l2);
  wrap.appendChild(labels);return wrap;
}
function mkBtn(label,onClick,col,secondary){
  col=col||C.blue;
  const btn=h('button',{className:'btn'+(secondary?' btn-sec':'')});
  btn.textContent=label;
  if(!secondary){btn.style.background=`linear-gradient(135deg,${col},${col}cc)`;btn.style.color='#fff';btn.style.boxShadow=`0 4px 16px ${col}44`;}
  btn.addEventListener('click',onClick);
  return btn;
}
function mkAlert(type,title,text_){
  const col=type==='red'?C.red:type==='green'?C.green:C.amber;
  const icon=type==='red'?'⚠️':type==='green'?'✅':'ℹ️';
  const d=h('div',{className:'alert',style:{background:col+'12',border:`1px solid ${col}33`}});
  const ic_=h('span',{style:{fontSize:'16px',flexShrink:'0'}});ic_.textContent=icon;
  const body=h('div');
  const t=h('div',{style:{fontSize:'12px',fontWeight:'700',color:col,marginBottom:'3px'}});t.textContent=title;
  const tx=h('div',{style:{fontSize:'12px',color:C.t1,lineHeight:'1.5'}});tx.textContent=text_;
  body.appendChild(t);body.appendChild(tx);
  d.appendChild(ic_);d.appendChild(body);
  return d;
}
function mkDivider(){return h('div',{className:'divider'});}

// ─── GAUGES ───────────────────────────────────────────────────────
function mkRecGauge(sc){
  const col=sc===null?C.t2:sc>=70?C.green:sc>=50?C.amber:C.red;
  const lbl=sc===null?'Sin datos':sc>=70?'Óptimo':sc>=50?'Moderado':'Bajo';
  const pct=sc??0;const circ=Math.PI*40;const off=circ-(pct/100)*circ;
  const wrap=h('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}});
  const lbl_=h('span',{className:'lbl'});lbl_.textContent='Recovery';wrap.appendChild(lbl_);
  const gw=h('div',{className:'gauge-wrap'});
  gw.innerHTML=`<svg width="100" height="58" viewBox="0 0 100 58" style="overflow:visible"><path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="${C.border}" stroke-width="7" stroke-linecap="round"/><path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" style="transition:stroke-dashoffset 1s ease"/></svg>`;
  const num=h('div',{style:{position:'absolute',bottom:'0',left:'0',right:'0',textAlign:'center'}});
  num.appendChild(mkBig(sc??'—',null,col,26));gw.appendChild(num);
  wrap.appendChild(gw);
  wrap.appendChild(mkPill(lbl,col));
  return wrap;
}

function mkIRIGauge(sc){
  const col=sc>=70?C.green:sc>=55?C.amber:C.red;
  const lbl=sc>=85?'Race Ready':sc>=70?'On Track':sc>=55?'En Desarrollo':'Base';
  const r=34,circ=2*Math.PI*r;
  const wrap=h('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:'6px'}});
  const lbl_=h('span',{className:'lbl'});lbl_.textContent='Índice 70.3';wrap.appendChild(lbl_);
  const gw=h('div',{className:'iri-wrap'});
  gw.innerHTML=`<svg width="84" height="84" viewBox="0 0 84 84"><circle cx="42" cy="42" r="${r}" fill="none" stroke="${C.border}" stroke-width="6"/><circle cx="42" cy="42" r="${r}" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${((sc/100)*circ).toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90,42,42)" style="transition:stroke-dasharray 1s ease"/></svg>`;
  const num=h('div',{style:{position:'absolute',inset:'0',display:'flex',alignItems:'center',justifyContent:'center'}});
  num.appendChild(mkBig(sc,null,col,24));gw.appendChild(num);
  wrap.appendChild(gw);
  wrap.appendChild(mkPill(lbl,col));
  return wrap;
}

function mkTSBBar(tsb){
  const col=tsb>5?C.green:tsb>-20?C.amber:C.red;
  const pct=cl(((tsb+50)/80)*100,0,100);
  const wrap=h('div',{style:{display:'flex',flexDirection:'column',gap:'6px'}});
  const row=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}});
  const lbl_=h('span',{className:'lbl'});lbl_.textContent='TSB — Balance de forma';
  row.appendChild(lbl_);row.appendChild(mkBig(tsb>0?`+${tsb}`:tsb,null,col,18));
  wrap.appendChild(row);
  const barWrap=h('div',{style:{height:'8px',background:C.border,borderRadius:'4px',overflow:'hidden',position:'relative'}});
  const mark=h('div',{style:{position:'absolute',left:'62.5%',top:'0',bottom:'0',width:'1px',background:C.t2+'60'}});
  const fill=h('div',{style:{width:`${pct}%`,height:'100%',background:`linear-gradient(90deg,${C.red},${C.amber} 50%,${C.green})`,borderRadius:'4px',transition:'width .7s ease'}});
  barWrap.appendChild(mark);barWrap.appendChild(fill);
  wrap.appendChild(barWrap);
  const labels=h('div',{style:{display:'flex',justifyContent:'space-between'}});
  const l1=h('span',{style:{fontSize:'9px',color:C.t2,fontFamily:'monospace'}});l1.textContent='Fatiga −50';
  const l2=h('span',{style:{fontSize:'9px',color:C.t2,fontFamily:'monospace'}});l2.textContent='Forma +30';
  labels.appendChild(l1);labels.appendChild(l2);wrap.appendChild(labels);
  return wrap;
}

function mkWeekBars(wks){
  const td=today(),dow=(new Date().getDay()+6)%7;
  const days=Array.from({length:7},(_,i)=>{
    const d=new Date();d.setDate(d.getDate()-dow+i);
    const k=d.toISOString().split("T")[0];
    const ws=wks.filter(w=>w.date===k);
    return{k,lbl:['L','M','X','J','V','S','D'][i],tss:ws.reduce((a,b)=>a+(b.tss||0),0),disc:ws[0]?.discipline,isT:k===td};
  });
  const mx=Math.max(...days.map(d=>d.tss),60),wTSS=r0(days.reduce((a,b)=>a+b.tss,0));
  const wrap=h('div',{style:{display:'flex',flexDirection:'column',gap:'8px'}});
  const row=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}});
  const lbl_=h('span',{className:'lbl'});lbl_.textContent='Carga semanal';
  const tssLbl=h('span',{style:{fontSize:'12px',color:C.amber,fontFamily:'monospace'}});tssLbl.textContent=`TSS ${wTSS}`;
  row.appendChild(lbl_);row.appendChild(tssLbl);wrap.appendChild(row);
  const bars=h('div',{className:'wk-bars'});
  days.forEach(d=>{
    const bh=d.tss>0?cl((d.tss/mx)*50,4,50):3;
    const bg=d.isT?C.blue:d.tss>100?C.amber:d.tss>0?C.blue+'77':C.border;
    const col_=h('div',{className:'wk-bar-col'});
    const barEl=h('div',{style:{width:'100%',height:`${bh}px`,background:bg,borderRadius:'3px 3px 0 0',transition:'height .5s ease',position:'relative'}});
    if(d.isT){const dot=h('div',{className:'today-dot'});barEl.appendChild(dot);}
    const lbl2=h('span',{style:{fontSize:'10px',color:d.isT?C.blue:C.t2,fontFamily:'monospace'}});lbl2.textContent=d.lbl;
    col_.appendChild(barEl);col_.appendChild(lbl2);
    if(d.disc){const ic_=h('span',{style:{fontSize:'8px',color:DISC_C[d.disc]||C.t2}});ic_.textContent=DISC_ICON[d.disc]||'';col_.appendChild(ic_);}
    bars.appendChild(col_);
  });
  wrap.appendChild(bars);return wrap;
}


// ═══ COMPLETE ATHLETE INDEX ════════════════════════════════════════
function calcCompleteAthleteIndex(){
  const logs=STATE.logs.slice(-14);
  const recentDates=dRange(56);
  const wks=STATE.wks.filter(w=>recentDates.includes(w.date));
  const valid=a=>a.filter(v=>v!==null&&v!==undefined&&v>0);

  const sleep=valid(logs.map(l=>l.sleep));
  const fat=valid(logs.map(l=>l.fat));
  const mus=valid(logs.map(l=>l.mus));
  const mood=valid(logs.map(l=>l.mood));
  const stress=valid(logs.map(l=>l.str));
  const hrv=calcHRV(STATE.logs);

  const sleepSc=cl((avg(sleep)/8)*100,0,100);
  const fatSc=cl(100-((avg(fat||[3])-1)/9)*100,0,100);
  const musSc=cl(100-((avg(mus||[3])-1)/9)*100,0,100);
  const moodSc=cl((avg(mood||[7])/10)*100,0,100);
  const stressSc=cl(100-((avg(stress||[3])-1)/9)*100,0,100);
  const hrvSc=hrv.signal?cl(hrv.signal,0,100):60;
  const recovery=r0(sleepSc*.25+hrvSc*.25+fatSc*.20+musSc*.10+moodSc*.10+stressSc*.10);

  const aerobicMin=wks.filter(w=>ic(w.discipline)||ir(w.discipline)||isw(w.discipline)||/trail|montaña/i.test(w.discipline||''))
    .reduce((a,w)=>a+(w.duration||0),0);
  const strengthN=wks.filter(w=>/fuerza|calistenia|híbrido/i.test(w.discipline||'')).length;
  const coreMobN=wks.filter(w=>/core|movilidad|estabilidad/i.test((w.comment||'')+' '+(w.discipline||''))).length;
  const qualityN=wks.filter(w=>['Z3','Z4','Z5','Z6','Z7'].includes(w.zone)).length;
  const longN=wks.filter(w=>(ic(w.discipline)&&w.duration>=120)||(ir(w.discipline)&&w.duration>=60)||(isw(w.discipline)&&w.duration>=30)).length;
  const capacity=r0(
    cl(aerobicMin/900*100,0,100)*.40+
    cl(strengthN/8*100,0,100)*.25+
    cl(coreMobN/6*100,0,100)*.10+
    cl(qualityN/6*100,0,100)*.15+
    cl(longN/4*100,0,100)*.10
  );

  const weeks={};
  wks.forEach(w=>{const d=new Date(w.date+'T12:00:00');const monday=new Date(d);monday.setDate(d.getDate()-((d.getDay()+6)%7));const k=monday.toISOString().slice(0,10);weeks[k]=(weeks[k]||0)+1;});
  const activeWeeks=Object.values(weeks).filter(n=>n>=2).length;
  const planStatuses=DB.loadDailyStatus().filter(s=>recentDates.includes(s.date));
  const completed=planStatuses.filter(s=>['done','modified','rest'].includes(s.status)).length;
  const adherence=planStatuses.length?completed/planStatuses.length:0.65;
  const consistency=r0(cl(activeWeeks/8*70+adherence*30,0,100));

  const caps={
    endurance:wks.some(w=>ic(w.discipline)||ir(w.discipline)||isw(w.discipline)||/trail|montaña/i.test(w.discipline||'')),
    strength:strengthN>0,
    mobility:coreMobN>0,
    intensity:qualityN>0,
    recovery:logs.length>=4
  };
  const balance=r0(Object.values(caps).filter(Boolean).length/5*100);
  const total=r0(recovery*.30+capacity*.30+consistency*.20+balance*.20);
  return {total,recovery,capacity,consistency,balance};
}


function calcAthleteCoreProfile(){
  const core=STATE.athleteCore;
  const wks=STATE.wks.filter(w=>dRange(84).includes(w.date));
  const logs=STATE.logs.filter(l=>dRange(30).includes(l.date));
  const totalMin=wks.reduce((a,w)=>a+(w.duration||0),0);
  const byDisc={};
  wks.forEach(w=>{byDisc[w.discipline]=(byDisc[w.discipline]||0)+(w.duration||0);});

  const strengthSessions=wks.filter(w=>/fuerza|calistenia|híbrido/i.test(w.discipline||''));
  const mobilitySessions=wks.filter(w=>/movilidad|core|estabilidad/i.test(`${w.discipline||''} ${w.comment||''}`));
  const aerobicSessions=wks.filter(w=>ic(w.discipline)||ir(w.discipline)||isw(w.discipline)||/trail|montaña/i.test(w.discipline||''));
  const qualitySessions=wks.filter(w=>['Z3','Z4','Z5','Z6','Z7'].includes(w.zone));
  const technicalSessions=wks.filter(w=>/natación|trial|técnica|calistenia/i.test(`${w.discipline||''} ${w.comment||''}`));

  const autoCaps={
    strength:r0(cl(strengthSessions.length/10*100,0,100)),
    mobility:r0(cl(mobilitySessions.length/8*100,0,100)),
    core:r0(cl(mobilitySessions.filter(w=>/core|estabilidad/i.test(`${w.discipline||''} ${w.comment||''}`)).length/6*100,0,100)),
    endurance:r0(cl(aerobicSessions.reduce((a,w)=>a+(w.duration||0),0)/1500*100,0,100)),
    power:r0(cl(qualitySessions.length/8*100,0,100)),
    technique:r0(cl(technicalSessions.length/8*100,0,100))
  };

  const caps={};
  Object.keys(autoCaps).forEach(k=>{
    caps[k]=r0(autoCaps[k]*.65+(core.manualCaps?.[k]??50)*.35);
  });

  const ranked=Object.entries(caps).sort((a,b)=>b[1]-a[1]);
  const strongest=ranked[0]||['—',0];
  const weakest=ranked.at(-1)||['—',0];

  const sleep=logs.filter(l=>l.sleep).map(l=>l.sleep);
  const hrv=calcHRV(STATE.logs);
  const recoveryBase=r0(
    cl(avg(sleep)/8*45,0,45)+
    cl((hrv.signal||90)/100*35,0,35)+
    cl((1-(avg(logs.filter(l=>l.fat).map(l=>l.fat)||[3])-1)/9)*20,0,20)
  );

  const weeklyHours=core.weeklyHours||0;
  const avgWeeklyHours=r1(totalMin/60/12);
  const loadFit=weeklyHours?cl(r0((avgWeeklyHours/weeklyHours)*100),0,140):null;

  return {caps,autoCaps,strongest,weakest,recoveryBase,avgWeeklyHours,loadFit,byDisc,totalMin};
}

const CAP_LABELS={
  strength:'Fuerza',
  mobility:'Movilidad',
  core:'Core y estabilidad',
  endurance:'Resistencia',
  power:'Potencia / intensidad',
  technique:'Técnica y coordinación'
};

// ═══ PAGES ════════════════════════════════════════════════════════

// ─── PANEL ────────────────────────────────────────────────────────
function renderPanel(comp){
  const{pmc,tl,hrv,wt,eft,rs,iri,ftpE,rec}=comp;
  const frag=document.createDocumentFragment();
  const gap=h('div',{style:{display:'flex',flexDirection:'column',gap:'12px'}});
  const athlete=calcCompleteAthleteIndex();

  // ── Índice de Atleta Completo ──
  const athleteCard=mkCard(null,{background:`linear-gradient(145deg,${C.blue}14,${C.green}0d)`,border:`1px solid ${C.blue}44`});
  const athleteTop=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'14px'}});
  const athleteLeft=h('div',{style:{display:'flex',flexDirection:'column',gap:'5px'}});
  athleteLeft.appendChild(mkLbl('Índice de Atleta Completo'));
  const athleteNum=mkBig(athlete.total,'/100',athlete.total>=70?C.green:athlete.total>=50?C.amber:C.red,38);
  athleteLeft.appendChild(athleteNum);
  const athleteSub=h('span',{style:{fontSize:'11px',color:C.t1,lineHeight:'1.4'}});
  athleteSub.textContent='Salud, capacidad general, consistencia y equilibrio';
  athleteLeft.appendChild(athleteSub);
  const logoMark=h('div',{style:{width:'74px',height:'74px',borderRadius:'22px',background:C.bg0,border:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:'0'}});
  logoMark.innerHTML=`<svg viewBox="0 0 100 100" width="58" height="58"><circle cx="50" cy="50" r="40" fill="none" stroke="${C.blue}" stroke-width="7"/><path d="M22 55h15l8-22 11 38 8-16h14" fill="none" stroke="${C.green}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  athleteTop.appendChild(athleteLeft);athleteTop.appendChild(logoMark);athleteCard.appendChild(athleteTop);
  const athleteGrid=h('div',{className:'grid2',style:{marginTop:'14px'}});
  [
    ['Salud',athlete.recovery,C.green],
    ['Capacidad',athlete.capacity,C.blue],
    ['Consistencia',athlete.consistency,C.purple],
    ['Equilibrio',athlete.balance,C.cyan]
  ].forEach(([label,value,col])=>{
    const box=h('div',{className:'metric-mini'});
    const row=h('div',{style:{display:'flex',justifyContent:'space-between',marginBottom:'5px'}});
    const l=h('span',{style:{fontSize:'10px',color:C.t2}});l.textContent=label;
    const v=h('span',{style:{fontSize:'12px',fontWeight:'800',color:col,fontFamily:'monospace'}});v.textContent=value;
    row.appendChild(l);row.appendChild(v);box.appendChild(row);box.appendChild(mkBar(value,100,col,4));athleteGrid.appendChild(box);
  });
  athleteCard.appendChild(athleteGrid);
  gap.appendChild(athleteCard);

  // ── Plan de hoy ──
  const todayIdx=(new Date().getDay()+6)%7;
  const todayKey=DAY_KEYS[todayIdx];
  const todayPlan=STATE.plan[todayKey];
  if(todayPlan&&(todayPlan.disc||todayPlan.note)){
    const planCard=mkCard(null,{background:C.purple+'14',border:`1px solid ${C.purple}44`});
    const planTop=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}});
    const planLbl=h('span',{className:'lbl'});planLbl.textContent=`Plan de hoy — ${DAY_NAMES[todayIdx]}`;
    planTop.appendChild(planLbl);
    if(todayPlan.disc){const ic_=h('span',{style:{fontSize:'18px'}});ic_.textContent=DISC_ICON[todayPlan.disc]||'🎯';planTop.appendChild(ic_);}
    planCard.appendChild(planTop);
    const planText=h('div',{style:{fontSize:'14px',fontWeight:'700',color:C.t0}});
    planText.textContent=todayPlan.disc==='Descanso'?'Descanso programado':(todayPlan.note||todayPlan.disc||'');
    planCard.appendChild(planText);
    // Conflicto: plan dice entrenar fuerte pero el estado real dice lo contrario
    if(rec.lv==='red'&&todayPlan.disc&&todayPlan.disc!=='Descanso'){
      const conflict=h('div',{style:{marginTop:'8px',fontSize:'12px',color:C.amber,lineHeight:'1.4'}});
      conflict.textContent=`⚠️ Tu estado de hoy sugiere lo contrario: ${rec.title.toLowerCase()}. Considera sustituir por ${rec.zone||'descanso'}.`;
      planCard.appendChild(conflict);
    } else if(rec.lv==='amber'&&todayPlan.disc&&todayPlan.disc!=='Descanso'){
      const conflict=h('div',{style:{marginTop:'8px',fontSize:'12px',color:C.t1,lineHeight:'1.4'}});
      conflict.textContent=`Tu recuperación es moderada — si toca calidad, considera bajar intensidad a ${rec.zone||'Z2'}.`;
      planCard.appendChild(conflict);
    }
    const dailyStatus=DB.getDailyStatus(today());
    const statusLabels={pending:'Pendiente',done:'Completado',modified:'Modificado',skipped:'No realizado',rest:'Descanso'};
    const statusColors={pending:C.t2,done:C.green,modified:C.amber,skipped:C.red,rest:C.blue};
    const statusRow=h('div',{style:{marginTop:'12px',paddingTop:'10px',borderTop:`1px solid ${C.border}`,display:'flex',flexDirection:'column',gap:'8px'}});
    const statusTop=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}});
    const statusLbl=h('span',{style:{fontSize:'11px',color:C.t2}});statusLbl.textContent='Estado del entrenamiento';
    statusTop.appendChild(statusLbl);statusTop.appendChild(mkPill(statusLabels[dailyStatus.status]||'Pendiente',statusColors[dailyStatus.status]||C.t2));
    statusRow.appendChild(statusTop);
    const actions=h('div',{style:{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'6px'}});
    [
      ['done','✓ Realizado',C.green],
      ['modified','↻ Modificado',C.amber],
      ['skipped','✕ No realizado',C.red],
      ['rest','○ Descanso',C.blue]
    ].forEach(([status,label,col])=>{
      const b=mkBtn(label,()=>{
        DB.saveDailyStatus({date:today(),status,planned:todayPlan.disc||null,note:todayPlan.note||'',updatedAt:new Date().toISOString()});
        renderApp();
      },col,status!==dailyStatus.status);
      b.style.padding='9px 6px';b.style.fontSize='11px';
      actions.appendChild(b);
    });
    statusRow.appendChild(actions);
    if(dailyStatus.status==='done'){
      const msg=h('div',{style:{fontSize:'12px',fontWeight:'700',color:C.green,textAlign:'center'}});
      msg.textContent='✅ Objetivo del día completado';
      statusRow.appendChild(msg);
    } else if(dailyStatus.status==='modified'){
      const msg=h('div',{style:{fontSize:'12px',fontWeight:'700',color:C.amber,textAlign:'center'}});
      msg.textContent='🔄 Entrenamiento adaptado manteniendo la continuidad';
      statusRow.appendChild(msg);
    }
    planCard.appendChild(statusRow);
    gap.appendChild(planCard);
  }

  // Recovery + Rec
  const recCard=mkCard(null);
  const recGrid=h('div',{style:{display:'grid',gridTemplateColumns:'110px 1fr',gap:'14px',alignItems:'center'}});
  recGrid.appendChild(mkRecGauge(rs));
  const recRight=h('div',{style:{display:'flex',flexDirection:'column',gap:'8px'}});
  const recCol=rec.lv==='green'?C.green:rec.lv==='red'?C.red:C.amber;
  recRight.appendChild(mkPill(rec.zone||'Descanso',recCol));
  const recTitle=h('span',{style:{fontSize:'13px',fontWeight:'700',color:C.t0,lineHeight:'1.3'}});recTitle.textContent=rec.title;recRight.appendChild(recTitle);
  const recText=h('span',{style:{fontSize:'12px',color:C.t1,lineHeight:'1.5'}});recText.textContent=rec.text;recRight.appendChild(recText);
  recGrid.appendChild(recRight);recCard.appendChild(recGrid);
  gap.appendChild(recCard);

  // CTL/ATL/TSB
  const ctlGrid=h('div',{className:'grid3'});
  [{l:'CTL',v:pmc.ctl,col:C.green,s:'Forma'},{l:'ATL',v:pmc.atl,col:C.red,s:'Fatiga'},{l:'TSB',v:pmc.tsb>0?`+${pmc.tsb}`:pmc.tsb,col:pmc.tsb>5?C.green:pmc.tsb>-20?C.amber:C.red,s:'Balance'}].forEach(m=>{
    const c=mkCard(null,{padding:'10px 12px'});
    c.appendChild(mkLbl(m.l));
    const bn=h('div',{style:{marginTop:'4px'}});bn.appendChild(mkBig(m.v,null,m.col,22));c.appendChild(bn);
    const s=h('span',{style:{fontSize:'10px',color:C.t2,fontFamily:'monospace'}});s.textContent=m.s;c.appendChild(s);
    ctlGrid.appendChild(c);
  });
  gap.appendChild(ctlGrid);
  gap.appendChild(mkCard(mkTSBBar(pmc.tsb)));

  // IRI
  const iriCard=mkCard(null,{cursor:'pointer'});
  const iriGrid=h('div',{style:{display:'grid',gridTemplateColumns:'auto 1fr',gap:'14px',alignItems:'center'}});
  iriGrid.appendChild(mkIRIGauge(iri.tot));
  const iriRight=h('div',{style:{display:'flex',flexDirection:'column',gap:'8px'}});
  iriRight.appendChild(mkLbl('Preparación específica 70.3'));
  const iriCol=iri.tot>=70?C.green:iri.tot>=55?C.amber:C.red;
  iriRight.appendChild(mkBar(iri.tot,100,iriCol,8));
  const iriChips=h('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap'}});
  Object.entries(iri.comp).slice(0,4).forEach(([k,c])=>{
    const cd=h('div',{style:{display:'flex',flexDirection:'column',gap:'1px'}});
    const k_=h('span',{style:{fontSize:'9px',color:C.t2,fontFamily:'monospace'}});k_.textContent=k;
    const v_=h('span',{style:{fontSize:'11px',fontWeight:'700',color:c.sc>=70?C.green:c.sc>=50?C.amber:C.red,fontFamily:'monospace'}});v_.textContent=c.sc;
    cd.appendChild(k_);cd.appendChild(v_);iriChips.appendChild(cd);
  });
  iriRight.appendChild(iriChips);
  const iriToggle=h('span',{style:{fontSize:'10px',color:C.t2}});iriToggle.textContent='Ver desglose ▼';
  iriRight.appendChild(iriToggle);
  iriGrid.appendChild(iriRight);iriCard.appendChild(iriGrid);

  const iriDetail=h('div',{style:{display:'none',marginTop:'14px',borderTop:`1px solid ${C.border}`,paddingTop:'14px',flexDirection:'column',gap:'10px'}});
  Object.values(iri.comp).forEach(c=>{
    const row_=h('div',{style:{display:'flex',flexDirection:'column',gap:'4px'}});
    const r_=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}});
    const lbl2=h('span',{style:{fontSize:'12px',color:C.t1}});lbl2.textContent=c.label;
    const rv=h('div',{style:{display:'flex',gap:'8px',alignItems:'center'}});
    const v_=h('span',{style:{fontSize:'11px',color:C.t2,fontFamily:'monospace'}});v_.textContent=c.val;
    const sc_=h('span',{style:{fontSize:'12px',fontWeight:'700',color:c.sc>=70?C.green:c.sc>=50?C.amber:C.red,fontFamily:'monospace'}});sc_.textContent=c.sc;
    rv.appendChild(v_);rv.appendChild(sc_);r_.appendChild(lbl2);r_.appendChild(rv);
    row_.appendChild(r_);row_.appendChild(mkBar(c.sc,100,c.sc>=70?C.green:c.sc>=50?C.amber:C.red,4));
    iriDetail.appendChild(row_);
  });
  iriCard.appendChild(iriDetail);
  iriCard.addEventListener('click',()=>{
    const open=STATE.iriOpen=!STATE.iriOpen;
    iriDetail.style.display=open?'flex':'none';
    iriToggle.textContent=open?'Ocultar ▲':'Ver desglose ▼';
  });
  gap.appendChild(iriCard);

  // Vitals 2x2
  const vGrid=h('div',{className:'grid2'});

  // HRV
  const hrvCard=mkCard(null,{padding:'12px 14px'});
  hrvCard.appendChild(mkLbl('HRV hoy'));
  const hrvCol=hrv.signal?(hrv.signal>=95?C.green:hrv.signal>=85?C.amber:C.red):C.t0;
  const hbn=h('div',{style:{margin:'4px 0'}});hbn.appendChild(mkBig(tl?.hrv??'—','ms',hrvCol,24));hrvCard.appendChild(hbn);
  const hrow=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}});
  const hb30=h('span',{style:{fontSize:'10px',color:C.t2,fontFamily:'monospace'}});hb30.textContent=`Base30 ${hrv.b30}`;
  hrow.appendChild(hb30);
  if(hrv.signal){const hp=mkPill(`${hrv.signal}%`,hrv.signal>=95?C.green:hrv.signal>=85?C.amber:C.red);hrow.appendChild(hp);}
  hrvCard.appendChild(hrow);
  const hspk=hHTML(sparkSVG(hrv.hist.slice(-14).map(h_=>h_.hrv),C.purple,90,26));
  hspk.style.marginTop='6px';hrvCard.appendChild(hspk);
  vGrid.appendChild(hrvCard);

  // Sueño
  const slpCard=mkCard(null,{padding:'12px 14px'});
  slpCard.appendChild(mkLbl('Sueño'));
  const slpCol=tl?.sleep>=7.5?C.green:tl?.sleep>=6?C.amber:tl?.sleep?C.red:C.t0;
  const sbn=h('div',{style:{margin:'4px 0'}});sbn.appendChild(mkBig(tl?.sleep??'—','h',slpCol,24));slpCard.appendChild(sbn);
  const stars=h('div',{style:{display:'flex',gap:'3px',margin:'4px 0'}});
  for(let i=1;i<=5;i++){const s=h('div',{style:{flex:'1',height:'4px',borderRadius:'2px',background:i<=(tl?.sq||0)/2?C.blue:C.border}});stars.appendChild(s);}
  slpCard.appendChild(stars);
  const sqLbl=h('span',{style:{fontSize:'10px',color:C.t2,fontFamily:'monospace'}});sqLbl.textContent=`Calidad ${tl?.sq??'—'}/10`;slpCard.appendChild(sqLbl);
  vGrid.appendChild(slpCard);

  // Peso
  const wtCard=mkCard(null,{padding:'12px 14px'});
  wtCard.appendChild(mkLbl('Peso'));
  const wrow=h('div',{style:{display:'flex',alignItems:'baseline',gap:'6px',margin:'4px 0'}});
  wrow.appendChild(mkBig(tl?.weight??wt.cur??'—','kg',C.t0,24));
  if(wt.d7!==null){const d7=h('span',{style:{fontSize:'11px',color:wt.d7<=0?C.green:C.amber,fontFamily:'monospace'}});d7.textContent=`${wt.d7>0?'+':''}${wt.d7}`;wrow.appendChild(d7);}
  wtCard.appendChild(wrow);
  const wlbl=h('span',{style:{fontSize:'10px',color:C.t2,fontFamily:'monospace'}});wlbl.textContent=`Obj ${STATE.cfg.targetWeight}kg · déficit ${wt.def}kg`;wtCard.appendChild(wlbl);
  const wspk=hHTML(sparkSVG(wt.hist.slice(-14).map(h_=>h_.weight),C.cyan,90,26));wspk.style.marginTop='6px';wtCard.appendChild(wspk);
  vGrid.appendChild(wtCard);

  // FTP/EF
  const ftpCard=mkCard(null,{padding:'12px 14px'});
  ftpCard.appendChild(mkLbl('FTP / EF'));
  const fbn=h('div',{style:{margin:'4px 0'}});fbn.appendChild(mkBig(ftpE,'W',C.blue,24));ftpCard.appendChild(fbn);
  const flbl=h('span',{style:{fontSize:'10px',color:C.t2,fontFamily:'monospace'}});flbl.textContent=`${r1(ftpE/(wt.cur||82))} W/kg · EF ${eft.cur??'—'}`;ftpCard.appendChild(flbl);
  const eflbl=h('div',{style:{marginTop:'4px'}});
  const efs=h('span',{style:{fontSize:'10px',color:eft.sl>0?C.green:eft.sl<-0.05?C.red:C.t2,fontFamily:'monospace'}});efs.textContent=`EF ${eft.sl>=0?'↑':'↓'} ${eft.sl>0?'+':''}${eft.sl}/sem`;
  eflbl.appendChild(efs);ftpCard.appendChild(eflbl);
  vGrid.appendChild(ftpCard);

  gap.appendChild(vGrid);
  gap.appendChild(mkCard(mkWeekBars(STATE.wks)));

  // Alerts
  if(pmc.tsb<-30)gap.appendChild(mkAlert('red','Riesgo sobreentrenamiento',`TSB ${pmc.tsb}. Reduce carga.`));
  if(hrv.signal&&hrv.signal<85)gap.appendChild(mkAlert('red','HRV crítico',`Señal HRV ${hrv.signal}%. Descansa.`));
  else if(hrv.signal&&hrv.signal<90)gap.appendChild(mkAlert('amber','HRV bajo',`HRV ${hrv.signal}% del baseline.`));
  if(tl?.sleep&&tl.sleep<6)gap.appendChild(mkAlert('amber','Sueño insuficiente',`Solo ${tl.sleep}h anoche.`));

  frag.appendChild(gap);
  return frag;
}

// ─── DIARIO ────────────────────────────────────────────────────────
function renderDiario(){
  const ex=STATE.logs.find(l=>l.date===today())||{};
  const form={date:today(),weight:ex.weight??'',hrv:ex.hrv??'',sleep:ex.sleep??'',sq:ex.sq??7,fat:ex.fat??3,mus:ex.mus??3,mood:ex.mood??7,str:ex.str??3,comment:ex.comment??''};
  const frag=document.createDocumentFragment();
  const gap=h('div',{style:{display:'flex',flexDirection:'column',gap:'12px'}});

  const card=mkCard(null);
  const inner=h('div',{style:{display:'flex',flexDirection:'column',gap:'14px'}});
  const grid=h('div',{className:'grid2'});

  const dateInp=mkInp('Fecha','date',form.date,v=>form.date=v);
  const wtInp=mkInp('Peso (kg)','number',form.weight,v=>form.weight=v,'81.0');
  const hrvInp=mkInp('HRV (ms)','number',form.hrv,v=>form.hrv=v,'95');
  const slpInp=mkInp('Sueño (h)','number',form.sleep,v=>form.sleep=v,'7.5');
  [dateInp,wtInp,hrvInp,slpInp].forEach(i=>grid.appendChild(i));
  inner.appendChild(grid);inner.appendChild(mkDivider());

  inner.appendChild(mkSld('Calidad de sueño',form.sq,1,10,v=>form.sq=v,C.blue));
  inner.appendChild(mkSld('Fatiga percibida (10=agotado)',form.fat,1,10,v=>form.fat=v,C.red));
  inner.appendChild(mkSld('Piernas / Molestia muscular',form.mus,1,10,v=>form.mus=v,C.amber));
  inner.appendChild(mkSld('Estado de ánimo (10=excelente)',form.mood,1,10,v=>form.mood=v,C.green));
  inner.appendChild(mkSld('Estrés vital (10=máximo)',form.str,1,10,v=>form.str=v,C.purple));

  const comWrap=h('div',{style:{display:'flex',flexDirection:'column',gap:'5px'}});
  comWrap.appendChild(mkLbl('Comentario'));
  const ta=h('textarea',{rows:'2',className:'inp',placeholder:'Sensaciones, novedades...'});
  ta.value=form.comment;ta.addEventListener('input',e=>form.comment=e.target.value);
  comWrap.appendChild(ta);inner.appendChild(comWrap);

  const saveBtn=mkBtn('Guardar registro diario',()=>{
    const log={date:form.date,weight:+form.weight||null,hrv:+form.hrv||null,sleep:+form.sleep||null,sq:form.sq,fat:form.fat,mus:form.mus,mood:form.mood,str:form.str,comment:form.comment};
    const ok=DB.saveLog(log);
    if(ok){
      reloadData();
      saveBtn.textContent='✓ Guardado';saveBtn.style.background=`linear-gradient(135deg,${C.green},${C.green}cc)`;
      setTimeout(()=>{saveBtn.textContent='Guardar registro diario';saveBtn.style.background=`linear-gradient(135deg,${C.blue},${C.blue}cc)`;},2000);
    }
  },C.blue);
  inner.appendChild(saveBtn);
  card.appendChild(inner);gap.appendChild(card);

  // ── Historial completo — Diario ──
  const hist=mkCard(null);
  const histHead=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}});
  histHead.appendChild(mkLbl(`Histórico completo (${STATE.logs.length} días)`));
  const filterBtn=h('button',{className:'btn-sec',style:{width:'auto',padding:'5px 10px',fontSize:'11px',border:`1px solid ${C.border}`,borderRadius:'8px',background:'none',color:C.t1,cursor:'pointer'}});
  filterBtn.textContent='Mostrar todo ▾';
  histHead.appendChild(filterBtn);
  hist.appendChild(histHead);
  const hlist=h('div',{style:{display:'flex',flexDirection:'column',gap:'8px'}});
  let showAllLogs=false;

  function renderLogHistory(){
    hlist.innerHTML='';
    const items=[...STATE.logs].reverse();
    const visible=showAllLogs?items:items.slice(0,10);
    visible.forEach(l=>{
      const isBase=DB.isBaseLog(l.date);
      const item=h('div',{style:{background:C.bg0,borderRadius:10,padding:'10px 12px',border:isBase?`1px dashed ${C.border}`:`1px solid ${C.border}`}});
      const topRow=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}});
      const left=h('div',{style:{display:'flex',gap:'8px',alignItems:'center'}});
      const dt=h('span',{style:{fontSize:'12px',color:C.t0,fontFamily:'monospace',fontWeight:'600'}});dt.textContent=fmtD(l.date);
      left.appendChild(dt);
      if(isBase){const tag=h('span',{style:{fontSize:'9px',color:C.t2,fontFamily:'monospace',background:C.border,padding:'1px 6px',borderRadius:'4px'}});tag.textContent='EXCEL';left.appendChild(tag);}
      topRow.appendChild(left);
      const chips=h('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap'}});
      if(l.weight){const c=h('span',{style:{fontSize:'12px',color:C.cyan}});c.textContent=`${l.weight}kg`;chips.appendChild(c);}
      if(l.hrv){const c=h('span',{style:{fontSize:'12px',color:C.purple}});c.textContent=`${l.hrv}ms`;chips.appendChild(c);}
      if(l.sleep){const c=h('span',{style:{fontSize:'12px',color:C.blue}});c.textContent=`${l.sleep}h`;chips.appendChild(c);}
      topRow.appendChild(chips);
      item.appendChild(topRow);

      const editBox=h('div',{style:{display:'none',marginTop:'10px',borderTop:`1px solid ${C.border}`,paddingTop:'10px',flexDirection:'column',gap:'10px'}});
      topRow.addEventListener('click',()=>{
        const open=editBox.style.display==='flex';
        editBox.style.display=open?'none':'flex';
      });

      const ef={weight:l.weight??'',hrv:l.hrv??'',sleep:l.sleep??'',sq:l.sq??7,fat:l.fat??3,mus:l.mus??3,mood:l.mood??7,str:l.str??3,comment:l.comment??''};
      const eGrid=h('div',{className:'grid2'});
      const eWt=mkInp('Peso (kg)','number',ef.weight,v=>ef.weight=v);
      const eHrv=mkInp('HRV (ms)','number',ef.hrv,v=>ef.hrv=v);
      const eSlp=mkInp('Sueño (h)','number',ef.sleep,v=>ef.sleep=v);
      [eWt,eHrv,eSlp].forEach(i=>eGrid.appendChild(i));
      editBox.appendChild(eGrid);
      editBox.appendChild(mkSld('Fatiga','fat',ef.fat,1,10,v=>ef.fat=v,C.red));
      editBox.appendChild(mkSld('Piernas','mus',ef.mus,1,10,v=>ef.mus=v,C.amber));

      if(isBase){
        const note=h('div',{style:{fontSize:'11px',color:C.t2,lineHeight:'1.4'}});
        note.textContent='Dato importado del Excel. Si está mal, corrígelo: se guardará como corrección sin tocar el archivo original.';
        editBox.appendChild(note);
        const fixBtn=mkBtn('✎ Corregir este registro',()=>{
          DB.saveLog({date:l.date,weight:+eWt.querySelector('input').value||null,hrv:+eHrv.querySelector('input').value||null,sleep:+eSlp.querySelector('input').value||null,sq:ef.sq,fat:ef.fat,mus:ef.mus,mood:ef.mood,str:ef.str,comment:ef.comment});
          reloadData();renderApp();
        },C.amber);
        editBox.appendChild(fixBtn);
      } else {
        const btnRow=h('div',{style:{display:'flex',gap:'8px'}});
        const saveBtn2=mkBtn('Guardar cambios',()=>{
          DB.saveLog({date:l.date,weight:+eWt.querySelector('input').value||null,hrv:+eHrv.querySelector('input').value||null,sleep:+eSlp.querySelector('input').value||null,sq:ef.sq,fat:ef.fat,mus:ef.mus,mood:ef.mood,str:ef.str,comment:ef.comment});
          reloadData();renderApp();
        },C.blue);
        saveBtn2.style.flex='1';
        const delBtn=mkBtn('Eliminar',()=>{
          if(confirm(`¿Eliminar el registro del ${fmtD(l.date)}?`)){DB.deleteLog(l.date);reloadData();renderApp();}
        },C.red);
        delBtn.style.flex='1';
        btnRow.appendChild(saveBtn2);btnRow.appendChild(delBtn);
        editBox.appendChild(btnRow);
      }
      item.appendChild(editBox);
      hlist.appendChild(item);
    });
  }
  filterBtn.addEventListener('click',()=>{
    showAllLogs=!showAllLogs;
    filterBtn.textContent=showAllLogs?'Mostrar menos ▴':'Mostrar todo ▾';
    renderLogHistory();
  });
  renderLogHistory();
  hist.appendChild(hlist);gap.appendChild(hist);
  frag.appendChild(gap);return frag;
}

// ─── ENTRENO ────────────────────────────────────────────────────────
function renderEntreno(){
  const frag=document.createDocumentFragment();
  const gap=h('div',{style:{display:'flex',flexDirection:'column',gap:'12px'}});
  const form={date:today(),discipline:'Ciclismo',zone:'Z2',duration:'',distance:'',tss:'',powerAvg:'',powerNorm:'',hrAvg:'',hrMax:'',cadence:'',elevation:'',rpe:6,paceAvgSec:'',swimPaceSec:'',swolf:'',comment:''};
  let parsed={};

  // Parser card
  const pCard=mkCard(null);
  const pInner=h('div',{style:{display:'flex',flexDirection:'column',gap:'10px'}});
  pInner.appendChild(mkLbl('⚡ Importador inteligente IronCoach'));
  const modeHelp=h('div',{style:{fontSize:'11px',color:C.t1,lineHeight:'1.5'}});
  modeHelp.textContent='Pega un bloque estructurado CAMPO=VALOR para máxima precisión. El lenguaje natural sigue funcionando como alternativa.';
  pInner.appendChild(modeHelp);
  const pta=h('textarea',{rows:'10',className:'inp',placeholder:'Pega aquí el bloque IronCoach que te enviaré después de cada entrenamiento.'});
  pta.style.borderColor=C.blue+'44';pInner.appendChild(pta);
  const pResult=h('div');pInner.appendChild(pResult);

  const templateRow=h('div',{style:{display:'flex',gap:'8px'}});
  const exampleBtn=mkBtn('Ver plantilla',()=>{
    pta.value=buildIronCoachTemplate();
    pta.focus();
  },C.blue,true);
  exampleBtn.style.flex='1';
  const clearBtn=mkBtn('Limpiar',()=>{
    pta.value='';pResult.innerHTML='';
  },C.t2,true);
  clearBtn.style.flex='1';
  templateRow.appendChild(exampleBtn);templateRow.appendChild(clearBtn);pInner.appendChild(templateRow);

  const pBtn=mkBtn('Analizar → rellenar todos los campos',()=>{
    if(!pta.value.trim())return;
    parsed=parseStructuredIronCoach(pta.value)||parseText(pta.value);
    // Apply to form inputs
    if(parsed.date){
      form.date=parsed.date;
      const di=dateInp.querySelector('input');if(di)di.value=parsed.date;
    }
    if(parsed.discipline){
      const discRaw=String(parsed.discipline).trim();
      const discNorm=discRaw.toLowerCase();
      const known=
        /nataci[oó]n/.test(discNorm)?'Natación':
        /ciclismo indoor|rodillo/.test(discNorm)?'Ciclismo Indoor':
        /ciclismo|bici/.test(discNorm)?'Ciclismo':
        /carrera indoor|cinta/.test(discNorm)?'Carrera Indoor':
        /carrera|running|trail|montaña/.test(discNorm)?'Carrera':
        /fuerza|calistenia/.test(discNorm)?'Fuerza':
        DISCS.includes(discRaw)?discRaw:'Otro';
      form.discipline=known;discSel.querySelector('select').value=known;updateFields();
    }
    if(parsed.zone){
      form.zone=parsed.zone;
      zoneSel.querySelector('select').value=parsed.zone;
    }
    if(parsed.duration!==undefined)setInpVal(durInp,parsed.duration);
    if(parsed.distance!==undefined)setInpVal(distInp,parsed.distance);
    if(parsed.tss!==undefined)setInpVal(tssInp,parsed.tss);
    if(parsed.powerAvg!==undefined&&powAvgInp)setInpVal(powAvgInp,parsed.powerAvg);
    if(parsed.powerNorm!==undefined&&powNPInp)setInpVal(powNPInp,parsed.powerNorm);
    if(parsed.powerMax!==undefined)form.powerMax=parsed.powerMax;
    if(parsed.hrAvg!==undefined)setInpVal(hrAvgInp,parsed.hrAvg);
    if(parsed.hrMax!==undefined)setInpVal(hrMaxInp,parsed.hrMax);
    if(parsed.cadence!==undefined&&cadInp)setInpVal(cadInp,parsed.cadence);
    if(parsed.elevation!==undefined&&elevInp)setInpVal(elevInp,parsed.elevation);
    if(parsed.rpe!==undefined)form.rpe=parsed.rpe;
    if(parsed.paceAvgSec!==undefined&&paceInp)setInpVal(paceInp,fmtPace(parsed.paceAvgSec));
    if(parsed.swimPaceSec!==undefined&&swimPaceInp)setInpVal(swimPaceInp,fmtPace(parsed.swimPaceSec));
    if(parsed.swolf!==undefined&&swolfInp)setInpVal(swolfInp,parsed.swolf);
    if(parsed.comment)setInpVal(comInp,parsed.comment);
    if(parsed.sessionType){
      const prefix=`Tipo: ${parsed.sessionType}`;
      comInp.value=comInp.value?`${prefix}\n${comInp.value}`:prefix;
    }
    if(parsed.zoneBreakdown){
      zoneBreakdown=parsed.zoneBreakdown;
      zbInp.value=Object.entries(parsed.zoneBreakdown).map(([z,m])=>`${m}min ${z}`).join(', ');
    }
    // Show result
    pResult.innerHTML='';
    const keys=Object.entries(parsed).filter(([,v])=>v!==undefined);
    if(keys.length){
      const pb=h('div',{className:'parse-box'});
      const structured=!!parseStructuredIronCoach(pta.value);
      const pt=h('span',{style:{fontSize:'11px',color:structured?C.green:C.purple,fontWeight:'700',fontFamily:'monospace'}});
      pt.textContent=structured?'✓ Formato estructurado reconocido':'Detectado mediante lenguaje natural';
      pb.appendChild(pt);
      const pc=h('div',{className:'parse-chips'});
      keys.forEach(([k,v])=>{const ch=h('span',{className:'parse-chip'});ch.innerHTML=`${k}: <span style="color:#eef0f8">${v}</span>`;pc.appendChild(ch);});
      pb.appendChild(pc);pResult.appendChild(pb);
    }
  },C.purple);
  pInner.appendChild(pBtn);
  pCard.appendChild(pInner);gap.appendChild(pCard);

  const guideCard=mkCard(null,{background:C.green+'0d',border:`1px solid ${C.green}33`});
  guideCard.appendChild(mkLbl('Formato recomendado'));
  const guide=h('div',{style:{fontSize:'11px',color:C.t1,lineHeight:'1.6',marginTop:'8px'}});
  guide.innerHTML='Usa siempre <b>CAMPO=VALOR</b>. Las zonas aceptan <b>hh:mm:ss</b>, <b>mm:ss</b> o minutos decimales. Si hay desglose Z1–Z7, la zona dominante se calcula automáticamente.';
  guideCard.appendChild(guide);gap.appendChild(guideCard);

  // Form card
  const fCard=mkCard(null);
  const fInner=h('div',{style:{display:'flex',flexDirection:'column',gap:'12px'}});
  const fGrid=h('div',{className:'grid2'});

  const dateInp=mkInp('Fecha','date',form.date,v=>form.date=v);
  const discSel=mkSel('Disciplina',form.discipline,v=>{form.discipline=v;updateFields();},DISCS);
  const zoneSel=mkSel('Zona dominante',form.zone,v=>form.zone=v,['Z1','Z2','Z3','Z4','Z5','Z6','Z7']);
  const durInp=mkInp('Duración (min)','number',form.duration,v=>{form.duration=v;autoTSS();});
  const distInp=mkInp('Distancia (km)','number',form.distance,v=>form.distance=v);
  const tssInp=mkInp('TSS','number',form.tss,v=>form.tss=v,'Auto');
  [dateInp,discSel,zoneSel,durInp,distInp,tssInp].forEach(i=>fGrid.appendChild(i));
  fInner.appendChild(fGrid);

  // Desglose por zona — texto libre, opcional
  let zoneBreakdown={};
  let cardiacDrift=null;
  const zbWrap=h('div',{style:{display:'flex',flexDirection:'column',gap:'5px'}});
  zbWrap.appendChild(mkLbl('Desglose por zona (opcional)'));
  const zbInp=h('input',{type:'text',className:'inp',placeholder:'Ej: 10min Z1, 40min Z2, 10min Z4'});
  const driftBadge=h('div',{style:{display:'none',fontSize:'11px',color:C.amber,fontFamily:'monospace',marginTop:'2px'}});
  zbInp.addEventListener('input',e=>{
    zoneBreakdown=parseZoneBreakdown(e.target.value);
    if(Object.keys(zoneBreakdown).length){
      let domZ=null,domMin=0;
      Object.entries(zoneBreakdown).forEach(([z,m])=>{if(m>domMin){domMin=m;domZ=z;}});
      if(domZ){form.zone=domZ;zoneSel.querySelector('select').value=domZ;}
    }
    cardiacDrift=parseCardiacDrift(e.target.value);
    if(cardiacDrift){
      driftBadge.style.display='block';
      driftBadge.textContent=`Deriva cardíaca detectada: ${cardiacDrift.drift>0?'+':''}${cardiacDrift.drift}% (${cardiacDrift.hr1}→${cardiacDrift.hr2}bpm)`;
    } else {
      driftBadge.style.display='none';
    }
  });
  zbWrap.appendChild(zbInp);
  zbWrap.appendChild(driftBadge);
  const zbHint=h('span',{style:{fontSize:'10px',color:C.t2,lineHeight:'1.4'}});
  zbHint.textContent='Si lo rellenas, las gráficas de distribución de zona usan estos minutos en vez de la zona dominante. Opcional: añade "1a mitad 142bpm, 2a mitad 151bpm" para calcular deriva cardíaca.';
  zbWrap.appendChild(zbHint);
  fInner.appendChild(zbWrap);

  // Power fields (dynamic)
  const powSection=h('div',{style:{display:'flex',flexDirection:'column',gap:'10px'}});
  let powAvgInp=null,powNPInp=null,cadInp=null,elevInp=null,paceInp=null,swimPaceInp=null,swolfInp=null,zoneHint=null;

  const hrGrid=h('div',{className:'grid2'});
  const hrAvgInp=mkInp('FC media (bpm)','number',form.hrAvg,v=>form.hrAvg=v);
  const hrMaxInp=mkInp('FC máxima (bpm)','number',form.hrMax,v=>form.hrMax=v);
  hrGrid.appendChild(hrAvgInp);hrGrid.appendChild(hrMaxInp);

  const rpeRow=mkSld('RPE — Esfuerzo percibido',form.rpe,1,10,v=>form.rpe=v,C.amber);
  const comWrap=h('div',{style:{display:'flex',flexDirection:'column',gap:'5px'}});
  comWrap.appendChild(mkLbl('Notas'));
  const comInp=h('textarea',{rows:'2',className:'inp',placeholder:'Sensaciones...'});
  comWrap.appendChild(comInp);

  function setInpVal(wrap,val){
    const inp=wrap.querySelector('input')||wrap.querySelector('textarea')||wrap.querySelector('select');
    if(inp)inp.value=String(val??'');
    const key=inp?.dataset?.key;
    if(key)form[key]=val;
  }

  function autoTSS(){
    const pnv=powNPInp?+(powNPInp.querySelector('input')?.value||0):0;
    const durv=+(durInp.querySelector('input')?.value||0);
    if(ic(form.discipline)&&pnv>0&&durv>0){
      const IF=pnv/STATE.cfg.ftp;
      const tss=r0(((durv*60)*pnv*IF)/(STATE.cfg.ftp*3600)*100);
      const ti=tssInp.querySelector('input');if(ti){ti.value=tss;form.tss=tss;}
    }
  }

  function updateFields(){
    powSection.innerHTML='';zoneHint=null;
    powAvgInp=null;powNPInp=null;cadInp=null;elevInp=null;paceInp=null;swimPaceInp=null;swolfInp=null;
    if(ic(form.discipline)){
      powSection.appendChild(mkDivider());
      const pl=mkLbl('Potencia');powSection.appendChild(pl);
      const pg=h('div',{className:'grid2'});
      powAvgInp=mkInp('Potencia media (W)','number','',v=>{form.powerAvg=v;},'' );
      powNPInp=mkInp('Potencia NP (W)','number','',v=>{form.powerNorm=v;autoTSS();});
      cadInp=mkInp('Cadencia (rpm)','number','',v=>form.cadence=v,'82');
      elevInp=mkInp('Desnivel (m)','number','',v=>form.elevation=v,'');
      [powAvgInp,powNPInp,cadInp,elevInp].forEach(i=>pg.appendChild(i));
      powSection.appendChild(pg);
      zoneHint=h('div',{style:{fontSize:'12px',color:C.t2,fontFamily:'monospace',display:'none'}});
      powSection.appendChild(zoneHint);
      if(powAvgInp){powAvgInp.querySelector('input').addEventListener('input',e=>{
        const v=+e.target.value;form.powerAvg=v;
        const pz=getPZones();const z=pz.find(z=>v>=z.lo&&(v<=z.hi||z.z==='Z7'));
        if(z&&zoneHint){zoneHint.style.display='block';zoneHint.style.color=z.col;zoneHint.textContent=`${z.z} — ${z.name}`;}
      });}
    } else if(ir(form.discipline)){
      powSection.appendChild(mkDivider());
      const pl=mkLbl('Carrera');powSection.appendChild(pl);
      const pg=h('div',{className:'grid2'});
      paceInp=mkInp('Ritmo medio (m:ss)','text','',v=>{const s=parsePace(v);if(s)form.paceAvgSec=s;},'5:20');
      cadInp=mkInp('Cadencia (ppm)','number','',v=>form.cadence=v,'170');
      elevInp=mkInp('Desnivel (m)','number','',v=>form.elevation=v,'');
      [paceInp,cadInp,elevInp].forEach(i=>pg.appendChild(i));
      powSection.appendChild(pg);
    } else if(isw(form.discipline)){
      powSection.appendChild(mkDivider());
      const pl=mkLbl('Natación');powSection.appendChild(pl);
      const pg=h('div',{className:'grid2'});
      swimPaceInp=mkInp('Ritmo /100m (m:ss)','text','',v=>{const s=parsePace(v);if(s)form.swimPaceSec=s;},'2:05');
      swolfInp=mkInp('SWOLF','number','',v=>form.swolf=v,'42');
      [swimPaceInp,swolfInp].forEach(i=>pg.appendChild(i));
      powSection.appendChild(pg);
    }
  }

  discSel.querySelector('select').addEventListener('change',()=>updateFields());
  updateFields();
  fInner.appendChild(powSection);
  fInner.appendChild(mkDivider());
  fInner.appendChild(hrGrid);
  fInner.appendChild(rpeRow);
  fInner.appendChild(comWrap);

  const saveBtn=mkBtn('Guardar entrenamiento',()=>{
    const pnv=powNPInp?+(powNPInp.querySelector('input')?.value||0):0;
    const pav=powAvgInp?+(powAvgInp.querySelector('input')?.value||0):0;
    const wk={
      id:`w${Date.now()}`,
      date:form.date,discipline:form.discipline,zone:form.zone,
      duration:+(durInp.querySelector('input')?.value||0),
      distance:+(distInp.querySelector('input')?.value||0),
      tss:+(tssInp.querySelector('input')?.value||0),
      powerAvg:pav,powerNorm:pnv||pav,powerMax:+(form.powerMax||0),
      hrAvg:+(hrAvgInp.querySelector('input')?.value||0),
      hrMax:+(hrMaxInp.querySelector('input')?.value||0),
      cadence:cadInp?+(cadInp.querySelector('input')?.value||0):0,
      elevation:elevInp?+(elevInp.querySelector('input')?.value||0):0,
      rpe:form.rpe,
      paceAvgSec:form.paceAvgSec||null,
      swimPaceSec:form.swimPaceSec||null,
      swolf:form.swolf?+form.swolf:null,
      comment:comInp.value,
      zoneBreakdown:Object.keys(zoneBreakdown).length?zoneBreakdown:null,
      cardiacDrift:cardiacDrift?cardiacDrift.drift:null,
    };
    wk.tss=estTSS(wk,STATE.cfg);
    const ok=DB.saveWk(wk);
    if(ok){
      reloadData();
      saveBtn.textContent='✓ Guardado';saveBtn.style.background=`linear-gradient(135deg,${C.green},${C.green}cc)`;
      setTimeout(()=>{saveBtn.textContent='Guardar entrenamiento';saveBtn.style.background=`linear-gradient(135deg,${C.green},${C.green}cc)`;},2000);
    }
  },C.green);
  fInner.appendChild(saveBtn);
  fCard.appendChild(fInner);gap.appendChild(fCard);

  // ── Historial completo — Entreno ──
  const hist=mkCard(null);
  const histHead=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}});
  histHead.appendChild(mkLbl(`Histórico completo (${STATE.wks.length} sesiones)`));
  const filterBtn=h('button',{style:{width:'auto',padding:'5px 10px',fontSize:'11px',border:`1px solid ${C.border}`,borderRadius:'8px',background:'none',color:C.t1,cursor:'pointer'}});
  filterBtn.textContent='Mostrar todo ▾';
  histHead.appendChild(filterBtn);
  hist.appendChild(histHead);
  const hlist=h('div',{style:{display:'flex',flexDirection:'column',gap:'8px'}});
  let showAllWks=false;

  function renderWkHistory(){
    hlist.innerHTML='';
    const items=[...STATE.wks].reverse();
    const visible=showAllWks?items:items.slice(0,8);
    visible.forEach(w=>{
      const isBase=DB.isBaseWk(w.id);
      const wkItem=h('div',{style:{background:C.bg0,borderRadius:10,padding:'10px 12px',border:isBase?`1px dashed ${C.border}`:`1px solid ${C.border}`}});
      const topRow=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px',cursor:'pointer'}});
      const left=h('div',{style:{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}});
      const ico=h('span');ico.textContent=DISC_ICON[w.discipline]||'🎯';
      const dn=h('span',{style:{fontSize:'13px',fontWeight:'600',color:DISC_C[w.discipline]||C.t0}});dn.textContent=w.discipline;
      const zp=mkPill(w.zone,DISC_C[w.discipline]||C.t1);
      left.appendChild(ico);left.appendChild(dn);left.appendChild(zp);
      if(isBase){const tag=h('span',{style:{fontSize:'9px',color:C.t2,fontFamily:'monospace',background:C.border,padding:'1px 6px',borderRadius:'4px'}});tag.textContent='EXCEL';left.appendChild(tag);}
      topRow.appendChild(left);
      const dt=h('span',{style:{fontSize:'11px',color:C.t2,fontFamily:'monospace'}});dt.textContent=fmtD(w.date);
      topRow.appendChild(dt);
      wkItem.appendChild(topRow);

      const chips=h('div',{className:'wk-chips'});
      [[w.duration&&`${w.duration}min`,C.t1],[w.distance>0&&`${w.distance}km`,C.t1],[w.tss>0&&`TSS ${r1(w.tss)}`,C.amber],[w.powerAvg>0&&`${w.powerAvg}W`,C.blue],[w.hrAvg>0&&`${w.hrAvg}bpm`,C.red],[w.paceAvgSec>0&&`${fmtPace(w.paceAvgSec)}/km`,C.green],[w.swimPaceSec>0&&`${fmtPace(w.swimPaceSec)}/100m`,C.cyan]].forEach(([v,col])=>{if(v){const c=h('span',{className:'chip',style:{color:col}});c.textContent=v;chips.appendChild(c);}});
      if(w.zoneBreakdown&&Object.keys(w.zoneBreakdown).length){
        const zb=h('span',{className:'chip',style:{color:C.purple}});
        zb.textContent='📊 '+Object.entries(w.zoneBreakdown).map(([z,m])=>`${z}:${m}m`).join(' ');
        chips.appendChild(zb);
      }
      wkItem.appendChild(chips);

      const editBox=h('div',{style:{display:'none',marginTop:'10px',borderTop:`1px solid ${C.border}`,paddingTop:'10px',flexDirection:'column',gap:'10px'}});
      topRow.addEventListener('click',()=>{
        const open=editBox.style.display==='flex';
        editBox.style.display=open?'none':'flex';
      });

      const ew={duration:w.duration||'',distance:w.distance||'',tss:w.tss||'',powerAvg:w.powerAvg||'',powerNorm:w.powerNorm||'',hrAvg:w.hrAvg||'',rpe:w.rpe||5,comment:w.comment||''};
      const eGrid=h('div',{className:'grid2'});
      const eDur=mkInp('Duración (min)','number',ew.duration,v=>ew.duration=v);
      const eDist=mkInp('Distancia (km)','number',ew.distance,v=>ew.distance=v);
      const eTss=mkInp('TSS','number',ew.tss,v=>ew.tss=v);
      const eHr=mkInp('FC media (bpm)','number',ew.hrAvg,v=>ew.hrAvg=v);
      [eDur,eDist,eTss,eHr].forEach(i=>eGrid.appendChild(i));
      editBox.appendChild(eGrid);
      if(ic(w.discipline)){
        const eGrid2=h('div',{className:'grid2'});
        const ePow=mkInp('Potencia media (W)','number',ew.powerAvg,v=>ew.powerAvg=v);
        const eNp=mkInp('Potencia NP (W)','number',ew.powerNorm,v=>ew.powerNorm=v);
        eGrid2.appendChild(ePow);eGrid2.appendChild(eNp);
        editBox.appendChild(eGrid2);
      }
      const eCom=h('textarea',{rows:'2',className:'inp',placeholder:'Notas...'});
      eCom.value=ew.comment;eCom.addEventListener('input',e=>ew.comment=e.target.value);
      editBox.appendChild(eCom);

      function buildUpdated(){
        const updated={...w,duration:+ew.duration||0,distance:+ew.distance||0,tss:+ew.tss||0,powerAvg:+ew.powerAvg||0,powerNorm:+ew.powerNorm||+ew.powerAvg||0,hrAvg:+ew.hrAvg||0,comment:ew.comment};
        return updated;
      }

      if(isBase){
        const note=h('div',{style:{fontSize:'11px',color:C.t2,lineHeight:'1.4'}});
        note.textContent='Dato importado del Excel. Si está mal (p.ej. fecha o potencia incorrecta), corrígelo aquí: se guarda como corrección sin tocar el archivo original.';
        editBox.appendChild(note);
        const fixBtn=mkBtn('✎ Corregir esta sesión',()=>{
          DB.saveWk(buildUpdated());reloadData();renderApp();
        },C.amber);
        editBox.appendChild(fixBtn);
      } else {
        const btnRow=h('div',{style:{display:'flex',gap:'8px'}});
        const saveBtn2=mkBtn('Guardar cambios',()=>{
          DB.saveWk(buildUpdated());reloadData();renderApp();
        },C.green);
        saveBtn2.style.flex='1';
        const delBtn=mkBtn('Eliminar',()=>{
          if(confirm(`¿Eliminar esta sesión de ${w.discipline} del ${fmtD(w.date)}?`)){DB.deleteWk(w.id);reloadData();renderApp();}
        },C.red);
        delBtn.style.flex='1';
        btnRow.appendChild(saveBtn2);btnRow.appendChild(delBtn);
        editBox.appendChild(btnRow);
      }
      wkItem.appendChild(editBox);
      hlist.appendChild(wkItem);
    });
  }
  filterBtn.addEventListener('click',()=>{
    showAllWks=!showAllWks;
    filterBtn.textContent=showAllWks?'Mostrar menos ▴':'Mostrar todo ▾';
    renderWkHistory();
  });
  renderWkHistory();
  hist.appendChild(hlist);gap.appendChild(hist);
  frag.appendChild(gap);return frag;
}

// ─── PROGRESO ──────────────────────────────────────────────────────
function renderProgreso(comp){
  const wks=STATE.wks, logs=STATE.logs, cfg=STATE.cfg;
  const{pmc}=comp;
  const bikes=wks.filter(w=>ic(w.discipline)&&w.distance>0&&w.duration>0);
  const runs=wks.filter(w=>ir(w.discipline)&&w.distance>0&&w.duration>0);
  const swims=wks.filter(w=>isw(w.discipline)&&(w.swimPaceSec>0||(w.distance>0&&w.duration>0)));
  const bestBike=bikes.length?Math.max(...bikes.map(w=>r1(w.distance/(w.duration/60)))):0;
  const avgBike5=bikes.length?r1(avg(bikes.slice(-5).map(w=>w.distance/(w.duration/60)))):0;
  const bestRun=runs.length?Math.min(...runs.map(w=>r0(w.duration*60/w.distance))):0;
  const avgRun5=runs.length?r0(avg(runs.slice(-5).map(w=>w.duration*60/w.distance))):0;
  const bestSwim=swims.length?Math.min(...swims.map(w=>w.swimPaceSec||r0(w.duration*60/(w.distance*10)))):0;
  const uB=avgBike5||bestBike,uR=avgRun5||bestRun,uS=bestSwim;
  const bScC=uB>0?cl(r0((uB/32)*100),0,100):0,bScA=uB>0?cl(r0((uB/35)*100),0,100):0;
  const rScC=uR>0?cl(r0((320/uR)*100),0,100):0,rScA=uR>0?cl(r0((300/uR)*100),0,100):0;
  const sScC=uS>0?cl(r0((120/uS)*100),0,100):0,sScA=uS>0?cl(r0((110/uS)*100),0,100):0;
  const gC=r0(bScC*.45+rScC*.35+sScC*.20),gA=r0(bScA*.45+rScA*.35+sScA*.20);

  const rrs=calcRaceReadinessGlobal(wks,logs,pmc,cfg);

  const frag=document.createDocumentFragment();
  const gap=h('div',{style:{display:'flex',flexDirection:'column',gap:'12px'}});

  // ══ RACE READINESS SCORE — sección principal ══
  const rrsCard=mkCard(null,{background:C.purple+'14',border:`1px solid ${C.purple}44`});
  const rrsHead=h('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',marginBottom:'14px'}});
  rrsHead.appendChild(mkLbl('Race Readiness Global'));
  rrsHead.appendChild(mkBig(rrs.global,'/100',rrs.global>=70?C.green:rrs.global>=50?C.amber:C.red,42));
  rrsCard.appendChild(rrsHead);

  // Desglose por disciplina: Top% / Realista% según Race Readiness
  const sportGrid=h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'12px'}});
  [
    {label:'Natación',icon:'🏊',rr:rrs.swim,col:C.cyan},
    {label:'Ciclismo',icon:'🚴',rr:rrs.bike,col:C.blue},
    {label:'Carrera',icon:'🏃',rr:rrs.run,col:C.green},
  ].forEach(s=>{
    const box=h('div',{style:{background:C.bg0,borderRadius:10,padding:'10px 8px',display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}});
    const top=h('div',{style:{fontSize:'16px'}});top.textContent=s.icon;
    const nm=h('div',{style:{fontSize:'11px',color:s.col,fontWeight:'700'}});nm.textContent=s.label;
    const sc=mkBig(s.rr.total,null,s.rr.total>=70?C.green:s.rr.total>=50?C.amber:C.red,22);
    const sub=h('div',{style:{fontSize:'9px',color:C.t2,fontFamily:'monospace'}});sub.textContent=`${s.rr.sessionsCount} sesiones`;
    box.appendChild(top);box.appendChild(nm);box.appendChild(sc);box.appendChild(sub);
    sportGrid.appendChild(box);
  });
  rrsCard.appendChild(sportGrid);

  // Interpretación automática
  if(rrs.strongest){
    const interp=h('div',{style:{display:'flex',flexDirection:'column',gap:'6px',marginTop:'4px'}});
    const lines=[
      {icon:'💪',text:`Principal punto fuerte: ${rrs.strongest.toLowerCase()}.`,col:C.green},
      {icon:'⚠️',text:`Principal limitante: ${rrs.weakest.toLowerCase()}.`,col:C.amber},
      {icon:'🎯',text:`Mayor potencial de mejora: ${rrs.improvePotential.label.toLowerCase()} en ${rrs.improvePotential.disc.toLowerCase()}.`,col:C.purple},
    ];
    lines.forEach(l=>{
      const row_=h('div',{style:{display:'flex',gap:'8px',alignItems:'flex-start'}});
      const ic_=h('span',{style:{fontSize:'13px'}});ic_.textContent=l.icon;
      const tx=h('span',{style:{fontSize:'12px',color:l.col,lineHeight:'1.4'}});tx.textContent=l.text;
      row_.appendChild(ic_);row_.appendChild(tx);interp.appendChild(row_);
    });
    rrsCard.appendChild(interp);
  } else {
    const note=h('div',{style:{fontSize:'12px',color:C.t2,textAlign:'center'}});
    note.textContent='Registra más entrenamientos para ver la interpretación.';
    rrsCard.appendChild(note);
  }
  gap.appendChild(rrsCard);

  // Desglose de los 4 pilares por disciplina (expandible)
  const pillarCard=mkCard(null);
  pillarCard.appendChild(mkLbl('Desglose por pilares'));
  const pillarBody=h('div',{style:{marginTop:'10px',display:'flex',flexDirection:'column',gap:'14px'}});
  [
    {label:'🚴 Ciclismo',rr:rrs.bike,col:C.blue},
    {label:'🏃 Carrera',rr:rrs.run,col:C.green},
    {label:'🏊 Natación',rr:rrs.swim,col:C.cyan},
  ].forEach(s=>{
    const block=h('div',{});
    const bHead=h('div',{style:{display:'flex',justifyContent:'space-between',marginBottom:'8px'}});
    const bLbl=h('span',{style:{fontSize:'13px',fontWeight:'700',color:s.col}});bLbl.textContent=s.label;
    const bSc=h('span',{style:{fontSize:'13px',fontWeight:'800',color:C.t0,fontFamily:'monospace'}});bSc.textContent=`${s.rr.total}/100`;
    bHead.appendChild(bLbl);bHead.appendChild(bSc);block.appendChild(bHead);
    Object.values(s.rr.pillars).forEach(p=>{
      const row_=h('div',{style:{display:'flex',flexDirection:'column',gap:'3px',marginBottom:'6px'}});
      const rTop=h('div',{style:{display:'flex',justifyContent:'space-between'}});
      const rLbl=h('span',{style:{fontSize:'11px',color:C.t1}});rLbl.textContent=`${p.label} (${p.weight}%)`;
      const rSc=h('span',{style:{fontSize:'11px',color:p.sc>=70?C.green:p.sc>=50?C.amber:C.red,fontFamily:'monospace'}});rSc.textContent=`${p.sc}`;
      rTop.appendChild(rLbl);rTop.appendChild(rSc);row_.appendChild(rTop);
      row_.appendChild(mkBar(p.sc,100,p.sc>=70?C.green:p.sc>=50?C.amber:C.red,4));
      block.appendChild(row_);
    });
    pillarBody.appendChild(block);
  });
  pillarCard.appendChild(pillarBody);
  const pillarNote=h('div',{style:{fontSize:'10px',color:C.t2,marginTop:'8px',lineHeight:'1.4'}});
  pillarNote.textContent='Resistencia específica: sesiones largas en Z2 (duración + EF + deriva cardíaca si la registras). Rendimiento específico: sesiones de calidad (Z3-Z6). Estado fisiológico: HRV + TSB + fatiga reciente. Consistencia: regularidad en las últimas 4 semanas.';
  pillarCard.appendChild(pillarNote);
  gap.appendChild(pillarCard);

  // Global scores (ritmo/velocidad absolutos — referencia complementaria)
  const gCard=mkCard(null);
  gCard.appendChild(mkLbl('Referencia por ritmo/velocidad absoluto'));
  const gGrid=h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginTop:'10px',marginBottom:'14px'}});
  [{lbl:'Obj. Conservador',sc:gC,t:'≤5h30',d:'32km/h · 5:20 · 2:00'},{lbl:'Obj. Ambicioso',sc:gA,t:'≤5h05',d:'35km/h · 5:00 · 1:50'}].forEach(({lbl,sc,t,d})=>{
    const col=sc>=75?C.green:sc>=55?C.amber:C.red;
    const box=h('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',background:C.bg0,borderRadius:'10px',padding:'12px 8px'}});
    box.appendChild(mkLbl(lbl));
    const bn=mkBig(sc,'%',col,38);box.appendChild(bn);
    const t_=h('span',{style:{fontSize:'10px',color:C.t2,fontFamily:'monospace',textAlign:'center'}});t_.textContent=t;box.appendChild(t_);
    const d_=h('span',{style:{fontSize:'9px',color:C.t2,fontFamily:'monospace',textAlign:'center'}});d_.textContent=d;box.appendChild(d_);
    gGrid.appendChild(box);
  });
  gCard.appendChild(gGrid);

  // Tiempo estimado
  const estBike=uB>0?r0(90/uB*60):null,estRun=uR>0?r0(uR*21/60):null,estSwim=uS>0?r0(uS*19/60):null;
  if(estBike&&estRun&&estSwim){
    const tot=estBike+estRun+estSwim+6;
    const tBox=h('div',{style:{background:C.blue+'15',border:`1px solid ${C.blue}33`,borderRadius:'10px',padding:'10px 12px'}});
    tBox.appendChild(mkLbl('Tiempo estimado en carrera'));
    const tRow=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'6px'}});
    const tDet=h('span',{style:{fontSize:'11px',color:C.t1}});tDet.textContent=`🏊 ${estSwim}min + 🚴 ${estBike}min + 🏃 ${estRun}min + T1/T2`;
    const fmtTot=m=>`${Math.floor(m/60)}h${String(m%60).padStart(2,'0')}`;
    tRow.appendChild(tDet);tRow.appendChild(mkBig(fmtTot(tot),null,C.blue,20));
    tBox.appendChild(tRow);gCard.appendChild(tBox);
  }
  gap.appendChild(gCard);

  // Desglose
  const dCard=mkCard(null);
  dCard.appendChild(mkLbl('Desglose por disciplina — Valencia 2027'));
  [['🏊','Natación (1.9 km)',uS?`${fmtPace(uS)}/100m`:null,'2:00/100m','1:50/100m',sScC,sScA],['🚴','Ciclismo (90 km)',uB?`${uB} km/h`:null,'32 km/h','35 km/h',bScC,bScA],['🏃','Carrera (21 km)',uR?`${fmtPace(uR)}/km`:null,'5:20/km','5:00/km',rScC,rScA]].forEach(([ico,title,cur,consV,ambiV,scC,scA])=>{
    const seg=h('div',{className:'prog-seg'});
    const top=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}});
    const tl_=h('span',{style:{fontSize:'14px',fontWeight:'600',color:C.t0}});tl_.textContent=`${ico} ${title}`;
    const cv=h('span',{style:{fontSize:'14px',fontWeight:'900',color:cur?C.t0:C.t2,fontVariantNumeric:'tabular-nums'}});cv.textContent=cur||'Sin datos';
    top.appendChild(tl_);top.appendChild(cv);seg.appendChild(top);
    [{lbl:`Conservador: ${consV}`,sc:scC},{lbl:`Ambicioso: ${ambiV}`,sc:scA}].forEach(({lbl,sc})=>{
      const sRow=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}});
      const sl_=h('span',{style:{fontSize:'11px',color:C.t2}});sl_.textContent=lbl;
      const sv=h('span',{style:{fontSize:'12px',fontWeight:'700',color:sc>=95?C.green:sc>=75?C.amber:C.red,fontFamily:'monospace'}});sv.textContent=`${sc}%`;
      sRow.appendChild(sl_);sRow.appendChild(sv);seg.appendChild(sRow);
      seg.appendChild(mkBar(sc,100,sc>=95?C.green:sc>=75?C.amber:C.red,6));
      const spacer=h('div',{style:{height:'4px'}});seg.appendChild(spacer);
    });
    dCard.appendChild(seg);
  });
  const note=h('div',{style:{background:C.bg0,borderRadius:'8px',padding:'8px 12px',marginTop:'8px'}});
  const nt=h('span',{style:{fontSize:'11px',color:C.t2}});nt.textContent=`Basado en ${bikes.length} salidas en bici, ${runs.length} carreras y ${swims.length} nataciones.`;note.appendChild(nt);
  dCard.appendChild(note);gap.appendChild(dCard);
  frag.appendChild(gap);return frag;
}

// ─── ANÁLISIS ──────────────────────────────────────────────────────
function renderAnalisis(comp){
  const{pmc,hrv,wt,eft,ftpE}=comp;
  const frag=document.createDocumentFragment();
  const gap=h('div',{style:{display:'flex',flexDirection:'column',gap:'12px'}});

  const tabs=h('div',{className:'tabs'});
  const tabIds=['forma','hrv','peso','rend'];
  const tabLabels=['Forma','HRV','Peso','Rend.'];
  const tabBtns=[];
  const content=h('div');

  function renderTab(id){
    content.innerHTML='';STATE.analysisTab=id;
    tabBtns.forEach((b,i)=>{b.className='tab'+(tabIds[i]===id?' active':'');});

    if(id==='forma'){
      // PMC chart
      const pmcCard=mkCard(null);
      pmcCard.appendChild(mkLbl('PMC — Curva de rendimiento (60 días)'));
      const ctlD=pmc.ctlA.slice(-60),atlD=pmc.atlA.slice(-60);
      const allD=[...ctlD,...atlD].filter(v=>v>0);
      if(allD.length){
        const mn=Math.min(...allD)*.85,mx=Math.max(...allD)*1.1,rng=mx-mn||1;
        const W=300,H=70,n=ctlD.length,px_=i=>(i/(n-1||1))*W,py_=v=>H-((v-mn)/rng)*H;
        const mkP=a=>a.map((v,i)=>`${i===0?'M':'L'}${px_(i).toFixed(1)},${py_(v).toFixed(1)}`).join(' ');
        const svgEl=document.createElementNS('http://www.w3.org/2000/svg','svg');
        svgEl.setAttribute('viewBox',`0 0 ${W} ${H}`);svgEl.style.width='100%';svgEl.style.height=`${H}px`;
        ['preserveAspectRatio'].forEach(a=>svgEl.setAttribute(a,'none'));
        const p1=document.createElementNS('http://www.w3.org/2000/svg','path');p1.setAttribute('d',mkP(ctlD));p1.setAttribute('fill','none');p1.setAttribute('stroke',C.green);p1.setAttribute('stroke-width','2');p1.setAttribute('stroke-linecap','round');
        const p2=document.createElementNS('http://www.w3.org/2000/svg','path');p2.setAttribute('d',mkP(atlD));p2.setAttribute('fill','none');p2.setAttribute('stroke',C.red);p2.setAttribute('stroke-width','1.5');p2.setAttribute('stroke-linecap','round');p2.setAttribute('stroke-dasharray','4 3');
        svgEl.appendChild(p1);svgEl.appendChild(p2);
        pmcCard.appendChild(svgEl);
        const leg=h('div',{style:{display:'flex',gap:'14px',marginTop:'6px'}});
        [['CTL',C.green,pmc.ctl],['ATL',C.red,pmc.atl]].forEach(([l,c,v])=>{
          const li=h('div',{style:{display:'flex',alignItems:'center',gap:'5px'}});
          const dot=h('div',{style:{width:'12px',height:'2px',background:c}});
          const lt=h('span',{style:{fontSize:'11px',color:C.t1,fontFamily:'monospace'}});lt.textContent=`${l} ${v}`;
          li.appendChild(dot);li.appendChild(lt);leg.appendChild(li);
        });
        pmcCard.appendChild(leg);
      }
      const mg=h('div',{className:'grid3',style:{marginTop:'12px'}});
      [['CTL',pmc.ctl,C.green,'Forma'],['ATL',pmc.atl,C.red,'Fatiga'],['TSB',pmc.tsb>0?`+${pmc.tsb}`:pmc.tsb,pmc.tsb>5?C.green:pmc.tsb>-20?C.amber:C.red,'Balance']].forEach(([l,v,c,s])=>{
        const mm=h('div',{className:'metric-mini'});mm.appendChild(mkLbl(l));mm.appendChild(mkBig(v,null,c,20));const ss=h('div',{style:{fontSize:'10px',color:C.t2,marginTop:'2px',fontFamily:'monospace'}});ss.textContent=s;mm.appendChild(ss);mg.appendChild(mm);
      });
      pmcCard.appendChild(mg);content.appendChild(pmcCard);

      // Carga disciplina
      const distCard=mkCard(null);distCard.appendChild(mkLbl('Carga por disciplina'));
      const dlist=h('div',{style:{marginTop:'12px',display:'flex',flexDirection:'column',gap:'8px'}});
      DISCS.slice(0,6).forEach(d=>{
        const t=STATE.wks.filter(w=>w.discipline===d).reduce((a,b)=>a+(b.tss||0),0);
        const tot=STATE.wks.reduce((a,b)=>a+(b.tss||0),0)||1;
        if(!t)return;
        const row_=h('div',{style:{display:'flex',flexDirection:'column',gap:'4px'}});
        const rr=h('div',{style:{display:'flex',justifyContent:'space-between'}});
        const rl=h('span',{style:{fontSize:'12px',color:DISC_C[d]}});rl.textContent=`${DISC_ICON[d]} ${d}`;
        const rv=h('span',{style:{fontSize:'11px',color:C.t2,fontFamily:'monospace'}});rv.textContent=`TSS ${r0(t)} · ${r0((t/tot)*100)}%`;
        rr.appendChild(rl);rr.appendChild(rv);row_.appendChild(rr);row_.appendChild(mkBar(t,tot,DISC_C[d],5));
        dlist.appendChild(row_);
      });
      distCard.appendChild(dlist);content.appendChild(distCard);
    }

    if(id==='hrv'){
      const hCard=mkCard(null);
      const hg=h('div',{className:'grid2',style:{marginBottom:'12px'}});
      [['Media 7d',hrv.b7,'ms',C.t0],['Media 30d',hrv.b30,'ms',C.t0],['Tend./sem',hrv.slope>0?`+${hrv.slope}`:hrv.slope,'ms',hrv.slope>0?C.green:C.amber],['Señal hoy',hrv.signal?`${hrv.signal}%`:'—','',hrv.signal>=95?C.green:hrv.signal>=85?C.amber:C.red]].forEach(([l,v,u,c])=>{
        const mm=h('div',{className:'metric-mini'});mm.appendChild(mkLbl(l));const bn=h('div',{style:{marginTop:'4px'}});bn.appendChild(mkBig(v,u,c,20));mm.appendChild(bn);hg.appendChild(mm);
      });
      hCard.appendChild(hg);
      hCard.appendChild(mkLbl('Histórico HRV 30 días'));
      const ch=hHTML(lineSVG(hrv.hist.map(h_=>h_.hrv),C.purple,hrv.b30,300,70));ch.style.marginTop='8px';hCard.appendChild(ch);
      content.appendChild(hCard);
      const refCard=mkCard(null);refCard.appendChild(mkLbl('Referencia señal HRV'));
      const rl=h('div',{style:{marginTop:'10px',display:'flex',flexDirection:'column',gap:'8px'}});
      [['≥110%','Sistema muy recuperado. Día de calidad.',C.green],['95–110%','Normal. Entrena según plan.',C.green],['90–94%','Precaución. Z2 máximo.',C.amber],['<90%','Bajo. Descanso o Z1.',C.red]].forEach(([r_,t_,c_])=>{
        const row_=h('div',{style:{display:'flex',gap:'10px',alignItems:'flex-start'}});
        row_.appendChild(mkPill(r_,c_));
        const tx=h('span',{style:{fontSize:'12px',color:C.t1,lineHeight:'1.4'}});tx.textContent=t_;row_.appendChild(tx);rl.appendChild(row_);
      });
      refCard.appendChild(rl);content.appendChild(refCard);
    }

    if(id==='peso'){
      const wCard=mkCard(null);
      const wg=h('div',{className:'grid2',style:{marginBottom:'12px'}});
      [['Actual',wt.cur,'kg',C.t0],['Media 7d',wt.b7,'kg',C.t0],['Media 30d',wt.b30,'kg',C.t0],['Tend./sem',wt.slope>0?`+${wt.slope}`:wt.slope,'kg',wt.slope<=-0.3&&wt.slope>=-0.5?C.green:wt.slope<-0.8?C.red:C.amber]].forEach(([l,v,u,c])=>{
        const mm=h('div',{className:'metric-mini'});mm.appendChild(mkLbl(l));const bn=h('div',{style:{marginTop:'4px'}});bn.appendChild(mkBig(v,u,c,20));mm.appendChild(bn);wg.appendChild(mm);
      });
      wCard.appendChild(wg);
      wCard.appendChild(mkLbl('Histórico peso (datos Excel + tus registros)'));
      const wch=hHTML(lineSVG(wt.hist.map(h_=>h_.weight),C.cyan,79,300,70));wch.style.marginTop='8px';wCard.appendChild(wch);
      const wn=h('span',{style:{fontSize:'10px',color:C.t2,fontFamily:'monospace',marginTop:'4px',display:'block'}});wn.textContent='— Objetivo 79kg';wCard.appendChild(wn);
      content.appendChild(wCard);
    }

    if(id==='rend'){
      const rCard=mkCard(null);
      const rg=h('div',{className:'grid2',style:{marginBottom:'12px'}});
      [['EF actual',eft.cur??'—','',C.t0],['EF base 4ses.',eft.b4||'—','',C.t0],['Tend. EF/sem',eft.sl>=0?`+${eft.sl}`:eft.sl,'',eft.sl>0?C.green:eft.sl<-0.05?C.red:C.t0],['FTP estimado',ftpE,'W',C.blue]].forEach(([l,v,u,c])=>{
        const mm=h('div',{className:'metric-mini'});mm.appendChild(mkLbl(l));const bn=h('div',{style:{marginTop:'4px'}});bn.appendChild(mkBig(v,u,c,20));mm.appendChild(bn);rg.appendChild(mm);
      });
      rCard.appendChild(rg);
      rCard.appendChild(mkLbl('Evolución EF (sesiones Z1-Z2)'));
      const efData=eft.hist.map(e=>e.ef);
      const ech=hHTML(lineSVG(efData,C.green,null,300,60));ech.style.marginTop='8px';rCard.appendChild(ech);
      content.appendChild(rCard);
      const refCard=mkCard(null);refCard.appendChild(mkLbl('Referencia EF ciclismo'));
      const rl=h('div',{style:{marginTop:'10px',display:'flex',flexDirection:'column',gap:'8px'}});
      [['<1.30','Base aeróbica débil',C.red],['1.30–1.50','Desarrollo normal',C.amber],['1.50–1.70','Buena eficiencia',C.green],['>1.70','Excelente — élite amateur',C.cyan]].forEach(([r_,t_,c_])=>{
        const row_=h('div',{style:{display:'flex',gap:'10px',alignItems:'flex-start'}});
        row_.appendChild(mkPill(r_,c_));const tx=h('span',{style:{fontSize:'12px',color:C.t1,lineHeight:'1.4'}});tx.textContent=t_;row_.appendChild(tx);rl.appendChild(row_);
      });
      refCard.appendChild(rl);content.appendChild(refCard);
    }
  }

  tabIds.forEach((id,i)=>{
    const btn=h('button',{className:'tab'+(id===STATE.analysisTab?' active':'')});
    btn.textContent=tabLabels[i];
    btn.addEventListener('click',()=>renderTab(id));
    tabs.appendChild(btn);tabBtns.push(btn);
  });
  gap.appendChild(tabs);
  renderTab(STATE.analysisTab);
  gap.appendChild(content);
  frag.appendChild(gap);return frag;
}

// ─── ZONAS ────────────────────────────────────────────────────────
function getPZones(){
  const ftp=STATE.cfg.ftp;
  return[
    {z:'Z1',name:'Recuperación',lo:0,hi:r0(ftp*.55),col:'#6b7280'},
    {z:'Z2',name:'Resistencia',lo:r0(ftp*.56),hi:r0(ftp*.75),col:C.blue},
    {z:'Z3',name:'Tempo',lo:r0(ftp*.76),hi:r0(ftp*.90),col:C.green},
    {z:'Z4',name:'Umbral',lo:r0(ftp*.91),hi:r0(ftp*1.05),col:C.amber},
    {z:'Z5',name:'VO₂max',lo:r0(ftp*1.06),hi:r0(ftp*1.20),col:'#f97316'},
    {z:'Z6',name:'Anaeróbico',lo:r0(ftp*1.21),hi:r0(ftp*1.50),col:C.red},
    {z:'Z7',name:'Sprint',lo:r0(ftp*1.51),hi:9999,col:C.purple},
  ];
}

function renderZonas(){
  const cfg=STATE.cfg;
  const cfgHist=DB.loadCfgHistory();

  function mkHistBlock(fields){
    const relevant=cfgHist.filter(c=>fields.includes(c.field)).sort((a,b)=>b.date.localeCompare(a.date));
    if(!relevant.length)return null;
    const wrap=h('div',{style:{marginTop:'12px',paddingTop:'12px',borderTop:`1px solid ${C.border}`}});
    const lbl=h('span',{className:'lbl'});lbl.textContent='Histórico de cambios';
    wrap.appendChild(lbl);
    const list=h('div',{style:{marginTop:'8px',display:'flex',flexDirection:'column',gap:'6px'}});
    relevant.slice(0,8).forEach(c=>{
      const row_=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}});
      const left=h('span',{style:{fontSize:'11px',color:C.t2,fontFamily:'monospace'}});left.textContent=fmtD(c.date);
      const right=h('span',{style:{fontSize:'12px',fontFamily:'monospace'}});
      const fromSpan=h('span',{style:{color:C.t2}});fromSpan.textContent=`${DB.CFG_LABELS[c.field]} ${c.from}`;
      const arrow=h('span',{style:{color:C.t2}});arrow.textContent=' → ';
      const toSpan=h('span',{style:{color:C.green,fontWeight:'700'}});toSpan.textContent=`${c.to}`;
      right.appendChild(fromSpan);right.appendChild(arrow);right.appendChild(toSpan);
      row_.appendChild(left);row_.appendChild(right);
      list.appendChild(row_);
    });
    wrap.appendChild(list);
    return wrap;
  }

  const pz=getPZones();
  const hz=[
    {z:'Z1',n:'Rec. activa',lo:0,hi:r0(cfg.fcmax*.60),col:'#6b7280'},
    {z:'Z2',n:'Base aeróbica',lo:r0(cfg.fcmax*.61),hi:r0(cfg.fcmax*.70),col:C.blue},
    {z:'Z3',n:'Aeróbico',lo:r0(cfg.fcmax*.71),hi:r0(cfg.fcmax*.80),col:C.green},
    {z:'Z4',n:'Umbral',lo:r0(cfg.fcmax*.81),hi:r0(cfg.fcmax*.90),col:C.amber},
    {z:'Z5',n:'VO₂max',lo:r0(cfg.fcmax*.91),hi:cfg.fcmax,col:C.red},
  ];
  const frag=document.createDocumentFragment();
  const gap=h('div',{style:{display:'flex',flexDirection:'column',gap:'12px'}});

  // ── Distribución de tiempo por zona ──
  const distCard=mkCard(null);
  const distHead=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}});
  distHead.appendChild(mkLbl('Distribución de tiempo por zona'));
  distCard.appendChild(distHead);

  const periodTabs=h('div',{className:'tabs',style:{marginBottom:'14px'}});
  const periods=[{id:'7',l:'7 días'},{id:'28',l:'4 semanas'},{id:'all',l:'Todo'}];
  let curPeriod=STATE.zonesPeriod||'28';
  const periodBtns=[];
  const distBody=h('div');

  // Distribución ideal polarizada para 70.3 (referencia)
  const IDEAL_DIST={Z1:15,Z2:60,Z3:10,Z4:10,Z5:5};

  function getZoneMinutes(wks, discFilter){
    const filtered=discFilter?wks.filter(w=>discFilter(w.discipline)):wks;
    const byZone={Z1:0,Z2:0,Z3:0,Z4:0,Z5:0,Z6:0,Z7:0};
    filtered.forEach(w=>{
      if(w.zoneBreakdown&&Object.keys(w.zoneBreakdown).length){
        Object.entries(w.zoneBreakdown).forEach(([z,m])=>{
          if(byZone[z]!==undefined) byZone[z]+=m;
        });
      } else {
        const z=w.zone||'Z2';
        if(byZone[z]!==undefined) byZone[z]+=(w.duration||0);
      }
    });
    return byZone;
  }

  function renderDistBody(){
    distBody.innerHTML='';
    const days=curPeriod==='all'?9999:parseInt(curPeriod);
    const range=curPeriod==='all'?null:dRange(days);
    const wksInRange=range?STATE.wks.filter(w=>range.includes(w.date)):STATE.wks;

    const groups=[
      {label:'Ciclismo',icon:'🚴',filter:ic,col:DISC_C.Ciclismo},
      {label:'Carrera',icon:'🏃',filter:ir,col:DISC_C.Carrera},
      {label:'Natación',icon:'🏊',filter:isw,col:DISC_C['Natación']},
    ];

    let anyData=false;
    groups.forEach(g=>{
      const byZone=getZoneMinutes(wksInRange, g.filter);
      const total=Object.values(byZone).reduce((a,b)=>a+b,0);
      if(total===0)return;
      anyData=true;
      const block=h('div',{style:{marginBottom:'16px'}});
      const blockHead=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}});
      const blTitle=h('span',{style:{fontSize:'13px',fontWeight:'700',color:g.col}});blTitle.textContent=`${g.icon} ${g.label}`;
      const blTotal=h('span',{style:{fontSize:'11px',color:C.t2,fontFamily:'monospace'}});blTotal.textContent=`${r0(total)} min total`;
      blockHead.appendChild(blTitle);blockHead.appendChild(blTotal);
      block.appendChild(blockHead);

      ['Z1','Z2','Z3','Z4','Z5'].forEach(z=>{
        const min=byZone[z]+(z==='Z5'?byZone.Z6+byZone.Z7:0); // agrupar Z6/Z7 en Z5 para comparar con ideal
        const pct=total>0?r0((min/total)*100):0;
        const ideal=IDEAL_DIST[z];
        const zCol={'Z1':'#6b7280','Z2':C.blue,'Z3':C.green,'Z4':C.amber,'Z5':C.red}[z];
        const row_=h('div',{style:{display:'flex',flexDirection:'column',gap:'3px',marginBottom:'8px'}});
        const rowTop=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}});
        const zLbl=h('span',{style:{fontSize:'12px',color:zCol,fontFamily:'monospace',width:'24px'}});zLbl.textContent=z;
        const pctLbl=h('span',{style:{fontSize:'12px',color:C.t0,fontFamily:'monospace',fontWeight:'700'}});pctLbl.textContent=`${pct}%`;
        const idealLbl=h('span',{style:{fontSize:'10px',color:C.t2,fontFamily:'monospace'}});
        idealLbl.textContent=`ideal ~${ideal}%`;
        rowTop.appendChild(zLbl);
        const rightWrap=h('div',{style:{display:'flex',gap:'8px',alignItems:'center'}});
        rightWrap.appendChild(idealLbl);rightWrap.appendChild(pctLbl);
        rowTop.appendChild(rightWrap);
        row_.appendChild(rowTop);
        const barWrap=h('div',{style:{height:'8px',background:C.border,borderRadius:'4px',overflow:'hidden',position:'relative'}});
        const fill=h('div',{style:{width:`${Math.min(pct,100)}%`,height:'100%',background:zCol,borderRadius:'4px',transition:'width .5s ease'}});
        barWrap.appendChild(fill);
        const idealMark=h('div',{style:{position:'absolute',left:`${Math.min(ideal,100)}%`,top:'-2px',bottom:'-2px',width:'2px',background:C.t0+'88'}});
        barWrap.appendChild(idealMark);
        row_.appendChild(barWrap);
        block.appendChild(row_);
      });

      const z3pct=total>0?r0((byZone.Z3/total)*100):0;
      const z45pct=total>0?r0(((byZone.Z4+byZone.Z5+byZone.Z6+byZone.Z7)/total)*100):0;
      if(z3pct>IDEAL_DIST.Z3+10){
        block.appendChild(mkAlert('amber',`Exceso de Z3 en ${g.label.toLowerCase()}`,`${z3pct}% del tiempo en zona tempo. Para resistencia de larga distancia, mueve intensidad hacia Z2 o Z4 — Z3 es la zona que menos retorno da en pruebas de 70.3.`));
      }
      if(z45pct>IDEAL_DIST.Z4+IDEAL_DIST.Z5+10){
        block.appendChild(mkAlert('amber',`Carga alta de intensidad en ${g.label.toLowerCase()}`,`${z45pct}% del tiempo en Z4-Z5+. Vigila la recuperación si mantienes este volumen de alta intensidad.`));
      }
      distBody.appendChild(block);
    });

    if(!anyData){
      const empty=h('div',{style:{textAlign:'center',padding:'20px 0',color:C.t2,fontSize:'12px'}});
      empty.textContent='Sin entrenamientos registrados en este periodo.';
      distBody.appendChild(empty);
    }
  }

  periods.forEach(p=>{
    const btn=h('button',{className:'tab'+(p.id===curPeriod?' active':'')});
    btn.textContent=p.l;
    btn.addEventListener('click',()=>{
      curPeriod=p.id;STATE.zonesPeriod=p.id;
      periodBtns.forEach((b,i)=>{b.className='tab'+(periods[i].id===curPeriod?' active':'');});
      renderDistBody();
    });
    periodTabs.appendChild(btn);periodBtns.push(btn);
  });
  distCard.appendChild(periodTabs);
  renderDistBody();
  distCard.appendChild(distBody);

  const legend=h('div',{style:{marginTop:'10px',display:'flex',alignItems:'center',gap:'6px'}});
  const legMark=h('div',{style:{width:'2px',height:'10px',background:C.t0+'88'}});
  const legTxt=h('span',{style:{fontSize:'10px',color:C.t2}});legTxt.textContent='Marca blanca = distribución ideal polarizada para 70.3';
  legend.appendChild(legMark);legend.appendChild(legTxt);
  distCard.appendChild(legend);

  gap.appendChild(distCard);


  const pCard=mkCard(null);
  const ph=h('div',{style:{marginBottom:'14px'}});ph.appendChild(mkLbl('Zonas de potencia'));
  const pr=h('div',{style:{display:'flex',gap:'8px',marginTop:'4px',alignItems:'baseline'}});
  pr.appendChild(mkBig(cfg.ftp,'W',C.blue,28));
  const ps=h('span',{style:{fontSize:'13px',color:C.t1,fontFamily:'monospace'}});ps.textContent=`FTP · ${r1(cfg.ftp/82)} W/kg`;pr.appendChild(ps);ph.appendChild(pr);pCard.appendChild(ph);
  const plist=h('div',{style:{display:'flex',flexDirection:'column',gap:'10px'}});
  pz.forEach(z=>{
    const row_=h('div');
    const rr=h('div',{style:{display:'flex',alignItems:'center',gap:'10px',marginBottom:'4px'}});
    const dot=h('div',{style:{width:'8px',height:'8px',borderRadius:'2px',background:z.col,flexShrink:'0'}});
    const zn=h('span',{style:{fontSize:'11px',color:z.col,fontFamily:'monospace',width:'24px'}});zn.textContent=z.z;
    const nm=h('span',{style:{fontSize:'12px',color:C.t0,flex:'1'}});nm.textContent=z.name;
    const rng_=h('span',{style:{fontSize:'12px',color:z.col,fontFamily:'monospace'}});rng_.textContent=`${z.lo}–${z.z==='Z7'?'∞':z.hi}W`;
    rr.appendChild(dot);rr.appendChild(zn);rr.appendChild(nm);rr.appendChild(rng_);row_.appendChild(rr);
    row_.appendChild(mkBar(z.z==='Z7'?100:z.hi,cfg.ftp*1.6,z.col,4));
    plist.appendChild(row_);
  });
  pCard.appendChild(plist);
  const ftpHist=mkHistBlock(['ftp']);
  if(ftpHist)pCard.appendChild(ftpHist);
  gap.appendChild(pCard);

  const hCard=mkCard(null);
  const hh=h('div',{style:{marginBottom:'14px'}});hh.appendChild(mkLbl('Zonas de FC'));
  const hr_=h('div',{style:{display:'flex',gap:'8px',marginTop:'4px',alignItems:'baseline'}});
  hr_.appendChild(mkBig(cfg.fcmax,'bpm',C.red,28));
  const hs=h('span',{style:{fontSize:'13px',color:C.t1,fontFamily:'monospace'}});hs.textContent=`FCmax · reposo ${cfg.fcrest}`;hr_.appendChild(hs);hh.appendChild(hr_);hCard.appendChild(hh);
  const hlist=h('div',{style:{display:'flex',flexDirection:'column',gap:'8px'}});
  hz.forEach(z=>{
    const row_=h('div',{style:{display:'flex',alignItems:'center',gap:'10px'}});
    const dot=h('div',{style:{width:'8px',height:'8px',borderRadius:'2px',background:z.col,flexShrink:'0'}});
    const zn=h('span',{style:{fontSize:'11px',color:z.col,fontFamily:'monospace',width:'24px'}});zn.textContent=z.z;
    const nm=h('span',{style:{fontSize:'12px',color:C.t0,flex:'1'}});nm.textContent=z.n;
    const rng_=h('span',{style:{fontSize:'12px',color:z.col,fontFamily:'monospace'}});rng_.textContent=`${z.lo}–${z.hi===cfg.fcmax?`${cfg.fcmax}+`:z.hi}`;
    row_.appendChild(dot);row_.appendChild(zn);row_.appendChild(nm);row_.appendChild(rng_);hlist.appendChild(row_);
  });
  hCard.appendChild(hlist);
  const fcHist=mkHistBlock(['fcmax','fcrest']);
  if(fcHist)hCard.appendChild(fcHist);
  gap.appendChild(hCard);

  // Rangos 70.3
  const tCard=mkCard(null,{background:C.blue+'11',border:`1px solid ${C.blue}33`});
  tCard.appendChild(mkLbl('Rangos objetivo — 70.3 Valencia'));
  const tlist=h('div',{style:{marginTop:'12px',display:'flex',flexDirection:'column',gap:'10px'}});
  [['🚴','Ciclismo',`${r0(cfg.ftp*.75)}–${r0(cfg.ftp*.85)}W`,`${r0(cfg.fcmax*.75)}–${r0(cfg.fcmax*.83)} bpm`,'IF 0.75–0.85'],['🏃','Carrera','Pace Z3–Z4',`${r0(cfg.fcmax*.80)}–${r0(cfg.fcmax*.88)} bpm`,''],['🏊','Natación','Z2–Z3',`${r0(cfg.fcmax*.70)}–${r0(cfg.fcmax*.80)} bpm`,'']].forEach(([ico,d,p,hr2,n])=>{
    const box=h('div',{style:{background:C.bg0,borderRadius:'10px',padding:'10px 12px'}});
    const top=h('div',{style:{display:'flex',gap:'8px',alignItems:'center',marginBottom:'6px'}});
    const ic_=h('span',{style:{fontSize:'16px'}});ic_.textContent=ico;
    const dn=h('span',{style:{fontSize:'13px',fontWeight:'700',color:C.t0}});dn.textContent=d;
    top.appendChild(ic_);top.appendChild(dn);if(n){top.appendChild(mkPill(n,C.blue));}
    box.appendChild(top);
    const row_=h('div',{style:{display:'flex',gap:'16px'}});
    const pw=h('span',{style:{fontSize:'12px',color:C.blue,fontFamily:'monospace'}});pw.textContent=p;
    const fc=h('span',{style:{fontSize:'12px',color:C.red,fontFamily:'monospace'}});fc.textContent=hr2;
    row_.appendChild(pw);row_.appendChild(fc);box.appendChild(row_);tlist.appendChild(box);
  });
  tCard.appendChild(tlist);
  const otherHist=mkHistBlock(['targetWeight','raceDate']);
  if(otherHist)tCard.appendChild(otherHist);
  gap.appendChild(tCard);
  frag.appendChild(gap);return frag;
}

// ─── PLAN SEMANAL ─────────────────────────────────────────────────
const PLAN_DISC_OPTS=['Ciclismo','Ciclismo Indoor','Carrera','Carrera Indoor','Natación','Fuerza','Brick','Descanso','Otro'];

function renderPlan(){
  const frag=document.createDocumentFragment();
  const gap=h('div',{style:{display:'flex',flexDirection:'column',gap:'12px'}});
  let plan={...STATE.plan};
  DAY_KEYS.forEach(k=>{ if(!plan[k]) plan[k]={disc:null,note:''}; });

  // ── Entrada de texto libre ──
  const pCard=mkCard(null);
  const pInner=h('div',{style:{display:'flex',flexDirection:'column',gap:'10px'}});
  pInner.appendChild(mkLbl('✎ Escribe tu semana en texto libre'));
  const pta=h('textarea',{rows:'5',className:'inp',placeholder:'Lunes fuerza superior. Martes natación. Miércoles descanso. Jueves fuerza. Viernes ciclo indoor. Sábado bici larga. Domingo libre.'});
  pta.style.borderColor=C.blue+'44';
  pInner.appendChild(pta);
  const pResult=h('div');pInner.appendChild(pResult);

  const dayCardsWrap=h('div',{style:{display:'flex',flexDirection:'column',gap:'8px',marginTop:'4px'}});

  function renderDayCards(){
    dayCardsWrap.innerHTML='';
    DAY_KEYS.forEach((k,i)=>{
      const d=plan[k];
      const isToday=((new Date().getDay()+6)%7)===i;
      const row=h('div',{style:{background:isToday?C.blue+'14':C.bg0,border:isToday?`1px solid ${C.blue}44`:`1px solid ${C.border}`,borderRadius:10,padding:'10px 12px',display:'flex',flexDirection:'column',gap:'8px'}});
      const top=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}});
      const dn=h('span',{style:{fontSize:'13px',fontWeight:'700',color:isToday?C.blue:C.t0}});dn.textContent=DAY_NAMES[i]+(isToday?' · hoy':'');
      top.appendChild(dn);
      if(d.disc){const ic_=h('span');ic_.textContent=DISC_ICON[d.disc]||'🎯';top.appendChild(ic_);}
      row.appendChild(top);

      const selWrap=mkSel('Disciplina',d.disc||'',(v)=>{plan[k].disc=v||null;},[{v:'',l:'— Sin asignar —'},...PLAN_DISC_OPTS.map(o=>({v:o,l:o}))]);
      row.appendChild(selWrap);

      const noteWrap=h('div',{style:{display:'flex',flexDirection:'column',gap:'4px'}});
      const noteInp=h('input',{type:'text',className:'inp',value:d.note||'',placeholder:'Nota (ej: fuerza superior, bici larga 3h...)'});
      noteInp.addEventListener('input',e=>{plan[k].note=e.target.value;});
      noteWrap.appendChild(noteInp);
      row.appendChild(noteWrap);

      dayCardsWrap.appendChild(row);
    });
  }
  renderDayCards();

  const analyzeBtn=mkBtn('Analizar texto → rellenar semana',()=>{
    if(!pta.value.trim())return;
    const parsed=parsePlanText(pta.value);
    let found=0;
    DAY_KEYS.forEach(k=>{
      if(parsed[k]&&(parsed[k].disc||parsed[k].note)){
        plan[k]=parsed[k];
        found++;
      }
    });
    renderDayCards();
    pResult.innerHTML='';
    if(found){
      const pb=h('div',{className:'parse-box'});
      const pt=h('span',{style:{fontSize:'11px',color:C.purple,fontWeight:'700',fontFamily:'monospace'}});pt.textContent=`${found} días detectados — revisa y ajusta abajo`;
      pb.appendChild(pt);pResult.appendChild(pb);
    } else {
      const pb=h('div',{className:'parse-box'});
      const pt=h('span',{style:{fontSize:'11px',color:C.red,fontFamily:'monospace'}});pt.textContent='No se detectaron días. Empieza cada frase con el nombre del día (Lunes, Martes...)';
      pb.appendChild(pt);pResult.appendChild(pb);
    }
  },C.purple);
  pInner.appendChild(analyzeBtn);
  pCard.appendChild(pInner);
  gap.appendChild(pCard);

  // ── Tarjetas editables por día ──
  const cardsCard=mkCard(null);
  cardsCard.appendChild(mkLbl('Semana — revisa y ajusta'));
  const cardsInner=h('div',{style:{marginTop:'10px'}});
  cardsInner.appendChild(dayCardsWrap);
  cardsCard.appendChild(cardsInner);

  const saveBtn=mkBtn('Guardar plan semanal',()=>{
    DB.savePlan(plan);
    STATE.plan={...plan};
    saveBtn.textContent='✓ Guardado';saveBtn.style.background=`linear-gradient(135deg,${C.green},${C.green}cc)`;
    setTimeout(()=>{saveBtn.textContent='Guardar plan semanal';saveBtn.style.background=`linear-gradient(135deg,${C.blue},${C.blue}cc)`;},2000);
  },C.blue);
  cardsCard.appendChild(h('div',{style:{height:'12px'}}));
  cardsCard.appendChild(saveBtn);
  gap.appendChild(cardsCard);

  // ── Nota informativa ──
  const note=h('div',{style:{fontSize:'11px',color:C.t2,lineHeight:'1.5',padding:'0 4px'}});
  note.textContent='Este plan se repite cada semana hasta que lo cambies. El Panel principal te mostrará la sesión prevista para hoy junto con la recomendación según tu estado real (HRV, sueño, fatiga).';
  gap.appendChild(note);

  frag.appendChild(gap);
  return frag;
}


function renderNucleo(){
  const core={...STATE.athleteCore,manualCaps:{...STATE.athleteCore.manualCaps}};
  const profile=calcAthleteCoreProfile();
  const frag=document.createDocumentFragment();
  const gap=h('div',{style:{display:'flex',flexDirection:'column',gap:'12px'}});

  const summary=mkCard(null,{background:`linear-gradient(145deg,${C.blue}14,${C.purple}0c)`,border:`1px solid ${C.blue}44`});
  const top=h('div',{style:{display:'flex',justifyContent:'space-between',gap:'12px',alignItems:'center'}});
  const left=h('div');
  left.appendChild(mkLbl('Núcleo del atleta'));
  const title=h('div',{style:{fontSize:'21px',fontWeight:'900',marginTop:'4px'}});title.textContent=core.primaryPurpose||'Desarrollar un atleta completo';
  left.appendChild(title);
  const sub=h('div',{style:{fontSize:'12px',color:C.t1,lineHeight:'1.5',marginTop:'5px'}});
  sub.textContent=`${core.experience==='principiante'?'Principiante':core.experience==='avanzado'?'Avanzado':'Intermedio'} · ${core.weeklyHours||'—'} h disponibles/sem · ${core.availableDays||'—'} días`;
  left.appendChild(sub);
  const badge=mkPill(profile.recoveryBase>=70?'Base sólida':profile.recoveryBase>=50?'En desarrollo':'Revisar base',profile.recoveryBase>=70?C.green:profile.recoveryBase>=50?C.amber:C.red);
  top.appendChild(left);top.appendChild(badge);summary.appendChild(top);

  const insights=h('div',{className:'grid2',style:{marginTop:'14px'}});
  [
    ['Fortaleza actual',CAP_LABELS[profile.strongest[0]]||'—',C.green],
    ['Mayor margen',CAP_LABELS[profile.weakest[0]]||'—',C.amber],
    ['Volumen medio',`${profile.avgWeeklyHours} h/sem`,C.blue],
    ['Ajuste disponibilidad',profile.loadFit===null?'—':`${profile.loadFit}%`,profile.loadFit!==null&&profile.loadFit>115?C.red:C.cyan]
  ].forEach(([l,v,col])=>{
    const box=h('div',{className:'metric-mini'});
    box.appendChild(mkLbl(l));
    const val=h('div',{style:{fontSize:'14px',fontWeight:'800',color:col,marginTop:'5px'}});val.textContent=v;box.appendChild(val);
    insights.appendChild(box);
  });
  summary.appendChild(insights);
  gap.appendChild(summary);

  const capCard=mkCard(null);
  capCard.appendChild(mkLbl('Mapa de capacidades'));
  const capList=h('div',{style:{display:'flex',flexDirection:'column',gap:'11px',marginTop:'12px'}});
  Object.entries(profile.caps).forEach(([k,v])=>{
    const row=h('div',{style:{display:'flex',flexDirection:'column',gap:'5px'}});
    const rt=h('div',{style:{display:'flex',justifyContent:'space-between'}});
    const l=h('span',{style:{fontSize:'12px',color:C.t1}});l.textContent=CAP_LABELS[k];
    const val=h('span',{style:{fontSize:'12px',fontWeight:'800',fontFamily:'monospace',color:v>=70?C.green:v>=50?C.amber:C.red}});val.textContent=`${v}/100`;
    rt.appendChild(l);rt.appendChild(val);row.appendChild(rt);row.appendChild(mkBar(v,100,v>=70?C.green:v>=50?C.amber:C.red,6));capList.appendChild(row);
  });
  capCard.appendChild(capList);
  const capNote=h('div',{style:{fontSize:'10px',color:C.t2,lineHeight:'1.5',marginTop:'12px'}});
  capNote.textContent='Cada capacidad combina tu autoevaluación (35%) con evidencias del historial reciente (65%). No es una prueba clínica ni un test máximo.';
  capCard.appendChild(capNote);
  gap.appendChild(capCard);

  const identity=mkCard(null);
  identity.appendChild(mkLbl('Identidad y contexto'));
  const formWrap=h('div',{style:{display:'flex',flexDirection:'column',gap:'12px',marginTop:'12px'}});
  const g1=h('div',{className:'grid2'});
  const birth=mkInp('Fecha de nacimiento','date',core.birthDate,v=>core.birthDate=v);
  const height=mkInp('Altura (cm)','number',core.height,v=>core.height=+v||'');
  const usualWeight=mkInp('Peso habitual (kg)','number',core.usualWeight,v=>core.usualWeight=+v||'');
  const exp=mkSel('Experiencia',core.experience,v=>core.experience=v,[{v:'principiante',l:'Principiante'},{v:'intermedio',l:'Intermedio'},{v:'avanzado',l:'Avanzado'}]);
  [birth,height,usualWeight,exp].forEach(x=>g1.appendChild(x));
  formWrap.appendChild(g1);

  const g2=h('div',{className:'grid2'});
  const hours=mkInp('Horas disponibles/sem','number',core.weeklyHours,v=>core.weeklyHours=+v||0);
  const days=mkInp('Días disponibles/sem','number',core.availableDays,v=>core.availableDays=+v||0);
  g2.appendChild(hours);g2.appendChild(days);formWrap.appendChild(g2);

  function textAreaField(label,value,onChange,placeholder){
    const wrap=h('div',{style:{display:'flex',flexDirection:'column',gap:'5px'}});
    wrap.appendChild(mkLbl(label));
    const ta=h('textarea',{className:'inp',rows:'2',placeholder:placeholder||''});
    ta.value=value||'';ta.addEventListener('input',e=>onChange(e.target.value));wrap.appendChild(ta);return wrap;
  }
  formWrap.appendChild(textAreaField('Propósito principal',core.primaryPurpose,v=>core.primaryPurpose=v));
  formWrap.appendChild(textAreaField('Objetivos secundarios',core.secondaryGoals,v=>core.secondaryGoals=v,'Ej: mejorar fuerza relativa, nadar mejor, mantener peso...'));
  formWrap.appendChild(textAreaField('Material y recursos',core.equipment,v=>core.equipment=v));
  formWrap.appendChild(textAreaField('Lesiones o antecedentes relevantes',core.injuries,v=>core.injuries=v));
  formWrap.appendChild(textAreaField('Limitaciones actuales',core.limitations,v=>core.limitations=v));
  formWrap.appendChild(textAreaField('Preferencias de entrenamiento',core.preferences,v=>core.preferences=v));
  formWrap.appendChild(textAreaField('Fortalezas percibidas',core.strengths,v=>core.strengths=v));
  formWrap.appendChild(textAreaField('Debilidades percibidas',core.weaknesses,v=>core.weaknesses=v));
  identity.appendChild(formWrap);gap.appendChild(identity);

  const selfCard=mkCard(null);
  selfCard.appendChild(mkLbl('Autoevaluación de capacidades'));
  const sliders=h('div',{style:{display:'flex',flexDirection:'column',gap:'14px',marginTop:'12px'}});
  Object.keys(core.manualCaps).forEach(k=>{
    sliders.appendChild(mkSld(CAP_LABELS[k],core.manualCaps[k],0,100,v=>core.manualCaps[k]=v,
      k==='strength'?C.purple:k==='mobility'?C.cyan:k==='core'?C.amber:k==='endurance'?C.blue:k==='power'?C.red:C.green));
  });
  selfCard.appendChild(sliders);gap.appendChild(selfCard);

  const save=mkBtn('Guardar núcleo del atleta',()=>{
    DB.saveAthleteCore(core);
    STATE.athleteCore=DB.loadAthleteCore();
    save.textContent='✓ Núcleo actualizado';
    save.style.background=`linear-gradient(135deg,${C.green},${C.green}cc)`;
    setTimeout(()=>renderApp(),900);
  },C.blue);
  gap.appendChild(save);

  frag.appendChild(gap);
  return frag;
}

function renderConfig(){
  const form={...STATE.cfg};
  const frag=document.createDocumentFragment();
  const gap=h('div',{style:{display:'flex',flexDirection:'column',gap:'14px'}});

  const pCard=mkCard(null);pCard.appendChild(mkLbl('Perfil del atleta'));
  const pg=h('div',{className:'grid2',style:{marginTop:'12px'}});
  const ftpInp=mkInp('FTP actual (W)','number',form.ftp,v=>form.ftp=+v);
  const fcmInp=mkInp('FC máxima (bpm)','number',form.fcmax,v=>form.fcmax=+v);
  const fcrInp=mkInp('FC reposo (bpm)','number',form.fcrest,v=>form.fcrest=+v);
  const twInp=mkInp('Peso objetivo (kg)','number',form.targetWeight,v=>form.targetWeight=+v);
  [ftpInp,fcmInp,fcrInp,twInp].forEach(i=>pg.appendChild(i));
  pCard.appendChild(pg);gap.appendChild(pCard);

  const rCard=mkCard(null);rCard.appendChild(mkLbl('Carrera objetivo'));
  const ri=h('div',{style:{marginTop:'12px',display:'flex',flexDirection:'column',gap:'10px'}});
  const rnInp=mkInp('Nombre','text',form.raceName,v=>form.raceName=v);
  const rdInp=mkInp('Fecha de carrera','date',form.raceDate,v=>form.raceDate=v);
  const dBox=h('div',{style:{background:C.bg0,borderRadius:'8px',padding:'10px 12px'}});
  dBox.appendChild(mkLbl('Días hasta carrera'));
  const days=dUntil(form.raceDate);
  dBox.appendChild(mkBig(days>0?days:'—','días',days<60?C.amber:C.blue,28));
  [rnInp,rdInp,dBox].forEach(i=>ri.appendChild(i));
  rCard.appendChild(ri);gap.appendChild(rCard);

  // Data status
  const dsCard=mkCard(null);dsCard.appendChild(mkLbl('Estado de los datos'));
  const dlist=h('div',{style:{marginTop:'10px',display:'flex',flexDirection:'column'}});
  [
    ['Registros base (Excel)',`${LOGS0.length} días (Apr–Jun 2026)`],
    ['Entrenamientos base (Excel)',`${WK0.length} sesiones`],
    ['Tus registros diarios',`${DB.countUserLogs()} días guardados`],
    ['Tus entrenamientos',`${DB.countUserWks()} sesiones guardadas`],
    ['FTP','335 W (Excel)'],
    ['FCmax','187 bpm'],
  ].forEach(([l,v])=>{
    const row_=h('div',{style:{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${C.border}`}});
    const ll=h('span',{style:{fontSize:'12px',color:C.t1}});ll.textContent=l;
    const vv=h('span',{style:{fontSize:'12px',color:C.t0,fontFamily:'monospace'}});vv.textContent=v;
    row_.appendChild(ll);row_.appendChild(vv);dlist.appendChild(row_);
  });
  dsCard.appendChild(dlist);gap.appendChild(dsCard);

  // ── Backup: Exportar / Importar JSON ──
  const bkCard=mkCard(null,{background:C.blue+'14',border:`1px solid ${C.blue}44`});
  bkCard.appendChild(mkLbl('📦 Copia de seguridad'));
  const bkTxt=h('div',{style:{fontSize:'12px',color:C.t1,marginTop:'8px',marginBottom:'12px',lineHeight:'1.5'}});
  bkTxt.textContent='Tus registros se guardan en este navegador. Exporta regularmente para tener una copia fuera del dispositivo.';
  bkCard.appendChild(bkTxt);

  const bkRow=h('div',{style:{display:'flex',gap:'8px'}});
  const exportBtn=mkBtn('⬇ Exportar datos',async()=>{
    const backup={
      format:'IronCoach backup',
      version:3,
      exportDate:new Date().toISOString(),
      userLogs:JSON.parse(localStorage.getItem(DB.KEY_LOGS)||'[]'),
      userWks:JSON.parse(localStorage.getItem(DB.KEY_WKS)||'[]'),
      cfg:STATE.cfg,
      plan:DB.loadPlan(),
      cfgHistory:DB.loadCfgHistory(),
      dailyStatus:DB.loadDailyStatus(),
      athleteCore:DB.loadAthleteCore()
    };
    const text=JSON.stringify(backup,null,2);
    const filename='ironcoach_backup_'+today()+'.json';
    try{
      const file=new File([text],filename,{type:'application/json'});
      if(navigator.canShare && navigator.canShare({files:[file]})){
        await navigator.share({files:[file],title:'Copia IronCoach'});
        exportBtn.textContent='✓ Compartido';
        setTimeout(()=>{exportBtn.textContent='⬇ Exportar datos';},2000);
        return;
      }
    }catch(err){
      if(err && err.name==='AbortError')return;
    }
    try{
      const blob=new Blob([text],{type:'application/json'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;a.download=filename;
      document.body.appendChild(a);a.click();document.body.removeChild(a);
      setTimeout(()=>URL.revokeObjectURL(url),1500);
      exportBtn.textContent='✓ Descargado';
      setTimeout(()=>{exportBtn.textContent='⬇ Exportar datos';},2000);
      return;
    }catch(err){}
    try{
      await navigator.clipboard.writeText(text);
      alert('La copia se ha copiado al portapapeles.');
      exportBtn.textContent='✓ Copiado';
      setTimeout(()=>{exportBtn.textContent='⬇ Exportar datos';},2000);
      return;
    }catch(err){}
    const dlg=document.createElement('dialog');
    dlg.style.cssText='width:min(700px,94vw);max-height:85vh;background:#1f2330;color:#fff;border:1px solid #323748;border-radius:14px;padding:16px';
    const ta=document.createElement('textarea');
    ta.value=text;ta.readOnly=true;
    ta.style.cssText='width:100%;height:55vh;background:#15171f;color:#fff;border:1px solid #323748;border-radius:8px;padding:10px;font-family:monospace;font-size:11px';
    const close=document.createElement('button');
    close.textContent='Cerrar';close.className='btn btn-sec';close.style.marginTop='10px';
    close.onclick=()=>dlg.close();
    dlg.appendChild(ta);dlg.appendChild(close);document.body.appendChild(dlg);dlg.showModal();
  },C.blue);
  exportBtn.style.flex='1';
  bkRow.appendChild(exportBtn);

  const importInput=h('input',{type:'file',accept:'.json',style:{display:'none'}});
  const importBtn=mkBtn('⬆ Importar datos',()=>{importInput.click();},null,true);
  importBtn.style.flex='1';
  importInput.addEventListener('change',e=>{
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{
      try{
        const data=JSON.parse(ev.target.result);
        if(!data.userLogs||!data.userWks){alert('Archivo no válido.');return;}
        if(!confirm(`Importar ${data.userLogs.length} registros diarios y ${data.userWks.length} entrenamientos?\n\nEsto SUMA a tus datos actuales (no los borra).`))return;
        // Merge: import overrides by date/id, but never touches base Excel data
        const curLogs=JSON.parse(localStorage.getItem(DB.KEY_LOGS)||'[]');
        const curWks=JSON.parse(localStorage.getItem(DB.KEY_WKS)||'[]');
        const logMap={};curLogs.forEach(l=>logMap[l.date]=l);data.userLogs.forEach(l=>logMap[l.date]=l);
        const wkMap={};curWks.forEach(w=>wkMap[w.id]=w);data.userWks.forEach(w=>wkMap[w.id]=w);
        localStorage.setItem(DB.KEY_LOGS,JSON.stringify(Object.values(logMap)));
        localStorage.setItem(DB.KEY_WKS,JSON.stringify(Object.values(wkMap)));
        if(data.cfg)DB.saveCfg(data.cfg);
        if(data.plan)DB.savePlan(data.plan);
        if(Array.isArray(data.cfgHistory))localStorage.setItem(DB.KEY_CFG_HIST,JSON.stringify(data.cfgHistory));
        if(Array.isArray(data.dailyStatus))localStorage.setItem(DB.KEY_DAILY_STATUS,JSON.stringify(data.dailyStatus));
        if(data.athleteCore)DB.saveAthleteCore(data.athleteCore);
        reloadData();renderApp();
        alert('Importación completada.');
      }catch(err){alert('Error al leer el archivo: '+err.message);}
    };
    reader.readAsText(file);
  });
  bkRow.appendChild(importBtn);
  bkCard.appendChild(bkRow);
  bkCard.appendChild(importInput);
  gap.appendChild(bkCard);

  const saveBtn=mkBtn('Guardar configuración',()=>{
    // Read current input values before saving
    const f2={
      ftp:+(ftpInp.querySelector('input')?.value||form.ftp),
      fcmax:+(fcmInp.querySelector('input')?.value||form.fcmax),
      fcrest:+(fcrInp.querySelector('input')?.value||form.fcrest),
      targetWeight:+(twInp.querySelector('input')?.value||form.targetWeight),
      raceName:rnInp.querySelector('input')?.value||form.raceName,
      raceDate:rdInp.querySelector('input')?.value||form.raceDate,
    };
    DB.saveCfg(f2);STATE.cfg={...f2};reloadData();
    saveBtn.textContent='✓ Guardado';saveBtn.style.background=`linear-gradient(135deg,${C.green},${C.green}cc)`;
    setTimeout(()=>{saveBtn.textContent='Guardar configuración';saveBtn.style.background=`linear-gradient(135deg,${C.blue},${C.blue}cc)`;},2000);
  },C.blue);
  gap.appendChild(saveBtn);

  const resetBtn=mkBtn('⚠️ Resetear entradas de usuario (conserva Excel)',()=>{
    if(confirm('¿Resetear tus entradas? Los datos del Excel se conservan siempre.')){
      DB.resetUser();reloadData();renderApp();
    }
  },null,true);
  gap.appendChild(resetBtn);

  frag.appendChild(gap);return frag;
}

// ═══ MAIN RENDER ══════════════════════════════════════════════════
const NAV_ITEMS=[
  {id:'panel',icon:'◉',lbl:'Panel'},
  {id:'plan',icon:'📅',lbl:'Plan'},
  {id:'diario',icon:'⊕',lbl:'Diario'},
  {id:'entreno',icon:'⚡',lbl:'Entreno'},
  {id:'progreso',icon:'🎯',lbl:'Objetivo'},
  {id:'analisis',icon:'∿',lbl:'Análisis'},
  {id:'zonas',icon:'◎',lbl:'Zonas'},
  {id:'nucleo',icon:'◈',lbl:'Núcleo'},
];

function renderApp(){
  const app=document.getElementById('app');
  app.innerHTML='';

  const comp=getComputed();
  const{pmc,tl,hrv,wt,rs,iri,ftpE,rec}=comp;
  const days=dUntil(STATE.cfg.raceDate);

  // Header
  const header=h('div',{className:'header'});
  const hLeft=h('div');
  const logoRow=h('div',{style:{display:'flex',alignItems:'center',gap:'8px'}});
  const mark=h('div',{style:{width:'32px',height:'32px',borderRadius:'10px',background:C.bg0,border:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'center'}});
  mark.innerHTML=`<svg viewBox="0 0 100 100" width="25" height="25"><circle cx="50" cy="50" r="39" fill="none" stroke="${C.blue}" stroke-width="8"/><path d="M20 55h17l8-23 11 39 8-17h16" fill="none" stroke="${C.green}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const word=h('div',{style:{display:'flex',alignItems:'baseline'}});
  const l1=h('span',{style:{fontSize:'22px',fontWeight:'900',color:C.t0,letterSpacing:'.04em',lineHeight:'1'}});l1.textContent='IRON';
  const l2=h('span',{style:{fontSize:'22px',fontWeight:'900',color:C.blue,letterSpacing:'.04em',lineHeight:'1'}});l2.textContent='COACH';
  word.appendChild(l1);word.appendChild(l2);logoRow.appendChild(mark);logoRow.appendChild(word);
  const sub=h('div',{style:{fontSize:'10px',color:C.t2,fontFamily:'monospace',marginTop:'2px'}});sub.textContent=STATE.cfg.raceName?`Atleta completo · ${STATE.cfg.raceName}`:'Desarrollar un atleta completo';
  hLeft.appendChild(logoRow);hLeft.appendChild(sub);

  const hRight=h('div',{style:{display:'flex',flexDirection:'column',gap:'4px',alignItems:'flex-end'}});
  const dtRow=h('div',{style:{display:'flex',gap:'8px',alignItems:'center'}});
  const dt=h('div',{style:{fontSize:'10px',color:C.t2,fontFamily:'monospace'}});dt.textContent=today();
  const cfgBtn=h('button',{style:{background:'none',border:'none',cursor:'pointer',padding:'0',display:'flex',color:STATE.page==='cfg'?C.blue:C.t2,fontSize:'14px'}});
  cfgBtn.textContent='⚙';
  cfgBtn.addEventListener('click',()=>{STATE.page='cfg';renderApp();});
  dtRow.appendChild(dt);dtRow.appendChild(cfgBtn);
  const pills=h('div',{style:{display:'flex',gap:'5px'}});
  const rsCol=rs>=70?C.green:rs>=50?C.amber:rs!==null?C.red:C.t2;
  const athleteHead=calcCompleteAthleteIndex();
  const iacCol=athleteHead.total>=70?C.green:athleteHead.total>=50?C.amber:C.red;
  pills.appendChild(mkPill(`RS ${rs??'—'}`,rsCol));
  pills.appendChild(mkPill(`IAC ${athleteHead.total}`,iacCol));
  hRight.appendChild(dtRow);hRight.appendChild(pills);
  header.appendChild(hLeft);header.appendChild(hRight);
  app.appendChild(header);

  // Content
  const content=h('div',{className:'content',id:'main-content'});
  app.appendChild(content);

  // Nav
  const nav=h('div',{className:'nav'});
  NAV_ITEMS.forEach(n=>{
    const btn=h('button',{className:'navbtn'+(STATE.page===n.id?' active':'')});
    if(STATE.page===n.id){const dot=h('div',{className:'dot'});btn.appendChild(dot);}
    const ico=h('span',{style:{fontSize:'17px',opacity:STATE.page===n.id?'1':'0.3',transition:'opacity .2s'}});ico.textContent=n.icon;
    const lbl=h('span');lbl.textContent=n.lbl;
    btn.appendChild(ico);btn.appendChild(lbl);
    btn.addEventListener('click',()=>{STATE.page=n.id;renderApp();});
    nav.appendChild(btn);
  });
  app.appendChild(nav);

  // Page content
  let pageContent;
  if(STATE.page==='panel')pageContent=renderPanel(comp);
  else if(STATE.page==='plan')pageContent=renderPlan();
  else if(STATE.page==='diario')pageContent=renderDiario();
  else if(STATE.page==='entreno')pageContent=renderEntreno();
  else if(STATE.page==='progreso')pageContent=renderProgreso(comp);
  else if(STATE.page==='analisis')pageContent=renderAnalisis(comp);
  else if(STATE.page==='zonas')pageContent=renderZonas();
  else if(STATE.page==='nucleo')pageContent=renderNucleo();
  else if(STATE.page==='cfg')pageContent=renderConfig();
  if(pageContent)content.appendChild(pageContent);
  content.scrollTop=0;
}

// ═══ BOOT ════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  renderApp();
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  }
});
