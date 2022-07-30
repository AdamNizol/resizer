const sharp = require("sharp");
var glob = require("glob")
const fs = require('fs');

const myArgs = process.argv.slice(2);
const keepIndividuals = myArgs.includes("-separate") || myArgs.includes("-s") // keeps a copy of the images in square format individually

async function getMetadata(img) {
  try{
    const metadata = await sharp(img).metadata();
    return metadata
  } catch (err){
    console.log(`An error occurred during processing: ${err}`);
  }
}

function main(){
  var pattern = "inputs/**/*.png"
  var mg = new glob(pattern, {mark: true}, async function (er, matches) {
    console.log("matches", matches)

    let fileNames = []
    for(let i = 0; i < matches.length; i++){
      let fileName = matches[i].split("/")
      fileName = fileName[fileName.length-1]
      fileNames.push(fileName);
      console.log(fileName)

      let metadata = await getMetadata(matches[i]);
      // console.log(metadata);

      let newImage = await sharp(matches[i]).resize(240,240,{
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }).toFile('outputs/tmp/'+fileName)

      let nm = await sharp({
        create: {
          width: 256,
          height: 256,
          channels: 4,
          background: {r: 0, g: 0, b: 0, alpha: 0}
        }
      }).composite([{input:'outputs/tmp/'+fileName}]).toFile('outputs/square/'+fileName)

      fs.unlink('outputs/tmp/'+fileName, (err) => {
        if (err && err.code == "ENOENT") {
          console.info("Error! File doesn't exist.");
        } else if (err) {
          console.error("Something went wrong. Please try again later.");
        }
      });
    }

    let sheetWidth = Math.ceil(Math.pow(fileNames.length, 0.5));
    console.log(sheetWidth)
    let compositeInput = []
    for(let i = 0; i < fileNames.length; i++){
      compositeInput.push({
        input: 'outputs/square/'+fileNames[i],
        top: 256*(Math.floor(i/sheetWidth)),
        left: 256*(Math.floor(i%sheetWidth))
      })
    }

    let nm = await sharp({
      create: {
        width: 256*sheetWidth,
        height: 256*sheetWidth,
        channels: 4,
        background: {r: 0, g: 0, b: 0, alpha: 0}
      }
    }).composite(compositeInput).toFile('outputs/sheet.png')

    if(!keepIndividuals){
      for(let i = 0; i < fileNames.length; i++){
        fs.unlink('outputs/square/'+fileNames[i], (err) => {
          if (err && err.code == "ENOENT") {
            console.info("Error! File doesn't exist.");
          } else if (err) {
            console.error("Something went wrong. Please try again later.");
          }
        });
      }
    }

  })
}

main();
