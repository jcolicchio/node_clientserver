var DataStore = ('./DataStore.js');

module.exports = function(config) {

	// config should specify where to look for mongodb,
	// how to connect to it and load existing data


	var ds = DataStore.new(config);
	ds.find = function(params) {

	}
	ds.insert = function(rows) {

	}
	ds.remove = function(params) {

	}
	ds.update = function(params, rows) {

	}
	return ds;
}