# Druckübersicht zum Dienstplan-Entwurf: A4 quer, Tage untereinander, halbe Stunden 8–23 Uhr.
# Liest demand.txt, wishes.txt, plan.json und (falls da) bereitschaft.txt; schreibt dienstplan-druck.html.
# Zwei Druckarten: "1 Blatt breit" (Blätter untereinander anlegen) und "2 Blätter breit" (größer, Blätter nebeneinander).
import json,html,os,sys,datetime,collections
exec(open('solve.py').read().split("people=sorted")[0])
P=json.load(open('plan.json'));plan=P['plan'];hours=P['hours']
FULL={'Christina B':'Christina Brösel','Dieter Z':'Dieter Zander','Frank B':'Frank Brösel','Hans-Joachim K':'Hans-Joachim Koch','Karla K':'Karla Kazik','Klaus Z':'Klaus Zander','Manfred S':'Manfred Schoppmann','Reinhilde E':'Reinhilde Eggenstein','Ruth K':'Ruth Kazik','Steven L':'Steven Linley','Leon W':'Leon Wördemann'}
WD=['Mo','Di','Mi','Do','Fr','Sa','So']
KIND={'2026-12-02':'Aufbau','2026-12-03':'Aufbau','2026-12-14':'Abbau'}
LO,HI=8.0,23.0
ALL=slots(LO,HI)
TEILE=[slots(8,16),slots(15.5,23)]   # 2 Blätter breit: 30 min Überlappung als Klebekante
ZEILEN_JE_BLATT=int(sys.argv[1]) if len(sys.argv)>1 else 34
def dlabel(d):
    x=datetime.date.fromisoformat(d);return WD[x.weekday()],f"{x.day:02d}.{x.month:02d}."
def hm(v): h=int(v);m=int(round((v-h)*60));return f"{h}:{m:02d}" if m else f"{h}"
def hh(v): return f"{v:g}".replace('.',',')
def bereiche(sl):
    # zusammenhängende Halbstunden zu "a–b"
    out=[];sl=sorted(sl)
    for s in sl:
        if out and abs(out[-1][1]-s)<1e-9: out[-1][1]=s+H
        else: out.append([s,s+H])
    return ', '.join(f"{hm(a)}–{hm(b)}" for a,b in out)
# Wünsche je (Name,Tag): Halbstunde -> Art; Sperre gewinnt, sonst die beste Stufe
ART={'pref':3,'avai':2,'if_n':1,'unav':9}
wun=collections.defaultdict(dict);zone=collections.defaultdict(set)
for line in open('wishes.txt'):
    n,d,t,z,a,b=line.strip().split('|')
    if t!='unav': zone[(n,d)].add(z)
    for s in slots(float(a),float(b)):
        alt=wun[(n,d)].get(s)
        if alt=='unav': continue
        if t=='unav' or alt is None or ART[t]>ART[alt]: wun[(n,d)][s]=t
ber=collections.defaultdict(list)
if os.path.exists('bereitschaft.txt'):
    for line in open('bereitschaft.txt'):
        if line.strip():
            d,n,a,b=line.strip().split('|');ber[d].append((n,float(a),float(b)))
days=sorted(k for k in plan if not k.endswith('_gaps'))
GES={n:sum(b-a for d in days for m,a,b in plan[d] if m==n) for n in FULL}
GES_BER={n:sum(b-a for d in ber for m,a,b in ber[d] if m==n) for n in FULL}
def zonetext(n,d):
    z=zone[(n,d)]
    if d in KIND or not z: return ''
    return 'vorne+hinten' if 'B' in z or len(z)>1 else ('vorne' if 'V' in z else 'hinten')
