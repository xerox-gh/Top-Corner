// npm install --no-save playwright && npx playwright install chromium
// node tests/smoke.cjs (optional CHROMIUM_PATH for an existing Chromium binary)
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
(async () => {
  const server = http.createServer((req, res) => {res.setHeader('Content-Type', 'text/html'); res.end(source);});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  const errors = [];
  try {
    browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_PATH || undefined, args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
    const page = await browser.newPage({viewport:{width:1440,height:900}});
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    assert.match(await page.title(), /Top Corner/);
    const world = await page.evaluate(() => ({leagues:WorldDatabase.leagues.length,clubs:WorldDatabase.clubs.length,english:WorldDatabase.leagues[0].name,second:WorldDatabase.leagues[1].name,unique:new Set(WorldDatabase.clubs.map(c=>c.id)).size,squad:WorldDatabase.squad(0).length}));
    assert.deepEqual(world, {leagues:76,clubs:1256,english:'English Premier',second:'English Championship',unique:1256,squad:20});
    await page.getByRole('button',{name:'LET’S PLAY'}).click();
    await page.getByRole('button',{name:'KICK OFF'}).click();
    await page.getByRole('button',{name:'LET’S PLAY'}).click();
    await page.waitForTimeout(450);
    await page.keyboard.press('j');
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(()=>Game.phase),'play');
    assert.equal(await page.evaluate(()=>Game.players.length),22);
    const flow = await page.evaluate(() => {
      Game.paused=true;
      const initial=Game.time;
      // Execute deterministic simulation ticks, including AI and ball collisions.
      Game.paused=false;
      for(let i=0;i<1800;i++)Game.update(1/60);
      Game.paused=true;
      return {advanced:Game.time>initial,finite:Game.players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))&&Number.isFinite(Game.ball.x)};
    });
    assert.deepEqual(flow,{advanced:true,finite:true});
    const goal = await page.evaluate(()=>{
      Game.phase='play';Game.ball={...Game.ball,x:104.9,y:34,z:.2,vx:30,vy:0,vz:0,owner:null,lock:1};
      const old=Game.score[0];Physics.ball(1/60);return {phase:Game.phase,scored:Game.score[0]===old+1};
    });
    assert.deepEqual(goal,{phase:'goal',scored:true});
    const restarts = await page.evaluate(()=>{
      Game.ball={...Game.ball,x:50,y:-1,lastTeam:0};Referee.out();const a=[Game.restart.type,Game.restart.team];
      Game.ball={...Game.ball,x:106,y:20,lastTeam:1};Referee.out();const b=[Game.restart.type,Game.restart.team];
      Game.ball={...Game.ball,x:106,y:20,lastTeam:0};Referee.out();return [a,b,[Game.restart.type,Game.restart.team]];
    });
    assert.deepEqual(restarts,[['THROW IN',1],['CORNER',0],['GOAL KICK',1]]);
    const offside = await page.evaluate(()=>{
      const p=Game.team(0)[6],q=Game.team(0)[9];p.x=65;q.x=99;
      Game.team(1).forEach((d,i)=>d.x=i===0?103:80);
      Game.markOffside(p);return Game.offsideCandidates.includes(q);
    });
    assert.equal(offside,true);
    const halftime=await page.evaluate(()=>{
      Game.phase='play';Game.paused=false;Game.time=44.999;Game.update(1/60);
      const stopped=Game.paused&&Game.phase==='interval';Game.nextHalf();const direction=Game.dir(0);Game.paused=true;return {stopped,half:Game.half,direction};
    });
    assert.deepEqual(halftime,{stopped:true,half:2,direction:-1});
    const substitutions=await page.evaluate(()=>{
      Game.subMenu();$('subOff').value=Game.players.indexOf(Game.team(Game.userTeam)[1]);$('subOn').value=0;const old=Game.players[+$('subOff').value].id;Game.substitute();return {used:Game.subs[Game.userTeam],replaced:Game.team(Game.userTeam)[1].id!==old,bench:Game.benches[Game.userTeam].length};
    });
    assert.deepEqual(substitutions,{used:1,replaced:true,bench:8});
    await page.evaluate(()=>Game.exit());
    await page.getByRole('button',{name:'Career',exact:true}).click();
    await page.locator('#managerName').fill('Test Manager');
    await page.getByRole('button',{name:'START CAREER'}).click();
    const season=await page.evaluate(()=>{
      const oldClub=career.club;
      for(let i=0;i<38;i++)CareerManager.advance(1,0);
      const played=career.leagues[career.lid].table.every(t=>t.p===38);
      const totalPoints=career.leagues[career.lid].table.reduce((s,t)=>s+t.pts,0);
      const top=LeagueEngine.sorted(career.leagues[0].table),bottom=LeagueEngine.sorted(career.leagues[1].table);
      const down=top.slice(-3).map(t=>t.id),up=bottom.slice(0,3).map(t=>t.id);
      CareerManager.nextSeason();const promotion=up.every(id=>career.leagues[0].table.some(t=>t.id===id))&&down.every(id=>career.leagues[1].table.some(t=>t.id===id));
      const valid=validCareer(career);CareerManager.load(1);
      return {played,totalPoints,promotion,valid,season:career.season,round:career.round,club:career.club,oldClub,fixtures:career.leagues[career.lid].fixtures.length};
    });
    assert.equal(season.played,true);assert.equal(season.promotion,true);assert.equal(season.valid,true);assert.equal(season.season,2);assert.equal(season.round,0);assert.equal(season.club,season.oldClub);assert.equal(season.fixtures,38);assert(season.totalPoints>760);
    assert.equal(await page.evaluate(()=>{const c=structuredClone(career);c.squad[0].pos='<img onerror=alert(1)>';return validCareer(c)}),false);
    assert.equal(await page.evaluate(()=>{const c=structuredClone(career);c.round=-10;return validCareer(c)}),false);
    const transfer=await page.evaluate(()=>{careerTab='Transfers';UI.show('career');career.budget=1e9;const count=career.squad.length,budget=career.budget;CareerManager.buy(0);return {count:career.squad.length-count,paid:career.budget<budget}});
    assert.deepEqual(transfer,{count:1,paid:true});
    await page.evaluate(()=>{career=null;UI.show('tournament')});
    await page.getByRole('button',{name:'CREATE TOURNAMENT'}).click();
    const cup=await page.evaluate(()=>{for(let i=0;i<3;i++)LeagueEngine.advanceTournament();return {done:tournament.done,results:tournament.results.length,winner:tournament.ids.includes(tournament.winner)}});
    assert.deepEqual(cup,{done:true,results:7,winner:true});
    const league=await page.evaluate(()=>{tournament=null;UI.show('tournament');$('tFormat').value='league';LeagueEngine.createTournament();for(let i=0;i<7;i++)LeagueEngine.advanceTournament();return {done:tournament.done,played:tournament.table.every(t=>t.p===7),results:tournament.results.length}});
    assert.deepEqual(league,{done:true,played:true,results:28});
    const editor=await page.evaluate(()=>{UI.show('editor');$('clubName').value='Test Athletic';$('leagueName').value='Test Premier';UI.saveClub();return {club:WorldDatabase.club(0).name,league:WorldDatabase.leagues[0].name,saved:SaveManager.read('editor',{})['c0'].name}});
    assert.deepEqual(editor,{club:'Test Athletic',league:'Test Premier',saved:'Test Athletic'});
    const filePage=await browser.newPage();filePage.on('pageerror',e=>errors.push(e.message));await filePage.goto('file://'+path.join(__dirname,'..','index.html'));assert.match(await filePage.title(),/Top Corner/);await filePage.close();
    const mobile = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(`http://127.0.0.1:${server.address().port}`);
    assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await mobile.evaluate(()=>{SaveManager.write('tutorial',true);Game.start(0,200);Game.paused=true;Renderer.draw()});
    assert.equal(await mobile.locator('#stick').isVisible(),true);
    assert.equal(await mobile.locator('.touch-actions').isVisible(),true);
    if(process.env.SCREENSHOT_DIR){await page.evaluate(()=>UI.show('home'));await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,'home-final.png')});await mobile.screenshot({path:path.join(process.env.SCREENSHOT_DIR,'mobile-final.png')});}
    assert.deepEqual(errors,[]);
    console.log('PASS: world, UI kickoff, 1800 simulation ticks, goal, restarts, offside, halftime, substitutions, full career season, promotion/relegation, save validation, transfers, cup, league, editor, file:// launch and mobile layout.');
  } finally {await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1});
