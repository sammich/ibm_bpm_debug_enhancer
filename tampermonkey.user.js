// ==UserScript==
// @name       IBM BPM Debug Enhancer
// @namespace  com.sammich.debugEnhancer
// @version    0.5
// @description  Make the debugger something better than horrible.
// @match      */teamworks/process.lsw*
// @match      */teamworks/ajaxCoach*
// @match      */teamworks/debug.lsw*
// ==/UserScript==

var serviceName, serviceType, serviceElementName;
var pinnedElement;

var xmlValues = {};

/*
 * We're going to store values into GM
 * They will be keyed to the applicationInstanceId and zComponentId
 */

GM_getValue
GM_setValue
GM_listValues
GM_deleteValue

/*
 * variables I can key against
 * 
 * applicationInstanceId
 * zComponentId
 * Service Name
 * 
 * 
 */

var debugSession = document.getElementsByTagName('form')[0];
console.log(debugSession.applicationInstanceId.value);
console.log(debugSession.zComponentId.value);

/*
each(document.querySelectorAll('tr[id]'), function() {
 	xmlValues[this.id] = this.querySelector('pre').innerHTML;
});
*/

/*
 *  General purpose functions. These were written for the latest Chrome releases. I haven't tested these anywhere else.
 */ 

function removeElements(els) {
    for (var i = 0; i < els.length; i++) {
        els[i].parentNode.removeChild(els[i]);
    }
}

// http://www.quirksmode.org/js/findpos.html
function findPos(obj) {
    if (!obj) return null;
    
	var curleft = curtop = 0;
    if (obj.offsetParent) {
        do {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
       } while (obj = obj.offsetParent);
 	   return [curleft,curtop];
	}
}

function elementIndex(el) {
    var index = 0;
    while (el.previousElementSibling) {
        el = el.previousElementSibling;
        ++index;
    }
    return index;
}

function closest(el, selector) {
    if (!el) return null;
    do {
        if (el.parentNode && el.parentNode.webkitMatchesSelector(selector))
            return el.parentNode;
        el = el.parentNode;
    } while (el);
    return null;
}

function each(list, func) {
    for (var i = 0; i < list.length; i++) {
        func.apply(list[i], [i]);
    }
}

function addRadioPinButtons() {
    var pinnedVar = GM_getValue('pinnedVar')
    each(document.querySelectorAll('.table'), function() {
        each(this.getElementsByTagName('tr'), function(i) {
            var firstCell = this.querySelector('td, th');
            
            if (i === 0) {
                firstCell.setAttribute('colspan','4');
            } else if (i === 1) {
                var radioCell = document.createElement('th');
                radioCell.classList.add('debugtitle');
            } else {
                var radioCell = document.createElement('td');
                var rowIndex = elementIndex(this) - 1; // subtract 1 to match id suffix on the row
                var id = this.id.replace(rowIndex+'', '');
                
                radioCell.innerHTML = '<input type="radio" name="pinnedVariable" value="' + id + '" ' + ((id === pinnedVar) ? 'checked' : '') + '>';
            }
            
            if (radioCell) {
            	this.insertBefore(radioCell, firstCell);
            }
            if (id === pinnedVar) {
                pinnedElement = radioCell;
                closest(pinnedElement, 'tr').classList.add('pinned');
            }
        });
    });
    
    onEvent(document.body, 'change', 'input', function(e) {
        GM_setValue('pinnedVar', this.value);
        
        if (pinnedElement) 
        	closest(pinnedElement, 'tr').classList.remove('pinned');
        
        pinnedElement = this;
        
        closest(pinnedElement, 'tr').classList.add('pinned');
    });
}

function onEvent(el, event, selector, func) {
    el.addEventListener(event, function(e) {
        if (e.target.webkitMatchesSelector(selector)) {
            func.apply(e.target, [e]);
        }
    });
}

function addNamespaceCollapser() {
    var systemNS = document.querySelectorAll('tr:first-child .debugtitle')[1];
    systemNS.onclick = function() {
    	closest(this, 'table').classList.toggle('hideNamespace');
    };
    systemNS.click();
}

/*
 * BPM escapes a lot of stuff in strings so they display 'invisibles'
 * This will add a click toggle to switch these on and off ONLY for strings
 */ 
function addTextConverters() {
    each(document.querySelectorAll('tr[id]'), function() {
 		var cells = this.querySelectorAll('td');
        
        if (cells[1].textContent === 'String' && cells[2].querySelector('pre').textContent.length) {
            
            // we're not going to add this 
            
            cells[2].querySelector('pre').onclick = function() {
                // find out which mode we're in
                // default is the way BPM loads it up
                // falsey is not yet set (first click)
                // anything else is really 'the other mode'
                var mode = 'default';
                var content = '';
                if (this.contentMode) {
                    mode = this.contentMode;
                    
                    // now we flip it
                    mode = (mode === 'default') ? 'clean' : 'default';
                    this.contentMode = mode;
                } else {
                    var content = this.textContent;
                 	this.originalContent = content;
                    
                    content = cleanupEscapedText(content);
                    this.cleanedContent = content;
                    
                    this.contentMode = 'clean';
                }
                
                content = (this.contentMode === 'default') ? this.originalContent : this.cleanedContent;
                this.innerHTML = content;
            };
        }
	});
}

