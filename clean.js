function highlight(lex, istr) {
	var out = [];

	for (var group in lex) {
		for (var i in lex[group]) {
			lex[group][i][0] = new RegExp(/^/.source + lex[group][i][0].source);
		}
	}

	var state_stack = [];
	var state = 'start';
	while (true) {
		var found = false;
		for (var i in lex[state]) {
			var patt = lex[state][i][0];
			var clss = lex[state][i][1];
			if (istr.match(patt)) {
				var parts = patt.exec(istr);
				var j = 0;
				var consumed = 0;
				for (var k in clss) {
					j++;
					out.push({'class': clss[k], 'str': parts[j]});
					consumed += parts[j].length;
				}
				istr = istr.substring(consumed);

				found = true;
				if (lex[state][i].length > 2) {
					var new_state = lex[state][i][2];
					if (new_state == 'pop') {
						state = state_stack.pop();
					} else {
						state_stack.push(state);
						state = new_state;
					}
				}

				break;
			}
		}
		if (!found || istr == '')
			return out;
	}
}

function highlightToHTML(lex, istr, callback) {
	var elems = highlight(lex, istr);
	var ostr = '';
	for (var i in elems) {
		var cls = elems[i]['class'];
		var str = elems[i]['str'];
		var span = '<span class="' + elems[i]['class'] + '">' +
			escapeHTML(elems[i]['str']) + '</span>';
		if (typeof callback != 'undefined') {
			ostr += callback(span, cls, str);
		} else {
			ostr += span;
		}
	}
	return ostr;
}

function highlightFunction(func, callback) {
	return highlightToHTML({
		start: [
			[/(\s+)/,        ['whitespace']],
			[/(.*)(::)/,     ['funcname', 'punctuation'], 'type'],
			[/(\S+)/,        ['funcname']]
		],
		type: [
			[/(\s+)/,        ['whitespace']],
			[/([a-z][a-zA-Z]*)/, ['typevar']],
			[/([A-Z]\w*)/,   ['type']],
			[/(\|)/,         ['punctuation'], 'context'],
			[/(\W+)/,        ['punctuation']]
		],
		context: [
			[/(\s+)/,        ['whitespace']],
			[/(,)/,          ['punctuation']],
			[/(\S+)(,)/,     ['classname', 'punctuation']],
			[/(\S+)/,        ['classname'], 'contextType']
		],
		contextType: [
			[/(\s+)/,        ['whitespace']],
			[/([,&])/,       ['punctuation'], 'context'],
			[/([^\s,]+)/,    ['typevar']]
		]
	}, func, callback);
}

function highlightTypeDef(type, callback) {
	return highlightToHTML({
		start: [
			[/(::)/,         ['punctuation'], 'name']
		],
		name: [
			[/(\s+)/,        ['whitespace']],
			[/(\*)/,         ['punctuation']],
			[/([A-Z][\w`]*)/, ['type'], 'vars'],
			[/([~@#\$%\^\?!\+\-\*<>\\\/\|&=:]+)/, ['type'], 'vars']
		],
		vars: [
			[/(\s+)/,        ['whitespace']],
			[/([a-z][\w`]*)/, ['typevar']],
			[/(\(?:==)/,     ['punctuation'], 'synonym'],
			[/(=)/,          ['punctuation'], 'lhs']
		],
		synonym: [
			[/(\s+)/,        ['whitespace']],
			[/([a-z][a-zA-Z]*)/, ['typevar']],
			[/([A-Z]\w*)/,   ['type']],
			[/(\W)/,         ['punctuation']]
		],
		lhs: [
			[/(\s*)(E)(\.)/, ['whitespace', 'existential', 'punctuation'], 'lhsexi'],
			[/(\s*)(\{)/,    ['whitespace', 'punctuation'], 'record'],
			[/(\s*)/,        ['whitespace'], 'conses']
		],
		lhsexi: [
			[/(\s+)/,        ['whitespace']],
			[/([a-z][\w`]*)/, ['typevar']],
			[/(:)/,          ['punctuation'], 'lhs']
		],
		record: [
			[/(\s+)/,        ['whitespace']],
			[/([_a-z][\w`]*)(\s+)(::)/,
			                 ['field', 'whitespace', 'punctuation'],
			                 'fieldtype'],
			[/(\})/,         ['punctuation']]
		],
		fieldtype: [
			[/(\s+)/,        ['whitespace']],
			[/([a-z][a-zA-Z]*)/, ['typevar']],
			[/([A-Z]\w*)/,   ['type']],
			[/(\()/,         ['punctuation'], 'tuple'],
			[/([\[\{])/,     ['punctuation'], 'fieldtype'],
			[/([\]\},])/,    ['punctuation'], 'pop'],
			[/(\W)/,         ['punctuation']]
		],
		tuple: [
			[/(\s+)/,        ['whitespace']],
			[/([a-z][a-zA-Z]*)/, ['typevar']],
			[/([A-Z]\w*)/,   ['type']],
			[/([\(\[\{])/,   ['punctuation'], 'tuple'],
			[/([\)\]\}])/,   ['punctuation'], 'pop'],
			[/(\W)/,         ['punctuation']]
		],
		conses: [
			[/(\s+)/,        ['whitespace']],
			[/(E)(\.)/,      ['existential', 'punctuation'], 'consexi'],
			[/([_A-Z][\w`]*)/, ['constructor'], 'consargs'],
			[/([~@#\$%\^\?!\+\-\*<>\\\/\|&=:]+)/, ['constructor'], 'consargs'],
			[/(\.\.)/,       ['punctuation']]
		],
		consexi: [
			[/(\s+)/,        ['whitespace']],
			[/([a-z][\w`]*)/, ['typevar']],
			[/(:)/,          ['punctuation'], 'conses']
		],
		consargs: [
			[/(\s+)/,        ['whitespace']],
			[/([a-z][\w`]*)/, ['typevar']],
			[/([A-Z]\w*)/,   ['type']],
			[/(\|)/,         ['punctuation'], 'conses'],
			[/(\W)/,         ['punctuation']]
		]
	}, type, callback);
}

function escapeHTML(unsafe) {
	var map = { "&": "&amp;", "<": "&lt;", ">": "&gt;",
		'"': '&quot;', "'": '&#39;', "/": '&#x2F;' };
	return String(unsafe).replace(/[&<>"'\/]/g, function(s){return map[s];});
}
