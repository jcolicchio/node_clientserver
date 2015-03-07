var DataStore = require('./DataStore.js');

module.exports = function(config) {

	var ds = DataStore.new(config);

	ds.schema = config.schema;
	ds.data = {};

	ds.find = function(params, limit) {
		for(key in params) {
			if(params[key] === undefined) {
				// TODO: handle this better
				console.log("ERROR: undefined property in params not allowed!");
				return [];
			}
		}
		if(limit === null || limit === undefined) {
			limit = 0;
		}

		var output = [];
		for(i in this.data) {
			var match = true;
			for(j in this.schema) {
				var key = this.schema[j];
				if(params[key] !== undefined) {
					if(this.data[i][key] !== params[key]) {
						match = false;
						//console.log("mismatch on "+key+": "+this.data[i][key]+" to params: "+params[key]);
						break;
					}
				}
			}
			if(match) {
				var data = {};
				for(key in this.data[i]) {
					data[key] = this.data[i][key];
				}
				output.push({index:i,row:data});
				if(limit > 0 && output.length == limit) {
					return output;
				}
			}
		}
		return output;
	}
	ds.insert = function(row) {
		for(key in row) {
			if(row[key] === undefined) {
				// TODO: handle this better
				console.log("ERROR: undefined property in row not allowed!");
				return false;
			}
		}
		var insertedRow = {};
		for(j in this.schema) {
			var key = this.schema[j];
			if(row[key] !== undefined) {
				insertedRow[key] = row[key];
			} else {
				insertedRow[key] = null;
			}
		}
		this.data[this.index++] = insertedRow;
		return true;
	}
	ds.remove = function(params, limit) {
		var rows = this.find(params, limit);
		for(i in rows) {
			var index = rows[i].index;
			delete this.data[index];
		}
		return rows;
	}
	ds.update = function(params, values, limit) {
		var rows = this.find(params, limit);
		var output = [];
		for(i in rows) {
			var index = rows[i].index;
			var row = rows[i].row;
			for(key in values) {
				if(this.schema.indexOf(key) > -1) {
					row[key] = values[key];
				}
			}
			this.data[index] = row;
			output.push({index:index, row:row});
		}
		return output;
	}
	return ds;
}