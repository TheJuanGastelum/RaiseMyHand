import sys, json, re
import os
SP=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0,SP)
import analogies as AN
G=SP+"/games/"
OUT=SP+"/out/"
import os; os.makedirs(OUT,exist_ok=True)
def rd(f): return open(G+f,encoding="utf8").read()
def anajson(d): return json.dumps({k:{"key":v["key"],"map":[list(m) for m in v["map"]]} for k,v in d.items()},ensure_ascii=False)
GAMES={
 "grid":dict(title="Power Keeper",out="power-keeper.html",ana=AN.L320,css="",data="grid_data.js",learn=["grid_learn1.js","grid_learn2.js","lab_common.js","grid_labs1.js","grid_labs2.js"],stage="grid_stage.js",init="grid_init.js",accent="#7ef7c1"),
 "cpu":dict(title="CPU Quest",out="cpu-quest.html",ana=AN.L369,css="",data="cpu_data.js",learn=["cpu_learn1.js","cpu_learn2.js","cpu_learn3.js","lab_common.js","cpu_labs1.js","cpu_labs2.js","cpu_labs3.js"],stage="cpu_stage.js",init="cpu_init.js",accent="#ffb454"),
 "water":dict(title="Circuit Basics Quest",out="circuit-basics-quest.html",ana={},css="",data="water_data.js",learn=["water_learn1.js","water_learn2.js","water_learn3.js","water_learn4.js","lab_common.js","water_labs1.js","water_labs2.js","water_labs3.js","water_labs4.js","water_labs5.js","water_labs6.js","water_labs7.js"],stage="water_stage.js",init="water_init.js",accent="#4aa3ff"),
 "mcu":dict(title="Embedded Quest",out="embedded-quest.html",ana=AN.L372,css="",data="mcu_data.js",learn=["mcu_learn1.js","mcu_learn2.js","lab_common.js","mcu_labs1.js","mcu_labs2.js"],stage="mcu_stage.js",init="mcu_init.js",accent="#8ec5ff"),
}
for g in (sys.argv[1:] or GAMES):
    c=GAMES[g]
    if not os.path.exists(G+c["data"]): print("skip",g); continue
    css=rd("kit.css")+"\n:root{--accent:%s}"%c["accent"]
    js="const ANA_L = "+anajson(c["ana"])+";\n"+rd("kit.js")+"\n"+rd(c["data"])+"\n"+"\n".join(rd(f) for f in c.get("learn",[]))+"\n"+rd(c["stage"])+"\n"+rd(c["init"])
    html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>%s</title><style>%s</style></head><body><main id="app"></main><script>%s</script></body></html>'%(c["title"],css,js)
    open(OUT+c["out"],"w",encoding="utf8").write(html)
    print(g,len(html)//1024,"KB ->",OUT+c["out"])
