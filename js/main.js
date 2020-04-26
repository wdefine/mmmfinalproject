//pull sim configs from dom, creates sim classes, save sims to sims[]
let defaultConfig = {
    socialDistanceCompliance: 0.0,
    infectionRate: 0.5,
    symptomaticRate: 1,
    recoverTime: 100,
    symptomStartTime: 50,
    morbidityRate: 0.1,
    numStartingBalls: 400,
    startingSickBalls: 1,
    ballSpeed: 12,
    numCommunities: 1,
    switchCommunityRate: 0.0,
    hasMarketBox: 0,
    marketFrequency: 0.0,
    marketDuration: 20,
    hasHospitalBox:0,
    hospitalizationRate:0.00,
    testAndTraceRate: 0,
    testAndTraceInceptionRate: 0,
    testAndTraceNumContacts: 0, //max = 25
    testAndTraceQuarantineMode: 0, //0=social distance, 1=goToHospital
}

let sims = [];
window.addEventListener('DOMContentLoaded', (event) => {
    let simConfigs = [];
    let simElements = document.getElementsByClassName('sim');
    for(let i=0;i<simElements.length;i++)
    {
        let config = Object.assign({}, defaultConfig);
        let sim = document.getElementById(simElements[i].id);
        for(key in config)
        {
            element = sim.querySelector('.' + key);
            if(element != null)
            {
                config[key] = isNaN(parseFloat(element.value)) ? config[key] : parseFloat(element.value);
            }
        }
        config.simID = simElements[i].id,
        simConfigs.push(config);
    }
    for(let i=0;i<simConfigs.length;i++){
        sims.push(new Simulation(simConfigs[i]))
    }
    window.requestAnimationFrame(step);
});

let global_counter = 0
const updateGraphMs = 1000;
const runSimMs = 50;
function step()
{
    for(let i =0;i<sims.length;i++){
        if(!sims[i].paused)
        {
            sims[i].drawCanvas();
            if(global_counter % Math.floor(updateGraphMs/runSimMs) == 0)
            {
                sims[i].chart();
            }
            break;//if multiple sims are unpaused, this makes first sim run, others are effectively paused
        }
    }
    global_counter += 1;
    window.requestAnimationFrame(step);
}

//here is the loop that controls page
var interval = setInterval(function(){
    for(let i =0;i<sims.length;i++){
        if(!sims[i].paused)
        {
            sims[i].simLoop();
            break;//if multiple sims are unpaused, this makes first sim run, others are effectively paused
        }
    }
}, runSimMs);

//functions for handling changes to values
function simAndTargetFromEvent(event)
{
    if (!event) {
        event = window.event;
    };
    let e = (event.target || event.srcElement)
    let p = e.parentNode;
    //search for sim object up 4 layers
    for(let i=0;i<10;i++)
    {
        if (p.id && document.getElementById(p.id).className.includes("sim"))
        {
            break;
        }
        p = p.parentNode;
    }
    let pid = p.id;
    let sim = null;
    for(let i=0;i<sims.length;i++)
    {
        if(sims[i].simID === pid)
        {
            sim = sims[i];
        }
    }
    return [sim, e];
}

function update(event)
{
    let [sim, e] = simAndTargetFromEvent(event);
    if(sim)
    {
        let val = parseFloat(e.value);
        if(val != NaN){
            sim.updateControl(e.className, val);
        }
        
    }
}

function reset(event)
{
    let [sim, e] = simAndTargetFromEvent(event);
    if(sim)
    {
        sim.reset();
    }
}

function pause(event)
{
    let [sim, e] = simAndTargetFromEvent(event);
    if(sim)
    {
        //force only one sim to be active at a time
        for(let i =0;i<sims.length;i++){
            if(sims[i] != sim){
                sims[i].paused = true;
            }
        }
        if(!sim.done)
        {

            sim.paused = !sim.paused;
        }
    }
}