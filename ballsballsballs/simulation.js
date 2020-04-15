class Simulation {
    constructor(simConfig){

        //dom variables saved for quick look up
        this.simID = simConfig.simID;
        let sim = document.getElementById(this.simID);
        this.canvasID = sim.querySelector('.canvas').id;
        this.chartID = sim.querySelector('.chart').id;
        this.canvas = document.getElementById(this.canvasID);
        this.ctx = this.canvas.getContext("2d");

        //init parameters from simconfig
        this.socialDistanceCompliance = simConfig.socialDistanceCompliance;
        this.recoverTime = simConfig.recoverTime;
        this.infectionRate = simConfig.infectionRate;
        this.symptomatic = simConfig.symptomatic;
        this.numStartingBalls = simConfig.numStartingBalls;
        this.startingSickBalls = simConfig.startingSickBalls;
        this.ballSpeed = simConfig.ballSpeed;

        this.reset();
    }

    //draw advances the simulation and updates the canvas
    drawCanvas() {
       this.time += 1;
       let dt = 50* 10/1000

        clearCanvas(this.ctx, this.canvas);

        this.recover(); //set balls who have recoved as recovered
        this.socialDistance(); //force balls to socially distance

        moveObjects(this.objArray, dt); //move balls in direction
        wallCollision(this.objArray, this.canvas); //bounce balls off walls
        let collisions = ballCollision(this.objArray); //bounce balls off eachother, return pairs who collide
        
        this.transmitInfection(collisions); //transmit infection on collision
        
        drawObjects(this.objArray, this.ctx); //draw balls on canvas

        this.updateChartingInfo();//add sir+ info to 
        this.chart();
    }

    //chart updates chart
    chart() {
        let divisor = 10;
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
                ticks:this.ylabels,
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
            let status = this.objArray[i].getSIRStatus()
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
            this.paused = true; 
            this.done = true;//simulation is over
        }
        this.chartingInfo.s.push(susceptible);
        this.chartingInfo.i.push(infected);
        this.chartingInfo.r.push(recovered);
        this.chartingInfo.l.push(this.chartingInfo.l.length);
    }
    
    initBalls(){
        for (let i = 0; i<this.numStartingBalls; i++) {
            this.objArray[this.objArray.length] = new Ball(randomX(this.canvas), randomY(this.canvas), i, this.ballSpeed);
        }
        for(let i = 0;i<this.startingSickBalls;i++){
            this.objArray[i].getSick(this.time, this.symptomatic);
            this.objArray[i].socialDistancingWillingness = 1; //will not socially distance, to make simulation workable
        }
    }

    reset(){
        //init timing
        this.time = 0;
        this.done = false;
        this.paused = true;

        //init balls
        this.objArray = [];
        this.initBalls();

        //init canvas
        clearCanvas(this.ctx, this.canvas);
        drawObjects(this.objArray, this.ctx);

        //init charting
        this.chartingInfo = {
            s:[],
            i:[],
            r:[],
            l:[],
        }
        this.ylabels = []
        for(let i=0;i<10+1;i++)
        {
            this.ylabels.push(i*Math.floor(this.numStartingBalls/10));
        }
        this.chart();
    }

    //handles epidemiology of ball collision
    transmitInfection(collisions){
        for(let i=0;i<collisions.length;i++)
        {
            let ball1 = collisions[i][0];
            let ball2 = collisions[i][1];
            let transmission = Math.random() < this.infectionRate;
            ball1.collide(ball2, this.time, transmission, this.symptomatic);
            ball2.collide(ball1, this.time, transmission, this.symptomatic);
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

//pull sim configs from dom, creates sim classes, save sims to sims[]
let sims = [];
window.addEventListener('DOMContentLoaded', (event) => {
    let simConfigs = [];
    let simElements = document.getElementsByClassName('sim');
    for(let i=0;i<simElements.length;i++)
    {
        simConfigs.push({
            simID: simElements[i].id,
            socialDistanceCompliance: parseFloat(simElements[i].querySelector(".sd").value), //0-1
            infectionRate: parseFloat(simElements[i].querySelector(".ir").value),//0-1
            symptomatic: parseFloat(simElements[i].querySelector(".sym").value),//0-1
            recoverTime:60,
            numStartingBalls: 500,//max = 500
            startingSickBalls:5,//max = #numStartingBalls
            ballSpeed:10,
        })
    }
    for(let i=0;i<simConfigs.length;i++){
        sims.push(new Simulation(simConfigs[i]))
    }
});

//here is the loop that controls page
var interval = setInterval(function(){
    for(let i =0;i<sims.length;i++){
        if(!sims[i].paused)
        {
            sims[i].drawCanvas();
            break;//if multiple sims are unpaused, this makes first sim run, others are effectively paused
        }
    }
}, 40);

//functions for handling changes to values
function simAndTargetFromEvent(event)
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
    return [sim, e];
}

function updateSocialDistance(event)
{
    let [sim, e] = simAndTargetFromEvent(event);
    if(sim)
    {
        sim.socialDistanceCompliance = e.value;
    }
}

function updateInfectionRate(event)
{
    let [sim, e] = simAndTargetFromEvent(event);
    if(sim)
    {
        sim.infectionRate = e.value;
    }
}

function updateSymptomatic(event)
{
    let [sim, e] = simAndTargetFromEvent(event);
    if(sim)
    {
        sim.symptomatic = e.value;
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