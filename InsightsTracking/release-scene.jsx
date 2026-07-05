const { Stage, Sprite, useTime, useSprite, Easing, interpolate, animate, clamp } = window;

const FONT = "'Segoe UI','Segoe UI Variable', system-ui, -apple-system, sans-serif";

// ── helpers ──────────────────────────────────────────────────────────────
function useFade(entry = 0.4, exit = 0.4) {
  const { localTime, duration } = useSprite();
  let o = 1;
  if (localTime < entry) o = Easing.easeOutCubic(clamp(localTime / entry, 0, 1));
  else if (localTime > duration - exit) o = 1 - Easing.easeInCubic(clamp((localTime - (duration - exit)) / exit, 0, 1));
  return o;
}
const up = (lt, start, dur = 0.5, dist = 26) => {
  const t = Easing.easeOutCubic(clamp((lt - start) / dur, 0, 1));
  return { opacity: t, transform: `translateY(${(1 - t) * dist}px)` };
};
const Sparkle = ({ s = 20, c = '#8661C5' }) => (
  <svg viewBox="0 0 24 24" width={s} height={s} style={{ display: 'block' }}>
    <path d="M12 2 L13.8 8.2 L20 10 L13.8 11.8 L12 18 L10.2 11.8 L4 10 L10.2 8.2 Z" fill={c} />
  </svg>
);
// neutral product mark (analytics glyph) - no Microsoft logo
const AppMark = ({ s = 40, pulse = 1 }) => (
  <div style={{ width: s, height: s, borderRadius: s * 0.28, background: 'linear-gradient(135deg,#0F6CBD,#8661C5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: s * 0.1, padding: s * 0.26, boxSizing: 'border-box', transform: `scale(${pulse})` }}>
    <span style={{ width: s * 0.1, height: s * 0.24, background: '#fff', borderRadius: 2 }} />
    <span style={{ width: s * 0.1, height: s * 0.42, background: '#fff', borderRadius: 2 }} />
    <span style={{ width: s * 0.1, height: s * 0.6, background: '#fff', borderRadius: 2 }} />
  </div>
);

// RHYTHM (120 BPM breathing bloom - soundtrack anchor)
function Rhythm() {
  const time = useTime();
  const bar = (0.5 + 0.5 * Math.cos((2 * Math.PI * time) / 2)); // downbeat every 2s
  const beat = Math.pow(1 - ((time % 0.5) / 0.5), 4);           // subtle tick each beat
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
      background: `radial-gradient(70% 60% at 50% 48%, rgba(120,170,255,${0.05 * bar + 0.02 * beat}), transparent 70%)` }} />
  );
}

