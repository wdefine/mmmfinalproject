//EPIDEMIOLOGY MACROS
function ball(){
const infectionTime = 1000*3;//3s


class Ball {
    
    constructor(x, y, radius){
        this.radius = radius;
        this.x = x;
        this.y = y;
    
        let angle = Math.random() * 2 * Math.PI; 
        this.dx = 4 * Math.cos(angle);
        this.dy = 4 * Math.sin(angle);        

        // mass is that of a sphere as opposed to circle
        // it *does* make a difference in how realistic it looks
        this.mass = this.radius * this.radius * this.radius;

        this.status = 0; //0=helathy, 1=tested sick, 2=untested sick, 3=recovered
    };   

    sick(){
        return this.status == 1 || this.status == 2;
    }
    
    infect(){
        if(this.status == 0){
            this.infectionStart = (new Date()).getTime();
            this.status = 1; //make this 2 when we include testing patients!
        }
    }

    test(){
        if (this.status == 2){
            this.status = 1;
        }
    }

    recover(){
        if(this.sick() && ((new Date()).getTime() - this.infectionStart > infectionTime)){
            this.status = 3;
        }
    }

    draw() {
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
}