tage=[]
for d in days:
    need={s:dem[d].get(s,(0,))[0] for s in ALL}
    offen=[s for s in ALL if need[s]>0]
    regel=bereiche(offen)
    gm={g[0]:g for g in plan[d+'_gaps']}
    dienst={n:(a,b) for n,a,b in plan[d]}
    leute=sorted({k[0] for k in wun if k[1]==d},key=lambda n:(n not in dienst,dienst.get(n,(99,))[0],n))
    rows=[]
    for n in leute:
        w=wun[(n,d)];a,b=dienst.get(n,(None,None))
        cells=[]
        for s in ALL:
            t=w.get(s);cl=[t or 'leer']
            if need[s]==0: cl.append('zu')
            txt=''
            if a is not None and a<=s<b:
                cl.append('dienst')
                if abs(s-a)<1e-9: cl.append('anf');txt=f"{hm(a)}–{hm(b)}"
                if abs(s+H-b)<1e-9: cl.append('end')
            elif t=='unav': txt='×'
            cells.append((s,' '.join(cl),txt))
        info=f"{hh(b-a)} h" if a is not None else ('gesperrt' if w and all(v=='unav' for v in w.values()) else 'nicht eingeplant')
        rows.append(('p',FULL[n],zonetext(n,d),info,cells,(hh(b-a) if a is not None else '–'),f"ges. {hh(GES[n])}"))
    for n,a,b in ber[d]:
        cells=[(s,'ber'+(' anf' if abs(s-a)<1e-9 else '')+(' zu' if need[s]==0 else '') if a<=s<b else ('leer zu' if need[s]==0 else 'leer'),f"{hm(a)}–{hm(b)}" if abs(s-a)<1e-9 else '') for s in ALL]
        rows.append(('b',FULL[n],'Bereitschaft','Vorschlag',cells,hh(b-a),'Bereitsch.'))
    fehl=sum(g[3]*H for g in plan[d+'_gaps'])
    bes={s:(gm[s][2] if s in gm else 0) for s in ALL}
    ueber=sum(max(0,bes[s]-need[s])*H for s in ALL);einpl=sum(min(bes[s],need[s])*H for s in ALL)
    rows.append(('s','Bedarf / besetzt','Personen je halbe Stunde','',[(s,'sum'+(' zu' if need[s]==0 else ''),f"{need[s]}/{bes[s]}" if need[s] or bes[s] else '') for s in ALL],hh(sum(need.values())*H),'Bedarf'))
    def ampel(s):
        x=bes[s]-need[s]
        if not need[s] and not bes[s]: return (s,'leer zu','')
        return (s,'a-rot' if x<0 else 'a-gelb' if x>0 else 'a-gruen',f"−{-x}" if x<0 else f"+{x}" if x>0 else '✓')
    rows.append(('f','Ampel','rot fehlt · grün passt · gelb zu viel','',[ampel(s) for s in ALL],('−'+hh(fehl)) if fehl else '✓',('+'+hh(ueber)+' über') if ueber else 'Std.'))
    wt,dt=dlabel(d)
    tage.append(dict(d=d,wt=wt,dt=dt,kind=KIND.get(d,'Markttag'),regel=regel,regelstd=len(offen)*H,rows=rows,fehl=fehl,ueber=ueber,einpl=einpl,bedarf=sum(need.values())*H))
# Tage auf Blätter verteilen (beide Druckarten nutzen dieselbe Aufteilung, damit die Teile zusammenpassen)
blaetter=[[]];n=0
for t in tage:
    z=len(t['rows'])+0.6
    if blaetter[-1] and n+z>ZEILEN_JE_BLATT: blaetter.append([]);n=0
    blaetter[-1].append(t);n+=z
NB=len(blaetter)
def kopf(teil):
    rechts=teil[-1]==ALL[-1]
    cols=''.join(f'<col class="c">' for _ in teil)+('<col class="std">' if rechts else '')
    th=''.join(f'<th class="t{" voll" if abs(s-int(s))<1e-9 else ""}">{int(s) if abs(s-int(s))<1e-9 else ""}</th>' for s in teil)
    return f'<colgroup><col class="tag"><col class="wer">{cols}</colgroup><thead><tr><th class="tag">Tag · Regelzeit</th><th class="wer">Mitglied</th>{th}{'<th class="std">Std.</th>' if rechts else ''}</tr></thead>'
