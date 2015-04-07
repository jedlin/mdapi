// **********************************************************************************
//       EXAMPLE API FOR JOBS DATABASE - Jim Edlin - jim.edlin@webmond.com
// **********************************************************************************

var express = require('express')
	, app = express()
	, bodyParser = require('body-parser')
	, router = express.Router()
	, port =  process.env.PORT || 8080
	, pg = require('pg')
	, pgConnectionString = process.env.DATABASE_URL || "postgres://jimedlin:@localhost/mdjobs"
	, table = 'jobs'
	, validFields = ['owner_id', 'owner_name', 'status', 'job_name',];
	
	app.use(bodyParser.urlencoded({ extended: false }));
	
	// making direct DB queries for simplicity
	// in built-out system would add ORM and use models
	function call_pg(sql, callback) {
		pg.connect(pgConnectionString, function(err, client, done) {
			if(err) {
				callback({result: 'fail', message: 'error fetching client from pool\n' + err});
			}
			client.query(sql, function(err, result) {
				done();

				if(err) {
					callback({result: 'fail', message: 'database error\n' + err});
				} else {
					callback(result);
				}
				client.end();
			});
		});
	}
	
	function return_fail(res, reason) {
		res.json({result: 'fail', message: reason});
	}
	
	app.get('/', function(req, res) {
		res.sendFile(__dirname + '/api_description.html');
	});

	router
		.route('/jobs')

		.get(function(req, res) {
			call_pg('SELECT * from ' + table, function(result) {
				res.json(result.rows);
			});	
		})

		.post(function(req, res) {
			var id, owner_id, owner_name, job_name, status, modified_time, sql;
			if (!req.body) return res.sendStatus(400);
			owner_id = req.body.owner_id;
			owner_name = req.body.owner_name;
			job_name = req.body.job_name;
			if (!owner_id) {
				return_fail(res, 'owner_id is required');
			}
			else if (!owner_name) {
				return_fail(res, 'owner_name is required');
			}
			else if (!job_name) {
				return_fail(res, 'job_name is required');
			}
			else {
				status = req.body.status || 'created';
				modified_time = Math.floor(new Date() / 1000);
				sql = 'insert into ' + table;
				sql += ' (owner_id, owner_name, job_name, status, modified_time) ';
				sql += 'values(' + owner_id + ', \'' + owner_name + '\', \'' + job_name;
				sql += '\', \'' +  status + '\', to_timestamp(' +  modified_time + '));';

				 call_pg(sql, function(result) {		
					if (result.rowCount = 1) {
						sql = 'select lastval() as id';
						call_pg(sql, function(result) {
							res.json({result: 'success', id: result.rows[0].id});
						});
					} else {
						return_fail(res, 'insert failed');
					}
				 });
			}
		});

	router
		.route('/jobs/:job_id')

		.get(function(req, res) {
			var id, sql;
			id = req.url.substr(req.url.lastIndexOf('/') + 1);
			sql = 'select * from ' + table;
			sql += ' where id = ' + id;
			call_pg(sql, function(result) {
				if (result.rows.length) {
					res.json(result.rows);
				} else {
					return_fail(res, id + ' is not a valid job id');
				}
			});
		})

		.put(function(req, res) {
			var id, updates, fields = '', values = '', sql, modified_time;
			if (!req.body) return res.sendStatus(400);
			id = req.url.substr(req.url.lastIndexOf('/') + 1);
			updates = req.body;
			
			for (var field in updates) {
				var value;
				if (updates.hasOwnProperty(field)) {
					if (! validFields.indexOf(field)) {
						return_fail(res, field + ' is not a valid jobs field');
						return false;
					} 
					value = updates[field];
					if (! value.length) {
						return_fail(res, 'a value must be provided for ' + field);
						return false;
					}
					fields += field + ', ';
					values += '\'' + value + '\', ';
				}
				fields += 'modified_time'
				modified_time = ' to_timestamp(' +  Math.floor(new Date() / 1000) + ')'
				values += modified_time;
			}

			sql = 'update ' + table + ' set (' + fields + ') = (' + values;
			sql += ') where id = ' + id + ';';
			call_pg(sql, function(result) {		
				if (result.rowCount = 1) {
					res.json({result: 'success', message: 'record ' + id + ' updated'});
				} else {
					return_fail(res, 'update failed');
				}
		});

		})

		.delete(function(req, res) {
			var id;
			id = req.url.substr(req.url.lastIndexOf('/') + 1);
			sql = 'delete from ' + table;
			sql += ' where id = ' + id;
			call_pg(sql, function(result) {
			console.log(result);
				if (result.rows.length) {
					res.json(result.rows);
				} else {
					return_fail(res, id + ' is not a valid job id');
				}
			});

		});
	
app.use('/api', router);

app.listen(port);
console.log('Jobs API listening on port ' + port);