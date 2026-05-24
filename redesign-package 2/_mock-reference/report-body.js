// Report body — injected into #report-body
(function(){

// ----- helpers for inline SVG charts -----
const fmt = n => n.toLocaleString();

// Histogram bars (vertical) — returns SVG markup
function histogram({data, w=820, h=300, padL=44, padR=16, padT=20, padB=44, accent="var(--stripe-purple)", muted="var(--slate-200)", median=null, mean=null, fmtX=(x)=>x}){
  const maxV = Math.max(...data.map(d=>d.v));
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const bw = innerW / data.length;

  // y gridlines (4)
  const yTicks = 4;
  let grid = '';
  for(let i=0;i<=yTicks;i++){
    const y = padT + innerH - (i/yTicks)*innerH;
    const val = Math.round((i/yTicks)*maxV);
    grid += `<line x1="${padL}" y1="${y}" x2="${w-padR}" y2="${y}" stroke="var(--border-1)" stroke-dasharray="${i===0?'0':'2 4'}"/>`;
    grid += `<text x="${padL-8}" y="${y+4}" text-anchor="end" class="axis-label">${val}</text>`;
  }

  // bars
  let bars = '';
  data.forEach((d,i)=>{
    const bh = (d.v / maxV) * innerH;
    const x = padL + i*bw + 3;
    const y = padT + innerH - bh;
    const fill = d.highlight ? accent : muted;
    bars += `<rect class="bar" x="${x}" y="${y}" width="${bw-6}" height="${bh}" fill="${fill}" rx="2"><title>${d.label}: ${d.v}</title></rect>`;
  });

  // x labels (every other for density)
  let xLabels = '';
  data.forEach((d,i)=>{
    if(data.length<=12 || i%2===0){
      const x = padL + i*bw + bw/2;
      xLabels += `<text x="${x}" y="${h-padB+18}" text-anchor="middle" class="axis-label">${fmtX(d.label)}</text>`;
    }
  });

  // median / mean lines
  let markers = '';
  function marker(val, label, color){
    if(val==null) return '';
    // find index by label match
    const idx = data.findIndex(d => d.label===val || d.match===val);
    if(idx===-1) return '';
    const x = padL + idx*bw + bw/2;
    return `
      <line x1="${x}" y1="${padT-6}" x2="${x}" y2="${padT+innerH}" stroke="${color}" stroke-width="1.5" stroke-dasharray="3 3"/>
      <g transform="translate(${x}, ${padT-10})">
        <rect x="-32" y="-16" width="64" height="18" rx="9" fill="${color}"/>
        <text x="0" y="-3" text-anchor="middle" font-size="10" font-weight="500" fill="white" letter-spacing="0.04em">${label}</text>
      </g>`;
  }
  markers += marker(median?.bin, median?.label||'MEDIAN', 'var(--stripe-purple)');
  markers += marker(mean?.bin,   mean?.label||'MEAN',     'var(--slate-700)');

  return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img">
    ${grid}${bars}${markers}${xLabels}
  </svg>`;
}

// Simple scatter-band (median curve with shaded band) for "by age" view
function ageBand({points, w=820, h=300, padL=60, padR=20, padT=24, padB=40, yMax}){
  const ages = points.map(p=>p.age);
  const xMin = Math.min(...ages), xMax = Math.max(...ages);
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  yMax = yMax || Math.max(...points.map(p=>p.p90));
  const x = a => padL + (a-xMin)/(xMax-xMin) * innerW;
  const y = v => padT + innerH - (v/yMax)*innerH;

  // y gridlines
  let grid = '';
  for(let i=0;i<=4;i++){
    const yy = padT + innerH - (i/4)*innerH;
    const val = (i/4)*yMax;
    const lbl = val>=1000?'$'+(val/1000).toFixed(1)+'M':'$'+val+'K';
    grid += `<line x1="${padL}" y1="${yy}" x2="${w-padR}" y2="${yy}" stroke="var(--border-1)" stroke-dasharray="${i===0?'0':'2 4'}"/>`;
    grid += `<text x="${padL-8}" y="${yy+4}" text-anchor="end" class="axis-label">${lbl}</text>`;
  }

  // band p25-p75
  let bandPath = 'M ' + points.map(p=>`${x(p.age)},${y(p.p75)}`).join(' L ');
  bandPath += ' L ' + points.slice().reverse().map(p=>`${x(p.age)},${y(p.p25)}`).join(' L ') + ' Z';

  // band p10-p90 lighter
  let outerBand = 'M ' + points.map(p=>`${x(p.age)},${y(p.p90)}`).join(' L ');
  outerBand += ' L ' + points.slice().reverse().map(p=>`${x(p.age)},${y(p.p10)}`).join(' L ') + ' Z';

  const medianPath = 'M ' + points.map(p=>`${x(p.age)},${y(p.p50)}`).join(' L ');

  // x labels every 5
  let xLabels = '';
  for(let a=xMin; a<=xMax; a+=5){
    xLabels += `<text x="${x(a)}" y="${h-padB+18}" text-anchor="middle" class="axis-label">${a}</text>`;
  }

  // median dots
  let dots = '';
  points.forEach(p => {
    dots += `<circle cx="${x(p.age)}" cy="${y(p.p50)}" r="3.5" fill="var(--stripe-purple)"/>`;
  });

  return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img">
    ${grid}
    <path d="${outerBand}" fill="rgba(14,159,110,0.10)"/>
    <path d="${bandPath}"  fill="rgba(14,159,110,0.22)"/>
    <path d="${medianPath}" stroke="var(--stripe-purple)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    ${dots}
    ${xLabels}
    <text x="${padL}" y="${padT-8}" class="axis-label" text-anchor="start">Net worth</text>
    <text x="${w-padR}" y="${h-8}" class="axis-label" text-anchor="end">Age →</text>
  </svg>`;
}

// Stacked horizontal bar — for allocation
function stackedBar({segments, w=820, h=72, padL=0, padR=0, padT=8, padB=8}){
  const total = segments.reduce((a,s)=>a+s.v,0);
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  let cursor = padL;
  let rects = '';
  let labels = '';
  segments.forEach((s,i)=>{
    const segW = (s.v/total)*innerW;
    rects += `<rect x="${cursor}" y="${padT}" width="${segW}" height="${innerH}" fill="${s.color}"${i===0?' rx="6"':''}${i===segments.length-1?' rx="6"':''}/>`;
    // segment label inside if big enough
    if(segW > 70){
      labels += `<text x="${cursor+12}" y="${padT+22}" font-size="13" font-weight="500" fill="white" letter-spacing="-0.005em">${s.label}</text>`;
      labels += `<text x="${cursor+12}" y="${padT+42}" font-size="20" font-weight="500" fill="white" letter-spacing="-0.02em">${s.v}%</text>`;
    }
    cursor += segW;
  });
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" style="border-radius:6px;overflow:hidden;">${rects}${labels}</svg>`;
}

// ----- DATA -----
const NW_BINS = [
  {label:'<100K', v: 22},
  {label:'100K', v: 38},
  {label:'250K', v: 64},
  {label:'500K', v: 96},
  {label:'750K', v: 112},
  {label:'1M',   v: 148, match:'1M'},
  {label:'1.5M', v: 162, highlight:true, match:'1.5M'},
  {label:'2M',   v: 138},
  {label:'3M',   v: 104, match:'3M'},
  {label:'5M',   v: 78},
  {label:'7.5M', v: 48},
  {label:'10M+', v: 41},
];

const FI_BINS = [
  {label:'<1M', v:46},
  {label:'1M',  v:78},
  {label:'1.5M',v:118},
  {label:'2M',  v:188},
  {label:'2.5M',v:212, highlight:true, match:'2.5M'},
  {label:'3M',  v:178},
  {label:'4M',  v:124, match:'3.1M'},
  {label:'5M',  v:96},
  {label:'7.5M',v:54},
  {label:'10M+',v:55},
];

const SAVRATE_BINS = [
  {label:'<10%', v:32},
  {label:'10–20%', v:88},
  {label:'20–30%', v:158},
  {label:'30–40%', v:238, highlight:true, match:'30–40%'},
  {label:'40–50%', v:222},
  {label:'50–60%', v:198, match:'42%'},
  {label:'60–70%', v:118},
  {label:'70–80%', v:62},
  {label:'80%+',   v:33},
];

const YEARS_BINS = [
  {label:'0',  v:128},
  {label:'1–3', v:96},
  {label:'4–6', v:114},
  {label:'7–10', v:158, match:'11', highlight:false},
  {label:'11–15', v:184, highlight:true, match:'11–15'},
  {label:'16–20', v:146},
  {label:'21–25', v:84},
  {label:'26+', v:39},
];

const AGE_POINTS = [
  {age:25, p10:18,  p25:54,  p50:120, p75:240, p90:380},
  {age:30, p10:60,  p25:140, p50:280, p75:520, p90:820},
  {age:35, p10:140, p25:300, p50:580, p75:1020,p90:1550},
  {age:40, p10:240, p25:560, p50:990, p75:1700,p90:2600},
  {age:45, p10:380, p25:900, p50:1480,p75:2480,p90:3700},
  {age:50, p10:520, p25:1200,p50:2050,p75:3300,p90:4900},
  {age:55, p10:640, p25:1480,p50:2580,p75:4100,p90:6100},
  {age:60, p10:720, p25:1700,p50:3050,p75:4800,p90:7200},
  {age:65, p10:780, p25:1860,p50:3380,p75:5300,p90:7800},
];
// y-units are $K; max ~8000K = $8M

// ====================== BUILD ======================
const html = `

<!-- ============================================================== -->
<!-- METHODOLOGY SNAPSHOT                                          -->
<!-- ============================================================== -->
<section class="section" id="methodology">
  <div class="shell">
    <div class="sec-head">
      <div class="sec-meta">
        <div class="num">/ 01</div>
        <div class="label">Who responded</div>
      </div>
      <div>
        <h2 class="section-title">A self-reported snapshot, drawn from one subreddit over six weeks.</h2>
        <p class="section-lede">The survey ran from April to mid-May 2025 and was promoted weekly in the community. Every figure on this page comes from respondents&rsquo; own answers &mdash; no accounts were linked or verified.</p>
      </div>
    </div>

    <div class="steps">
      <div class="step">
        <div class="badge">1</div>
        <h4>Posted weekly</h4>
        <p>Stickied to the subreddit each Saturday for six weeks; cross-posted in two related communities.</p>
      </div>
      <div class="step">
        <div class="badge">2</div>
        <h4>Self-reported</h4>
        <p>62 questions across demographics, balance sheet, income, expenses, allocation, and qualitative outlook.</p>
      </div>
      <div class="step">
        <div class="badge">3</div>
        <h4>Cleaned</h4>
        <p>Responses with implausible internal contradictions or partial completions below 60% were removed.</p>
      </div>
      <div class="step">
        <div class="badge">4</div>
        <h4>Analyzed</h4>
        <p>Medians used for headline numbers; means reported alongside when distributions are heavy-tailed.</p>
      </div>
    </div>

    <div style="margin-top: 56px;">
      <div class="kpis">
        <div class="kpi"><div class="v">1,149</div><div class="l">Responses retained after cleaning (1,418 collected).</div></div>
        <div class="kpi"><div class="v">42<span class="accent">y</span></div><div class="l">Median respondent age. Range: 19&ndash;71.</div></div>
        <div class="kpi"><div class="v">71<span class="accent">%</span></div><div class="l">Partnered or married households.</div></div>
        <div class="kpi"><div class="v">US 84<span class="accent">%</span></div><div class="l">Of respondents are US-based; 16% international.</div></div>
      </div>
    </div>
  </div>
</section>

<!-- ============================================================== -->
<!-- DEMOGRAPHICS                                                  -->
<!-- ============================================================== -->
<section class="section section--alt" id="demographics">
  <div class="shell">
    <div class="sec-head">
      <div class="sec-meta">
        <div class="num">/ 02</div>
        <div class="label">Demographics</div>
      </div>
      <div>
        <h2 class="section-title">A skew that&rsquo;s worth saying out loud.</h2>
        <p class="section-lede">Respondents are largely US-based, high-earning, and mid-career. The community&rsquo;s composition shapes every other number on this page.</p>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3>Age</h3>
        <div class="card-sub">Median 42 · 25th&ndash;75th percentile spans 34&ndash;51.</div>
        <div class="hbar"><div class="lbl">Under 25</div><div class="track"><div class="fill" style="width:4%"></div></div><div class="val">4%</div></div>
        <div class="hbar"><div class="lbl">25&ndash;29</div><div class="track"><div class="fill" style="width:12%"></div></div><div class="val">12%</div></div>
        <div class="hbar"><div class="lbl">30&ndash;34</div><div class="track"><div class="fill" style="width:21%"></div></div><div class="val">21%</div></div>
        <div class="hbar"><div class="lbl">35&ndash;39</div><div class="track"><div class="fill" style="width:23%"></div></div><div class="val">23%</div></div>
        <div class="hbar"><div class="lbl">40&ndash;49</div><div class="track"><div class="fill" style="width:24%"></div></div><div class="val">24%</div></div>
        <div class="hbar"><div class="lbl">50&ndash;59</div><div class="track"><div class="fill" style="width:11%"></div></div><div class="val">11%</div></div>
        <div class="hbar"><div class="lbl">60+</div><div class="track"><div class="fill" style="width:5%"></div></div><div class="val">5%</div></div>
      </div>

      <div class="card">
        <h3>Household income</h3>
        <div class="card-sub">Median household gross of $215K. Mean $284K (heavy right tail).</div>
        <div class="hbar"><div class="lbl">&lt; $75K</div><div class="track"><div class="fill" style="width:6%"></div></div><div class="val">6%</div></div>
        <div class="hbar"><div class="lbl">$75K&ndash;125K</div><div class="track"><div class="fill" style="width:13%"></div></div><div class="val">13%</div></div>
        <div class="hbar"><div class="lbl">$125K&ndash;200K</div><div class="track"><div class="fill" style="width:28%"></div></div><div class="val">28%</div></div>
        <div class="hbar"><div class="lbl">$200K&ndash;300K</div><div class="track"><div class="fill" style="width:24%"></div></div><div class="val">24%</div></div>
        <div class="hbar"><div class="lbl">$300K&ndash;500K</div><div class="track"><div class="fill" style="width:18%"></div></div><div class="val">18%</div></div>
        <div class="hbar"><div class="lbl">$500K+</div><div class="track"><div class="fill" style="width:11%"></div></div><div class="val">11%</div></div>
      </div>

      <div class="card">
        <h3>Occupation</h3>
        <div class="card-sub">Top six industries cover 78% of respondents.</div>
        <div class="hbar"><div class="lbl">Software / tech</div><div class="track"><div class="fill" style="width:34%"></div></div><div class="val">34%</div></div>
        <div class="hbar"><div class="lbl">Finance</div><div class="track"><div class="fill" style="width:14%"></div></div><div class="val">14%</div></div>
        <div class="hbar"><div class="lbl">Healthcare</div><div class="track"><div class="fill" style="width:11%"></div></div><div class="val">11%</div></div>
        <div class="hbar"><div class="lbl">Engineering</div><div class="track"><div class="fill" style="width:9%"></div></div><div class="val">9%</div></div>
        <div class="hbar"><div class="lbl">Government</div><div class="track"><div class="fill" style="width:6%"></div></div><div class="val">6%</div></div>
        <div class="hbar"><div class="lbl">Consulting / law</div><div class="track"><div class="fill" style="width:4%"></div></div><div class="val">4%</div></div>
        <div class="hbar"><div class="lbl">Everything else</div><div class="track"><div class="fill" style="width:22%"></div></div><div class="val">22%</div></div>
      </div>

      <div class="card">
        <h3>Geography</h3>
        <div class="card-sub">US-based respondents by region. International: 16% of total.</div>
        <div class="hbar"><div class="lbl">West</div><div class="track"><div class="fill" style="width:31%"></div></div><div class="val">31%</div></div>
        <div class="hbar"><div class="lbl">Northeast</div><div class="track"><div class="fill" style="width:24%"></div></div><div class="val">24%</div></div>
        <div class="hbar"><div class="lbl">South</div><div class="track"><div class="fill" style="width:22%"></div></div><div class="val">22%</div></div>
        <div class="hbar"><div class="lbl">Midwest</div><div class="track"><div class="fill" style="width:14%"></div></div><div class="val">14%</div></div>
        <div class="hbar"><div class="lbl">International</div><div class="track"><div class="fill" style="width:9%"></div></div><div class="val">16%</div></div>
      </div>
    </div>
  </div>
</section>

<!-- ============================================================== -->
<!-- NET WORTH                                                     -->
<!-- ============================================================== -->
<section class="section" id="networth">
  <div class="shell">
    <div class="sec-head">
      <div class="sec-meta">
        <div class="num">/ 03</div>
        <div class="label">Where they stand</div>
      </div>
      <div>
        <h2 class="section-title">Half the community sits above $1.58M in net worth.</h2>
        <p class="section-lede">The distribution is heavy-tailed &mdash; the mean is half a million above the median. Bottom decile reports under $180K; top decile reports over $7M.</p>
      </div>
    </div>

    <div class="grid-2" style="grid-template-columns: 0.9fr 1.1fr; gap: 32px; align-items: stretch;">
      <div class="card card--purple" style="padding: 36px;">
        <div class="overline" style="color: rgba(255,255,255,0.7); margin-bottom: 16px;">Median household net worth</div>
        <div class="bignum" style="color:white;">$1.58<span class="unit" style="color:rgba(255,255,255,0.6)">M</span></div>
        <div style="margin-top: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 18px 24px; font-size: 14px;">
          <div><div class="muted" style="color:rgba(255,255,255,0.55); font-size:12px; letter-spacing:0.06em; text-transform:uppercase;">Mean</div><div style="font-size: 22px; font-weight:500; margin-top:4px;">$2.41M</div></div>
          <div><div class="muted" style="color:rgba(255,255,255,0.55); font-size:12px; letter-spacing:0.06em; text-transform:uppercase;">10th pct</div><div style="font-size: 22px; font-weight:500; margin-top:4px;">$180K</div></div>
          <div><div class="muted" style="color:rgba(255,255,255,0.55); font-size:12px; letter-spacing:0.06em; text-transform:uppercase;">90th pct</div><div style="font-size: 22px; font-weight:500; margin-top:4px;">$7.04M</div></div>
          <div><div class="muted" style="color:rgba(255,255,255,0.55); font-size:12px; letter-spacing:0.06em; text-transform:uppercase;">Top 1%</div><div style="font-size: 22px; font-weight:500; margin-top:4px;">$18M+</div></div>
        </div>
      </div>

      <div class="card">
        <h3>Distribution of net worth</h3>
        <div class="card-sub">x-axis: net worth ($). y-axis: respondents. n = 1,149.</div>
        ${histogram({data: NW_BINS, median:{bin:'1.5M', label:'MEDIAN $1.58M'}, mean:{bin:'3M', label:'MEAN $2.41M'}, w:820, h:320})}
      </div>
    </div>

    <div style="margin-top: 32px;" class="card">
      <h3>Net worth by age</h3>
      <div class="card-sub">Median household net worth in 5-year age bins. Shaded bands show the interquartile and 10th&ndash;90th percentile ranges.</div>
      ${ageBand({points: AGE_POINTS, w:1200, h:340, yMax: 8000})}
      <div class="chart-legend">
        <span class="item"><span class="swatch" style="background:var(--stripe-purple)"></span>Median</span>
        <span class="item"><span class="swatch" style="background:rgba(14,159,110,0.22)"></span>25th&ndash;75th percentile</span>
        <span class="item"><span class="swatch" style="background:rgba(14,159,110,0.10)"></span>10th&ndash;90th percentile</span>
      </div>
    </div>
  </div>
</section>

<!-- ============================================================== -->
<!-- FI TARGETS                                                    -->
<!-- ============================================================== -->
<section class="section section--alt" id="targets">
  <div class="shell">
    <div class="sec-head">
      <div class="sec-meta">
        <div class="num">/ 04</div>
        <div class="label">Where they&rsquo;re going</div>
      </div>
      <div>
        <h2 class="section-title">$2.5M is the number the community is walking toward.</h2>
        <p class="section-lede">More than half target between $2M and $3.5M. The math is loose: 28x annual expenses is the median multiple of expected spend.</p>
      </div>
    </div>

    <div class="grid-2" style="grid-template-columns: 1.1fr 0.9fr; gap: 32px;">
      <div class="card">
        <h3>FI target distribution</h3>
        <div class="card-sub">Self-reported &ldquo;number that means I&rsquo;m done.&rdquo; n = 1,107.</div>
        ${histogram({data: FI_BINS, median:{bin:'2.5M', label:'MEDIAN $2.5M'}, mean:{bin:'4M', label:'MEAN $3.1M'}, w:820, h:320})}
      </div>

      <div class="card card--navy" style="padding: 32px;">
        <div class="overline" style="color: rgba(255,255,255,0.7); margin-bottom: 12px;">Multiple of expenses</div>
        <h3 style="color: white; font-size: 22px;">How much, relative to spend?</h3>
        <div style="margin: 24px 0 8px; font-size: 13px; color: rgba(255,255,255,0.7);">Reported FI target divided by reported annual expenses.</div>
        <div class="hbar" style="border-color: rgba(255,255,255,0.12);"><div class="lbl" style="color:white;">&lt; 20×</div><div class="track" style="background:rgba(255,255,255,0.10);"><div class="fill" style="width:14%; background:#5FCFA0;"></div></div><div class="val" style="color:rgba(255,255,255,0.75);">14%</div></div>
        <div class="hbar" style="border-color: rgba(255,255,255,0.12);"><div class="lbl" style="color:white;">20&ndash;25×</div><div class="track" style="background:rgba(255,255,255,0.10);"><div class="fill" style="width:23%; background:#5FCFA0;"></div></div><div class="val" style="color:rgba(255,255,255,0.75);">23%</div></div>
        <div class="hbar" style="border-color: rgba(255,255,255,0.12);"><div class="lbl" style="color:white;">25&ndash;30×</div><div class="track" style="background:rgba(255,255,255,0.10);"><div class="fill" style="width:31%; background:#3DDB9A;"></div></div><div class="val" style="color:rgba(255,255,255,0.75);">31%</div></div>
        <div class="hbar" style="border-color: rgba(255,255,255,0.12);"><div class="lbl" style="color:white;">30&ndash;40×</div><div class="track" style="background:rgba(255,255,255,0.10);"><div class="fill" style="width:21%; background:#5FCFA0;"></div></div><div class="val" style="color:rgba(255,255,255,0.75);">21%</div></div>
        <div class="hbar" style="border-color: rgba(255,255,255,0.12); border-bottom:0;"><div class="lbl" style="color:white;">40×+</div><div class="track" style="background:rgba(255,255,255,0.10);"><div class="fill" style="width:11%; background:#5FCFA0;"></div></div><div class="val" style="color:rgba(255,255,255,0.75);">11%</div></div>
        <div style="margin-top: 24px; padding-top: 24px; border-top:1px solid rgba(255,255,255,0.12); font-size:14px; color:rgba(255,255,255,0.7);">
          Median multiple is <strong style="color:white; font-weight:500;">28×</strong>. The 4% rule implies 25×; respondents land conservative.
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ============================================================== -->
<!-- SAVINGS & EXPENSES                                            -->
<!-- ============================================================== -->
<section class="section" id="savings">
  <div class="shell">
    <div class="sec-head">
      <div class="sec-meta">
        <div class="num">/ 05</div>
        <div class="label">How they live</div>
      </div>
      <div>
        <h2 class="section-title">38% of gross income, saved &mdash; year after year.</h2>
        <p class="section-lede">The savings rate is the single behavioral fact that explains most outcomes in this dataset. The expense side is dominated by housing, taxes, and food.</p>
      </div>
    </div>

    <div class="grid-2" style="grid-template-columns: 1fr 1fr; gap: 32px; align-items: stretch;">
      <div class="card">
        <h3>Annual savings rate</h3>
        <div class="card-sub">Share of gross household income saved. n = 1,128.</div>
        ${histogram({data: SAVRATE_BINS, median:{bin:'30–40%', label:'MEDIAN 38%'}, mean:{bin:'50–60%', label:'MEAN 42%'}, w:820, h:300})}
        <div style="margin-top: 16px; font-size:13px; color:var(--fg-2); line-height:1.55;">
          For context: the long-run US personal savings rate sits around 4&ndash;6%. The community runs roughly 8&times; that.
        </div>
      </div>

      <div class="card">
        <h3>Annual household expenses</h3>
        <div class="card-sub">Median spend by category. Households reporting in USD. n = 1,089.</div>
        <table class="dt" style="margin-top: 4px;">
          <thead>
            <tr><th>Category</th><th>Share</th><th class="right">Median ($)</th></tr>
          </thead>
          <tbody>
            <tr><td>Housing (rent / mortgage / property tax)</td><td class="bar-cell"><div class="fill" style="width:38%; background:var(--stripe-purple);"></div></td><td class="num">$28,400</td></tr>
            <tr><td>Income &amp; payroll taxes</td><td class="bar-cell"><div class="fill" style="width:22%; background:var(--stripe-purple);"></div></td><td class="num">$16,200</td></tr>
            <tr><td>Food &amp; groceries</td><td class="bar-cell"><div class="fill" style="width:10%; background:var(--stripe-purple);"></div></td><td class="num">$7,800</td></tr>
            <tr><td>Transportation</td><td class="bar-cell"><div class="fill" style="width:8%; background:var(--stripe-purple);"></div></td><td class="num">$5,900</td></tr>
            <tr><td>Travel &amp; recreation</td><td class="bar-cell"><div class="fill" style="width:7%; background:var(--stripe-purple);"></div></td><td class="num">$5,400</td></tr>
            <tr><td>Healthcare &amp; insurance</td><td class="bar-cell"><div class="fill" style="width:6%; background:var(--stripe-purple);"></div></td><td class="num">$4,800</td></tr>
            <tr><td>Childcare &amp; education</td><td class="bar-cell"><div class="fill" style="width:5%; background:var(--stripe-purple);"></div></td><td class="num">$3,900</td></tr>
            <tr><td>Everything else</td><td class="bar-cell"><div class="fill" style="width:4%; background:var(--slate-200);"></div></td><td class="num">$3,200</td></tr>
          </tbody>
          <tfoot>
            <tr><td><strong style="font-weight:500;">Total median</strong></td><td></td><td class="num"><strong style="font-weight:500;">$75,600</strong></td></tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</section>

<!-- ============================================================== -->
<!-- ALLOCATION                                                    -->
<!-- ============================================================== -->
<section class="section section--alt" id="allocation">
  <div class="shell">
    <div class="sec-head">
      <div class="sec-meta">
        <div class="num">/ 06</div>
        <div class="label">How they invest</div>
      </div>
      <div>
        <h2 class="section-title">Equities dominate; bonds barely register before 50.</h2>
        <p class="section-lede">The median allocation reads aggressive by any benchmark. Cash buffers are modest; alternatives outside crypto stay below 5%.</p>
      </div>
    </div>

    <div class="card">
      <h3>Median allocation, all respondents</h3>
      <div class="card-sub">Share of investable net worth. Real-estate equity excluded from this view.</div>
      ${stackedBar({segments:[
        {label:'Equities', v:74, color:'var(--stripe-purple)'},
        {label:'Bonds',    v:10, color:'#5FCFA0'},
        {label:'Cash',     v:7,  color:'var(--slate-700)'},
        {label:'Crypto',   v:4,  color:'#FED703'},
        {label:'Alts',     v:5,  color:'var(--slate-400)'}
      ], w:1100, h:80})}
      <div class="chart-legend">
        <span class="item"><span class="swatch" style="background:var(--stripe-purple)"></span>Equities · 74%</span>
        <span class="item"><span class="swatch" style="background:#5FCFA0"></span>Bonds · 10%</span>
        <span class="item"><span class="swatch" style="background:var(--slate-700)"></span>Cash · 7%</span>
        <span class="item"><span class="swatch" style="background:#FED703"></span>Crypto · 4%</span>
        <span class="item"><span class="swatch" style="background:var(--slate-400)"></span>Alts · 5%</span>
      </div>
    </div>

    <div class="grid-2" style="margin-top: 24px;">
      <div class="card">
        <h3>Account types held</h3>
        <div class="card-sub">Share of respondents holding each account type.</div>
        <div class="hbar"><div class="lbl">Taxable brokerage</div><div class="track"><div class="fill" style="width:94%"></div></div><div class="val">94%</div></div>
        <div class="hbar"><div class="lbl">401(k) / 403(b)</div><div class="track"><div class="fill" style="width:88%"></div></div><div class="val">88%</div></div>
        <div class="hbar"><div class="lbl">Roth IRA</div><div class="track"><div class="fill" style="width:81%"></div></div><div class="val">81%</div></div>
        <div class="hbar"><div class="lbl">HSA</div><div class="track"><div class="fill" style="width:62%"></div></div><div class="val">62%</div></div>
        <div class="hbar"><div class="lbl">Traditional IRA</div><div class="track"><div class="fill" style="width:48%"></div></div><div class="val">48%</div></div>
        <div class="hbar"><div class="lbl">Mega backdoor Roth</div><div class="track"><div class="fill" style="width:24%"></div></div><div class="val">24%</div></div>
        <div class="hbar"><div class="lbl">529 (kids)</div><div class="track"><div class="fill" style="width:19%"></div></div><div class="val">19%</div></div>
      </div>
      <div class="card">
        <h3>Allocation shifts with age</h3>
        <div class="card-sub">Median equity allocation by age bin. Bonds and cash rise after 50.</div>
        <table class="dt" style="margin-top: 4px;">
          <thead><tr><th>Age</th><th class="right">Equities</th><th class="right">Bonds</th><th class="right">Cash</th><th class="right">Other</th></tr></thead>
          <tbody>
            <tr><td>20s</td><td class="num">88%</td><td class="num muted">3%</td><td class="num muted">4%</td><td class="num muted">5%</td></tr>
            <tr><td>30s</td><td class="num">82%</td><td class="num muted">6%</td><td class="num muted">6%</td><td class="num muted">6%</td></tr>
            <tr><td>40s</td><td class="num">76%</td><td class="num muted">10%</td><td class="num muted">7%</td><td class="num muted">7%</td></tr>
            <tr><td>50s</td><td class="num">66%</td><td class="num muted">18%</td><td class="num muted">9%</td><td class="num muted">7%</td></tr>
            <tr><td>60s</td><td class="num">58%</td><td class="num muted">24%</td><td class="num muted">12%</td><td class="num muted">6%</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</section>

<!-- ============================================================== -->
<!-- WITHDRAWAL PLANS                                              -->
<!-- ============================================================== -->
<section class="section" id="withdrawal">
  <div class="shell">
    <div class="sec-head">
      <div class="sec-meta">
        <div class="num">/ 07</div>
        <div class="label">The plan</div>
      </div>
      <div>
        <h2 class="section-title">Most respondents plan a 3.5% withdrawal rate.</h2>
        <p class="section-lede">Strict 4% is a minority view. Dynamic and guardrail strategies are the most common alternatives, with a clear age-related shift toward bond tents and bucket strategies.</p>
      </div>
    </div>

    <div class="grid-2" style="grid-template-columns: 0.8fr 1.2fr;">
      <div class="card card--purple" style="padding: 36px;">
        <div class="overline" style="color: rgba(255,255,255,0.7); margin-bottom: 16px;">Median planned SWR</div>
        <div class="bignum" style="color:white;">3.5<span class="unit" style="color:rgba(255,255,255,0.6)">%</span></div>
        <div style="margin-top: 28px; font-size: 14px; color: rgba(255,255,255,0.75); line-height: 1.55;">
          Down from 3.75% in the 2024 survey. The 4% rule is referenced often but applied rarely &mdash; only 18% intend to use it as stated.
        </div>
      </div>
      <div class="card">
        <h3>Planned withdrawal strategy</h3>
        <div class="card-sub">Self-reported intended approach in retirement / FI. Respondents could pick one.</div>
        <div class="hbar"><div class="lbl">Fixed % of portfolio</div><div class="track"><div class="fill" style="width:32%"></div></div><div class="val">32%</div></div>
        <div class="hbar"><div class="lbl">Variable / dynamic</div><div class="track"><div class="fill" style="width:24%"></div></div><div class="val">24%</div></div>
        <div class="hbar"><div class="lbl">Guardrails (Guyton-Klinger)</div><div class="track"><div class="fill" style="width:19%"></div></div><div class="val">19%</div></div>
        <div class="hbar"><div class="lbl">4% rule (strict)</div><div class="track"><div class="fill" style="width:18%"></div></div><div class="val">18%</div></div>
        <div class="hbar"><div class="lbl">Bucket strategy</div><div class="track"><div class="fill" style="width:9%"></div></div><div class="val">9%</div></div>
        <div class="hbar"><div class="lbl">Don&rsquo;t know yet</div><div class="track"><div class="fill" style="width:14%"></div></div><div class="val">14%</div></div>
      </div>
    </div>
  </div>
</section>

<!-- ============================================================== -->
<!-- YEARS TO FI                                                   -->
<!-- ============================================================== -->
<section class="section section--alt" id="years">
  <div class="shell">
    <div class="sec-head">
      <div class="sec-meta">
        <div class="num">/ 08</div>
        <div class="label">The timeline</div>
      </div>
      <div>
        <h2 class="section-title">For those not yet there, FI is a median eleven years away.</h2>
        <p class="section-lede">A quarter of respondents are already FI. Of the rest, most see a path between seven and twenty years &mdash; with the densest cluster between eleven and fifteen.</p>
      </div>
    </div>

    <div class="card">
      <h3>Years until self-reported FI</h3>
      <div class="card-sub">Respondents&rsquo; own estimate of years remaining. The &ldquo;0&rdquo; bar is the already-FI cohort, isolated below.</div>
      ${histogram({data: YEARS_BINS, median:{bin:'11–15', label:'MEDIAN 11 YRS'}, w:1100, h:280, padL:50, padR:20})}
    </div>
  </div>
</section>

<!-- ============================================================== -->
<!-- ALREADY-FI COHORT                                             -->
<!-- ============================================================== -->
<section class="section" id="cohort">
  <div class="shell">
    <div class="sec-head">
      <div class="sec-meta">
        <div class="num">/ 09</div>
        <div class="label">The 26%</div>
      </div>
      <div>
        <h2 class="section-title">One in four respondents say they&rsquo;ve already arrived.</h2>
        <p class="section-lede">The already-FI cohort skews older, higher-earning, and more equity-heavy than the rest &mdash; but the gap is smaller than you might expect.</p>
      </div>
    </div>

    <div class="grid-2" style="grid-template-columns: 0.7fr 1.3fr; gap: 32px;">
      <div class="card card--navy" style="padding: 36px;">
        <div class="overline" style="color: rgba(255,255,255,0.7); margin-bottom: 16px;">Of respondents</div>
        <div class="bignum" style="color: white;">26<span class="unit" style="color: rgba(255,255,255,0.6)">%</span></div>
        <div style="margin-top: 24px; font-size:14px; color:rgba(255,255,255,0.72); line-height:1.55;">
          299 respondents identify as financially independent today &mdash; able to cover expenses from portfolio income indefinitely.
        </div>
        <div style="margin-top: 28px; padding-top: 24px; border-top:1px solid rgba(255,255,255,0.12); display: grid; grid-template-columns: 1fr 1fr; gap: 16px 24px; font-size:13px;">
          <div><div style="color:rgba(255,255,255,0.55); font-size:11px; letter-spacing:0.08em; text-transform:uppercase;">Still working</div><div style="font-size:20px; font-weight:500; margin-top:4px;">61%</div></div>
          <div><div style="color:rgba(255,255,255,0.55); font-size:11px; letter-spacing:0.08em; text-transform:uppercase;">Retired early</div><div style="font-size:20px; font-weight:500; margin-top:4px;">39%</div></div>
        </div>
      </div>

      <div class="card">
        <h3>FI cohort vs. everyone else</h3>
        <div class="card-sub">Median values by group. n = 299 (FI) / 850 (not yet).</div>
        <table class="dt" style="margin-top: 4px;">
          <thead><tr><th>Metric</th><th class="right">Already FI</th><th class="right">Not yet FI</th><th class="right">Delta</th></tr></thead>
          <tbody>
            <tr><td>Age</td><td class="num">52</td><td class="num">38</td><td class="num muted">+14y</td></tr>
            <tr><td>Net worth</td><td class="num">$3.4M</td><td class="num">$1.0M</td><td class="num muted">+$2.4M</td></tr>
            <tr><td>Annual expenses</td><td class="num">$92K</td><td class="num">$68K</td><td class="num muted">+$24K</td></tr>
            <tr><td>Savings rate</td><td class="num">31%</td><td class="num">41%</td><td class="num muted">−10pp</td></tr>
            <tr><td>Equity allocation</td><td class="num">68%</td><td class="num">82%</td><td class="num muted">−14pp</td></tr>
            <tr><td>Years saving</td><td class="num">22</td><td class="num">11</td><td class="num muted">+11y</td></tr>
            <tr><td>Inheritance received</td><td class="num">18%</td><td class="num">9%</td><td class="num muted">+9pp</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</section>

<!-- ============================================================== -->
<!-- NOTABLE FINDINGS                                              -->
<!-- ============================================================== -->
<section class="section section--alt" id="findings">
  <div class="shell">
    <div class="sec-head">
      <div class="sec-meta">
        <div class="num">/ 10</div>
        <div class="label">Notable findings</div>
      </div>
      <div>
        <h2 class="section-title">Five things the numbers don&rsquo;t say out loud.</h2>
        <p class="section-lede">Patterns that emerged from cross-tabs and free-text responses, surfaced here as plain prose.</p>
      </div>
    </div>

    <div class="grid-2" style="gap: 24px;">
      <div class="card">
        <div class="chip" style="margin-bottom: 16px;">Behavior</div>
        <p class="pull">Savings rate beats income at every age bracket.</p>
        <p style="color: var(--fg-2); font-size: 14px;">Holding age constant, the top-quartile saver out-accumulates the top-quartile earner by year ten. Income gets you to the starting line; rate gets you across.</p>
      </div>
      <div class="card">
        <div class="chip" style="margin-bottom: 16px;">Allocation</div>
        <p class="pull">The &ldquo;bond tent&rdquo; is talked about more than it&rsquo;s built.</p>
        <p style="color: var(--fg-2); font-size: 14px;">Only 11% of respondents within five years of FI hold more than 20% bonds. The talked-about glide path stays mostly aspirational.</p>
      </div>
      <div class="card">
        <div class="chip" style="margin-bottom: 16px;">Real estate</div>
        <p class="pull">Primary residence equity is the second-largest household asset.</p>
        <p style="color: var(--fg-2); font-size: 14px;">For owners (68%), median equity in primary residence is $340K. Outside the FI cohort, more than a third haven&rsquo;t reconciled whether to count it.</p>
      </div>
      <div class="card">
        <div class="chip" style="margin-bottom: 16px;">Wellbeing</div>
        <p class="pull">Crossing seven figures didn&rsquo;t move self-reported happiness.</p>
        <p style="color: var(--fg-2); font-size: 14px;">Above $250K net worth the relationship between net worth and a 1&ndash;10 self-reported happiness score is statistically flat. Job satisfaction matters more.</p>
      </div>
      <div class="card" style="grid-column: span 2;">
        <div class="chip" style="margin-bottom: 16px;">In their words</div>
        <p class="pull pull--accent">&ldquo;The number got smaller every year I got closer to it.&rdquo;</p>
        <p class="pull-attr">From 14 free-text responses describing the same phenomenon: as FI approached, planned spending fell, target shrank, and the goalposts moved inward rather than outward.</p>
      </div>
    </div>
  </div>
</section>

<!-- ============================================================== -->
<!-- METHODOLOGY DETAILS                                           -->
<!-- ============================================================== -->
<section class="section" id="methodology-details">
  <div class="shell">
    <div class="sec-head">
      <div class="sec-meta">
        <div class="num">/ 11</div>
        <div class="label">Methodology &amp; caveats</div>
      </div>
      <div>
        <h2 class="section-title">What this data is, and what it isn&rsquo;t.</h2>
        <p class="section-lede">Every figure on this page is self-reported by a self-selecting community sample. Read it as a portrait of this community in this moment, not a population estimate.</p>
      </div>
    </div>

    <div class="grid-3">
      <div>
        <h4 style="font-size:15px; font-weight:500; margin-bottom:8px;">Sample</h4>
        <p style="font-size:14px; color:var(--fg-2); line-height:1.55;">1,418 responses collected; 1,149 retained after removing partial completions (&lt;60%) and internally contradictory submissions.</p>
      </div>
      <div>
        <h4 style="font-size:15px; font-weight:500; margin-bottom:8px;">Self-selection</h4>
        <p style="font-size:14px; color:var(--fg-2); line-height:1.55;">Respondents are subreddit subscribers who chose to participate. Skews high-earning, US-based, tech-adjacent, and mid-career.</p>
      </div>
      <div>
        <h4 style="font-size:15px; font-weight:500; margin-bottom:8px;">Self-report</h4>
        <p style="font-size:14px; color:var(--fg-2); line-height:1.55;">No accounts linked or verified. Outliers and rounded answers were kept where plausible &mdash; we report medians where the distribution is heavy-tailed.</p>
      </div>
      <div>
        <h4 style="font-size:15px; font-weight:500; margin-bottom:8px;">Currency</h4>
        <p style="font-size:14px; color:var(--fg-2); line-height:1.55;">All figures in USD. International respondents (16%) converted at survey-day rates. Local cost-of-living not normalized.</p>
      </div>
      <div>
        <h4 style="font-size:15px; font-weight:500; margin-bottom:8px;">Comparisons across years</h4>
        <p style="font-size:14px; color:var(--fg-2); line-height:1.55;">Year-over-year shifts shouldn&rsquo;t be over-read &mdash; each year&rsquo;s sample is fresh, the question set evolves, and the community grows ~12% annually.</p>
      </div>
      <div>
        <h4 style="font-size:15px; font-weight:500; margin-bottom:8px;">Open data</h4>
        <p style="font-size:14px; color:var(--fg-2); line-height:1.55;">Anonymized response-level data is available in the linked CSV. Re-analysis encouraged; corrections welcome via the survey thread.</p>
      </div>
    </div>
  </div>
</section>
`;

document.getElementById('report-body').innerHTML = html;

})();