def tabelle(bl,teil):
    idx=set(teil);body=[];rechts=teil[-1]==ALL[-1]
    for t in bl:
        rs=t['rows']
        for i,(art,name,sub,info,cells,std,stdklein) in enumerate(rs):
            tr=[]
            if i==0:
                tr.append(f'<th class="tag" rowspan="{len(rs)}"><b>{t["wt"]} {t["dt"]}</b><span class="kind">{t["kind"]}</span><span class="regel">{t["regel"]} Uhr</span><span class="rstd">Regelzeit {hh(t["regelstd"])} Std.</span><span class="zahl">Bedarf {hh(t["bedarf"])} Std.</span><span class="zahl">eingeplant {hh(t["einpl"])} Std.</span><span class="bil {"rot" if t["fehl"] else "gruen"}">{"● fehlt "+hh(t["fehl"])+" Std." if t["fehl"] else "● richtig besetzt"}</span>{f'<span class="bil gelb">● {hh(t["ueber"])} Std. zu viel</span>' if t["ueber"] else ""}</th>')
            tr.append(f'<th class="wer {art}">{html.escape(name)}<small>{html.escape(" · ".join(x for x in (sub,info) if x))}</small></th>')
            vis=[c for c in cells if c[0] in idx]
            for j,(s,cl,txt) in enumerate(vis):
                if j==0 and 'dienst' in cl and 'anf' not in cl:
                    # Dienst läuft vom linken Blatt herüber: Zeit noch einmal zeigen
                    txt=next(c[2] for c in cells if 'anf' in c[1] and 'dienst' in c[1])
                tr.append(f'<td class="{cl}"><span>{html.escape(txt)}</span></td>' if txt else f'<td class="{cl}"></td>')
            if rechts: tr.append(f'<td class="std {art}"><b>{html.escape(std)}</b><small>{html.escape(stdklein)}</small></td>')
            body.append(f'<tr class="z {art}{" erste" if i==0 else ""}">{"".join(tr)}</tr>')
    return f'<table class="raster">{kopf(teil)}<tbody>{"".join(body)}</tbody></table>'
def fuss(i,seite,nseiten):
    teile=[]
    if nseiten>1: teile.append('Blatt '+str(i+1)+(' links' if seite==0 else ' rechts'))
    else: teile.append(f'Blatt {i+1} von {NB}')
    if nseiten>1 and seite==0: teile.append('rechts an Blatt '+str(i+1)+' rechts anlegen (Klebekante 15:30–16 Uhr)')
    if nseiten>1 and seite==1: teile.append('linken Rand bis zur Klebekante umknicken, auf Blatt '+str(i+1)+' links legen')
    if i<NB-1: teile.append(f'unten geht es mit Blatt {i+2} weiter')
    return ' · '.join(teile)
LEG='''<div class="leg"><span><i class="pref"></i>Wunschzeit</span><span><i class="avai"></i>kann</span><span><i class="if_n"></i>nur wenn nötig</span><span><i class="unav">×</i>gesperrt</span><span><i class="dienst"></i>im Entwurf eingeplant</span><span><i class="ber"></i>Bereitschaft (Vorschlag)</span><span><i class="a-rot">−2</i>fehlen</span><span><i class="a-gruen">✓</i>richtig besetzt</span><span><i class="a-gelb">+1</i>zu viel</span><span><i class="zu"></i>kein Bedarf</span></div>'''
def blatt(bl,i,teil,seite,nseiten):
    titel=f'<header class="bk"><div><p class="eb">KC Club · Weihnachtsmarkt Werne 2026 · Entwurf, nicht veröffentlicht · Stand {datetime.date.today():%d.%m.%Y}</p><h1>Dienstplan 02.–14.12.2026 – Wünsche und offene Zeiten</h1></div>{LEG}</header>'
    return f'<section class="blatt">{titel}{tabelle(bl,teil)}<footer class="fuss">{fuss(i,seite,nseiten)}</footer></section>'
