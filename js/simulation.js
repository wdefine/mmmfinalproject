class Simulation {
    constructor(simConfig){

        //dom variables saved for quick look up
        this.simID = simConfig.simID;
        let sim = document.getElementById(this.simID);
        this.canvasID = sim.querySelector('.canvas').id;
        this.chartID = sim.querySelector('.chart').id;
        this.canvas = document.getElementById(this.canvasID);
        this.ctx = this.canvas.getContext("2d");
        this.config = simConfig;

        //init parameters from simconfig


        this.reset();
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
    }

    //draw advances the simulation and updates the canvas
    simLoop() {
        this.time += 1;

        this.updateBalls(); //set balls who have recoved as recovered
        this.testAndTrace();
        this.socialDistance(); //force balls to socially distance
        this.switchCommunities();
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
        let communitiesExtraSickBall = [];
        for(let i=0;i<this.startingSickBalls%this.numCommunities;i+= 1){
            communitiesExtraSickBall.push(i*Math.floor(this.numCommunities/(this.startingSickBalls%this.numCommunities)));
        }
        for(let i=0;i<this.numCommunities;i++)
        {
            let numSickBalls = Math.floor(this.startingSickBalls/this.numCommunities) + communitiesExtraSickBall.includes(i);
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

    applyControls()
    {
        this.socialDistanceCompliance = this.config.socialDistanceCompliance;
        this.infectionRate = this.config.infectionRate;
        this.morbidityRate = this.config.morbidityRate;
        this.symptomaticRate = this.config.symptomaticRate;
        this.symptomStartTime = this.config.symptomStartTime;
        this.recoverTime = this.config.recoverTime;
        this.numStartingBalls = Math.floor(this.config.numStartingBalls);
        this.startingSickBalls = Math.min(Math.floor(this.config.startingSickBalls), this.numStartingBalls);
        this.ballSpeed = this.config.ballSpeed;
        this.numCommunities = Math.max(1, Math.floor(this.config.numCommunities));
        this.switchCommunityRate = this.config.switchCommunityRate;
        this.hasMarketBox = this.config.hasMarketBox;
        this.marketDuration = this.config.marketDuration;
        this.marketFrequency = this.config.marketFrequency;
        this.hasHospitalBox = this.config.hasHospitalBox;
        this.hospitalizationRate = this.config.hospitalizationRate;
        this.testAndTraceRate = this.config.testAndTraceRate;
        this.testAndTraceInceptionRate = this.config.testAndTraceInceptionRate;
        this.testAndTraceNumContacts = Math.max(0,Math.floor(this.config.testAndTraceNumContacts));
        this.testAndTraceQuarantineMode = this.config.testAndTraceQuarantineMode;
        if(this.testAndTraceQuarantineMode == 1 && this.hasHospitalBox == 0)
        {
            this.testAndTraceQuarantineMode = 0;
        }
    }

    updateControl(name, value)
    {
        const nonDynamicControls = ["numStartingBalls", "startingSickBalls", "ballSpeed", "numCommunities", "hasMarketBox", "hasHospitalBox"];
        if(name in this.config)
        {
            this.config[name] = value;
        }
        if(!nonDynamicControls.includes(name))
        {
            this[name] = value;
        }
    }

    reset(){
        this.applyControls();
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
            ball1.collide(ball2, transmission, this.time, this.symptomaticRate, this.symptomStartTime, this.recoverTime);
            ball2.collide(ball1, transmission, this.time, this.symptomaticRate, this.symptomStartTime, this.recoverTime);
        }
    }

    updateBalls()
    {
        for(let i=0;i<this.ballArray.length;i++){
            this.ballArray[i].updateStatus(this.time, this.morbidityRate, this.hospitalizationRate);
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
            this.ballArray[i].goToMarket(this.boxMarket, this.marketFrequency, this.time, this.marketDuration);
        }
    }

    hospitalize()
    {
        for (let i=0;i<this.ballArray.length;i++)
        {
            this.ballArray[i].hospitalize(this.boxHospital, this.time);
        }
    }

    testAndTrace()
    {
        for (let i=0;i<this.ballArray.length;i++)
        {
            this.ballArray[i].randomTest(this.testAndTraceRate, this.testAndTraceInceptionRate, this.testAndTraceNumContacts, this.testAndTraceQuarantineMode, this.boxHospital);
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
    while(1)
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

//todo
//fix number of starting balls?
//ball ages, affect visuals, speed, -> later affect various mortality rates
//fix balls for less reliance on status, just use status when updating
//remove unneccesary fxn calls from simulation
//add new dynamic knobs to list
