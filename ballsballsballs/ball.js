//EPIDEMIOLOGY MACROS
const BALLRADIUS = 3;
const dt = 50* 10/1000;
class Ball {
    
    constructor(x, y, id, ballSpeed){
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

        this.ghostMode = false;
        this.ghostToX  = null;
        this.ghostToY  = null;
        this.ghostFuture = false;
        this.ghostReturn = null;
        this.ghostEndTime = null;
    }; 

    ghostTo(x, y, returnHome=false, time=20)
    {
        this.ghostTime = true;
        this.ghostToX = x;
        this.ghostToY = y;
        if(returnHome)
        {
            this.ghostFuture = true;
            this.ghostReturn = [this.x, this.y];
            this.ghostEndTime = time;
        }
        let angle = Math.atan2(y-this.y, x-this.x);
        this.dx = 3 * this.ballSpeed * Math.cos(angle);
        this.dy = 3 * this.ballSpeed * Math.sin(angle);  
    }

    move(time){
        if(this.ghostMode)
        {
            //move towards ghost point
            if(this.dx * dt > Math.abs(this.x - this.ghostToX))
            {
                this.x = this.ghostToX;
                this.y = this.ghostToY;
                let angle = Math.random() * 2 * Math.PI; 
                this.dx = this.ballSpeed * Math.cos(angle);
                this.dy = this.ballSpeed * Math.sin(angle); 
                this.ghostMode = false; 
            }
            else
            {
                this.x += this.dx * dt;
                this.y += this.dy * dt;
            }
        }
        else if (this.ghostFuture && IAMHEREEEEEEE){}
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
        ctx.fillStyle = color(this.status);
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
};

function color(status){
    if(status == 0){
        return "lightblue";
    }
    if(status == 1){
        return "red";
    }
    if(status == 2){
        return "yellow";
    }
    else{
        return "grey";
    }
}
