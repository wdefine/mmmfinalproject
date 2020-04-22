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

        this.infectionStart = 0;
        this.symptomsStart = 0;
        this.infectionEnd = 0;
        
        this.socialDistancingWillingness = Math.random();
        this.dieProbability = Math.random();
        this.socialDistancing = false;
        this.showsSymptoms = Math.random();
        this.needHospitalization = Math.random();
        this.wouldBeTestAndTraced = Math.random();

        // mass is that of a sphere as opposed to circle
        // it *does* make a difference in how realistic it looks
        this.mass = this.radius * this.radius * this.radius;

        this.status = 0; //0=helathy, 1=sick+symptomatic, 2=sick+unsymptomatic, 3=recovered, 4=dead
        this.tested = false;
        this.testSD = false;
        this.maxCollisionMemory = 25
        this.collisionIndex = 0
        this.collisionHistory = [];

        this.box = box;
        this.ghostMode = false;
        this.ghostTurns = 0;
        this.ghostFuture = false;
        this.ghostReturn = null;
        this.ghostReturnTime = null;
        this.ghostReturnBox = null;
    };
    
    changeCommunity(newBox, switchRate)
    {
        if(Math.random() < switchRate && this.ghostFuture == false && this.ghostMode == false)
        {
            if(newBox == this.box)
            {
                return;
            }
            this.ghostTo(newBox.randomX(), newBox.randomY());
            this.switchBox(newBox);
        }
    }

    goToMarket(marketBox, rate, time, duration)
    {
        if(Math.random() < rate && this.ghostFuture == false && this.ghostMode == false)
        {
            this.socialDistancing = false;
            this.ghostTo(marketBox.randomX(), marketBox.randomY(), true, time + duration, this.box);
            this.switchBox(marketBox);
        }
    }

    hospitalize(hospitalBox, rate, time)
    {
        if(this.status == 1 && this.needHospitalization < rate && this.ghostFuture == false && this.ghostMode == false)
        {
            this.ghostTo(hospitalBox.randomX(), hospitalBox.randomY(), true, this.infectionEnd, this.box);
            this.switchBox(hospitalBox);
        }
    }

    ghostTo(x, y, returnHome=false, returnTime=0, oldBox=null)
    {
        this.ghostMode = true;
        this.ballSpeed *= 4;
        this.ghostTurns = Math.floor(Math.sqrt((this.x - x)**2 + (this.y - y)**2) / (dt*this.ballSpeed));
        if(this.isSick())
        {
            this.infectionEnd += this.ghostTurns;
        }
        this.ghostFuture = returnHome;
        this.ghostReturn = [this.x, this.y];
        this.ghostReturnTime = returnTime + this.ghostTurns;
        this.ghostReturnBox = oldBox;
        let angle = Math.atan2(y-this.y, x-this.x);
        this.dx = this.ballSpeed * Math.cos(angle);
        this.dy = this.ballSpeed * Math.sin(angle);  
    }

    switchBox(newBox)
    {
        this.box.removeBall(this);
        this.box = newBox;
        this.box.addNewBall(this);
    }

    move(time)
    {
        if(this.ghostMode)
        {
            if(this.ghostTurns > 0)
            {
                this.ghostTurns -=1;
            }
            else{
                this.ballSpeed /= 4;
                let angle = Math.random() * 2 * Math.PI; 
                this.dx = this.ballSpeed * Math.cos(angle);
                this.dy = this.ballSpeed * Math.sin(angle); 
                this.ghostMode = false; 
            }
        }
        else if (this.ghostFuture && this.ghostReturnTime < time)
        {
            this.switchBox(this.ghostReturnBox);
            this.ghostTo(this.ghostReturn[0], this.ghostReturn[1]);
        } 
        if(!this.socialDistancing)
        {
            this.x += this.dx * dt;
            this.y += this.dy * dt;
        }
    }
    
    collide(other, transmission, time, symptomStartTime, recoverTime)
    {
        //tracing data
        let collisionInfo = {"ball":other, "meInfectious": this.isSick(), "themInfectious": other.isSick(), "time": time}
        this.collisionHistory[this.collisionIndex % this.maxCollisionMemory] = collisionInfo;
        this.collisionIndex += 1;

        //infection
        if(this.status == 0 && other.isSick() && transmission){
            this.getSick(time, recoverTime, symptomStartTime);
        }
    }

    getSick(time, recoverTime, symptomStartTime)
    {
        this.infectionStart = time;
        this.symptomsStart = time + symptomStartTime;
        this.infectionEnd = time + recoverTime;
        this.status = 2;
    }

    randomTest(rate, inceptionRate, numContacts, quarantineMode, hospitalBox=null){
        if(this.wouldBeTestAndTraced < rate && this.status == 1 && !this.tested)
        {
            this.testAndTrace(rate, inceptionRate, numContacts, quarantineMode, hospitalBox);
        }
    }

    testAndTrace(rate, inceptionRate, numContacts, quarantineMode, hospitalBox=null)
    {
        if(this.wouldBeTestAndTraced < rate && this.isSick() && !this.tested)
        {
            this.tested = true;
            this.testSD = !quarantineMode;
            if(quarantineMode && this.ghostFuture == false && this.ghostMode == false)
            {
                this.ghostTo(hospitalBox.randomX(), hospitalBox.randomY(), true, this.infectionEnd, this.box);
                this.switchBox(hospitalBox);
            }
            for(let i=this.collisionIndex-1;i >=0 && i >= this.collisionIndex - numContacts;i--)
            {
                let collision = this.collisionHistory[i % this.maxCollisionMemory]
                collision["ball"].testAndTrace(inceptionRate, inceptionRate, numContacts, quarantineMode, hospitalBox);
            }
        }
    }



    testAntibodies(){
        return this.isSick() || this.status == 3;
    }

    updateStatus(time, morbidityRate, symptomaticRate){
        if(this.isSick() && (time >= this.symptomsStart) && this.showsSymptoms < symptomaticRate)
        {
            this.status = 1;
        }
        if(this.isSick() && (time >= this.infectionEnd)){
            if(this.dieProbability < morbidityRate && this.status == 1)
            {
                this.dx = 0;
                this.dy = 0;
                this.ghostMode = true;
                this.ghostTurns = 999999999999;
                this.status = 4
            }
            else{
                this.status = 3;
            }
        }
    }

    socialDistance(percentCompliance){
        this.socialDistancing = ((this.socialDistancingWillingness < percentCompliance) || (this.isSick() && this.tested && this.testSD)) && !this.ghostMode && !this.ghostFuture;
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

    isSick()
    {
        return this.status == 1 || this.status == 2;
    }

    color(){
        if(this.status == 0){
            return "lightblue";
        }
        //if((this.status == 1 || this.status == 2) && this.tested){
        //    return "purple";
        //}
        if(this.status == 1){
            return "red";
        }
        if(this.status == 2){
            return "yellow";
        }
        else if(this.status == 3){
            return "green";
        }
        else{
            return "black"
        }
    }

    getSIRStatus()
    {
        let ret = "s";
        if(this.status == 0){
            ret = "s";
        } 
        else if(this.status == 1 || this.status == 2){
            ret = "i";
        } 
        else if(this.status == 3){
            ret = "r";
        }
        else{
            ret = "d";
        }
        return ret;
    }
};
