/*

Flood Lines 1k 🌊

Generative Art by Frank Force (Give it a minute to artwork generate.)

Generative Art by Frank Force
- Made for JS1024 2025
- Procedurally generated art
- All html and js fits in 1k
- Large variety of outputs
- Different every refresh
- Takes a few seconds to generate
- The margin will appear last
- Demake of my fxhash project called ROIL

*/

'use strict';

// shim variables
a, b, c, d;

/*

document.body.style.margin = '0';
document.body.appendChild(a = document.createElement('canvas'));
a.width = innerWidth;
a.height = innerHeight;
*/


// local variables
let i, j,currentIndex, randomIndex;
let x, y, h, s, l, cell, direction;
let mainHue;
let startLightness;
let shuffleListChance;
let shuffleDirectionsChance;
let rotateAngleChance;
let rotateAngleAmount;
let rotateAngle;
let rotateBias;
let resetHueChance;
let randomizeSettingsChance;
let marginSize;
let hueShift;

// program variables
const updatesPerFrame = 1e4;
let cellsWidth = (a.width = innerWidth)*2;
let cellsHeight = (a.height = innerHeight)*2;
let cells = [];
let fillList = [];
let marginList = [];
let randomSeed = Date.now(hueShift = 0);
let directions = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];


let cellPos = (x, y)=> (x|0) + (y|0) * cellsWidth;

let random = (a=1, b=0)=>
{
    randomSeed ^= randomSeed << 13;
    randomSeed ^= randomSeed >>> 17;
    randomSeed ^= randomSeed << 5;
    return b + (a - b) * ((randomSeed >>> 0) / 2**32);
}

let makeCell = (x, y, v, w, h, s, l) =>
{
    // update position
    x += v;
    y += w;

    if (x > 0 & y > 0 & x < cellsWidth & y < cellsHeight)
    {
        // prevent breaking through walls
        for(j=6; j-- && !cells[cellPos(x+v*j/9, y+w*j/9)];);
        if (j<0)
        {
            // add to list
            cells[cellPos(x,y)] = 1;
            if (!marginList || x >= marginSize && y >= marginSize && x < cellsWidth-marginSize && y < cellsHeight-marginSize)
                fillList.push({x, y, v, w, h, s, l});
            else
                marginList.push({x, y, v, w, h, s, l:99-startLightness});
        }
    }
}

let shuffle = (array)=>
{
    for(currentIndex = array.length; currentIndex;)
    {
        randomIndex = random(currentIndex--)|0;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
}

let randomizeSettings=()=>
{
    shuffleListChance = random(.0001);
    shuffleDirectionsChance = random(.05);
    rotateAngleChance = random() < .5 ? 0 : random()**2;
    rotateAngleAmount = random(.4)**2;
    rotateAngle = random() < .5 ? 0 : .785; // 45 degrees
    rotateBias = random() < .5 ? 1 : random(2);
    resetHueChance = random(.0005);
    hueShift += random(-30, 30);
    //console.log('randomizeSettings');
}

// init
//cellsWidth=cellsHeight=1e3, randomSeed=1225 // test
//console.log(randomSeed, cellsWidth, cellsHeight);
randomizeSettings(c = a.getContext('2d'));
marginSize = random(99, 400);

//cellsWidth = cellsHeight = (a.height = 200)*2; marginSize = 100// thumbnail
startLightness = random() < .5 ? 0 : 99;
randomizeSettingsChance = random(.000001);
cells.length = cellsWidth * cellsHeight; // preallocate array
//c.globalCompositeOperation = 'destination-over'
shuffle(directions);
makeCell(cellsWidth/2, cellsHeight/2, 0, 0, mainHue=random(1e8), 50, startLightness);

// main game loop
setInterval(_=>
{
    if (!fillList.length && marginList)
    {
        fillList = marginList;
        //fillList.push(...marginList);
        hueShift += random(90,270); // 180 +- 90
        randomizeSettings(marginList = 0);
    }

    for(i=updatesPerFrame; i-- && fillList.length;)
    {
        // randomly reset all settings
        if (random() < randomizeSettingsChance)
            randomizeSettings();

        // shuffle fill list
        if (random() < shuffleListChance)
            shuffle(fillList);

        // shuffle directions
        if (random() < shuffleDirectionsChance)
            shuffle(directions)
            
        // rotate angle
        if (random() < rotateAngleChance)
            rotateAngle += (random(2)-rotateBias)*rotateAngleAmount;

        // get next cell
        cell = fillList.pop();
        x = cell.x;
        y = cell.y;

        // mutate color
        h = random() < resetHueChance && marginList ? mainHue : cell.h + random()-.5;
        s = cell.s + random() - .5;
        s = s > 99 ? 99 : s < 1 ? 1 : s;
        l = cell.l + random() - .5;
        l = l > 99 ? 99 : l < 1 ? 1 : l;

        // draw cell
        c.fillStyle = `hsl(${h+random(9)+hueShift},${s-random(5)}%,${l-random(9)}%)`;
        c.fillRect(x/2-.5, y/2-.5, 1.5, 1.5);

        // spread to neighbors
        for(direction of directions)
            makeCell(x, y, 
                direction.x*Math.cos(rotateAngle) - direction.y*Math.sin(rotateAngle), 
                direction.x*Math.sin(rotateAngle) + direction.y*Math.cos(rotateAngle), 
                h, s, l);
    }
}, 
9); // 60 fps update