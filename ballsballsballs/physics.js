const COLLISIONVELOCITYCONSTANT = true;

function randomX(canvas) {
    let x = Math.floor(Math.random() * canvas.width);
    if (x < 10) {
        x = 10;
    } else if (x + 10 > canvas.width) {
        x = canvas.width - 10;
    }
    return x;
}

function randomY(canvas) {
    let y = Math.floor(Math.random() * canvas.height);
    if (y < 10) {
        y = 10;
    } else if (y + 10 > canvas.height) {
        y = canvas.height - 10;
    }
    return y;
}

function distanceNextFrame(a, b) {
    return Math.sqrt((a.x + a.dx - b.x - b.dx)**2 + (a.y + a.dy - b.y - b.dy)**2) - a.radius - b.radius;
}

function distance(a, b) {
    return Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2);
}

function clearCanvas(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.backgroundColor = "rgb(255, 255, 255)";
}

function wallCollision(objArray, canvas) {
    for(let i =0;i<objArray.length;i++){
        ball = objArray[i];
        // x-cell 1, 4
        if (ball.x > 0 && ball.x < canvas.width / 3) {
            if (ball.x - ball.radius + ball.dx < 0|| 
                ball.x + ball.radius + ball.dx > canvas.width / 3) {
                ball.dx *= -1;
            }

            if (ball.x + ball.radius > canvas.width / 3) {
                ball.x = canvas.width / 3 - ball.radius;
            }
            if (ball.x - ball.radius < 0) {
                ball.x = ball.radius;
            } 
        }

        // x-cell 2, 5
        if (ball.x > canvas.width / 3 && ball.x < 2 * canvas.width / 3) {
            if (ball.x - ball.radius + ball.dx < canvas.width / 3 || 
                ball.x + ball.radius + ball.dx > 2 * canvas.width / 3) {
                ball.dx *= -1;
            }

            if (ball.x + ball.radius > 2 * canvas.width / 3) {
                ball.x = 2 * canvas.width / 3 - ball.radius;
            }
            if (ball.x - ball.radius < canvas.width / 3) {
                ball.x = ball.radius;
            } 
        }

        // x-cell 3, 6
        if (ball.x > 2 * canvas.width / 3 && ball.x < canvas.width) {
            if (ball.x - ball.radius + ball.dx < 2 * canvas.width / 3 || 
                ball.x + ball.radius + ball.dx > canvas.width) {
                ball.dx *= -1;
            }

            if (ball.x + ball.radius > canvas.width) {
                ball.x = canvas.width - ball.radius;
            }
            if (ball.x - ball.radius < 2 * canvas.width / 3) {
                ball.x = ball.radius;
            } 
        }
        
        // y-cell 1, 2, 3
        if (ball.y > 0 && ball.y < canvas.height / 2) {
            if (ball.y - ball.radius + ball.dy < 0 ||
                ball.y + ball.radius + ball.dy > canvas.height / 2) {
                ball.dy *= -1;
            }   

            if (ball.y + ball.radius > canvas.height / 2) {
                ball.y = canvas.height / 2 - ball.radius;
            }
            if (ball.y - ball.radius < 0) {
                ball.y = ball.radius;
            }
        }

        // y-cell 4, 5, 6
        if (ball.y > canvas.height / 2 && ball.y < canvas.height) {
            if (ball.y - ball.radius + ball.dy < canvas.height / 2 ||
                ball.y + ball.radius + ball.dy > canvas.height) {
                ball.dy *= -1;
            }   

            if (ball.y + ball.radius > canvas.height) {
                ball.y = canvas.height - ball.radius;
            }
            if (ball.y - ball.radius < canvas.height / 2) {
                ball.y = ball.radius;
            }
        }
    }   
}

function ballCollision(objArray) {
    let collisions = []
    for (let i=0; i<objArray.length-1; i++) {
        if( objArray[i].ghostMode)
        {
            continue;
        }
        for (let j=i+1; j<objArray.length; j++) {
            let ob1 = objArray[i]
            let ob2 = objArray[j]
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

function moveObjects(objArray, dt) {
    for (let i=0; i<objArray.length; i++) {
        let ob = objArray[i];
        ob.x += ob.dx * dt;
        ob.y += ob.dy * dt;
    }    
}

function drawObjects(objArray, ctx) {
    for (let obj in objArray) {
        objArray[obj].draw(ctx);
    }
}
