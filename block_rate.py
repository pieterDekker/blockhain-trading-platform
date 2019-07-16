from dateutil import parser as dtparser

with open('./node_error', 'r') as fp:
	line = fp.readline()
	line_num = 1
	mined = 0
	reached_canon = 0
	became_uncle = 0
	start_time = None
	latest_time = None
	print("reading file line by line")
	while line:
		if (line[:4] == "INFO"):
			if not start_time:
				start_time = dtparser.parse(line[6:24].replace('|', ' '))
			if line.find("mined potential block") >= 0:
				mined += 1
				latest_time = dtparser.parse(line[6:24].replace('|', ' '))
			if line.find("block reached canonical chain") >= 0:
				reached_canon += 1
				latest_time = dtparser.parse(line[6:24].replace('|', ' '))
			if line.find("block became an uncle") >= 0:
				became_uncle += 1
				latest_time = dtparser.parse(line[6:24].replace('|', ' '))
		line = fp.readline() 
		line_num += 1
	if not start_time or not latest_time:
		print("No INFO lines found, nothing happened yet?")
		exit()
	print("{} blocks mined of which {} reached the canonical chain and {} became uncles in {}".format(mined, reached_canon, became_uncle, latest_time - start_time))
	mined = max(0.00000001,mined)
	reached_canon = max(0.00000001,reached_canon)
	became_uncle = max(0.00000001,became_uncle)
	print("minerate: {}, propagation rate {}, uncle rate {}".format((latest_time - start_time)/mined, (latest_time - start_time)/reached_canon, (latest_time - start_time)/became_uncle))