// ── VOICEOVER CAPTIONS ─────────────────────────────────────────────────────
const CAPTIONS = [
  { s: 0.6, e: 3.0, t: 'Customer feedback was shaping our roadmap,' },
  { s: 3.3, e: 5.1, t: 'but it kept getting lost.' },
  { s: 5.6, e: 8.9, t: 'So we built one connected workflow, inside the CRM.' },
  { s: 9.3, e: 11.7, t: 'Now every insight lives in one place,' },
  { s: 11.9, e: 14.6, t: 'a single source of truth for customer feedback.' },
  { s: 15.2, e: 18.0, t: 'Five AI skills automate the entire lifecycle.' },
  { s: 18.3, e: 20.6, t: 'Capture feedback. Categorize it.' },
  { s: 20.8, e: 22.9, t: 'Prioritize what matters most.' },
  { s: 23.1, e: 25.2, t: 'Hand off to product teams, automatically.' },
  { s: 25.9, e: 29.2, t: 'So leaders can see how much insight reaches the roadmap.' },
  { s: 29.4, e: 31.8, t: 'Accepted insights, tracked as an OKR.' },
  { s: 32.3, e: 34.8, t: 'AI-Powered Customer Insights Management.' },
];
function Captions() {
  const time = useTime();
  const c = CAPTIONS.find(c => time >= c.s && time <= c.e);
  if (!c) return null;
  const fin = clamp((time - c.s) / 0.22, 0, 1);
  const fout = clamp((c.e - time) / 0.22, 0, 1);
  const op = Math.min(fin, fout);
  return (
    <div style={{ position: 'absolute', left: '50%', bottom: 70, transform: `translateX(-50%) translateY(${(1 - fin) * 8}px)`, opacity: op,
      maxWidth: 1300, background: 'rgba(11,18,32,0.74)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '15px 34px', color: '#F5F8FC', fontFamily: FONT, fontSize: 33, fontWeight: 600, letterSpacing: '-0.01em', textAlign: 'center', whiteSpace: 'nowrap' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#2899F5', boxShadow: '0 0 10px #2899F5' }} />
        {c.t}
      </span>
    </div>
  );
}

// SOUNDTRACK (Web Audio - synthesized 120 BPM bed, audible on playback)
function Soundtrack() {
  const { time, playing } = useTimeline();
  const S = React.useRef({}).current;
  S.t = time; // keep latest playhead for the scheduler

  React.useEffect(() => {
    const ensure = () => { if (S.ctx && S.ctx.state === 'suspended') S.ctx.resume(); };
    window.addEventListener('pointerdown', ensure);
    window.addEventListener('keydown', ensure);
    return () => { window.removeEventListener('pointerdown', ensure); window.removeEventListener('keydown', ensure); };
  }, []);

  React.useEffect(() => {
    if (playing) {
      if (!S.ctx) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        S.ctx = ctx;
        const master = ctx.createGain(); master.gain.value = 0.0001; master.connect(ctx.destination);
        S.master = master;
        // noise buffer for hats
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
        const ch = buf.getChannelData(0);
        for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
        S.noise = buf;
        // ambient pad: 3 detuned sines -> lowpass -> tremolo gain -> master
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.6;
        const padGain = ctx.createGain(); padGain.gain.value = 0.05;
        lp.connect(padGain); padGain.connect(master);
        S.pad = [174.61, 261.63, 349.23].map((f) => { // F3 · C4 · F4
          const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(lp); o.start(); return o;
        });
        const lfo = ctx.createOscillator(); const lfoG = ctx.createGain();
        lfo.frequency.value = 0.33; lfoG.gain.value = 0.02; lfo.connect(lfoG); lfoG.connect(padGain.gain); lfo.start();
        S.padFilter = lp;
        S.beat = 0; S.nextBeatTime = 0; S.songStart = 0;
      }
      const ctx = S.ctx;
      ctx.resume();
      S.master.gain.cancelScheduledValues(ctx.currentTime);
      S.master.gain.setTargetAtTime(0.42, ctx.currentTime, 0.25);
      // seed transport so audio beats line up with the visual 120 BPM grid
      const startBeat = Math.ceil(S.t / 0.5);
      S.songStart = ctx.currentTime - S.t;
      S.beat = startBeat;
      S.nextBeatTime = S.songStart + startBeat * 0.5;

      const kick = (t, g) => {
        const o = ctx.createOscillator(), gn = ctx.createGain();
        o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
        gn.gain.setValueAtTime(g, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        o.connect(gn); gn.connect(S.master); o.start(t); o.stop(t + 0.22);
      };
      const hat = (t, g) => {
        const s = ctx.createBufferSource(); s.buffer = S.noise;
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7500;
        const gn = ctx.createGain(); gn.gain.setValueAtTime(g, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        s.connect(hp); hp.connect(gn); gn.connect(S.master); s.start(t); s.stop(t + 0.07);
      };
      const blip = (t, freq, g) => { // soft melodic accent on scene downbeats
        const o = ctx.createOscillator(), gn = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = freq;
        gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(g, t + 0.02); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        o.connect(gn); gn.connect(S.master); o.start(t); o.stop(t + 0.55);
      };

      S.timer = setInterval(() => {
        const now = ctx.currentTime;
        const songNow = now - S.songStart;
        if (Math.abs(songNow - S.t) > 0.3) { // re-sync after a seek / loop
          S.songStart = now - S.t;
          S.beat = Math.ceil(S.t / 0.5);
          S.nextBeatTime = S.songStart + S.beat * 0.5;
        }
        while (S.nextBeatTime < now + 0.12) {
          const t = S.nextBeatTime, b = S.beat, songT = b * 0.5;
          const down = b % 4 === 0;
          kick(t, down ? 0.62 : 0.42);
          hat(t + 0.25, 0.05);            // offbeat hat
          hat(t, down ? 0.06 : 0.03);
          if (down) blip(t, 523.25, 0.08); // C5 tick each bar
          // pad shifts brighter as the story turns toward the solution
          if (S.padFilter) S.padFilter.frequency.setTargetAtTime(songT > 5 ? 1500 : 900, t, 0.4);
          S.beat++; S.nextBeatTime += 0.5;
        }
      }, 25);
    } else if (S.ctx) {
      S.master.gain.cancelScheduledValues(S.ctx.currentTime);
      S.master.gain.setTargetAtTime(0.0001, S.ctx.currentTime, 0.2);
      clearInterval(S.timer);
    }
    return () => { clearInterval(S.timer); };
  }, [playing]);

  React.useEffect(() => () => { try { clearInterval(S.timer); S.ctx && S.ctx.close(); } catch (e) {} }, []);
  return null;
}

// ── VOICEOVER (Web Speech - actual spoken narration synced to captions) ────
function Voiceover() {
  const { time, playing } = useTimeline();
  const S = React.useRef({ spoken: {}, lastT: 0, voice: null }).current;
  S.time = time; S.playing = playing;

  React.useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const pickVoice = () => {
      const vs = synth.getVoices();
      if (!vs.length) return null;
      // warmest natural voices first (cross-browser), then warm system fallbacks
      const pref = ['Google US English', 'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Michelle',
        'Nicky', 'Samantha', 'Sandy', 'Flo', 'Reed', 'Kathy', 'Karen', 'Moira', 'Serena', 'Ava', 'Allison'];
      for (const name of pref) {
        const v = vs.find(x => x.name === name) || vs.find(x => x.name.includes(name));
        if (v) return v;
      }
      const nat = vs.find(v => /^en/i.test(v.lang) && /Premium|Enhanced|Neural|Natural/i.test(v.name));
      if (nat) return nat;
      const bad = /Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Fred|Good News|Jester|Junior|Organ|Ralph|Superstar|Trinoids|Whisper|Wobble|Zarvox|Grandma|Grandpa|Eddy|Rocko|Shelley/i;
      return vs.find(v => /en[-_]?US/i.test(v.lang) && !bad.test(v.name)) || vs.find(v => /^en/i.test(v.lang)) || vs[0];
    };
    S.voice = pickVoice();
    synth.onvoiceschanged = () => { S.voice = pickVoice(); };
    let raf;
    const tick = () => {
      const t = S.time;
      if (t + 0.06 < S.lastT) { S.spoken = {}; synth.cancel(); } // loop / rewind resets
      S.lastT = t;
      if (S.playing) {
        for (let i = 0; i < CAPTIONS.length; i++) {
          const c = CAPTIONS[i];
          if (!S.spoken[i] && t >= c.s && t < c.e) {
            S.spoken[i] = true;
            const u = new SpeechSynthesisUtterance(c.t.replace(/\u2026/g, ',').replace(/[-–]\s*$/, ''));
            u.rate = 0.9; u.pitch = 1.08; u.volume = 1.0;
            if (S.voice) { u.voice = S.voice; u.lang = S.voice.lang; }
            synth.speak(u); // queue, never cancel a line mid-word
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); synth.cancel(); synth.onvoiceschanged = null; };
  }, []);

  React.useEffect(() => {
    const synth = window.speechSynthesis;
    if (synth && !playing) synth.cancel(); // silence immediately on pause
  }, [playing]);

  return null;
}

// ── window chrome helper ───────────────────────────────────────────────────
function WinBar({ title, badge, right }) {
  return (
    <div style={{ height: 62, display: 'flex', alignItems: 'center', gap: 14, padding: '0 24px', background: '#FAFBFD', borderBottom: '1px solid #EEF2F7' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#E1E4EA' }} />
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#E1E4EA' }} />
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#E1E4EA' }} />
      </div>
      <AppMark s={28} />
      <span style={{ fontSize: 21, fontWeight: 700, color: '#0B1220' }}>{title}</span>
      {badge && <span style={{ fontSize: 13, fontWeight: 700, color: '#0F6CBD', background: '#EFF6FC', padding: '4px 10px', borderRadius: 6 }}>{badge}</span>}
      <div style={{ flex: 1 }} />
      {right}
    </div>
  );
}

// ── SCENE 1 · THE PROBLEM (bigger scattered tools) ─────────────────────────
function Problem() {
  const { localTime: lt, duration } = useSprite();
  const op = useFade(0.4, 0.5);
  const push = 1 + 0.05 * Easing.easeOutQuad(clamp(lt / duration, 0, 1));
  const chips = [
    { label: 'Spreadsheets', sub: 'v7_final.xlsx', x: 170, y: 250, drift: [-26, -14], rot: -5 },
    { label: 'SharePoint trackers', sub: '/sites/feedback', x: 1300, y: 210, drift: [30, -10], rot: 4 },
    { label: 'Teams threads', sub: '#product-feedback', x: 1330, y: 720, drift: [34, 20], rot: -4 },
    { label: 'Email', sub: 'RE: customer ask', x: 210, y: 790, drift: [-28, 22], rot: 6 },
  ];
  const dr = Easing.easeInOutSine(clamp(lt / duration, 0, 1));
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 100% at 50% 40%, #131E33 0%, #0B1220 70%)', opacity: op, fontFamily: FONT, overflow: 'hidden', transform: `scale(${push})` }}>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <g stroke="#5A3A45" strokeWidth="2.5" strokeDasharray="12 14" fill="none" opacity={0.45 + 0.3 * Math.sin(lt * 4)}>
          <path d="M330 330 L820 520" /><path d="M1360 320 L1050 520" />
          <path d="M1360 740 L1030 590" /><path d="M360 800 L840 600" />
        </g>
      </svg>
      {chips.map((c, i) => {
        const d = up(lt, 0.15 + i * 0.12, 0.5);
        return (
          <div key={i} style={{ position: 'absolute', left: c.x, top: c.y, opacity: d.opacity,
            transform: `translate(${c.drift[0] * dr}px, ${c.drift[1] * dr}px) rotate(${c.rot}deg)`,
            background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(231,76,60,0.42)', borderRadius: 16,
            padding: '22px 32px', color: '#E7ECF4', boxShadow: '0 16px 50px rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
            <span style={{ fontSize: 15, letterSpacing: '.12em', display: 'block', marginBottom: 8, color: '#E74C3C', fontWeight: 700 }}>DISCONNECTED</span>
            <span style={{ fontSize: 34, fontWeight: 700, display: 'block' }}>{c.label}</span>
            <span style={{ fontSize: 17, color: '#8A96A8', display: 'block', marginTop: 4 }}>{c.sub}</span>
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: 130, top: 452, ...up(lt, 0.5, 0.7) }}>
        <div style={{ color: '#E74C3C', fontSize: 21, fontWeight: 700, letterSpacing: '.22em', marginBottom: 18 }}>THE PROBLEM</div>
        <div style={{ color: '#F5F8FC', fontSize: 78, fontWeight: 700, lineHeight: 1.04, letterSpacing: '-0.02em' }}>Valuable customer intelligence<br />was getting <span style={{ color: '#E74C3C' }}>lost.</span></div>
        <div style={{ color: '#8A96A8', fontSize: 27, marginTop: 24, maxWidth: 900, ...up(lt, 1.1, 0.7) }}>Scattered across spreadsheets, SharePoint & Teams - never connected, never tracked.</div>
      </div>
    </div>
  );
}

// ── SCENE 2 · THE TURN ─────────────────────────────────────────────────────
function Turn() {
  const { localTime: lt } = useSprite();
  const op = useFade(0.35, 0.4);
  const r = Easing.easeInOutCubic(clamp(lt / 0.9, 0, 1)) * 160;
  const pulse = 1 + 0.03 * Math.cos((2 * Math.PI * (lt + 3.5)) / 2);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: op, fontFamily: FONT, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 50%, #F6F9FE ${r * 0.55}%, #EAF1FB ${r}%, rgba(11,18,32,0) ${r + 8}%)` }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26 }}>
        <div style={{ ...up(lt, 0.45, 0.6) }}><AppMark s={64} pulse={pulse} /></div>
        <div style={{ color: '#0B1220', fontSize: 66, fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center', lineHeight: 1.08, ...up(lt, 0.55, 0.7) }}>
          What if every insight<br />stayed <span style={{ color: '#0F6CBD' }}>connected?</span>
        </div>
        <div style={{ color: '#5B6472', fontSize: 25, fontWeight: 600, letterSpacing: '.02em', ...up(lt, 0.95, 0.6) }}>One AI-powered workflow, inside the CRM.</div>
      </div>
    </div>
  );
}

// ── SCENE 3 · SOURCE OF TRUTH · CRM INSIGHTS TRACKER ───────────────────────
const ROWS = [
  { t: 'Copilot usage analytics by department', cat: 'Feature Request', cc: '#0F6CBD', cb: '#EFF6FC', prio: '#B26C00', stage: 'New', ow: 'AN', ob: '#0F6CBD' },
  { t: 'Purview data residency blocks EU rollout', cat: 'Blocker', cc: '#C50F1F', cb: '#FDF3F4', prio: '#C50F1F', stage: 'Triaged', ow: 'JR', ob: '#8661C5' },
  { t: 'Fabric Direct Lake refresh scheduling', cat: 'Feature Request', cc: '#0F6CBD', cb: '#EFF6FC', prio: '#B26C00', stage: 'Prioritized', ow: 'JR', ob: '#8661C5' },
  { t: 'Defender alert context for SOC triage', cat: 'Feature Request', cc: '#0F6CBD', cb: '#EFF6FC', prio: '#B26C00', stage: 'In Handoff', ow: 'SK', ob: '#0E700E' },
  { t: 'Teams Rooms Copilot meeting recap', cat: 'Feature Request', cc: '#0F6CBD', cb: '#EFF6FC', prio: '#0E700E', stage: 'Accepted', ow: 'SK', ob: '#0E700E' },
];
function Tracker() {
  const { localTime: lt } = useSprite();
  const op = useFade(0.4, 0.4);
  const push = 1.03 - 0.03 * Easing.easeOutQuad(clamp(lt / 3, 0, 1));
  const chips = ['All', 'Feature Request', 'Blocker', 'Sentiment', 'UX Friction'];
  const stamp = up(lt, 1.5, 0.5, 20);
  const stampScale = Easing.easeOutBack(clamp((lt - 1.5) / 0.5, 0, 1));
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#F7FAFE 0%,#EEF3FA 100%)', opacity: op, fontFamily: FONT, overflow: 'hidden', transform: `scale(${push})`, transformOrigin: '50% 46%' }}>
      <div style={{ position: 'absolute', left: 130, top: 92, ...up(lt, 0.15, 0.6) }}>
        <div style={{ color: '#0F6CBD', fontSize: 18, fontWeight: 700, letterSpacing: '.16em', marginBottom: 10 }}>ONE SOURCE OF TRUTH</div>
        <div style={{ color: '#0B1220', fontSize: 54, fontWeight: 700, letterSpacing: '-0.02em' }}>Every piece of customer feedback, tracked in one place</div>
      </div>
      <div style={{ position: 'absolute', left: 240, top: 288, width: 1440, background: '#fff', borderRadius: 20, border: '1px solid #E4EAF2', boxShadow: '0 40px 90px rgba(15,23,42,0.16)', overflow: 'hidden', ...up(lt, 0.25, 0.6) }}>
        <WinBar title="Customer Insights" badge="9 tracked" right={
          <div style={{ display: 'flex' }}>
            <span style={{ height: 34, display: 'flex', alignItems: 'center', padding: '0 16px', border: '1px solid #E1E7F0', borderRadius: '7px 0 0 7px', background: '#0F6CBD', color: '#fff', fontSize: 14, fontWeight: 700 }}>Grid</span>
            <span style={{ height: 34, display: 'flex', alignItems: 'center', padding: '0 16px', border: '1px solid #E1E7F0', borderLeft: 'none', borderRadius: '0 7px 7px 0', background: '#fff', color: '#5B6472', fontSize: 14, fontWeight: 700 }}>Board</span>
          </div>
        } />
        {/* filter chips */}
        <div style={{ display: 'flex', gap: 10, padding: '16px 24px', borderBottom: '1px solid #F3F5F9' }}>
          {chips.map((c, i) => (
            <span key={i} style={{ height: 34, display: 'flex', alignItems: 'center', padding: '0 15px', borderRadius: 999, fontSize: 14, fontWeight: 600,
              background: i === 0 ? '#0F6CBD' : '#fff', color: i === 0 ? '#fff' : '#5B6472', border: `1px solid ${i === 0 ? '#0F6CBD' : '#E1E7F0'}`, ...up(lt, 0.4 + i * 0.05, 0.4) }}>{c}</span>
          ))}
        </div>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '12px 26px', background: '#FAFBFD', borderBottom: '1px solid #EEF2F7', fontSize: 12, fontWeight: 700, color: '#8A96A8', letterSpacing: '.05em' }}>
          <span style={{ flex: 1 }}>INSIGHT</span><span style={{ width: 190 }}>CATEGORY</span><span style={{ width: 130 }}>STAGE</span><span style={{ width: 60 }}>OWNER</span>
        </div>
        {/* rows */}
        {ROWS.map((r, i) => {
          const e = up(lt, 0.65 + i * 0.13, 0.45, 24);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '18px 26px', borderBottom: '1px solid #F3F5F9', opacity: e.opacity, transform: e.transform }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.prio }} />
                <span style={{ fontSize: 19, fontWeight: 600, color: '#0B1220' }}>{r.t}</span>
              </div>
              <span style={{ width: 190 }}><span style={{ background: r.cb, color: r.cc, fontSize: 13, fontWeight: 700, padding: '5px 11px', borderRadius: 6 }}>{r.cat}</span></span>
              <span style={{ width: 130, fontSize: 15, color: '#5B6472', fontWeight: 600 }}>{r.stage}</span>
              <span style={{ width: 60 }}><span style={{ width: 32, height: 32, borderRadius: '50%', background: r.ob, color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.ow}</span></span>
            </div>
          );
        })}
      </div>
      {/* source-of-truth stamp */}
      <div style={{ position: 'absolute', left: 1420, top: 250, opacity: stamp.opacity, transform: `rotate(-6deg) scale(${0.7 + 0.3 * stampScale})`,
        background: 'linear-gradient(135deg,#0F6CBD,#8661C5)', color: '#fff', padding: '14px 22px', borderRadius: 14, fontWeight: 800, fontSize: 20, letterSpacing: '.04em', boxShadow: '0 18px 40px rgba(15,108,189,0.4)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Sparkle s={20} c="#fff" /> SINGLE SOURCE OF TRUTH
      </div>
    </div>
  );
}

// ── SCENE 4 · THE 5 AI SKILLS ──────────────────────────────────────────────
const STAGES = [
  { n: '01', name: 'Capture', skill: 'Capture Feedback', desc: 'Emails · Teams · Meetings', color: '#0F6CBD', bg: '#EFF6FC' },
  { n: '02', name: 'Categorize', skill: 'Extract & Categorize', desc: 'Sentiment · Blocker · Feature', color: '#0E700E', bg: '#F1F8F1' },
  { n: '03', name: 'Prioritize', skill: 'Prioritize Insights', desc: 'Impact · Frequency · Fit', color: '#986F0B', bg: '#FBF6E9' },
  { n: '04', name: 'Handoff', skill: 'Product Handoff', desc: 'Azure DevOps · UAT', color: '#8661C5', bg: '#F5F0FB' },
  { n: '05', name: 'OKR Sync', skill: 'OKR Dashboard Sync', desc: 'Power BI · Roadmap', color: '#0F6CBD', bg: '#EFF6FC' },
];
const CX = [250, 585, 920, 1255, 1590];
const LINE_Y = 430;
function Lifecycle() {
  const { localTime: lt } = useSprite();
  const op = useFade(0.4, 0.4);
  const push = 1 + 0.028 * Easing.easeOutQuad(clamp(lt / 5.5, 0, 1));
  const dotX = interpolate([3.3, 9.9], [CX[0], CX[4]], Easing.easeInOutCubic)(lt);
  const lineGrow = interpolate([3.0, 9.7], [0, 1], Easing.easeInOutCubic)(lt);
  const actAt = [3.5, 4.5, 6.0, 8.3, 9.6];
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#F7FAFE 0%,#EEF3FA 100%)', opacity: op, fontFamily: FONT, overflow: 'hidden', transform: `scale(${push})`, transformOrigin: '50% 46%' }}>
      <div style={{ position: 'absolute', left: 130, top: 90, ...up(lt, 0.15, 0.6) }}>
        <div style={{ color: '#8661C5', fontSize: 18, fontWeight: 700, letterSpacing: '.16em', marginBottom: 12 }}>AI SKILLS · THE AUTOMATION LAYER</div>
        <div style={{ color: '#0B1220', fontSize: 54, fontWeight: 700, letterSpacing: '-0.02em' }}>Five AI skills automate the lifecycle</div>
        <div style={{ color: '#5B6472', fontSize: 23, fontWeight: 500, marginTop: 12, ...up(lt, 0.45, 0.6) }}>Running on Copilot + Copilot CLI, writing back to CRM, Azure DevOps & Power BI.</div>
      </div>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <line x1={CX[0]} y1={LINE_Y} x2={CX[4]} y2={LINE_Y} stroke="#D8E0EC" strokeWidth="4" strokeLinecap="round" />
        <line x1={CX[0]} y1={LINE_Y} x2={CX[0] + (CX[4] - CX[0]) * lineGrow} y2={LINE_Y} stroke="url(#flow)" strokeWidth="5" strokeLinecap="round" />
        <defs><linearGradient id="flow" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#0F6CBD" /><stop offset="1" stopColor="#8661C5" /></linearGradient></defs>
      </svg>
      {lt > 3.2 && lt < 10.3 && (
        <div style={{ position: 'absolute', left: dotX, top: LINE_Y, width: 26, height: 26, marginLeft: -13, marginTop: -13, borderRadius: '50%', background: 'radial-gradient(circle,#fff 30%,#2899F5 70%)', boxShadow: '0 0 24px 8px rgba(40,153,245,0.55)' }} />
      )}
      {STAGES.map((s, i) => {
        const active = lt >= actAt[i];
        const pop = active ? Easing.easeOutBack(clamp((lt - actAt[i]) / 0.4, 0, 1)) : 0;
        return <span key={'n' + i} style={{ position: 'absolute', left: CX[i], top: LINE_Y, width: 20, height: 20, marginLeft: -10, marginTop: -10, borderRadius: '50%', background: active ? s.color : '#C6D0DE', border: '4px solid #fff', boxShadow: active ? `0 0 0 4px ${s.color}33` : 'none', transform: `scale(${0.7 + 0.3 * pop})` }} />;
      })}
      {STAGES.map((s, i) => {
        const active = lt >= actAt[i];
        const en = up(lt, actAt[i] - 0.1, 0.45, 30);
        const glow = active ? Easing.easeOutCubic(clamp((lt - actAt[i]) / 0.4, 0, 1)) : 0;
        return (
          <div key={i} style={{ position: 'absolute', left: CX[i] - 150, top: 500, width: 300, opacity: en.opacity, transform: `${en.transform} scale(${0.96 + 0.04 * glow})` }}>
            <div style={{ background: '#fff', border: `1px solid ${active ? s.color : '#E1E7F0'}`, borderRadius: 18, padding: 22, boxShadow: active ? `0 20px 50px ${s.color}2E` : '0 8px 24px rgba(15,23,42,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ width: 42, height: 42, borderRadius: 11, background: s.bg, color: s.color, fontWeight: 800, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.n}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#F3EEFB,#EAF3FC)', border: '1px solid #E4DAF3', borderRadius: 999, padding: '5px 11px', fontSize: 12, fontWeight: 700, color: '#8661C5', opacity: glow }}><Sparkle s={13} /> AI SKILL</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#0B1220', letterSpacing: '-0.01em' }}>{s.name}</div>
              <div style={{ fontSize: 15, color: '#8661C5', fontWeight: 600, margin: '6px 0 12px' }}>{s.skill}</div>
              <div style={{ height: 1, background: '#EEF2F7', margin: '0 0 12px' }} />
              <div style={{ fontSize: 15, color: '#5B6472', fontWeight: 500 }}>{s.desc}</div>
              <div style={{ marginTop: 14, height: 6, borderRadius: 3, background: '#EEF2F7', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${glow * 100}%`, background: s.color, borderRadius: 3 }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── SCENE 5 · OKR DASHBOARD (as a screen) ──────────────────────────────────
function Dashboard() {
  const { localTime: lt } = useSprite();
  const op = useFade(0.4, 0.4);
  const push = 1.04 - 0.04 * Easing.easeOutQuad(clamp(lt / 3.5, 0, 1));
  const p = Easing.easeOutCubic(clamp((lt - 0.5) / 1.4, 0, 1));
  const pct = Math.round(68 * p), acc = Math.round(233 * p), sub = Math.round(342 * p);
  const cyc = (28 - (28 - 12.4) * p).toFixed(1);
  const bars = [82, 64, 51, 47, 33, 27];
  const bc = ['#0F6CBD', '#6264A7', '#0078D4', '#8661C5', '#0E700E', '#986F0B'];
  const bl = ['Copilot', 'Teams', 'Azure', 'Fabric', 'Purview', 'Intune'];
  const bp = Easing.easeOutCubic(clamp((lt - 0.8) / 1.3, 0, 1));
  const tiles = [
    { label: 'Insights Accepted rate', val: pct + '%', sub: '▲ +6 pts vs last quarter', c: '#0F6CBD' },
    { label: 'Accepted / Submitted', val: acc + ' / ' + sub, sub: 'this quarter', c: '#0B1220' },
    { label: 'Avg time to acceptance', val: cyc + 'd', sub: '▼ down from 28d', c: '#0E700E' },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#EEF3FA,#F7FAFE)', opacity: op, fontFamily: FONT, overflow: 'hidden', transform: `scale(${push})`, transformOrigin: '50% 48%' }}>
      <div style={{ position: 'absolute', left: 130, top: 78, ...up(lt, 0.1, 0.6) }}>
        <div style={{ color: '#0E700E', fontSize: 18, fontWeight: 700, letterSpacing: '.16em', marginBottom: 8 }}>MEASURED LIVE · INSIGHTS ACCEPTED OKR</div>
        <div style={{ color: '#0B1220', fontSize: 50, fontWeight: 700, letterSpacing: '-0.02em' }}>See how much insight reaches the roadmap</div>
      </div>
      <div style={{ position: 'absolute', left: 200, top: 210, width: 1520, background: '#fff', borderRadius: 20, border: '1px solid #E4EAF2', boxShadow: '0 40px 90px rgba(15,23,42,0.16)', overflow: 'hidden', ...up(lt, 0.2, 0.6) }}>
        <WinBar title="Insights OKR · FY26 Q2" right={<span style={{ fontSize: 15, color: '#8A96A8', fontWeight: 500 }}>Power BI · refreshed 4 min ago</span>} />
        <div style={{ padding: 30 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 22 }}>
            {tiles.map((t, i) => (
              <div key={i} style={{ border: '1px solid #EDEFF3', borderRadius: 16, padding: '20px 24px', background: i === 0 ? 'linear-gradient(180deg,#F5FAFF,#fff)' : '#fff', ...up(lt, 0.35 + i * 0.12, 0.5) }}>
                <div style={{ fontSize: 16, color: '#5B6472', fontWeight: 600 }}>{t.label}</div>
                <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-0.02em', color: t.c, margin: '6px 0 4px', fontVariantNumeric: 'tabular-nums' }}>{t.val}</div>
                <div style={{ fontSize: 15, color: '#0E700E', fontWeight: 600 }}>{t.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ border: '1px solid #EDEFF3', borderRadius: 16, padding: 24, ...up(lt, 0.6, 0.5) }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0B1220', marginBottom: 18 }}>Accepted insights by product area</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 42, height: 180, padding: '0 8px' }}>
              {bars.map((v, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, justifyContent: 'flex-end', height: '100%' }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: '#0B1220' }}>{Math.round(v * bp)}</span>
                  <div style={{ width: '100%', maxWidth: 84, height: v * 1.55 * bp, background: `linear-gradient(180deg,${bc[i]},${bc[i]}CC)`, borderRadius: '8px 8px 0 0' }} />
                  <span style={{ fontSize: 15, color: '#5B6472', fontWeight: 600 }}>{bl[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SCENE 6 · RELEASE CARD ─────────────────────────────────────────────────
function EndCard() {
  const { localTime: lt } = useSprite();
  const op = useFade(0.4, 0.15);
  const sheen = (Math.sin(lt * 1.6) + 1) / 2;
  const pulse = 1 + 0.03 * Math.cos((2 * Math.PI * (lt + 18.5)) / 2);
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(130% 120% at 50% 40%, #13233F 0%, #0B1220 70%)', opacity: op, fontFamily: FONT, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(60% 50% at ${40 + sheen * 20}% 45%, rgba(40,153,245,0.18), transparent 70%)` }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <div style={{ ...up(lt, 0.15, 0.6) }}><AppMark s={72} pulse={pulse} /></div>
        <div style={{ color: '#F5F8FC', fontSize: 70, fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center', lineHeight: 1.06, ...up(lt, 0.4, 0.7) }}>
          AI-Powered Customer<br />Insights Management
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14, ...up(lt, 0.75, 0.7) }}>
          {['Capture', 'Connect', 'Automate', 'Measure'].map((w, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <span style={{ color: '#2899F5', fontSize: 27, fontWeight: 700, letterSpacing: '.04em' }}>{w}</span>
              {i < 3 && <span style={{ color: '#3A4761', fontSize: 22 }}>→</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────
function ReleaseScene() {
  return (
    <Stage width={1920} height={1080} duration={35} background="#0B1220" persistKey="release3">
      <Sprite start={0} end={5.5}><Problem /></Sprite>
      <Sprite start={5.3} end={9.3}><Turn /></Sprite>
      <Sprite start={9.1} end={15.0}><Tracker /></Sprite>
      <Sprite start={14.8} end={25.6}><Lifecycle /></Sprite>
      <Sprite start={25.4} end={32.1}><Dashboard /></Sprite>
      <Sprite start={31.95} end={35}><EndCard /></Sprite>
      <Rhythm />
      <Captions />
      <Soundtrack />
      <Voiceover />
    </Stage>
  );
}

window.ReleaseScene = ReleaseScene;
