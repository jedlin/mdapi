exports.up = function(pgm) {
	CREATE DATABASE mdjobs
	  WITH OWNER = jimedlin
		   ENCODING = 'UTF8'
		   TABLESPACE = pg_default
		   LC_COLLATE = 'en_US.UTF-8'
		   LC_CTYPE = 'en_US.UTF-8'
		   CONNECTION LIMIT = -1;

	CREATE TABLE jobs
	(
		id integer NOT NULL DEFAULT nextval('jobs_job_id_seq'::regclass),
		owner_id integer,
		owner_name character(255),
		job_name character(255),
		status character(20) DEFAULT 'not started',
		create_time timestamp without time zone DEFAULT now(),
		modified_time timestamp without time zone DEFAULT now(),
		CONSTRAINT id PRIMARY KEY (id)
	)
	WITH (
	  OIDS=FALSE
	);
	ALTER TABLE jobs
	  OWNER TO jimedlin;
	};

exports.down = function(pgm) {
	DROP TABLE jobs;
	DROP DATABASE mdjobs;
};
