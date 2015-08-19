$(document).mouseup(function (e)
  {
      var container = $("#corner_popup");
  
      if (!container.is(e.target) // if the target of the click isn't the container...
          && container.has(e.target).length === 0 // ... nor a descendant of the container
          && !$("#essayBox").is(':visible')) // and if the orbis popup is already gone, or was never there in the first place
      {
          container.hide();
      }
  });