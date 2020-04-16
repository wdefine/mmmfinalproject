//EPIDEMIOLOGY MACROS
const BALLRADIUS = 3;
const dt = 50* 10/1000;
class Ball {
    
    constructor(x, y, id, ballSpeed, box){
        this.ballSpeed = ballSpeed;
        this.radius = BALLRADIUS;
        this.x = x;
        this.y = y;

        this.id = id;//ball id is index in ballArray
    
        let angle = Math.random() * 2 * Math.PI; 
        this.dx = this.ballSpeed * Math.cos(angle);
        this.dy = this.ballSpeed * Math.sin(angle);  
        
        this.socialDistancingWillingness = Math.random();
        this.socialDistancing = false;
        this.showsSymptoms = Math.random();

        // mass is that of a sphere as opposed to circle
        // it *does* make a difference in how realistic it looks
        this.mass = this.radius * this.radius * this.radius;

        this.status = 0; //0=helathy, 1=sick+symptomatic, 2=sick+unsymptomatic, 3=recovered
        this.maxCollisionMemory = 25
        this.collisionIndex = 0
        this.collisionHistory = [];

        this.box = null;
        this.ghostMode = false;
        this.ghostToX  = null;
        this.ghostToY  = null;
        this.ghostTurns = 0;
        this.ghostFuture = false;
        this.ghostReturn = null;
        this.ghostEndTime = null;
        this.ghostReturnBox = null;
    }; 

    ghostTo(x, y, returnHome=false, time=20, oldBox=null)
    {
        this.ghostMode = true;
        this.ghostToX = x;
        this.ghostToY = y;
        this.ballSpeed *= 3;
        this.ghostTurns = Math.floor(Math.sqrt((this.x - x)**2 + (this.y - y)**2) / (dt*this.ballSpeed));
        this.ghostReturn = [this.x, this.y];
        this.ghostEndTime = time;
        this.ghostReturnBox = oldBox;
        if(returnHome)
        {
            this.ghostFuture = true;
        }
        let angle = Math.atan2(y-this.y, x-this.x);
        this.dx = this.ballSpeed * Math.cos(angle);
        this.dy = this.ballSpeed * Math.sin(angle);  
    }

    move(time){
        if(this.ghostMode)
        {
            if(this.ghostTurns > 0)
            {
                this.x += this.dx * dt;
                this.y += this.dy * dt;
                this.ghostTurns -=1;
            }
            else{
                this.ballSpeed /= 3;
                let angle = Math.random() * 2 * Math.PI; 
                this.dx = this.ballSpeed * Math.cos(angle);
                this.dy = this.ballSpeed * Math.sin(angle); 
                this.ghostMode = false; 
            }
        }
        else if (this.ghostFuture && this.ghostEndTime < time)
        {
            this.ghostMode = true;
            this.ghostFuture = false;
            this.ghostToX = this.ghostReturn[0];
            this.ghostToY = this.ghostReturn[1];
            this.ghostReturn = null;
            this.ghostEndTime = null;
            this.box.removeBall(this);
            this.ghostReturnBox.addNewBalls([this]);
            this.ghostReturnBox = null;
        }
        else{
            this.x += this.dx * dt;
            this.y += this.dy * dt;
        }
    }
    
    getSIRStatus()
    {
        if(this.status == 0)
        {
            return "s"
        }
        else if(this.status == 1 || this.status == 2)
        {
            return "i"
        }
        else if(this.status == 3)
        {
            return "r"
        }
    }

    sick(){
        return this.status == 1 || this.status == 2;
    }
    
    collide(other, time, transmission, symptomatic){
        let collisionInfo = {"ball":other.id, "meInfectious": this.sick(), "themInfectious": other.sick(), "time": time}
        this.collisionHistory[this.collisionIndex % this.maxCollisionMemory] = collisionInfo;
        this.collisionIndex += 1;
        if(this.status == 0 && other.sick() && transmission){
            this.getSick(time, symptomatic);
        }
    }

    getSick(time, symptomatic)
    {
        this.infectionStart = time;
        if(this.showsSymptoms < symptomatic)
        {
            this.status = 1;
        }
        else{
            this.status = 2;
        }
    }

    testSick(){
        if (this.status == 2){
            this.status = 1;
        }
        return this.status == 1;
    }

    testAntibodies(){
        return this.sick() || this.status == 3;
    }

    recover(recoverTime, time){
        if(this.sick() && (time - this.infectionStart > recoverTime)){
            this.status = 3;
        }
    }

    socialDistance(percentCompliance){
        if(this.socialDistancingWillingness < percentCompliance){
            this.socialDistancing = true;
            this.dx /= 1000;
            this.dy /= 1000;
        }
        else{
            this.socialDistancing = false;
            let angle1 = this.angle();
            this.dx = this.ballSpeed * Math.cos(angle1);
            this.dy = this.ballSpeed * Math.sin(angle1);
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(Math.round(this.x), Math.round(this.y), this.radius, 0, 2*Math.PI);
        ctx.fillStyle = this.color();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.stroke();
        ctx.closePath();
    };

    speed() {
        // magnitude of velocity vector
        return Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    };
    angle() {
        // velocity's angle with the x axis
        return Math.atan2(this.dy, this.dx);
    };

    color(){
        if(this.status == 0){
            return "lightblue";
        }
        if(this.status == 1){
            return "red";
        }
        if(this.status == 2){
            return "yellow";
        }
        else{
            return "green";
        }
    }
};
