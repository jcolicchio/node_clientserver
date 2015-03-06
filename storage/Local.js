var DataStore = require('./DataStore.js');

module.exports = function(config) {

	var ds = DataStore.new(config);

	ds.schema = config.schema;
	ds.data = {};

	ds.find = function(params, limit) {
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
		for(i in rows) {
			var index = rows[i].index;
			var row = rows[i].row;
			for(key in values) {
				if(this.schema.indexOf(key) > -1) {
					row[key] = values[key];
				}
			}
			this.data[index] = row;
		}
		return this.find(params, limit);
	}
	return ds;
}