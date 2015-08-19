$(document).mouseup(function (e)
  {
      var container = $("#corner_popup");
      console.log("click registered in mouseup");
      console.log(container);
  
      if (!container.is(e.target) // if the target of the click isn't the container...
          && container.has(e.target).length === 0 // ... nor a descendant of the container
          && !$("#essayBox").is(':visible'))
      {
          container.hide();
      }
  });