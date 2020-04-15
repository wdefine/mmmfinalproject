//EPIDEMIOLOGY MACROS
const BALLSPEED = 10;
const BALLRADIUS = 3;
class Ball {
    
    constructor(x, y, id){
        this.radius = BALLRADIUS;
        this.x = x;
        this.y = y;

        this.id = id;//ball id is index in objArray
    
        let angle = Math.random() * 2 * Math.PI; 
        this.dx = BALLSPEED * Math.cos(angle);
        this.dy = BALLSPEED * Math.sin(angle);  
        
        this.socialDistancingWillingness = Math.random();

        // mass is that of a sphere as opposed to circle
        // it *does* make a difference in how realistic it looks
        this.mass = this.radius * this.radius * this.radius;

        this.status = 0; //0=helathy, 1=tested sick, 2=untested sick, 3=recovered
        this.maxCollisionMemory = 25
        this.collisionIndex = 0
        this.collisionHistory = [];
    }; 
    
    getStatus()
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
    
    collide(other, time, transmission){
        let collisionInfo = {"ball":other.id, "meInfectious": this.sick(), "themInfectious": other.sick(), "time": time}
        this.collisionHistory[this.collisionIndex % this.maxCollisionMemory] = collisionInfo;
        this.collisionIndex += 1;
        if(this.status == 0 && other.sick() && transmission){
            this.infectionStart = time;
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
            this.dx /= 1000;
            this.dy /= 1000;
        }
        else{
            let angle1 = this.angle();
            this.dx = BALLSPEED * Math.cos(angle1);
            this.dy = BALLSPEED * Math.sin(angle1);
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
