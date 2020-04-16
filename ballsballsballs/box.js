const COLLISIONVELOCITYCONSTANT = true;

class Box {
    constructor(points, ctx, color, margin)
    {
        //points must be IN ORDER around square, order doesn't matter
        if(margin > 0)
        {
            for(let i=0;i<2;i++)
            {
                for(let j=0;j<2;j++)
                {
                    if(points[i][j] < points[i+2][j])
                    {
                        points[i][j] += margin;
                        points[i+2][j] -= margin
                    }
                    else
                    {
                        points[i][j] -= margin;
                        points[i+2][j] += margin
                    }
                }
            }
        }
        this.points = points;
        this.x1 = Math.min(this.points[0][0], this.points[2][0]);
        this.x2 = Math.max(this.points[0][0], this.points[2][0]);
        this.y1 = Math.min(this.points[0][1], this.points[2][1]);
        this.y2 = Math.max(this.points[0][1], this.points[2][1]);

        this.ctx = ctx;
        this.color = color;
        this.ballArray = [];
    }

    createBallInBox(id, ballSpeed)
    {
        let x = this.x1 + 10 + Math.floor(Math.random() * (this.x2-this.x1 - 20));
        let y = this.y1 + 10 + Math.floor(Math.random() * (this.y2-this.y1 - 20));
        let ball = new Ball(x, y, id, ballSpeed);
        this.ballArray.push(ball);
        return ball;
    }

    getLeavingBalls(switchRate)
    {
        let leavers = [];
        let remainers = [];
        for(let i=this.ballArray.length-1;i>=0;i--)
        {
            let ball = this.ballArray[i];
            if(!ball.socialDIstancing && Math.random() < switchRate && ball.ghostFuture == false)
            {
                leavers.push(ball);
            }
            else{
                remainers.push(ball);
            }
        }
        this.ballArray = remainers;
        return leavers;
    }

    addNewBalls(newcomers)
    {
        for(let i=0;i<newcomers.length;i++)
        {
            this.ballArray.push(newcomers[i]);
        }
    }

    drawBox()
    {
        for(let i=0;i<4;i++)
        {
            this.ctx.beginPath(); 
            this.ctx.strokeStyle = this.color;
            // Staring point (10,45)
            this.ctx.moveTo(this.points[i][0],this.points[i][1]);
            // End point (180,47)
            this.ctx.lineTo(this.points[(i+1) % 4][0],this.points[(i+1) % 4][1]);
            // Make the line visible
            this.ctx.stroke();
        }
    }

    moveBalls(time)
    {
        for (let i=0; i<this.ballArray.length; i++) {
            this.ballArray[i].move(time);
        }
    }

    wallCollisions()
    {
        for(let i =0;i<this.ballArray.length;i++){
            let ball = this.ballArray[i];
            if(ball.ghostMode){
                continue;
            }
            if (ball.x - ball.radius + ball.dx < this.x1||
                ball.x + ball.radius + ball.dx > this.x2) {
                ball.dx *= -1;
            }
            if (ball.y - ball.radius + ball.dy < this.y1 ||
                ball.y + ball.radius + ball.dy > this.y2) {
                ball.dy *= -1;
            }
            if (ball.y + ball.radius > this.y2) {
                ball.y = this.y2 - ball.radius;
            }
            if (ball.y - ball.radius < this.y1) {
                ball.y = this.y1 + ball.radius;
            }
            if (ball.x + ball.radius > this.x2) {
                ball.x = this.x2 - ball.radius;
            }
            if (ball.x - ball.radius < this.x1) {
                ball.x = this.x1 + ball.radius;
            } 
        }
    }

    ballCollisions()
    {
        let collisions = []
        for (let i=0; i<this.ballArray.length-1; i++) {
            if( this.ballArray[i].ghostMode)
            {
                continue;
            }
            for (let j=i+1; j<this.ballArray.length; j++) {
                let ob1 = this.ballArray[i]
                let ob2 = this.ballArray[j]
                if(ob2.ghostMode){
                    continue;
                }
                let dist = distance(ob1, ob2)
    
                if (dist < ob1.radius + ob2.radius) { 
                    let theta1 = ob1.angle();
                    let theta2 = ob2.angle();
                    let phi = Math.atan2(ob2.y - ob1.y, ob2.x - ob1.x);
                    let m1 = ob1.mass;
                    let m2 = ob2.mass;
                    let v1 = ob1.speed();
                    let v2 = ob2.speed();
    
                    let dx1F = (v1 * Math.cos(theta1 - phi) * (m1-m2) + 2*m2*v2*Math.cos(theta2 - phi)) / (m1+m2) * Math.cos(phi) + v1*Math.sin(theta1-phi) * Math.cos(phi+Math.PI/2);
                    let dy1F = (v1 * Math.cos(theta1 - phi) * (m1-m2) + 2*m2*v2*Math.cos(theta2 - phi)) / (m1+m2) * Math.sin(phi) + v1*Math.sin(theta1-phi) * Math.sin(phi+Math.PI/2);
                    let dx2F = (v2 * Math.cos(theta2 - phi) * (m2-m1) + 2*m1*v1*Math.cos(theta1 - phi)) / (m1+m2) * Math.cos(phi) + v2*Math.sin(theta2-phi) * Math.cos(phi+Math.PI/2);
                    let dy2F = (v2 * Math.cos(theta2 - phi) * (m2-m1) + 2*m1*v1*Math.cos(theta1 - phi)) / (m1+m2) * Math.sin(phi) + v2*Math.sin(theta2-phi) * Math.sin(phi+Math.PI/2);
    
                    ob1.dx = dx1F;                
                    ob1.dy = dy1F;                
                    ob2.dx = dx2F;                
                    ob2.dy = dy2F;
    
                    if(COLLISIONVELOCITYCONSTANT)
                    {
                        let angle1 = ob1.angle();
                        let angle2 = ob2.angle();
                        ob1.dx = v1 * Math.cos(angle1);
                        ob1.dy = v1 * Math.sin(angle1);
                        ob2.dx = v2 * Math.cos(angle2);
                        ob2.dy = v2 * Math.sin(angle2);
                    }
    
              
                    staticCollision(ob1, ob2)
    
                    collisions.push([ob1, ob2])
                    
                }            
            }
        }
        
        return collisions;
    }
}

function distance(a, b) {
    return Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2);
}

function staticCollision(ob1, ob2, emergency=false)
{
    let overlap = ob1.radius + ob2.radius - distance(ob1, ob2);
    let smallerObject = ob1.radius < ob2.radius ? ob1 : ob2;
    let biggerObject = ob1.radius > ob2.radius ? ob1 : ob2;

    // When things go normally, this line does not execute.
    // "Emergency" is when staticCollision has run, but the collision
    // still hasn't been resolved. Which implies that one of the objects
    // is likely being jammed against a corner, so we must now move the OTHER one instead.
    // in other words: this line basically swaps the "little guy" role, because
    // the actual little guy can't be moved away due to being blocked by the wall.
    if (emergency) [smallerObject, biggerObject] = [biggerObject, smallerObject]
    
    let theta = Math.atan2((biggerObject.y - smallerObject.y), (biggerObject.x - smallerObject.x));
    smallerObject.x -= overlap * Math.cos(theta);
    smallerObject.y -= overlap * Math.sin(theta); 

    if (distance(ob1, ob2) < ob1.radius + ob2.radius) {
        // we don't want to be stuck in an infinite emergency.
        // so if we have already run one emergency round; just ignore the problem.
        if (!emergency) staticCollision(ob1, ob2, true)
    }
}