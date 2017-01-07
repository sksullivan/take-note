'use strict';

const deepToString = require('./helpers').deepToString;
const clearObjectProperties = require('./helpers').clearObjectProperties;
const data = require('./models').data;

// Custom Rivets Items

rivets.binders['add-class'] = function (el, value) {
  if (typeof value == "function") {
    value = value(this.observer.obj);
  }
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
      if (event.keyCode == 13) {
        $el.blur();
        rivetsView.observer.value()(event,rivetsView.observer.obj);
      }
    });
  },
  unbind: function (el) {
    $(el).off('keyup');
  },
  function: true
};

rivets.formatters.noteExpandWatcher = function (items, note, expandedNotes) {
  const noteIndex = data.model.notes.indexOf(note);
  const noteExpandStatus = expandedNotes[noteIndex];
  if (noteExpandStatus === undefined || noteExpandStatus == false) {
    return "";
  } else {
    return "expanded";
  }
} 

rivets.formatters.filterByFilterItems = function (items, textFilters, search) {
  const filters = textFilters.slice();
  filters.push(search);
  var numNotes = data.model.notes.length;
  
  // Clear index map
  clearObjectProperties(data.state.unfilteredNoteIndexMap);

  // If we have no filters and no search...
  if (textFilters.length == 0 && search == "") {
    // Make index array do no reindexing and stop.
    for (var i = 0; i < numNotes; i++) {
      data.state.unfilteredNoteIndexMap[i] = i;
    }
    return data.model.notes;
  }

  const filteredNoteIndices = [];
  const filteredNotes = items.filter(function (item, index) {
    const itemText = deepToString(item).toLowerCase();
    const keep = filters.map(function (filter) {
      return itemText.indexOf(filter.toLowerCase()) != -1;
    }).reduce(function (prev, curr) {
      return prev && curr;
    },true);
    if (keep) {
      filteredNoteIndices.push(index);
    }
    return keep;
  });

  for (var i = 0; i < filteredNoteIndices.length; i++) {
    data.state.unfilteredNoteIndexMap[i] = filteredNoteIndices[i]
  }

  return filteredNotes;
};
