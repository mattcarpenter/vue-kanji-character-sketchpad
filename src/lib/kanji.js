const svgUtils = require('./svg-utils')
const hausdorff = require('./hausdorff')
const turf = require('turf')

// i.e.: hausdorff distance of 75px tolerated for every 500px of sketchpad width
const TOLERANCE_WIDTH = 500
const TOLERANCE = 75

export const fromXml = (xml) => {
  return new Kanji(xml)
}

function Kanji(xml) {
  this.strokes = svgUtils.xmlToPathPoints(xml)
  this.originalDimensions = svgUtils.dimensionsFromXml(xml)
  this.trimmedStrokes = []
  //let minX
  //let minY

  /*this.strokes.forEach(stroke => {
    stroke.forEach(point => {
      minX = typeof minX === 'undefined' ? point.x : Math.min(point.x, minX)
      minY = typeof minY === 'undefined' ? point.y : Math.min(point.y, minY)
    })
  })

  this.strokes.forEach((stroke, strokeIndex) => {
    this.trimmedStrokes[strokeIndex] = this.strokes[strokeIndex].slice(0)
    stroke.forEach((point, pointIndex) => {
      this.trimmedStrokes[strokeIndex][pointIndex].x -= minX
      this.trimmedStrokes[strokeIndex][pointIndex].y -= minY
    })
  })*/
}

Kanji.prototype.getStrokes = function ()  {
  //return this.trimmedStrokes
  return this.strokes
}

Kanji.prototype.getDimensions = function () {
  return this.originalDimensions
  
  /*let maxX = 0
  let maxY = 0
  this.trimmedStrokes.forEach(stroke => {
    stroke.forEach(point => {
      maxX = Math.max(point.x, maxX)
      maxY = Math.max(point.y, maxY)
    })
  })

  return {
    width: maxX,
    height: maxY
  }*/
}

Kanji.prototype.getXml = function (width, height, guideStrokeColor) {
  let scaledStrokes = this.getScaledStrokes(width, height)
  return svgUtils.convertPointArraysToXML(scaledStrokes, guideStrokeColor)
}

Kanji.prototype.getScaledStrokes = function (width, height) {
  // TODO - Implement a better deep clone strategy. This is totally bad.
  let scaledStrokes = JSON.parse(JSON.stringify(this.strokes))

  let dimensions = this.getDimensions()
  scaledStrokes.forEach((stroke) => {
    stroke.forEach((point, pointIndex) => {
      stroke[pointIndex].x *= width / dimensions.width
      stroke[pointIndex].y *= height / dimensions.height
    })
  })
  return scaledStrokes
}

Kanji.prototype.getScaledTrimmedStrokes = function(width, height) {
  let strokes = JSON.parse(JSON.stringify(this.strokes))

  // Determine margins
  let minX = null
  let minY = null
  strokes.forEach(stroke => {
    stroke.forEach(point => {
      minX = minX === null ? point.x : Math.min(point.x, minX)
      minY = minY === null ? point.y : Math.min(point.y, minY)
    })
  })

  // Trim
  let maxX = 0
  let maxY = 0
  strokes.forEach(stroke => {
    stroke.forEach(point => {
      point.x -= minX
      point.y -= minY

      maxX = Math.max(point.x, maxX)
      maxY = Math.max(point.y, maxY)
    })
  })

  // Scale
  strokes.forEach(stroke => {
    stroke.forEach(point => {
      point.x *= width / maxX
      point.y *= height / maxY
    })
  })

  return strokes
}

