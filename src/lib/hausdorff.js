module.exports = hausdorff

function hausdorff(points1, points2, vector2D) {
  let h_max = Number.MIN_VALUE
  let h_min, dis

  for (var i = 0; i < points1.length; i++) {
    h_min = Number.MAX_VALUE
    for (var j = 0; j < points2.length; j++) {
      dis = euclideanDistance(points1[i].x,points1[i].y,points2[j].x+vector2D.x,points2[j].y+vector2D.y)
      if (dis < h_min) {
            h_min = dis
      } else if (dis == 0) {
        break
      }
    }
    if (h_min > h_max)
      h_max = h_min
  }
  return h_max
}

function euclideanDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2))
}
