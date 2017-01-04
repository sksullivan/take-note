'use strict';

const data = require('./models').data;
const stateOperationsQueue = require('./models').stateOperationsQueue;
const modelOperationsQueue = require('./models').modelOperationsQueue;
const stateHistory = require('./models').stateHistory;

const reflowNotes = require('./helpers').reflowNotes;
const pageParams = require('./helpers').pageParams;
const noteIndex = require('./helpers').noteIndex;

const operations = require('./operations');

// Controller methods

const controller = {
  bindData: function () {
    modelOperationsQueue.splice(0,modelOperationsQueue.length);
    return rivets.bind(
      document.querySelector('#content'),
z     { data: data, controller: controller }
    );
  },
  loadNotes: function () {
    console.log("Loading notes...");
    $.get('/api/notes',function (newData) {
      console.log(newData);
      data.model.notes = newData;
      controller.bindData();
      reflowNotes(data.state.cols);
    });
  },
  syncNotes: function (callback) {
    $.ajax({
      url: '/api/notes',
      type: 'POST',
      data: JSON.stringify(modelOperationsQueue),
      dataType: 'json',
      contentType: 'application/json; charset=utf-8',
      success: function (newData, err) {
        data.model.notes = newData;
        reflowNotes(data.state.cols);
        if (callback) {
          callback();
        }
      }
    });
    modelOperationsQueue.splice(0,modelOperationsQueue.length);
  },
  deleteNote: function (e, model) {
    modelOperationsQueue.push({ type: 'delete', note: data.model.notes[noteIndex(model.index)] });
    controller.syncNotes();
  },
  newNote: function (e, model) {
    const newNote = {
      title: '',
      text: '',
      tags: []
    };
    modelOperationsQueue.push({ type: 'add', note: newNote });
    controller.syncNotes(function () {
      const newNoteEl = $('.note:last-child');
      newNoteEl.find('input').focus();
      $('html, body').animate({
        scrollTop:  $('html').height()
      }, 2000);
    });
  },
  viewGrid: function (e, model) {
    stateOperationsQueue.push(operations.setColumns(3));
    controller.syncState();
  },
  viewBook: function (e, model) {
    stateOperationsQueue.push(operations.setColumns(2));
    controller.syncState();
  },
  viewList: function (e, model) {
    stateOperationsQueue.push(operations.setColumns(1));
    controller.syncState();
  },
  updateNoteData: function (e, model) {
    if (e.target.tagName == 'INPUT') {
      data.model.notes[noteIndex(model.index)].title = e.target.value;
    } else {
      data.model.notes[noteIndex(model.index)].text = e.target.innerText;
    }
    modelOperationsQueue.push({ type: 'update', note: data.model.notes[noteIndex(model.index)] });
    controller.syncNotes();
  },
  applyTextFilterFromTag: function (e, model) {
    const filterText = data.model.notes[noteIndex(model['%note%'])].tags[model['%tag%']].title;
    stateOperationsQueue.push(operations.addFilter(filterText));
    controller.syncState();
  },
  applyTextFilterFromSearch: function (e, model) {
    if (data.state.search != '') {
      stateOperationsQueue.push(operations.addFilter(data.state.search));
      stateOperationsQueue.push(operations.clearSearch());
      controller.syncState();
    }
  },
  deleteFilter: function (e, model) {
    stateOperationsQueue.push(operations.clearFilter(model.index));
    controller.syncState();
  },
  clearSearch: function (e, model) {
    stateOperationsQueue.push(operations.clearSearch());
    controller.syncState();
  },
  clearAll: function () {
    stateOperationsQueue.push(operations.clearSearch());
    stateOperationsQueue.push(operations.clearFilters());
    controller.syncState();
  },
  addTag: function (e, model) {
    data.model.notes[noteIndex(model.index)].tags.push({ title: '' });
    modelOperationsQueue.push({ type: 'update', note: data.model.notes[noteIndex(model.index)] });

    // Janky...
    controller.syncNotes(function () {
      // NOTE: Here we DO NOT use the model reindexed for the original notes array since
      // $('.note-container') will yield ONLY displayed notes.
      const newTag = $($('.note-container')[model.index])
        .find('p')
        .last();
      newTag.attr('contenteditable','true');
      newTag.focus();
      newTag.select();
    });
  },
  updateTagData: function (e, model) {
    if (noteIndex(model['%note%']) !== undefined) {
      $(e.target).attr('contenteditable','false');
      data.model.notes[noteIndex(model['%note%'])].tags[model['%tag%']].title = e.target.innerText.replace(/\n/g,'');
      modelOperationsQueue.push({ type: 'update', note: data.model.notes[noteIndex(model['%note%'])] });
      controller.syncNotes();
    }
  },
  deleteTag: function (e, model) {
    data.model.notes[noteIndex(model['%note%'])].tags.splice(model['%tag%'],1);
    modelOperationsQueue.push({ type: 'update', note: data.model.notes[noteIndex(model['%note%'])] });
    controller.syncNotes();
  },
  keyedNote: function (e, model) {
    if (e.shiftKey) {
      if (e.keyCode == 88) {
        controller.deleteNote(e,model);
      }
    }
  },
  syncState: function () {
    const opCount = stateOperationsQueue.length;
    for (const operation of stateOperationsQueue) {
      stateHistory.push(data.state);
      data.state = operation(data.state);
    }
    reflowNotes(data.state.cols);
    console.log("Applied "+opCount+" operations.");
    stateOperationsQueue.splice(0,stateOperationsQueue.length);
    pageParams(data.state);
  },
  popState: function () {
    if (stateHistory.length > 0) {
      data.state = stateHistory.pop();
      console.log(data.state)
      reflowNotes(data.state.cols);
    } else {
      console.log("nothing to undo")
    }
  }
}

window.data = data;
module.exports = controller;
