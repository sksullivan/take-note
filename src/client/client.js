require('./styles/stylesheet.scss');

// Application State

const model = {
  title: 'Welcome to the notebook',
  cols: pageParams()['cols'] || 1,
  filters: [],
  search: "",
  notes: []
};

const state = {
  hiddenTags: [],
  collapsedNotes: [],
  filters: [],
  search: "",
  cols: []
};

const data = {
  model,
  state
};

var operations = [];


// Custom Rivets Items

rivets.binders['add-class'] = function(el, value) {
  if (el.addedClass) {
    $(el).removeClass(el.addedClass);
    delete el.addedClass;
  }
  if (value) {
    $(el).addClass(value);
    el.addedClass = value;
  }
}

rivets.binders['on-enter'] = {
  bind: function (el) {
    var rivetsView = this, $el = $(el);
    $el.on('keyup', function(event) {
      if(event.keyCode == 13) {
        $el.blur();
        rivetsView.observer.value()(event,rivetsView.model);
      }
    });
  },
  unbind: function (el) {
    $(el).off('keyup');
  },
  function: true
};

rivets.formatters.filterByFilterItems = function(items, textFilters, search) {
  const filters = textFilters.slice();
  filters.push(search);
  reflowNotes()
  return items.filter(function (item) {
    const itemText = deepToString(item).toLowerCase();
    return filters.map(function (filter) {
      return itemText.indexOf(filter.toLowerCase()) != -1;
    }).reduce(function (prev, curr) {
      return prev && curr;
    },true);
  });
};


// Rivets Operations

function bindData () {
  operations = [];
  return rivets.bind(
    document.querySelector('#content'),
    { data: data, controller: controller }
  );
}


// Controller methods

const controller = {
  loadNotes: function () {
    console.log("Loading notes...");
    $.get('/api/notes',function (newData) {
      console.log(newData);
      data.model.notes = newData;
      bindData();
      reflowNotes();
    });
  },
  syncNotes: function (callback) {
    $.ajax({
      url: '/api/notes',
      type: 'POST',
      data: JSON.stringify(operations),
      dataType: 'json',
      contentType: 'application/json; charset=utf-8',
      success: function (newData, err) {
        data.model.notes = newData;
        reflowNotes();
        if (callback) {
          callback();
        }
      }
    });
    operations = [];
  },
  deleteNote: function (e, model) {
    operations.push({ type: 'delete', note: data.model.notes[model.index] });
    controller.syncNotes();
  },
  newNote: function (e, model) {
    const newNote = {
      title: '',
      text: '',
      tags: []
    };
    operations.push({ type: 'add', note: newNote });
    controller.syncNotes(function () {
      const newNoteEl = $('.note:last-child');
      newNoteEl.find('input').focus();
      $('html, body').animate({
        scrollTop:  $('html').height()
      }, 2000);
    });
  },
  viewGrid: function (e, model) {
    data.state.cols = 5;
    pageParams({ "cols": data.state.cols });
    reflowNotes();
  },
  viewBook: function (e, model) {
    data.state.cols = 2;
    pageParams({ 'cols': data.state.cols });
    reflowNotes();
  },
  viewList: function (e, model) {
    data.state.cols = 1;
    pageParams({ 'cols': data.state.cols });
    reflowNotes();
  },
  updateNoteData: function (e, model) {
    if (e.target.tagName == 'INPUT') {
      data.model.notes[model.index].title = e.target.value;
    } else {
      data.model.notes[model.index].text = e.target.innerText;
    }
    operations.push({ type: 'update', note: data.model.notes[model.index] });
    controller.syncNotes();
  },
  applyTextFilterFromTag: function (e, model) {
    data.state.filters.push(data.model.notes[model['%note%']].tags[model['%tag%']].title);
    reflowNotes();
  },
  applyTextFilterFromSearch: function (e, model) {
    if (data.state.search != '') {
      data.state.filters.push(data.state.search);
      controller.clearSearch();
      reflowNotes();
    }
  },
  deleteFilter: function (e, model) {
    data.state.filters.splice(model.index,1);
    reflowNotes();
  },
  clearSearch: function (e, model) {
    $('#search').val('');
    data.state.search = '';
    reflowNotes();
  },
  clearAll: function () {
    $('#search').val('');
    data.state.search = '';
    data.state.filters = [];
    reflowNotes();
  },
  addTag: function (e, model) {
    data.model.notes[model.index].tags.push({ title: '' });
    operations.push({ type: 'update', note: data.model.notes[model.index] });
    controller.syncNotes(function () {
      const newTag = $($('.note-container')[model.index])
        .find('p')
        .last();
      newTag.attr('contenteditable','true');
      newTag.focus();
      newTag.select();
    });
  },
  updateTagData: function (e, model) {
    if (model['%note%'] !== undefined) {
      $(e.target).attr('contenteditable','false');
      data.model.notes[model['%note%']].tags[model['%tag%']].title = e.target.innerText.replace(/\n/g,'');
      operations.push({ type: 'update', note: data.model.notes[model.index] });
      controller.syncNotes();
    }
  },
  deleteTag: function (e, model) {
    data.model.notes[model['%note%']].tags.splice(model['%tag%'],1);
    operations.push({ type: 'update', note: data.model.notes[model['%note%']] });
    controller.syncNotes();
  },
  keyedNote: function (e, model) {
    if (e.shiftKey) {
      if (e.keyCode == 88) {
        controller.deleteNote(e,model);
      }
    }
  }
}


// Helper Functions

function deepToString (item) {
  return Object.keys(item).map(function (key) {
    const value = item[key];
    if (typeof value == 'string') {
      return value;
    } else if (typeof value == 'object') {
      return deepToString(value);
    } else {
      return '';
    }
  }).reduce(function (curr,next) {
    if (curr == '' || next == '') {
      return curr + next;
    } else {
      return curr + ' ' + next;
    }
  },'');
}

function pageParams (data) {
  if (data) {
    const query = Object.keys(data)
      .map(function (key) {
        return key + '=' + data[key];
      }).join('&');
    const newUrl = window.location.origin + window.location.pathname + '?' + query;
    window.history.pushState({ url: newUrl }, 'lol', newUrl);
    return;
  }
  if (window.location.href.indexOf('?') != -1) {
    return window.location.href
      .split('?')[1]
      .split('&')
      .map(function (pair) {
        return pair.split('=');
      }).reduce(function (prev, curr) {
        prev[curr[0]] = curr[1];
        return prev;
      },{});
  } else {
    return {};
  }
}

function reflowNotes () {
  setTimeout(function () {
    $('.grid').masonry('reloadItems');
    $('.note').css('width',($(window).width() - 70) / data.state.cols - 20);
    $('.grid').masonry({
      itemSelector: '.grid-item',
      columnWidth: ($(window).width() - 70) / data.state.cols
    });
  },0);
}


// Application Initialization

controller.loadNotes();

const handleKeys = function (e) {
  if (e.altKey) {
    if (e.keyCode == 78) { // N
      controller.newNote();
      e.preventDefault();
    }
    if (e.keyCode == 83) { // S
      $('#search').focus();
      $('html, body').animate({
        scrollTop: 0
      }, 2000);
      e.preventDefault();
    }
    if (e.keyCode == 67) { // C
      controller.clearAll();
      e.preventDefault();
    }
  }
  console.log(e.keyCode);
};

window.onkeydown = handleKeys;
