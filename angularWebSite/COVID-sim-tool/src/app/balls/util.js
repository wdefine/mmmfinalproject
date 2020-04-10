//Bouncing Utils
function util(){
function randomX() {
    let x = Math.floor(Math.random() * canvas.width);
    if (x < 30) {
        x = 30;
    } else if (x + 30 > canvas.width) {
        x = canvas.width - 30;
    }
    return x;
}

function randomY() {
    let y = Math.floor(Math.random() * canvas.height);
    if (y < 30) {
        y = 30;
    } else if (y + 30 > canvas.height) {
        y = canvas.height - 30;
    }
    return y;
}

function distanceNextFrame(a, b) {
    return Math.sqrt((a.x + a.dx - b.x - b.dx)**2 + (a.y + a.dy - b.y - b.dy)**2) - a.radius - b.radius;
}

function distance(a, b) {
    return Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2);
}

//Infection utils
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
}