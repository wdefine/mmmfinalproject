class Simulation {
    constructor(canvasID, updateFunction){
        this.ID = canvasID;
        this.updateFunction = updateFunction;

        this.socialDistanceCompliance = 0;
        this.recoverTime = 3*1000;
        this.infectionRate = 1;

        this.canvas = document.getElementById(canvasID);
        var self = this;
        this.canvas.onclick = () => {
            playSimulation(self.ID);
        }
        this.ctx = this.canvas.getContext("2d");

        this.objArray = [];
        this.paused = true;

        this.lastTime = (new Date()).getTime();
        this.currentTime = 0;
        this.time = 0;
        this.dt = 0;

        this.numStartingBalls = 500;
        this.startingSickBalls = 1;
        this.initBalls()

        clearCanvas(this.ctx, this.canvas);
        drawObjects(this.objArray, this.ctx);
    }

    draw() {
        this.currentTime = (new Date()).getTime();
        if(this.paused){
            this.lastTime = this.currentTime;
            return;
        }
                
        // dirty and lazy solution
        // instead of scaling up every velocity vector the program
        // we increase the speed of time
        this.time += (this.currentTime - this.lastTime);
        this.dt = (this.currentTime - this.lastTime) / 1000; // delta time in seconds
        this.dt *= 50;

        clearCanvas(this.ctx, this.canvas);

        this.updateFunction(this);
        this.recover();
        this.socialDistance();

        moveObjects(this.objArray, this.dt);
        wallCollision(this.objArray, this.canvas);
        let collisions = ballCollision(this.objArray);
        this.collideBalls(collisions);
        
        drawObjects(this.objArray, this.ctx);

        this.lastTime = this.currentTime;
    }
    
    initBalls(){
        for (let i = 0; i<this.numStartingBalls; i++) {
            this.objArray[this.objArray.length] = new Ball(randomX(this.canvas), randomY(this.canvas), i);
        }
        for(let i = 0;i<this.startingSickBalls;i++){
            this.objArray[i].status = 2;//infect
            this.objArray[i].infectionStart = 0;
            this.objArray[i].socialDistanceWillingness = 1; //will not socially distance
        }
    }

    reset(){
        this.objArray = [];
        this.paused = true;
        this.lastTime = (new Date()).getTime();
        this.currentTime = 0;
        this.time = 0;
        this.dt = 0;
        this.initBalls();
    }

    collideBalls(collisions){
        for(let i=0;i<collisions.length;i++)
        {
            let ball1 = collisions[i][0];
            let ball2 = collisions[i][1];
            let infectBool = Math.random() < this.infectionRate;
            ball1.collide(ball2, this.time);
            ball2.collide(ball1, this.time);
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

//Infection code
function update1(sim){
    return;
}

function update2(sim){
    return;
}

//set up multiple simulations
let classNames = ["myCanvas", "myCanvas2"];
let updateFunctions = [update1, update2];
let classes = [];
function setup(){
    for(let i=0;i<classNames.length;i++){
        classes.push(new Simulation(classNames[i], updateFunctions[i]))
    }
}
function globalDraw(){
    for(let i =0;i<classes.length;i++){
        classes[i].draw();
    }
    window.requestAnimationFrame(globalDraw);
}

function playSimulation(id){
    console.log("playsim: ", id);
    for(let i =0;i<classes.length;i++){
        if(classes[i].ID != id){
            classes[i].paused = true;
        }
        else{
            classes[i].paused = !classes[i].paused;
        }
        console.log(classes[i].ID, id, classes[i].paused, classes[i].ID == id);
    }
}

setup();
globalDraw(); //loops through each simulation repeatedly

