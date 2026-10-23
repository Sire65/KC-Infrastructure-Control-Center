import json,collections,itertools,os
H=0.5
import sys
MAXLEN=float(sys.argv[1]) if len(sys.argv)>1 else 8
FAIR=float(sys.argv[2]) if len(sys.argv)>2 else 0.04
def slots(a,b): 
    x=a; out=[]
    while x<b-1e-9: out.append(round(x,1)); x+=H
    return out
# Bedarf je Halbstunde: (gesamt, vorne, hinten) – vorne/hinten None an Aufbau/Abbau
dem={}
for line in open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'demand.txt')):
    d,rest=line.strip().split('|');dem[d]={}
    for part in rest.split():
        rng,val=part.split(':');a,b=map(float,rng.split('-'));v=val.split('/')
        t=int(v[0]);f=int(v[1]) if len(v)>1 else None;bk=int(v[2]) if len(v)>2 else None
        for s in slots(a,b): dem[d][s]=(t,f,bk)
LV={'pref':3,'avai':2,'if_n':1}
av=collections.defaultdict(dict)   # (name,date) -> slot -> (level, zone)
un=collections.defaultdict(set)
for line in open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'wishes.txt')):
    n,d,t,z,a,b=line.strip().split('|');a=float(a);b=float(b)
    for s in slots(a,b):
        if t=='unav': un[(n,d)].add(s); continue
        lv,zz=av[(n,d)].get(s,(0,None))
        zone=z if zz is None else ('B' if 'B' in (z,zz) or z!=zz else z)
        av[(n,d)][s]=(max(lv,LV[t]),zone)
for k in list(av):
    for s in un[k]: av[k].pop(s,None)
people=sorted({k[0] for k in av})
hours=collections.Counter();over={}
plan=collections.defaultdict(list)  # date -> [(name,start,end)]
def zone_of(n,d,s): return av[(n,d)][s][1]
for d in sorted(dem):
    need={s:list(v) for s,v in dem[d].items()}
    staff={s:[] for s in need}
    used=set()
    def gain(n,a,b):
        sc=0;
        for s in slots(a,b):
            if s not in need: sc-=1.0; continue
            lv,z=av[(n,d)][s]; w={3:1.0,2:0.85,1:0.35}[lv]
            t,f,bk=need[s]
            cnt=len(staff[s])
            if cnt<dem[d][s][0]:
                v=1.0
                # vorne/hinten: hilft die Zone dort, wo es fehlt?
                if dem[d][s][1] is not None:
                    fr=sum(1 for x in staff[s] if zone_of(x,d,s)=='V'); bkk=sum(1 for x in staff[s] if zone_of(x,d,s)=='H')
                    fl=sum(1 for x in staff[s] if zone_of(x,d,s)=='B')
                    fneed=max(0,dem[d][s][1]-fr); bneed=max(0,dem[d][s][2]-bkk)
                    if z=='V' and fneed-fl<=0 and bneed>0: v=0.5
                    if z=='H' and bneed-fl<=0 and fneed>0: v=0.5
                sc+=v*w
            else: sc-=0.6
        return sc*H, 0
    while True:
        best=None
        for n in people:
            if n in used or (n,d) not in av: continue
            ss=sorted(av[(n,d)])
            # zusammenhängende Blöcke der Verfügbarkeit
            blocks=[];cur=[]
            for s in ss:
                if cur and abs(s-cur[-1]-H)>1e-9: blocks.append(cur);cur=[]
                cur.append(s)
            if cur: blocks.append(cur)
            for blk in blocks:
                lo,hi=blk[0],blk[-1]+H
                minlen=min(2.0,hi-lo)
                a=lo
                while a<hi-1e-9:
                    b=a+minlen
                    while b<=min(hi,a+MAXLEN)+1e-9:
                        cov,fp=gain(n,a,b)
                        g=cov*max(0.05,1-FAIR*hours[n]/100)
                        if cov>0.05 and (best is None or g>best[0]): best=(g,n,a,b)
                        b+=H
                    a+=H
        if not best: break
        g,n,a,b=best; used.add(n); hours[n]+=b-a; plan[d].append((n,a,b))
        for s in slots(a,b):
            if s in staff: staff[s].append(n)
    # Bericht: Lücken
    gaps=[]
    for s in sorted(need):
        t,f,bk=dem[d][s];st=staff[s]
        V=sum(1 for x in st if zone_of(x,d,s)=='V');Hh=sum(1 for x in st if zone_of(x,d,s)=='H');Bb=len(st)-V-Hh
        miss=max(0,t-len(st))
        if f is not None:
            fm=max(0,f-V);bm=max(0,bk-Hh);flex=Bb
            # Flexible verteilen
            use=min(fm,flex);fm-=use;flex-=use;use=min(bm,flex);bm-=use
            gaps.append((s,t,len(st),miss,fm,bm))
        else: gaps.append((s,t,len(st),miss,None,None))
    plan[d+'_gaps']=gaps
    over[d]=sum(max(0,len(staff[s])-dem[d][s][0])*H for s in staff)
json.dump({'plan':{k:v for k,v in plan.items()},'hours':hours},open('plan.json','w'),default=list,indent=0)
tot_need=sum(v[0]*H for d in dem for v in dem[d].values())
tot_plan=sum(hours.values())
print('Bedarf',tot_need,'geplant',tot_plan,'Lücke',sum(g[3]*H for d in dem for g in plan[d+'_gaps']),'Überbesetzung',sum(over.values()),'V/H-Lücke',sum(((g[4] or 0)+(g[5] or 0))*H for d in dem for g in plan[d+'_gaps']))
for d in sorted(dem):
    sh=sorted(plan[d],key=lambda x:(x[1],x[0]))
    miss=sum(g[3]*H for g in plan[d+'_gaps'])
    print(d, f'fehlt {miss:g} h |', '; '.join(f'{n} {a:g}-{b:g}' for n,a,b in sh))
print(dict(hours))
