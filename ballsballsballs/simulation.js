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
        this.symptomStartTime = simConfig.symptomStartTime;
        this.recoverTime = simConfig.recoverTime;
        this.infectionRate = simConfig.infectionRate;
        this.morbidityRate = simConfig.morbidityRate;
        this.symptomaticRate = simConfig.symptomaticRate;
        this.numStartingBalls = simConfig.numStartingBalls;
        this.startingSickBalls = simConfig.startingSickBalls;
        this.ballSpeed = simConfig.ballSpeed;
        this.numCommunities = simConfig.numCommunities;
        this.switchCommunityRate = simConfig.switchCommunityRate;
        this.hasMarketBox = simConfig.hasMarketBox;
        this.marketDuration = simConfig.marketDuration;
        this.marketFrequency = simConfig.marketFrequency;
        this.hasHospitalBox = simConfig.hasHospitalBox;
        this.hospitalizationRate = simConfig.hospitalizationRate;

        this.reset();

        this.canvases = []
    }

    drawCanvas()
    {
        this.clearCanvas(this.ctx, this.canvas);
        //draw boxes
        for(let i=0;i<this.boxArray.length;i++)
        {
            this.boxArray[i].drawBox();//draw boxes on canvas
        }
        //draw balls
        for (let obj in this.ballArray) {
            this.ballArray[obj].draw(this.ctx);
        }
        //this.chart();
    }

    //draw advances the simulation and updates the canvas
    simLoop() {
        this.time += 1;

        this.updateBalls(); //set balls who have recoved as recovered
        this.socialDistance(); //force balls to socially distance
        if(this.numCommunities > 1)
        {
            this.switchCommunities();
        }
        if(this.hasMarketBox)
        {
            this.goToMarket();
        }
        if(this.hasHospitalBox)
        {
            this.hospitalize();
        }
    
        let collisions = [];
        for(let i=0;i<this.boxArray.length;i++)
        {
            this.boxArray[i].moveBalls(this.time);
            this.boxArray[i].wallCollisions();
            collisions = collisions.concat(this.boxArray[i].ballCollisions());
        }
        this.transmitInfection(collisions); //transmit infection on collision

    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.style.backgroundColor = "rgb(255, 255, 255)";
    }

    //chart updates chart
    chart() {
        this.updateChartingInfo();//add sir+ info to 
        let divisor = 10;
        let c = Chartist.Line("#" + this.chartID, {
            //labels:[this.chartingInfo.l],
            series: [
              {name: "Susceptible", data: this.chartingInfo.s, color:"lightblue"},
              {name: "Infected", data: this.chartingInfo.i},
              {name: "Removed", data: this.chartingInfo.r},
              {name: "Dead", data: this.chartingInfo.d}
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
        let dead = 0;
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
            if(status == 'd'){
                dead += 1;
            }
        }
        if(infected == 0){
            this.paused = true; 
            this.done = true;//simulation is over
        }
        this.chartingInfo.s.push(susceptible);
        this.chartingInfo.i.push(infected);
        this.chartingInfo.r.push(recovered);
        this.chartingInfo.d.push(dead);
        this.chartingInfo.l.push(this.chartingInfo.l.length);
    }
    
    initBallsBoxes(){
        let sideBoxes = this.hasMarketBox || this.hasHospitalBox;
        if(sideBoxes)
        {
            let width = Math.min(100, this.canvas.width/2);
            let height = Math.floor(Math.min(200, this.canvas.height)/2);
            let marketBoxPoints = [[0,0],[0,height],[width, height],[width, 0]];
            let hospitalBoxPoints = [[0,height],[0,height*2],[width, height*2],[width, height]];
            if(this.hasMarketBox)
            {
                this.boxMarket = new Box(marketBoxPoints, this.ctx, "green", 2);
            }
            if(this.hasHospitalBox)
            {
                this.boxHospital = new Box(hospitalBoxPoints, this.ctx, "red", 2);
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
            this.ballArray[i+starting_index].getSick(this.time, this.recoverTime, this.symptomStartTime);
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
        this.boxHospital = null;
        this.initBallsBoxes();
        this.boxArray = this.boxCommunities;
        if(this.hasMarketBox)
        {
            this.boxArray.push(this.boxMarket);
        }
        if(this.hasHospitalBox)
        {
            this.boxArray.push(this.boxHospital);
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
            d:[],
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
            ball1.collide(ball2, transmission, this.time, this.symptomStartTime, this.recoverTime);
            ball2.collide(ball1, transmission, this.time, this.symptomStartTime, this.recoverTime);
        }
    }

    updateBalls()
    {
        for(let i=0;i<this.ballArray.length;i++){
            this.ballArray[i].updateStatus(this.time, this.morbidityRate, this.symptomaticRate);
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
        for (let i=0;i<this.ballArray.length;i++)
        {
            this.ballArray[i].changeCommunity(this.boxCommunities[Math.floor(Math.random()*this.numCommunities)], this.switchCommunityRate)
        }
    }

    goToMarket()
    {
        for (let i=0;i<this.ballArray.length;i++)
        {
            this.ballArray[i].goToMarket(this.boxMarket, this.marketFrequency, this.marketDuration, this.time);
        }
    }

    hospitalize()
    {
        for (let i=0;i<this.ballArray.length;i++)
        {
            this.ballArray[i].hospitalize(this.boxHospital, this.hospitalizationRate);
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

            //percent of balls that stay in place with magnetic avoidance
            socialDistanceCompliance: parseFloat(simElements[i].querySelector(".sd").value), //0-1

            //probability that if two balls collide then one will transmit disease
            infectionRate: parseFloat(simElements[i].querySelector(".ir").value),//0-1

            //percent of people who eventually show disease symptoms
            symptomaticRate: 1,//parseFloat(simElements[i].querySelector(".sym").value),//0-1

            //time from infection to recovery/death
            recoverTime:100,

            //time from infection to showing symptoms (some do not show symptoms ever)
            symptomStartTime: 50,

            //rate of people who get sick and show symptoms that die
            morbidityRate: 0.1,

            //num of balls in simulation
            numStartingBalls: 400,

            //balls that start simulation sick
            startingSickBalls:1,

            //speed of balls ->effects number of balls they interact with and speed
            ballSpeed:12,

            //min=1, number of normal boxes
            numCommunities:1,
            //rate at which balls move from one community to another, they do not return 
            switchCommunityRate:0.0015,

            //boolean for has market
            hasMarketBox:1,

            //rate at which balls go to Market, socially distancing balls go to Market 
            marketFrequency:0.001,

            //time spent in market
            marketDuration:20,

            //boolean for has hospital box
            hasHospitalBox:1,

            //rate of balls with symptoms that go to hospital until their infection is over
            hospitalizationRate:0.5,

        })
    }
    simConfigs[1].numCommunities = 100;
    simConfigs[1].hasMarketBox = 0;
    for(let i=0;i<simConfigs.length;i++){
        sims.push(new Simulation(simConfigs[i]))
    }
    window.requestAnimationFrame(step);
});

let global_counter = 0
function step()
{
    for(let i =0;i<sims.length;i++){
        if(!sims[i].paused)
        {
            sims[i].drawCanvas();
            if(global_counter % 15 == 0)
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
}, 60);

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

function updateSymptomaticRate(event)
{
    let [sim, e] = simAndTargetFromEvent(event);
    if(sim)
    {
        sim.symptomaticRate = e.value;
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

//todo
//fix number of starting balls?
//ball ages, affect visuals, speed, -> later affect various mortality rates