function stylizePage() {
    
    // get the variable tables
    each(document.querySelectorAll('.coach_header table[width]'), function() {
        this.classList.add('table', 'table-condensed', 'table-hover-off', 'table-bordered');
        
        // add in missing td
        each(this.querySelectorAll('tr'), function(el) {
            if (this.querySelectorAll('td').length === 2) {
                this.appendChild(document.createElement('td'));
            }
        });
    });
    
    // turn cells that are rightfully headers into actual headers
    each(document.querySelectorAll('.debugtitle'), function() {
        this.outerHTML = this.outerHTML.replace('<td', '<th');
    });
}

function prepareHeader() {
	
    // create a bootstrap fixed navbar
    var nav = document.createElement('div');
    nav.innerHTML = '<nav class="navbar navbar-default navbar-fixed-top" role="navigation"><div class="container-fluid"><div class="navbar-header"><button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#debug_control"><span class="sr-only">Toggle navigation</span><span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span></button><a class="navbar-brand" id="debug_title" href="#"></a></div><div class="collapse navbar-collapse" id="debug_control"><div class="navbar-form navbar-right" role="search"></div></div></div></nav>';
	document.getElementById('content').appendChild(nav);
    
    // we're going to reposition the buttons
    var controls = document.getElementsByClassName('heading')[0];
	
	// we're going to extract the controls, rebuild that input
	var buttons = controls.querySelectorAll('input[type=submit]');
	var check = controls.querySelector('input[type=checkbox]');
	
	// add an id for the checkbox so that it works with label
	check.id = 'chk_show_line_breaks';
	var labelCheck = document.createElement('label');
	labelCheck.setAttribute('for', check.id);
	labelCheck.appendChild(document.createTextNode('Show Line Breaks?'));
	
	newControls = document.getElementById('debug_control').childNodes[0];
    newControls.appendChild(labelCheck);
	newControls.appendChild(check);
    
    each(controls.querySelectorAll('input[type=submit]'), function() {
		this.setAttribute('style', '');
        this.classList.add('btn', 'btn-default');
		newControls.appendChild(this);	
	});
    
    var serviceTable = document.querySelector('.coach_header > table:first-child td');
    
    var cells = serviceTable.querySelectorAll('table td:not(.lbl)');
    // 0 is the service name
    // 1 is diagram element (process item) type
    // 2 is the name of the process element
    
	serviceName = cells[0].textContent;
	serviceType = cells[1].textContent;
	serviceElementName = cells[2].textContent;
	
    var debugTitle = serviceName + ' - ' + serviceElementName + ((serviceType) ? ' (' + serviceType + ')' : '');
	var header = document.createElement('span');
	header.appendChild(document.createTextNode(debugTitle));
	
	document.getElementById('debug_title').appendChild(header);
}

function addCSS() {
    
    // sorry about this, but I don't think there's another way to get it done in Greasemonkey.
    
    var css = 'body { padding-top:45px; } h1 { display:none; } table { border-spacing:0;border-collapse:collapse; } table[width="99%"] { width:100%;margin-top:1em; }';
    css += '.coach_header table:first-child table tr { display: inline-block; }.coach_header table:first-child table td:first-child { font-weight: bold; }';
    css += '.coach_header > table:first-child { display:none; }.pull-right { float:right; } pre { background-color: #fafafa;border: 1px solid #ddd; }';
    css += '.heading { position:fixed;top:0;left:-3px;width:100%; } pre:empty { display:none; }';
    css += '#debug_control input { margin-right:5px; } tr:first-child .debugtitle { color:white;background-color:#38c !important; } tr:nth-child(2) .debugtitle { background-color:#eee !important; } ';
    css += 'table.hideNamespace tbody tr:not(:first-child) { display: none; }';
    css += '.pinned td { background-color:pink; }';
    
    css = document.createTextNode(css);
    var style = document.createElement('style');
	style.appendChild(css);
    
    document.querySelector('head').appendChild(style); 
}

function init() {
	var css = document.querySelectorAll('head link');
	removeElements(css);
    
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.type = 'text/css';
    css.href = '//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css';
    
    document.querySelector('head').appendChild(css);; 
    
    // remove bgcolor attrs
    each(document.getElementsByTagName('tr'), function() {
	    this.setAttribute('bgcolor', '');
	});
    
    addCSS();
	stylizePage();
	prepareHeader();
    addTextConverters();
    addNamespaceCollapser();
    
    addRadioPinButtons();
    
    // scroll into view the pinnedElement
    
    if (pinnedElement) {
    	var pos = findPos(closest(pinnedElement, 'tr'));
	    
	    setTimeout(function() {
			window.scrollTo(0, pos[1]-110);
	    }, 10);
    }
}

(function() {
    init();
})();


function cleanupEscapedText(text) {
	return text.replace(/\\n/g, '\n')
		   .replace(/&apos;/g, '\'')
		   .replace(/&quot;/g, '"')
		   .replace(/\\t/g, '\t')
		   .replace(/&lt;/g, '<')
		   .replace(/&gt;/g, '>')
		   .replace(/&amp;lt;/g, '<')
		   .replace(/&amp;gt;/g, '>')
		   .replace(/&amp;quot;/g, '"');
}