Kanji.prototype.compareWithStrokes = function(otherStrokes, sketchpadWidth, sketchpadHeight) {
  const strokes = this.getScaledStrokes(sketchpadWidth, sketchpadHeight)
  const strokesCenter = getCenter(strokes)
  const otherStrokesCenter = getCenter(otherStrokes)
  let strokesMatched = 0
  const results = []

  let strokeDebugResults = []
  strokes.forEach((stroke, strokeIndex) => {  
    otherStrokes.forEach((otherStroke, otherStrokeIndex) => {
      let vector2D = { x: strokesCenter.x - otherStrokesCenter.x, y: strokesCenter.y - otherStrokesCenter.y }
      
      // todo - maybe not apply vector2d when only some strokes have been provided?
      vector2D = { x: 0, y: 0 }
      
      let h1 = hausdorff(strokes[strokeIndex], otherStrokes[otherStrokeIndex], vector2D)
      let h2 = hausdorff(otherStrokes[otherStrokeIndex], strokes[strokeIndex], { x: -1 * vector2D.x, y: -1 * vector2D.y })
      let accuracy = Math.max(h1, h2) * TOLERANCE_WIDTH / sketchpadWidth

      strokeDebugResults.push({
        h1,
        h2,
        accuracy
      })

      if (accuracy < TOLERANCE) {
        results[strokeIndex] = otherStrokeIndex
        strokesMatched++
      }
    })
  })

  console.log(strokeDebugResults) //eslint-disable-line

  return {
    isMatch: strokesMatched === strokes.length,
    isCorrectStrokeOrder: checkStrokeOrder(results),
    actualStrokesCount: strokes.length,
    sketchStrokesCount: otherStrokes.length
  }
}

Kanji.prototype.compareWithStrokesScaleInvariant = function(sketchStrokes, sketchpadWidth) {
  // Trim other strokes and get dimensions

  // TODO: Do something else. this is BAD
  let otherStrokes = JSON.parse(JSON.stringify(sketchStrokes))
  
  // First get top and left margins
  let minX = null
  let minY = null
  otherStrokes.forEach(stroke => {
    stroke.forEach(point => {
      minX = minX === null ? point.x : Math.min(point.x, minX)
      minY = minY === null ? point.y : Math.min(point.y, minY)
    })
  })

  // Trim and determine dimensions
  let maxX = 0
  let maxY = 0
  otherStrokes.forEach(stroke => {
    stroke.forEach(point => {
      point.x -= minX
      point.y -= minY

      maxX = Math.max(point.x, maxX)
      maxY = Math.max(point.y, maxY)
    })
  })

  // Scale actual strokes to match other strokes

  //const strokes = this.getScaledStrokes(sketchpadWidth, sketchpadHeight)

  // Get actual strokes and scale them to the dimensions of our trimmed sketch strokes
  const strokes = this.getScaledTrimmedStrokes(maxX, maxY)

  console.log(strokes, otherStrokes)//eslint-disable-line

  let strokesMatched = 0
  const results = []

  strokes.forEach((stroke, strokeIndex) => {
    otherStrokes.forEach((otherStroke, otherStrokeIndex) => {  
      let vector2D = { x: 0, y: 0 }
      
      let h1 = hausdorff(strokes[strokeIndex], otherStrokes[otherStrokeIndex], vector2D)
      let h2 = hausdorff(otherStrokes[otherStrokeIndex], strokes[strokeIndex], { x: -1 * vector2D.x, y: -1 * vector2D.y })
      let accuracy = Math.max(h1, h2) * TOLERANCE_WIDTH / sketchpadWidth

      if (accuracy < TOLERANCE) {
        results[strokeIndex] = otherStrokeIndex
        strokesMatched++
      }
    })
  })

  return {
    isMatch: strokesMatched >= strokes.length && strokes.length === otherStrokes.length,
    isCorrectStrokeOrder: checkStrokeOrder(results),
    actualStrokesCount: strokes.length,
    sketchStrokesCount: otherStrokes.length
  }
}

function getCenter(input) {
  const flattened = input.flat()
  const features = turf.featureCollection(flattened.map(p => turf.point([p.x, p.y])))
  const tr = turf.center(features)

  return {
    x: tr.geometry.coordinates[0],
    y: tr.geometry.coordinates[1]
  }
}

function checkStrokeOrder(matchedStrokes) {
  for (let i=0; i < matchedStrokes.length; i++) {
    if (matchedStrokes[i] !== i) {
      return false
    }
  }
  
  return matchedStrokes.length ? true : false
}
