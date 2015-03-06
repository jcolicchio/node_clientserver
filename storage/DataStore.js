exports.new = function(config) {
	return {
		config: config,
		// index keeps updating, auto increment row index
		index: 0,

		// params contains a list of key-value pairs
		// keys not in the schema will be ignored
		// returns an array of objects with index and row
		// if limit > 0, only return the first N items matching
		find: function(params, limit) {
			console.log("find not implemented!");
		},
		// rows is a row object
		// returns true if inserted?
		insert: function(row) {
			console.log("insert not implemented!");
		},
		// perform find and remove items
		// returns an array of objects with index and row where objects were removed
		// if limit > 0, only remove the first N items matching
		remove: function(params, limit) {
			console.log("remove not implemented!");
		},
		// for all rows returned by find(matching), update with values where keys match
		// return the same as find?
		// if limit > 0, only update the first N items matching
		update: function(matching, values, limit) {
			console.log("update not implemented!");
		}
	}
}