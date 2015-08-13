window.onkeyup = function(e) {
   var key = e.keyCode ? e.keyCode : e.which;
   if (key == 27) {
    closeEssay();
   }
}

function createEssay(essayName) {
  d3.select("#essayBox").style("display", "block");
  d3.select('#essayContent').style('display','block');

  var essayPath="building.html";
    switch(essayName)
  {
    case 'home':
    essayPath="assets/intro.html"
    break;
    case 'intro':
    essayPath="assets/introducing.html"
    break;
    case 'understand':
    essayPath="assets/understanding.html"
    break;
    case 'build':
    essayPath="assets/building.html"
    break;
    case 'tutorial':
    essayPath="assets/using.html"
    break;
    case 'gallery':
    essayPath="assets/gallery.html"
    break;
    case 'scholarship':
    essayPath="assets/apply_TOC.html"
    break;
    case 'news':
    essayPath="assets/new.html"
    break;
    case 'media':
    essayPath="assets/media.html"
    break;
    case 'credits':
    essayPath="assets/credits.html"
    break;

  }
  
  d3.text(essayPath, function(data) {
    
    d3.select("#essayContent").html(data).node().scrollTop = 0;
  })
}

function closeEssay() {
  d3.select("#stickynote").transition().duration(2000).style("opacity", 1).transition().delay(3000).style("opacity", 1).transition().duration(2000).style("opacity", 0);
  d3.select('#essayBox').style('display','none');
  d3.select('#essayContent').style('display','none');
}