def uebersicht():
    # Stunden je Person über alle Tage (Entwurf), dazu Bereitschaft und je Tag die Ampel
    leute=sorted([n for n in FULL if GES[n] or GES_BER[n] or any(k[0]==n for k in wun)],key=lambda n:(-GES[n],FULL[n]))
    tg={d:{m:b-a for m,a,b in plan[d]} for d in days}
    kopf=''.join(f'<th>{t["wt"]}<small>{t["dt"]}</small></th>' for t in tage)
    zeilen=''.join(f'<tr><td>{html.escape(FULL[n])}</td>'+''.join(f'<td class="{"" if n in tg[d] else "leer"}">{hh(tg[d][n]) if n in tg[d] else "–"}</td>' for d in days)
        +f'<td class="ges">{hh(GES[n])}</td><td>{hh(GES_BER[n]) if GES_BER[n] else "–"}</td></tr>' for n in leute)
    alle=sum(GES.values())
    zeilen+='<tr class="alle"><td>Alle zusammen</td>'+''.join(f'<td>{hh(sum(tg[d].values()))}</td>' for d in days)+f'<td class="ges">{hh(alle)}</td><td>{hh(sum(GES_BER.values()))}</td></tr>'
    zeilen+='<tr class="bed"><td>Bedarf</td>'+''.join(f'<td>{hh(t["bedarf"])}</td>' for t in tage)+f'<td class="ges">{hh(sum(t["bedarf"] for t in tage))}</td><td></td></tr>'
    amp=lambda t:('rot',f'−{hh(t["fehl"])}') if t["fehl"] else ('gelb',f'+{hh(t["ueber"])}') if t["ueber"] else ('gruen','✓')
    zeilen+='<tr><td>Ampel (fehlt / zu viel)</td>'+''.join(f'<td class="{amp(t)[0]}">{amp(t)[1]}{f"<small>+{hh(t["ueber"])}</small>" if t["fehl"] and t["ueber"] else ""}</td>' for t in tage)
    tf=sum(t["fehl"] for t in tage);tu=sum(t["ueber"] for t in tage)
    zeilen+=f'<td class="ges rot">−{hh(tf)}</td><td>{f"+{hh(tu)} zu viel" if tu else ""}</td></tr>'
    titel=f'<header class="bk"><div><p class="eb">KC Club · Weihnachtsmarkt Werne 2026 · Entwurf, nicht veröffentlicht · Stand {datetime.date.today():%d.%m.%Y}</p><h1>Stunden je Person – alle Tage</h1></div></header>'
    return f'<section class="blatt">{titel}<table class="sum-tab"><thead><tr><th>Mitglied</th>{kopf}<th class="ges">Gesamt</th><th>Bereitschaft<small>Vorschlag</small></th></tr></thead><tbody>{zeilen}</tbody></table><p class="eb" style="margin-top:3mm;text-transform:none;letter-spacing:0">Stunden laut Entwurf (eingeplante Dienste). Bereitschaft zählt nicht mit. Ampel je Tag: rot = so viele Personenstunden fehlen, gelb = zu viel eingeplant, grün = richtig besetzt.</p><footer class="fuss">Stundenübersicht · letztes Blatt</footer></section>'
