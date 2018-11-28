
function getDocHeight(Di) {
    var D = Di[0];

    if (Di.find('body').css('overflow') === 'hidden') {
        return Math.max(
            D.documentElement.offsetHeight,
            D.documentElement.clientHeight
        );

    } else {
        return Math.max(
            Math.max(D.body.scrollHeight, D.documentElement.scrollHeight),
            Math.max(D.body.offsetHeight, D.documentElement.offsetHeight),
            Math.max(D.body.clientHeight, D.documentElement.clientHeight)
        );
    }
}

var lastWidths = { };

function size_this(div, reset) {
    // Check if the widget has a <body> already. If not, we need to wait
    // a bit

    var Di = $(div).find('iframe').contents();
    var D = Di[0];

    if (!div.id) {
        // Do nothing if the div is not there at all

    } else if (!D || !D.body || !Di.is('visible')) {
        setTimeout(function() { size_this(div, reset); }, 100);

    } else {
        // Check if the width of the iframe is different. If not, then
        // we don't need to do anything.
        var rcid = div.id;
        var width = $(div).find('iframe').width();
        if (reset || !(rcid in lastWidths) || (lastWidths[rcid] != width)) {
            var h = getDocHeight(Di);
            $(div).find('iframe').height(h);
            $(div).find('iframe').attr('height', h);
        }
        lastWidths[rcid] = width;
    }
}

function resize_all(reset) {
    var widgets = $('.rcloud-htmlwidget-content');
    $.map(
        widgets,
        function(w) {
            setTimeout(function() { size_this(w, reset) }, 200);
        }
    );

    return widgets.length;
}

var hooks = false;

function add_hooks() {
    if (!hooks) {
        hooks = true;
        window.addEventListener('resize', resize_all, true);
    }
}


// Schedules execution of a function within cell result processing loop to ensure that any UI element referenes used in the function
// were added to the result pane.
function executeInCellResultProcessingQueue(context_id, fun) {
  RCloud.session.invoke_context_callback('function_call', context_id, fun);
}

// The resizer is mainly for mini.html, but might be handy for
// notebook as well, if some widgets resize very slowly.

var lastWidth = window.innerWidth;

$(document).ready(function() {
    add_hooks();
    function resizer(reset) {
        var num_widgets = resize_all(reset);
        var interval = 200;
        if (num_widgets > 0) {
            setTimeout(resizer, 5000);
        } else {
            setTimeout(function() { resizer(true) }, interval);
        }
    }
    resizer(lastWidth < window.innerWidth);
    lastWidth = window.innerWidth;
});

function handleError(err, k) {
  if(err.name) {
    k({type: err.name, message: err.message}, null);
  } else {
    k({type: 'error', message: err}, null);
  }
}

(function() {
    return {
        create: function(context_id, div, html, k) {
          try {
            executeInCellResultProcessingQueue(context_id, 
            function(result_div) {
              try {
                $(div).html(html);
            
                setTimeout(function() { size_this($(div), true); }, 100);
                k(null, div);
              } catch(err) {
                handleError(err, k);
              }
            });
          } catch (err) {
            handleError(err, k);
          }
        }
    };
})()
