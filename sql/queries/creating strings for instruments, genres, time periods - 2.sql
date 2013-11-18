query creating table with poets, poetid, and linked instrument names

SELECT 
	sorted_poets.poetid,
	sorted_poets.poet_name,
	string_agg(instruments.instrument, ', ') as instrument_names
FROM instruments, 
	(SELECT 
		poets.poetid,
		poets.poet_name
		FROM poets
    	GROUP BY poets.poetid, poets.poet_name
    ) sorted_poets
WHERE sorted_poets.poetid = instruments.poetid
GROUP BY sorted_poets.poetid, sorted_poets.poet_name

query creating table with poets, poetid, and linked genre names

SELECT 
	sorted_poets.poetid,
	sorted_poets.poet_name,
	string_agg(genres.genre, ', ') as genre_names
FROM genres, 
	(SELECT 
		poets.poetid,
		poets.poet_name
		FROM poets
    	GROUP BY poets.poetid, poets.poet_name
    ) sorted_poets
WHERE sorted_poets.poetid = genres.poetid
GROUP BY sorted_poets.poetid, sorted_poets.poet_name

query creating table with poets, poetid, and time periods

SELECT 
	sorted_poets.poetid,
	sorted_poets.poet_name,
	string_agg(dates.date, ', ') as date_names
FROM dates, 
	(SELECT 
		poets.poetid,
		poets.poet_name
		FROM poets
    	GROUP BY poets.poetid, poets.poet_name
    ) sorted_poets
WHERE sorted_poets.poetid = dates.poetid
GROUP BY sorted_poets.poetid, sorted_poets.poet_name

big query using multiple left joins

SELECT 
	sorted_poets.poetid,
	sorted_poets.poet_name
FROM
	(SELECT 
		poets.poetid,
		poets.poet_name
		FROM poets
    	GROUP BY poets.poetid, poets.poet_name
    ) sorted_poets
    LEFT JOIN instruments
	ON sorted_poets.poetid = instruments.poetid
    LEFT JOIN genres
	ON sorted_poets.poetid = genres.poetid
    LEFT JOIN dates
	ON sorted_poets.poetid = dates.poetid

big query joining these three


SELECT
poets_instruments.poetid,
poets_instruments.poet_name,
poets_instruments.instrument_names,
poets_genres.genre_names,
poets_dates.date_names
FROM
	(SELECT 
		sorted_poets.poetid,
		sorted_poets.poet_name,
		string_agg(instruments.instrument, ', ') as instrument_names
	FROM instruments, 
		(SELECT 
			poets.poetid,
			poets.poet_name
			FROM poets
		GROUP BY poets.poetid, poets.poet_name
	    ) sorted_poets
	WHERE sorted_poets.poetid = instruments.poetid
	GROUP BY sorted_poets.poetid, sorted_poets.poet_name) poets_instruments

	
	LEFT JOIN
	(SELECT 
		sorted_poets.poetid,
		sorted_poets.poet_name,
		string_agg(genres.genre, ', ') as genre_names
	FROM genres, 
		(SELECT 
			poets.poetid,
			poets.poet_name
			FROM poets
		GROUP BY poets.poetid, poets.poet_name
	    ) sorted_poets
	WHERE sorted_poets.poetid = genres.poetid
	GROUP BY sorted_poets.poetid, sorted_poets.poet_name) poets_genres
	on poets_instruments.poetid = poets_genres.poetid
	
	LEFT JOIN
	(SELECT 
		sorted_poets.poetid,
		sorted_poets.poet_name,
		string_agg(dates.date, ', ') as date_names
	FROM dates, 
		(SELECT 
			poets.poetid,
			poets.poet_name
			FROM poets
		GROUP BY poets.poetid, poets.poet_name
	    ) sorted_poets
	WHERE sorted_poets.poetid = dates.poetid
	GROUP BY sorted_poets.poetid, sorted_poets.poet_name) poets_dates
	ON poets_instruments.poetid = poets_dates.poetid
	
revised

SELECT
poets.poetid,
poets.poet_name,
poets_instruments.instrument_names,
poets_genres.genre_names,
poets_dates.date_names
FROM
	poets
	
	LEFT OUTER JOIN

		(SELECT 
			sorted_poets.poetid,
			sorted_poets.poet_name,
			string_agg(sorted_instruments.instrument, ', ') as instrument_names
		FROM (SELECT * FROM instruments ORDER BY instrument DESC) sorted_instruments, 
			(SELECT 
				poets.poetid,
				poets.poet_name
				FROM poets
			GROUP BY poets.poetid, poets.poet_name
		    ) sorted_poets
		WHERE sorted_poets.poetid = sorted_instruments.poetid
		GROUP BY sorted_poets.poetid, sorted_poets.poet_name) poets_instruments
	ON poets.poetid = poets_instruments.poetid

	
	LEFT OUTER JOIN
	(SELECT 
		sorted_poets.poetid,
		sorted_poets.poet_name,
		string_agg(sorted_genres.genre, ', ') as genre_names
	FROM (SELECT * FROM genres ORDER BY genre DESC) sorted_genres, 
		(SELECT 
			poets.poetid,
			poets.poet_name
			FROM poets
		GROUP BY poets.poetid, poets.poet_name
	    ) sorted_poets
	WHERE sorted_poets.poetid = sorted_genres.poetid
	GROUP BY sorted_poets.poetid, sorted_poets.poet_name) poets_genres
	on poets.poetid = poets_genres.poetid
	
	LEFT OUTER JOIN
	(SELECT 
		sorted_poets.poetid,
		sorted_poets.poet_name,
		string_agg(sorted_dates.date, ', ') as date_names
	FROM (SELECT * FROM dates ORDER BY date DESC) sorted_dates, 
		(SELECT 
			poets.poetid,
			poets.poet_name
			FROM poets
		GROUP BY poets.poetid, poets.poet_name
	    ) sorted_poets
	WHERE sorted_poets.poetid = sorted_dates.poetid
	GROUP BY sorted_poets.poetid, sorted_poets.poet_name) poets_dates
	ON poets.poetid = poets_dates.poetid