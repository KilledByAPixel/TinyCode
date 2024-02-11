'use strict';

// constants
const tempoBPM = 90;
const secondsPerMinute = 60;
const sampleRate = 48e3;
const baseNoteFrequency = 55;
const baseNoteVolume = .1;
const beatSubStep = 4;
const songLengthBeatSubs = 64*16;

// locals
let i, j, k;
let hasClicked, phrase, beatSub, randomSeed;
let time, startTime, audioContext, audioBuffer, samples;
let random = r => (randomSeed=randomSeed*9%1)*r;

// create a sound for a note
let makeSound = (semitone, volume, 
    length, attack, release, noise=0, envelope=3, beatOffset=4, curve=1) =>
{
    // create the samples
    length *= sampleRate;
    for (i = 0; i < length; ++i)
    {
        samples[i + (beatSub + beatOffset) *                        // offset
            (secondsPerMinute*sampleRate/tempoBPM/beatSubStep)]     // beat to sample
        =
        (samples[i + (beatSub + beatOffset) *                       // offset
            (secondsPerMinute*sampleRate/tempoBPM/beatSubStep)]||0) // beat to sample & clear
            + volume * baseNoteVolume * (Math.cos(i *            // volume   
            (2**(semitone/12-1) *                                // diatonic scale
                2*Math.PI * baseNoteFrequency/sampleRate)        // frequency
            )**curve + 2 * random(noise)-noise) *                // wave
            (   i < attack*length ? i / attack/length :          // attack
                i < release*length ? 1 :                         // sustain
                1 - (i-release*length) / (length-release*length) // release
            )**envelope;                                         // envelope               
    }
}

function updateMusic()
{
    if (beatSub < songLengthBeatSubs)
    {
        phrase = beatSub / 32 | 0;

        // synth
        if (beatSub%4 == 0)
        {
            V.before('KBAP LB2024 ');
            for (k=3;k--;)
                makeSound([36, 31][phrase % 2]+[0,4,7][k],   .8-k/4, 
                .73,//(secondsPerMinute / tempoBPM)*1.1,     // sync with tempo
                .95,     .95,    0, 3, 2);
        }

        // bass
        if (phrase > 2)
        if (beatSub%4)
        {
            makeSound(0+ [12,7,4,5][phrase%4],  1, .2,     .02,     .7);
            makeSound(12+[12,7,4,5][phrase%4], .5, .2,     .02,     .7);
        }

        // keys
        if (phrase>>3 == 1)
        if (random(3)<2)
        {
            makeSound([36, 31][phrase%2] + [0,4,7,11,12][random(5)|0],   
                1, .4,     .05,     .05,     0, 5,4,5);
        }
        
        if (phrase && (phrase>>2)%4<3)
        {
            // kick
            if (beatSub%8 == 0)
                makeSound(7, 3,  .3,    .01,     .4);

            // snare
            if (beatSub%8==4 || beatSub%32>31 - random(3))
                makeSound(7,   .4, .4,   0,    0,      1);
        }

        // hh
        if (phrase < 30) // stop early
        if (!(phrase>>3 == 1 && phrase != 15)) // not during keys solo
        if (phrase > 5 && (phrase>>2)%2)
        if (beatSub%2==0 || (beatSub%32>16 || phrase>>1==10) && random(3)<1)
            makeSound(99, .1, random(.04)+.04,   0,     0, random(2)+3, 5);
    }
    ++beatSub;
}

{
    // init
    samples = [audioBuffer = hasClicked = beatSub = 0];
    V.style = "position:fixed;width:100%;top:0;left:0";
    audioContext = new AudioContext;
    onclick = e=> hasClicked = 1;
    randomSeed = .3;
}

setInterval(_=>
{
    // update time
    time = audioBuffer ? audioContext.currentTime - startTime : 0;

    // get current phrase
    phrase = (time * (tempoBPM/secondsPerMinute*4)-4)/32|0;
   
    // clear canvas
    V.height = V.width = 1e3;
    
    for (j=9;--j;)
    {
        updateMusic(); // build music

        // draw visualizer
        for (i=0;i<1e3&&i<1e3*beatSub/songLengthBeatSubs;++i)
        {
            k = 1+samples[(time * sampleRate+(i-500)*j**4/30)|0]**2*9||0;
            C.fillStyle=`hsl(${30*j*phrase*phrase-k*90+90} ${99-j*11+60*(phrase>>3 == 1)}%${9+k*30}%`;
            C.fillRect(i,j<8&&340-k*j*12,1,j<8?k*j*16:1e3)
        }
    }

    // start the music
    if (beatSub > songLengthBeatSubs & !audioBuffer & hasClicked)
    {
        // reverb in time with rhythm
        j = samples.length + 2e5;
        for (i = 0; i < j; ++i)
            samples[i] = samples[i] + .3 * samples[i -
                (secondsPerMinute * (2/tempoBPM/beatSubStep) * sampleRate)
            ]||0;

        // create audio from samples and play
        audioBuffer = audioContext.createBuffer(1, j, sampleRate);
        audioBuffer.getChannelData(0).set(samples);
        j = audioContext.createBufferSource();
        j.buffer = audioBuffer;
        j.connect(audioContext.destination);
        j.start();
        startTime = audioContext.currentTime;
    }
}, 16);