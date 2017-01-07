'use strict';

// Operations

const operations = {
  setColumns: function (cols) {
    return function (state) {
      const newState = JSON.parse(JSON.stringify(state));
      newState.cols = cols;
      return newState;
    }
  },
  addFilter: function (filterText) {
    return function (state) {
      const newState = JSON.parse(JSON.stringify(state));
      newState.filters.push(filterText);
      return newState;
    }
  },
  clearFilters: function () {
    return function (state) {
      const newState = JSON.parse(JSON.stringify(state));
      newState.filters.splice(0,newState.filters.length);
      return newState;
    }
  },
  clearSearch: function () {
    return function (state) {
      const newState = JSON.parse(JSON.stringify(state));
      newState.search = "";
      return newState;
    }
  },
  clearFilter: function (filterIndex) {
    return function (state) {
      const newState = JSON.parse(JSON.stringify(state));
      newState.filters.splice(filterIndex,1);
      return newState;
    }
  },
  toggleExpand: function (noteIndex) {
    return function (state) {
      const newState = JSON.parse(JSON.stringify(state));
      const noteExpandStatus = newState.expandedNotes[noteIndex]; 
      newState.expandedNotes[noteIndex] = !noteExpandStatus;
      return newState;
    }
  }, 
}

module.exports = operations;
