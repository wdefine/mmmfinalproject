class Simulation {
    constructor(simConfig){
        this.simID = simConfig.simID;
        let sim = document.getElementById(this.simID);
        this.canvasID = sim.querySelector('.canvas').id;
        this.chartID = sim.querySelector('.chart').id;
        this.canvas = document.getElementById(this.canvasID);
        this.ctx = this.canvas.getContext("2d");

        this.socialDistanceCompliance = simConfig.socialDistanceCompliance;
        this.recoverTime = simConfig.recoverTime;
        this.infectionRate = simConfig.infectionRate;

        //initialize time
        this.time = 0;
        this.dt = 0;
        this.paused = true;
        this.done = false;

        //initialize balls
        this.objArray = [];
        this.numStartingBalls = 500;
        this.startingSickBalls = 5;
        this.initBalls()

        //initialize charting info
        this.chartingInfo = {
            s:[],
            i:[],
            r:[],
            l:[],
        }

        //initialize canvas
        clearCanvas(this.ctx, this.canvas);
        drawObjects(this.objArray, this.ctx);
        this.graph();
    }

    //draw advances the simulation and updates the canvas
    draw() {
       this.time += 10;
       this.dt = 50* 10/1000

        clearCanvas(this.ctx, this.canvas);

        this.recover();
        this.socialDistance();

        moveObjects(this.objArray, this.dt);
        wallCollision(this.objArray, this.canvas);
        let collisions = ballCollision(this.objArray);
        this.collideBalls(collisions);
        
        drawObjects(this.objArray, this.ctx);
        this.updateChartingInfo();
        this.graph();

        this.lastTime = this.currentTime;
    }

    //graph updates graph
    graph() {
        let divisor = 10;
        let ylabels = []
        for(let i=0;i<divisor+1;i++)
        {
            ylabels.push(i*Math.floor(this.numStartingBalls/divisor));
        }
        new Chartist.Line("#" + this.chartID, {
            //labels:[this.chartingInfo.l],
            series: [
              {name: "Susceptible", data: this.chartingInfo.s},
              {name: "Infected", data: this.chartingInfo.i},
              {name: "Removed", data: this.chartingInfo.r}
            ]
          }, {
            lineSmooth: Chartist.Interpolation.cardinal({
                tension: 0.2
              }),
            axisY:{
                type: Chartist.FixedScaleAxis,
                divisor:10,
                ticks:ylabels,
            },/*
            axisX:{
                labelInterpolationFnc: function skipLabels(value, index, labels) {
                    if(labels.length > 10) {
                        return index === labels.length-1 ? value : null;
                        //return (index % Math.floor(labels.length/10))  === 0 ? value : null;
                    } else {
                        //return value;
                    }
                  }
            },*/
            showPoint: false,
            fullWidth: true,
          });
    }
    
    //determines status of each ball, updates lists for graphing
    updateChartingInfo()
    {
        let susceptible = 0;
        let infected = 0;
        let recovered = 0;
        for(let i=0;i<this.objArray.length;i++)
        {
            let status = this.objArray[i].getStatus()
            if(status == "s"){
                susceptible += 1;
            }
            if(status == "i"){
                infected += 1;
            }
            if(status == "r"){
                recovered += 1;
            }
        }
        if(infected == 0){
            this.paused = true; //simulation is over
            this.done = true;
        }
        this.chartingInfo.s.push(susceptible);
        this.chartingInfo.i.push(infected);
        this.chartingInfo.r.push(recovered);
        this.chartingInfo.l.push(this.chartingInfo.l.length);
    }
    
    initBalls(){
        for (let i = 0; i<this.numStartingBalls; i++) {
            this.objArray[this.objArray.length] = new Ball(randomX(this.canvas), randomY(this.canvas), i);
        }
        for(let i = 0;i<this.startingSickBalls;i++){
            this.objArray[i].status = 2;//infect
            this.objArray[i].infectionStart = 0;
            this.objArray[i].socialDistancingWillingness = 1; //will not socially distance
        }
    }

    reset(){
        this.objArray = [];
        this.paused = true;
        this.lastTime = (new Date()).getTime();
        this.currentTime = 0;
        this.time = 0;
        this.done = false;
        this.dt = 0;
        this.initBalls();
        this.chartingInfo = {
            s:[],
            i:[],
            r:[],
            l:[]
        }
        clearCanvas(this.ctx, this.canvas);
        drawObjects(this.objArray, this.ctx);
        this.graph();
    }

    //handles epidemiology of ball collision
    collideBalls(collisions){
        for(let i=0;i<collisions.length;i++)
        {
            let ball1 = collisions[i][0];
            let ball2 = collisions[i][1];
            let transmission = Math.random() < this.infectionRate;
            ball1.collide(ball2, this.time, transmission);
            ball2.collide(ball1, this.time, transmission);
        }
    }

    recover()
    {
        for(let i=0;i<this.objArray.length;i++){
            this.objArray[i].recover(this.recoverTime, this.time);
        }
    }

    socialDistance()
    {
        for(let i=0;i<this.objArray.length;i++){
            this.objArray[i].socialDistance(this.socialDistanceCompliance);
        }
    }
}

let sims = [];
window.addEventListener('DOMContentLoaded', (event) => {
    let simConfigs = [];
    let simElements = document.getElementsByClassName('sim');
    for(let i=0;i<simElements.length;i++)
    {
        simConfigs.push({
            simID: simElements[i].id,
            socialDistanceCompliance: parseFloat(simElements[i].querySelector(".sd").value),
            infectionRate: parseFloat(simElements[i].querySelector(".ir").value),
            recoverTime:600,
        })
    }
    console.log(simConfigs);
    for(let i=0;i<simConfigs.length;i++){
        sims.push(new Simulation(simConfigs[i]))
    }
});

var interval = setInterval(function(){
    for(let i =0;i<sims.length;i++){
        if(!sims[i].paused)
        {
            sims[i].draw();
        }
    }
}, 50);

function updateSocialDistance(event)
{
    if (!event) {
        event = window.event;
    };
    let e = (event.target || event.srcElement)
    let pid = e.parentNode.parentNode.id;
    let sim = null;
    for(let i=0;i<sims.length;i++)
    {
        if(sims[i].simID === pid)
        {
            sim = sims[i];
        }
    }
    if(sim)
    {
        sim.socialDistanceCompliance = e.value;
    }
}

function updateInfectionRate(event)
{
    if (!event) {
        event = window.event;
    };
    let e = (event.target || event.srcElement)
    let pid = e.parentNode.parentNode.id;
    let sim = null;
    for(let i=0;i<sims.length;i++)
    {
        if(sims[i].simID === pid)
        {
            sim = sims[i];
        }
    }
    if(sim)
    {
        sim.infectionRate = e.value;
    }
}

function reset(event)
{
    if (!event) {
        event = window.event;
    };
    let e = (event.target || event.srcElement)
    let pid = e.parentNode.parentNode.id;
    let sim = null;
    for(let i=0;i<sims.length;i++)
    {
        if(sims[i].simID === pid)
        {
            sim = sims[i];
        }
    }
    if(sim)
    {
        sim.reset();
    }
}

function pause(event)
{
    if (!event) {
        event = window.event;
    };
    let e = (event.target || event.srcElement)
    let pid = e.parentNode.parentNode.id;
    let sim = null;
    for(let i=0;i<sims.length;i++)
    {
        if(sims[i].simID === pid)
        {
            sim = sims[i];
        }
    }
    if(sim)
    {
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