import json,html,collections
exec(open('solve.py').read().split("people=sorted")[0])
P=json.load(open('plan.json'));plan=P['plan'];hours=P['hours']
FULL={'Christina B':'Christina Brösel','Dieter Z':'Dieter Zander','Frank B':'Frank Brösel','Hans-Joachim K':'Hans-Joachim Koch','Karla K':'Karla Kazik','Klaus Z':'Klaus Zander','Manfred S':'Manfred Schoppmann','Reinhilde E':'Reinhilde Eggenstein','Ruth K':'Ruth Kazik','Steven L':'Steven Linley'}
WD=['Mo','Di','Mi','Do','Fr','Sa','So']
import datetime
def dlabel(d):
    x=datetime.date.fromisoformat(d);return f"{WD[x.weekday()]} {x.day:02d}.{x.month:02d}."
KIND={'2026-12-02':'Aufbau','2026-12-03':'Aufbau','2026-12-14':'Abbau'}
def hm(v): h=int(v);m=int(round((v-h)*60));return f"{h}:{m:02d}" if m else f"{h}"
def hh(v): return (f"{v:g}".replace('.',','))
days=sorted(k for k in plan if not k.endswith('_gaps'))
tot_need=sum(v[0]*H for d in dem for v in dem[d].values())
tot_plan=sum(hours.values());tot_gap=sum(g[3]*H for d in days for g in plan[d+'_gaps'])
out=[]
for d in days:
    sl=sorted(dem[d]);lo=sl[0];hi=sl[-1]+H
    shifts=sorted(plan[d],key=lambda x:(x[1],x[0]))
    need=sum(dem[d][s][0]*H for s in sl);gap=sum(g[3]*H for g in plan[d+'_gaps'])
    gapmap={g[0]:g for g in plan[d+'_gaps']}
    ncol=int(round((hi-lo)/H))
    head=''.join(f'<th class="t" colspan="2">{int(lo+i)}</th>' for i in range(int(round(hi-lo))))
    rows=[]
    for n,a,b in shifts:
        cells=[];x=lo
        lv=[av[(n,d)][s][0] for s in slots(a,b)];zs={av[(n,d)][s][1] for s in slots(a,b)}
        kind='p' if min(lv)==3 else ('i' if min(lv)==1 else 'a')
        while x<hi-1e-9:
            if a<=x<b:
                span=int(round((b-a)/H))
                cells.append(f'<td class="bar {kind}" colspan="{span}"><span>{hm(a)}–{hm(b)}</span></td>');x=b;continue
            ok=x in av[(n,d)];cells.append(f'<td class="{"free" if ok else ""}"></td>');x+=H
        z='/'.join(sorted(zs)).replace('B','V+H')
        rows.append(f'<tr><th class="who">{html.escape(FULL[n])}<small>{z if d not in KIND else ""}</small></th>{"".join(cells)}</tr>')
    def line(label,fn,cls):
        return f'<tr class="{cls}"><th class="who">{label}</th>'+''.join(f'<td>{fn(s)}</td>' for s in sl)+'</tr>'
    def gapcell(s):
        g=gapmap[s];m=g[3]
        if m>0: return f'<b class="gap">−{m}</b>'
        if (g[4] or 0)+(g[5] or 0)>0: return '<b class="vh">V/H</b>'
        return ''
    tbl=f'''<div class="scroll"><table class="grid"><thead><tr><th></th>{head}</tr></thead><tbody>{''.join(rows)}
{line('Bedarf',lambda s:dem[d][s][0],'sum')}{line('Eingeplant',lambda s:gapmap[s][2],'sum')}{line('Fehlt',gapcell,'sum miss')}</tbody></table></div>'''
    status='ok' if gap==0 else ('warn' if gap<=5 else 'bad')
    out.append(f'''<section class="day" id="t{d[-2:]}"><header><h2>{dlabel(d)} <span class="kind">{KIND.get(d,'Markttag')}</span></h2>
<p class="nums"><span>Bedarf <b>{hh(need)} h</b></span><span>eingeplant <b>{hh(need-gap)} h</b></span><span class="pill {status}">{'voll besetzt' if gap==0 else f'fehlt {hh(gap)} h'}</span></p></header>{tbl}</section>''')
order=sorted(hours,key=lambda n:-hours[n])
mx=max(hours.values())
ptab=''.join(f'<tr><th>{html.escape(FULL[n])}</th><td class="num">{hh(hours[n])} h</td><td class="meter"><i style="width:{hours[n]/mx*100:.0f}%"></i></td><td class="num">{sum(1 for d in days for x in plan[d] if x[0]==n)}</td></tr>' for n in order)
chips=''.join(f'<a class="chip {("ok" if g==0 else "warn" if g<=5 else "bad")}" href="#t{d[-2:]}">{dlabel(d)}<b>{"✓" if g==0 else "−"+hh(g)}</b></a>' for d in days for g in [sum(x[3]*H for x in plan[d+'_gaps'])])
page=f'''<title>Dienstplan-Entwurf Weihnachtsmarkt</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Source+Sans+3:wght@400;600;700&family=IBM+Plex+Mono:wght@500&display=swap">
<style>
/* Layout: Planer-Blatt – Kopf mit Bilanz, Tagesleiste, je Tag ein Zeitraster (halbe Stunden) mit Bedarf/Eingeplant/Fehlt */
:root{{--bg:#f6f4ef;--paper:#fffdf8;--ink:#2a2420;--muted:#6f655c;--line:#e3dccf;--accent:#8a2c1f;--pref:#2f6b4f;--avai:#5d8a74;--ifn:#c08a2d;--gap:#b3261e;--gapbg:#fbe4e1;--free:#eef3ee;
--display:"Fraunces",Georgia,serif;--body:"Source Sans 3",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,monospace}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#1b1816;--paper:#24201d;--ink:#efe8de;--muted:#a99c8e;--line:#3a332d;--accent:#e08a74;--pref:#5fae86;--avai:#4b7d66;--ifn:#d4a54a;--gap:#ff8a7f;--gapbg:#4a2421;--free:#22302a;color-scheme:dark}}}}
:root[data-theme="dark"]{{--bg:#1b1816;--paper:#24201d;--ink:#efe8de;--muted:#a99c8e;--line:#3a332d;--accent:#e08a74;--pref:#5fae86;--avai:#4b7d66;--ifn:#d4a54a;--gap:#ff8a7f;--gapbg:#4a2421;--free:#22302a;color-scheme:dark}}
body{{background:var(--bg);color:var(--ink);font:16px/1.5 var(--body);padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:24px 48px}}
main{{max-width:1180px;margin:0 auto;display:grid;gap:28px}}
h1,h2{{font-family:var(--display);font-weight:600;text-wrap:balance;margin:0}}
h1{{font-size:clamp(1.7rem,4vw,2.4rem);line-height:1.15}}
h2{{font-size:1.35rem}}
.eyebrow{{font:600 .78rem var(--body);letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin:0 0 6px}}
.lead{{max-width:68ch;color:var(--muted);margin:10px 0 0}}
.balance{{display:flex;flex-wrap:wrap;gap:12px 32px;align-items:baseline;border-top:2px solid var(--ink);border-bottom:1px solid var(--line);padding-block:14px}}
.balance div{{display:grid}}.balance small{{color:var(--muted);font-size:.85rem}}
.balance b{{font:600 1.8rem var(--display);font-variant-numeric:tabular-nums}}.balance .neg b{{color:var(--gap)}}
.chips{{display:flex;flex-wrap:wrap;gap:8px}}
.chip{{display:inline-flex;gap:8px;align-items:center;padding:6px 10px;border:1px solid var(--line);border-radius:6px;background:var(--paper);color:var(--ink);text-decoration:none;font-size:.9rem;font-variant-numeric:tabular-nums}}
.chip b{{font-family:var(--mono);font-size:.82rem}}.chip.ok b{{color:var(--pref)}}.chip.warn b{{color:var(--ifn)}}.chip.bad b{{color:var(--gap)}}
.chip:focus-visible,a:focus-visible{{outline:2px solid var(--accent);outline-offset:2px}}
.legend{{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:.88rem;color:var(--muted)}}
.legend i{{display:inline-block;width:22px;height:12px;border-radius:3px;vertical-align:-1px;margin-right:6px}}
.day{{background:var(--paper);border:1px solid var(--line);border-radius:8px;padding:16px;display:grid;gap:12px;min-width:0}}
.day header{{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;align-items:baseline}}
.kind{{font:600 .75rem var(--body);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-left:6px}}
.nums{{display:flex;flex-wrap:wrap;gap:6px 16px;margin:0;font-size:.92rem;color:var(--muted);font-variant-numeric:tabular-nums}}.nums b{{color:var(--ink)}}
.pill{{padding:1px 10px;border-radius:999px;font-weight:700;font-size:.85rem}}.pill.ok{{background:var(--free);color:var(--pref)}}.pill.warn{{background:var(--gapbg);color:var(--ifn)}}.pill.bad{{background:var(--gapbg);color:var(--gap)}}
.scroll{{overflow-x:auto}}
table.grid{{border-collapse:collapse;font-size:.82rem;min-width:100%;table-layout:fixed}}
.grid th,.grid td{{border-bottom:1px solid var(--line);height:28px;padding:0;text-align:center;font-variant-numeric:tabular-nums}}
.grid td{{width:22px;min-width:22px;border-left:1px dotted var(--line)}}
.grid th.t{{font:500 .75rem var(--mono);color:var(--muted);text-align:left;padding-left:2px;border-left:1px solid var(--line)}}
.grid th.who{{text-align:left;white-space:nowrap;padding-right:12px;font-weight:600;width:170px;position:sticky;left:0;background:var(--paper);z-index:1}}
.grid th.who small{{display:block;font:500 .7rem var(--mono);color:var(--muted);line-height:1}}
.grid td.free{{background:var(--free)}}
.grid td.bar{{color:#fff;font-weight:700;white-space:nowrap;overflow:hidden;border-radius:4px;border-left:0}}
.grid td.bar span{{font:500 .74rem var(--mono)}}
.bar.p{{background:var(--pref)}}.bar.a{{background:var(--avai)}}.bar.i{{background:var(--ifn)}}
.grid tr.sum th,.grid tr.sum td{{font:500 .74rem var(--mono);color:var(--muted);height:22px}}
.grid tr.sum:first-of-type th{{border-top:2px solid var(--line)}}
.grid tr.miss td .gap{{color:var(--gap)}}.grid tr.miss td:has(.gap){{background:var(--gapbg)}}.grid .vh{{color:var(--ifn);font-size:.65rem}}
.two{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:20px}}
.box{{background:var(--paper);border:1px solid var(--line);border-radius:8px;padding:16px;min-width:0}}
.box h2{{font-size:1.15rem;margin-bottom:10px}}
.ptab{{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}}.ptab th,.ptab td{{padding:5px 6px;border-bottom:1px solid var(--line);text-align:left}}
.ptab .num{{text-align:right;white-space:nowrap}}.ptab .meter{{width:40%}}.ptab .meter i{{display:block;height:8px;border-radius:4px;background:var(--accent)}}
.box ul{{margin:0;padding-left:18px;display:grid;gap:6px}}
@media (max-width:520px){{.grid th.who{{width:120px;font-size:.78rem}}}}
</style>
<main>
<header><p class="eyebrow">KC DP2 · Weihnachtsmarkt Werne 2026 · Vorschlag, nicht veröffentlicht</p>
<h1>Dienstplan-Entwurf 02.–14.12.2026</h1>
<p class="lead">Gerechnet aus dem Bedarf (Supabase V13, 543 Personalstunden) und den Wunschplänen von 10 Mitgliedern aus der Club App. Jede Person hat höchstens einen zusammenhängenden Dienst am Tag, höchstens 8 Stunden. Zuerst Wunschzeiten, dann „kann“, „nur wenn nötig“ ganz zuletzt.</p></header>
<div class="balance"><div><small>Bedarf</small><b>{hh(tot_need)} h</b></div><div><small>eingeplant (ohne Überhang)</small><b>{hh(tot_need-tot_gap)} h</b></div><div class="neg"><small>offen</small><b>{hh(tot_gap)} h</b></div><div><small>davon mit den Wünschen gar nicht besetzbar</small><b>84 h</b></div><div><small>Mitglieder mit Wünschen</small><b>10 von 18</b></div></div>
<nav class="chips" aria-label="Tage">{chips}</nav>
<div class="legend"><span><i style="background:var(--pref)"></i>Dienst in Wunschzeit</span><span><i style="background:var(--avai)"></i>Dienst in „kann“-Zeit</span><span><i style="background:var(--ifn)"></i>enthält „nur wenn nötig“</span><span><i style="background:var(--free)"></i>verfügbar, nicht eingeplant</span><span><b style="color:var(--gap)">−2</b> fehlen Personen</span><span><b style="color:var(--ifn)">V/H</b> Zahl stimmt, Aufteilung vorne/hinten nicht</span></div>
{''.join(out)}
<div class="two"><div class="box"><h2>Stunden je Person</h2><table class="ptab"><thead><tr><th>Mitglied</th><th class="num">Stunden</th><th></th><th class="num">Dienste</th></tr></thead><tbody>{ptab}</tbody></table></div>
<div class="box"><h2>Was noch fehlt</h2><ul>
<li><b>8 Mitglieder ohne Wünsche.</b> Für sie ist noch nichts eingeplant. Mit ihnen lassen sich die offenen Stunden schließen.</li>
<li><b>Samstag 12.12. ist der größte Engpass:</b> abends fehlen bis zu 4 Personen. Christina und Frank haben den Tag gesperrt.</li>
<li><b>Spätdienst bis 23 Uhr</b> fehlt an fast allen Markttagen, vor allem hinten.</li>
<li><b>Christina, Manfred und Frank</b> tragen viele Abende. Ihre Stunden sinken, sobald weitere Wünsche da sind.</li>
<li><b>Hans-Joachim Kochs Wünsche</b> sind noch nicht übernommen (Status „offen“), wurden hier aber berücksichtigt.</li>
<li>Pausen, Verantwortliche je Schicht und Bereitschaften sind noch nicht eingeplant.</li></ul></div></div>
</main>'''
open('dienstplan-entwurf.html','w').write(page)
print(len(page))