UEB=uebersicht()
eins=''.join(blatt(bl,i,ALL,0,1) for i,bl in enumerate(blaetter))+UEB
zwei=''.join(blatt(bl,i,teil,k,2) for i,bl in enumerate(blaetter) for k,teil in enumerate(TEILE))+UEB
tot_b=sum(t['bedarf'] for t in tage);tot_f=sum(t['fehl'] for t in tage)
page=f'''<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dienstplan Druckübersicht</title>
<style>
/* Druckblatt: Tage als Zeilengruppen, halbe Stunden als Spalten; Farben werden mitgedruckt */
:root{{--bg:#f3f1ec;--paper:#fff;--ink:#1f1b18;--muted:#6b625a;--line:#cfc7ba;--pref:#7fbf94;--avai:#cfe8d6;--ifn:#f6dc8f;--unav:#d9d4ce;--dienst:#1f5a3e;--ber:#3d5fa8;--fehlt:#d93a2f;--fehltbg:#fbd5d0;--zu:#ece9e4;--accent:#8a2c1f}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#1b1816;--paper:#24201d;--ink:#efe8de;--muted:#a99c8e;--line:#4a423b;--pref:#3f7e58;--avai:#2c4a3a;--ifn:#7a6526;--unav:#4a4541;--dienst:#8fd3ae;--ber:#8fb0f0;--fehlt:#ff8a7f;--fehltbg:#5a2724;--zu:#2b2724;--accent:#e08a74;color-scheme:dark}}}}
:root[data-theme="dark"]{{--bg:#1b1816;--paper:#24201d;--ink:#efe8de;--muted:#a99c8e;--line:#4a423b;--pref:#3f7e58;--avai:#2c4a3a;--ifn:#7a6526;--unav:#4a4541;--dienst:#8fd3ae;--ber:#8fb0f0;--fehlt:#ff8a7f;--fehltbg:#5a2724;--zu:#2b2724;--accent:#e08a74;color-scheme:dark}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--ink);font:14px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:16px}}
.bar{{max-width:1120px;margin:0 auto 16px;display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center}}
.bar h2{{margin:0;font-size:1.15rem}}.bar p{{margin:0;color:var(--muted);max-width:70ch}}
.bar .knoepfe{{display:flex;flex-wrap:wrap;gap:8px}}
.bar button{{font:600 .95rem system-ui;padding:8px 14px;border-radius:6px;border:1px solid var(--line);background:var(--paper);color:var(--ink);cursor:pointer}}
.bar button[aria-pressed="true"]{{background:var(--ink);color:var(--paper);border-color:var(--ink)}}
.bar button:focus-visible{{outline:2px solid var(--accent);outline-offset:2px}}
.art{{display:none}}body[data-art="1"] .art1,body[data-art="2"] .art2{{display:block}}
.blatt{{background:var(--paper);width:297mm;max-width:100%;margin:0 auto 18px;padding:7mm;box-shadow:0 1px 4px rgb(0 0 0/.12);overflow-x:auto}}
.bk{{display:flex;justify-content:space-between;align-items:flex-end;gap:4mm;flex-wrap:wrap;margin-bottom:2mm}}
.eb{{margin:0;font-size:7pt;color:var(--muted);letter-spacing:.04em;text-transform:uppercase}}
h1{{margin:0;font-size:12pt}}
.leg{{display:flex;flex-wrap:wrap;gap:1mm 3mm;font-size:7pt;color:var(--muted)}}
.leg i{{display:inline-block;min-width:5mm;height:3mm;vertical-align:-.4mm;margin-right:1mm;font-style:normal;font-size:6.5pt;line-height:3mm;text-align:center;border:.2mm solid var(--line)}}
.leg i.pref{{background:var(--pref)}}.leg i.avai{{background:var(--avai)}}.leg i.if_n{{background:var(--ifn)}}.leg i.unav{{background:var(--unav)}}.leg i.dienst{{background:var(--dienst)}}.leg i.ber{{background:repeating-linear-gradient(45deg,var(--ber) 0 .6mm,transparent .6mm 1.4mm)}}.leg i.fehlt{{background:var(--fehltbg);color:var(--fehlt);font-weight:700}}.leg i.zu{{background:var(--zu)}}
table.raster{{border-collapse:collapse;table-layout:fixed;width:100%;min-width:250mm;font-size:6.5pt}}
.art2 table.raster{{font-size:7.5pt}}
col.tag{{width:24mm}}col.wer{{width:30mm}}col.std{{width:12mm}}
.raster th,.raster td{{border:.15mm solid var(--line);padding:0;height:5.4mm;font-variant-numeric:tabular-nums}}
.art2 .raster th,.art2 .raster td{{height:5.6mm}}
.raster thead th{{font-weight:600;font-size:6.5pt;color:var(--muted);text-align:left;padding-left:.5mm;height:4mm}}
.raster thead th.t{{border-left-color:transparent}}.raster thead th.t.voll{{border-left:.3mm solid var(--ink);color:var(--ink)}}
.raster th.tag{{text-align:left;vertical-align:top;padding:1mm;border-right:.4mm solid var(--ink);font-weight:400}}
th.tag b{{display:block;font-size:8.5pt}}th.tag span{{display:block;font-size:6.5pt;line-height:1.25}}
th.tag .kind{{color:var(--muted);text-transform:uppercase;letter-spacing:.04em}}th.tag .regel{{font-weight:700;margin-top:.6mm}}
th.tag .bil{{margin-top:.6mm}}th.tag .bil.rot{{color:var(--fehlt);font-weight:700}}
th.wer{{text-align:left;padding:0 1mm;white-space:nowrap;overflow:hidden;font-weight:600;line-height:1.05}}
th.wer small{{display:block;font-weight:400;font-size:5.5pt;color:var(--muted)}}
th.wer.s,th.wer.f,th.wer.b{{font-weight:600}}th.wer.f{{color:var(--fehlt)}}th.wer.b{{color:var(--ber)}}
tr.erste>*{{border-top:.6mm solid var(--ink)}}
td{{position:relative;overflow:visible;text-align:center;white-space:nowrap}}
td.zu{{background:var(--zu)}}
td.pref{{background:var(--pref)}}td.avai{{background:var(--avai)}}td.if_n{{background:var(--ifn)}}
td.unav{{background:var(--unav);color:var(--muted)}}
td.dienst{{box-shadow:inset 0 1.1mm 0 var(--dienst),inset 0 -1.1mm 0 var(--dienst)}}
td.dienst.anf{{box-shadow:inset 0 1.1mm 0 var(--dienst),inset 0 -1.1mm 0 var(--dienst),inset .8mm 0 0 var(--dienst)}}
td.dienst.end{{box-shadow:inset 0 1.1mm 0 var(--dienst),inset 0 -1.1mm 0 var(--dienst),inset -.8mm 0 0 var(--dienst)}}
td.dienst.anf.end{{box-shadow:inset 0 0 0 .8mm var(--dienst)}}
td.dienst span,td.ber span{{position:absolute;left:1mm;top:50%;transform:translateY(-50%);z-index:1;font-weight:700;font-size:6pt;padding:0 .6mm;background:var(--paper);color:var(--dienst);border-radius:.6mm}}
td.ber{{background:repeating-linear-gradient(45deg,color-mix(in srgb,var(--ber) 45%,transparent) 0 .6mm,transparent .6mm 1.4mm)}}
td.ber span{{color:var(--ber)}}
tr.s td{{font-size:5.5pt;color:var(--muted)}}
td.a-rot{{background:var(--fehltbg);color:var(--fehlt);font-weight:800;font-size:7pt}}
td.a-gruen{{background:#d4ecd9;color:#1f5a3e;font-weight:700;font-size:6pt}}
td.a-gelb{{background:#fde7b0;color:#8a5a00;font-weight:800;font-size:7pt}}
.leg i.a-rot{{background:var(--fehltbg);color:var(--fehlt);font-weight:700}}.leg i.a-gruen{{background:#d4ecd9;color:#1f5a3e}}.leg i.a-gelb{{background:#fde7b0;color:#8a5a00;font-weight:700}}
.raster th.std{{text-align:center;padding:0;border-left:.4mm solid var(--ink)}}
td.std{{border-left:.4mm solid var(--ink);line-height:1;font-variant-numeric:tabular-nums}}td.std b{{display:block;font-size:7.5pt}}td.std small{{display:block;font-size:5pt;color:var(--muted)}}
td.std.f b{{color:var(--fehlt)}}td.std.b b{{color:var(--ber)}}
th.tag .rstd{{color:var(--muted)}}th.tag .zahl{{color:var(--muted)}}th.tag .bil.gruen{{color:#1f5a3e;font-weight:700}}th.tag .bil.gelb{{color:#8a5a00;font-weight:700}}
.sum-tab{{border-collapse:collapse;width:100%;font-size:8pt;font-variant-numeric:tabular-nums;margin-top:3mm}}
.sum-tab th,.sum-tab td{{border:.15mm solid var(--line);padding:1.2mm 1.5mm;text-align:center}}
.sum-tab th:first-child,.sum-tab td:first-child{{text-align:left;white-space:nowrap}}
.sum-tab thead th{{background:#f3e9dc;font-weight:700}}.sum-tab small{{display:block;font-weight:400;color:var(--muted);font-size:6.5pt}}
.sum-tab td.ges,.sum-tab th.ges{{border-left:.5mm solid var(--ink);font-weight:800}}
.sum-tab tr.alle td{{border-top:.6mm solid var(--ink);font-weight:800}}.sum-tab tr.bed td{{color:var(--muted)}}
.sum-tab td.rot{{background:var(--fehltbg);color:var(--fehlt);font-weight:800}}.sum-tab td.gruen{{background:#d4ecd9;color:#1f5a3e;font-weight:700}}.sum-tab td.gelb{{background:#fde7b0;color:#8a5a00}}
.sum-tab td.leer{{color:#c9c2b8}}
.fuss{{margin-top:1.5mm;font-size:7pt;color:var(--muted);display:flex;justify-content:space-between;border-top:.3mm dashed var(--muted);padding-top:1mm}}
.anl{{max-width:1120px;margin:0 auto;color:var(--muted)}}
@page{{size:A4 landscape;margin:0}}
@media print{{
  :root{{--bg:#fff;--paper:#fff;--ink:#1f1b18;--muted:#5d554e;--line:#bdb5a8;--pref:#7fbf94;--avai:#cfe8d6;--ifn:#f6dc8f;--unav:#d9d4ce;--dienst:#1f5a3e;--ber:#3d5fa8;--fehlt:#c62a1f;--fehltbg:#fbd0ca;--zu:#ebe8e3;color-scheme:light}}
  *{{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  body{{padding:0;background:#fff}}.bar,.anl{{display:none}}
  .blatt{{width:297mm;height:210mm;margin:0;box-shadow:none;overflow:hidden;break-after:page}}
  .blatt:last-child{{break-after:auto}}
}}
</style></head>
<body data-art="1">
<div class="bar"><h2>Druckübersicht Dienstplan</h2>
<div class="knoepfe" role="group" aria-label="Druckart"><button type="button" data-a="1" aria-pressed="true">1 Blatt breit ({NB+1} Blätter)</button><button type="button" data-a="2" aria-pressed="false">2 Blätter breit, größer ({NB*2+1} Blätter)</button><button type="button" id="drucken">🖨 Drucken</button></div>
<p>Drucken mit „A4 Querformat“, Ränder „Keine“, „Hintergrundgrafiken“ einschalten. Bedarf {hh(tot_b)} Std., davon fehlen noch {hh(tot_f)} Std. (rot).</p></div>
<div class="art art1">{eins}</div><div class="art art2">{zwei}</div>
<p class="anl">Eingeplant = Entwurf aus allen Wünschen (noch nicht in DP2 übernommen). Bereitschaft = Vorschlag aus den Rückmeldungen, noch nicht abgesprochen.</p>
<script>
const knoepfe=document.querySelectorAll('[data-a]');
function art(a){{document.body.dataset.art=a;knoepfe.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.a===a)));try{{localStorage.setItem('dp-druckart',a)}}catch(e){{}}}}
knoepfe.forEach(b=>b.addEventListener('click',()=>art(b.dataset.a)));
try{{const a=localStorage.getItem('dp-druckart');if(a==='1'||a==='2')art(a)}}catch(e){{}}
document.getElementById('drucken').addEventListener('click',()=>window.print());
</script></body></html>'''
open('dienstplan-druck.html','w').write(page)
print(NB,'Blätter',[len(b) for b in blaetter],len(page))
# Kurzform für die Club App (Archiv → Mein Ordner → Dienstplan-Druck): dp-druck.json, nur lokal, wird beim Admin
# in kc_club_person_einstellung „dp_druck“ abgelegt. Die App zeichnet daraus dieselben Blätter.
WK={'pref':'p','avai':'a','if_n':'i','unav':'u'}
kurz={'v':1,'titel':'Weihnachtsmarkt Werne 2026','stand':datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),'von':LO,'bis':HI,'tage':[]}
for d in days:
    gm={g[0]:g for g in plan[d+'_gaps']};dienst={n:(a,b) for n,a,b in plan[d]}
    leute=sorted({k[0] for k in wun if k[1]==d},key=lambda n:(n not in dienst,dienst.get(n,(99,))[0],n))
    kurz['tage'].append({'d':d,'art':KIND.get(d,'Markttag'),
        'bedarf':[dem[d].get(s,(0,))[0] for s in ALL],'besetzt':[gm[s][2] if s in gm else 0 for s in ALL],'fehlt':[gm[s][3] if s in gm else 0 for s in ALL],
        'leute':[{'n':FULL[n],'z':zonetext(n,d),'w':''.join(WK.get(wun[(n,d)].get(s),'-') for s in ALL),'s':list(dienst[n]) if n in dienst else None} for n in leute],
        'ber':[{'n':FULL[n],'s':[a,b]} for n,a,b in ber[d]]})
open('dp-druck.json','w').write(json.dumps(kurz,ensure_ascii=False,separators=(',',':')))
print('dp-druck.json',len(json.dumps(kurz,ensure_ascii=False,separators=(',',':'))))
# Ablegen beim Admin (Hansi, KC-P-002): dp-druck.sql in Supabase ausführen (nur lokal, personenbezogen – nicht ins Repo)
open('dp-druck.sql','w').write("insert into public.kc_club_person_einstellung (person_id, schluessel, wert, geaendert_am) values ('KC-P-002', 'dp_druck', $dp$"
    +json.dumps(kurz,ensure_ascii=False,separators=(',',':'))+"$dp$::jsonb, now()) on conflict (person_id, schluessel) do update set wert = excluded.wert, geaendert_am = excluded.geaendert_am;\n")
