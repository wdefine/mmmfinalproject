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
        this.numCommunities = simConfig.numCommunities;
        this.hasMarketBox = simConfig.hasMarketBox;
        this.hasQuarantineBox = simConfig.hasQuarantineBox;
        this.switchCommunityRate = simConfig.switchCommunityRate;

        this.reset();
    }

    //draw advances the simulation and updates the canvas
    drawCanvas() {
        this.time += 1;

        this.clearCanvas(this.ctx, this.canvas);

        this.recover(); //set balls who have recoved as recovered
        this.socialDistance(); //force balls to socially distance
        if(this.numCommunities > 1)
        {
            this.switchCommunities();
        }
    
        let collisions = [];
        for(let i=0;i<this.boxArray.length;i++)
        {
            this.boxArray[i].moveBalls(this.time);
            this.boxArray[i].wallCollisions();
            collisions = collisions.concat(this.boxArray[i].ballCollisions());
            this.boxArray[i].drawBox();//draw boxes on canvas
        }
        this.transmitInfection(collisions); //transmit infection on collision

        //draw balls
        for (let obj in this.ballArray) {
            this.ballArray[obj].draw(this.ctx);
        }

        this.updateChartingInfo();//add sir+ info to 
        this.chart();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.style.backgroundColor = "rgb(255, 255, 255)";
    }

    //chart updates chart
    chart() {
        let divisor = 10;
        let c = Chartist.Line("#" + this.chartID, {
            //labels:[this.chartingInfo.l],
            series: [
              {name: "Susceptible", data: this.chartingInfo.s, color:"lightblue"},
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
        for(let i=0;i<this.ballArray.length;i++)
        {
            let status = this.ballArray[i].getSIRStatus()
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
    
    initBallsBoxes(){
        let sideBoxes = this.hasMarketBox || this.hasQuarantineBox;
        if(sideBoxes)
        {
            let width = Math.min(100, this.canvas.width/2);
            let height = Math.floor(Math.min(200, this.canvas.height)/2);
            let marketBoxPoints = [[0,0],[0,height],[width, height],[width, 0]];
            let quarantineBoxPoints = [[0,height],[0,height*2],[width, height*2],[width, height]];
            if(this.hasMarketBox)
            {
                this.boxMarket = new Box(marketBoxPoints, this.ctx, "green", 2);
            }
            if(this.hasQuarantineBox)
            {
                this.boxQuarantine = new Box(quarantineBoxPoints, this.ctx, "red", 2);
            }
        }
        let width = sideBoxes ? this.canvas.width - 100 : this.canvas.width;
        let xOffset = sideBoxes ? 100 : 0;
        let boxPoints = splitBoxesEvenly(this.numCommunities, width, this.canvas.height, xOffset, 0);
        let ballsPerBox = Math.floor(this.numStartingBalls/this.numCommunities);
        for(let i=0;i<this.numCommunities;i++)
        {
            let numSickBalls = Math.floor(this.startingSickBalls/this.numCommunities) + (i < this.startingSickBalls%this.numCommunities) ? 1 : 0;
            this.boxCommunities.push(new Box(boxPoints[i], this.ctx, "black", 2));
            this.addXBallsToBox(this.boxCommunities[i], ballsPerBox,  numSickBalls);
        }
    }

    addXBallsToBox(box, balls, sickBalls){
        let starting_index = this.ballArray.length;
        for (let i = 0; i<balls; i++) {
            this.ballArray.push(box.createBallInBox(this.ballArray.length, this.ballSpeed));
        }
        for(let i = 0;i<sickBalls;i++){
            this.ballArray[i+starting_index].getSick(this.time, this.symptomatic);
            this.ballArray[i+starting_index].socialDistancingWillingness = 0.9999999999999; //sick balls won't socially distance
        }
    }

    reset(){
        //init timing
        this.time = 0;
        this.done = false;
        this.paused = true;

        //init balls
        this.ballArray = [];
        this.boxCommunities = [];
        this.boxMarket = null;
        this.boxQuarantine = null;
        this.initBallsBoxes();
        this.boxArray = this.boxCommunities;
        if(this.hasMarketBox)
        {
            this.boxArray.push(this.boxMarket);
        }
        if(this.hasQuarantineBox)
        {
            this.boxArray.push(this.boxQuarantine);
        }

        //init canvas
        this.clearCanvas(this.ctx, this.canvas);
        for (let obj in this.ballArray) {
            this.ballArray[obj].draw(this.ctx);
        }
        for(let i=0;i<this.boxArray.length;i++)
        {
            this.boxArray[i].drawBox();//draw boxes on canvas
        }

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
        for(let i=0;i<this.ballArray.length;i++){
            this.ballArray[i].recover(this.recoverTime, this.time);
        }
    }

    socialDistance()
    {
        for(let i=0;i<this.ballArray.length;i++){
            this.ballArray[i].socialDistance(this.socialDistanceCompliance);
        }
    }

    switchCommunities()
    {
        let newcomers = [];
        for(let i=0;i<this.numCommunities;i++)
        {
            newcomers.push([])
        }
        for(let i=0;i<this.numCommunities;i++)
        {
            let leavers = this.boxCommunities[i].getLeavingBalls(this.switchCommunityRate);
            for(let j=0;j<leavers.length;j++)
            {
                let newCommunity = Math.floor(Math.random()*(this.numCommunities-1));
                if(newCommunity >= i)
                {
                    newCommunity += 1;
                }
                newcomers[newCommunity].push(leavers[j]);
            }
        }
        for(let i=0;i<newcomers.length;i++)
        {
            for(let j=0;j<newcomers[i].length;j++)
            {
                newcomers[i][j].ghostTo(this.boxCommunities[i].randomX(), this.boxCommunities[i].randomY());
            }
            this.boxCommunities[i].addNewBalls(newcomers[i]);
        }
    }
}

function splitBoxesEvenly(num_boxes, width, height, widthOffset, heightOffset)
{
    let [widthFactor, heightFactor] = findSquarestFactors(num_boxes, width, height);
    let points = [];
    let boxWidth = Math.floor(width/widthFactor);
    let boxHeight= Math.floor(height/heightFactor);
    for(let i=0;i<widthFactor;i++)
    {
        for(let j=0;j<heightFactor;j++)
        {
            let xOffset = widthOffset + boxWidth*i;
            let yOffset = heightOffset + boxHeight*j;
            points.push([
                [xOffset, yOffset],
                [xOffset, yOffset + boxHeight],
                [xOffset + boxWidth, yOffset + boxHeight],
                [xOffset + boxWidth, yOffset]
            ]);
        }
    }
    return points;
}

function findSquarestFactors(num_boxes, width, height)
{
    let dSmall = Math.min(width, height);
    let dLarge = Math.max(width, height);
    const factorsFx = number => Array
    .from(Array(number + 1), (_, i) => i)
    .filter(i => (number != 0 && number % i === 0 && i*i <= number))
    let factors = factorsFx(num_boxes);
    let bestFactor = factors[0];
    let bestRatio = 9999999999999;
    for(let i=0;i<factors.length;i++){
        let factor1 = factors[i];
        let factor2 = num_boxes/factor1;
        let boxD1 = dLarge/factor2;
        let boxD2 = dSmall/factor1;
        let boxDL = Math.max(boxD1, boxD2);
        let boxDS = Math.min(boxD1, boxD2);
        if (boxDL/boxDS < bestRatio)
        {
            bestRatio = boxDL/boxDS;
            bestFactor = factor1;
        }
    }
    let widthFactor = Math.floor(width < height ? bestFactor : num_boxes/bestFactor);
    let heightFactor = Math.floor(num_boxes/widthFactor);
    return [widthFactor, heightFactor];
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
            recoverTime:100,
            numStartingBalls: 300,//max = 500
            startingSickBalls:1,//maybe keep this same?
            ballSpeed:12,
            numCommunities:1,//1 is min
            hasQuarantineBox:0,
            hasMarketBox:0,
            switchCommunityRate:0.003,
            goToMarketFrequency:0.01,
            goToMarketDuration:10,

        })
    }
    simConfigs[3].numCommunities = 4;
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